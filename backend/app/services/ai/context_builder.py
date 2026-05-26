from sqlalchemy.ext.asyncio import (
    AsyncSession
)

from app.services.ai.multi_hop_graph_service import (
    multi_hop_graph_retrieval
)


async def build_room_context(

    db: AsyncSession,

    room_id: int,

    query: str
):

    memories = await (
        multi_hop_graph_retrieval(

            db=db,

            room_id=room_id,

            query=query,

            top_k=5
        )
    )

    if not memories:

        return (
            "No relevant room memories found."
        )

    domain_groups = {}

    for memory in memories:

        domain = memory.domain

        if domain not in domain_groups:

            domain_groups[domain] = []

        domain_groups[domain].append(
            memory
        )

    context_parts = []

    for domain, domain_memories in (
        domain_groups.items()
    ):

        section = [
            f"=== {domain.upper()} DOMAIN ==="
        ]

        for memory in domain_memories:

            formatted_memory = f"""
Memory Type:
{memory.memory_type}

Importance:
{memory.importance_score}

Times Referenced:
{memory.times_referenced}

Tags:
{", ".join(memory.tags)}

Content:
{memory.content}
"""

            section.append(
                formatted_memory
            )

        context_parts.append(
            "\n".join(section)
        )

    context = "\n---\n".join(
        context_parts
    )

    return context