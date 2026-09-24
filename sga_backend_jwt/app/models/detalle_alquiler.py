from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    Boolean,
    TIMESTAMP,
    ForeignKey,
    Index,
    UniqueConstraint,
    text
)

from app.config.database import Base


class DetalleAlquiler(Base):

    __tablename__ = "detalle_alquiler"

    id_detalle_alquiler = Column(Integer, primary_key=True)

    id_alquiler = Column(
        Integer,
        ForeignKey("alquiler.id_alquiler", name="fk_detalle_alquiler_alquiler", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )

    id_producto = Column(
        Integer,
        ForeignKey("producto.id_producto", name="fk_detalle_alquiler_producto", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )

    precio_conjunto = Column(Numeric(10, 2), nullable=False)

    cantidad_productos = Column(Integer, nullable=False)

    es_producto_extra = Column(Boolean, nullable=False, server_default="false")

    estado_registro = Column(Boolean, nullable=False, server_default="true")

    fecha_creacion = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    fecha_actualizacion = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    __table_args__ = (
        # REGLA CLAVE DE NEGOCIO: un producto no puede repetirse en el mismo
        # alquiler a menos que sea extra. Garantiza integridad en BD.
        Index(
            "idx_unico_producto_alquiler",
            "id_alquiler",
            "id_producto",
            unique=True,
            postgresql_where=text("es_producto_extra = false"),
        ),
        # Carga rápida de todas las líneas de producto de un alquiler
        Index("idx_detalle_alquiler_id", "id_alquiler"),
        # Trazabilidad: qué alquileres contienen un producto en particular
        Index("idx_detalle_producto_id", "id_producto"),
    )
