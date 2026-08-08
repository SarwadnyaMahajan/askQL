"""Qdrant vector store service — embeds schema metadata for semantic retrieval.

In Phase 2 this uses a lightweight in-memory approach.
Full Qdrant integration is wired in Phase 3.
"""

from __future__ import annotations

import hashlib
from typing import Any


class QdrantService:
    """Schema context retrieval service.

    Phase 2: uses a simple in-memory store keyed by session_id.
    Phase 3: will switch to actual Qdrant vector embeddings.
    """

    def __init__(self):
        # session_id -> list of schema info dicts
        self._store: dict[str, list[dict[str, Any]]] = {}

    def store_schema(self, session_id: str, schema_info: list[dict]) -> None:
        """Store schema information for a session."""
        self._store[session_id] = schema_info

    def retrieve_context(self, session_id: str, query: str) -> str:
        """Retrieve schema context relevant to a query.

        Filters table columns by relevance score (name, data type, sample overlap)
        to minimize prompt token usage while preserving query context.
        """
        schema_info = self._store.get(session_id, [])
        if not schema_info:
            return "No data loaded for this session."

        # Group by table
        tables: dict[str, list[dict]] = {}
        for entry in schema_info:
            table = entry["table"]
            if table not in tables:
                tables[table] = []
            tables[table].append(entry)

        # Extract normalized query tokens
        import re
        query_words = set(re.findall(r'\w+', query.lower()))

        # Score and filter columns per table
        lines = ["Available tables and columns:\n"]
        for table, columns in tables.items():
            # If total columns in table <= 12, include all for complete accuracy
            if len(columns) <= 12:
                selected_cols = columns
            else:
                scored_cols = []
                for idx, col in enumerate(columns):
                    col_name = col["column"].lower()
                    samples_str = " ".join(col.get("sample_values", [])).lower()
                    
                    score = 0
                    # Direct term match in column name
                    for qw in query_words:
                        if len(qw) > 2:
                            if qw in col_name:
                                score += 10
                            elif col_name in qw:
                                score += 5
                            if qw in samples_str:
                                score += 3

                    # Boost numeric/datetime columns for aggregation/chart/forecast queries
                    if any(w in query_words for w in ["sum", "total", "avg", "mean", "revenue", "sales", "price", "amount", "count", "top"]):
                        if any(t in col.get("dtype", "").lower() for t in ["int", "float", "double", "numeric", "decimal"]):
                            score += 4
                    if any(w in query_words for w in ["date", "month", "year", "time", "trend", "forecast", "daily", "monthly"]):
                        if any(t in col.get("dtype", "").lower() for t in ["date", "time", "timestamp"]):
                            score += 4

                    # Always give first 2 columns a baseline score as primary identifiers
                    if idx < 2:
                        score += 2

                    scored_cols.append((score, col))

                # Sort by score descending and select top 10 relevant columns
                scored_cols.sort(key=lambda x: x[0], reverse=True)
                selected_cols = [col for score, col in scored_cols[:10]]
                # Sort selected back to original schema column order
                col_order = {c["column"]: i for i, c in enumerate(columns)}
                selected_cols.sort(key=lambda c: col_order.get(c["column"], 0))

            lines.append(f"TABLE: {table}")
            for col in selected_cols:
                samples = ", ".join(col.get("sample_values", [])[:3])
                lines.append(
                    f"  - {col['column']} ({col['dtype']}) — samples: {samples}"
                )
            lines.append("")

        return "\n".join(lines)

    def remove_session(self, session_id: str) -> None:
        """Clean up schema data for a session."""
        self._store.pop(session_id, None)


# Singleton
qdrant_service = QdrantService()
