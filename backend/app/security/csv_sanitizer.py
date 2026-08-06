"""CSV sanitizer — defends against formula injection and prompt injection.

Runs BEFORE any data touches DuckDB or the LLM context.
"""

from __future__ import annotations

import re

# ─── Formula Injection ───────────────────────────────────────────
# Any cell starting with these chars could be interpreted as a formula
# by downstream spreadsheet tools (Excel, Google Sheets).
_FORMULA_PREFIXES = ("=", "+", "-", "@")


def _escape_formula_cell(value: str) -> str:
    """Prefix dangerous cells with a single-quote to neutralize formulas."""
    if isinstance(value, str) and value and value[0] in _FORMULA_PREFIXES:
        # Prepend a single-quote — standard CSV injection defense
        return "'" + value
    return value


# ─── Prompt Injection ───────────────────────────────────────────
# Patterns that look like prompt-injection attempts inside cell values.
# We quarantine (replace) them so they never reach the LLM as instructions.
_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+", re.IGNORECASE),
    re.compile(r"system\s*:\s*", re.IGNORECASE),
    re.compile(r"<\s*/?\s*(?:system|user|assistant)\s*>", re.IGNORECASE),
    re.compile(r"forget\s+(everything|all|your)\s+", re.IGNORECASE),
    re.compile(r"do\s+not\s+follow\s+", re.IGNORECASE),
    re.compile(r"disregard\s+(all|any|the)\s+", re.IGNORECASE),
]

_QUARANTINE_REPLACEMENT = "[SANITIZED]"


def _sanitize_prompt_injection(value: str) -> str:
    """Replace text that resembles prompt-injection attempts."""
    if not isinstance(value, str):
        return value
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(value):
            return _QUARANTINE_REPLACEMENT
    return value


# ─── Column Name Sanitizer ───────────────────────────────────────

def sanitize_column_name(name: str) -> str:
    """Clean column names — strip whitespace, replace special chars."""
    name = name.strip()
    # Remove any prompt-injection attempts in column names too
    name = _sanitize_prompt_injection(name)
    return name


# ─── Public API ──────────────────────────────────────────────────

def sanitize_dataframe(df) -> None:
    """Sanitize a pandas DataFrame in-place.

    1. Sanitize column names.
    2. Escape formula-injection prefixes in string cells.
    3. Quarantine prompt-injection patterns in string cells.
    """
    import pandas as pd

    # Column names
    df.columns = [sanitize_column_name(c) for c in df.columns]

    # Cell values — only process object (string) columns for performance
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].apply(
            lambda v: _sanitize_prompt_injection(_escape_formula_cell(v))
            if isinstance(v, str) else v
        )
