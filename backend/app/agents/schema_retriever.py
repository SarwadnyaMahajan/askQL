"""Schema Retriever — LangGraph node that fetches schema context for the user query.

Wraps the existing QdrantService.retrieve_context() as a graph-compatible function.
"""

from __future__ import annotations

from app.services.qdrant_service import qdrant_service
from app.services.duckdb_service import duckdb_service


def retrieve_schema(session_id: str, query: str) -> dict:
    """Retrieve schema context and table metadata for a user query.

    Returns a dict with:
        - schema_context: formatted schema text for LLM consumption
        - tables: list of table names in the session
        - schema_info: raw schema info list (for other agents)
    """
    tables = duckdb_service.get_table_names(session_id)
    schema_context = qdrant_service.retrieve_context(session_id, query)
    schema_info = duckdb_service.get_schema_info(session_id)

    return {
        "schema_context": schema_context,
        "tables": tables,
        "schema_info": schema_info,
    }
