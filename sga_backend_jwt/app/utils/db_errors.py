"""
db_errors.py
------------
Los triggers de SGA (database/02_funciones_y_triggers.sql) usan RAISE
EXCEPTION con mensajes de negocio claros (stock insuficiente, fecha
inválida, alquiler cerrado, mínimo un admin activo, etc.). Sin este
helper, esos errores llegarían al cliente como un 500 genérico
(str(error) con todo el traceback de psycopg2). Esta utilidad extrae
solo el mensaje de negocio para poder devolverlo como un 400 legible.
"""

from sqlalchemy.exc import DBAPIError


def extraer_mensaje_negocio(error: Exception) -> str:
    """
    Si el error viene de un RAISE EXCEPTION de un trigger de
    PostgreSQL, devuelve solo el mensaje de negocio (sin el
    traceback de psycopg2/SQLAlchemy). Si no se puede identificar,
    devuelve el mensaje original tal cual.
    """

    origen = getattr(error, "orig", None)

    if origen is not None:

        diag = getattr(origen, "diag", None)

        if diag is not None and getattr(diag, "message_primary", None):
            return diag.message_primary

        texto = str(origen).strip().splitlines()
        if texto:
            return texto[0]

    return str(error)


def es_error_de_base_de_datos(error: Exception) -> bool:
    return isinstance(error, DBAPIError)
