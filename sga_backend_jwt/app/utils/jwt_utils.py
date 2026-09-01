"""
jwt_utils.py
------------
NUEVO respecto a la variante sin JWT. Genera y valida tokens de acceso
firmados con JWT_SECRET_KEY (ver app/config/settings.py). El payload
lleva únicamente lo mínimo necesario para identificar y autorizar al
usuario: id_usuario, rol_usuario y la expiración — no se incluye
información sensible (contraseña, etc.) porque un JWT NO está cifrado,
solo firmado: cualquiera puede leer su contenido, solo no puede
falsificarlo sin la clave secreta.
"""

from datetime import datetime, timedelta, timezone

import jwt

from app.config.settings import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    JWT_EXPIRE_MINUTES,
)


def crear_access_token(id_usuario: str, rol_usuario: str) -> str:

    ahora = datetime.now(timezone.utc)

    payload = {
        "sub": id_usuario,
        "rol_usuario": rol_usuario,
        "iat": ahora,
        "exp": ahora + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


class TokenInvalido(Exception):
    pass


class TokenExpirado(Exception):
    pass


def decodificar_access_token(token: str) -> dict:

    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

    except jwt.ExpiredSignatureError:
        raise TokenExpirado("El token ha expirado. Inicia sesión nuevamente.")

    except jwt.InvalidTokenError:
        raise TokenInvalido("Token inválido.")
