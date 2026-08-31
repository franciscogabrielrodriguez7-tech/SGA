from typing import Optional

from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.alquiler_schema import (
    AlquilerCreate,
    AlquilerUpdate,
    AlquilerEstadoUpdate,
    RenovacionCreate
)

from app.schemas.logistica_alquiler_schema import (
    EntregaCreate,
    RecogidaCreate
)

from app.controllers.alquiler_controller import (
    crear_alquiler,
    obtener_alquiler,
    obtener_alquileres,
    actualizar_alquiler,
    cambiar_estado_alquiler,
    buscar_alquileres,
    alquileres_proximos_a_vencer,
    alquileres_pendientes_entrega,
    historial_alquiler,
    renovar_alquiler,
    registrar_entrega,
    obtener_entregas,
    registrar_recogida,
    obtener_recogidas
)

from app.utils.response import (
    response_success,
    response_error
)

# NUEVO respecto a la variante sin JWT: TODAS las rutas de este router
# requieren un token valido (Authorization: Bearer <token>).
from app.utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/alquileres",
    tags=["Alquileres"],
    dependencies=[Depends(get_current_user)]
)


# =========================================================
# IMPORTANTE: las rutas literales (buscar, proximos-vencer,
# pendientes-entrega) deben registrarse ANTES que "/{id_alquiler}",
# porque FastAPI resuelve rutas en orden de declaración y, si no,
# "buscar" se interpretaría como un id_alquiler inválido.
# =========================================================


# =========================================================
# BUSCAR (por cliente, barrio o número de detalle)
# =========================================================

@router.get("/buscar")
def buscar(
    cliente: Optional[str] = None,
    barrio: Optional[str] = None,
    id_detalle: Optional[int] = None,
    db: Session = Depends(get_db)
):

    try:

        resultados = buscar_alquileres(
            db,
            cliente=cliente,
            barrio=barrio,
            id_detalle=id_detalle
        )

        return response_success(
            mensaje="Resultados de la búsqueda",
            data=resultados,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al buscar alquileres",
            error=str(error),
            code=500
        )


# =========================================================
# PRÓXIMOS A VENCER
# =========================================================

@router.get("/proximos-vencer")
def proximos_a_vencer(
    dias: int = 2,
    db: Session = Depends(get_db)
):

    try:

        resultados = alquileres_proximos_a_vencer(db, dias)

        return response_success(
            mensaje="Alquileres próximos a vencer",
            data=resultados,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar alquileres próximos a vencer",
            error=str(error),
            code=500
        )


# =========================================================
# PENDIENTES DE ENTREGA
# =========================================================

@router.get("/pendientes-entrega")
def pendientes_entrega(
    db: Session = Depends(get_db)
):

    try:

        resultados = alquileres_pendientes_entrega(db)

        return response_success(
            mensaje="Alquileres pendientes por entregar",
            data=resultados,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar alquileres pendientes de entrega",
            error=str(error),
            code=500
        )


# =========================================================
# CREAR ALQUILER
# =========================================================

@router.post("")
def registrar_alquiler(
    datos: AlquilerCreate,
    db: Session = Depends(get_db)
):

    try:

        alquiler = crear_alquiler(db, datos)

        return response_success(
            mensaje="Alquiler creado correctamente",
            data=alquiler,
            code=201
        )

    except ValueError as error:

        return response_error(
            mensaje=str(error),
            error="ALQUILER_VALIDATION_ERROR",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al crear el alquiler",
            error=str(error),
            code=500
        )


# =========================================================
# LISTAR ALQUILERES
# =========================================================

@router.get("")
def listar_alquileres(
    estado_alquiler: Optional[str] = None,
    id_usuario_cliente: Optional[str] = None,
    db: Session = Depends(get_db)
):

    try:

        alquileres = obtener_alquileres(
            db,
            estado_alquiler=estado_alquiler,
            id_usuario_cliente=id_usuario_cliente
        )

        return response_success(
            mensaje="Alquileres encontrados",
            data=alquileres,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar alquileres",
            error=str(error),
            code=500
        )


# =========================================================
# CONSULTAR ALQUILER
# =========================================================

@router.get("/{id_alquiler}")
def consultar_alquiler(
    id_alquiler: int,
    db: Session = Depends(get_db)
):

    try:

        alquiler = obtener_alquiler(db, id_alquiler)

        if not alquiler:

            return response_error(
                mensaje="El alquiler no existe",
                error="ALQUILER_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Alquiler encontrado",
            data=alquiler,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar el alquiler",
            error=str(error),
            code=500
        )


# =========================================================
# ACTUALIZAR ALQUILER (campos editables)
# =========================================================

@router.patch("/{id_alquiler}")
def modificar_alquiler(
    id_alquiler: int,
    datos: AlquilerUpdate,
    db: Session = Depends(get_db)
):

    try:

        alquiler = actualizar_alquiler(db, id_alquiler, datos)

        if not alquiler:

            return response_error(
                mensaje="El alquiler no existe",
                error="ALQUILER_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Alquiler actualizado correctamente",
            data=alquiler,
            code=200
        )

    except ValueError as error:

        return response_error(
            mensaje=str(error),
            error="ALQUILER_VALIDATION_ERROR",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al actualizar el alquiler",
            error=str(error),
            code=500
        )


# =========================================================
# CAMBIAR ESTADO
# =========================================================

@router.patch("/{id_alquiler}/estado")
def cambiar_estado(
    id_alquiler: int,
    datos: AlquilerEstadoUpdate,
    db: Session = Depends(get_db)
):

    try:

        alquiler = cambiar_estado_alquiler(
            db,
            id_alquiler,
            datos.estado_alquiler
        )

        if not alquiler:

            return response_error(
                mensaje="El alquiler no existe",
                error="ALQUILER_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Estado del alquiler actualizado",
            data=alquiler,
            code=200
        )

    except ValueError as error:

        return response_error(
            mensaje=str(error),
            error="ALQUILER_ESTADO_INVALIDO",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al cambiar el estado del alquiler",
            error=str(error),
            code=500
        )


# =========================================================
# CANCELAR ("eliminar" según reglas -> PATCH a estado 'cancelado',
# decisión confirmada; no se hace DELETE físico)
# =========================================================

@router.delete("/{id_alquiler}")
def cancelar_alquiler(
    id_alquiler: int,
    db: Session = Depends(get_db)
):

    try:

        alquiler = cambiar_estado_alquiler(
            db,
            id_alquiler,
            "cancelado"
        )

        if not alquiler:

            return response_error(
                mensaje="El alquiler no existe",
                error="ALQUILER_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Alquiler cancelado correctamente",
            data=alquiler,
            code=200
        )

    except ValueError as error:

        return response_error(
            mensaje=str(error),
            error="ALQUILER_NO_CANCELABLE",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al cancelar el alquiler",
            error=str(error),
            code=500
        )


# =========================================================
# HISTORIAL / TRAZABILIDAD (versión limitada, ver controller)
# =========================================================

@router.get("/{id_alquiler}/historial")
def consultar_historial(
    id_alquiler: int,
    db: Session = Depends(get_db)
):

    try:

        historial = historial_alquiler(db, id_alquiler)

        if not historial:

            return response_error(
                mensaje="El alquiler no existe",
                error="ALQUILER_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Historial del alquiler",
            data=historial,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar el historial del alquiler",
            error=str(error),
            code=500
        )


# =========================================================
# RENOVACIONES (operación, no tabla propia)
# =========================================================

@router.post("/{id_alquiler}/renovaciones")
def renovar(
    id_alquiler: int,
    datos: RenovacionCreate,
    db: Session = Depends(get_db)
):

    try:

        alquiler = renovar_alquiler(db, id_alquiler, datos.semanas)

        if not alquiler:

            return response_error(
                mensaje="El alquiler no existe",
                error="ALQUILER_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Alquiler renovado correctamente",
            data=alquiler,
            code=200
        )

    except ValueError as error:

        return response_error(
            mensaje=str(error),
            error="RENOVACION_NO_PERMITIDA",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al renovar el alquiler",
            error=str(error),
            code=500
        )


# =========================================================
# ENTREGAS
# =========================================================

@router.post("/{id_alquiler}/entregas")
def crear_entrega(
    id_alquiler: int,
    datos: EntregaCreate,
    db: Session = Depends(get_db)
):

    try:

        entrega = registrar_entrega(db, id_alquiler, datos)

        if not entrega:

            return response_error(
                mensaje="El alquiler no existe",
                error="ALQUILER_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Entrega registrada correctamente. El alquiler pasó a estado 'activo'.",
            data={
                "id_logistica_alquiler": entrega.id_logistica_alquiler,
                "id_alquiler": entrega.id_alquiler,
                "es_recogida": entrega.es_recogida
            },
            code=201
        )

    except ValueError as error:

        return response_error(
            mensaje=str(error),
            error="ENTREGA_NO_PERMITIDA",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al registrar la entrega",
            error=str(error),
            code=500
        )


@router.get("/{id_alquiler}/entregas")
def listar_entregas(
    id_alquiler: int,
    db: Session = Depends(get_db)
):

    try:

        entregas = obtener_entregas(db, id_alquiler)

        return response_success(
            mensaje="Entregas del alquiler",
            data=entregas,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar las entregas",
            error=str(error),
            code=500
        )


# =========================================================
# RECOGIDAS
# =========================================================

@router.post("/{id_alquiler}/recogidas")
def crear_recogida(
    id_alquiler: int,
    datos: RecogidaCreate,
    db: Session = Depends(get_db)
):

    try:

        recogida = registrar_recogida(db, id_alquiler, datos)

        if not recogida:

            return response_error(
                mensaje="El alquiler no existe",
                error="ALQUILER_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Recogida registrada correctamente. El alquiler pasó a estado 'recogido'.",
            data={
                "id_logistica_alquiler": recogida.id_logistica_alquiler,
                "id_alquiler": recogida.id_alquiler,
                "es_recogida": recogida.es_recogida
            },
            code=201
        )

    except ValueError as error:

        return response_error(
            mensaje=str(error),
            error="RECOGIDA_NO_PERMITIDA",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al registrar la recogida",
            error=str(error),
            code=500
        )


@router.get("/{id_alquiler}/recogidas")
def listar_recogidas(
    id_alquiler: int,
    db: Session = Depends(get_db)
):

    try:

        recogidas = obtener_recogidas(db, id_alquiler)

        return response_success(
            mensaje="Recogidas del alquiler",
            data=recogidas,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar las recogidas",
            error=str(error),
            code=500
        )
