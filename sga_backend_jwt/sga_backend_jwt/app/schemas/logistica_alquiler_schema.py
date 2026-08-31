from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class EntregaCreate(BaseModel):
    """
    Registra una entrega (logistica_alquiler con es_recogida=False,
    fijado por el endpoint, no por el cliente). RN-ENT-02/03.
    El gasto es opcional: no toda entrega implica necesariamente un
    gasto adicional inmediato.
    """

    id_usuario_logistico: str = Field(..., max_length=20)

    observaciones_logistica_alquiler: Optional[str] = None

    valor_gasto_logistico: Decimal = Field(default=Decimal("0.00"), ge=0)

    descripcion_gasto_logistico: Optional[str] = None


class RecogidaCreate(BaseModel):
    """
    Registra una recogida (logistica_alquiler con es_recogida=True,
    fijado por el endpoint). RN-REC-02/03. RN-LOG-04 (no recogida sin
    entrega previa) se valida en el controller antes de insertar.
    """

    id_usuario_logistico: str = Field(..., max_length=20)

    observaciones_logistica_alquiler: Optional[str] = None

    valor_gasto_logistico: Decimal = Field(default=Decimal("0.00"), ge=0)

    descripcion_gasto_logistico: Optional[str] = None


class GastoCreate(BaseModel):
    """
    logistica_alquiler NO tiene un tercer valor para "solo gasto,
    sin ser entrega ni recogida" — es_recogida es booleano NOT NULL.
    Por eso este endpoint exige que el cliente indique explícitamente
    a cuál de las dos operaciones se asocia el gasto, en vez de asumir
    un valor por defecto que inventaría comportamiento no respaldado
    por el modelo de datos.
    """

    id_alquiler: int

    id_usuario_logistico: str = Field(..., max_length=20)

    es_recogida: bool

    valor_gasto_logistico: Decimal = Field(..., ge=0)

    descripcion_gasto_logistico: Optional[str] = None

    observaciones_logistica_alquiler: Optional[str] = None
