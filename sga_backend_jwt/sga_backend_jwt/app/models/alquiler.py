from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    Date,
    TIMESTAMP,
    ForeignKey,
    text
)

from app.config.database import Base


class Alquiler(Base):

    __tablename__ = "alquiler"

    id_alquiler = Column(
        Integer,
        primary_key=True
    )

    id_usuario_creador = Column(
        String(20),
        ForeignKey("usuario.id_usuario"),
        nullable=False
    )

    id_usuario_cliente = Column(
        String(20),
        ForeignKey("usuario.id_usuario"),
        nullable=False
    )

    estado_alquiler = Column(
        String(30),
        nullable=False,
        server_default="pendiente"
    )

    barrio = Column(
        String(100),
        nullable=False
    )

    deposito = Column(
        Numeric(10, 2),
        nullable=False
    )

    precio_alquiler = Column(
        Numeric(10, 2),
        nullable=False
    )

    direccion = Column(
        String(255),
        nullable=False
    )

    fecha_inicio = Column(
        Date,
        nullable=False
    )

    tiempo_alquiler = Column(
        Integer,
        nullable=False
    )

    se_lleva = Column(
        Boolean,
        nullable=False,
        server_default="true"
    )

    se_recoge = Column(
        Boolean,
        nullable=False,
        server_default="true"
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
