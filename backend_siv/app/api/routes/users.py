# app/api/routes/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app import crud, models, schemas
from app.api.routes.dependencies import get_current_user, get_db

user_router = APIRouter()


# ---------------------------
# Auxiliar permisos
# ---------------------------
def check_admin_or_supervisor(user: models.User):
    if not user.role or user.role.name.lower() not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="No tienes permisos")


# ---------------------------
# Endpoints
# ---------------------------

# 1️⃣ Obtener usuario logueado
@user_router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.name if getattr(current_user, "role", None) else None
    }


# 2️⃣ Listar todos los usuarios (solo admin/supervisor)
@user_router.get("/", response_model=list[schemas.UserResponse])
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    check_admin_or_supervisor(current_user)
    users = crud.get_users(db)
    return [
        {
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "email": u.email,
            "role": u.role.name if getattr(u, "role", None) else None
        } for u in users
    ]


# 3️⃣ Crear usuario (solo admin/supervisor)
@user_router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    check_admin_or_supervisor(current_user)
    new_user = crud.create_user(db, user)
    return {
        "id": new_user.id,
        "username": new_user.username,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role.name if getattr(new_user, "role", None) else None
    }


# 4️⃣ Editar usuario (solo admin/supervisor)
@user_router.put("/{user_id}", response_model=schemas.UserResponse)
def edit_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    check_admin_or_supervisor(current_user)
    updated_user = crud.update_user(db, user_id, user)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {
        "id": updated_user.id,
        "username": updated_user.username,
        "name": updated_user.name,
        "email": updated_user.email,
        "role": updated_user.role.name if getattr(updated_user, "role", None) else None
    }


# 5️⃣ Eliminar usuario (solo admin/supervisor)
@user_router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    check_admin_or_supervisor(current_user)
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"detail": "Usuario eliminado"}


# 6️⃣ Listar usuarios activos (últimos 15 minutos) - solo admin/supervisor
@user_router.get("/active", response_model=list[schemas.UserResponse])
def list_active_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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
            "role": u.role.name if getattr(u, "role", None) else None
        } for u in usuarios_activos
    ]


# 7️⃣ Endpoint de prueba sin JWT
@user_router.get("/test", response_model=list[schemas.UserResponse])
def test_users(db: Session = Depends(get_db)):
    users = crud.get_users(db)
    return [
        {
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "email": u.email,
            "role": u.role.name if getattr(u, "role", None) else None
        } for u in users
    ]
