import requests

from app.services.ai.context_builder import (
    build_room_context
)


async def generate_room_answer(
    db,
    room_id: int,
    query: str
):

    context = await (
        build_room_context(
            db,
            room_id,
            query
        )
    )

    prompt = f"""
Room Context:
{context}

User Question:
{query}

Answer using the room context whenever relevant.
"""

    response = requests.post(

        "http://localhost:11434/api/generate",

        json={

            "model": "phi3",

            "prompt": prompt,

            "stream": False
        }
    )

    data = response.json()

    return data["response"]