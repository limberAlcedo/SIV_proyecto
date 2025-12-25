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

#########################
#
#Endpint para grabar videos automaticos
#
########################}
# app/routers/video.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud
from app.database import get_db

router = APIRouter(prefix="/videos", tags=["Videos"])

# =========================
# ENDPOINTS VIDEO
# =========================

@router.post("/", response_model=schemas.VideoResponse)
def create_video(video: schemas.VideoCreate, db: Session = Depends(get_db)):
    db_video = crud.create_video(db, video)
    return db_video

@router.get("/", response_model=list[schemas.VideoResponse])
def list_videos(db: Session = Depends(get_db)):
    return crud.get_videos(db)

@router.get("/{video_id}", response_model=schemas.VideoResponse)
def get_video(video_id: int, db: Session = Depends(get_db)):
    db_video = crud.get_video(db, video_id)
    if not db_video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    return db_video

@router.delete("/{video_id}")
def delete_video(video_id: int, db: Session = Depends(get_db)):
    success = crud.delete_video(db, video_id)
    if not success:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    return {"detail": "Video eliminado"}
