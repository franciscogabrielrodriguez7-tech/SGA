from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.alquiler_schema import (
    AlquilerCreate,
    AlquilerUpdate,
    AlquilerEstadoUpdate,
    RenovacionCreate,
    RecepcionDirectaCreate
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
    cancelar_alquiler,
    buscar_alquileres,
    alquileres_proximos_a_vencer,
    alquileres_pendientes_entrega,
    historial_alquiler,
    renovar_alquiler,
    registrar_entrega,
    obtener_entregas,
    registrar_recogida,
    obtener_recogidas,
    recepcion_directa
)

from app.utils.response import (
    response_success,
    response_error
)

from app.utils.auth_dependency import get_current_user, UsuarioActual
from app.utils.roles import requiere_rol, SOLO_ADMIN, ADMIN_O_FACTURACION, STAFF_INTERNO


router = APIRouter(
    prefix="/alquileres",
    tags=["Alquileres"],
    dependencies=[Depends(get_current_user)]
)


# =========================================================
# NOTA SOBRE ROLES (roadmap secciones 4, 24, 26-27):
#   - crear, editar, cancelar, renovar, entrega/recepción DIRECTA:
#     admin + encargado_facturacion
#   - entrega/recogida MEDIANTE TRANSPORTE: admin + encargado_logistico
#     (el rol exacto según se_lleva/se_recoge se valida DENTRO del
#     controller, porque depende de un dato del propio alquiler, no
#     solo del rol — por eso esas dos rutas solo exigen STAFF_INTERNO
#     aquí, y el controller afina con HTTPException(403) si el rol no
#     corresponde al tipo de operación).
#   - consultar/listar/buscar: cualquier staff interno (no cliente)
#   - cambiar estado (PATCH /estado): SOLO admin (corrección
#     administrativa, sección 3)
# =========================================================


@router.get("/buscar", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def buscar(
    cliente: Optional[str] = None,
    barrio: Optional[str] = None,
    id_detalle: Optional[int] = None,
    db: Session = Depends(get_db)
):

    try:
        resultados = buscar_alquileres(db, cliente=cliente, barrio=barrio, id_detalle=id_detalle)
        return response_success(mensaje="Resultados de la búsqueda", data=resultados, code=200)

    except Exception as error:
        return response_error(mensaje="Error al buscar alquileres", error=str(error), code=500)


@router.get("/proximos-vencer", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def proximos_a_vencer(
    dias: int = 2,
    db: Session = Depends(get_db)
):

    try:
        resultados = alquileres_proximos_a_vencer(db, dias)
        return response_success(mensaje="Alquileres próximos a vencer", data=resultados, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar alquileres próximos a vencer", error=str(error), code=500)


@router.get("/pendientes-entrega", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def pendientes_entrega(
    solo_transporte: bool = False,
    db: Session = Depends(get_db)
):
    """
    `solo_transporte=true` filtra a los que requieren transporte
    (se_lleva=True) — la vista relevante para encargado_logistico
    (roadmap sección 9: puede ver todos los pendientes disponibles,
    no solo los ya asignados).
    """

    try:
        resultados = alquileres_pendientes_entrega(db, solo_transporte=solo_transporte)
        return response_success(mensaje="Alquileres pendientes por entregar", data=resultados, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar alquileres pendientes de entrega", error=str(error), code=500)


@router.post("", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def registrar_alquiler(
    datos: AlquilerCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):
    """Solo admin/facturación crean alquileres (sección 4: logística NO crea)."""

    try:
        alquiler = crear_alquiler(db, datos, usuario_actual)
        return response_success(mensaje="Alquiler creado correctamente", data=alquiler, code=201)

    except ValueError as error:
        return response_error(mensaje=str(error), error="ALQUILER_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al crear el alquiler", error=str(error), code=500)


@router.get("", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def listar_alquileres(
    estado_alquiler: Optional[str] = None,
    id_usuario_cliente: Optional[str] = None,
    db: Session = Depends(get_db)
):

    try:
        alquileres = obtener_alquileres(db, estado_alquiler=estado_alquiler, id_usuario_cliente=id_usuario_cliente)
        return response_success(mensaje="Alquileres encontrados", data=alquileres, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar alquileres", error=str(error), code=500)


@router.get("/{id_alquiler}", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def consultar_alquiler(
    id_alquiler: int,
    db: Session = Depends(get_db)
):

    try:
        alquiler = obtener_alquiler(db, id_alquiler)

        if not alquiler:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(mensaje="Alquiler encontrado", data=alquiler, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar el alquiler", error=str(error), code=500)


@router.patch("/{id_alquiler}", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def modificar_alquiler(
    id_alquiler: int,
    datos: AlquilerUpdate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        alquiler = actualizar_alquiler(db, id_alquiler, datos, usuario_actual)

        if not alquiler:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(mensaje="Alquiler actualizado correctamente", data=alquiler, code=200)

    except ValueError as error:
        return response_error(mensaje=str(error), error="ALQUILER_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al actualizar el alquiler", error=str(error), code=500)


@router.patch("/{id_alquiler}/estado", dependencies=[Depends(requiere_rol(*SOLO_ADMIN))])
def cambiar_estado(
    id_alquiler: int,
    datos: AlquilerEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):
    """
    Corrección administrativa (roadmap sección 3). SOLO admin. Para
    operaciones normales usar /entregas, /recogidas, /renovaciones,
    /recepcion-directa o DELETE (cancelar).
    """

    try:
        alquiler = cambiar_estado_alquiler(db, id_alquiler, datos.estado_alquiler, usuario_actual)

        if not alquiler:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(mensaje="Estado del alquiler actualizado (corrección administrativa)", data=alquiler, code=200)

    except ValueError as error:
        return response_error(mensaje=str(error), error="ALQUILER_ESTADO_INVALIDO", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al cambiar el estado del alquiler", error=str(error), code=500)


@router.delete("/{id_alquiler}", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def cancelar(
    id_alquiler: int,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):
    """Solo admin/facturación cancelan (roadmap sección 27)."""

    try:
        alquiler = cancelar_alquiler(db, id_alquiler, usuario_actual)

        if not alquiler:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(mensaje="Alquiler cancelado correctamente", data=alquiler, code=200)

    except ValueError as error:
        return response_error(mensaje=str(error), error="ALQUILER_NO_CANCELABLE", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al cancelar el alquiler", error=str(error), code=500)


@router.get("/{id_alquiler}/historial", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def consultar_historial(
    id_alquiler: int,
    db: Session = Depends(get_db)
):

    try:
        historial = historial_alquiler(db, id_alquiler)

        if not historial:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(mensaje="Historial del alquiler", data=historial, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar el historial del alquiler", error=str(error), code=500)


@router.post("/{id_alquiler}/renovaciones", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def renovar(
    id_alquiler: int,
    datos: RenovacionCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):
    """Solo admin/facturación renuevan (roadmap: logística NO renueva)."""

    try:
        alquiler = renovar_alquiler(db, id_alquiler, datos.semanas, usuario_actual)

        if not alquiler:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(mensaje="Alquiler renovado correctamente", data=alquiler, code=200)

    except ValueError as error:
        return response_error(mensaje=str(error), error="RENOVACION_NO_PERMITIDA", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al renovar el alquiler", error=str(error), code=500)


@router.post("/{id_alquiler}/entregas", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def crear_entrega(
    id_alquiler: int,
    datos: EntregaCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):
    """
    Rol exacto (admin+facturación si es directa, admin+logístico si es
    por transporte) se valida DENTRO del controller según
    alquiler.se_lleva — ver nota al inicio del archivo.
    """

    try:
        entrega = registrar_entrega(db, id_alquiler, datos, usuario_actual)

        if not entrega:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(
            mensaje="Entrega registrada correctamente. El alquiler pasó a estado 'activo'.",
            data={
                "id_logistica_alquiler": entrega.id_logistica_alquiler,
                "id_alquiler": entrega.id_alquiler,
                "es_recogida": entrega.es_recogida
            },
            code=201
        )

    except HTTPException:
        raise  # deja que el 403 de rol llegue tal cual, sin convertirse en 500

    except ValueError as error:
        return response_error(mensaje=str(error), error="ENTREGA_NO_PERMITIDA", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al registrar la entrega", error=str(error), code=500)


@router.get("/{id_alquiler}/entregas", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def listar_entregas(
    id_alquiler: int,
    db: Session = Depends(get_db)
):

    try:
        entregas = obtener_entregas(db, id_alquiler)
        return response_success(mensaje="Entregas del alquiler", data=entregas, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar las entregas", error=str(error), code=500)


@router.post("/{id_alquiler}/recogidas", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def crear_recogida(
    id_alquiler: int,
    datos: RecogidaCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):
    """Recogida SIEMPRE mediante transporte -> el controller exige admin/logístico."""

    try:
        recogida = registrar_recogida(db, id_alquiler, datos, usuario_actual)

        if not recogida:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(
            mensaje="Recogida registrada correctamente. El alquiler pasó a estado 'recogido'.",
            data={
                "id_logistica_alquiler": recogida.id_logistica_alquiler,
                "id_alquiler": recogida.id_alquiler,
                "es_recogida": recogida.es_recogida
            },
            code=201
        )

    except HTTPException:
        raise

    except ValueError as error:
        return response_error(mensaje=str(error), error="RECOGIDA_NO_PERMITIDA", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al registrar la recogida", error=str(error), code=500)


@router.get("/{id_alquiler}/recogidas", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def listar_recogidas(
    id_alquiler: int,
    db: Session = Depends(get_db)
):

    try:
        recogidas = obtener_recogidas(db, id_alquiler)
        return response_success(mensaje="Recogidas del alquiler", data=recogidas, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar las recogidas", error=str(error), code=500)


@router.post("/{id_alquiler}/recepcion-directa", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def crear_recepcion_directa(
    id_alquiler: int,
    datos: RecepcionDirectaCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):
    """
    NUEVO (roadmap sección 6): 'activo' -> 'terminado' sin transporte.
    Solo admin/facturación — la logística NO debe hacer recepción
    directa (última línea de la sección 6 del roadmap).
    """

    try:
        alquiler = recepcion_directa(db, id_alquiler, usuario_actual)

        if not alquiler:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(mensaje="Recepción directa registrada. El alquiler pasó a 'terminado'.", data=alquiler, code=200)

    except HTTPException:
        raise

    except ValueError as error:
        return response_error(mensaje=str(error), error="RECEPCION_NO_PERMITIDA", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al registrar la recepción directa", error=str(error), code=500)
