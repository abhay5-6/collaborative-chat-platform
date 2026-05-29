import httpx
import json
import logging

from app.core.config import (
    OLLAMA_GENERATE_URL,
    OLLAMA_TIMEOUT_SECONDS
)

logger = logging.getLogger(__name__)


async def extract_memory_from_text(
    text: str
):

    prompt = f"""
Extract reusable long-term memory from the conversation.

Store:
- useful knowledge
- important facts
- preferences
- goals
- plans
- decisions
- agreements
- recurring interests
- learning progress

Return ONLY valid JSON.

Schema:

{{
  "should_store": true,
  "memory_type": "knowledge",
  "domain": "general",
  "importance_score": 3,
  "tags": [],
  "content": "memory text"
}}

If not important:

{{
  "should_store": false
}}

Rules:
- should_store must be true or false
- importance_score must be integer 1-5
- content must be a string
- tags must be an array of strings
- do not nest objects
- do not explain anything
- output only JSON

Conversation:
{text}
"""

    logger.info(
        "memory_extractor_started"
    )

    try:

        async with httpx.AsyncClient() as client:

            response = await client.post(

                OLLAMA_GENERATE_URL,

                json={
                    "model": "phi3",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },

                timeout=OLLAMA_TIMEOUT_SECONDS
            )

        data = response.json()

        raw_response = data.get(
            "response",
            ""
        )

        parsed = json.loads(
            raw_response.strip()
        )

        parsed.setdefault(
            "should_store",
            False
        )

        parsed.setdefault(
            "memory_type",
            "knowledge"
        )

        parsed.setdefault(
            "domain",
            "general"
        )

        parsed.setdefault(
            "importance_score",
            3
        )

        parsed.setdefault(
            "tags",
            []
        )

        parsed.setdefault(
            "content",
            ""
        )

        try:
            parsed["importance_score"] = int(
                parsed["importance_score"]
            )
        except Exception:
            parsed["importance_score"] = 3

        parsed["content"] = str(
            parsed["content"]
        )

        if not isinstance(
            parsed["tags"],
            list
        ):
            parsed["tags"] = []

        print(
            "EXTRACTION RESULT:",
            parsed
        )

        return parsed

    except json.JSONDecodeError:

        logger.warning(
            "memory_extractor_invalid_json"
        )

        return {
            "should_store": False
        }

    except Exception:

        logger.exception(
            "memory_extraction_failed"
        )

        return {
            "should_store": False
        }