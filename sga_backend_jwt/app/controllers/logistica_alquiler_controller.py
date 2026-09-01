from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.logistica_alquiler import LogisticaAlquiler
from app.utils.db_errors import extraer_mensaje_negocio


# =========================================================
# REGISTRAR GASTO
# -----------------------------------------------------------
# logistica_alquiler no distingue "gasto puro" de entrega/
# recogida: es_recogida es booleano NOT NULL. Por eso el
# esquema (GastoCreate) exige que el cliente indique
# explícitamente a cuál de las dos se asocia.
# =========================================================

def crear_gasto(
    db: Session,
    datos,
    usuario_actual
):

    try:

        gasto = LogisticaAlquiler(
            id_alquiler=datos.id_alquiler,
            # CORREGIDO: ya no viene del payload (roadmap sección 25)
            id_usuario_logistico=usuario_actual.id_usuario,
            es_recogida=datos.es_recogida,
            valor_gasto_logistico=datos.valor_gasto_logistico,
            descripcion_gasto_logistico=datos.descripcion_gasto_logistico,
            observaciones_logistica_alquiler=datos.observaciones_logistica_alquiler
        )

        db.add(gasto)

        db.commit()

        db.refresh(gasto)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(
            extraer_mensaje_negocio(error)
        )

    return gasto


# =========================================================
# LISTAR GASTOS (filtros opcionales)
# =========================================================

def obtener_gastos(
    db: Session,
    id_alquiler: int = None
):

    sql = """
        SELECT
            l.id_logistica_alquiler,
            l.id_alquiler,
            l.id_usuario_logistico,
            u.nombres_usuario AS nombres_logistico,
            l.fecha_gasto,
            l.descripcion_gasto_logistico,
            l.valor_gasto_logistico,
            l.observaciones_logistica_alquiler,
            l.es_recogida
        FROM logistica_alquiler l
        INNER JOIN usuario u ON l.id_usuario_logistico = u.id_usuario
        WHERE 1=1
    """

    parametros = {}

    if id_alquiler:
        sql += " AND l.id_alquiler = :id_alquiler"
        parametros["id_alquiler"] = id_alquiler

    sql += " ORDER BY l.fecha_gasto DESC"

    resultado = db.execute(text(sql), parametros)

    return [
        dict(row._mapping)
        for row in resultado
    ]


# =========================================================
# RESUMEN SEMANAL (RN-GAS-07: cálculo para períodos de 7 días)
# -----------------------------------------------------------
# NOTA: RN-GAS quedó marcada como "regla parcial" (no está
# definido si el total debe ser general o por empleado). Este
# resumen calcula el total GENERAL por semana. Si se necesita
# desglose por empleado, hay que confirmarlo primero.
# =========================================================

def resumen_semanal_gastos(
    db: Session
):

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

    return [
        dict(row._mapping)
        for row in resultado
    ]
