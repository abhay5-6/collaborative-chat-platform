import httpx
import json


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

                "http://localhost:11434/api/generate",

                json={

                    "model": "phi3",

                    "prompt": prompt,

                    "stream": False
                },

                timeout=120
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

    except Exception as e:

        print(
            "RELATIONSHIP ERROR:",
            e
        )

        return None