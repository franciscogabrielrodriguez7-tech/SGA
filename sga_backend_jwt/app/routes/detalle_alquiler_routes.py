from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.detalle_alquiler_schema import (
    DetalleAlquilerCreate,
    DetalleAlquilerUpdate,
)

from app.controllers.detalle_alquiler_controller import (
    crear_detalle_alquiler,
    obtener_detalle_alquiler,
    actualizar_detalle_alquiler,
)

from app.controllers.auditoria_controller import obtener_registro_auditoria

from app.utils.response import response_success, response_error
from app.utils.auth_dependency import get_current_user, UsuarioActual
from app.utils.roles import requiere_rol, ADMIN_O_FACTURACION, STAFF_INTERNO


# =========================================================
# DETALLE DE ALQUILER — /api/sga/detalle-alquiler
# =========================================================

router = APIRouter(
    prefix="/detalle-alquiler",
    tags=["Detalle de Alquiler"],
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
        return response_success(mensaje="Producto agregado al alquiler correctamente", data=detalle, code=201)

    except ValueError as error:
        db.rollback()
        return response_error(mensaje=str(error), error="DETALLE_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al agregar el producto al alquiler", error=str(error), code=500)


@router.get("/{id_detalle_alquiler}", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def consultar_detalle(id_detalle_alquiler: int, db: Session = Depends(get_db)):

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
        db.rollback()
        return response_error(mensaje=str(error), error="DETALLE_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al actualizar el detalle de alquiler", error=str(error), code=500)


# =========================================================
# RENOVACIONES — /api/sga/renovaciones
# -----------------------------------------------------------
# La renovación en sí se REGISTRA vía POST /alquileres/{id}/renovaciones
# (ver alquiler_routes.py). Aquí solo se CONSULTA el detalle de un
# evento de renovación puntual, identificado por el id_auditoria que
# devuelve ese POST (campo "id_auditoria_renovacion" en la respuesta).
# =========================================================

router_renovaciones = APIRouter(
    prefix="/renovaciones",
    tags=["Renovaciones"],
    dependencies=[Depends(get_current_user)]
)


@router_renovaciones.get("/{id_auditoria}", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def consultar_renovacion(id_auditoria: int, db: Session = Depends(get_db)):

    try:
        registro = obtener_registro_auditoria(db, id_auditoria)

        if not registro or registro["nombre_tabla"] != "alquiler" or registro["tipo_operacion"] != "UPDATE":
            return response_error(
                mensaje="No existe un registro de renovación con ese id",
                error="RENOVACION_NOT_FOUND",
                code=404
            )

        return response_success(mensaje="Detalle de la renovación", data=registro, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar la renovación", error=str(error), code=500)
