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
    actualizar_detalle_alquiler,
    eliminar_detalle_alquiler
)

from app.utils.response import (
    response_success,
    response_error
)

from app.utils.auth_dependency import get_current_user, UsuarioActual
from app.utils.roles import requiere_rol, ADMIN_O_FACTURACION, STAFF_INTERNO


router = APIRouter(
    prefix="/detalle-alquiler",
    tags=["Detalle de alquiler"],
    dependencies=[Depends(get_current_user)]
)


@router.post("", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def registrar_detalle(
    datos: DetalleAlquilerCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        detalle = crear_detalle_alquiler(db, datos, usuario_actual)

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
        return response_error(mensaje=str(error), error="DETALLE_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al crear el detalle de alquiler", error=str(error), code=500)


@router.get("/{id_detalle_alquiler}", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def consultar_detalle(
    id_detalle_alquiler: int,
    db: Session = Depends(get_db)
):

    try:
        detalle = obtener_detalle_alquiler(db, id_detalle_alquiler)

        if not detalle:
            return response_error(mensaje="El detalle de alquiler no existe", error="DETALLE_NOT_FOUND", code=404)

        return response_success(mensaje="Detalle de alquiler encontrado", data=detalle, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar el detalle de alquiler", error=str(error), code=500)


@router.patch("/{id_detalle_alquiler}", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def modificar_detalle(
    id_detalle_alquiler: int,
    datos: DetalleAlquilerUpdate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        detalle = actualizar_detalle_alquiler(db, id_detalle_alquiler, datos, usuario_actual)

        if not detalle:
            return response_error(mensaje="El detalle de alquiler no existe", error="DETALLE_NOT_FOUND", code=404)

        return response_success(mensaje="Detalle de alquiler actualizado correctamente", data=detalle, code=200)

    except ValueError as error:
        return response_error(mensaje=str(error), error="DETALLE_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al actualizar el detalle de alquiler", error=str(error), code=500)


@router.delete("/{id_detalle_alquiler}", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def eliminar_detalle(
    id_detalle_alquiler: int,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):
    """NUEVO (roadmap sección 22): quitar un producto de un alquiler pendiente/activo."""

    try:
        resultado = eliminar_detalle_alquiler(db, id_detalle_alquiler, usuario_actual)

        if not resultado:
            return response_error(mensaje="El detalle de alquiler no existe", error="DETALLE_NOT_FOUND", code=404)

        return response_success(mensaje="Producto eliminado del alquiler correctamente", data=resultado, code=200)

    except ValueError as error:
        return response_error(mensaje=str(error), error="DETALLE_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al eliminar el detalle de alquiler", error=str(error), code=500)
