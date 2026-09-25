from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    Date,
    TIMESTAMP,
    ForeignKey,
    Index,
    text
)
from sqlalchemy.orm import relationship

from app.config.database import Base


class Alquiler(Base):

    __tablename__ = "alquiler"

    id_alquiler = Column(Integer, primary_key=True)

    # CRÍTICO: jamás se recibe del payload — se inyecta desde el JWT
    # (usuario_actual.id_usuario) en el controller.
    id_usuario_creador = Column(
        String(20),
        ForeignKey("usuario.id_usuario", name="fk_alquiler_usuario_creador", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )

    id_usuario_cliente = Column(
        String(20),
        ForeignKey("usuario.id_usuario", name="fk_alquiler_usuario_cliente", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )

    creador = relationship("Usuario", foreign_keys=[id_usuario_creador])
    cliente = relationship("Usuario", foreign_keys=[id_usuario_cliente])

    estado_alquiler = Column(String(30), nullable=False, server_default="pendiente")

    barrio = Column(String(100), nullable=False)

    direccion = Column(String(255), nullable=False)

    deposito = Column(Numeric(10, 2), nullable=False)

    precio_alquiler = Column(Numeric(10, 2), nullable=False)

    fecha_inicio = Column(Date, nullable=False)

    tiempo_alquiler_dias = Column(Integer, nullable=False)

    se_lleva = Column(Boolean, nullable=False, server_default="true")

    se_recoge = Column(Boolean, nullable=False, server_default="true")

    estado_registro = Column(Boolean, nullable=False, server_default="true")

    fecha_creacion = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    fecha_actualizacion = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    __table_args__ = (
        # Búsqueda del historial de alquileres por cédula del cliente
        Index("idx_alquiler_cliente", "id_usuario_cliente"),
        # Búsqueda de alquileres tramitados por un facturador específico
        Index("idx_alquiler_creador", "id_usuario_creador"),
        # Filtro del Dashboard principal por estado (solo registros activos)
        Index(
            "idx_alquiler_estado",
            "estado_alquiler",
            postgresql_where=text("estado_registro IS TRUE"),
        ),
        # Búsqueda y detección de vencimientos por fecha de inicio
        Index("idx_alquiler_fecha_inicio", "fecha_inicio"),
        # Optimiza la detección de vencimientos calculados al vuelo
        # (fecha_inicio + tiempo_alquiler_dias - 1 < CURRENT_DATE)
        Index(
            "idx_alquiler_fecha_vencimiento",
            text("(fecha_inicio + tiempo_alquiler_dias - 1)"),
        ),
    )
