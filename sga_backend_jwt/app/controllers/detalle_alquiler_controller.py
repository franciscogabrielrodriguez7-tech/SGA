from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.alquiler import Alquiler
from app.models.detalle_alquiler import DetalleAlquiler
from app.utils.db_errors import extraer_mensaje_negocio


# =========================================================
# ESTADOS EN LOS QUE SE PUEDE MODIFICAR EL DETALLE (roadmap sección 22)
# =========================================================

ESTADOS_DETALLE_EDITABLE = ("pendiente", "activo")


def _obtener_alquiler_o_error(db: Session, id_alquiler: int) -> Alquiler:

    alquiler = db.query(Alquiler).filter(
        Alquiler.id_alquiler == id_alquiler
    ).first()

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
# RECÁLCULO DE PRECIO (NUEVO — roadmap sección 22-23)
# -----------------------------------------------------------
# Antes, agregar/quitar/editar una línea de producto NUNCA tocaba
# alquiler.precio_alquiler — quedaba desincronizado del detalle real.
# Ahora, cada vez que cambia el detalle de un alquiler, se recalcula
# el "precio final" como la suma de los "precio de conjunto" de las
# líneas activas. Esto se aplica INCLUSO si el precio había sido
# ajustado manualmente antes (sección 23: no se preserva
# indefinidamente un precio manual si algo relevante cambia después).
# =========================================================

def _recalcular_precio_alquiler(db: Session, id_alquiler: int):

    suma = db.execute(
        text("""
            SELECT COALESCE(SUM(precio_conjunto), 0) AS total
            FROM detalle_alquiler
            WHERE id_alquiler = :id_alquiler
              AND estado_registro = TRUE
        """),
        {"id_alquiler": id_alquiler}
    ).scalar()

    db.execute(
        text("UPDATE alquiler SET precio_alquiler = :precio WHERE id_alquiler = :id_alquiler"),
        {"precio": suma, "id_alquiler": id_alquiler}
    )


# =========================================================
# CREAR DETALLE (agregar producto a un alquiler existente)
# =========================================================

def crear_detalle_alquiler(
    db: Session,
    datos,
    usuario_actual
):

    try:

        _obtener_alquiler_o_error(db, datos.id_alquiler)

        detalle = DetalleAlquiler(
            id_alquiler=datos.id_alquiler,
            id_producto=datos.id_producto,
            cantidad_productos=datos.cantidad_productos,
            precio_conjunto=datos.precio_conjunto,
            es_producto_extra=datos.es_producto_extra,
            creado_por=usuario_actual.id_usuario
        )

        db.add(detalle)
        db.flush()

        _recalcular_precio_alquiler(db, datos.id_alquiler)

        db.commit()
        db.refresh(detalle)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return detalle


# =========================================================
# OBTENER DETALLE POR ID
# =========================================================

def obtener_detalle_alquiler(
    db: Session,
    id_detalle_alquiler: int
):

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
# ACTUALIZAR DETALLE (solo cantidad y precio, RN-DET-04)
# =========================================================

def actualizar_detalle_alquiler(
    db: Session,
    id_detalle_alquiler: int,
    datos,
    usuario_actual
):

    detalle = db.query(DetalleAlquiler).filter(
        DetalleAlquiler.id_detalle_alquiler == id_detalle_alquiler
    ).first()

    if not detalle:
        return None

    try:

        _obtener_alquiler_o_error(db, detalle.id_alquiler)

        campos = datos.model_dump(exclude_unset=True)

        for campo, valor in campos.items():
            setattr(detalle, campo, valor)

        detalle.actualizado_por = usuario_actual.id_usuario

        db.flush()

        _recalcular_precio_alquiler(db, detalle.id_alquiler)

        db.commit()

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_detalle_alquiler(db, id_detalle_alquiler)


# =========================================================
# ELIMINAR DETALLE — NUEVO (roadmap sección 22)
# -----------------------------------------------------------
# Antes no existía ningún endpoint para quitar un producto de un
# alquiler ya creado. La eliminación es lógica (estado_registro=FALSE),
# igual que hacen los triggers de la BD para el cierre automático de
# alquiler, y dispara el mismo recálculo de precio.
# =========================================================

def eliminar_detalle_alquiler(
    db: Session,
    id_detalle_alquiler: int,
    usuario_actual
):

    detalle = db.query(DetalleAlquiler).filter(
        DetalleAlquiler.id_detalle_alquiler == id_detalle_alquiler
    ).first()

    if not detalle:
        return None

    try:

        _obtener_alquiler_o_error(db, detalle.id_alquiler)

        # IMPORTANTE: NO se usa DELETE físico. El trigger de la BD
        # (trg_prevenir_borrado_detalle) bloquea el borrado físico de
        # una línea salvo que el alquiler ya esté 'terminado'/'recogido'
        # Y la línea ya esté con estado_registro=FALSE — es decir, un
        # DELETE físico aquí fallaría siempre en 'pendiente'/'activo',
        # que es justo cuando este endpoint debe funcionar. Por eso se
        # hace baja lógica, igual que el resto del sistema.
        id_alquiler = detalle.id_alquiler

        detalle.estado_registro = False
        detalle.actualizado_por = usuario_actual.id_usuario

        db.flush()

        _recalcular_precio_alquiler(db, id_alquiler)

        db.commit()

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return {"id_detalle_alquiler": id_detalle_alquiler, "eliminado": True}
