import os

from dotenv import load_dotenv


load_dotenv()


DATABASE_URL = os.getenv(
    "DATABASE_URL"
)


if not DATABASE_URL:
    raise ValueError(
        "Falta la variable DATABASE_URL"
    )


# =========================================================
# JWT (NUEVO — no existía en la variante original)
# =========================================================

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise ValueError(
        "Falta la variable JWT_SECRET_KEY"
    )

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))  # 8 horas por defecto
