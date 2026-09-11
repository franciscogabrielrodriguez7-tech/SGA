from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.logistica_alquiler import LogisticaAlquiler
from app.models.logistica_alquiler_alquiler import LogisticaAlquilerAlquiler
from app.utils.audit_context import set_audit_context
from app.utils.db_errors import extraer_mensaje_negocio


# =========================================================
# REGISTRAR GASTO
# -----------------------------------------------------------
# Registra un gasto logístico (tipo_movimiento = 'GASTO').
# Puede estar vinculado a uno o varios alquileres a través de la
# tabla puente logistica_alquiler_alquiler.
# =========================================================

def crear_gasto(db: Session, datos, usuario_actual):

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        gasto = LogisticaAlquiler(
            id_usuario_logistico=usuario_actual.id_usuario,
            tipo_movimiento='GASTO',
            valor_gasto_logistico=datos.valor_gasto_logistico,
            descripcion_gasto_logistico=datos.descripcion_gasto_logistico,
            observaciones_logistica_alquiler=datos.observaciones_logistica_alquiler
        )
        db.add(gasto)
        db.flush()

        for id_alquiler in datos.ids_alquiler:
            puente = LogisticaAlquilerAlquiler(
                id_logistica_alquiler=gasto.id_logistica_alquiler,
                id_alquiler=id_alquiler
            )
            db.add(puente)

        db.commit()
        db.refresh(gasto)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return {
        "id_logistica_alquiler": gasto.id_logistica_alquiler,
        "tipo_movimiento": gasto.tipo_movimiento,
        "valor_gasto_logistico": float(gasto.valor_gasto_logistico) if gasto.valor_gasto_logistico else 0.0,
        "ids_alquiler": datos.ids_alquiler
    }


# =========================================================
# LISTAR GASTOS (filtros opcionales)
# =========================================================

def obtener_gastos(db: Session, id_alquiler: int = None):

    sql = """
        SELECT
            l.id_logistica_alquiler,
            l.id_usuario_logistico,
            u.nombres_usuario AS nombres_logistico,
            l.fecha_gasto,
            l.descripcion_gasto_logistico,
            l.valor_gasto_logistico,
            l.observaciones_logistica_alquiler,
            l.tipo_movimiento,
            array_remove(array_agg(la.id_alquiler), NULL) AS ids_alquiler
        FROM logistica_alquiler l
        INNER JOIN usuario u ON l.id_usuario_logistico = u.id_usuario
        LEFT JOIN logistica_alquiler_alquiler la ON l.id_logistica_alquiler = la.id_logistica_alquiler
        WHERE l.tipo_movimiento = 'GASTO'
    """

    parametros = {}

    if id_alquiler:
        sql += " AND la.id_alquiler = :id_alquiler"
        parametros["id_alquiler"] = id_alquiler

    sql += " GROUP BY l.id_logistica_alquiler, u.nombres_usuario ORDER BY l.fecha_gasto DESC"

    resultado = db.execute(text(sql), parametros)

    return [dict(row._mapping) for row in resultado]


# =========================================================
# RESUMEN SEMANAL (total general por semana)
# =========================================================

def resumen_semanal_gastos(db: Session):

    sql = text("""
        SELECT
            date_trunc('week', fecha_gasto)::date AS semana_inicio,
            COUNT(*) AS cantidad_registros,
            SUM(valor_gasto_logistico) AS total_gasto
        FROM logistica_alquiler
        GROUP BY date_trunc('week', fecha_gasto)
        ORDER BY semana_inicio DESC
    """)

    resultado = db.execute(sql)

    return [dict(row._mapping) for row in resultado]
