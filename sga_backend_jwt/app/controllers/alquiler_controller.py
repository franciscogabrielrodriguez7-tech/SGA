from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.alquiler import Alquiler
from app.models.detalle_alquiler import DetalleAlquiler
from app.models.logistica_alquiler import LogisticaAlquiler
from app.models.logistica_alquiler_alquiler import LogisticaAlquilerAlquiler
from app.utils.audit_context import set_audit_context
from app.utils.db_errors import extraer_mensaje_negocio
from app.utils.tiempo import (
    FECHA_VENCIMIENTO_SQL,
    fecha_actual_bogota,
    fecha_vencimiento as calcular_fecha_vencimiento,
    enriquecer_temporal,
)
from app.utils.unidades import validar_tiempo_alquiler_para_productos
from app.controllers.detalle_alquiler_controller import _recalcular_precio_alquiler


# =========================================================
# GRAFO DE TRANSICIONES VÁLIDAS (ciclo de vida del dominio)
# =========================================================

TRANSICIONES_VALIDAS = {
    "pendiente": {"activo", "cancelado"},
    "activo": {"vencido", "recogido", "terminado", "cancelado"},
    "vencido": {"recogido", "terminado", "cancelado"},
    "recogido": {"terminado"},
    "terminado": set(),
    "cancelado": set(),
}

ESTADOS_FINALES = {"terminado", "cancelado"}


SELECT_ALQUILER_HEADER = f"""
    SELECT
        a.id_alquiler,
        a.estado_alquiler,
        a.barrio,
        a.direccion,
        a.deposito,
        a.precio_alquiler,
        a.fecha_inicio,
        a.tiempo_alquiler_dias,
        {FECHA_VENCIMIENTO_SQL} AS fecha_vencimiento,
        a.se_lleva,
        a.se_recoge,
        a.estado_registro,
        a.fecha_creacion,
        a.fecha_actualizacion,
        a.id_usuario_creador,
        creador.nombres_usuario AS nombres_creador,
        creador.apellidos_usuario AS apellidos_creador,
        a.id_usuario_cliente,
        cliente.nombres_usuario AS nombres_cliente,
        cliente.apellidos_usuario AS apellidos_cliente
    FROM alquiler a
    INNER JOIN usuario creador ON a.id_usuario_creador = creador.id_usuario
    INNER JOIN usuario cliente ON a.id_usuario_cliente = cliente.id_usuario
"""


def _obtener_detalles(db: Session, id_alquiler: int):

    sql = text("""
        SELECT
            d.id_detalle_alquiler,
            d.id_producto,
            p.nombre_producto,
            d.cantidad_productos,
            d.precio_conjunto,
            d.es_producto_extra,
            d.estado_registro
        FROM detalle_alquiler d
        INNER JOIN producto p ON d.id_producto = p.id_producto
        WHERE d.id_alquiler = :id_alquiler
        ORDER BY d.id_detalle_alquiler
    """)

    resultado = db.execute(sql, {"id_alquiler": id_alquiler})

    return [dict(row._mapping) for row in resultado]


# =========================================================
# RECONCILIACIÓN TEMPORAL
# -----------------------------------------------------------
# Transiciona automáticamente 'activo' -> 'vencido'. La llaman tanto
# el scheduler diario (app/utils/scheduler.py) como las consultas de
# lectura más usadas, para que la información nunca esté
# desactualizada aunque el scheduler todavía no haya corrido ese día.
# =========================================================

def verificar_y_actualizar_vencidos(db: Session) -> int:

    sql = text(f"""
        UPDATE alquiler
        SET estado_alquiler = 'vencido'
        WHERE estado_alquiler = 'activo'
          AND {FECHA_VENCIMIENTO_SQL.replace('a.', '')} < CURRENT_DATE
    """)

    resultado = db.execute(sql)
    db.commit()

    return resultado.rowcount


# =========================================================
# CREAR ALQUILER (transaccional, con detalle anidado)
# =========================================================

def crear_alquiler(db: Session, datos, usuario_actual):

    verificar_y_actualizar_vencidos(db)

    # Autoridad real de la regla "unidad_minima_alquiler": no confía en
    # que el frontend ya haya restringido las opciones — vuelve a
    # consultar la unidad mínima de cada producto involucrado y valida
    # que tiempo_alquiler_dias sea compatible con la más restrictiva.
    ids_producto = [linea.id_producto for linea in datos.detalles]

    if ids_producto:
        filas = db.execute(
            text(
                "SELECT unidad_minima_alquiler FROM producto "
                "WHERE id_producto = ANY(:ids)"
            ),
            {"ids": ids_producto},
        ).fetchall()

        unidades_minimas = [fila[0] for fila in filas]

        validar_tiempo_alquiler_para_productos(
            datos.tiempo_alquiler_dias, unidades_minimas
        )

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        alquiler = Alquiler(
            # CRÍTICO: id_usuario_creador NUNCA viene del payload — es
            # el usuario autenticado por JWT.
            id_usuario_creador=usuario_actual.id_usuario,
            id_usuario_cliente=datos.id_usuario_cliente,
            barrio=datos.barrio,
            direccion=datos.direccion,
            deposito=datos.deposito,
            precio_alquiler=datos.precio_alquiler,
            fecha_inicio=datos.fecha_inicio,
            tiempo_alquiler_dias=datos.tiempo_alquiler_dias,
            se_lleva=datos.se_lleva,
            se_recoge=datos.se_recoge
        )

        db.add(alquiler)
        db.flush()

        for linea in datos.detalles:

            detalle = DetalleAlquiler(
                id_alquiler=alquiler.id_alquiler,
                id_producto=linea.id_producto,
                cantidad_productos=linea.cantidad_productos,
                precio_conjunto=linea.precio_conjunto,
                es_producto_extra=linea.es_producto_extra
            )

            db.add(detalle)

        db.flush()

        # DECISIÓN DE NEGOCIO (2026-09): precio_alquiler ya NO se
        # recalcula automáticamente como SUM(precio_conjunto). Ahora es
        # un campo controlado por el staff (como deposito): puede
        # incluir descuentos implícitos de logística u otros ajustes
        # que un recálculo automático borraría en silencio. El valor
        # que llega en `datos.precio_alquiler` se persiste tal cual
        # (ver Producto.__init__ arriba, que ya lo asigna).

        db.commit()

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_alquiler(db, alquiler.id_alquiler)


# =========================================================
# OBTENER ALQUILER POR ID (con detalle + campos temporales)
# =========================================================

def obtener_alquiler(db: Session, id_alquiler: int):

    verificar_y_actualizar_vencidos(db)

    sql = text(SELECT_ALQUILER_HEADER + " WHERE a.id_alquiler = :id_alquiler")

    resultado = db.execute(sql, {"id_alquiler": id_alquiler}).first()

    if not resultado:
        return None

    alquiler = enriquecer_temporal(dict(resultado._mapping))
    alquiler["detalles"] = _obtener_detalles(db, id_alquiler)

    return alquiler


# =========================================================
# LISTAR ALQUILERES (filtros opcionales)
# =========================================================

def obtener_alquileres(db: Session, estado_alquiler: str = None, id_usuario_cliente: str = None):

    verificar_y_actualizar_vencidos(db)

    sql = SELECT_ALQUILER_HEADER + " WHERE 1=1"

    parametros = {}

    if estado_alquiler:
        sql += " AND a.estado_alquiler = :estado_alquiler"
        parametros["estado_alquiler"] = estado_alquiler

    if id_usuario_cliente:
        sql += " AND a.id_usuario_cliente = :id_usuario_cliente"
        parametros["id_usuario_cliente"] = id_usuario_cliente

    sql += " ORDER BY a.fecha_creacion DESC"

    resultado = db.execute(text(sql), parametros)

    return [enriquecer_temporal(dict(row._mapping)) for row in resultado]


# =========================================================
# MATRIZ DE EDICIÓN POR ESTADO
# =========================================================

CAMPOS_EDITABLES_POR_ESTADO = {
    "pendiente": {"direccion", "barrio", "precio_alquiler", "deposito", "fecha_inicio", "tiempo_alquiler_dias", "se_lleva", "se_recoge"},
    "activo": {"precio_alquiler", "tiempo_alquiler_dias", "se_lleva", "se_recoge"},
    "vencido": {"precio_alquiler", "tiempo_alquiler_dias"},
    "recogido": set(),
    "terminado": set(),
    "cancelado": set(),
}


def actualizar_alquiler(db: Session, id_alquiler: int, datos, usuario_actual):

    verificar_y_actualizar_vencidos(db)

    alquiler = db.query(Alquiler).filter(Alquiler.id_alquiler == id_alquiler).first()

    if not alquiler:
        return None

    campos = datos.model_dump(exclude_unset=True)

    if not campos:
        return obtener_alquiler(db, id_alquiler)

    permitidos = CAMPOS_EDITABLES_POR_ESTADO.get(alquiler.estado_alquiler, set())

    no_permitidos = set(campos.keys()) - permitidos

    if no_permitidos:
        raise ValueError(
            f"En estado '{alquiler.estado_alquiler}' no se puede modificar: "
            f"{', '.join(sorted(no_permitidos))} (ver matriz de edición por estado)."
        )

    # tiempo_alquiler_dias: un aumento se trata como RENOVACIÓN (mismas
    # reglas); una reducción es corrección administrativa, validada
    # para que no produzca un vencimiento en el pasado.
    if "tiempo_alquiler_dias" in campos:

        tiempo_nuevo = campos.pop("tiempo_alquiler_dias")

        if tiempo_nuevo > alquiler.tiempo_alquiler_dias:
            dias_extra = tiempo_nuevo - alquiler.tiempo_alquiler_dias
            _aplicar_renovacion(alquiler, dias_extra)

        elif tiempo_nuevo < alquiler.tiempo_alquiler_dias:
            nueva_fecha = calcular_fecha_vencimiento(alquiler.fecha_inicio, tiempo_nuevo)

            if nueva_fecha < fecha_actual_bogota():
                raise ValueError(
                    "No se puede reducir el tiempo de alquiler porque la nueva "
                    f"fecha de vencimiento ({nueva_fecha.isoformat()}) quedaría "
                    "en el pasado."
                )

            alquiler.tiempo_alquiler_dias = tiempo_nuevo

    for campo, valor in campos.items():
        setattr(alquiler, campo, valor)

    try:
        set_audit_context(db, usuario_actual.id_usuario)
        db.commit()

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_alquiler(db, id_alquiler)


# =========================================================
# CAMBIAR ESTADO — CORRECCIÓN ADMINISTRATIVA / OPERACIÓN DE CICLO
# -----------------------------------------------------------
# Solo valida el grafo de transiciones; la restricción de rol vive en
# la ruta (ver alquiler_routes.py).
# =========================================================

def cambiar_estado_alquiler(db: Session, id_alquiler: int, nuevo_estado: str, usuario_actual):

    verificar_y_actualizar_vencidos(db)

    alquiler = db.query(Alquiler).filter(Alquiler.id_alquiler == id_alquiler).first()

    if not alquiler:
        return None

    estado_actual = alquiler.estado_alquiler

    if nuevo_estado == estado_actual:
        raise ValueError(f"El alquiler ya se encuentra en estado '{estado_actual}'")

    permitidos = TRANSICIONES_VALIDAS.get(estado_actual, set())

    if nuevo_estado not in permitidos:
        raise ValueError(f"Transición no permitida: '{estado_actual}' -> '{nuevo_estado}'")

    alquiler.estado_alquiler = nuevo_estado

    try:
        set_audit_context(db, usuario_actual.id_usuario)
        db.commit()

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_alquiler(db, id_alquiler)


# =========================================================
# CANCELAR
# =========================================================

def cancelar_alquiler(db: Session, id_alquiler: int, usuario_actual):
    return cambiar_estado_alquiler(db, id_alquiler, "cancelado", usuario_actual)


# =========================================================
# BUSCAR (por cliente, número de documento o barrio)
# =========================================================

def buscar_alquileres(db: Session, cliente: str = None, barrio: str = None, numero: int = None):

    verificar_y_actualizar_vencidos(db)

    sql = SELECT_ALQUILER_HEADER + " WHERE 1=1"

    parametros = {}

    if cliente:
        sql += """
            AND (
                cliente.nombres_usuario ILIKE :cliente
                OR cliente.apellidos_usuario ILIKE :cliente
                OR cliente.id_usuario ILIKE :cliente
            )
        """
        parametros["cliente"] = f"%{cliente}%"

    if barrio:
        sql += " AND a.barrio ILIKE :barrio"
        parametros["barrio"] = f"%{barrio}%"

    if numero:
        sql += " AND a.id_alquiler = :numero"
        parametros["numero"] = numero

    sql += " ORDER BY a.fecha_creacion DESC"

    resultado = db.execute(text(sql), parametros)

    return [enriquecer_temporal(dict(row._mapping)) for row in resultado]


# =========================================================
# PRÓXIMOS A VENCER (alerta configurable, 2 días por defecto)
# =========================================================

def alquileres_proximos_a_vencer(db: Session, dias: int = 2):

    verificar_y_actualizar_vencidos(db)

    sql = text(
        SELECT_ALQUILER_HEADER
        + f"""
            WHERE a.estado_alquiler = 'activo'
              AND {FECHA_VENCIMIENTO_SQL}
                  BETWEEN CURRENT_DATE AND (CURRENT_DATE + (:dias || ' days')::interval)
            ORDER BY fecha_vencimiento ASC
        """
    )

    resultado = db.execute(sql, {"dias": dias})

    return [enriquecer_temporal(dict(row._mapping)) for row in resultado]


# =========================================================
# PENDIENTES DE ENTREGA
# =========================================================

def alquileres_pendientes_entrega(db: Session, solo_transporte: bool = False):

    verificar_y_actualizar_vencidos(db)

    if not solo_transporte:
        return obtener_alquileres(db, estado_alquiler="pendiente")

    sql = SELECT_ALQUILER_HEADER + " WHERE a.estado_alquiler = 'pendiente' AND a.se_lleva = TRUE"
    sql += " ORDER BY a.fecha_creacion DESC"

    resultado = db.execute(text(sql))

    return [enriquecer_temporal(dict(row._mapping)) for row in resultado]


# =========================================================
# RENOVACIÓN
# -----------------------------------------------------------
# No existe tabla "renovaciones": la operación suma días a
# alquiler.tiempo_alquiler_dias y queda registrada automáticamente
# como una fila UPDATE en auditoria_sistema (ver
# app/controllers/auditoria_controller.py para consultarla).
# =========================================================

def _aplicar_renovacion(alquiler: Alquiler, dias: int):

    alquiler.tiempo_alquiler_dias = alquiler.tiempo_alquiler_dias + dias

    if alquiler.estado_alquiler == "vencido":

        nueva_fecha = calcular_fecha_vencimiento(
            alquiler.fecha_inicio, alquiler.tiempo_alquiler_dias
        )

        if nueva_fecha >= fecha_actual_bogota():
            alquiler.estado_alquiler = "activo"
        # si sigue en el pasado, se queda "vencido" a propósito


def renovar_alquiler(db: Session, id_alquiler: int, dias: int, usuario_actual, precio_alquiler=None):

    verificar_y_actualizar_vencidos(db)

    alquiler = db.query(Alquiler).filter(Alquiler.id_alquiler == id_alquiler).first()

    if not alquiler:
        return None

    if alquiler.estado_alquiler not in ("activo", "vencido"):
        raise ValueError(
            "Solo se puede renovar un alquiler en estado 'activo' o "
            f"'vencido'. Estado actual: '{alquiler.estado_alquiler}'"
        )

    # Misma regla de unidad_minima_alquiler que en la creación: los
    # días de renovación deben ser compatibles con la unidad más
    # restrictiva de los productos YA incluidos en este alquiler (ver
    # app/utils/unidades.py). No basta con que la UI ya lo restrinja.
    unidades_minimas = db.execute(
        text("""
            SELECT p.unidad_minima_alquiler
            FROM detalle_alquiler d
            INNER JOIN producto p ON d.id_producto = p.id_producto
            WHERE d.id_alquiler = :id_alquiler AND d.estado_registro = TRUE
        """),
        {"id_alquiler": id_alquiler},
    ).fetchall()

    validar_tiempo_alquiler_para_productos(dias, [fila[0] for fila in unidades_minimas])

    _aplicar_renovacion(alquiler, dias)

    # precio_alquiler es un campo de negocio controlado por el staff
    # (ver decisión de precio_alquiler en crear_alquiler): si se envía
    # un nuevo total junto con la renovación, se persiste tal cual; si
    # no, el precio actual no se toca.
    if precio_alquiler is not None:
        alquiler.precio_alquiler = precio_alquiler

    try:
        set_audit_context(db, usuario_actual.id_usuario)
        db.commit()

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    # El UPDATE anterior disparó trg_auditoria_alquiler, que insertó un
    # evento en auditoria_sistema. Se recupera su id para que el
    # cliente HTTP pueda consultarlo luego vía GET /renovaciones/{id}.
    id_auditoria = db.execute(
        text("""
            SELECT id_auditoria FROM auditoria_sistema
            WHERE nombre_tabla = 'alquiler' AND id_registro_afectado = :id_alquiler
            ORDER BY id_auditoria DESC LIMIT 1
        """),
        {"id_alquiler": str(id_alquiler)}
    ).scalar()

    alquiler_actualizado = obtener_alquiler(db, id_alquiler)
    alquiler_actualizado["id_auditoria_renovacion"] = id_auditoria

    return alquiler_actualizado


# =========================================================
# ENTREGA — despacho inicial en obra (pendiente -> activo)
# =========================================================

def registrar_entrega(db: Session, id_alquiler: int, datos, usuario_actual):
    """
    Registra una entrega (ENTREGA) en logistica_alquiler y crea la fila
    correspondiente en la tabla puente logistica_alquiler_alquiler.
    Transiciona el alquiler de 'pendiente' → 'activo'.
    """

    verificar_y_actualizar_vencidos(db)

    alquiler = db.query(Alquiler).filter(Alquiler.id_alquiler == id_alquiler).first()

    if not alquiler:
        return None

    if alquiler.estado_alquiler != "pendiente":
        raise ValueError(
            "Solo se puede registrar una entrega cuando el alquiler "
            f"está en estado 'pendiente'. Estado actual: '{alquiler.estado_alquiler}'"
        )

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        entrega = LogisticaAlquiler(
            id_usuario_logistico=usuario_actual.id_usuario,
            tipo_movimiento="ENTREGA",
            valor_gasto_logistico=datos.valor_gasto_logistico,
            descripcion_gasto_logistico=datos.descripcion_gasto_logistico,
            observaciones_logistica_alquiler=datos.observaciones_logistica_alquiler,
        )

        db.add(entrega)
        db.flush()  # obtiene id_logistica_alquiler antes del commit

        puente = LogisticaAlquilerAlquiler(
            id_logistica_alquiler=entrega.id_logistica_alquiler,
            id_alquiler=id_alquiler,
        )
        db.add(puente)

        alquiler.estado_alquiler = "activo"

        db.commit()
        db.refresh(entrega)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    # Devolvemos un dict enriquecido con id_alquiler para que el route
    # pueda incluirlo en la respuesta sin cambiar el contrato de la API.
    return {
        "id_logistica_alquiler": entrega.id_logistica_alquiler,
        "id_alquiler": id_alquiler,
        "tipo_movimiento": entrega.tipo_movimiento,
    }


def obtener_entregas(db: Session, id_alquiler: int):

    sql = text("""
        SELECT
            l.id_logistica_alquiler,
            laa.id_alquiler,
            l.id_usuario_logistico,
            u.nombres_usuario AS nombres_logistico,
            l.fecha_gasto,
            l.descripcion_gasto_logistico,
            l.valor_gasto_logistico,
            l.observaciones_logistica_alquiler
        FROM logistica_alquiler l
        INNER JOIN logistica_alquiler_alquiler laa
            ON l.id_logistica_alquiler = laa.id_logistica_alquiler
        INNER JOIN usuario u ON l.id_usuario_logistico = u.id_usuario
        WHERE laa.id_alquiler = :id_alquiler
          AND l.tipo_movimiento = 'ENTREGA'
          AND l.estado_registro = TRUE
        ORDER BY l.fecha_gasto
    """)

    resultado = db.execute(sql, {"id_alquiler": id_alquiler})

    return [dict(row._mapping) for row in resultado]


# =========================================================
# RECOGIDA — retiro de equipos de obra
# =========================================================

def registrar_recogida(db: Session, id_alquiler: int, datos, usuario_actual):
    """
    Registra una recogida (RECOGIDA) en logistica_alquiler y crea la fila
    en la tabla puente. Requiere entrega previa y transiciona a 'recogido'.
    """

    verificar_y_actualizar_vencidos(db)

    alquiler = db.query(Alquiler).filter(Alquiler.id_alquiler == id_alquiler).first()

    if not alquiler:
        return None

    # RN-LOG-04: no se puede recoger sin haber entregado antes.
    entrega_previa = db.execute(
        text("""
            SELECT 1
            FROM logistica_alquiler l
            INNER JOIN logistica_alquiler_alquiler laa
                ON l.id_logistica_alquiler = laa.id_logistica_alquiler
            WHERE laa.id_alquiler = :id_alquiler
              AND l.tipo_movimiento = 'ENTREGA'
              AND l.estado_registro = TRUE
            LIMIT 1
        """),
        {"id_alquiler": id_alquiler},
    ).first()

    if not entrega_previa:
        raise ValueError(
            "No se puede registrar una recogida sin una entrega previa para este alquiler."
        )

    if alquiler.estado_alquiler not in ("activo", "vencido"):
        raise ValueError(
            "Solo se puede registrar una recogida cuando el alquiler "
            f"está 'activo' o 'vencido'. Estado actual: '{alquiler.estado_alquiler}'"
        )

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        recogida = LogisticaAlquiler(
            id_usuario_logistico=usuario_actual.id_usuario,
            tipo_movimiento="RECOGIDA",
            valor_gasto_logistico=datos.valor_gasto_logistico,
            descripcion_gasto_logistico=datos.descripcion_gasto_logistico,
            observaciones_logistica_alquiler=datos.observaciones_logistica_alquiler,
        )

        db.add(recogida)
        db.flush()

        puente = LogisticaAlquilerAlquiler(
            id_logistica_alquiler=recogida.id_logistica_alquiler,
            id_alquiler=id_alquiler,
        )
        db.add(puente)

        alquiler.estado_alquiler = "recogido"

        db.commit()
        db.refresh(recogida)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return {
        "id_logistica_alquiler": recogida.id_logistica_alquiler,
        "id_alquiler": id_alquiler,
        "tipo_movimiento": recogida.tipo_movimiento,
    }


def obtener_recogidas(db: Session, id_alquiler: int):

    sql = text("""
        SELECT
            l.id_logistica_alquiler,
            laa.id_alquiler,
            l.id_usuario_logistico,
            u.nombres_usuario AS nombres_logistico,
            l.fecha_gasto,
            l.descripcion_gasto_logistico,
            l.valor_gasto_logistico,
            l.observaciones_logistica_alquiler
        FROM logistica_alquiler l
        INNER JOIN logistica_alquiler_alquiler laa
            ON l.id_logistica_alquiler = laa.id_logistica_alquiler
        INNER JOIN usuario u ON l.id_usuario_logistico = u.id_usuario
        WHERE laa.id_alquiler = :id_alquiler
          AND l.tipo_movimiento = 'RECOGIDA'
          AND l.estado_registro = TRUE
        ORDER BY l.fecha_gasto
    """)

    resultado = db.execute(sql, {"id_alquiler": id_alquiler})

    return [dict(row._mapping) for row in resultado]
