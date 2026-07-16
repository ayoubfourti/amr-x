from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import robot, mission, module, alert, user
from app.services.ros_bridge_client import ros_bridge_client
from app.db.database import Base, engine

app = FastAPI(
    title="AMR-X Dashboard API",
    description="API for the AMR-X Dashboard",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(robot.router)
app.include_router(mission.router)
app.include_router(module.router)
app.include_router(alert.router)
app.include_router(user.router)

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    ros_bridge_client.start()

@app.on_event("shutdown")
def shutdown_event():
    ros_bridge_client.stop()


@app.get("/")
def root():
    return {"message": "AMR-X Backend API fonctionne !"}
