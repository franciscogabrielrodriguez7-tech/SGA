from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.alquiler import Alquiler
from app.models.detalle_alquiler import DetalleAlquiler
from app.models.logistica_alquiler import LogisticaAlquiler
from app.utils.db_errors import extraer_mensaje_negocio
from app.utils.tiempo import (
    FECHA_VENCIMIENTO_SQL,
    fecha_actual_bogota,
    fecha_vencimiento as calcular_fecha_vencimiento,
    enriquecer_temporal,
)
from app.controllers.detalle_alquiler_controller import _recalcular_precio_alquiler


# =========================================================
# GRAFO DE TRANSICIONES VÁLIDAS
# -----------------------------------------------------------
# CORREGIDO respecto a la versión anterior: faltaba la transición
# "activo -> terminado" (roadmap sección 6: recepción directa, sin
# pasar por 'recogido', cuando no hay proceso de recogida mediante
# transporte). La base de datos (trg_prohibir_reabrir_alquiler) solo
# impide "reabrir" un alquiler ya cerrado — no valida la secuencia
# intermedia completa, así que ese grafo vive aquí.
# =========================================================

TRANSICIONES_VALIDAS = {
    "pendiente": {"activo", "cancelado"},
    "activo": {"vencido", "recogido", "terminado", "cancelado"},
    "vencido": {"recogido", "cancelado"},
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
        a.tiempo_alquiler,
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
# RECONCILIACIÓN TEMPORAL (roadmap sección 15)
# -----------------------------------------------------------
# NUEVO. Antes NO existía ningún mecanismo que pasara automáticamente
# 'activo' -> 'vencido'. Esta función es la ÚNICA fuente de esa
# transición automática, y la llaman DOS caminos distintos para que
# el sistema no dependa exclusivamente de uno:
#   1. El scheduler (app/utils/scheduler.py), una vez al día.
#   2. Las consultas de lectura más usadas (obtener_alquiler,
#      obtener_alquileres, buscar_alquileres), en cada request, para
#      que la información nunca esté desactualizada aunque el
#      scheduler todavía no haya corrido ese día.
# Usa la MISMA fórmula de fecha_vencimiento que el resto del archivo
# (FECHA_VENCIMIENTO_SQL), así que nunca puede desincronizarse.
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

def crear_alquiler(
    db: Session,
    datos,
    usuario_actual
):

    verificar_y_actualizar_vencidos(db)

    try:

        alquiler = Alquiler(
            # CORREGIDO: id_usuario_creador ya NO viene del payload
            # (roadmap sección 25) — es el usuario autenticado por JWT.
            id_usuario_creador=usuario_actual.id_usuario,
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
        db.flush()

        for linea in datos.detalles:

            detalle = DetalleAlquiler(
                id_alquiler=alquiler.id_alquiler,
                id_producto=linea.id_producto,
                cantidad_productos=linea.cantidad_productos,
                precio_conjunto=linea.precio_conjunto,
                es_producto_extra=linea.es_producto_extra,
                creado_por=usuario_actual.id_usuario
            )

            db.add(detalle)

        db.flush()

        # CORREGIDO: antes el precio_alquiler enviado en el payload se
        # guardaba tal cual, sin relación con la suma real del detalle.
        # Se recalcula aquí para que sea consistente con lo que exige
        # la sección 23 al modificar detalle después de creado.
        # LIMITACIÓN CONOCIDA (documentada, no resuelta por falta de
        # definición explícita en el roadmap): esta suma NO incluye
        # costos adicionales como transporte o depósito que el
        # frontend pueda haber sumado al precio final original — solo
        # se garantiza que "precio_alquiler" = suma de "precio_conjunto"
        # de las líneas activas del detalle.
        _recalcular_precio_alquiler(db, alquiler.id_alquiler)

        db.commit()

    except DBAPIError as error:

        db.rollback()

        raise ValueError(
            extraer_mensaje_negocio(error)
        )

    return obtener_alquiler(db, alquiler.id_alquiler)


# =========================================================
# OBTENER ALQUILER POR ID (con detalle + campos temporales)
# =========================================================

def obtener_alquiler(
    db: Session,
    id_alquiler: int
):

    verificar_y_actualizar_vencidos(db)

    sql = text(
        SELECT_ALQUILER_HEADER + " WHERE a.id_alquiler = :id_alquiler"
    )

    resultado = db.execute(sql, {"id_alquiler": id_alquiler}).first()

    if not resultado:
        return None

    alquiler = enriquecer_temporal(dict(resultado._mapping))
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
# MATRIZ DE EDICIÓN POR ESTADO (roadmap sección 21)
# -----------------------------------------------------------
# NUEVO: antes actualizar_alquiler() aplicaba cualquier campo recibido
# sin importar el estado del alquiler (se podía cambiar la dirección
# de un alquiler ya 'terminado', por ejemplo). Ahora se valida contra
# esta matriz antes de aplicar cualquier cambio.
# =========================================================

CAMPOS_EDITABLES_POR_ESTADO = {
    "pendiente": {"direccion", "barrio", "precio_alquiler", "fecha_inicio", "tiempo_alquiler", "se_lleva", "se_recoge"},
    "activo": {"precio_alquiler", "tiempo_alquiler", "se_lleva", "se_recoge"},
    "vencido": {"precio_alquiler", "tiempo_alquiler"},
    "recogido": set(),
    "terminado": set(),
    "cancelado": set(),
}


def actualizar_alquiler(
    db: Session,
    id_alquiler: int,
    datos,
    usuario_actual
):

    verificar_y_actualizar_vencidos(db)

    alquiler = db.query(Alquiler).filter(
        Alquiler.id_alquiler == id_alquiler
    ).first()

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
            f"{', '.join(sorted(no_permitidos))} (ver matriz de edición)."
        )

    # -----------------------------------------------------
    # tiempo_alquiler: un aumento se trata como RENOVACIÓN (mismas
    # reglas); una reducción es corrección administrativa, validada
    # para que no produzca un vencimiento en el pasado (sección 19).
    # -----------------------------------------------------
    if "tiempo_alquiler" in campos:

        tiempo_nuevo = campos.pop("tiempo_alquiler")

        if tiempo_nuevo > alquiler.tiempo_alquiler:

            semanas_extra = tiempo_nuevo - alquiler.tiempo_alquiler
            _aplicar_renovacion(alquiler, semanas_extra)

        elif tiempo_nuevo < alquiler.tiempo_alquiler:

            nueva_fecha = calcular_fecha_vencimiento(alquiler.fecha_inicio, tiempo_nuevo)

            if nueva_fecha < fecha_actual_bogota():
                raise ValueError(
                    "No se puede reducir el tiempo de alquiler porque la nueva "
                    f"fecha de vencimiento ({nueva_fecha.isoformat()}) quedaría "
                    "en el pasado."
                )

            alquiler.tiempo_alquiler = tiempo_nuevo

    # -----------------------------------------------------
    # fecha_inicio: recalcular vencimiento es automático (se deriva
    # en el SELECT), no hay columna fecha_vencimiento que actualizar.
    # -----------------------------------------------------
    for campo, valor in campos.items():
        setattr(alquiler, campo, valor)

    alquiler.actualizado_por = usuario_actual.id_usuario

    try:
        db.commit()
    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_alquiler(db, id_alquiler)


# =========================================================
# CAMBIAR ESTADO — CORRECCIÓN ADMINISTRATIVA
# -----------------------------------------------------------
# IMPORTANTE (roadmap sección 3): este endpoint queda reservado para
# el ADMINISTRADOR como herramienta de corrección de errores, NO como
# la vía normal para entregar/recoger/cancelar/renovar (esas son
# operaciones separadas: ver registrar_entrega, registrar_recogida,
# cancelar_alquiler, renovar_alquiler). La restricción de rol vive en
# la ruta (solo "admin"); aquí solo se valida el grafo de estados,
# que sigue siendo el mismo para todos.
# =========================================================

def cambiar_estado_alquiler(
    db: Session,
    id_alquiler: int,
    nuevo_estado: str,
    usuario_actual
):

    verificar_y_actualizar_vencidos(db)

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
            f"Transición no permitida: '{estado_actual}' -> '{nuevo_estado}'"
        )

    alquiler.estado_alquiler = nuevo_estado
    alquiler.actualizado_por = usuario_actual.id_usuario

    try:
        db.commit()
    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_alquiler(db, id_alquiler)


# =========================================================
# CANCELAR (roadmap sección 27: solo admin/facturación, vía ruta)
# =========================================================

def cancelar_alquiler(
    db: Session,
    id_alquiler: int,
    usuario_actual
):
    return cambiar_estado_alquiler(db, id_alquiler, "cancelado", usuario_actual)


# =========================================================
# BUSCAR (por cliente, barrio o número de detalle)
# =========================================================

def buscar_alquileres(
    db: Session,
    cliente: str = None,
    barrio: str = None,
    id_detalle: int = None
):

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

    return [enriquecer_temporal(dict(row._mapping)) for row in resultado]


# =========================================================
# PRÓXIMOS A VENCER (RN-VEN-01: alerta 2 días antes por defecto)
# =========================================================

def alquileres_proximos_a_vencer(
    db: Session,
    dias: int = 2
):

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
# PENDIENTES DE ENTREGA / TRANSPORTE
# -----------------------------------------------------------
# CORREGIDO (roadmap sección 9-10): antes devolvía TODOS los
# 'pendiente' sin distinguir si requieren transporte. Ahora acepta un
# filtro opcional `solo_transporte` para que logística vea únicamente
# los que tiene sentido que gestione (se_lleva=True), sin limitarse a
# los ya asignados previamente.
# =========================================================

def alquileres_pendientes_entrega(
    db: Session,
    solo_transporte: bool = False
):

    verificar_y_actualizar_vencidos(db)

    if not solo_transporte:
        return obtener_alquileres(db, estado_alquiler="pendiente")

    sql = SELECT_ALQUILER_HEADER + " WHERE a.estado_alquiler = 'pendiente' AND a.se_lleva = TRUE"
    sql += " ORDER BY a.fecha_creacion DESC"

    resultado = db.execute(text(sql))

    return [enriquecer_temporal(dict(row._mapping)) for row in resultado]


# =========================================================
# HISTORIAL / TRAZABILIDAD (sin cambios de alcance)
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
            "los cambios de estado. Este endpoint solo puede mostrar el "
            "estado y la fecha de la última actualización."
        )
    }


# =========================================================
# RENOVACIÓN
# -----------------------------------------------------------
# CORREGIDO (roadmap sección 18): antes, si el alquiler estaba
# 'vencido', se pasaba a 'activo' de forma INCONDICIONAL tras
# renovar. Ahora solo pasa a 'activo' si la NUEVA fecha de
# vencimiento realmente queda en el futuro; si sigue en el pasado
# (ej. se renovó por muy pocas semanas), se queda 'vencido'.
# =========================================================

def _aplicar_renovacion(alquiler: Alquiler, semanas: int):

    alquiler.tiempo_alquiler = alquiler.tiempo_alquiler + semanas

    if alquiler.estado_alquiler == "vencido":

        nueva_fecha = calcular_fecha_vencimiento(
            alquiler.fecha_inicio, alquiler.tiempo_alquiler
        )

        if nueva_fecha >= fecha_actual_bogota():
            alquiler.estado_alquiler = "activo"
        # si sigue en el pasado, se queda "vencido" a propósito


def renovar_alquiler(
    db: Session,
    id_alquiler: int,
    semanas: int,
    usuario_actual
):

    verificar_y_actualizar_vencidos(db)

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

    _aplicar_renovacion(alquiler, semanas)
    alquiler.actualizado_por = usuario_actual.id_usuario

    try:
        db.commit()
    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_alquiler(db, id_alquiler)


# =========================================================
# ENTREGA — directa o mediante transporte
# -----------------------------------------------------------
# CORREGIDO (roadmap secciones 4, 5, 7, 10): antes había un único
# camino sin distinguir quién la hace ni si requiere transporte. Ahora
# se decide según alquiler.se_lleva:
#   - se_lleva=True  -> ENTREGA MEDIANTE TRANSPORTE -> admin/logístico
#   - se_lleva=False -> ENTREGA DIRECTA              -> admin/facturación
# El id del responsable ya NO viene del payload — es usuario_actual
# (JWT). En ambos casos se registra en logistica_alquiler (para
# conservar el gasto asociado si lo hay) y el alquiler pasa a 'activo'.
# =========================================================

ROLES_ENTREGA_TRANSPORTE = {"admin", "encargado_logistico"}
ROLES_ENTREGA_DIRECTA = {"admin", "encargado_facturacion"}


def registrar_entrega(
    db: Session,
    id_alquiler: int,
    datos,
    usuario_actual
):

    verificar_y_actualizar_vencidos(db)

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

    roles_permitidos = (
        ROLES_ENTREGA_TRANSPORTE if alquiler.se_lleva else ROLES_ENTREGA_DIRECTA
    )

    if usuario_actual.rol_usuario not in roles_permitidos:
        tipo = "mediante transporte" if alquiler.se_lleva else "directa"
        raise HTTPException(
            status_code=403,
            detail=(
                f"Este alquiler requiere una entrega {tipo} "
                f"(se_lleva={alquiler.se_lleva}). Roles permitidos: "
                f"{', '.join(roles_permitidos)}."
            ),
        )

    try:

        entrega = LogisticaAlquiler(
            id_alquiler=id_alquiler,
            id_usuario_logistico=usuario_actual.id_usuario,
            es_recogida=False,
            valor_gasto_logistico=datos.valor_gasto_logistico,
            descripcion_gasto_logistico=datos.descripcion_gasto_logistico,
            observaciones_logistica_alquiler=datos.observaciones_logistica_alquiler
        )

        db.add(entrega)

        alquiler.estado_alquiler = "activo"
        alquiler.actualizado_por = usuario_actual.id_usuario

        db.commit()
        db.refresh(entrega)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return entrega


def obtener_entregas(db: Session, id_alquiler: int):

    sql = text("""
        SELECT
            l.id_logistica_alquiler, l.id_alquiler, l.id_usuario_logistico,
            u.nombres_usuario AS nombres_logistico, l.fecha_gasto,
            l.descripcion_gasto_logistico, l.valor_gasto_logistico,
            l.observaciones_logistica_alquiler
        FROM logistica_alquiler l
        INNER JOIN usuario u ON l.id_usuario_logistico = u.id_usuario
        WHERE l.id_alquiler = :id_alquiler AND l.es_recogida = FALSE
        ORDER BY l.fecha_gasto
    """)

    resultado = db.execute(sql, {"id_alquiler": id_alquiler})

    return [dict(row._mapping) for row in resultado]


# =========================================================
# RECOGIDA — SIEMPRE mediante transporte (logístico/admin)
# -----------------------------------------------------------
# CORREGIDO: ahora exige alquiler.se_recoge=True (si es False, debe
# usarse /recepcion-directa en su lugar) y valida el rol.
# =========================================================

def registrar_recogida(
    db: Session,
    id_alquiler: int,
    datos,
    usuario_actual
):

    verificar_y_actualizar_vencidos(db)

    alquiler = db.query(Alquiler).filter(
        Alquiler.id_alquiler == id_alquiler
    ).first()

    if not alquiler:
        return None

    if usuario_actual.rol_usuario not in ROLES_ENTREGA_TRANSPORTE:
        raise HTTPException(
            status_code=403,
            detail=(
                "Solo el encargado logístico o el administrador pueden "
                "registrar una recogida mediante transporte."
            ),
        )

    if not alquiler.se_recoge:
        raise ValueError(
            "Este alquiler no requiere recogida mediante transporte "
            "(se_recoge=False). Usa el endpoint de recepción directa."
        )

    entrega_previa = db.execute(
        text("""
            SELECT 1 FROM logistica_alquiler
            WHERE id_alquiler = :id_alquiler AND es_recogida = FALSE
            LIMIT 1
        """),
        {"id_alquiler": id_alquiler}
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
            id_usuario_logistico=usuario_actual.id_usuario,
            es_recogida=True,
            valor_gasto_logistico=datos.valor_gasto_logistico,
            descripcion_gasto_logistico=datos.descripcion_gasto_logistico,
            observaciones_logistica_alquiler=datos.observaciones_logistica_alquiler
        )

        db.add(recogida)

        alquiler.estado_alquiler = "recogido"
        alquiler.actualizado_por = usuario_actual.id_usuario

        db.commit()
        db.refresh(recogida)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return recogida


def obtener_recogidas(db: Session, id_alquiler: int):

    sql = text("""
        SELECT
            l.id_logistica_alquiler, l.id_alquiler, l.id_usuario_logistico,
            u.nombres_usuario AS nombres_logistico, l.fecha_gasto,
            l.descripcion_gasto_logistico, l.valor_gasto_logistico,
            l.observaciones_logistica_alquiler
        FROM logistica_alquiler l
        INNER JOIN usuario u ON l.id_usuario_logistico = u.id_usuario
        WHERE l.id_alquiler = :id_alquiler AND l.es_recogida = TRUE
        ORDER BY l.fecha_gasto
    """)

    resultado = db.execute(sql, {"id_alquiler": id_alquiler})

    return [dict(row._mapping) for row in resultado]


# =========================================================
# RECEPCIÓN DIRECTA — NUEVO (roadmap sección 6)
# -----------------------------------------------------------
# 'activo' -> 'terminado' directamente, sin pasar por 'recogido',
# porque no hubo transporte (se_recoge=False). Rol: admin/facturación
# (los mismos que hacen entrega directa) — la logística NO debe poder
# hacer una recepción directa (sección 6, última línea).
# =========================================================

def recepcion_directa(
    db: Session,
    id_alquiler: int,
    usuario_actual
):

    verificar_y_actualizar_vencidos(db)

    alquiler = db.query(Alquiler).filter(
        Alquiler.id_alquiler == id_alquiler
    ).first()

    if not alquiler:
        return None

    if usuario_actual.rol_usuario not in ROLES_ENTREGA_DIRECTA:
        raise HTTPException(
            status_code=403,
            detail="Solo administración/facturación pueden hacer una recepción directa.",
        )

    if alquiler.se_recoge:
        raise ValueError(
            "Este alquiler requiere recogida mediante transporte "
            "(se_recoge=True). Usa el endpoint de recogida en su lugar."
        )

    if alquiler.estado_alquiler != "activo":
        raise ValueError(
            "Solo se puede hacer una recepción directa desde el estado "
            f"'activo'. Estado actual: '{alquiler.estado_alquiler}'"
        )

    alquiler.estado_alquiler = "terminado"
    alquiler.actualizado_por = usuario_actual.id_usuario

    try:
        db.commit()
    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_alquiler(db, id_alquiler)
