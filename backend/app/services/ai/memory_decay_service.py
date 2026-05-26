from datetime import (
    datetime
)


def calculate_decay_factor(
    memory
):

    days_since_access = (

        datetime.utcnow()

        -

        memory.last_accessed_at
    ).days

    decay = max(

        0.3,

        1.0 - (
            days_since_access
            * 0.01
        )
    )

    return decay