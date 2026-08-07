"""Chart Agent — generates Plotly JSON specs from query results.

Uses Gemini to auto-select chart type and produce a Plotly spec
that the frontend can render directly.
"""

from __future__ import annotations

import json

from google import genai
from google.genai import types

from app.config import settings

CHART_SYSTEM_PROMPT = """You are a data visualization expert. Given query results and the user's question, generate a Plotly.js chart specification.

RULES:
1. Auto-select the best chart type based on data shape and user intent:
   - Bar chart: comparing categories
   - Line chart: trends over time
   - Pie chart: proportions/percentages (≤10 categories)
   - Scatter plot: correlations between numeric variables
   - Horizontal bar: ranking/leaderboard
2. Use clean, professional styling with these colors:
   - Primary: #6366F1 (indigo)
   - Secondary palette: #818CF8, #A5B4FC, #C7D2FE, #10B981, #F59E0B, #EF4444
3. Include clear axis labels and a descriptive title.
4. Set a white background with subtle gridlines.
5. Limit legends and annotations to what's necessary.

Respond with ONLY a JSON object:
{
    "chart_type": "bar|line|pie|scatter|hbar",
    "data": [<Plotly trace objects>],
    "layout": {<Plotly layout object>}
}
"""


from app.services.llm_service import generate_llm


def generate_chart_spec(
    query: str,
    rows: list[dict],
    columns: list[str],
    client: genai.Client,
) -> dict | None:
    """Generate a Plotly chart spec from query results.

    Returns a dict with chart_type, data, and layout keys, or None if not chart-worthy.
    """
    if not rows or len(rows) == 0:
        return None

    # Truncate for LLM context
    display_rows = rows[:50]
    results_text = json.dumps(display_rows, indent=2, default=str)

    prompt = f"""User question: {query}

Columns: {columns}
Number of rows: {len(rows)}

Sample data (first {min(len(rows), 50)} rows):
{results_text}

Generate a Plotly.js chart specification to visualize this data. Return ONLY valid JSON."""

    try:
        text = generate_llm(
            client=client,
            contents=prompt,
            system_instruction=CHART_SYSTEM_PROMPT,
            max_output_tokens=2048,
            temperature=0.2,
            json_mode=True,
        )

        # Parse JSON
        cleaned = text
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0]

        spec = json.loads(cleaned.strip())

        # Validate required keys
        if "data" not in spec:
            return None

        return {
            "chart_type": spec.get("chart_type", "bar"),
            "data": spec["data"],
            "layout": spec.get("layout", {}),
        }

    except Exception:
        return None
