from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from app import models, schemas, database, utils

auth_router = APIRouter(tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@auth_router.post("/login")
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


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = utils.decode_token(token)
        username: str = payload.get("sub")

        if not username:
            raise HTTPException(status_code=401, detail="Token inválido")

    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(models.User).filter(
        models.User.username == username
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Usuario no existe")

    return user
# /Users/limberalcedo/Desktop/Proyecto/SIV_proyecto/backend_siv/app/api/routes/auth.py