from sqlalchemy import text
from sqlalchemy.orm import Session

from app.controllers.producto_controller import SELECT_PRODUCTO_CAMPOS


def obtener_inventario(db: Session):
    """
    Vista general de cantidades totales vs alquiladas, solo de
    productos activos.
    """

    sql = text(
        f"SELECT {SELECT_PRODUCTO_CAMPOS} FROM producto "
        "WHERE estado_registro = TRUE ORDER BY nombre_producto"
    )

    resultado = db.execute(sql)

    productos = [dict(row._mapping) for row in resultado]

    return {
        "productos": productos,
        "totales": {
            "stock_total": sum(p["stock_total"] for p in productos),
            "stock_alquilado": sum(p["stock_alquilado"] for p in productos),
            "stock_disponible": sum(p["stock_disponible"] for p in productos),
        }
    }


def obtener_disponibilidad_producto(db: Session, id_producto: int):
    """Disponibilidad detallada de un producto específico."""

    sql = text(f"SELECT {SELECT_PRODUCTO_CAMPOS} FROM producto WHERE id_producto = :id_producto")

    resultado = db.execute(sql, {"id_producto": id_producto}).first()

    if not resultado:
        return None

    return dict(resultado._mapping)
