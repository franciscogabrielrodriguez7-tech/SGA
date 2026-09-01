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
    """
    CORREGIDO: ya no se recibe "id_usuario_creador" en el payload — se
    toma del JWT (usuario_actual) en el controller, no de lo que el
    cliente diga (roadmap sección 25: no depender de un id_usuario
    enviado por el frontend).
    """

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
    Campos editables de un alquiler, SEGÚN SU ESTADO ACTUAL (matriz de
    edición del roadmap, sección 21). El controller valida qué campos
    están permitidos en qué estado — este schema solo define la forma
    del payload; la restricción por estado vive en
    alquiler_controller.actualizar_alquiler().

    CORREGIDO respecto a la versión anterior: ahora SÍ incluye
    `fecha_inicio` (editable solo en 'pendiente', sección 20) y
    `tiempo_alquiler` (editable en 'pendiente'/'activo'/'vencido' —
    un aumento se trata como renovación, una reducción como corrección
    administrativa con validación de que no produzca un vencimiento
    en el pasado; sección 19).
    """

    barrio: Optional[str] = Field(default=None, max_length=100)

    deposito: Optional[Decimal] = Field(default=None, ge=0)

    precio_alquiler: Optional[Decimal] = Field(default=None, gt=0)

    direccion: Optional[str] = Field(default=None, max_length=255)

    fecha_inicio: Optional[date] = None

    tiempo_alquiler: Optional[int] = Field(default=None, gt=0)

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


class RecepcionDirectaCreate(BaseModel):
    """
    NUEVO (roadmap sección 6). Recepción directa: el alquiler pasa de
    'activo' a 'terminado' sin pasar por 'recogido', porque no hubo
    proceso de recogida mediante transporte (alquiler.se_recoge=False).
    La valida el controller. No genera fila en logistica_alquiler
    (no hay operación logística de transporte que registrar, y crear
    una fila ahí con es_recogida=True representaría incorrectamente
    esta operación como una recogida por transporte, que no lo es).

    NOTA: no se acepta un campo "observaciones" aquí — la tabla
    "alquiler" no tiene ninguna columna para guardarlo, y forzarlo
    dentro de logistica_alquiler falsearía el tipo de operación. Si en
    el futuro se necesita, requiere agregar una columna nueva (fuera
    del alcance de este roadmap, que pide no alterar la lógica de BD
    sin justificarlo explícitamente).
    """

    pass
