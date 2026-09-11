from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.alquiler import Alquiler
from app.models.detalle_alquiler import DetalleAlquiler
from app.utils.audit_context import set_audit_context
from app.utils.db_errors import extraer_mensaje_negocio


# =========================================================
# ESTADOS EN LOS QUE SE PUEDE MODIFICAR EL DETALLE
# =========================================================

ESTADOS_DETALLE_EDITABLE = ("pendiente", "activo")


def _obtener_alquiler_o_error(db: Session, id_alquiler: int) -> Alquiler:

    alquiler = db.query(Alquiler).filter(Alquiler.id_alquiler == id_alquiler).first()

    if not alquiler:
        raise ValueError(f"El alquiler {id_alquiler} no existe")

    if alquiler.estado_alquiler not in ESTADOS_DETALLE_EDITABLE:
        raise ValueError(
            "Los productos de un alquiler solo pueden modificarse en "
            f"estado 'pendiente' o 'activo'. Estado actual: "
            f"'{alquiler.estado_alquiler}'"
        )

    return alquiler


# =========================================================
# RECÁLCULO DE PRECIO
# -----------------------------------------------------------
# Cada vez que cambia el detalle de un alquiler, se recalcula el
# "precio final" como la suma de los "precio de conjunto" de las
# líneas activas.
# =========================================================

def _recalcular_precio_alquiler(db: Session, id_alquiler: int):
    """
    [DEPRECADO como llamada automática — ver decisión de negocio]
    Antes se invocaba automáticamente cada vez que cambiaba el detalle
    de un alquiler, sobrescribiendo precio_alquiler con
    SUM(precio_conjunto). Se decidió que precio_alquiler es un campo
    controlado explícitamente por el staff (como deposito): puede
    incluir descuentos implícitos (ej. transporte incluido en un
    alquiler grande) que un recálculo automático borraría en silencio.

    Se deja la función disponible por si en el futuro se quiere ofrecer
    un botón explícito de "recalcular según productos", pero YA NO se
    llama automáticamente desde crear_alquiler ni desde
    crear_detalle_alquiler/actualizar_detalle_alquiler.
    """

    suma = db.execute(
        text("""
            SELECT COALESCE(SUM(precio_conjunto), 0) AS total
            FROM detalle_alquiler
            WHERE id_alquiler = :id_alquiler AND estado_registro = TRUE
        """),
        {"id_alquiler": id_alquiler}
    ).scalar()

    db.execute(
        text("UPDATE alquiler SET precio_alquiler = :precio WHERE id_alquiler = :id_alquiler"),
        {"precio": suma, "id_alquiler": id_alquiler}
    )


# =========================================================
# LISTAR DETALLES DE UN ALQUILER
# -----------------------------------------------------------
# No existía forma de obtener todas las líneas de un alquiler (solo
# consultar_detalle por su propio id_detalle_alquiler). Necesario para
# mostrar los productos en el detalle del alquiler y para calcular el
# costo de una renovación (RN: productos * tiempo, respetando la
# unidad mínima de cada producto).
# =========================================================

def listar_detalles_por_alquiler(db: Session, id_alquiler: int):

    sql = text("""
        SELECT
            d.id_detalle_alquiler, d.id_alquiler, d.id_producto,
            p.nombre_producto, p.precio_base_producto, p.unidad_minima_alquiler,
            d.cantidad_productos, d.precio_conjunto,
            d.es_producto_extra, d.estado_registro, d.fecha_creacion,
            d.fecha_actualizacion
        FROM detalle_alquiler d
        INNER JOIN producto p ON d.id_producto = p.id_producto
        WHERE d.id_alquiler = :id_alquiler AND d.estado_registro = TRUE
        ORDER BY d.id_detalle_alquiler
    """)

    resultado = db.execute(sql, {"id_alquiler": id_alquiler})

    return [dict(row._mapping) for row in resultado]


# =========================================================
# CREAR DETALLE (agregar producto a un alquiler existente)
# =========================================================

def crear_detalle_alquiler(db: Session, datos, usuario_actual):

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        _obtener_alquiler_o_error(db, datos.id_alquiler)

        detalle = DetalleAlquiler(
            id_alquiler=datos.id_alquiler,
            id_producto=datos.id_producto,
            cantidad_productos=datos.cantidad_productos,
            precio_conjunto=datos.precio_conjunto,
            es_producto_extra=datos.es_producto_extra
        )

        db.add(detalle)
        db.flush()

        # precio_alquiler ya NO se recalcula automáticamente aquí (ver
        # _recalcular_precio_alquiler): si agregas un producto a un
        # alquiler existente, actualiza el precio manualmente vía
        # PATCH /alquileres/{id} si corresponde.

        db.commit()
        db.refresh(detalle)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_detalle_alquiler(db, detalle.id_detalle_alquiler)


# =========================================================
# OBTENER DETALLE POR ID
# =========================================================

def obtener_detalle_alquiler(db: Session, id_detalle_alquiler: int):

    sql = text("""
        SELECT
            d.id_detalle_alquiler, d.id_alquiler, d.id_producto,
            p.nombre_producto, d.cantidad_productos, d.precio_conjunto,
            d.es_producto_extra, d.estado_registro, d.fecha_creacion,
            d.fecha_actualizacion
        FROM detalle_alquiler d
        INNER JOIN producto p ON d.id_producto = p.id_producto
        WHERE d.id_detalle_alquiler = :id_detalle_alquiler
    """)

    resultado = db.execute(sql, {"id_detalle_alquiler": id_detalle_alquiler}).first()

    if not resultado:
        return None

    return dict(resultado._mapping)


# =========================================================
# ACTUALIZAR DETALLE (solo cantidad y precio)
# =========================================================

def actualizar_detalle_alquiler(db: Session, id_detalle_alquiler: int, datos, usuario_actual):

    detalle = db.query(DetalleAlquiler).filter(
        DetalleAlquiler.id_detalle_alquiler == id_detalle_alquiler
    ).first()

    if not detalle:
        return None

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        _obtener_alquiler_o_error(db, detalle.id_alquiler)

        campos = datos.model_dump(exclude_unset=True)

        for campo, valor in campos.items():
            setattr(detalle, campo, valor)

        db.flush()

        # Igual que en crear_detalle_alquiler: ya no se recalcula
        # precio_alquiler automáticamente.

        db.commit()

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_detalle_alquiler(db, id_detalle_alquiler)
