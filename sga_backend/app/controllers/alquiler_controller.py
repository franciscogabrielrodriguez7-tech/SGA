from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.alquiler import Alquiler
from app.models.detalle_alquiler import DetalleAlquiler
from app.models.logistica_alquiler import LogisticaAlquiler
from app.utils.db_errors import extraer_mensaje_negocio


# =========================================================
# GRAFO DE TRANSICIONES VÁLIDAS (RN-EST-01 a 06)
# -----------------------------------------------------------
# NOTA: la base de datos (trg_prohibir_reabrir_alquiler) solo
# impide "reabrir" un alquiler ya cerrado (terminado/recogido/
# cancelado). NO valida la secuencia intermedia completa. Este
# grafo se agrega aquí, en el backend, para cubrir esa parte de
# RN-EST que la BD no cubre.
# =========================================================

TRANSICIONES_VALIDAS = {
    "pendiente": {"activo", "cancelado"},
    "activo": {"vencido", "recogido", "cancelado"},
    "vencido": {"recogido", "cancelado"},
    "recogido": {"terminado"},
    "terminado": set(),
    "cancelado": set(),
}


SELECT_ALQUILER_HEADER = """
    SELECT
        a.id_alquiler,
        a.estado_alquiler,
        a.barrio,
        a.direccion,
        a.deposito,
        a.precio_alquiler,
        a.fecha_inicio,
        a.tiempo_alquiler,
        (a.fecha_inicio + (a.tiempo_alquiler * 7) * INTERVAL '1 day')::date
            AS fecha_vencimiento,
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

    resultado = db.execute(
        sql,
        {
            "id_alquiler": id_alquiler
        }
    )

    return [
        dict(row._mapping)
        for row in resultado
    ]


# =========================================================
# CREAR ALQUILER (transaccional, con detalle anidado)
# =========================================================

def crear_alquiler(
    db: Session,
    datos
):

    try:

        alquiler = Alquiler(
            id_usuario_creador=datos.id_usuario_creador,
            id_usuario_cliente=datos.id_usuario_cliente,
            barrio=datos.barrio,
            deposito=datos.deposito,
            precio_alquiler=datos.precio_alquiler,
            direccion=datos.direccion,
            fecha_inicio=datos.fecha_inicio,
            tiempo_alquiler=datos.tiempo_alquiler,
            se_lleva=datos.se_lleva,
            se_recoge=datos.se_recoge
        )

        db.add(alquiler)

        # flush para obtener id_alquiler y para que corran los
        # triggers de "alquiler" (ej. validar fecha_inicio) antes
        # de insertar el detalle.
        db.flush()

        # RN-ALQ-03: mínimo un producto. La BD de este proyecto no
        # tiene un trigger que lo obligue (a diferencia de
        # sga_schema.sql), así que se garantiza aquí insertando
        # todas las líneas dentro de la MISMA transacción: si
        # cualquier línea falla (stock insuficiente, etc.), se
        # revierte también la creación del encabezado.
        for linea in datos.detalles:

            detalle = DetalleAlquiler(
                id_alquiler=alquiler.id_alquiler,
                id_producto=linea.id_producto,
                cantidad_productos=linea.cantidad_productos,
                precio_conjunto=linea.precio_conjunto,
                es_producto_extra=linea.es_producto_extra
            )

            db.add(detalle)

        db.commit()

    except DBAPIError as error:

        db.rollback()

        raise ValueError(
            extraer_mensaje_negocio(error)
        )

    return obtener_alquiler(db, alquiler.id_alquiler)


# =========================================================
# OBTENER ALQUILER POR ID (con detalle)
# =========================================================

def obtener_alquiler(
    db: Session,
    id_alquiler: int
):

    sql = text(
        SELECT_ALQUILER_HEADER + " WHERE a.id_alquiler = :id_alquiler"
    )

    resultado = db.execute(
        sql,
        {
            "id_alquiler": id_alquiler
        }
    ).first()

    if not resultado:
        return None

    alquiler = dict(resultado._mapping)

    alquiler["detalles"] = _obtener_detalles(db, id_alquiler)

    return alquiler


# =========================================================
# LISTAR ALQUILERES (filtros opcionales)
# =========================================================

def obtener_alquileres(
    db: Session,
    estado_alquiler: str = None,
    id_usuario_cliente: str = None
):

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

    return [
        dict(row._mapping)
        for row in resultado
    ]


# =========================================================
# ACTUALIZAR ALQUILER (campos editables, RN-ALQ-06)
# =========================================================

def actualizar_alquiler(
    db: Session,
    id_alquiler: int,
    datos
):

    alquiler = db.query(Alquiler).filter(
        Alquiler.id_alquiler == id_alquiler
    ).first()

    if not alquiler:
        return None

    campos = datos.model_dump(exclude_unset=True)

    for campo, valor in campos.items():
        setattr(alquiler, campo, valor)

    try:
        db.commit()
    except DBAPIError as error:
        db.rollback()
        raise ValueError(
            extraer_mensaje_negocio(error)
        )

    return obtener_alquiler(db, id_alquiler)


# =========================================================
# CAMBIAR ESTADO (valida el grafo de transiciones)
# =========================================================

def cambiar_estado_alquiler(
    db: Session,
    id_alquiler: int,
    nuevo_estado: str
):

    alquiler = db.query(Alquiler).filter(
        Alquiler.id_alquiler == id_alquiler
    ).first()

    if not alquiler:
        return None

    estado_actual = alquiler.estado_alquiler

    if nuevo_estado == estado_actual:
        raise ValueError(
            f"El alquiler ya se encuentra en estado '{estado_actual}'"
        )

    permitidos = TRANSICIONES_VALIDAS.get(estado_actual, set())

    if nuevo_estado not in permitidos:
        raise ValueError(
            f"Transición no permitida: '{estado_actual}' -> '{nuevo_estado}' (RN-EST-01 a 06)"
        )

    alquiler.estado_alquiler = nuevo_estado

    try:
        db.commit()
    except DBAPIError as error:
        db.rollback()
        raise ValueError(
            extraer_mensaje_negocio(error)
        )

    return obtener_alquiler(db, id_alquiler)


# =========================================================
# BUSCAR (por cliente, barrio o número de detalle)
# =========================================================

def buscar_alquileres(
    db: Session,
    cliente: str = None,
    barrio: str = None,
    id_detalle: int = None
):

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

    if id_detalle:
        sql += """
            AND EXISTS (
                SELECT 1 FROM detalle_alquiler d
                WHERE d.id_alquiler = a.id_alquiler
                  AND d.id_detalle_alquiler = :id_detalle
            )
        """
        parametros["id_detalle"] = id_detalle

    sql += " ORDER BY a.fecha_creacion DESC"

    resultado = db.execute(text(sql), parametros)

    return [
        dict(row._mapping)
        for row in resultado
    ]


# =========================================================
# PRÓXIMOS A VENCER (RN-VEN-01: alerta 2 días antes por defecto)
# =========================================================

def alquileres_proximos_a_vencer(
    db: Session,
    dias: int = 2
):

    sql = text(
        SELECT_ALQUILER_HEADER
        + """
            WHERE a.estado_alquiler = 'activo'
              AND (a.fecha_inicio + (a.tiempo_alquiler * 7) * INTERVAL '1 day')::date
                  BETWEEN CURRENT_DATE AND (CURRENT_DATE + (:dias || ' days')::interval)
            ORDER BY fecha_vencimiento ASC
        """
    )

    resultado = db.execute(
        sql,
        {
            "dias": dias
        }
    )

    return [
        dict(row._mapping)
        for row in resultado
    ]


# =========================================================
# PENDIENTES DE ENTREGA
# =========================================================

def alquileres_pendientes_entrega(
    db: Session
):

    return obtener_alquileres(
        db,
        estado_alquiler="pendiente"
    )


# =========================================================
# HISTORIAL / TRAZABILIDAD
# -----------------------------------------------------------
# DECISIÓN CONFIRMADA: la base de datos no guarda el valor
# anterior de los cambios (solo fecha_actualizacion). Este
# endpoint devuelve el estado actual, no una línea de tiempo
# real, y lo indica explícitamente en la respuesta.
# =========================================================

def historial_alquiler(
    db: Session,
    id_alquiler: int
):

    alquiler = obtener_alquiler(db, id_alquiler)

    if not alquiler:
        return None

    return {
        "id_alquiler": alquiler["id_alquiler"],
        "estado_actual": alquiler["estado_alquiler"],
        "fecha_creacion": alquiler["fecha_creacion"],
        "fecha_ultima_actualizacion": alquiler["fecha_actualizacion"],
        "historial_completo_disponible": False,
        "nota": (
            "La base de datos actual no conserva el valor anterior de "
            "los cambios de estado (RN-HIS-04 pendiente de implementar "
            "con una tabla de auditoría). Este endpoint solo puede "
            "mostrar el estado y la fecha de la última actualización."
        )
    }


# =========================================================
# RENOVACIÓN (operación sobre el mismo alquiler, RN-REN-05)
# =========================================================

def renovar_alquiler(
    db: Session,
    id_alquiler: int,
    semanas: int
):

    alquiler = db.query(Alquiler).filter(
        Alquiler.id_alquiler == id_alquiler
    ).first()

    if not alquiler:
        return None

    if alquiler.estado_alquiler not in ("activo", "vencido"):
        raise ValueError(
            "Solo se puede renovar un alquiler en estado 'activo' o "
            f"'vencido'. Estado actual: '{alquiler.estado_alquiler}'"
        )

    alquiler.tiempo_alquiler = alquiler.tiempo_alquiler + semanas

    # RN-VEN-04/RN-EST-03: si estaba vencido y se renueva, vuelve a
    # quedar con un vencimiento futuro; se restablece a 'activo'.
    if alquiler.estado_alquiler == "vencido":
        alquiler.estado_alquiler = "activo"

    try:
        db.commit()
    except DBAPIError as error:
        db.rollback()
        raise ValueError(
            extraer_mensaje_negocio(error)
        )

    return obtener_alquiler(db, id_alquiler)


# =========================================================
# ENTREGAS
# =========================================================

def registrar_entrega(
    db: Session,
    id_alquiler: int,
    datos
):

    alquiler = db.query(Alquiler).filter(
        Alquiler.id_alquiler == id_alquiler
    ).first()

    if not alquiler:
        return None

    if alquiler.estado_alquiler != "pendiente":
        raise ValueError(
            "Solo se puede registrar una entrega cuando el alquiler "
            f"está en estado 'pendiente'. Estado actual: '{alquiler.estado_alquiler}'"
        )

    try:

        entrega = LogisticaAlquiler(
            id_alquiler=id_alquiler,
            id_usuario_logistico=datos.id_usuario_logistico,
            es_recogida=False,
            valor_gasto_logistico=datos.valor_gasto_logistico,
            descripcion_gasto_logistico=datos.descripcion_gasto_logistico,
            observaciones_logistica_alquiler=datos.observaciones_logistica_alquiler
        )

        db.add(entrega)

        # RN-ENT-05: confirmar la entrega cambia el alquiler a 'activo'
        alquiler.estado_alquiler = "activo"

        db.commit()

        db.refresh(entrega)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(
            extraer_mensaje_negocio(error)
        )

    return entrega


def obtener_entregas(
    db: Session,
    id_alquiler: int
):

    sql = text("""
        SELECT
            l.id_logistica_alquiler,
            l.id_alquiler,
            l.id_usuario_logistico,
            u.nombres_usuario AS nombres_logistico,
            l.fecha_gasto,
            l.descripcion_gasto_logistico,
            l.valor_gasto_logistico,
            l.observaciones_logistica_alquiler
        FROM logistica_alquiler l
        INNER JOIN usuario u ON l.id_usuario_logistico = u.id_usuario
        WHERE l.id_alquiler = :id_alquiler
          AND l.es_recogida = FALSE
        ORDER BY l.fecha_gasto
    """)

    resultado = db.execute(
        sql,
        {
            "id_alquiler": id_alquiler
        }
    )

    return [
        dict(row._mapping)
        for row in resultado
    ]


# =========================================================
# RECOGIDAS
# =========================================================

def registrar_recogida(
    db: Session,
    id_alquiler: int,
    datos
):

    alquiler = db.query(Alquiler).filter(
        Alquiler.id_alquiler == id_alquiler
    ).first()

    if not alquiler:
        return None

    # RN-LOG-04: no se permite recogida sin entrega previa
    entrega_previa = db.execute(
        text("""
            SELECT 1 FROM logistica_alquiler
            WHERE id_alquiler = :id_alquiler
              AND es_recogida = FALSE
            LIMIT 1
        """),
        {
            "id_alquiler": id_alquiler
        }
    ).first()

    if not entrega_previa:
        raise ValueError(
            "No se puede registrar una recogida sin una entrega previa "
            "para este alquiler (RN-LOG-04)"
        )

    if alquiler.estado_alquiler not in ("activo", "vencido"):
        raise ValueError(
            "Solo se puede registrar una recogida cuando el alquiler "
            f"está 'activo' o 'vencido'. Estado actual: '{alquiler.estado_alquiler}'"
        )

    try:

        recogida = LogisticaAlquiler(
            id_alquiler=id_alquiler,
            id_usuario_logistico=datos.id_usuario_logistico,
            es_recogida=True,
            valor_gasto_logistico=datos.valor_gasto_logistico,
            descripcion_gasto_logistico=datos.descripcion_gasto_logistico,
            observaciones_logistica_alquiler=datos.observaciones_logistica_alquiler
        )

        db.add(recogida)

        # RN-EST-04: productos recibidos físicamente -> 'recogido'
        # (esto también dispara fn_cerrar_alquiler_devolver_stock,
        # que devuelve el stock automáticamente)
        alquiler.estado_alquiler = "recogido"

        db.commit()

        db.refresh(recogida)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(
            extraer_mensaje_negocio(error)
        )

    return recogida


def obtener_recogidas(
    db: Session,
    id_alquiler: int
):

    sql = text("""
        SELECT
            l.id_logistica_alquiler,
            l.id_alquiler,
            l.id_usuario_logistico,
            u.nombres_usuario AS nombres_logistico,
            l.fecha_gasto,
            l.descripcion_gasto_logistico,
            l.valor_gasto_logistico,
            l.observaciones_logistica_alquiler
        FROM logistica_alquiler l
        INNER JOIN usuario u ON l.id_usuario_logistico = u.id_usuario
        WHERE l.id_alquiler = :id_alquiler
          AND l.es_recogida = TRUE
        ORDER BY l.fecha_gasto
    """)

    resultado = db.execute(
        sql,
        {
            "id_alquiler": id_alquiler
        }
    )

    return [
        dict(row._mapping)
        for row in resultado
    ]
