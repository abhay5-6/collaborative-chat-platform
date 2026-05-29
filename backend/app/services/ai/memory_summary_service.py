import requests

from app.core.config import (
    OLLAMA_GENERATE_URL,
    OLLAMA_TIMEOUT_SECONDS
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


async def generate_memory_summary(

    db,

    room_id: int,

    topic_query: str,

    created_by: int
):

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

    response = requests.post(

        OLLAMA_GENERATE_URL,

        json={

            "model": "phi3",

            "prompt": prompt,

            "stream": False
        },
        timeout=OLLAMA_TIMEOUT_SECONDS
    )

    data = response.json()

    summary = data["response"]

    summary_embedding = (
        generate_embedding(summary)
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

    return {
        "summary": summary,
        "stored_memory_id": (
            stored_summary.id
        )
    }
