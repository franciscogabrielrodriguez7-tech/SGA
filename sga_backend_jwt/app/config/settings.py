import os

from dotenv import load_dotenv


load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("Falta la variable DATABASE_URL")


# =========================================================
# JWT
# =========================================================

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise ValueError("Falta la variable JWT_SECRET_KEY")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))  # 8 horas por defecto


# =========================================================
# CORS
# =========================================================

# Cadena separada por comas, ej: "http://localhost:5173,http://127.0.0.1:5173"
_cors_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
)
CORS_ORIGINS: list[str] = [
    origin.strip() for origin in _cors_raw.split(",") if origin.strip()
]
