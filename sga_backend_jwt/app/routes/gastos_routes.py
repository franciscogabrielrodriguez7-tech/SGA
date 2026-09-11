from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.logistica_alquiler_schema import GastoCreate

from app.controllers.logistica_alquiler_controller import (
    crear_gasto,
    obtener_gastos,
    resumen_semanal_gastos,
)

from app.utils.response import response_success, response_error
from app.utils.auth_dependency import get_current_user, UsuarioActual
from app.utils.roles import requiere_rol, ADMIN_O_FACTURACION, STAFF_INTERNO


router = APIRouter(
    prefix="/gastos",
    tags=["Gastos Logísticos"],
    dependencies=[Depends(get_current_user)]
)


@router.post("", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def registrar_gasto(
    datos: GastoCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        gasto = crear_gasto(db, datos, usuario_actual)

        return response_success(
            mensaje=f"Gasto registrado correctamente para {len(datos.ids_alquiler)} alquiler(es)",
            data=gasto,
            code=201
        )

    except ValueError as error:
        db.rollback()
        return response_error(mensaje=str(error), error="GASTO_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al registrar el gasto", error=str(error), code=500)


@router.get("", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def listar_gastos(id_alquiler: Optional[int] = None, db: Session = Depends(get_db)):

    try:
        gastos = obtener_gastos(db, id_alquiler)
        return response_success(mensaje="Gastos encontrados", data=gastos, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar los gastos", error=str(error), code=500)


@router.get("/resumen-semanal", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def resumen_semanal(db: Session = Depends(get_db)):

    try:
        resumen = resumen_semanal_gastos(db)
        return response_success(mensaje="Resumen semanal de gastos", data=resumen, code=200)

    except Exception as error:
        return response_error(mensaje="Error al calcular el resumen semanal", error=str(error), code=500)
