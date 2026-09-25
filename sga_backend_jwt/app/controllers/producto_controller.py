from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.producto import Producto
from app.utils.audit_context import set_audit_context
from app.utils.db_errors import extraer_mensaje_negocio



def crear_producto(db: Session, datos, usuario_actual):

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        # Si no se especifica precio_base_extra, se iguala al precio
        # base para que el comportamiento por defecto sea coherente.
        precio_extra = datos.precio_base_extra if datos.precio_base_extra is not None else datos.precio_base_producto

        producto = Producto(
            nombre_producto=datos.nombre_producto,
            descripcion_producto=datos.descripcion_producto,
            precio_base_producto=datos.precio_base_producto,
            precio_base_extra=precio_extra,
            stock_total=datos.stock_total,
            unidad_minima_alquiler=datos.unidad_minima_alquiler
        )

        db.add(producto)
        db.commit()
        db.refresh(producto)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return producto


def obtener_productos(db: Session, solo_activos: bool = True):

    query = db.query(Producto)

    if solo_activos:
        query = query.filter(Producto.estado_registro == True)  # noqa: E712

    return query.order_by(Producto.nombre_producto).all()


def obtener_producto(db: Session, id_producto: int):

    return db.query(Producto).filter(Producto.id_producto == id_producto).first()


def actualizar_producto(db: Session, id_producto: int, datos, usuario_actual):

    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()

    if not producto:
        return None

    campos = datos.model_dump(exclude_unset=True)

    if not campos:
        return obtener_producto(db, id_producto)

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        for campo, valor in campos.items():
            setattr(producto, campo, valor)

        # trg_validar_modificacion_producto (BD) rechaza si stock_total
        # queda por debajo de stock_alquilado; se deja que la BD lo
        # valide, no se duplica la regla aquí.
        db.commit()
        db.refresh(producto)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_producto(db, id_producto)


def cambiar_estado_producto(db: Session, id_producto: int, estado_registro: bool, usuario_actual):
    """
    Borrado lógico. trg_validar_modificacion_producto (BD) rechaza la
    baja si el producto todavía tiene stock_alquilado > 0 (en obra) —
    el controller no duplica esa regla, deja que la BD la aplique y
    traduce el mensaje de error.
    """

    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()

    if not producto:
        return None

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        producto.estado_registro = estado_registro
        db.commit()
        db.refresh(producto)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return obtener_producto(db, id_producto)
