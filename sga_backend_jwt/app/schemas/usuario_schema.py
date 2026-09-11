from typing import Optional

from pydantic import BaseModel, Field, field_validator


ROLES_VALIDOS = (
    "admin",
    "encargado_facturacion",
    "encargado_logistico",
    "cliente"
)

# Roles que representan personal interno (lo que /usuarios administra).
# 'cliente' se gestiona por el módulo /clientes (ver cliente_schema.py).
ROLES_STAFF = (
    "admin",
    "encargado_facturacion",
    "encargado_logistico",
)

TIPOS_DOCUMENTO_VALIDOS = (
    "CC",
    "CE",
    "NIT",
    "PPT"
)


class UsuarioCreate(BaseModel):
    """
    Crea un usuario de PERSONAL (admin, encargado_facturacion o
    encargado_logistico). Para clientes, ver cliente_schema.py:
    CrearCliente siempre fuerza rol_usuario='cliente' en el
    controller, nunca acepta el rol del payload.
    """

    id_usuario: str = Field(..., max_length=20)

    rol_usuario: str = Field(...)

    nombres_usuario: str = Field(..., max_length=100)

    apellidos_usuario: str = Field(..., max_length=100)

    email_usuario: Optional[str] = Field(default=None, max_length=100)

    telefono_usuario: str = Field(..., max_length=20)

    # Contraseña en texto plano recibida desde el cliente HTTP.
    # Se hashea con bcrypt en el controller antes de guardarla.
    contrasena_usuario: str = Field(..., min_length=4)

    tipo_documento: str = Field(...)

    @field_validator("rol_usuario")
    @classmethod
    def validar_rol_staff(cls, valor: str) -> str:
        if valor not in ROLES_STAFF:
            raise ValueError(
                f"rol_usuario debe ser uno de: {', '.join(ROLES_STAFF)} "
                "(para crear clientes use POST /api/sga/clientes)"
            )
        return valor

    @field_validator("tipo_documento")
    @classmethod
    def validar_tipo_documento(cls, valor: str) -> str:
        if valor not in TIPOS_DOCUMENTO_VALIDOS:
            raise ValueError(
                f"tipo_documento debe ser uno de: {', '.join(TIPOS_DOCUMENTO_VALIDOS)}"
            )
        return valor


class UsuarioUpdate(BaseModel):

    nombres_usuario: Optional[str] = Field(default=None, max_length=100)

    apellidos_usuario: Optional[str] = Field(default=None, max_length=100)

    email_usuario: Optional[str] = Field(default=None, max_length=100)

    telefono_usuario: Optional[str] = Field(default=None, max_length=20)

    rol_usuario: Optional[str] = Field(default=None)

    contrasena_usuario: Optional[str] = Field(default=None, min_length=4)

    @field_validator("rol_usuario")
    @classmethod
    def validar_rol_staff(cls, valor: Optional[str]) -> Optional[str]:
        if valor is not None and valor not in ROLES_STAFF:
            raise ValueError(
                f"rol_usuario debe ser uno de: {', '.join(ROLES_STAFF)}"
            )
        return valor


class UsuarioEstadoUpdate(BaseModel):

    estado_registro: bool


class LoginRequest(BaseModel):

    telefono_usuario: Optional[str] = None

    email_usuario: Optional[str] = None

    contrasena_usuario: str
