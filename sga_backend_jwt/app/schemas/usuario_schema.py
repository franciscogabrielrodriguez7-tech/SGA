from typing import Optional

from pydantic import BaseModel, Field


ROLES_VALIDOS = (
    "admin",
    "encargado_facturacion",
    "encargado_logistico",
    "cliente"
)

TIPOS_DOCUMENTO_VALIDOS = (
    "CC",
    "CE",
    "NIT",
    "PPT"
)


class UsuarioCreate(BaseModel):

    id_usuario: str = Field(..., max_length=20)

    rol_usuario: str = Field(default="cliente")

    nombres_usuario: str = Field(..., max_length=100)

    apellidos_usuario: str = Field(..., max_length=100)

    email_usuario: Optional[str] = Field(default=None, max_length=100)

    telefono_usuario: str = Field(..., max_length=20)

    # Contraseña en texto plano recibida desde el cliente.
    # Se hashea con bcrypt en el controller antes de guardarla
    # (ver app/utils/security.py). Opcional porque, según las
    # reglas de negocio, un cliente puede registrarse sin ella.
    contrasena_usuario: Optional[str] = Field(default=None, min_length=4)

    tipo_documento: str = Field(...)


class UsuarioEstadoUpdate(BaseModel):

    estado_usuario: bool


class LoginRequest(BaseModel):

    telefono_usuario: Optional[str] = None

    email_usuario: Optional[str] = None

    contrasena_usuario: str
