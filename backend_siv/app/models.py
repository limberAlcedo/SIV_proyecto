from sqlalchemy import Column, Integer, String, JSON, DateTime, Date, Time, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# =========================
# ROLES
# =========================
class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  
    permissions = Column(JSON, default=[])  # lista de permisos
    users = relationship("User", back_populates="role")

# =========================
# USUARIOS
# =========================
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(200), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("Role", back_populates="users")

# =========================
# INCIDENTES
# =========================
class Incidente(Base):
    __tablename__ = "incidentes"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)
    priority = Column(String(20), nullable=False)
    camera = Column(String(20), nullable=False)
    sector = Column(String(20), nullable=True)
    start_date = Column(Date, nullable=True)
    start_time = Column(Time, nullable=True)
    end_date = Column(Date, nullable=True)
    end_time = Column(Time, nullable=True)
    observacion = Column(String(250), nullable=True)
    pista = Column(JSON, nullable=False, default=[])
    senalizacion = Column(String(50), nullable=True)
    ubicacion_via = Column(String(100), nullable=True)
    trabajos_via = Column(JSON, nullable=False, default=[])
    status = Column(String(20), nullable=False, default="Activo")
    
    # Usuarios que abrieron y cerraron
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    close_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    # Relaciones opcionales para poder acceder al usuario desde el incidente
    creador = relationship("User", foreign_keys=[created_by_id], backref="incidentes_creados")
    cerrador = relationship("User", foreign_keys=[close_by_id], backref="incidentes_cerrados")

# app/models/video.py
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

# =========================
# MODELO SQLALCHEMY
# =========================
class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, nullable=False)
    filename = Column(String(200), unique=True, index=True, nullable=False)
    event_type = Column(String(50), nullable=False)
    upload_time = Column(DateTime, nullable=False)
