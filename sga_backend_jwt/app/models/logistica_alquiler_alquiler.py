from sqlalchemy import Column, Integer, ForeignKey
from app.config.database import Base


class LogisticaAlquilerAlquiler(Base):
    """
    Tabla puente entre logistica_alquiler y alquiler.

    Reglas de negocio:
      - ENTREGA/RECOGIDA: exactamente 1 fila (la transición de estado
        está ligada a un único alquiler; lo garantiza la app en el
        controller, no un constraint de BD).
      - GASTO: 1 o más filas (varios alquileres pueden compartir un
        mismo viaje/gasto, ej. combustible multiequipo).
    """

    __tablename__ = "logistica_alquiler_alquiler"

    id_logistica_alquiler = Column(
        Integer,
        ForeignKey("logistica_alquiler.id_logistica_alquiler", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )

    id_alquiler = Column(
        Integer,
        ForeignKey("alquiler.id_alquiler", onupdate="CASCADE", ondelete="RESTRICT"),
        primary_key=True,
    )
