import json
import logging

from openai import AsyncOpenAI

from app.core.config import (
    OPENAI_API_KEY,
    OPENAI_MODEL,
)

logger = logging.getLogger(__name__)

client = AsyncOpenAI(
    api_key=OPENAI_API_KEY
)


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

        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content":
                        "Return ONLY valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        raw_response = (
            response
            .choices[0]
            .message.content
            .strip()
        )

        parsed = json.loads(
            raw_response
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