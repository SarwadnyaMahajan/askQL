"""Upload router — CSV validation, profiling, and DuckDB ingestion."""

from __future__ import annotations

import io
import os
import json
import uuid
from typing import Annotated

import pandas as pd
from fastapi import APIRouter, File, UploadFile, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.config import settings
from app.models.schemas import UploadResponse, DataQualitySummary, ColumnProfile
from app.models.db_models import User, SessionModel, UploadedFile, get_db
from app.security.csv_sanitizer import sanitize_dataframe
from app.security.auth import get_current_user
from app.security.rate_limiter import rate_limit
from app.services.duckdb_service import duckdb_service
from app.services.qdrant_service import qdrant_service


router = APIRouter(prefix="/api", tags=["upload"])

# Allowed MIME types for CSV uploads
_ALLOWED_MIMES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "text/plain",  # some systems send CSV as text/plain
}

_ALLOWED_EXTENSIONS = {".csv"}


def _validate_file(file: UploadFile) -> None:
    """Validate MIME type and extension. Raises HTTPException on failure."""
    # Extension check
    name = (file.filename or "").lower()
    if not any(name.endswith(ext) for ext in _ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.filename}. Only CSV files are accepted.",
        )

    # MIME check (lenient — some clients send wrong MIME)
    content_type = (file.content_type or "").lower()
    if content_type and content_type not in _ALLOWED_MIMES:
        # Warn but don't block if extension is .csv — MIME detection is unreliable
        pass


def _profile_dataframe(df: pd.DataFrame, file_name: str) -> DataQualitySummary:
    """Generate a data quality summary for a DataFrame."""
    row_count = len(df)
    col_count = len(df.columns)
    dup_count = int(df.duplicated().sum())
    total_nulls = int(df.isnull().sum().sum())
    total_cells = row_count * col_count

    columns = []
    for col in df.columns:
        series = df[col]
        null_count = int(series.isnull().sum())
        profile = ColumnProfile(
            name=str(col),
            dtype=str(series.dtype),
            null_count=null_count,
            null_pct=round(null_count / row_count * 100, 2) if row_count else 0,
            unique_count=int(series.nunique()),
            sample_values=[str(v) for v in series.dropna().head(5).tolist()],
        )

        # Numeric stats
        if pd.api.types.is_numeric_dtype(series):
            clean = series.dropna()
            if len(clean) > 0:
                profile.min = round(float(clean.min()), 4)
                profile.max = round(float(clean.max()), 4)
                profile.mean = round(float(clean.mean()), 4)
                profile.median = round(float(clean.median()), 4)
                profile.std = round(float(clean.std()), 4)

        columns.append(profile)

    return DataQualitySummary(
        file_name=file_name,
        row_count=row_count,
        column_count=col_count,
        duplicate_row_count=dup_count,
        duplicate_row_pct=round(dup_count / row_count * 100, 2) if row_count else 0,
        total_null_count=total_nulls,
        total_null_pct=round(total_nulls / total_cells * 100, 2) if total_cells else 0,
        columns=columns,
    )


@router.post("/upload", response_model=UploadResponse, dependencies=[Depends(rate_limit)])
async def upload_files(
    files: Annotated[list[UploadFile], File(description="One or more CSV files")],
    session_id: Annotated[str | None, Query(description="Existing session ID to add files to")] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload one or more CSV files.

    Validates, sanitizes, profiles, loads into DuckDB, and persists session and files to PostgreSQL.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    # Generate or reuse session ID
    sid = session_id or str(uuid.uuid4())

    # Ensure SessionModel exists in DB linked to current_user
    sess_res = await db.execute(select(SessionModel).where(SessionModel.id == sid))
    session_obj = sess_res.scalars().first()
    if not session_obj:
        session_obj = SessionModel(id=sid, user_id=current_user.id)
        db.add(session_obj)
        await db.commit()

    upload_dir = os.path.join("data", "uploads", sid)
    os.makedirs(upload_dir, exist_ok=True)

    summaries: list[DataQualitySummary] = []

    for file in files:
        # ── Validate ─────────────────────────────────────────────
        _validate_file(file)

        # Read content (check size)
        content = await file.read()
        if len(content) > settings.max_file_size_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} exceeds {settings.max_file_size_mb}MB limit.",
            )

        # ── Parse CSV ────────────────────────────────────────────
        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse {file.filename} as CSV: {str(e)}",
            )

        # Enforce row/column caps
        if len(df) > settings.max_rows:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} has {len(df)} rows, exceeding the {settings.max_rows} limit.",
            )
        if len(df.columns) > settings.max_columns:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} has {len(df.columns)} columns, exceeding the {settings.max_columns} limit.",
            )

        # ── Sanitize ─────────────────────────────────────────────
        sanitize_dataframe(df)

        # Save CSV copy to disk for server restarts & persistent DuckDB re-hydration
        filename = file.filename or "data.csv"
        disk_path = os.path.join(upload_dir, filename)
        df.to_csv(disk_path, index=False)

        # ── Profile ──────────────────────────────────────────────
        summary = _profile_dataframe(df, filename)
        summaries.append(summary)

        # ── Load into DuckDB ─────────────────────────────────────
        table_name = filename.rsplit(".", 1)[0]
        table_name = "".join(c if c.isalnum() or c == "_" else "_" for c in table_name)
        duckdb_service.load_dataframe(sid, table_name, df)

        # Save UploadedFile record in DB
        file_record = UploadedFile(
            id=str(uuid.uuid4()),
            session_id=sid,
            filename=filename,
            row_count=summary.row_count,
            column_count=summary.column_count,
            file_summary=json.dumps(summary.model_dump()),
        )
        db.add(file_record)

    await db.commit()

    # ── Store schema in Qdrant service ───────────────────────────
    schema_info = duckdb_service.get_schema_info(sid)
    qdrant_service.store_schema(sid, schema_info)

    return UploadResponse(session_id=sid, files=summaries)

