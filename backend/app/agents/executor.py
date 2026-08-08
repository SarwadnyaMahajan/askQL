"""Executor — runs validated SQL against the per-session DuckDB instance.

Enforces read-only execution with timeout protection.
"""

from __future__ import annotations

import signal
import threading
from typing import Any

from app.config import settings
from app.services.duckdb_service import duckdb_service
from app.services.llm_service import traceable


class ExecutionTimeout(Exception):
    """Raised when code execution exceeds the time limit."""
    pass


@traceable(name="ExecutorAgent", run_type="chain")
def execute_sql(session_id: str, sql: str) -> dict[str, Any]:

    """Execute a validated SQL query against the session's DuckDB.

    Returns:
        {
            "success": True,
            "rows": [...],
            "columns": [...],
            "row_count": int,
        }
    or:
        {
            "success": False,
            "error": "...",
        }
    """
    if not sql or not sql.strip():
        return {"success": False, "error": "Empty SQL query."}

    result = {"success": False, "error": "Execution timed out."}
    exception_holder = [None]

    def _run():
        try:
            rows, columns = duckdb_service.execute_query(session_id, sql)
            result.update({
                "success": True,
                "rows": rows,
                "columns": columns,
                "row_count": len(rows),
                "error": None,
            })
        except Exception as e:
            exception_holder[0] = e
            result.update({
                "success": False,
                "error": str(e),
            })

    # Run with timeout using threading
    timeout = settings.code_exec_timeout_sec
    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    thread.join(timeout=timeout)

    if thread.is_alive():
        # Thread is still running — timed out
        return {
            "success": False,
            "error": f"Query execution timed out after {timeout}s.",
        }

    return result


def execute_pandas(session_id: str, code: str, df_name: str = "df") -> dict[str, Any]:
    """Execute validated pandas code in a restricted environment.

    This is a simplified sandbox — the DataFrame is provided as `df`.

    Returns similar structure to execute_sql.
    """
    import pandas as pd

    # Get the data from DuckDB
    tables = duckdb_service.get_table_names(session_id)
    if not tables:
        return {"success": False, "error": "No data loaded."}

    # Get first table as a DataFrame
    try:
        rows, columns = duckdb_service.execute_query(
            session_id, f'SELECT * FROM "{tables[0]}"'
        )
        df = pd.DataFrame(rows)
    except Exception as e:
        return {"success": False, "error": f"Failed to load data: {str(e)}"}

    # Restricted builtins
    safe_builtins = {
        "len": len, "range": range, "int": int, "float": float,
        "str": str, "bool": bool, "list": list, "dict": dict,
        "tuple": tuple, "set": set, "sorted": sorted, "sum": sum,
        "min": min, "max": max, "abs": abs, "round": round,
        "enumerate": enumerate, "zip": zip, "map": map, "filter": filter,
        "print": print, "isinstance": isinstance, "type": type,
        "True": True, "False": False, "None": None,
    }

    # Execute in restricted namespace
    namespace = {
        "__builtins__": safe_builtins,
        "pd": pd,
        "df": df,
        df_name: df,
    }

    result_holder = {"success": False, "error": "Execution timed out."}

    def _run():
        try:
            exec(code, namespace)
            # Try to capture result
            result_val = namespace.get("result", namespace.get("output", None))
            if isinstance(result_val, pd.DataFrame):
                result_holder.update({
                    "success": True,
                    "rows": result_val.head(100).to_dict("records"),
                    "columns": list(result_val.columns),
                    "row_count": len(result_val),
                    "error": None,
                })
            elif result_val is not None:
                result_holder.update({
                    "success": True,
                    "rows": [{"result": str(result_val)}],
                    "columns": ["result"],
                    "row_count": 1,
                    "error": None,
                })
            else:
                result_holder.update({
                    "success": True,
                    "rows": [],
                    "columns": [],
                    "row_count": 0,
                    "error": None,
                })
        except Exception as e:
            result_holder.update({
                "success": False,
                "error": str(e),
            })

    timeout = settings.code_exec_timeout_sec
    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    thread.join(timeout=timeout)

    if thread.is_alive():
        return {
            "success": False,
            "error": f"Code execution timed out after {timeout}s.",
        }

    return result_holder
