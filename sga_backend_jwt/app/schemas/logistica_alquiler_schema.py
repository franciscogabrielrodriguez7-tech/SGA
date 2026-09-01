from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class EntregaCreate(BaseModel):
    """
    Registra una entrega. CORREGIDO respecto a la versión anterior:
    antes el cliente enviaba "id_usuario_logistico" en el payload —
    es decir, el backend confiaba en que el frontend dijera quién
    estaba haciendo la operación. El roadmap (sección 25) exige
    explícitamente NO depender de un id_usuario enviado por el
    frontend: ahora el responsable se toma del JWT (usuario_actual),
    no de este payload.

    Puede ser entrega DIRECTA (admin/facturación, se_lleva=False) o
    MEDIANTE TRANSPORTE (logístico/admin, se_lleva=True) — el rol
    correcto se valida en el controller según alquiler.se_lleva.
    """

    observaciones_logistica_alquiler: Optional[str] = None

    valor_gasto_logistico: Decimal = Decimal("0.00")

    descripcion_gasto_logistico: Optional[str] = None


class RecogidaCreate(BaseModel):
    """
    Registra una recogida MEDIANTE TRANSPORTE (logístico/admin,
    exige alquiler.se_recoge=True). Para recepción directa (sin
    transporte) usar el endpoint /recepcion-directa.
    RN-LOG-04 (no recogida sin entrega previa) se valida en el
    controller.
    """

    observaciones_logistica_alquiler: Optional[str] = None

    valor_gasto_logistico: Decimal = Decimal("0.00")

    descripcion_gasto_logistico: Optional[str] = None


class GastoCreate(BaseModel):
    """
    logistica_alquiler NO tiene un tercer valor para "solo gasto,
    sin ser entrega ni recogida" — es_recogida es booleano NOT NULL.
    Por eso este endpoint exige que el cliente indique explícitamente
    a cuál de las dos operaciones se asocia el gasto.
    """

    id_alquiler: int

    es_recogida: bool

    valor_gasto_logistico: Decimal

    descripcion_gasto_logistico: Optional[str] = None

    observaciones_logistica_alquiler: Optional[str] = None
