"""LangGraph StateGraph — wires all agent nodes into the full pipeline.

Graph flow:
  Router → SchemaRetriever → Coder → Validator → Executor
    → (conditional) ChartAgent / AnomalyAgent / ForecastAgent
    → Narrator

Self-heal: Executor error → Coder retry (max 2 attempts)
"""

from __future__ import annotations

import json
import time
from typing import Any, TypedDict

from google import genai

from app.config import settings
from app.agents.router_agent import classify_intent
from app.agents.schema_retriever import retrieve_schema
from app.agents.coder_agent import generate_code
from app.agents.validator import validate_sql
from app.agents.executor import execute_sql
from app.agents.chart_agent import generate_chart_spec
from app.agents.anomaly_agent import detect_anomalies, enrich_with_detective_notes
from app.agents.forecast_agent import detect_time_column, generate_forecast
from app.agents.narrator_agent import narrate
from app.agents.memory import memory
from app.services.llm_service import generate_llm


# ─── Pipeline State ──────────────────────────────────────────────

class PipelineState(TypedDict, total=False):
    """State that flows through the agent pipeline."""
    session_id: str
    query: str
    intent: dict
    schema_context: str
    tables: list[str]
    schema_info: list[dict]
    sql: str
    sql_explanation: str
    pandas_code: str
    validation: dict
    execution: dict
    rows: list[dict]
    columns: list[str]
    chart_spec: dict | None
    anomalies: list[dict]
    forecast: dict | None
    narration: str
    error: str | None
    retry_count: int
    steps: list[dict]  # Agent trace steps


# ─── Gemini Client ───────────────────────────────────────────────

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


# ─── Pipeline Runner ─────────────────────────────────────────────

def _add_step(state: dict, agent: str, action: str, detail: str, duration_ms: int) -> None:
    """Add a trace step to the pipeline state."""
    state.setdefault("steps", []).append({
        "agent": agent,
        "action": action,
        "detail": detail,
        "duration_ms": duration_ms,
    })


async def run_pipeline(session_id: str, query: str, generate_chart: bool = False) -> dict:
    """Run the full multi-agent pipeline.

    This is the main entry point — called from the chat router.
    Returns the complete pipeline state with all outputs.
    """
    client = _get_client()

    state: dict[str, Any] = {
        "session_id": session_id,
        "query": query,
        "steps": [],
        "retry_count": 0,
        "error": None,
        "chart_spec": None,
        "anomalies": [],
        "forecast": None,
    }

    # ── Node 1: Router ───────────────────────────────────────────
    t0 = time.time()
    intent = classify_intent(query, client)
    state["intent"] = intent
    _add_step(state, "Router", "Classified intent",
              f"{intent['intent']} (confidence: {intent.get('confidence', '?')})",
              int((time.time() - t0) * 1000))

    # Handle general intent (no data needed)
    if intent["intent"] == "general":
        t0 = time.time()
        state["narration"] = generate_llm(
            client=client,
            contents=query,
            system_instruction="You are a helpful data analyst assistant. Answer the user's general question.",
            max_output_tokens=1024,
            temperature=0.5,
        ) or "How can I help you with your data?"
        _add_step(state, "Narrator", "General response",
                  f"{len(state['narration'])} chars",
                  int((time.time() - t0) * 1000))
        return state

    # ── Node 2: Schema Retriever ─────────────────────────────────
    t0 = time.time()
    schema_data = retrieve_schema(session_id, query)
    state["schema_context"] = schema_data["schema_context"]
    state["tables"] = schema_data["tables"]
    state["schema_info"] = schema_data["schema_info"]
    _add_step(state, "Schema Retriever", "Retrieved schema context",
              f"{len(schema_data['tables'])} table(s)",
              int((time.time() - t0) * 1000))

    if not state["tables"]:
        state["error"] = "No data loaded. Please upload a CSV first."
        state["narration"] = state["error"]
        return state

    # Add conversation context
    conv_context = memory.get_context_summary(session_id)
    full_context = state["schema_context"]
    if conv_context:
        full_context = conv_context + "\n\n" + full_context

    # ── Node 3: Coder (with self-heal retry loop) ────────────────
    max_retries = 2
    error_context = None

    for attempt in range(max_retries + 1):
        state["retry_count"] = attempt

        # Generate code
        t0 = time.time()
        code_result = generate_code(query, full_context, client, error_context)
        state["sql"] = code_result["sql"]
        state["sql_explanation"] = code_result["explanation"]
        state["pandas_code"] = code_result.get("pandas_equivalent", "")

        detail = code_result["explanation"][:150] if code_result["explanation"] else ""
        if attempt > 0:
            detail = f"[Retry {attempt}] {detail}"
        _add_step(state, "Coder", "Generated SQL",
                  detail, int((time.time() - t0) * 1000))

        if not state["sql"]:
            # No SQL generated
            state["narration"] = code_result["explanation"] or "I couldn't generate a query for this question."
            return state

        # ── Node 4: Validator ────────────────────────────────────
        t0 = time.time()
        validation = validate_sql(state["sql"])
        state["validation"] = validation
        _add_step(state, "Validator",
                  "SQL validated" if validation["valid"] else "SQL validation failed",
                  validation.get("error", "Passed"),
                  int((time.time() - t0) * 1000))

        if not validation["valid"]:
            error_context = validation["error"]
            if attempt < max_retries:
                continue
            state["error"] = f"SQL validation failed after {max_retries + 1} attempts: {validation['error']}"
            state["narration"] = state["error"]
            return state

        # ── Node 5: Executor ─────────────────────────────────────
        t0 = time.time()
        execution = execute_sql(session_id, state["sql"])
        state["execution"] = execution
        _add_step(state, "Executor",
                  "Executed successfully" if execution["success"] else "Execution failed",
                  f"{execution.get('row_count', 0)} rows" if execution["success"] else execution.get("error", "")[:200],
                  int((time.time() - t0) * 1000))

        if execution["success"]:
            state["rows"] = execution["rows"]
            state["columns"] = execution["columns"]
            break  # Success — exit retry loop
        else:
            error_context = execution["error"]
            if attempt < max_retries:
                continue
            state["error"] = f"Query execution failed after {max_retries + 1} attempts: {execution['error']}"
            state["narration"] = state["error"]
            return state

    # ── Conditional: Chart / Anomaly / Forecast ──────────────────
    intent_type = intent["intent"]

    # Chart generation: ONLY if explicitly requested via generate_chart=True OR intent is "chart"
    if (generate_chart or intent_type == "chart") and state.get("rows"):
        t0 = time.time()
        chart = generate_chart_spec(query, state["rows"], state.get("columns", []), client)
        state["chart_spec"] = chart
        if chart:
            _add_step(state, "Chart Agent", "Generated visualization",
                      f"{chart.get('chart_type', 'chart')} chart",
                      int((time.time() - t0) * 1000))

    # Anomaly detection
    if intent_type == "anomaly" and state.get("rows"):
        t0 = time.time()
        import pandas as pd
        # Get full dataset for anomaly detection
        try:
            full_rows, full_cols = execute_sql(session_id,
                f'SELECT * FROM "{state["tables"][0]}"').values()
        except Exception:
            full_rows = state["rows"]

        if isinstance(full_rows, list) and full_rows:
            df = pd.DataFrame(full_rows)
            flags = detect_anomalies(df)
            if flags:
                flags = enrich_with_detective_notes(flags, df, client)
            state["anomalies"] = flags
            _add_step(state, "Anomaly Detective", "Detected anomalies",
                      f"{len(flags)} anomalies found",
                      int((time.time() - t0) * 1000))

    # Forecast
    if intent_type == "forecast":
        t0 = time.time()
        import pandas as pd
        try:
            table = state["tables"][0]
            all_result = execute_sql(session_id, f'SELECT * FROM "{table}"')
            if all_result["success"]:
                df = pd.DataFrame(all_result["rows"])
                time_col = detect_time_column(df)
                if time_col:
                    # Find the best numeric column to forecast
                    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
                    # Prefer "revenue" or similar
                    value_col = None
                    for candidate in ["revenue", "sales", "amount", "value", "total", "quantity"]:
                        for nc in numeric_cols:
                            if candidate in nc.lower():
                                value_col = nc
                                break
                        if value_col:
                            break
                    if not value_col and numeric_cols:
                        value_col = numeric_cols[0]

                    if value_col:
                        fc = generate_forecast(df, time_col, value_col)
                        state["forecast"] = fc
                        detail = f"{fc.get('periods_ahead', '?')} periods for {value_col}" if fc.get("success") else fc.get("error", "")[:200]
                        _add_step(state, "Forecast Agent",
                                  "Generated forecast" if fc.get("success") else "Forecast failed",
                                  detail, int((time.time() - t0) * 1000))
        except Exception as e:
            _add_step(state, "Forecast Agent", "Forecast failed",
                      str(e)[:200], int((time.time() - t0) * 1000))

    # ── Node 6: Narrator ─────────────────────────────────────────
    t0 = time.time()
    narration_text = narrate(
        query=query,
        sql=state.get("sql"),
        rows=state.get("rows"),
        chart_spec=state.get("chart_spec"),
        anomalies=state.get("anomalies"),
        forecast=state.get("forecast"),
        client=client,
    )
    state["narration"] = narration_text
    _add_step(state, "Narrator", "Composed answer",
              f"{len(narration_text)} chars",
              int((time.time() - t0) * 1000))

    # Save to conversation memory
    memory.add_turn(session_id, "user", query)
    memory.add_turn(session_id, "assistant", narration_text,
                    metadata={"sql": state.get("sql", "")})

    return state
