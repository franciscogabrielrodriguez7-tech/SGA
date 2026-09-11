"""
auditoria_controller.py
------------------------
NUEVO — habilitado por la tabla auditoria_sistema del esquema
actualizado. Antes (esquema anterior, sin auditoría centralizada) no
existía ningún mecanismo para reconstruir el historial real de un
alquiler; ahora auditoria_sistema guarda automáticamente
datos_anteriores/datos_nuevos de cada INSERT/UPDATE/DELETE, así que el
historial y el detalle de una renovación se leen directamente de ahí,
sin necesidad de tablas ni columnas adicionales.
"""

from sqlalchemy import text
from sqlalchemy.orm import Session


# =========================================================
# HISTORIAL / TRAZABILIDAD DE UN ALQUILER
# -----------------------------------------------------------
# Devuelve TODOS los eventos de auditoria_sistema para la tabla
# "alquiler" con id_registro_afectado = id_alquiler, del más reciente
# al más antiguo. Cada evento incluye quién lo hizo (id_usuario_accion,
# resuelto contra el nombre del usuario cuando existe) y el diff
# completo antes/después.
# =========================================================

def historial_alquiler(db: Session, id_alquiler: int):

    existe = db.execute(
        text("SELECT 1 FROM alquiler WHERE id_alquiler = :id_alquiler"),
        {"id_alquiler": id_alquiler}
    ).first()

    if not existe:
        return None

    sql = text("""
        SELECT
            au.id_auditoria,
            au.tipo_operacion,
            au.datos_anteriores,
            au.datos_nuevos,
            au.id_usuario_accion,
            u.nombres_usuario AS nombres_usuario_accion,
            u.apellidos_usuario AS apellidos_usuario_accion,
            au.fecha_accion
        FROM auditoria_sistema au
        LEFT JOIN usuario u ON u.id_usuario = au.id_usuario_accion
        WHERE au.nombre_tabla = 'alquiler'
          AND au.id_registro_afectado = :id_alquiler
        ORDER BY au.fecha_accion DESC, au.id_auditoria DESC
    """)

    resultado = db.execute(sql, {"id_alquiler": str(id_alquiler)})

    eventos = [dict(row._mapping) for row in resultado]

    return {
        "id_alquiler": id_alquiler,
        "total_eventos": len(eventos),
        "eventos": eventos
    }


# =========================================================
# DETALLE DE UNA RENOVACIÓN (registro puntual de auditoría)
# -----------------------------------------------------------
# No existe una tabla "renovacion" independiente: una renovación es,
# en términos de datos, un evento UPDATE sobre "alquiler" que aumenta
# tiempo_alquiler_dias. `id` aquí es el id_auditoria del evento
# generado por auditoria_sistema en el momento en que se ejecutó
# POST /alquileres/{id}/renovaciones.
# =========================================================

def obtener_registro_auditoria(db: Session, id_auditoria: int):

    sql = text("""
        SELECT
            au.id_auditoria,
            au.nombre_tabla,
            au.tipo_operacion,
            au.id_registro_afectado,
            au.datos_anteriores,
            au.datos_nuevos,
            au.id_usuario_accion,
            u.nombres_usuario AS nombres_usuario_accion,
            u.apellidos_usuario AS apellidos_usuario_accion,
            au.fecha_accion
        FROM auditoria_sistema au
        LEFT JOIN usuario u ON u.id_usuario = au.id_usuario_accion
        WHERE au.id_auditoria = :id_auditoria
    """)

    resultado = db.execute(sql, {"id_auditoria": id_auditoria}).first()

    if not resultado:
        return None

    return dict(resultado._mapping)
