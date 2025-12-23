from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ---------------------------
# URL de conexión a MySQL local
# ---------------------------
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://siv_user:A.Alcedo2705@localhost:3306/Siv"

# ---------------------------
# Motor de SQLAlchemy
# ---------------------------
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
)
# ---------------------------
# Sesión
# ---------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ---------------------------
# Base de modelos
# ---------------------------
Base = declarative_base()

# ---------------------------
# Inicializar DB
# ---------------------------
def init_db():
    from . import models
    Base.metadata.create_all(bind=engine)

# ---------------------------
# Dependency CORRECTA
# ---------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

