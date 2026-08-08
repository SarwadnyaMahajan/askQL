"""Chat router — routes through the full multi-agent pipeline via SSE streaming.

Phase 3: Full LangGraph pipeline (Router → Schema → Coder → Validator → Executor →
conditional agents → Narrator). All LLM calls use Google Gemini.
"""

from __future__ import annotations

import json
import uuid
import time

from fastapi import APIRouter, HTTPException, Depends
from sse_starlette.sse import EventSourceResponse

from app.models.schemas import ChatRequest, AgentStep
from app.models.db_models import ChatMessage, AsyncSessionLocal
from app.security.auth import get_current_user
from app.security.rate_limiter import rate_limit
from app.services.duckdb_service import duckdb_service
from app.agents.graph import run_pipeline

router = APIRouter(prefix="/api", tags=["chat"])


async def _save_messages(session_id: str, message: str, state: dict):
    """Save user turn and assistant turn to PostgreSQL database."""
    try:
        async with AsyncSessionLocal() as db:
            # 1. User Message
            user_msg = ChatMessage(
                id=str(uuid.uuid4()),
                session_id=session_id,
                role="user",
                content=message,
            )
            db.add(user_msg)

            # 2. Extra data artifacts
            extra_data = {}
            if state.get("steps"):
                extra_data["agentSteps"] = [
                    AgentStep(
                        agent=s["agent"],
                        action=s["action"],
                        detail=s.get("detail", ""),
                        duration_ms=s.get("duration_ms"),
                    ).model_dump()
                    for s in state["steps"]
                ]
            if state.get("sql"):
                extra_data["codeBlocks"] = [{"language": "sql", "code": state["sql"]}]
            if state.get("pandas_code"):
                extra_data.setdefault("codeBlocks", []).append({"language": "python", "code": state["pandas_code"]})
            if state.get("chart_spec"):
                extra_data["charts"] = [state["chart_spec"]]
            if state.get("anomalies"):
                extra_data["anomalies"] = state["anomalies"]
            if state.get("forecast") and state["forecast"].get("success"):
                extra_data["forecasts"] = [state["forecast"]]

            assistant_msg = ChatMessage(
                id=str(uuid.uuid4()),
                session_id=session_id,
                role="assistant",
                content=state.get("narration", ""),
                sql_query=state.get("sql"),
                extra_data=json.dumps(extra_data, default=str),
            )
            db.add(assistant_msg)
            await db.commit()
    except Exception as e:
        print(f"[chat_db_save_error] Failed to persist chat turn: {e}")


async def _stream_chat(request: ChatRequest):
    """Generator that yields SSE events by running the full agent pipeline."""
    session_id = request.session_id
    message = request.message

    # Quick session check
    tables = duckdb_service.get_table_names(session_id)
    if not tables:
        yield {
            "event": "error",
            "data": json.dumps({"detail": "No data loaded. Please upload a CSV first."}),
        }
        return

    # Run the full pipeline
    try:
        state = await run_pipeline(session_id, message, generate_chart=request.generate_chart)
    except Exception as e:
        yield {
            "event": "error",
            "data": json.dumps({"detail": f"Pipeline error: {str(e)}"}),
        }
        return

    # Stream all agent steps as SSE events
    for step in state.get("steps", []):
        yield {
            "event": "agent_step",
            "data": json.dumps(AgentStep(
                agent=step["agent"],
                action=step["action"],
                detail=step.get("detail", ""),
                duration_ms=step.get("duration_ms"),
            ).model_dump()),
        }

    # Stream SQL code if generated
    if state.get("sql"):
        yield {
            "event": "code",
            "data": json.dumps({"language": "sql", "code": state["sql"]}),
        }

    # Stream pandas code if generated
    if state.get("pandas_code"):
        yield {
            "event": "code",
            "data": json.dumps({"language": "python", "code": state["pandas_code"]}),
        }

    # Stream chart spec if generated
    if state.get("chart_spec"):
        yield {
            "event": "chart",
            "data": json.dumps(state["chart_spec"]),
        }

    # Stream anomaly flags if detected
    if state.get("anomalies"):
        for anomaly in state["anomalies"]:
            yield {
                "event": "anomaly",
                "data": json.dumps(anomaly, default=str),
            }

    # Stream forecast if generated
    if state.get("forecast") and state["forecast"].get("success"):
        yield {
            "event": "forecast",
            "data": json.dumps(state["forecast"], default=str),
        }

    # Stream the narration
    if state.get("narration"):
        yield {
            "event": "token",
            "data": json.dumps({"content": state["narration"]}),
        }

    # Stream error if any
    if state.get("error"):
        yield {
            "event": "error",
            "data": json.dumps({"detail": state["error"]}),
        }

    # Persist chat turn to DB
    await _save_messages(session_id, message, state)

    yield {"event": "done", "data": "{}"}


@router.post("/chat", dependencies=[Depends(get_current_user), Depends(rate_limit)])
async def chat(request: ChatRequest):
    """Chat endpoint — streams response via SSE."""
    if not request.session_id:
        raise HTTPException(status_code=400, detail="session_id is required.")
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    return EventSourceResponse(
        _stream_chat(request),
        media_type="text/event-stream",
    )

