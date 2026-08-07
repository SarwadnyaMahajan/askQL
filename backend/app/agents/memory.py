"""Memory Manager — session-scoped conversation memory for multi-turn context.

Uses a simple in-memory store for Phase 3.
Can be upgraded to LangGraph checkpointing or Redis in later phases.
"""

from __future__ import annotations

import threading
from typing import Any


class ConversationMemory:
    """Stores conversation history per session for multi-turn context."""

    def __init__(self, max_turns: int = 20):
        self._store: dict[str, list[dict[str, Any]]] = {}
        self._lock = threading.Lock()
        self._max_turns = max_turns

    def add_turn(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: dict | None = None,
    ) -> None:
        """Add a conversation turn."""
        with self._lock:
            if session_id not in self._store:
                self._store[session_id] = []

            self._store[session_id].append({
                "role": role,
                "content": content,
                "metadata": metadata or {},
            })

            # Keep only last N turns
            if len(self._store[session_id]) > self._max_turns:
                self._store[session_id] = self._store[session_id][-self._max_turns:]

    def get_history(self, session_id: str, last_n: int | None = None) -> list[dict]:
        """Get conversation history for a session."""
        with self._lock:
            history = self._store.get(session_id, [])
            if last_n:
                return history[-last_n:]
            return list(history)

    def get_context_summary(self, session_id: str) -> str:
        """Get a formatted context summary of recent conversation for the LLM."""
        history = self.get_history(session_id, last_n=6)
        if not history:
            return ""

        lines = ["Previous conversation context:"]
        for turn in history:
            role = turn["role"].capitalize()
            content = turn["content"][:200]
            lines.append(f"{role}: {content}")
            # Include SQL if it was in metadata
            sql = turn.get("metadata", {}).get("sql")
            if sql:
                lines.append(f"  (SQL used: {sql[:100]})")

        return "\n".join(lines)

    def clear(self, session_id: str) -> None:
        """Clear conversation history for a session."""
        with self._lock:
            self._store.pop(session_id, None)


# Singleton
memory = ConversationMemory()
