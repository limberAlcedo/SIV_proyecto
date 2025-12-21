# app/api/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from jose import JWTError

from app import models, database, utils

# ============================
# OAuth2 con token JWT
# ============================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ============================
# DB
# ============================
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================
# Obtener usuario actual con rol
# ============================
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Devuelve el usuario actual a partir del token JWT.
    Carga la relación User -> Role para verificar permisos.
    """
    try:
        payload = utils.decode_token(token)
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    
    # Traer usuario con rol
    user = db.query(models.User)\
             .options(joinedload(models.User.role))\
             .filter(models.User.id == user_id)\
             .first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    
    return user

# ============================
# Verificar roles permitidos
# ============================
def require_roles(*roles: str):
    """
    Verifica que el usuario actual tenga uno de los roles permitidos.
    Devuelve 403 si no cumple.
    """
    def role_checker(current_user: models.User = Depends(get_current_user)):
        # Si el usuario no tiene rol asignado
        if not current_user.role or not current_user.role.name:
            raise HTTPException(status_code=403, detail="No tienes permisos")

        role_name = current_user.role.name.strip().lower()  # Normalizamos
        allowed_roles = [r.lower() for r in roles]
        
        if role_name not in allowed_roles:
            raise HTTPException(status_code=403, detail="No tienes permisos para esta acción")
        
        return current_user
    return role_checker
