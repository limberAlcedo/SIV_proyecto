from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, time, timedelta

# ======================
# USUARIOS
# ======================
# ======================
# USERS
# ======================
class UserBase(BaseModel):
    username: str
    name: str          # nombre completo obligatorio
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "operador"

# Login con username
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    role: str

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None  # opcional en update
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None

# ======================
# INCIDENTES
# ======================
class IncidenteBase(BaseModel):
    type: str
    priority: str
    camera: str
    sector: Optional[str] = None
    start_date: Optional[date] = None
    start_time: Optional[time] = None
    end_date: Optional[date] = None
    end_time: Optional[time] = None
    observacion: Optional[str] = None
    pista: Optional[List] = []
    senalizacion: Optional[str] = None
    ubicacion_via: Optional[str] = None
    trabajos_via: Optional[List] = []
    status: Optional[str] = "Activo"

class IncidenteCreate(IncidenteBase):
    created_by_id: Optional[int] = None
    created_by: Optional[str] = None

class IncidenteUpdate(BaseModel):
    type: Optional[str] = None
    priority: Optional[str] = None
    camera: Optional[str] = None
    sector: Optional[str] = None
    start_date: Optional[date] = None
    start_time: Optional[time] = None
    end_date: Optional[date] = None
    end_time: Optional[time] = None
    observacion: Optional[str] = None
    pista: Optional[List] = None
    senalizacion: Optional[str] = None
    ubicacion_via: Optional[str] = None
    trabajos_via: Optional[List] = None
    status: Optional[str] = None
    closed_at: Optional[datetime] = None
    cerrado_por_id: Optional[int] = None

class IncidenteResponse(IncidenteBase):
    id: int
    created_at: datetime
    created_by: Optional[str] = None
    created_by_id: Optional[int] = None
    cerrado_por_id: Optional[int] = None
    closed_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# ======================
# VIDEOS
# ======================
from pydantic import BaseModel
from datetime import datetime

class VideoBase(BaseModel):
    camera_id: int
    filename: str
    event_type: str
    upload_time: datetime

class VideoCreate(VideoBase):
    pass

class VideoResponse(VideoBase):
    id: int

    class Config:
        orm_mode = True
