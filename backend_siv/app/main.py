from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# ------------------ Routers ------------------
from app.api.routes.auth import auth_router
from app.api.routes.users import user_router
from app.api.routes.videos import video_router
from app.api.routes.incidentes import router as incidentes_router
from app.api.routes.camara import camera_router, status_router  # <-- tu router de cámaras
from app.api.routes.auth import auth_router

# ------------------ Uploads ------------------
UPLOAD_DIR = "subido"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ------------------ App ------------------
app = FastAPI(title="SIV - Backend Local")

# ------------------ CORS ------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # cambiar a dominios específicos en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ DB ------------------
from app.database import Base, engine
Base.metadata.create_all(bind=engine)

# ------------------ Routers ------------------
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])       # Login, register, token
app.include_router(user_router, prefix="/api/users", tags=["Usuarios"])
app.include_router(video_router, prefix="/api/videos", tags=["Videos"])
app.include_router(incidentes_router, prefix="/api/incidentes", tags=["Incidentes"])
app.include_router(camera_router, prefix="/api/cam", tags=["Cámaras"])
app.include_router(status_router, prefix="/api/camera", tags=["Status Cámaras"])
app.include_router(auth_router, prefix="/api")

# ------------------ Static ------------------
app.mount("/videos", StaticFiles(directory=UPLOAD_DIR), name="videos")

# ------------------ Test ------------------
@app.get("/")
def root():
    return {"status": "Servidor SIV funcionando ✔️"}
