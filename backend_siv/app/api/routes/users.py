# app/api/routes/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app import crud, schemas, database, models
from app.api.routes.dependencies import get_current_user  # get_current_user que carga role

# ------------------ ROUTER ------------------
user_router = APIRouter(
    prefix="/users",
    tags=["users"]
)

# ------------------ DB ------------------
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---- Función para verificar roles ----
def check_admin_or_supervisor(user: models.User):
    if not user.role or not user.role.name:
        raise HTTPException(status_code=403, detail="No tienes permisos")
    if user.role.name.strip().lower() not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

# ---- Listar todos los usuarios ----
@user_router.get("/", response_model=list[schemas.UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_admin_or_supervisor(current_user)
    users = crud.get_users(db)
    # Convertimos role a string para evitar ResponseValidationError
    return [
        {
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "email": u.email,
            "role": u.role.name if u.role else None
        }
        for u in users
    ]

# ---- Crear usuario ----
@user_router.post("/", response_model=schemas.UserResponse)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_admin_or_supervisor(current_user)
    new_user = crud.create_user(db, user)
    return {
        "id": new_user.id,
        "username": new_user.username,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role.name if new_user.role else None
    }

# ---- Editar usuario ----
@user_router.put("/{user_id}", response_model=schemas.UserResponse)
def edit_user(
    user_id: int,
    user: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_admin_or_supervisor(current_user)
    updated_user = crud.update_user(db, user_id, user)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {
        "id": updated_user.id,
        "username": updated_user.username,
        "name": updated_user.name,
        "email": updated_user.email,
        "role": updated_user.role.name if updated_user.role else None
    }

# ---- Eliminar usuario ----
@user_router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_admin_or_supervisor(current_user)
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"detail": "Usuario eliminado"}

# ---- Listar usuarios activos (últimos 15 minutos) ----
@user_router.get("/active", response_model=list[schemas.UserResponse])
def list_active_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_admin_or_supervisor(current_user)
    usuarios_activos = db.query(models.User).filter(
        models.User.last_seen >= datetime.utcnow() - timedelta(minutes=15)
    ).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "email": u.email,
            "role": u.role.name if u.role else None
        }
        for u in usuarios_activos
    ]

# ---- Endpoint de prueba (sin JWT) ----
@user_router.get("/test", response_model=list[schemas.UserResponse])
def test_users(db: Session = Depends(get_db)):
    users = crud.get_users(db)
    return [
        {
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "email": u.email,
            "role": u.role.name if u.role else None
        }
        for u in users
    ]
