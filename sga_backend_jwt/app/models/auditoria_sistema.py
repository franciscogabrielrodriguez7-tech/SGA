from sqlalchemy import Column, Integer, String, TIMESTAMP, Index, text
from sqlalchemy.dialects.postgresql import JSONB

from app.config.database import Base


class AuditoriaSistema(Base):
    """
    Tabla poblada EXCLUSIVAMENTE por los triggers de la base de datos
    (fn_auditar_cambios, ver database/02_funciones_y_triggers.sql). El
    backend NUNCA inserta filas aquí manualmente — solo la consulta
    para los endpoints de historial/renovaciones.
    """

    __tablename__ = "auditoria_sistema"

    id_auditoria = Column(Integer, primary_key=True)

    nombre_tabla = Column(String(50), nullable=False)

    tipo_operacion = Column(String(10), nullable=False)

    id_registro_afectado = Column(String(50), nullable=False)

    datos_anteriores = Column(JSONB, nullable=True)

    datos_nuevos = Column(JSONB, nullable=True)

    id_usuario_accion = Column(String(20), nullable=True)

    fecha_accion = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    __table_args__ = (
        # Historial de cambios filtrado por tabla e id de registro
        Index("idx_auditoria_tabla_registro", "nombre_tabla", "id_registro_afectado"),
        # Reportes de actividad por usuario (solo filas con usuario registrado)
        Index(
            "idx_auditoria_usuario",
            "id_usuario_accion",
            postgresql_where=text("id_usuario_accion IS NOT NULL"),
        ),
        # Filtrado del historial por rango de fechas
        Index("idx_auditoria_fecha", "fecha_accion"),
    )
