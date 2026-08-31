from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.detalle_alquiler import DetalleAlquiler
from app.utils.db_errors import extraer_mensaje_negocio


# =========================================================
# CREAR DETALLE (agregar producto a un alquiler existente)
# =========================================================

def crear_detalle_alquiler(
    db: Session,
    datos
):

    try:

        detalle = DetalleAlquiler(
            id_alquiler=datos.id_alquiler,
            id_producto=datos.id_producto,
            cantidad_productos=datos.cantidad_productos,
            precio_conjunto=datos.precio_conjunto,
            es_producto_extra=datos.es_producto_extra
        )

        db.add(detalle)

        db.commit()

        db.refresh(detalle)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(
            extraer_mensaje_negocio(error)
        )

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
            d.id_detalle_alquiler,
            d.id_alquiler,
            d.id_producto,
            p.nombre_producto,
            d.cantidad_productos,
            d.precio_conjunto,
            d.es_producto_extra,
            d.estado_registro,
            d.fecha_creacion,
            d.fecha_actualizacion
        FROM detalle_alquiler d
        INNER JOIN producto p ON d.id_producto = p.id_producto
        WHERE d.id_detalle_alquiler = :id_detalle_alquiler
    """)

    resultado = db.execute(
        sql,
        {
            "id_detalle_alquiler": id_detalle_alquiler
        }
    ).first()

    if not resultado:
        return None

    return dict(resultado._mapping)


# =========================================================
# ACTUALIZAR DETALLE (solo cantidad y precio, RN-DET-04)
# =========================================================

def actualizar_detalle_alquiler(
    db: Session,
    id_detalle_alquiler: int,
    datos
):

    detalle = db.query(DetalleAlquiler).filter(
        DetalleAlquiler.id_detalle_alquiler == id_detalle_alquiler
    ).first()

    if not detalle:
        return None

    campos = datos.model_dump(exclude_unset=True)

    for campo, valor in campos.items():
        setattr(detalle, campo, valor)

    try:
        db.commit()
    except DBAPIError as error:
        db.rollback()
        raise ValueError(
            extraer_mensaje_negocio(error)
        )

    return obtener_detalle_alquiler(db, id_detalle_alquiler)
