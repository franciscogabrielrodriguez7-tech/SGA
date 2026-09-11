from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.usuario_schema import TIPOS_DOCUMENTO_VALIDOS


class ClienteCreate(BaseModel):
    """
    Crea un cliente (usuario.rol_usuario='cliente'). El rol NUNCA se
    recibe aquí — el controller lo fuerza siempre a 'cliente'
    (RN-CLI: los clientes no tienen acceso al sistema, así que ni
    siquiera tiene sentido exponer ese campo en este schema).
    Tampoco se exponen email/contraseña: un cliente registrado en
    punto de venta normalmente no inicia sesión (RN-CLI-01).
    """

    id_usuario: str = Field(..., max_length=20)

    nombres_usuario: str = Field(..., max_length=100)

    apellidos_usuario: str = Field(..., max_length=100)

    telefono_usuario: str = Field(..., max_length=20)

    email_usuario: Optional[str] = Field(default=None, max_length=100)

    tipo_documento: str = Field(...)

    @field_validator("tipo_documento")
    @classmethod
    def validar_tipo_documento(cls, valor: str) -> str:
        if valor not in TIPOS_DOCUMENTO_VALIDOS:
            raise ValueError(
                f"tipo_documento debe ser uno de: {', '.join(TIPOS_DOCUMENTO_VALIDOS)}"
            )
        return valor


class ClienteUpdate(BaseModel):

    nombres_usuario: Optional[str] = Field(default=None, max_length=100)

    apellidos_usuario: Optional[str] = Field(default=None, max_length=100)

    telefono_usuario: Optional[str] = Field(default=None, max_length=20)

    email_usuario: Optional[str] = Field(default=None, max_length=100)


class ClienteEstadoUpdate(BaseModel):

    estado_registro: bool
