from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# --- Función auxiliar ---
# Convierte nombres snake_case a camelCase para compatibilidad en respuestas JSON
def to_camel(string: str) -> str:
    parts = string.split('_')
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])

# --- Schema de productos ---
class ProductoSchema(BaseModel):
    id_producto: int | None = None
    nombre_producto: str = Field(..., min_length=3, max_length=100)
    descripcion_producto: str | None = None
    precio_base: float = Field(..., gt=0)
    stock_total: int = Field(..., ge=0)
    stock_disponible: int = Field(..., ge=0)

    class Config:
        from_attributes = True
        alias_generator = to_camel
        populate_by_name = True

# --- Schema para creación de códigos de registro ---
class CodigoCreate(BaseModel):
    rol_id: int

# --- Schema para creación de usuarios ---
class UsuarioCreate(BaseModel):
    email_usuario: str
    contrasena_usuario: str
    codigo: str

# --- Schema para login de usuarios ---
class UsuarioLogin(BaseModel):
    email_usuario: str
    contrasena_usuario: str

# --- Schema de roles ---
class RolSchema(BaseModel):
    ID_rol: int | None = None
    nombre_rol: str

# --- Schemas de cliente ---
class ClienteCreate(BaseModel):
    nombre_cliente: str
    telefono_cliente: str

# --- Schemas de alquiler ---
class ProductoAlquiler(BaseModel):
    id_producto: int
    cantidad_productos: int

class AlquilerCreate(BaseModel):
    id_cliente: Optional[int] = None  # puede venir id o datos
    barrio: str
    direccion: str
    deposito: float
    productos: List[ProductoAlquiler]
    cliente: Optional[ClienteCreate] = None

class AlquilerClose(BaseModel):
    id_alquiler: int

class DetalleAlquilerOut(BaseModel):
    id_detalle_alquiler: int
    id_alquiler: int
    id_producto: int
    cantidad_productos: int
    precio_unitario: float

    class Config:
        from_attributes = True

class AlquilerOut(BaseModel):
    id_alquiler: int
    id_cliente: int
    id_usuario: int
    fecha_inicio: datetime
    fecha_devolucion: Optional[datetime]
    barrio: str
    direccion: str
    deposito: float
    estado_alquiler: str
    detalles: List[DetalleAlquilerOut]

    class Config:
        from_attributes = True

class DespachoCreate(BaseModel):
    id_alquiler: int
    observaciones: Optional[str] = None

class DespachoUpdateEstado(BaseModel):
    id_despacho: int
    nuevo_estado: str  # "EnTransito", "Entregado", "Recogido", "Cerrado"
    fecha_evento: Optional[datetime] = None
    observaciones: Optional[str] = None

class DespachoOut(BaseModel):
    id_despacho: int
    id_alquiler: int
    id_usuario_logistico: int
    fecha_despacho: Optional[datetime]
    fecha_recepcion: Optional[datetime]
    estado_despacho: str
    observaciones: Optional[str]

    class Config:
        from_attributes = True

class GastoTransporteCreate(BaseModel):
    id_alquiler: Optional[int] = None
    id_despacho: Optional[int] = None
    fecha_gasto: Optional[datetime] = None
    monto: float
    descripcion: Optional[str] = None

class GastoTransporteOut(BaseModel):
    id_gasto: int
    id_alquiler: Optional[int]
    id_despacho: Optional[int]
    fecha_gasto: datetime
    monto: float
    descripcion: Optional[str]

    class Config:
        from_attributes = True

class GastoDiarioOut(BaseModel):
    dia: str
    total: float
