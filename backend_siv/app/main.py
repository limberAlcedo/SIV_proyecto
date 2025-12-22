from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api.routes.auth import auth_router
from app.api.routes.users import user_router
from app.api.routes.videos import video_router
from app.api.routes.incidentes import router as incidentes_router
from app.api.camara import camera_router, status_router

# Carpeta de grabaciones
VIDEOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "videos", "grabaciones")
os.makedirs(VIDEOS_DIR, exist_ok=True)

app = FastAPI(title="SIV - Backend Local")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#
# Routers
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(user_router, prefix="/api/users", tags=["Usuarios"])
app.include_router(video_router, prefix="/api/videos", tags=["Videos"])
app.include_router(incidentes_router, prefix="/api/incidentes", tags=["Incidentes"])
app.include_router(camera_router, prefix="/api", tags=["Cámaras"])
app.include_router(status_router, prefix="/api", tags=["Status Cámaras"])

# Montar carpeta de grabaciones como estático
app.mount("/videos", StaticFiles(directory=VIDEOS_DIR), name="videos")

@app.get("/")
def root():
    return {"status": "Servidor SIV funcionando ✔️"}
