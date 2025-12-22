# app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas, database, utils

auth_router = APIRouter(tags=["auth"])

# Dependencia para la sesión de DB
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------
# Login
# ---------------------------
@auth_router.post("/login", response_model=schemas.TokenResponse)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(
        models.User.username == user.username
    ).first()

    if not db_user or not utils.verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )

    role_name = db_user.role.name if db_user.role else None

    access_token = utils.create_access_token({
        "sub": db_user.username,
        "user_id": db_user.id,
        "role_id": db_user.role_id,
        "roles": role_name
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "role_id": db_user.role_id,
            "role_name": role_name
        }
    }

# ---------------------------
# Obtener usuario actual desde token
# ---------------------------
@auth_router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(utils.get_current_user)):
    """
    Endpoint para obtener datos del usuario logueado
    """
    return current_user
