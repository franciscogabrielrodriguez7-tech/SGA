"""
auth_dependency.py
-------------------
CORREGIDO respecto a la versión anterior: antes usaba un parámetro
`Header(default=None)` crudo para leer "Authorization". Eso NO registra
ningún esquema de seguridad en el spec de OpenAPI, así que Swagger jamás
mostraba el botón "Authorize" (candado) — cada endpoint solo mostraba un
campo de texto genérico llamado "authorization" en el formulario de
"Try it out", lo cual no cumple el requisito de poder autenticar una vez
y probar todos los endpoints protegidos desde Swagger.

Ahora se usa `fastapi.security.HTTPBearer`, que SÍ registra el esquema
"HTTPBearer" en OpenAPI. Con esto, Swagger muestra el botón "Authorize"
en la parte superior de la página: se pega el JWT una sola vez y queda
aplicado a todos los endpoints protegidos.

IMPORTANTE — no confundir con el "código de acceso" de RN-USR-02: este
JWT es un TOKEN DE SESIÓN (se emite al iniciar sesión, identifica
"quién está usando la API ahora mismo"). El código de acceso de
RN-USR-02 es un concepto DISTINTO (invitación de un solo uso para que
un administrador autorice el registro de un nuevo empleado) que sigue
sin implementarse — no forma parte de este roadmap.
"""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.utils.jwt_utils import (
    decodificar_access_token,
    TokenExpirado,
    TokenInvalido,
)

# auto_error=False: si falta el header, queremos lanzar NOSOTROS un 401
# con nuestro propio formato de mensaje, no dejar que FastAPI lance el
# suyo genérico.
_bearer_scheme = HTTPBearer(auto_error=False)


class UsuarioActual:
    """
    Representa al usuario identificado por el JWT de la petición actual.
    Se usa tanto para lógica de negocio (auditoría: quién hizo qué) como
    para autorización por rol (ver roles.py).
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
