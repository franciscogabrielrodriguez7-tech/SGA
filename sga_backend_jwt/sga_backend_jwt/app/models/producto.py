from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    TIMESTAMP,
    text
)

from app.config.database import Base


class Producto(Base):

    __tablename__ = "producto"

    id_producto = Column(
        Integer,
        primary_key=True
    )

    nombre_producto = Column(
        String(100),
        nullable=False
    )

    descripcion_producto = Column(
        String(300),
        nullable=False
    )

    precio_base_producto = Column(
        Numeric(10, 2),
        nullable=False
    )

    stock_total = Column(
        Integer,
        nullable=False
    )

    stock_alquilado = Column(
        Integer,
        nullable=False,
        server_default="0"
    )

    fecha_creacion = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    fecha_actualizacion = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    creado_por = Column(
        String(50)
    )

    actualizado_por = Column(
        String(50)
    )

    estado_registro = Column(
        Boolean,
        nullable=False,
        server_default="true"
    )

    eliminado_por = Column(
        String(50)
    )

    fecha_eliminacion = Column(
        TIMESTAMP
    )
