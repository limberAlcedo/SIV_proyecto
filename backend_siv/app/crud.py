from sqlalchemy.orm import Session
from datetime import datetime
from app import models, schemas, utils

# ---------------- USERS ----------------
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session):
    return db.query(models.User).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = utils.hash_password(user.password)
    db_user = models.User(
        username=user.username,
        name=user.name,
        email=user.email,
        password=hashed_password,
        role_id=user.role_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# ---------------- ROLES ----------------
def get_roles(db: Session):
    return db.query(models.Role).all()

def get_role(db: Session, role_id: int):
    return db.query(models.Role).filter(models.Role.id == role_id).first()

def create_role(db: Session, name: str):
    db_role = models.Role(name=name)
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

# ---------------- INCIDENTES ----------------
def get_incidentes(db: Session):
    return db.query(models.Incidente).order_by(models.Incidente.id.desc()).all()

def get_incidente(db: Session, incidente_id: int):
    return db.query(models.Incidente).filter(models.Incidente.id == incidente_id).first()

def create_incidente(db: Session, incidente: schemas.IncidenteCreate):
    db_incidente = models.Incidente(**incidente.dict())
    db_incidente.status = "Activo"
    db_incidente.created_at = datetime.utcnow()
    db.add(db_incidente)
    db.commit()
    db.refresh(db_incidente)
    return db_incidente

def update_incidente(db: Session, incidente_id: int, incidente_data: schemas.IncidenteUpdate):
    db_incidente = get_incidente(db, incidente_id)
    if not db_incidente:
        return None
    for key, value in incidente_data.dict(exclude_unset=True).items():
        setattr(db_incidente, key, value)
    db.commit()
    db.refresh(db_incidente)
    return db_incidente

def close_incidente(db: Session, incidente_id: int, cerrado_por_id: int):
    db_incidente = get_incidente(db, incidente_id)
    if not db_incidente:
        return None
    db_incidente.status = "Cerrado"
    db_incidente.closed_at = datetime.utcnow()
    db_incidente.cerrado_por_id = cerrado_por_id
    db.commit()
    db.refresh(db_incidente)
    return db_incidente

# app/crud/video.py
from sqlalchemy.orm import Session
from app import models, schemas
from datetime import datetime

# =========================
# CRUD VIDEOS
# =========================

def get_videos(db: Session):
    return db.query(models.Video).order_by(models.Video.upload_time.desc()).all()

def get_video(db: Session, video_id: int):
    return db.query(models.Video).filter(models.Video.id == video_id).first()

def create_video(db: Session, video: schemas.VideoCreate):
    if not video.upload_time:
        video.upload_time = datetime.utcnow()
    db_video = models.Video(**video.dict())
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video

def delete_video(db: Session, video_id: int):
    db_video = get_video(db, video_id)
    if not db_video:
        return False
    db.delete(db_video)
    db.commit()
    return True
