from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


ESTADOS_VALIDOS = (
    "pendiente",
    "activo",
    "vencido",
    "recogido",
    "terminado",
    "cancelado"
)


class DetalleAlquilerInline(BaseModel):
    """
    Línea de producto enviada dentro del payload de creación de un
    alquiler. La base de datos (a diferencia de la que diseñamos en
    sga_schema.sql) NO tiene un trigger que obligue a que un alquiler
    tenga al menos un producto (RN-ALQ-03); por eso se exige aquí,
    con min_length=1 en AlquilerCreate.detalles.
    """

    id_producto: int

    cantidad_productos: int = Field(..., gt=0)

    precio_conjunto: Decimal = Field(..., ge=0)

    es_producto_extra: bool = False


class AlquilerCreate(BaseModel):

    id_usuario_creador: str = Field(..., max_length=20)

    id_usuario_cliente: str = Field(..., max_length=20)

    barrio: str = Field(..., max_length=100)

    deposito: Decimal = Field(..., ge=0)

    precio_alquiler: Decimal = Field(..., gt=0)

    direccion: str = Field(..., max_length=255)

    fecha_inicio: date

    tiempo_alquiler: int = Field(..., gt=0)  # semanas

    se_lleva: bool = True

    se_recoge: bool = True

    detalles: List[DetalleAlquilerInline] = Field(..., min_length=1)



class AlquilerUpdate(BaseModel):
    """
    Campos editables de un alquiler ya creado (RN-ALQ-06).
    NO incluye id_usuario_creador/id_usuario_cliente (no se cambia el
    cliente de un contrato ya creado), NI estado_alquiler (usar el
    endpoint PATCH /estado), NI tiempo_alquiler (usar el endpoint de
    renovaciones, que es el que RN-REN define para extender el plazo).
    """

    barrio: Optional[str] = Field(default=None, max_length=100)

    deposito: Optional[Decimal] = Field(default=None, ge=0)

    precio_alquiler: Optional[Decimal] = Field(default=None, gt=0)

    direccion: Optional[str] = Field(default=None, max_length=255)

    se_lleva: Optional[bool] = None

    se_recoge: Optional[bool] = None


class AlquilerEstadoUpdate(BaseModel):

    estado_alquiler: str

    @field_validator("estado_alquiler")
    @classmethod
    def validar_estado(cls, valor: str) -> str:

        if valor not in ESTADOS_VALIDOS:
            raise ValueError(
                f"estado_alquiler debe ser uno de: {', '.join(ESTADOS_VALIDOS)}"
            )

        return valor


class RenovacionCreate(BaseModel):
    """
    RN-REN-05: el tiempo de renovación se SUMA al período existente.
    No existe tabla "renovaciones"; esta operación solo modifica
    alquiler.tiempo_alquiler (decisión confirmada por el usuario).
    """

    semanas: int = Field(..., gt=0)
