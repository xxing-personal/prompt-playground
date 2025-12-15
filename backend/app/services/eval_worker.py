import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import get_settings
from app.models import EvalRun, EvalResult, DatasetItem, PromptVersion
from app.services.template_service import TemplateService
from app.services.llm_service import LLMService
from app.services.evaluators import EvaluatorRegistry

settings = get_settings()
logger = logging.getLogger(__name__)


class EvalWorker:
    """Background worker for processing evaluation runs."""
    
    def __init__(self, concurrency: int = None):
        self.concurrency = concurrency or settings.eval_concurrency_limit
        self.semaphore = asyncio.Semaphore(self.concurrency)
        self.engine = create_async_engine(settings.database_url, pool_pre_ping=True)
        self.session_factory = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
    
    async def get_pending_run(self) -> EvalRun | None:
        """Get the next pending evaluation run."""
        async with self.session_factory() as session:
            query = (
                select(EvalRun)
                .where(EvalRun.status == "pending")
                .order_by(EvalRun.created_at)
                .limit(1)
                .with_for_update(skip_locked=True)
            )
            result = await session.execute(query)
            run = result.scalar_one_or_none()
            
            if run:
                run.status = "running"
                run.started_at = datetime.now(timezone.utc)
                await session.commit()
                await session.refresh(run)
            
            return run
    
    async def process_single_item(
        self,
        run: EvalRun,
        item: DatasetItem,
        model_config: Dict[str, Any],
        prompt_version: PromptVersion,
        assertions: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Process a single dataset item with a single model."""
        async with self.semaphore:
            # Compile template
            compile_result = TemplateService.dry_run(
                template_type=prompt_version.type,
                template_text=prompt_version.template_text,
                template_messages=prompt_version.template_messages,
                variables=item.input,
            )
            
            if not compile_result["is_valid"]:
                return {
                    "dataset_item_id": item.id,
                    "model_id": model_config.get("id", model_config.get("model", "unknown")),
                    "model_config": model_config,
                    "request": {"variables": item.input, "missing": compile_result["missing_variables"]},
                    "output": None,
                    "grading": {"pass": False, "score": 0.0, "reason": f"Missing variables: {compile_result['missing_variables']}", "assertions": []},
                    "metrics": {"latency_ms": 0, "tokens": {}, "cost_usd": None, "error": "Missing variables"},
                }
            
            # Prepare messages
            if prompt_version.type == "chat":
                messages = compile_result["compiled_messages"]
            else:
                messages = [{"role": "user", "content": compile_result["compiled_text"]}]
            
            # Get model parameters
            model = model_config.get("model", settings.default_model)
            temperature = model_config.get("temperature", 0.7)
            max_tokens = model_config.get("max_tokens", 1024)
            top_p = model_config.get("top_p", 1.0)
            
            # Call LLM with retries
            response = None
            retries = 0
            max_retries = settings.eval_max_retries
            
            while retries <= max_retries:
                response = await LLMService.generate_completion(
                    messages=messages,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    top_p=top_p,
                )
                
                if response.error is None:
                    break
                
                retries += 1
                if retries <= max_retries:
                    await asyncio.sleep(2 ** retries)  # Exponential backoff
            
            # Run assertions
            grading = EvaluatorRegistry.run_assertions(
                output=response.output,
                expected=item.expected_output,
                assertions=assertions,
            )
            
            return {
                "dataset_item_id": item.id,
                "model_id": model_config.get("id", model_config.get("model", "unknown")),
                "model_config": model_config,
                "request": {
                    "compiled_prompt": compile_result.get("compiled_text"),
                    "compiled_messages": compile_result.get("compiled_messages"),
                    "variables": item.input,
                },
                "output": response.output,
                "grading": grading,
                "metrics": {
                    "latency_ms": response.latency_ms,
                    "tokens": response.tokens,
                    "cost_usd": response.cost_usd,
                    "retries": retries,
                    "error": response.error,
                },
            }
    
    async def process_run(self, run: EvalRun):
        """Process a complete evaluation run."""
        async with self.session_factory() as session:
            try:
                # Load prompt version
                prompt_version = await session.get(PromptVersion, run.prompt_version_id)
                if not prompt_version:
                    raise ValueError("Prompt version not found")
                
                # Load dataset items
                items_query = select(DatasetItem).where(DatasetItem.dataset_id == run.dataset_id)
                items_result = await session.execute(items_query)
                items = items_result.scalars().all()
                
                if not items:
                    raise ValueError("No dataset items found")
                
                # Get models and assertions
                models = run.models or []
                assertions = run.assertions or []
                
                # Calculate total tasks
                total_tasks = len(items) * len(models)
                completed = 0
                failed = 0
                
                # Update progress
                run.progress = {"total": total_tasks, "completed": 0, "failed": 0, "percent": 0}
                await session.commit()
                
                # Process all items with all models
                tasks = []
                for item in items:
                    for model_config in models:
                        tasks.append(
                            self.process_single_item(run, item, model_config, prompt_version, assertions)
                        )
                
                # Run tasks with concurrency limit
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Save results
                for result in results:
                    if isinstance(result, Exception):
                        failed += 1
                        logger.error(f"Task failed: {result}")
                        continue
                    
                    completed += 1
                    if result["grading"]["pass"] is False:
                        failed += 1
                    
                    # Create eval result
                    eval_result = EvalResult(
                        eval_run_id=run.id,
                        dataset_item_id=result["dataset_item_id"],
                        model_id=result["model_id"],
                        model_config=result["model_config"],
                        request=result["request"],
                        output=result["output"],
                        grading=result["grading"],
                        metrics=result["metrics"],
                    )
                    session.add(eval_result)
                
                # Update run status
                run.status = "completed"
                run.completed_at = datetime.now(timezone.utc)
                run.progress = {
                    "total": total_tasks,
                    "completed": completed,
                    "failed": failed,
                    "percent": 100,
                }
                
                # Calculate summary
                all_results = [r for r in results if not isinstance(r, Exception)]
                if all_results:
                    pass_count = sum(1 for r in all_results if r["grading"]["pass"])
                    avg_score = sum(r["grading"]["score"] for r in all_results) / len(all_results)
                    total_latency = sum(r["metrics"]["latency_ms"] for r in all_results)
                    total_cost = sum(r["metrics"].get("cost_usd") or 0 for r in all_results)
                    
                    run.summary = {
                        "total": len(all_results),
                        "passed": pass_count,
                        "failed": len(all_results) - pass_count,
                        "pass_rate": pass_count / len(all_results),
                        "avg_score": avg_score,
                        "total_latency_ms": total_latency,
                        "avg_latency_ms": total_latency / len(all_results),
                        "total_cost_usd": total_cost,
                    }
                
                await session.commit()
                logger.info(f"Completed eval run {run.id}")
                
            except Exception as e:
                logger.error(f"Eval run {run.id} failed: {e}")
                run.status = "failed"
                run.error_message = str(e)
                run.completed_at = datetime.now(timezone.utc)
                await session.commit()
    
    async def run_forever(self, poll_interval: float = 5.0):
        """Run the worker forever, polling for new runs."""
        logger.info(f"Starting eval worker with concurrency={self.concurrency}")
        
        while True:
            try:
                run = await self.get_pending_run()
                if run:
                    logger.info(f"Processing eval run {run.id}")
                    await self.process_run(run)
                else:
                    await asyncio.sleep(poll_interval)
            except Exception as e:
                logger.error(f"Worker error: {e}")
                await asyncio.sleep(poll_interval)


async def main():
    """Entry point for running the worker."""
    logging.basicConfig(level=logging.INFO)
    worker = EvalWorker()
    await worker.run_forever()


if __name__ == "__main__":
    asyncio.run(main())
