"""Sessions router — user session list, history retrieval, and session management."""

from __future__ import annotations

import json
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.models.db_models import User, SessionModel, UploadedFile, ChatMessage, get_db
from app.security.auth import get_current_user
from app.services.duckdb_service import duckdb_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("", response_model=list[dict[str, Any]])
async def list_user_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all dataset sessions and uploaded files for the logged-in user."""
    stmt = (
        select(SessionModel)
        .where(SessionModel.user_id == current_user.id)
        .order_by(SessionModel.created_at.desc())
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()

    session_list = []
    for sess in sessions:
        files_stmt = select(UploadedFile).where(UploadedFile.session_id == sess.id)
        files_res = await db.execute(files_stmt)
        uploaded_files = files_res.scalars().all()

        files_info = []
        for uf in uploaded_files:
            file_data = {
                "session_id": sess.id,
                "file_name": uf.filename,
                "filename": uf.filename,
                "row_count": uf.row_count,
                "column_count": uf.column_count,
            }
            if uf.file_summary:
                try:
                    summary_dict = json.loads(uf.file_summary)
                    file_data.update(summary_dict)
                except Exception:
                    pass
            files_info.append(file_data)

        if files_info:
            session_list.append({
                "session_id": sess.id,
                "created_at": sess.created_at.isoformat() if sess.created_at else None,
                "files": files_info,
            })

    return session_list


@router.get("/{session_id}/history", response_model=dict[str, Any])
async def get_session_history(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve chat history and reload dataset schema for a specific session."""
    sess_stmt = select(SessionModel).where(
        SessionModel.id == session_id, SessionModel.user_id == current_user.id
    )
    sess_res = await db.execute(sess_stmt)
    session_obj = sess_res.scalars().first()

    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied.",
        )

    # Ensure DuckDB tables are restored from disk
    duckdb_service.restore_session_from_disk(session_id)

    # Fetch chat messages
    msg_stmt = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    msg_res = await db.execute(msg_stmt)
    messages = msg_res.scalars().all()

    formatted_history = []
    for msg in messages:
        item = {
            "role": msg.role,
            "content": msg.content,
            "sql_query": msg.sql_query,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
        if msg.extra_data:
            try:
                extra = json.loads(msg.extra_data)
                item.update(extra)
            except Exception:
                pass
        formatted_history.append(item)

    # Fetch files
    files_stmt = select(UploadedFile).where(UploadedFile.session_id == session_id)
    files_res = await db.execute(files_stmt)
    uploaded_files = files_res.scalars().all()
    file_summaries = []
    for uf in uploaded_files:
        fd = {
            "session_id": session_id,
            "file_name": uf.filename,
            "filename": uf.filename,
            "row_count": uf.row_count,
            "column_count": uf.column_count,
        }
        if uf.file_summary:
            try:
                fd.update(json.loads(uf.file_summary))
            except Exception:
                pass
        file_summaries.append(fd)

    return {
        "session_id": session_id,
        "files": file_summaries,
        "history": formatted_history,
    }


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a session, its files, and conversation history."""
    sess_stmt = select(SessionModel).where(
        SessionModel.id == session_id, SessionModel.user_id == current_user.id
    )
    sess_res = await db.execute(sess_stmt)
    session_obj = sess_res.scalars().first()

    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied.",
        )

    # Remove from DB
    await db.execute(delete(ChatMessage).where(ChatMessage.session_id == session_id))
    await db.execute(delete(UploadedFile).where(UploadedFile.session_id == session_id))
    await db.execute(delete(SessionModel).where(SessionModel.id == session_id))
    await db.commit()

    # Remove from DuckDB memory
    duckdb_service.remove(session_id)
