from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import robot, mission, module, alert, user, auth

app = FastAPI(
    title="AMR-X Dashboard API",
    description="API pour le dashboard du robot AMR-X",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
    return {"message": "AMR-X Backend API fonctionne !"}
