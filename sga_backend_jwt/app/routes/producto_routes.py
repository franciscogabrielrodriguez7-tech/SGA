from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.producto_schema import (
    ProductoCreate,
    ProductoUpdate,
    ProductoEstadoUpdate,
)

from app.controllers.producto_controller import (
    crear_producto,
    obtener_producto,
    obtener_productos,
    actualizar_producto,
    cambiar_estado_producto,
)

from app.utils.response import response_success, response_error
from app.utils.auth_dependency import get_current_user, UsuarioActual
from app.utils.roles import requiere_rol, SOLO_ADMIN, STAFF_INTERNO


router = APIRouter(
    prefix="/productos",
    tags=["Productos"],
    dependencies=[Depends(get_current_user)]
)


@router.post("", dependencies=[Depends(requiere_rol(*SOLO_ADMIN))])
def registrar_producto(
    datos: ProductoCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        producto = crear_producto(db, datos, usuario_actual)

        return response_success(
            mensaje="Producto creado correctamente",
            data={
                "id_producto": producto.id_producto,
                "nombre_producto": producto.nombre_producto,
                "stock_total": producto.stock_total
            },
            code=201
        )

    except ValueError as error:
        db.rollback()
        return response_error(mensaje=str(error), error="PRODUCTO_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al crear el producto", error=str(error), code=500)


@router.get("", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def listar_productos(solo_activos: bool = True, db: Session = Depends(get_db)):

    try:
        productos = obtener_productos(db, solo_activos)
        return response_success(mensaje="Productos encontrados", data=productos, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar productos", error=str(error), code=500)


@router.get("/{id_producto}", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def consultar_producto(id_producto: int, db: Session = Depends(get_db)):

    try:
        producto = obtener_producto(db, id_producto)

        if not producto:
            return response_error(mensaje="El producto no existe", error="PRODUCTO_NOT_FOUND", code=404)

        return response_success(mensaje="Producto encontrado", data=producto, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar producto", error=str(error), code=500)


@router.patch("/{id_producto}", dependencies=[Depends(requiere_rol(*SOLO_ADMIN))])
@router.put("/{id_producto}", dependencies=[Depends(requiere_rol(*SOLO_ADMIN))])
def modificar_producto(
    id_producto: int,
    datos: ProductoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        producto = actualizar_producto(db, id_producto, datos, usuario_actual)

        if not producto:
            return response_error(mensaje="El producto no existe", error="PRODUCTO_NOT_FOUND", code=404)

        return response_success(mensaje="Producto actualizado correctamente", data=producto, code=200)

    except ValueError as error:
        db.rollback()
        return response_error(mensaje=str(error), error="PRODUCTO_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al actualizar el producto", error=str(error), code=500)


@router.patch("/{id_producto}/estado", dependencies=[Depends(requiere_rol(*SOLO_ADMIN))])
def cambiar_estado(
    id_producto: int,
    datos: ProductoEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):
    """
    Borrado lógico. trg_validar_modificacion_producto (BD) rechaza la
    baja si el producto todavía tiene stock_alquilado > 0 (en obra).
    """

    try:
        producto = cambiar_estado_producto(db, id_producto, datos.estado_registro, usuario_actual)

        if not producto:
            return response_error(mensaje="El producto no existe", error="PRODUCTO_NOT_FOUND", code=404)

        return response_success(mensaje="Estado del producto actualizado", data=producto, code=200)

    except ValueError as error:
        db.rollback()
        return response_error(mensaje=str(error), error="PRODUCTO_ESTADO_INVALIDO", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al cambiar el estado del producto", error=str(error), code=500)
