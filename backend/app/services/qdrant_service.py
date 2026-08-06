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

        Phase 2: returns all schema info as formatted text (no semantic search yet).
        Phase 3: will do vector similarity search against embedded column descriptions.
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

        # Format as readable context for the LLM
        lines = ["Available tables and columns:\n"]
        for table, columns in tables.items():
            lines.append(f"TABLE: {table}")
            for col in columns:
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
