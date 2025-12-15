import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import litellm
from app.core.config import get_settings

settings = get_settings()

# Configure litellm
litellm.set_verbose = settings.debug


@dataclass
class LLMResponse:
    """Response from LLM call."""
    output: str
    model: str
    provider: str
    latency_ms: float
    tokens: Dict[str, int]  # {prompt, completion, total}
    cost_usd: Optional[float]
    error: Optional[str] = None


class LLMService:
    """Service for interacting with LLM providers via litellm."""
    
    # Model to provider mapping
    PROVIDER_MAP = {
        "gpt-4o": "openai",
        "gpt-4o-mini": "openai",
        "gpt-4-turbo": "openai",
        "gpt-3.5-turbo": "openai",
        "anthropic/claude-3-5-sonnet-20241022": "anthropic",
        "anthropic/claude-3-opus-20240229": "anthropic",
        "anthropic/claude-3-sonnet-20240229": "anthropic",
        "anthropic/claude-3-haiku-20240307": "anthropic",
    }
    
    @classmethod
    def get_provider(cls, model: str) -> str:
        """Get the provider for a model."""
        # Check if model has provider prefix (e.g., "openai/gpt-4o", "anthropic/claude-...")
        if model.startswith("openai/"):
            return "openai"
        if model.startswith("anthropic/"):
            return "anthropic"
        if model.startswith("gemini/"):
            return "google"
        return cls.PROVIDER_MAP.get(model, "openai")
    
    @classmethod
    async def generate_completion(
        cls,
        messages: List[Dict[str, str]],
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        top_p: float = 1.0,
        reasoning_effort: str = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate a completion from the LLM.
        
        Args:
            messages: List of chat messages [{role, content}]
            model: Model name
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            top_p: Top-p sampling parameter
            reasoning_effort: Effort level for reasoning models ("low", "medium", "high", "minimal")
        
        Returns:
            LLMResponse with output and metrics
        """
        model = model or settings.default_model
        provider = cls.get_provider(model)
        
        start_time = time.time()
        error = None
        output = ""
        tokens = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        cost_usd = None
        
        try:
            # Build completion kwargs - Anthropic doesn't allow both temperature and top_p
            completion_kwargs = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
            }
            
            # Add reasoning_effort if specified
            if reasoning_effort:
                completion_kwargs["reasoning_effort"] = reasoning_effort

            # Only add temperature if NOT using reasoning effort (often mutually exclusive or handled differently by o1/gpt-5)
            # Actually, user research says "temperature... currently not supported" for reasoning models.
            # But let's verify logic. If reasoning_effort is set, we might want to skip temperature?
            # Or just pass it and let LiteLLM/API handle/error (we are trapping errors).
            # The search said: "certain other API parameters like temperature... are currently not supported".
            # So if reasoning_effort is present, we should probably SKIP temperature and top_p.
            # But let's check provider.
            
            # Simple logic: If reasoning_effort is used, omit temp/top_p.
            if reasoning_effort:
                pass 
            else:
                 completion_kwargs["temperature"] = temperature
                 # Only add top_p for non-Anthropic models
                 if provider != "anthropic" and top_p != 1.0:
                    completion_kwargs["top_p"] = top_p
            
            response = await litellm.acompletion(**completion_kwargs, **kwargs)
            
            message = response.choices[0].message
            content = message.content or ""
            
            # Check for reasoning content (e.g. from o1/gpt-5 models)
            reasoning = getattr(message, "reasoning_content", None)
            if reasoning:
                output = f"<thinking>\n{reasoning}\n</thinking>\n\n{content}"
            else:
                output = content
            
            if response.usage:
                tokens = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
            
            # Calculate cost if available
            try:
                cost_usd = litellm.completion_cost(completion_response=response)
            except Exception:
                pass
                
        except Exception as e:
            error = str(e)
        
        latency_ms = (time.time() - start_time) * 1000
        
        return LLMResponse(
            output=output,
            model=model,
            provider=provider,
            latency_ms=latency_ms,
            tokens=tokens,
            cost_usd=cost_usd,
            error=error,
        )
    
    @classmethod
    async def generate_text_completion(
        cls,
        prompt: str,
        model: str = None,
        system_prompt: str = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate a completion from a text prompt.
        Converts to chat format internally.
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        return await cls.generate_completion(messages, model=model, **kwargs)
