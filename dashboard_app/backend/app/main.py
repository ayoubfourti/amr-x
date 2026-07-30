import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import alert, auth, mission, module, robot, user


def configured_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


def rosbridge_sync_enabled() -> bool:
    return os.getenv("ROSBRIDGE_SYNC_ENABLED", "false").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


@asynccontextmanager
async def lifespan(_app: FastAPI):
    rosbridge_client = None
    if rosbridge_sync_enabled():
        from app.services.ros_bridge_client import ros_bridge_client

        rosbridge_client.start()

    try:
        yield
    finally:
        if rosbridge_client is not None:
            rosbridge_client.stop()


app = FastAPI(
    title="AMR-X Dashboard API",
    description="API for the AMR-X operator dashboard",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(robot.router)
app.include_router(mission.router)
app.include_router(module.router)
app.include_router(alert.router)
app.include_router(user.router)


@app.get("/")
def root():
    return {"message": "AMR-X Dashboard API"}
