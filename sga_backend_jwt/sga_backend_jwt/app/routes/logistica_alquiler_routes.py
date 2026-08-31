from typing import Optional

from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.logistica_alquiler_schema import (
    GastoCreate
)

from app.controllers.logistica_alquiler_controller import (
    crear_gasto,
    obtener_gastos,
    resumen_semanal_gastos
)

from app.utils.response import (
    response_success,
    response_error
)

# NUEVO respecto a la variante sin JWT: TODAS las rutas de este router
# requieren un token valido (Authorization: Bearer <token>).
from app.utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/gastos",
    tags=["Gastos"],
    dependencies=[Depends(get_current_user)]
)


# =========================================================
# IMPORTANTE: "resumen-semanal" debe declararse antes que
# rutas con path params, por el mismo motivo explicado en
# alquiler_routes.py (aunque aquí no hay conflicto directo,
# se mantiene el mismo criterio por consistencia).
# =========================================================

@router.get("/resumen-semanal")
def resumen_semanal(
    db: Session = Depends(get_db)
):

    try:

        resumen = resumen_semanal_gastos(db)

        return response_success(
            mensaje="Resumen semanal de gastos logísticos",
            data=resumen,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al calcular el resumen semanal de gastos",
            error=str(error),
            code=500
        )


@router.post("")
def registrar_gasto(
    datos: GastoCreate,
    db: Session = Depends(get_db)
):

    try:

        gasto = crear_gasto(db, datos)

        return response_success(
            mensaje="Gasto logístico registrado correctamente",
            data={
                "id_logistica_alquiler": gasto.id_logistica_alquiler,
                "id_alquiler": gasto.id_alquiler,
                "valor_gasto_logistico": gasto.valor_gasto_logistico,
                "es_recogida": gasto.es_recogida
            },
            code=201
        )

    except ValueError as error:

        return response_error(
            mensaje=str(error),
            error="GASTO_VALIDATION_ERROR",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al registrar el gasto",
            error=str(error),
            code=500
        )


@router.get("")
def listar_gastos(
    id_alquiler: Optional[int] = None,
    db: Session = Depends(get_db)
):

    try:

        gastos = obtener_gastos(db, id_alquiler)

        return response_success(
            mensaje="Gastos encontrados",
            data=gastos,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar gastos",
            error=str(error),
            code=500
        )
