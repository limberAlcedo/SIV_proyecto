from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app import crud, schemas
from app.database import SessionLocal
from jose import jwt
import os
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

user_router = APIRouter(prefix="/users", tags=["users"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(authorization: str = Header(...)):
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Token inválido")

@user_router.post("/")
def create_user(user: schemas.UserCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    return crud.create_user(db, user)
