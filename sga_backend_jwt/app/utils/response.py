from typing import Any, Optional

from datetime import date, datetime, time

from decimal import Decimal

from fastapi.responses import JSONResponse


# =========================================================
# CONVERTIR DATOS A FORMATO JSON
# =========================================================

# Campos sensibles que jamás deben serializarse en una respuesta HTTP,
# ni desde instancias ORM ni desde diccionarios o estructuras anidadas.
CAMPOS_SENSIBLES_EXCLUIDOS = frozenset({
    "contrasena_usuario",
    "contrasena",
    "password",
    "password_hash",
    "hashed_password",
})

# Lista blanca de respaldo por nombre de tabla para modelos con campos
# sensibles, aplicada incluso si la clase no declara __campos_publicos__.
CAMPOS_PUBLICOS_POR_TABLA = {
    "usuario": (
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
    ),
}


def _orm_to_dict(obj) -> dict:
    """
    Convierte un objeto ORM de SQLAlchemy a dict, incluyendo @property.
    Excluye los metadatos internos de SQLAlchemy (_sa_instance_state) y
    cualquier campo sensible (contrasena_usuario, etc.). Si el modelo
    define __campos_publicos__ (o su tabla figura en
    CAMPOS_PUBLICOS_POR_TABLA), aplica estrictamente esa lista blanca.
    """
    campos_publicos = getattr(
        type(obj),
        "__campos_publicos__",
        CAMPOS_PUBLICOS_POR_TABLA.get(getattr(obj, "__tablename__", None)),
    )

    if campos_publicos is not None:
        allowed = set(campos_publicos)
        result = {}
        for campo in campos_publicos:
            if campo in CAMPOS_SENSIBLES_EXCLUIDOS or campo.startswith("_"):
                continue
            if campo in obj.__dict__:
                result[campo] = obj.__dict__[campo]
            elif hasattr(type(obj), campo):
                result[campo] = getattr(obj, campo, None)
        # Añadir @property explícitamente incluidos en la lista blanca
        for name in dir(type(obj)):
            if (
                name in allowed
                and name not in CAMPOS_SENSIBLES_EXCLUIDOS
                and isinstance(getattr(type(obj), name, None), property)
            ):
                result[name] = getattr(obj, name)
        return result

    # Atributos de columna (del __dict__ de SQLAlchemy), excluyendo campos sensibles
    result = {
        k: v
        for k, v in obj.__dict__.items()
        if not k.startswith("_") and k not in CAMPOS_SENSIBLES_EXCLUIDOS
    }
    # Añadir @property definidos en el modelo (ej. stock_disponible)
    for name in dir(type(obj)):
        if (
            name not in CAMPOS_SENSIBLES_EXCLUIDOS
            and isinstance(getattr(type(obj), name, None), property)
        ):
            result[name] = getattr(obj, name)
    return result


def convertir_json(data: Any):

    if isinstance(data, dict):
        return {
            key: convertir_json(value)
            for key, value in data.items()
            if key not in CAMPOS_SENSIBLES_EXCLUIDOS
        }

    if isinstance(data, (list, tuple)):
        return [
            convertir_json(item)
            for item in data
        ]

    if isinstance(data, (datetime, date, time)):
        return data.isoformat()

    if isinstance(data, Decimal):
        return float(data)

    # Objeto ORM de SQLAlchemy (tiene __tablename__ como señal)
    if hasattr(data, "__tablename__"):
        return convertir_json(_orm_to_dict(data))

    return data


# =========================================================
# RESPUESTA EXITOSA
# =========================================================

def response_success(
    mensaje: str,
    data: Any = None,
    code: int = 200
):

    return JSONResponse(
        status_code=code,
        content={
            "status": True,
            "mensaje": mensaje,
            "data": convertir_json(data),
            "error": None,
            "code": code
        }
    )


# =========================================================
# RESPUESTA DE ERROR
# =========================================================

def response_error(
    mensaje: str,
    error: Optional[str] = None,
    code: int = 400,
    data: Any = None
):

    return JSONResponse(
        status_code=code,
        content={
            "status": False,
            "mensaje": mensaje,
            "data": convertir_json(data),
            "error": error,
            "code": code
        }
    )
