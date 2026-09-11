from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field

UnidadMinimaAlquiler = Literal["DIA", "SEMANA", "MES"]


class ProductoCreate(BaseModel):

    nombre_producto: str = Field(..., max_length=100)

    descripcion_producto: Optional[str] = Field(default=None, max_length=300)

    precio_base_producto: Decimal = Field(..., ge=0)

    stock_total: int = Field(..., ge=0)

    # precio_base_producto se interpreta "por" esta unidad (ej. SEMANA
    # -> precio semanal). Ver app/utils/unidades.py.
    unidad_minima_alquiler: UnidadMinimaAlquiler = "DIA"


class ProductoUpdate(BaseModel):

    nombre_producto: Optional[str] = Field(default=None, max_length=100)

    descripcion_producto: Optional[str] = Field(default=None, max_length=300)

    precio_base_producto: Optional[Decimal] = Field(default=None, ge=0)

    # stock_alquilado NO es editable manualmente (lo sincronizan los
    # triggers). stock_total sí, y la BD rechaza si queda por debajo
    # de stock_alquilado (trg_validar_modificacion_producto).
    stock_total: Optional[int] = Field(default=None, ge=0)

    unidad_minima_alquiler: Optional[UnidadMinimaAlquiler] = None


class ProductoEstadoUpdate(BaseModel):

    estado_registro: bool

