from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, time

# =========================
# USUARIOS
# =========================
class UserBase(BaseModel):
    username: str
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "operador"

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
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None

# =========================
# INCIDENTES
# =========================
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
    pista: Optional[List[str]] = []
    senalizacion: Optional[str] = None
    ubicacion_via: Optional[str] = None
    trabajos_via: Optional[List[str]] = []
    status: Optional[str] = "Activo"

class IncidenteCreate(IncidenteBase):
    created_by_id: Optional[int] = None

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
    pista: Optional[List[str]] = None
    senalizacion: Optional[str] = None
    ubicacion_via: Optional[str] = None
    trabajos_via: Optional[List[str]] = None
    status: Optional[str] = None
    closed_at: Optional[datetime] = None
    close_by_id: Optional[int] = None

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class IncidenteResponse(BaseModel):
    id: int
    type: str
    priority: str           # <-- agregar
    status: str
    observacion: Optional[str]
    created_by_id: Optional[int]
    close_by_id: Optional[int]
    created_by_name: Optional[str] = None
    closed_by_name: Optional[str] = None
    pista: List = []
    trabajos_via: List = []
    created_at: datetime
    closed_at: Optional[datetime]

    class Config:
        orm_mode = True



# app/schemas/video.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# =========================
# SCHEMAS Pydantic
# =========================
class VideoBase(BaseModel):
    camera_id: int
    filename: str
    event_type: str

class VideoCreate(VideoBase):
    upload_time: Optional[datetime] = None  # se asigna automáticamente si no se pasa

class VideoResponse(VideoBase):
    id: int
    upload_time: datetime

    class Config:
        orm_mode = True
