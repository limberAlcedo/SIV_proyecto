import os
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from app import crud, schemas, database
from fastapi import APIRouter

router = APIRouter(prefix="/videos", tags=["videos"])
# app/api/routes/videos.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import schemas, crud, database

# ---------------------------
# Dependencia DB
# ---------------------------
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------
# Router videos
# ---------------------------
video_router = APIRouter(prefix="/videos", tags=["videos"])

@video_router.post("/", response_model=schemas.VideoResponse)
def upload_video(video: schemas.VideoCreate, db: Session = Depends(get_db)):
    return crud.create_video(db, video)

@video_router.get("/", response_model=list[schemas.VideoResponse])
def list_videos(db: Session = Depends(get_db)):
    return crud.get_videos(db)


# =========================
# Registrar video de YOLO
# =========================
@router.post("/register", response_model=schemas.VideoResponse)
async def register_video(
    camera_id: int = Form(...),
    event_type: str = Form(...),
    video_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Nombre único
    extension = os.path.splitext(video_file.filename)[1]
    filename = f"{uuid.uuid4()}{extension}"
    save_path = os.path.join(UPLOAD_DIR, filename)

    # Guardar archivo
    with open(save_path, "wb") as f:
        f.write(await video_file.read())

    video_data = schemas.VideoCreate(
        camera_id=camera_id,
        filename=filename,
        event_type=event_type,
        upload_time=datetime.now()
    )
    return crud.create_video(db, video_data)

# =========================
# Listar videos para frontend
# =========================
@router.get("/", response_model=list[schemas.VideoResponse])
def list_videos(db: Session = Depends(get_db)):
    videos = crud.get_videos(db)
    return [
        {
            "id": v.id,
            "camera_id": v.camera_id,
            "event_type": v.event_type,
            "upload_time": v.upload_time,
            "url": f"/subido/{v.filename}"
        } for v in videos
    ]


