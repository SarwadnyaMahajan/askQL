"""Per-session DuckDB service.

Each session gets its own in-memory DuckDB instance with read-only query access.
Instances are cleaned up after a configurable TTL.
"""

from __future__ import annotations

import threading
import time
from typing import Any

import duckdb
import pandas as pd

from app.config import settings


class _SessionInstance:
    """Wrapper around a DuckDB connection with creation timestamp."""

    def __init__(self):
        # In-memory database — no disk footprint, isolated per session
        self.conn = duckdb.connect(":memory:")
        self.created_at = time.time()
        self.tables: list[str] = []

    def close(self):
        try:
            self.conn.close()
        except Exception:
            pass


class DuckDBService:
    """Manages per-session in-memory DuckDB instances."""

    def __init__(self):
        self._sessions: dict[str, _SessionInstance] = {}
        self._lock = threading.Lock()

    # ─── Session lifecycle ───────────────────────────────────────

    def get_or_create(self, session_id: str) -> _SessionInstance:
        """Get an existing session instance or create a new one."""
        with self._lock:
            if session_id not in self._sessions:
                self._sessions[session_id] = _SessionInstance()
            return self._sessions[session_id]

    def remove(self, session_id: str) -> None:
        """Explicitly remove a session and close its connection."""
        with self._lock:
            instance = self._sessions.pop(session_id, None)
            if instance:
                instance.close()

    def cleanup_expired(self) -> int:
        """Remove sessions older than the configured TTL. Returns count removed."""
        ttl_seconds = settings.session_ttl_hours * 3600
        now = time.time()
        removed = 0
        with self._lock:
            expired = [
                sid for sid, inst in self._sessions.items()
                if now - inst.created_at > ttl_seconds
            ]
            for sid in expired:
                self._sessions[sid].close()
                del self._sessions[sid]
                removed += 1
        return removed

    # ─── Data loading ────────────────────────────────────────────

    def load_dataframe(
        self, session_id: str, table_name: str, df: pd.DataFrame
    ) -> None:
        """Load a pandas DataFrame into the session's DuckDB as a named table."""
        instance = self.get_or_create(session_id)
        # Register the DataFrame — DuckDB can query it directly
        instance.conn.register(table_name, df)
        # Also create a persistent table so it survives DataFrame GC
        instance.conn.execute(
            f'CREATE OR REPLACE TABLE "{table_name}" AS SELECT * FROM "{table_name}"'
        )
        instance.conn.unregister(table_name)
        if table_name not in instance.tables:
            instance.tables.append(table_name)

    # ─── Query execution (read-only) ────────────────────────────

    def execute_query(
        self, session_id: str, sql: str
    ) -> tuple[list[dict[str, Any]], list[str]]:
        """Execute a SELECT query and return (rows_as_dicts, column_names).

        Raises ValueError if the query is not a SELECT.
        """
        # Basic guard — full AST validation happens in the Validator agent
        stripped = sql.strip().rstrip(";").strip()
        first_word = stripped.split()[0].upper() if stripped else ""
        if first_word not in ("SELECT", "WITH", "EXPLAIN"):
            raise ValueError(f"Only SELECT queries are allowed, got: {first_word}")

        instance = self.get_or_create(session_id)
        result = instance.conn.execute(sql)
        columns = [desc[0] for desc in result.description]
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        return rows, columns

    def get_table_names(self, session_id: str) -> list[str]:
        """Return the list of tables loaded in this session."""
        instance = self.get_or_create(session_id)
        return list(instance.tables)

    def get_schema_info(self, session_id: str) -> list[dict]:
        """Return schema info for all tables in the session.

        Returns a list of dicts with keys: table, column, dtype, sample_values.
        """
        instance = self.get_or_create(session_id)
        schema_info = []
        for table in instance.tables:
            try:
                result = instance.conn.execute(
                    f'SELECT * FROM "{table}" LIMIT 3'
                )
                columns = [desc[0] for desc in result.description]
                sample_rows = result.fetchall()

                # Get column types
                col_types = instance.conn.execute(
                    f"DESCRIBE \"{table}\""
                ).fetchall()
                type_map = {row[0]: row[1] for row in col_types}

                for col in columns:
                    samples = [str(row[columns.index(col)]) for row in sample_rows]
                    schema_info.append({
                        "table": table,
                        "column": col,
                        "dtype": type_map.get(col, "unknown"),
                        "sample_values": samples,
                    })
            except Exception:
                continue
        return schema_info


# Singleton
duckdb_service = DuckDBService()
