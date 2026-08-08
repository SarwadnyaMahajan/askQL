"""Router for exporting session history to PDF using WeasyPrint."""

import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

try:
    from weasyprint import HTML, CSS
except Exception:
    HTML = None

from app.agents.memory import memory
from app.security.auth import get_current_user
from app.security.rate_limiter import rate_limit

router = APIRouter(prefix="/api", tags=["export"])

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AI Data Analyst - Session Report</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }}
        h1 {{
            color: #1a1a1a;
            border-bottom: 2px solid #eaeaea;
            padding-bottom: 10px;
        }}
        .turn {{
            margin-bottom: 25px;
            padding: 15px;
            border-radius: 8px;
        }}
        .user {{
            background-color: #f8f9fa;
            border-left: 4px solid #6c757d;
        }}
        .assistant {{
            background-color: #f0f7ff;
            border-left: 4px solid #0066cc;
        }}
        .role {{
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.85em;
            margin-bottom: 5px;
            color: #555;
        }}
        .sql {{
            background-color: #282c34;
            color: #abb2bf;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            white-space: pre-wrap;
            font-size: 0.9em;
            margin-top: 10px;
        }}
    </style>
</head>
<body>
    <h1>AI Data Analyst Report</h1>
    <p>Session ID: {session_id}</p>
    <hr>
    {content}
</body>
</html>
"""

@router.get("/export/{session_id}", dependencies=[Depends(get_current_user), Depends(rate_limit)])
async def export_pdf(session_id: str):
    """Export conversation history to PDF."""
    if HTML is None:
        raise HTTPException(
            status_code=501, 
            detail="WeasyPrint is not installed or configured correctly on the server."
        )

    history = memory.get_history(session_id)
    if not history:
        raise HTTPException(status_code=404, detail="No conversation history found for this session.")

    html_content = ""
    for turn in history:
        role_class = "user" if turn["role"] == "user" else "assistant"
        role_label = "You" if turn["role"] == "user" else "AI Analyst"
        
        content = turn["content"]
        # Replace newlines with <br> for HTML rendering
        content = content.replace("\\n", "<br>")
        
        sql = turn.get("metadata", {}).get("sql", "")
        sql_block = f'<div class="sql">{sql}</div>' if sql else ""
        
        html_content += f"""
        <div class="turn {role_class}">
            <div class="role">{role_label}</div>
            <div>{content}</div>
            {sql_block}
        </div>
        """

    final_html = HTML_TEMPLATE.format(session_id=session_id, content=html_content)
    
    # Generate PDF in memory
    pdf_bytes = HTML(string=final_html).write_pdf()
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="report_{session_id}.pdf"'
        }
    )
