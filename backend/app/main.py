from fastapi import FastAPI
from sqlalchemy import text

from app.db.database import engine
from app.routes.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from app.routes.rooms import router as rooms_router

from app.routes.messages import router as messages_router

from app.websocket.chat import router as websocket_router
from app.models.join_request import (
    RoomJoinRequest
)

from contextlib import asynccontextmanager

from app.db.database import Base
from app.core.config import BACKEND_CORS_ORIGINS




@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.include_router(rooms_router)
app.include_router(messages_router)
app.include_router(websocket_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Rework backend running"}


@app.get("/db-test")
async def db_test():
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "result": result.scalar()
        }

    except Exception as e:
        return {
            "database": "failed",
            "error": str(e)
        }