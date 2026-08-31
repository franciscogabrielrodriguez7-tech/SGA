from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.producto_schema import (
    ProductoCreate,
    ProductoUpdate
)

from app.controllers.producto_controller import (
    crear_producto,
    obtener_productos,
    obtener_producto,
    actualizar_producto
)

from app.utils.response import (
    response_success,
    response_error
)

# NUEVO respecto a la variante sin JWT: TODAS las rutas de este router
# requieren un token válido (Authorization: Bearer <token>).
from app.utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/productos",
    tags=["Productos"],
    dependencies=[Depends(get_current_user)]
)


@router.post("")
def registrar_producto(
    datos: ProductoCreate,
    db: Session = Depends(get_db)
):

    try:

        producto = crear_producto(db, datos)

        return response_success(
            mensaje="Producto creado correctamente",
            data={
                "id_producto": producto.id_producto,
                "nombre_producto": producto.nombre_producto,
                "stock_total": producto.stock_total
            },
            code=201
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al crear el producto",
            error=str(error),
            code=500
        )


@router.get("")
def listar_productos(
    solo_activos: bool = True,
    db: Session = Depends(get_db)
):

    try:

        productos = obtener_productos(db, solo_activos)

        return response_success(
            mensaje="Productos encontrados",
            data=productos,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar productos",
            error=str(error),
            code=500
        )


@router.get("/{id_producto}")
def consultar_producto(
    id_producto: int,
    db: Session = Depends(get_db)
):

    try:

        producto = obtener_producto(db, id_producto)

        if not producto:

            return response_error(
                mensaje="El producto no existe",
                error="PRODUCTO_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Producto encontrado",
            data=producto,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar el producto",
            error=str(error),
            code=500
        )


@router.patch("/{id_producto}")
def modificar_producto(
    id_producto: int,
    datos: ProductoUpdate,
    db: Session = Depends(get_db)
):

    try:

        producto = actualizar_producto(db, id_producto, datos)

        if not producto:

            return response_error(
                mensaje="El producto no existe",
                error="PRODUCTO_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Producto actualizado correctamente",
            data={
                "id_producto": producto.id_producto,
                "stock_total": producto.stock_total,
                "stock_alquilado": producto.stock_alquilado
            },
            code=200
        )

    except ValueError as error:

        db.rollback()

        return response_error(
            mensaje=str(error),
            error="PRODUCTO_VALIDATION_ERROR",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al actualizar el producto",
            error=str(error),
            code=500
        )
