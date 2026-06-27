from datetime import datetime
from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.room_task import RoomTask
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/rooms", tags=["Tasks"])

@router.get("/{room_id}/tasks")
async def get_room_tasks(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    query = select(RoomTask).where(RoomTask.room_id == room_id).order_by(RoomTask.created_at.desc())
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    return [
        {
            "id": t.id,
            "description": t.description,
            "assignee_username": t.assignee_username,
            "completed": t.completed,
            "created_at": t.created_at,
            "completed_at": t.completed_at
        }
        for t in tasks
    ]

@router.patch("/{room_id}/tasks/{task_id}")
async def update_room_task(
    room_id: int,
    task_id: int,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    query = select(RoomTask).where(RoomTask.id == task_id, RoomTask.room_id == room_id)
    result = await db.execute(query)
    task = result.scalars().first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if "completed" in payload:
        task.completed = payload["completed"]
        if task.completed:
            task.completed_at = datetime.utcnow()
        else:
            task.completed_at = None
            
    await db.commit()
    
    return {
        "id": task.id,
        "description": task.description,
        "assignee_username": task.assignee_username,
        "completed": task.completed,
        "created_at": task.created_at,
        "completed_at": task.completed_at
    }
