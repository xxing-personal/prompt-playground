from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Prompt Playground"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground"

    # LLM
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    default_model: str = "gpt-4o-mini"

    # Eval settings
    eval_concurrency_limit: int = 10
    eval_max_retries: int = 3
    eval_timeout_seconds: int = 120

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
