# backend_siv/app/schemas.py
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True  # Antes era orm_mode en Pydantic v2
