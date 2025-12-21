# =========================
# main.py
# =========================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Routers
from app.api.routes.auth import auth_router
from app.api.routes.users import user_router
from app.api.routes.videos import video_router
from app.api.routes.incidentes import router as incidentes_router
from app.api.routes.camara import camera_router, status_router

# Carpeta de grabaciones (dentro de backend_siv/videos/grabaciones)
VIDEOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "videos", "grabaciones")
os.makedirs(VIDEOS_DIR, exist_ok=True)

# =========================
# Inicializar app
# =========================
app = FastAPI(title="SIV - Backend Local")

# =========================
# Middleware
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puedes restringir a tus dominios en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Routers
# =========================
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(user_router, prefix="/api/users", tags=["Usuarios"])
app.include_router(video_router, prefix="/api/videos", tags=["Videos"])
app.include_router(incidentes_router, prefix="/api/incidentes", tags=["Incidentes"])
app.include_router(camera_router, prefix="/api/cameras", tags=["Cámaras"])
app.include_router(status_router, prefix="/api/cameras/status", tags=["Status Cámaras"])
# main.py
app.include_router(camera_router, prefix="/api/cameras")
app.include_router(status_router, prefix="/api/cameras")
app.include_router(status_router, prefix="/api")



from app.api.routes.camara import camera_router, status_router

app.include_router(camera_router, prefix="/api")
app.include_router(status_router, prefix="/api")

# =========================
# Carpeta de videos estáticos
# =========================
app.mount("/videos", StaticFiles(directory=VIDEOS_DIR), name="videos")

# =========================
# Ruta raíz
# =========================
@app.get("/")
def root():
    return {"status": "Servidor SIV funcionando ✔️"}
