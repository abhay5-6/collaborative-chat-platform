import httpx
import json
import logging
import re

from app.core.config import (
    OLLAMA_GENERATE_URL,
    OLLAMA_TIMEOUT_SECONDS
)


logger = logging.getLogger(__name__)


async def extract_memory_from_text(
    text: str
):

    prompt = f"""
You are an AI memory extraction system.

Analyze the following conversation text.

Determine whether it contains:
- important decisions
- architecture discussions
- project knowledge
- implementation details
- reusable insights
- determine the primary knowledge domain

If important, return JSON in this format:

{{
  "should_store": true,
  "memory_type": "...",
  "domain": "...",
  "importance_score": 1-5,
  "tags": ["..."],
  "content": "..."
}}

If not important:

{{
  "should_store": false
}}

Conversation:
{text}
"""

    logger.info("memory_extractor_started")

    try:

        async with httpx.AsyncClient() as client:

            response = await client.post(

                OLLAMA_GENERATE_URL,

                json={

                    "model": "phi3",

                    "prompt": prompt,

                    "stream": False
                },

                timeout=OLLAMA_TIMEOUT_SECONDS
            )

        logger.debug(
            "memory_extractor_raw_response",
            extra={
                "response_text": response.text
            }
        )

        data = response.json()

        raw_response = data.get(
            "response",
            ""
        )

        match = re.search(

            r"\{.*\}",

            raw_response,

            re.DOTALL
        )

        if not match:

            logger.warning(
                "memory_extractor_no_json_found"
            )

            return {
                "should_store": False
            }

        parsed = json.loads(
            match.group()
        )

        return parsed

    except Exception:

        logger.exception(
            "memory_extraction_failed"
        )

        return {
            "should_store": False
        }
