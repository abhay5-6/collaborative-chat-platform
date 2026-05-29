from openai import AsyncOpenAI

from app.core.config import (
    OPENAI_API_KEY,
    OPENAI_MODEL
)

from app.services.ai.context_builder import (
    build_room_context
)

client = AsyncOpenAI(
    api_key=OPENAI_API_KEY
)


async def generate_room_answer(
    db,
    room_id: int,
    query: str
):
    print(
        "Generating room answer for room_id:",
        room_id,
        "with query:",
        query
    )

    context = await build_room_context(
        db,
        room_id,
        query
    )

    completion = await client.chat.completions.create(

        model=OPENAI_MODEL,

        messages=[
            {
                "role": "system",
                "content":
                """
                You are Rework AI.

                Answer questions using the room
                memories and room context.

                If relevant information exists
                in memory, use it.

                If memory is incomplete,
                answer normally while making
                it clear what comes from memory.
                """
            },
            {
                "role": "user",
                "content":
                f"""
                Room Context:

                {context}

                User Question:

                {query}
                """
            }
        ],

        temperature=0.3
    )

    answer = (
        completion
        .choices[0]
        .message
        .content
    )

    print(
        "Room answer generated for room_id:",
        room_id
    )

    return answer