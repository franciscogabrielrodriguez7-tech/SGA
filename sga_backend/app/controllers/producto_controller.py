from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.producto import Producto


# =========================================================
# CREAR PRODUCTO
# =========================================================

def crear_producto(
    db: Session,
    datos
):

    producto = Producto(
        nombre_producto=datos.nombre_producto,
        descripcion_producto=datos.descripcion_producto,
        precio_base_producto=datos.precio_base_producto,
        stock_total=datos.stock_total
    )

    db.add(producto)

    db.commit()

    db.refresh(producto)

    return producto


# =========================================================
# LISTAR PRODUCTOS (solo activos por defecto)
# =========================================================

def obtener_productos(
    db: Session,
    solo_activos: bool = True
):

    sql = """
        SELECT

            id_producto,
            nombre_producto,
            descripcion_producto,
            precio_base_producto,
            stock_total,
            stock_alquilado,
            (stock_total - stock_alquilado) AS stock_disponible,
            estado_registro

        FROM producto
    """

    if solo_activos:
        sql += " WHERE estado_registro = TRUE"

    sql += " ORDER BY nombre_producto"

    resultado = db.execute(text(sql))

    return [
        dict(row._mapping)
        for row in resultado
    ]


# =========================================================
# OBTENER PRODUCTO POR ID
# =========================================================

def obtener_producto(
    db: Session,
    id_producto: int
):

    sql = text("""
        SELECT

            id_producto,
            nombre_producto,
            descripcion_producto,
            precio_base_producto,
            stock_total,
            stock_alquilado,
            (stock_total - stock_alquilado) AS stock_disponible,
            estado_registro

        FROM producto

        WHERE id_producto = :id_producto
    """)

    resultado = db.execute(
        sql,
        {
            "id_producto": id_producto
        }
    ).first()

    if not resultado:
        return None

    return dict(resultado._mapping)


# =========================================================
# ACTUALIZAR PRODUCTO
# =========================================================

def actualizar_producto(
    db: Session,
    id_producto: int,
    datos
):

    producto = db.query(Producto).filter(
        Producto.id_producto == id_producto
    ).first()

    if not producto:
        return None

    campos = datos.model_dump(exclude_unset=True)

    for campo, valor in campos.items():
        setattr(producto, campo, valor)

    # trg_validar_modificacion_stock (BD) rechaza si stock_total
    # queda por debajo de stock_alquilado; se deja que la BD lo
    # valide, no se duplica la regla aquí.

    db.commit()

    db.refresh(producto)

    return producto
