from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, database, utils

auth_router = APIRouter(prefix="/auth", tags=["auth"])

# Dependencia para la sesión de DB
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Login
@auth_router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not utils.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")
    return {"email": db_user.email, "role": db_user.role}

# Registro (opcional)
@auth_router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Usuario ya existe")
    hashed_password = utils.hash_password(user.password)
    new_user = models.User(
        email=user.email,
        password=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"email": new_user.email, "role": new_user.role}
