from openai import AsyncOpenAI

from app.core.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_EMBEDDING_MODEL
)

from app.services.ai.retrieval_service import (
    search_room_memories
)

from app.services.ai.memory_service import (
    create_room_memory
)

from app.services.ai.embedding_service import (
    generate_embedding
)

client = AsyncOpenAI(
    api_key=GEMINI_API_KEY
)


async def generate_memory_summary(

    db,

    room_id: int,

    topic_query: str,

    created_by: int
):

    print(
        "Generating memory summary for room_id:",
        room_id,
        "with topic_query:",
        topic_query
    )

    memories = await (
        search_room_memories(

            db=db,

            room_id=room_id,

            query=topic_query,

            top_k=10
        )
    )

    if not memories:
        return None

    memory_text = "\n".join(

        [
            f"- {memory.content}"
            for memory in memories
        ]
    )

    prompt = f"""
You are an AI project memory summarizer.

Summarize the following memories into:

- key decisions
- architecture choices
- implementation conventions
- important conclusions

Keep summary concise but information-dense.

Memories:
{memory_text}
"""

    response = await client.chat.completions.create(

        model=GEMINI_MODEL,

        temperature=0,

        messages=[
            {
                "role": "system",
                "content":
                    "You are an AI project memory summarizer."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    summary = (
        response.choices[0]
        .message.content
        .strip()
    )

    summary_embedding = await (
        generate_embedding(
            summary
        )
    )

    stored_summary = await (
        create_room_memory(

            db=db,

            room_id=room_id,

            created_by=created_by,

            content=summary,

            embedding=summary_embedding,

            memory_type="summary",

            importance_score=5,

            tags=[
                "summary",
                topic_query
            ]
        )
    )

    await db.commit()

    print(
        "Memory summary generated and stored with id:",
        stored_summary.id,
        "in room_id:",
        room_id
    )

    return {
        "summary": summary,
        "stored_memory_id":
            stored_summary.id
    }