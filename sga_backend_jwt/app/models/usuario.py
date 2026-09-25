from sqlalchemy import Column, String, Boolean, TIMESTAMP, Index, text

from app.config.database import Base


class Usuario(Base):

    __tablename__ = "usuario"

    id_usuario = Column(String(20), primary_key=True)

    rol_usuario = Column(String(30), nullable=False, server_default="cliente")

    nombres_usuario = Column(String(100), nullable=False)

    apellidos_usuario = Column(String(100), nullable=False)

    email_usuario = Column(String(100), unique=True, nullable=True)

    telefono_usuario = Column(String(20), nullable=False, unique=True)

    contrasena_usuario = Column(String(255), nullable=True)

    tipo_documento = Column(String(20), nullable=False)

    estado_registro = Column(Boolean, nullable=False, server_default="true")

    fecha_creacion = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    fecha_actualizacion = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    __table_args__ = (
        # Filtro por rol en el listado de usuarios (solo usuarios activos)
        Index(
            "idx_usuario_rol",
            "rol_usuario",
            postgresql_where=text("estado_registro IS TRUE"),
        ),
        # Acelera el login por email (solo filas donde email no es null)
        Index(
            "idx_usuario_email",
            "email_usuario",
            postgresql_where=text("email_usuario IS NOT NULL"),
        ),
    )
