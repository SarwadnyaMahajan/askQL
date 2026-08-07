"""FastAPI application entry point."""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import upload, chat, auth
from app.services.duckdb_service import duckdb_service
from app.models.db_models import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown hooks."""
    # ── Startup ──────────────────────────────────────────────────
    print("[startup] AI Data Analyst backend starting...")
    print(f"   CORS origins: {settings.cors_origins}")
    print(f"   Max file size: {settings.max_file_size_mb}MB")
    print(f"   Session TTL: {settings.session_ttl_hours}h")

    # Initialize DB tables
    await init_db()

    # Start periodic cleanup task
    cleanup_task = asyncio.create_task(_periodic_cleanup())

    yield

    # ── Shutdown ─────────────────────────────────────────────────
    cleanup_task.cancel()
    print("[shutdown] Shutting down...")


async def _periodic_cleanup():
    """Periodically clean up expired DuckDB sessions."""
    while True:
        await asyncio.sleep(3600)  # every hour
        removed = duckdb_service.cleanup_expired()
        if removed:
            print(f"[cleanup] Cleaned up {removed} expired session(s)")


# ─── App ─────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Data Analyst",
    description="Upload CSVs and interact with your data using natural language.",
    version="0.1.0",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ──────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(chat.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": app.version}
