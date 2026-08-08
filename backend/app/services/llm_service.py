"""LLM Service — handles LLM requests with automatic fallback from Gemini to Groq."""

from __future__ import annotations

import logging
from typing import Any

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger("llm_service")

_groq_client = None

def _get_groq_client():
    global _groq_client
    import os
    groq_key = settings.groq_api_key or os.getenv("GROQ_API_KEY", "")
    
    # Try reading from .env if still empty
    if not groq_key:
        try:
            from dotenv import load_dotenv
            load_dotenv()
            groq_key = os.getenv("GROQ_API_KEY", "")
        except Exception:
            pass

    if not groq_key:
        return None

    if _groq_client is None:
        try:
            from groq import Groq
            _groq_client = Groq(api_key=groq_key)
        except Exception as e:
            logger.warning(f"Failed to initialize Groq client: {e}")
            return None
    return _groq_client


def generate_llm(
    client: genai.Client,
    contents: str,
    system_instruction: str | None = None,
    max_output_tokens: int = 4096,
    temperature: float = 0.0,
    json_mode: bool = False,
    model: str | None = None,
) -> str:
    """Generate content using Gemini, falling back to Groq if Gemini fails.

    Returns the raw string output from whichever model succeeds.
    """
    import time

    target_model = model or settings.llm_model
    gemini_last_err = None

    # 1. Try Primary: Google Gemini
    for attempt in range(2):
        try:
            config_kwargs: dict[str, Any] = {
                "max_output_tokens": max_output_tokens,
                "temperature": temperature,
            }
            if system_instruction:
                config_kwargs["system_instruction"] = system_instruction
            if json_mode:
                config_kwargs["response_mime_type"] = "application/json"

            response = client.models.generate_content(
                model=target_model,
                contents=contents,
                config=types.GenerateContentConfig(**config_kwargs),
            )
            if response.text:
                return response.text
        except Exception as gemini_err:
            gemini_last_err = gemini_err
            err_str = str(gemini_err)
            if "429" in err_str and attempt == 0:
                logger.warning("[LLM Service] Gemini 429 rate limit hit. Pausing 2.5s before retrying Gemini...")
                time.sleep(2.5)
                continue

            logger.warning(
                f"[LLM Fallback Triggered] Gemini error: {gemini_err}. Attempting fallback to Groq ({settings.groq_model})."
            )
            break

    # 2. Try Fallback: Groq
    groq_client = _get_groq_client()
    if groq_client:
        try:
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": contents})

            extra_args = {}
            if json_mode:
                extra_args["response_format"] = {"type": "json_object"}

            completion = groq_client.chat.completions.create(
                model=settings.groq_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_output_tokens,
                **extra_args,
            )

            content = completion.choices[0].message.content or ""
            logger.info(f"[LLM Fallback Success] Successfully generated response via Groq ({settings.groq_model}).")
            return content
        except Exception as groq_err:
            logger.error(f"[LLM Fallback Failed] Groq error: {groq_err}.")
            if gemini_last_err:
                raise gemini_last_err from groq_err
            raise groq_err
    elif gemini_last_err:
        raise gemini_last_err

    return ""
