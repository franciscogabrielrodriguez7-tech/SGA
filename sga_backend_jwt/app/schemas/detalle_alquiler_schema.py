from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class DetalleAlquilerCreate(BaseModel):

    id_alquiler: int

    id_producto: int

    cantidad_productos: int = Field(..., gt=0)

    precio_conjunto: Decimal = Field(..., ge=0)

    es_producto_extra: bool = False


class DetalleAlquilerUpdate(BaseModel):
    """
    Solo cantidad y precio son modificables (RN-DET-04). La base de
    datos (trigger fn_ajustar_stock_en_actualizacion) ya rechaza
    explícitamente el cambio de id_producto en una línea existente,
    así que ese campo no se expone aquí para no invitar un intento
    que sabemos que fallará.
    """

    cantidad_productos: Optional[int] = Field(default=None, gt=0)

    precio_conjunto: Optional[Decimal] = Field(default=None, ge=0)
