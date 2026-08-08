"""Pydantic request/response models for the API."""

from __future__ import annotations

from pydantic import BaseModel, Field


# ─── Upload ──────────────────────────────────────────────────────

class ColumnProfile(BaseModel):
    """Per-column statistics returned after upload."""
    name: str
    dtype: str
    null_count: int
    null_pct: float
    unique_count: int
    sample_values: list[str] = Field(default_factory=list, max_length=5)
    # numeric-only stats (None for non-numeric)
    min: float | None = None
    max: float | None = None
    mean: float | None = None
    median: float | None = None
    std: float | None = None


class DataQualitySummary(BaseModel):
    """Returned after CSV upload — gives the user an instant health check."""
    file_name: str
    row_count: int
    column_count: int
    duplicate_row_count: int
    duplicate_row_pct: float
    total_null_count: int
    total_null_pct: float
    columns: list[ColumnProfile]


class UploadResponse(BaseModel):
    """Response from POST /api/upload."""
    session_id: str
    files: list[DataQualitySummary]
    message: str = "Files uploaded and profiled successfully."


# ─── Chat ────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Body for POST /api/chat."""
    session_id: str
    message: str = Field(..., min_length=1, max_length=2000)
    generate_chart: bool = False


class AgentStep(BaseModel):
    """One step in the agent reasoning trace."""
    agent: str
    action: str
    detail: str = ""
    duration_ms: int | None = None


class ChartSpec(BaseModel):
    """Plotly chart specification embedded in a chat response."""
    chart_type: str
    data: list[dict]
    layout: dict = Field(default_factory=dict)


class CodeBlock(BaseModel):
    """Generated SQL or pandas code shown alongside an answer."""
    language: str  # "sql" or "python"
    code: str


class AnomalyFlag(BaseModel):
    """A single anomaly flagged row with detective note."""
    row_index: int
    column: str
    value: float
    test_used: str
    threshold: str
    detective_note: str


class ChatResponse(BaseModel):
    """Full (non-streamed) chat response — also the shape of the final SSE payload."""
    answer: str
    reasoning_trace: list[AgentStep] = Field(default_factory=list)
    code: CodeBlock | None = None
    chart: ChartSpec | None = None
    anomalies: list[AnomalyFlag] = Field(default_factory=list)


# ─── SSE Event Types ─────────────────────────────────────────────

class SSEEvent(BaseModel):
    """Typed SSE event sent during streaming."""
    event: str  # "token", "agent_step", "chart", "code", "anomaly", "error", "done"
    data: dict | str
