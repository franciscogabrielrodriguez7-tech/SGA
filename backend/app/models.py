from sqlalchemy import Column, Integer, String, Float, CheckConstraint, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timedelta
import uuid

# --- Modelo de productos ---
class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_producto = Column(String, nullable=False)
    descripcion_producto = Column(String)
    precio_base = Column(Float, nullable=False)
    stock_total = Column(Integer, nullable=False)
    stock_disponible = Column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint("precio_base > 0", name="precio_mayor_cero"),
        CheckConstraint("stock_disponible <= stock_total", name="stock_valido"),
    )

    # Relación con detalles de alquiler
    detalles = relationship("DetalleAlquiler", back_populates="producto")


# --- Modelo de códigos de registro ---
class CodigoRegistro(Base):
    __tablename__ = "codigo_registro"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    rol_id = Column(Integer, ForeignKey("rol.ID_rol"))
    fecha_expiracion = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=24))


# --- Modelo de usuarios ---
class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombres_usuario = Column(String, nullable=True)
    apellidos_usuario = Column(String, nullable=True)
    email_usuario = Column(String, unique=True, nullable=False)
    telefono_usuario = Column(String, nullable=True)
    contrasena_usuario = Column(String, nullable=False)
    id_rol = Column(Integer, ForeignKey("rol.ID_rol"))

    rol = relationship("Rol")
    alquileres = relationship("Alquiler", back_populates="usuario")


# --- Modelo de roles ---
class Rol(Base):
    __tablename__ = "rol"

    ID_rol = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_rol = Column(String, unique=True, nullable=False)


# --- Modelo de clientes ---
class Cliente(Base):
    __tablename__ = "clientes"

    id_cliente = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_cliente = Column(String, nullable=False)
    telefono_cliente = Column(String, nullable=False)

    alquileres = relationship("Alquiler", back_populates="cliente")


# --- Modelo de alquiler ---
class Alquiler(Base):
    __tablename__ = "alquileres"

    id_alquiler = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"))
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"))
    fecha_inicio = Column(DateTime, default=datetime.utcnow)
    fecha_devolucion = Column(DateTime, nullable=True)
    barrio = Column(String, nullable=False)
    direccion = Column(String, nullable=False)
    deposito = Column(Float, nullable=False)
    estado_alquiler = Column(String, default="Activo")

    # Relaciones
    cliente = relationship("Cliente", back_populates="alquileres")
    usuario = relationship("Usuario", back_populates="alquileres")
    detalles = relationship("DetalleAlquiler", back_populates="alquiler", cascade="all, delete-orphan")
    despachos = relationship("Despacho", back_populates="alquiler", cascade="all, delete-orphan")
    gastos_transporte = relationship("GastoTransporte", back_populates="alquiler", cascade="all, delete-orphan")


# --- Modelo de detalle de alquiler ---
class DetalleAlquiler(Base):
    __tablename__ = "detalle_alquiler"

    id_detalle_alquiler = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_alquiler = Column(Integer, ForeignKey("alquileres.id_alquiler"))
    id_producto = Column(Integer, ForeignKey("productos.id_producto"))
    cantidad_productos = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)

    # Relaciones
    alquiler = relationship("Alquiler", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles")

# Nuevo modelo: Despacho (logística)
class Despacho(Base):
    __tablename__ = "despachos"

    id_despacho = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_alquiler = Column(Integer, ForeignKey("alquileres.id_alquiler"), nullable=False)
    id_usuario_logistico = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    fecha_despacho = Column(DateTime, nullable=True)
    fecha_recepcion = Column(DateTime, nullable=True)
    estado_despacho = Column(String, nullable=False, default="Pendiente")  # Pendiente, EnTransito, Entregado, Recogido
    observaciones = Column(String, nullable=True)

    alquiler = relationship("Alquiler", back_populates="despachos")
    usuario_logistico = relationship("Usuario")
    gastos = relationship("GastoTransporte", back_populates="despacho", cascade="all, delete-orphan")

# Nuevo modelo: GastoTransporte
class GastoTransporte(Base):
    __tablename__ = "gastos_transporte"

    id_gasto = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_despacho = Column(Integer, ForeignKey("despachos.id_despacho"), nullable=True)
    id_alquiler = Column(Integer, ForeignKey("alquileres.id_alquiler"), nullable=True)
    fecha_gasto = Column(DateTime, default=datetime.utcnow)
    monto = Column(Float, nullable=False)
    descripcion = Column(String, nullable=True)

    despacho = relationship("Despacho", back_populates="gastos")
    alquiler = relationship("Alquiler", back_populates="gastos_transporte")