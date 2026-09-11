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
    """Línea de producto enviada dentro del payload de creación de un alquiler."""

    id_producto: int

    cantidad_productos: int = Field(..., gt=0)

    precio_conjunto: Decimal = Field(..., ge=0)

    es_producto_extra: bool = False


class AlquilerCreate(BaseModel):
    """
    CRÍTICO: NO se recibe "id_usuario_creador" en el payload — se toma
    del JWT (usuario_actual) en el controller, nunca de lo que el
    cliente HTTP declare.
    """

    id_usuario_cliente: str = Field(..., max_length=20)

    barrio: str = Field(..., max_length=100)

    direccion: str = Field(..., max_length=255)

    deposito: Decimal = Field(..., ge=0)

    precio_alquiler: Decimal = Field(..., gt=0)

    fecha_inicio: date

    tiempo_alquiler_dias: int = Field(..., gt=0)

    se_lleva: bool = True

    se_recoge: bool = True

    detalles: List[DetalleAlquilerInline] = Field(..., min_length=1)


class AlquilerUpdate(BaseModel):
    """
    Campos editables de un alquiler, SEGÚN SU ESTADO ACTUAL. Este
    schema solo define la forma del payload; la restricción por
    estado vive en alquiler_controller.CAMPOS_EDITABLES_POR_ESTADO.
    """

    barrio: Optional[str] = Field(default=None, max_length=100)

    direccion: Optional[str] = Field(default=None, max_length=255)

    deposito: Optional[Decimal] = Field(default=None, ge=0)

    precio_alquiler: Optional[Decimal] = Field(default=None, gt=0)

    fecha_inicio: Optional[date] = None

    tiempo_alquiler_dias: Optional[int] = Field(default=None, gt=0)

    se_lleva: Optional[bool] = None

    se_recoge: Optional[bool] = None


class AlquilerEstadoUpdate(BaseModel):
    """Corrección administrativa manual del estado (ver roles en la ruta)."""

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
    """El tiempo de renovación se SUMA al período existente, en días."""

    dias: int = Field(..., gt=0)

    # Opcional: nuevo precio_alquiler total tras la renovación (ver
    # decisión de negocio: precio_alquiler ya no se auto-calcula). Si
    # se omite, el precio actual del alquiler no se modifica.
    precio_alquiler: Optional[Decimal] = Field(default=None, gt=0)
