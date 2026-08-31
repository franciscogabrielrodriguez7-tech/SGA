from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class ProductoCreate(BaseModel):

    nombre_producto: str = Field(..., max_length=100)

    descripcion_producto: str = Field(..., max_length=300)

    precio_base_producto: Decimal = Field(..., ge=0)

    stock_total: int = Field(..., ge=0)


class ProductoUpdate(BaseModel):

    nombre_producto: Optional[str] = Field(default=None, max_length=100)

    descripcion_producto: Optional[str] = Field(default=None, max_length=300)

    precio_base_producto: Optional[Decimal] = Field(default=None, ge=0)

    stock_total: Optional[int] = Field(default=None, ge=0)
