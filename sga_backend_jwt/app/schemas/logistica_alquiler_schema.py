from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class EntregaCreate(BaseModel):
    """
    Registra una entrega (despacho inicial). El responsable
    (id_usuario_logistico) NUNCA viene en el payload — se toma del
    JWT (usuario_actual) en el controller.
    """

    observaciones_logistica_alquiler: Optional[str] = None

    valor_gasto_logistico: Decimal = Decimal("0.00")

    descripcion_gasto_logistico: Optional[str] = None


class RecogidaCreate(BaseModel):
    """Registra una recogida de equipos al cierre del alquiler."""

    observaciones_logistica_alquiler: Optional[str] = None

    valor_gasto_logistico: Decimal = Decimal("0.00")

    descripcion_gasto_logistico: Optional[str] = None


class GastoCreate(BaseModel):
    """
    Registra un gasto logístico independiente o asociado a uno o varios alquileres.
    id_usuario_logistico se inyecta desde el JWT.
    """

    ids_alquiler: List[int] = Field(..., min_length=1)

    valor_gasto_logistico: Decimal

    descripcion_gasto_logistico: Optional[str] = None

    observaciones_logistica_alquiler: Optional[str] = None
