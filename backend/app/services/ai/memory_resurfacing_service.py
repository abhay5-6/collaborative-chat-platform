def calculate_resurfacing_boost(

    similarity,

    memory
):

    if similarity < 0.8:
        return 1.0

    if memory.importance_score >= 4:

        return 1.3

    if memory.access_count >= 10:

        return 1.2

    return 1.0