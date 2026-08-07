"""Validator — validates generated SQL and pandas code before execution.

SQL: parsed with sqlglot, only SELECT/WITH/EXPLAIN allowed.
Pandas: parsed with ast, forbidden nodes rejected.
"""

from __future__ import annotations

import ast
from typing import Any

import sqlglot


# ─── SQL Validation ──────────────────────────────────────────────

# Allowed top-level statement types in sqlglot
_ALLOWED_SQL_TYPES = {
    sqlglot.exp.Select,
}


def validate_sql(sql: str) -> dict[str, Any]:
    """Validate a SQL query — only SELECT statements allowed.

    Returns:
        {"valid": True, "cleaned_sql": "..."} on success
        {"valid": False, "error": "..."} on failure
    """
    if not sql or not sql.strip():
        return {"valid": False, "error": "Empty SQL query."}

    stripped = sql.strip().rstrip(";").strip()

    # Quick keyword check
    first_word = stripped.split()[0].upper() if stripped else ""
    if first_word not in ("SELECT", "WITH", "EXPLAIN"):
        return {
            "valid": False,
            "error": f"Only SELECT queries are allowed. Got: {first_word}",
        }

    # Parse with sqlglot for deeper validation
    try:
        parsed = sqlglot.parse(stripped, dialect="duckdb")
    except sqlglot.errors.ParseError as e:
        return {"valid": False, "error": f"SQL parse error: {str(e)}"}

    if not parsed:
        return {"valid": False, "error": "No valid SQL statement found."}

    for stmt in parsed:
        if stmt is None:
            continue
        # Check for dangerous operations inside CTEs etc.
        for node in stmt.walk():
            node_type = type(node).__name__.upper()
            if node_type in (
                "INSERT", "UPDATE", "DELETE", "DROP", "CREATE",
                "ALTER", "TRUNCATE", "GRANT", "REVOKE", "COPY",
            ):
                return {
                    "valid": False,
                    "error": f"Forbidden SQL operation: {node_type}",
                }

    return {"valid": True, "cleaned_sql": stripped}


# ─── Pandas / Python Validation ──────────────────────────────────

# Nodes that are never allowed in generated pandas code
_FORBIDDEN_AST_NODES = {
    ast.Import,
    ast.ImportFrom,
}

# Function calls that are explicitly blocked
_BLOCKED_FUNCTIONS = {
    "exec", "eval", "compile", "__import__", "open",
    "getattr", "setattr", "delattr", "globals", "locals",
    "exit", "quit", "breakpoint", "input",
    "os.system", "os.popen", "subprocess.run", "subprocess.call",
    "subprocess.Popen", "subprocess.check_output",
}


def validate_pandas(code: str) -> dict[str, Any]:
    """Validate generated pandas/Python code via AST analysis.

    Returns:
        {"valid": True} on success
        {"valid": False, "error": "..."} on failure
    """
    if not code or not code.strip():
        return {"valid": False, "error": "Empty code."}

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {"valid": False, "error": f"Syntax error: {str(e)}"}

    for node in ast.walk(tree):
        # Check for forbidden node types
        if type(node) in _FORBIDDEN_AST_NODES:
            return {
                "valid": False,
                "error": f"Forbidden operation: {type(node).__name__}",
            }

        # Check for blocked function calls
        if isinstance(node, ast.Call):
            func_name = _get_func_name(node.func)
            if func_name and func_name in _BLOCKED_FUNCTIONS:
                return {
                    "valid": False,
                    "error": f"Blocked function call: {func_name}",
                }

    return {"valid": True}


def _get_func_name(node: ast.expr) -> str | None:
    """Extract the function name from a Call node's func attribute."""
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        # Handle chained attributes like os.system
        parts = []
        current = node
        while isinstance(current, ast.Attribute):
            parts.append(current.attr)
            current = current.value
        if isinstance(current, ast.Name):
            parts.append(current.id)
        return ".".join(reversed(parts))
    return None
