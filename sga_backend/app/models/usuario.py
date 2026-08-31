from sqlalchemy import (
    Column,
    String,
    Boolean,
    TIMESTAMP,
    text
)

from app.config.database import Base


class Usuario(Base):

    __tablename__ = "usuario"

    id_usuario = Column(
        String(20),
        primary_key=True
    )

    rol_usuario = Column(
        String(20),
        nullable=False,
        server_default="cliente"
    )

    nombres_usuario = Column(
        String(100),
        nullable=False
    )

    apellidos_usuario = Column(
        String(100),
        nullable=False
    )

    email_usuario = Column(
        String(100),
        unique=True
    )

    telefono_usuario = Column(
        String(20),
        nullable=False,
        unique=True
    )

    contrasena_usuario = Column(
        String(255)
    )

    tipo_documento = Column(
        String(20),
        nullable=False
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

    estado_usuario = Column(
        Boolean,
        nullable=False,
        server_default="true"
    )
