"""Router Agent — classifies user intent to route to the correct pipeline branch.

Uses Gemini to determine whether the user wants:
- question: standard data question (SQL + narration)
- chart: visualization request
- anomaly: anomaly detection
- forecast: time-series forecast
- code_gen: show me the code
- general: greeting, help, meta-question
"""

from __future__ import annotations

from google import genai
from google.genai import types

from app.config import settings


ROUTER_SYSTEM_PROMPT = """You are a query router for a data analytics system. Given a user's message about their uploaded data, classify the intent into exactly ONE of these categories:

- "question": The user wants to query or analyze data (e.g., "What is the total revenue?", "Show me top 5 products")
- "chart": The user explicitly wants a chart or visualization (e.g., "Plot revenue by region", "Create a bar chart of sales")
- "anomaly": The user wants anomaly detection (e.g., "Find outliers", "Detect anomalies in revenue", "Any unusual patterns?")
- "forecast": The user wants a forecast or prediction (e.g., "Predict next quarter sales", "Forecast revenue trend")
- "code_gen": The user wants to see generated code (e.g., "Show me the SQL", "Write a query to...")
- "general": Greetings, help requests, or questions not about the data (e.g., "Hi", "What can you do?", "Help")

Respond with ONLY a JSON object: {"intent": "<category>", "confidence": <0.0-1.0>, "reasoning": "<brief explanation>"}
"""


def classify_intent(message: str, client: genai.Client) -> dict:
    """Classify user message intent using Gemini.

    Returns dict with keys: intent, confidence, reasoning.
    """
    import json

    try:
        response = client.models.generate_content(
            model=settings.llm_model,
            contents=f"User message: {message}",
            config=types.GenerateContentConfig(
                system_instruction=ROUTER_SYSTEM_PROMPT,
                max_output_tokens=256,
                temperature=0.0,
            ),
        )

        text = response.text or ""

        # Parse JSON from response
        cleaned = text.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0]

        result = json.loads(cleaned.strip())
        # Validate intent value
        valid_intents = {"question", "chart", "anomaly", "forecast", "code_gen", "general"}
        if result.get("intent") not in valid_intents:
            result["intent"] = "question"  # default fallback

        return result

    except Exception:
        # Default to question on any failure
        return {
            "intent": "question",
            "confidence": 0.5,
            "reasoning": "Fallback — could not classify intent.",
        }
