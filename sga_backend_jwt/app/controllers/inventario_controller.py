from sqlalchemy.orm import Session

from app.models.producto import Producto


def obtener_inventario(db: Session):
    """
    Vista general de cantidades totales vs alquiladas, solo de
    productos activos.
    """

    productos = (
        db.query(Producto)
        .filter(Producto.estado_registro == True)  # noqa: E712
        .order_by(Producto.nombre_producto)
        .all()
    )

    return {
        "productos": productos,
        "totales": {
            "stock_total": sum(p.stock_total for p in productos),
            "stock_alquilado": sum(p.stock_alquilado for p in productos),
            "stock_disponible": sum(p.stock_disponible for p in productos),
        }
    }


def obtener_disponibilidad_producto(db: Session, id_producto: int):
    """Disponibilidad detallada de un producto específico."""

    return db.query(Producto).filter(Producto.id_producto == id_producto).first()
