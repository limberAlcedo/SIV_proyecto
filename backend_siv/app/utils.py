# app/utils.py
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app import models
from app.routes.dependencies import get_db
from passlib.context import CryptContext

# Configuración de bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MAX_BCRYPT_LEN = 72
# ---------------------------
# Hash de contraseñas
# ---------------------------
MAX_BCRYPT_LEN = 72

def hash_password(password: str):
    password = password[:MAX_BCRYPT_LEN]  # truncar
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    plain_password = plain_password[:MAX_BCRYPT_LEN]  # truncar
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------
# Configuración JWT
# ---------------------------
SECRET_KEY = "CAMBIA_ESTO_POR_ALGO_MUY_SEGURO_Y_LARGO"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 día

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ---------------------------
# Crear token JWT
# ---------------------------
def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ---------------------------
# Decodificar token JWT
# ---------------------------
def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# ---------------------------
# Obtener usuario actual desde token
# ---------------------------
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autorizado, token inválido",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload:
        raise credentials_exception

    user_id = payload.get("user_id")
    if user_id is None:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise credentials_exception
    return user

# ---------------------------
# Verificación de roles
# ---------------------------
def require_roles(*roles):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if not current_user.role or current_user.role.name.lower() not in [r.lower() for r in roles]:
            raise HTTPException(status_code=403, detail="No tienes permisos")
        return current_user
    return role_checker
