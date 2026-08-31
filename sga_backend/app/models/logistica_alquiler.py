from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    Text,
    TIMESTAMP,
    ForeignKey,
    text
)

from app.config.database import Base


class LogisticaAlquiler(Base):

    __tablename__ = "logistica_alquiler"

    id_logistica_alquiler = Column(
        Integer,
        primary_key=True
    )

    id_usuario_logistico = Column(
        String(20),
        ForeignKey("usuario.id_usuario"),
        nullable=False
    )

    id_alquiler = Column(
        Integer,
        ForeignKey("alquiler.id_alquiler"),
        nullable=False
    )

    fecha_gasto = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    descripcion_gasto_logistico = Column(
        Text
    )

    valor_gasto_logistico = Column(
        Numeric(10, 2),
        nullable=False,
        server_default="0.00"
    )

    observaciones_logistica_alquiler = Column(
        Text
    )

    es_recogida = Column(
        Boolean,
        nullable=False
    )

    fecha_actualizacion = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
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
