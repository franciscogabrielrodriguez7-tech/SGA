from sqlalchemy import Column, String, Boolean, TIMESTAMP, Index, text

from app.config.database import Base


class Usuario(Base):

    __tablename__ = "usuario"

    # Lista blanca de atributos públicos permitidos al serializar instancias
    # ORM de Usuario hacia JSON (ver app/utils/response.py). Excluye
    # contrasena_usuario y evita que futuras propiedades sensibles del modelo
    # se expongan accidentalmente en respuestas HTTP.
    __campos_publicos__ = (
        "id_usuario",
        "rol_usuario",
        "nombres_usuario",
        "apellidos_usuario",
        "email_usuario",
        "telefono_usuario",
        "tipo_documento",
        "estado_registro",
        "fecha_creacion",
        "fecha_actualizacion",
    )

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
