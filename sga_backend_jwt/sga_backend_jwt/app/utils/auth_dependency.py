"""
auth_dependency.py
-------------------
NUEVO respecto a la variante sin JWT. Dependencia de FastAPI que exige
un header "Authorization: Bearer <token>" válido para acceder a una
ruta. Se usa con Depends() a nivel de router (ver app/main.py y los
distintos app/routes/*.py).

IMPORTANTE — no confundir con el "código de acceso" de RN-USR-02: este
JWT es un TOKEN DE SESIÓN (se emite al iniciar sesión, identifica
"quién está usando la API ahora mismo"). El código de acceso de
RN-USR-02 es un concepto DISTINTO (una invitación de un solo uso para
que el administrador autorice el registro de un nuevo empleado) que no
se implementó en ninguna variante del backend — quedó documentado como
"regla que debe garantizar la aplicación" sin tabla ni endpoint propio.
"""

from fastapi import Header, HTTPException

from app.utils.jwt_utils import (
    decodificar_access_token,
    TokenExpirado,
    TokenInvalido,
)


def get_current_user(authorization: str = Header(default=None)) -> dict:

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Falta el header Authorization: Bearer <token>",
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = decodificar_access_token(token)

    except TokenExpirado as error:
        raise HTTPException(status_code=401, detail=str(error))

    except TokenInvalido as error:
        raise HTTPException(status_code=401, detail=str(error))

    return {
        "id_usuario": payload["sub"],
        "rol_usuario": payload["rol_usuario"],
    }
