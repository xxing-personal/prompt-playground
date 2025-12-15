from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import json
from datetime import datetime

from app.core.database import get_db
from app.models import EvalRun, EvalResult, DatasetItem, PromptVersion, Prompt

router = APIRouter(tags=["exports"])


@router.get("/eval-runs/{run_id}/export.json")
async def export_json(run_id: UUID, db: AsyncSession = Depends(get_db)):
    """Export evaluation run results as JSON."""
    run = await db.get(EvalRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Eval run not found")

    # Load results
    results_query = select(EvalResult).where(EvalResult.eval_run_id == run_id)
    results_result = await db.execute(results_query)
    results = results_result.scalars().all()

    # Load dataset items
    item_ids = list({r.dataset_item_id for r in results})
    items = {}
    if item_ids:
        items_result = await db.execute(select(DatasetItem).where(DatasetItem.id.in_(item_ids)))
        for item in items_result.scalars().all():
            items[item.id] = item

    # Load prompt version
    version = await db.get(PromptVersion, run.prompt_version_id)
    prompt = await db.get(Prompt, version.prompt_id) if version else None

    export_data = {
        "eval_run": {
            "id": str(run.id),
            "name": run.name,
            "status": run.status,
            "created_at": run.created_at.isoformat() if run.created_at else None,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            "summary": run.summary,
        },
        "prompt": {
            "id": str(prompt.id) if prompt else None,
            "name": prompt.name if prompt else None,
            "version": version.version_number if version else None,
            "type": version.type if version else None,
            "template_text": version.template_text if version else None,
            "template_messages": version.template_messages if version else None,
        },
        "models": run.models,
        "assertions": run.assertions,
        "results": [
            {
                "id": str(r.id),
                "model_id": r.model_id,
                "input": items[r.dataset_item_id].input if r.dataset_item_id in items else {},
                "expected_output": items[r.dataset_item_id].expected_output if r.dataset_item_id in items else None,
                "output": r.output,
                "grading": r.grading,
                "metrics": r.metrics,
            }
            for r in results
        ],
    }

    return Response(
        content=json.dumps(export_data, indent=2, default=str),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=eval-run-{run_id}.json"}
    )


@router.get("/eval-runs/{run_id}/export.md")
async def export_markdown(run_id: UUID, db: AsyncSession = Depends(get_db)):
    """Export evaluation run results as Markdown."""
    run = await db.get(EvalRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Eval run not found")

    # Load results
    results_query = select(EvalResult).where(EvalResult.eval_run_id == run_id)
    results_result = await db.execute(results_query)
    results = results_result.scalars().all()

    # Load dataset items
    item_ids = list({r.dataset_item_id for r in results})
    items = {}
    if item_ids:
        items_result = await db.execute(select(DatasetItem).where(DatasetItem.id.in_(item_ids)))
        for item in items_result.scalars().all():
            items[item.id] = item

    # Load prompt version
    version = await db.get(PromptVersion, run.prompt_version_id)
    prompt = await db.get(Prompt, version.prompt_id) if version else None

    # Build markdown
    md = []
    md.append(f"# Evaluation Report: {run.name or 'Unnamed Run'}")
    md.append("")
    md.append(f"**Run ID:** `{run.id}`")
    md.append(f"**Status:** {run.status}")
    md.append(f"**Created:** {run.created_at.isoformat() if run.created_at else 'N/A'}")
    md.append(f"**Completed:** {run.completed_at.isoformat() if run.completed_at else 'N/A'}")
    md.append("")

    if prompt and version:
        md.append("## Prompt")
        md.append(f"**Name:** {prompt.name}")
        md.append(f"**Version:** {version.version_number}")
        md.append(f"**Type:** {version.type}")
        md.append("")
        if version.template_text:
            md.append("```")
            md.append(version.template_text)
            md.append("```")
            md.append("")

    if run.summary:
        md.append("## Summary")
        md.append("")
        md.append("| Metric | Value |")
        md.append("|--------|-------|")
        md.append(f"| Total | {run.summary.get('total', 0)} |")
        md.append(f"| Passed | {run.summary.get('passed', 0)} |")
        md.append(f"| Failed | {run.summary.get('failed', 0)} |")
        md.append(f"| Pass Rate | {run.summary.get('pass_rate', 0):.1%} |")
        md.append(f"| Avg Score | {run.summary.get('avg_score', 0):.2f} |")
        md.append(f"| Avg Latency | {run.summary.get('avg_latency_ms', 0):.0f}ms |")
        md.append(f"| Total Cost | ${run.summary.get('total_cost_usd', 0):.4f} |")
        md.append("")

    md.append("## Models")
    md.append("")
    for model in run.models or []:
        md.append(f"- **{model.get('id', 'unknown')}**: {model.get('model', 'N/A')} (temp={model.get('temperature', 0.7)})")
    md.append("")

    md.append("## Results")
    md.append("")

    # Group results by dataset item
    by_item = {}
    for r in results:
        if r.dataset_item_id not in by_item:
            by_item[r.dataset_item_id] = []
        by_item[r.dataset_item_id].append(r)

    for item_id, item_results in by_item.items():
        item = items.get(item_id)
        md.append(f"### Item: `{str(item_id)[:8]}...`")
        md.append("")
        if item:
            md.append(f"**Input:** `{json.dumps(item.input, default=str)[:200]}...`")
            if item.expected_output:
                md.append(f"**Expected:** `{str(item.expected_output)[:200]}...`")
        md.append("")

        for r in item_results:
            status = "✅" if r.grading.get("pass") else "❌"
            md.append(f"#### {status} {r.model_id}")
            md.append("")
            md.append(f"**Score:** {r.grading.get('score', 0):.2f}")
            md.append(f"**Latency:** {r.metrics.get('latency_ms', 0):.0f}ms")
            md.append("")
            md.append("**Output:**")
            md.append("```")
            md.append(r.output[:500] if r.output else "N/A")
            md.append("```")
            md.append("")

    return Response(
        content="\n".join(md),
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=eval-run-{run_id}.md"}
    )
