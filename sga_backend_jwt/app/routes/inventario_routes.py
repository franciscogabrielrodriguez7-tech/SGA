from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db

from app.controllers.inventario_controller import (
    obtener_inventario,
    obtener_disponibilidad_producto,
)

from app.utils.response import response_success, response_error
from app.utils.auth_dependency import get_current_user
from app.utils.roles import requiere_rol, ADMIN_O_FACTURACION, STAFF_INTERNO


router = APIRouter(
    prefix="/inventario",
    tags=["Inventario"],
    dependencies=[Depends(get_current_user)]
)


@router.get("", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def listar_inventario(db: Session = Depends(get_db)):

    try:
        inventario = obtener_inventario(db)
        return response_success(mensaje="Inventario consultado correctamente", data=inventario, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar el inventario", error=str(error), code=500)


@router.get("/productos/{id_producto}", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def disponibilidad_producto(id_producto: int, db: Session = Depends(get_db)):

    try:
        disponibilidad = obtener_disponibilidad_producto(db, id_producto)

        if not disponibilidad:
            return response_error(mensaje="El producto no existe", error="PRODUCTO_NOT_FOUND", code=404)

        return response_success(mensaje="Disponibilidad consultada correctamente", data=disponibilidad, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar la disponibilidad del producto", error=str(error), code=500)
