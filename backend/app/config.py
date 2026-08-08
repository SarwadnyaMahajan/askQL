"""Application configuration — loaded from environment variables via Pydantic Settings."""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Central config. Every value can be overridden by an env var of the same name."""

    # ─── LLM ────────────────────────────────────────────────────
    gemini_api_key: str = Field(..., description="Google Gemini API key")
    llm_model: str = Field("gemini-2.5-flash", description="Gemini primary model ID (Coder)")
    llm_lite_model: str = Field("gemini-2.5-flash-lite", description="Gemini lite model ID (Narrator & auxiliary tasks)")
    llm_max_tokens: int = Field(4096, description="Max tokens per LLM response")

    # ─── Groq Fallback ───────────────────────────────────────────
    groq_api_key: str = Field("", description="Groq API key for fallback LLM")
    groq_model: str = Field("llama-3.3-70b-versatile", description="Groq fallback model ID")

    # ─── Postgres ────────────────────────────────────────────────
    database_url: str = Field(
        "postgresql+asyncpg://analyst:changeme@localhost:5432/ai_analyst",
        description="Async Postgres connection string",
    )

    # ─── Redis ───────────────────────────────────────────────────
    redis_url: str = Field("redis://localhost:6379/0")

    # ─── Qdrant ──────────────────────────────────────────────────
    qdrant_url: str = Field("http://localhost:6333")
    qdrant_api_key: str = Field("", description="Qdrant API key (empty for local)")

    # ─── Auth ────────────────────────────────────────────────────
    jwt_secret: str = Field("super-secret-change-me")
    jwt_algorithm: str = Field("HS256")
    jwt_expire_minutes: int = Field(1440)

    # ─── CORS ────────────────────────────────────────────────────
    backend_cors_origins: str = Field(
        "http://localhost:5173",
        description="Comma-separated allowed origins",
    )

    # ─── Upload Limits ───────────────────────────────────────────
    max_file_size_mb: int = Field(25)
    max_rows: int = Field(100_000)
    max_columns: int = Field(200)

    # ─── Rate Limiting ───────────────────────────────────────────
    rate_limit_per_min: int = Field(20)

    # ─── Execution Sandbox ───────────────────────────────────────
    code_exec_timeout_sec: int = Field(5)

    # ─── Session TTL ─────────────────────────────────────────────
    session_ttl_hours: int = Field(24, description="Auto-delete sessions after N hours")

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.backend_cors_origins.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


# Singleton — import this everywhere
settings = Settings()
