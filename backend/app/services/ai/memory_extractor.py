import httpx
import json
import re


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

    print("EXTRACTOR HIT")

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

        print(response.text)

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

            print(
                "NO JSON FOUND "
                "IN MODEL RESPONSE"
            )

            return {
                "should_store": False
            }

        parsed = json.loads(
            match.group()
        )

        return parsed

    except Exception as e:

        print(
            f"MEMORY EXTRACTION ERROR: {e}"
        )

        return {
            "should_store": False
        }