"""Anomaly Agent — statistical anomaly detection + LLM detective notes.

Two-layer approach:
1. Statistical: IQR and Z-score on numeric columns
2. LLM: Gemini generates investigative notes for flagged rows
"""

from __future__ import annotations

import json
import math
from typing import Any

import pandas as pd
from google import genai
from google.genai import types

from app.config import settings
from app.services.llm_service import generate_llm


# ─── Statistical Detection ───────────────────────────────────────

def _detect_iqr(series: pd.Series, col_name: str) -> list[dict]:
    """Detect outliers using IQR method."""
    clean = series.dropna()
    if len(clean) < 10:
        return []

    q1 = clean.quantile(0.25)
    q3 = clean.quantile(0.75)
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    flags = []
    for idx, val in clean.items():
        if val < lower or val > upper:
            flags.append({
                "row_index": int(idx),
                "column": col_name,
                "value": float(val),
                "test_used": "IQR",
                "threshold": f"[{lower:.2f}, {upper:.2f}]",
                "severity": "high" if (val < q1 - 3 * iqr or val > q3 + 3 * iqr) else "medium",
            })
    return flags


def _detect_zscore(series: pd.Series, col_name: str, threshold: float = 3.0) -> list[dict]:
    """Detect outliers using Z-score method."""
    clean = series.dropna()
    if len(clean) < 10:
        return []

    mean = clean.mean()
    std = clean.std()
    if std == 0:
        return []

    flags = []
    for idx, val in clean.items():
        z = abs((val - mean) / std)
        if z > threshold:
            flags.append({
                "row_index": int(idx),
                "column": col_name,
                "value": float(val),
                "test_used": "Z-score",
                "threshold": f"z={z:.2f} (threshold={threshold})",
                "severity": "high" if z > 4.0 else "medium",
            })
    return flags


def detect_anomalies(df: pd.DataFrame, max_flags: int = 20) -> list[dict]:
    """Run statistical anomaly detection on all numeric columns.

    Returns a list of anomaly flag dicts, limited to max_flags.
    """
    all_flags = []

    numeric_cols = df.select_dtypes(include=["number"]).columns
    for col in numeric_cols:
        # Run both methods and merge
        iqr_flags = _detect_iqr(df[col], col)
        z_flags = _detect_zscore(df[col], col)

        # Deduplicate by row_index + column
        seen = set()
        for flag in iqr_flags + z_flags:
            key = (flag["row_index"], flag["column"])
            if key not in seen:
                seen.add(key)
                all_flags.append(flag)

    # Sort by severity (high first) then by absolute value deviation
    all_flags.sort(key=lambda f: (0 if f["severity"] == "high" else 1, -abs(f["value"])))

    return all_flags[:max_flags]


# ─── LLM Detective Notes ────────────────────────────────────────

DETECTIVE_PROMPT = """You are a data detective investigating anomalies in a dataset. For each flagged anomaly, write a brief, insightful investigative note explaining:
1. Why this value is unusual compared to the rest of the data
2. Potential business explanations (e.g., bulk order, data entry error, seasonal spike)
3. Recommended action (investigate further, likely valid, probable error)

Keep each note to 2-3 sentences. Be specific and grounded in the data context provided.

Respond with a JSON array of objects: [{"row_index": <int>, "column": "<name>", "detective_note": "<your note>"}]
"""


def enrich_with_detective_notes(
    flags: list[dict],
    df: pd.DataFrame,
    client: genai.Client,
    max_notes: int = 10,
) -> list[dict]:
    """Add LLM-generated detective notes to the top anomaly flags.

    Returns the enriched flags list.
    """
    if not flags:
        return flags

    top_flags = flags[:max_notes]

    # Build context about each flagged row
    context_lines = []
    for flag in top_flags:
        row_idx = flag["row_index"]
        if row_idx < len(df):
            row_data = df.iloc[row_idx].to_dict()
            context_lines.append(
                f"Row {row_idx}, Column '{flag['column']}': value={flag['value']}, "
                f"test={flag['test_used']}, threshold={flag['threshold']}\n"
                f"  Full row: {json.dumps({k: str(v) for k, v in row_data.items()}, default=str)}"
            )

    # Get column statistics for context
    stats = {}
    for col in df.select_dtypes(include=["number"]).columns:
        clean = df[col].dropna()
        if len(clean) > 0:
            stats[col] = {
                "mean": f"{clean.mean():.2f}",
                "median": f"{clean.median():.2f}",
                "std": f"{clean.std():.2f}",
                "min": f"{clean.min():.2f}",
                "max": f"{clean.max():.2f}",
            }

    prompt = f"""Dataset column statistics:
{json.dumps(stats, indent=2)}

Flagged anomalies to investigate:
{chr(10).join(context_lines)}

Write detective notes for each flagged anomaly."""

    try:
        text = generate_llm(
            client=client,
            contents=prompt,
            system_instruction=DETECTIVE_PROMPT,
            max_output_tokens=2048,
            temperature=0.3,
            json_mode=True,
        )
        cleaned = text
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0]

        notes = json.loads(cleaned.strip())

        # Merge notes back into flags
        note_map = {(n["row_index"], n["column"]): n["detective_note"] for n in notes}
        for flag in flags:
            key = (flag["row_index"], flag["column"])
            if key in note_map:
                flag["detective_note"] = note_map[key]
            else:
                flag["detective_note"] = ""

    except Exception:
        # If LLM enrichment fails, just return flags without notes
        for flag in flags:
            flag.setdefault("detective_note", "")

    return flags
