# app/api/routes/videos.py
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from app import models, schemas, database, crud
from pydantic import BaseModel

# Carpeta de grabaciones dentro del backend
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "videos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Router
video_router = APIRouter(tags=["Videos"])

# Dependencia DB
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# Modelo Pydantic para respuesta
# -------------------------
class VideoListResponse(BaseModel):
    id: int
    camera_id: int
    filename: str
    event_type: str
    upload_time: datetime
    url: str

# -------------------------
# Listar videos (sin token)
# -------------------------
@video_router.get("/", response_model=list[VideoListResponse])
def list_videos(db: Session = Depends(get_db)):
    videos = crud.get_videos(db)  # Trae todos los videos de la DB
    return [
        VideoListResponse(
            id=v.id,
            camera_id=v.camera_id,
            filename=v.filename,
            event_type=v.event_type,
            upload_time=v.upload_time,
            url=f"/videos/{v.filename}"
        ) for v in videos
    ]

# -------------------------
# Registrar video (subida automática)
# -------------------------
@video_router.post("/register", response_model=VideoListResponse)
async def register_video(
    camera_id: int = Form(...),
    event_type: str = Form(...),
    video_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Nombre único para el archivo
    extension = os.path.splitext(video_file.filename)[1]
    filename = f"{uuid.uuid4()}{extension}"
    save_path = os.path.join(UPLOAD_DIR, filename)

    # Guardar el archivo
    with open(save_path, "wb") as f:
        f.write(await video_file.read())

    # Guardar info en la DB
    video_data = schemas.VideoCreate(
        camera_id=camera_id,
        filename=filename,
        event_type=event_type,
        upload_time=datetime.now()
    )
    video = crud.create_video(db, video_data)

    return VideoListResponse(
        id=video.id,
        camera_id=video.camera_id,
        filename=video.filename,
        event_type=video.event_type,
        upload_time=video.upload_time,
        url=f"/videos/{video.filename}"
    )
