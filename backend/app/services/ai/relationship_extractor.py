import json
import logging

from openai import AsyncOpenAI

from app.core.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_EMBEDDING_MODEL
)

logger = logging.getLogger(__name__)

client = AsyncOpenAI(
    api_key=GEMINI_API_KEY
)


async def extract_relationship(

    source_text: str,

    target_text: str
):

    print(
        "Extracting relationship between two memories with content lengths:",
        len(source_text),
        "and",
        len(target_text)
    )

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

        response = await client.chat.completions.create(

            model=GEMINI_MODEL,

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
            response.choices[0]
            .message.content
            .strip()
        )

        parsed = json.loads(
            raw_response
        )

        relationship = parsed.get(
            "relationship"
        )

        if (
            not relationship or
            relationship == "NONE"
        ):
            return None

        print(
            "Relationship extracted:",
            relationship
        )

        return relationship

    except json.JSONDecodeError:

        logger.warning(
            "relationship_invalid_json"
        )

        return None

    except Exception:

        logger.exception(
            "relationship_extraction_failed"
        )

        return None