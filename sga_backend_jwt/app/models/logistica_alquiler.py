from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    TIMESTAMP,
    Text,
    ForeignKey,
    CheckConstraint,
    text,
)

from app.config.database import Base


class LogisticaAlquiler(Base):
    """
    Un registro puede ser:
      - 'ENTREGA'  : despacho inicial de equipos (pendiente → activo).
      - 'RECOGIDA' : retiro de equipos (activo/vencido → recogido).
      - 'GASTO'    : gasto logístico puro sin transición de estado
                     (ej. combustible de un viaje multiequipo).

    La asociación con los alquileres vive en la tabla puente
    logistica_alquiler_alquiler (ver LogisticaAlquilerAlquiler).
    ENTREGA y RECOGIDA siempre tienen exactamente 1 fila en esa tabla.
    GASTO puede tener 1 o más (varios alquileres comparten el mismo gasto).
    """

    __tablename__ = "logistica_alquiler"

    id_logistica_alquiler = Column(Integer, primary_key=True)

    # CRÍTICO: jamás se recibe del payload — se inyecta desde el JWT.
    id_usuario_logistico = Column(
        String(20), ForeignKey("usuario.id_usuario"), nullable=False
    )

    # 'ENTREGA' | 'RECOGIDA' | 'GASTO'
    tipo_movimiento = Column(String(10), nullable=False)

    fecha_gasto = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    descripcion_gasto_logistico = Column(Text, nullable=True)

    valor_gasto_logistico = Column(Numeric(10, 2), nullable=False, server_default="0.00")

    observaciones_logistica_alquiler = Column(Text, nullable=True)

    estado_registro = Column(Boolean, nullable=False, server_default="true")

    fecha_creacion = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    fecha_actualizacion = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    __table_args__ = (
        CheckConstraint(
            "tipo_movimiento IN ('ENTREGA', 'RECOGIDA', 'GASTO')",
            name="chk_logistica_tipo_movimiento",
        ),
    )
