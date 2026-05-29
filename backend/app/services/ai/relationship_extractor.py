import httpx
import json
import logging

from app.core.config import (
    OLLAMA_GENERATE_URL,
    OLLAMA_TIMEOUT_SECONDS
)


logger = logging.getLogger(__name__)


async def extract_relationship(

    source_text: str,

    target_text: str
):

    prompt = f"""
You are a memory relationship analyzer.

Determine whether two memories are related.

Possible relationships:

- RELATED_TO
- DEPENDS_ON
- CONTRADICTS
- IMPLEMENTS
- NONE

Respond ONLY in JSON:

{{
    "relationship": "RELATED_TO"
}}

Memory A:
{source_text}

Memory B:
{target_text}
"""

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

        data = response.json()

        cleaned_response = (

            data["response"]

            .replace("```json", "")

            .replace("```", "")

            .strip()
        )

        parsed = json.loads(
            cleaned_response
        )

        relationship = parsed.get(
            "relationship"
        )

        if relationship == "NONE":
            return None

        return relationship

    except Exception:

        logger.exception(
            "relationship_extraction_failed"
        )

        return None
