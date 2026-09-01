from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    TIMESTAMP,
    ForeignKey,
    text
)

from app.config.database import Base


class DetalleAlquiler(Base):

    __tablename__ = "detalle_alquiler"

    id_detalle_alquiler = Column(
        Integer,
        primary_key=True
    )

    id_alquiler = Column(
        Integer,
        ForeignKey("alquiler.id_alquiler"),
        nullable=False
    )

    id_producto = Column(
        Integer,
        ForeignKey("producto.id_producto"),
        nullable=False
    )

    precio_conjunto = Column(
        Numeric(10, 2),
        nullable=False
    )

    cantidad_productos = Column(
        Integer,
        nullable=False
    )

    es_producto_extra = Column(
        Boolean,
        nullable=False,
        server_default="false"
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

    estado_registro = Column(
        Boolean,
        nullable=False,
        server_default="true"
    )

    actualizado_por = Column(
        String(50)
    )

    eliminado_por = Column(
        String(50)
    )

    fecha_eliminacion = Column(
        TIMESTAMP
    )
