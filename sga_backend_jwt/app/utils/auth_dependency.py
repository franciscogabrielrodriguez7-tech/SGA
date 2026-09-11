"""
auth_dependency.py
-------------------
Usa fastapi.security.HTTPBearer, que registra el esquema "HTTPBearer"
en OpenAPI: Swagger muestra el botón "Authorize" en la parte superior
de la página, se pega el JWT una sola vez y queda aplicado a todos los
endpoints protegidos.
"""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.utils.jwt_utils import (
    decodificar_access_token,
    TokenExpirado,
    TokenInvalido,
)

# auto_error=False: si falta el header, lanzamos NOSOTROS un 401
# con nuestro propio formato de mensaje, no el genérico de FastAPI.
_bearer_scheme = HTTPBearer(auto_error=False)


class UsuarioActual:
    """
    Representa al usuario identificado por el JWT de la petición
    actual. Se usa tanto para lógica de negocio (auditoría: quién
    hizo qué -> ver app/utils/audit_context.py) como para
    autorización por rol (ver roles.py).
    """

    def __init__(self, id_usuario: str, rol_usuario: str):
        self.id_usuario = id_usuario
        self.rol_usuario = rol_usuario


def get_current_user(
    credenciales: HTTPAuthorizationCredentials = Depends(_bearer_scheme)
) -> UsuarioActual:

    if credenciales is None:
        raise HTTPException(
            status_code=401,
            detail="Falta el header Authorization: Bearer <token>",
        )

    token = credenciales.credentials

    try:
        payload = decodificar_access_token(token)

    except TokenExpirado as error:
        raise HTTPException(status_code=401, detail=str(error))

    except TokenInvalido as error:
        raise HTTPException(status_code=401, detail=str(error))

    return UsuarioActual(
        id_usuario=payload["sub"],
        rol_usuario=payload["rol_usuario"],
    )
