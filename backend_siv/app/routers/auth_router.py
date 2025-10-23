from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, database, crud

auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    # Lógica de login
    return {"message": "Login correcto"}
