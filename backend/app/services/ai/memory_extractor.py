import json
import logging

from openai import AsyncOpenAI

from app.core.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
)

logger = logging.getLogger(__name__)

client = AsyncOpenAI(
    api_key=GEMINI_API_KEY
)


async def extract_memory_from_text(
    text: str
):

    prompt = f"""
Extract reusable knowledge from this message.

Create a memory ONLY if the message contains:

- decisions
- plans
- goals
- facts
- preferences
- agreements
- architecture choices
- project knowledge
- recurring interests
- important learnings

Return ONLY valid JSON.

Schema:

{{
  "memory_type": "knowledge",
  "domain": "general",
  "importance_score": 3,
  "tags": [],
  "content": "memory text"
}}

Return null if there is no useful knowledge.

Rules:
- importance_score must be integer 1-5
- content must be concise
- tags must be array of strings
- do not nest objects
- do not explain anything
- output only JSON or null

Message:
{text}
"""

    logger.info(
        "memory_extractor_started"
    )

    try:

        response = await client.chat.completions.create(
            model=GEMINI_MODEL,
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content":
                        "Return ONLY valid JSON or null."
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

        if (
            raw_response.lower()
            == "null"
        ):
            return None

        parsed = json.loads(
            raw_response
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
        ).strip()

        if not isinstance(
            parsed["tags"],
            list
        ):
            parsed["tags"] = []

        if not parsed["content"]:
            return None

        logger.info(
            "memory_extractor_finished"
        )

        return parsed

    except json.JSONDecodeError:

        logger.warning(
            "memory_extractor_invalid_json"
        )

        return None

    except Exception:

        logger.exception(
            "memory_extraction_failed"
        )

        return None