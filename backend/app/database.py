from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# --- Configuración de la base de datos ---
# URL de conexión a PostgreSQL (usuario, contraseña, host, puerto y nombre de BD)
DATABASE_URL = "postgresql://postgres:73hfbis8hdbjf@localhost:5432/sga_db"

# --- Motor de conexión ---
# Se encarga de establecer la comunicación con la base de datos
engine = create_engine(DATABASE_URL)

# --- Sesión de trabajo ---
# SessionLocal crea sesiones para interactuar con la BD
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Base declarativa ---
# Base sobre la cual se definen los modelos (clases -> tablas)
Base = declarative_base()

# --- Dependencia de sesión ---
# Se usa en los endpoints para obtener y cerrar la conexión a la BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
