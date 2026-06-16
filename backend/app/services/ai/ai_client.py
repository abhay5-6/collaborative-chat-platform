from google import genai

from app.core.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
)

from app.services.ai.context_builder import (
    build_room_context
)

client = genai.Client(
    api_key=GEMINI_API_KEY
)


async def generate_room_answer(
    db,
    room_id: int,
    query: str,
):
    print(
        "Generating room answer for room_id:",
        room_id,
        "with query:",
        query,
    )

    context = await build_room_context(
        db=db,
        room_id=room_id,
        query=query,
    )

    prompt = f"""
You are Rework AI.

Answer questions using the room memories,
retrieved messages, and room context.

If relevant information exists in memory,
use it.

If information comes from retrieved messages,
use it.

If context is incomplete, answer normally
and clearly indicate uncertainty.

ROOM CONTEXT:

{context}

USER QUESTION:

{query}
"""

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    answer = response.text

    print(
        "Room answer generated for room_id:",
        room_id,
    )

    return answer