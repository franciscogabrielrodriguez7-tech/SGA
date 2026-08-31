from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.detalle_alquiler_schema import (
    DetalleAlquilerCreate,
    DetalleAlquilerUpdate
)

from app.controllers.detalle_alquiler_controller import (
    crear_detalle_alquiler,
    obtener_detalle_alquiler,
    actualizar_detalle_alquiler
)

from app.utils.response import (
    response_success,
    response_error
)

# NUEVO respecto a la variante sin JWT: TODAS las rutas de este router
# requieren un token valido (Authorization: Bearer <token>).
from app.utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/detalle-alquiler",
    tags=["Detalle de alquiler"],
    dependencies=[Depends(get_current_user)]
)


@router.post("")
def registrar_detalle(
    datos: DetalleAlquilerCreate,
    db: Session = Depends(get_db)
):

    try:

        detalle = crear_detalle_alquiler(db, datos)

        return response_success(
            mensaje="Detalle de alquiler creado correctamente",
            data={
                "id_detalle_alquiler": detalle.id_detalle_alquiler,
                "id_alquiler": detalle.id_alquiler,
                "id_producto": detalle.id_producto,
                "cantidad_productos": detalle.cantidad_productos
            },
            code=201
        )

    except ValueError as error:

        return response_error(
            mensaje=str(error),
            error="DETALLE_VALIDATION_ERROR",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al crear el detalle de alquiler",
            error=str(error),
            code=500
        )


@router.get("/{id_detalle_alquiler}")
def consultar_detalle(
    id_detalle_alquiler: int,
    db: Session = Depends(get_db)
):

    try:

        detalle = obtener_detalle_alquiler(db, id_detalle_alquiler)

        if not detalle:

            return response_error(
                mensaje="El detalle de alquiler no existe",
                error="DETALLE_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Detalle de alquiler encontrado",
            data=detalle,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar el detalle de alquiler",
            error=str(error),
            code=500
        )


@router.patch("/{id_detalle_alquiler}")
def modificar_detalle(
    id_detalle_alquiler: int,
    datos: DetalleAlquilerUpdate,
    db: Session = Depends(get_db)
):

    try:

        detalle = actualizar_detalle_alquiler(
            db,
            id_detalle_alquiler,
            datos
        )

        if not detalle:

            return response_error(
                mensaje="El detalle de alquiler no existe",
                error="DETALLE_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Detalle de alquiler actualizado correctamente",
            data=detalle,
            code=200
        )

    except ValueError as error:

        return response_error(
            mensaje=str(error),
            error="DETALLE_VALIDATION_ERROR",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al actualizar el detalle de alquiler",
            error=str(error),
            code=500
        )
