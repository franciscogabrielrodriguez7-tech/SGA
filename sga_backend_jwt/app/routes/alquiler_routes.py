from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.alquiler_schema import (
    AlquilerCreate,
    AlquilerUpdate,
    AlquilerEstadoUpdate,
    RenovacionCreate,
)

from app.schemas.logistica_alquiler_schema import (
    EntregaCreate,
    RecogidaCreate,
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
    renovar_alquiler,
    registrar_entrega,
    obtener_entregas,
    registrar_recogida,
    obtener_recogidas,
)

from app.controllers.detalle_alquiler_controller import listar_detalles_por_alquiler

from app.controllers.auditoria_controller import historial_alquiler

from app.utils.response import response_success, response_error
from app.utils.auth_dependency import get_current_user, UsuarioActual
from app.utils.roles import requiere_rol, ADMIN_O_FACTURACION, STAFF_INTERNO


router = APIRouter(
    prefix="/alquileres",
    tags=["Alquileres"],
    dependencies=[Depends(get_current_user)]
)


# =========================================================
# RUTAS ESTÁTICAS PRIMERO (deben declararse antes de /{id_alquiler}
# para que FastAPI no intente interpretarlas como un id numérico)
# =========================================================

@router.get("/buscar", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def buscar(
    cliente: Optional[str] = None,
    numero: Optional[int] = None,
    barrio: Optional[str] = None,
    db: Session = Depends(get_db)
):

    try:
        resultados = buscar_alquileres(db, cliente=cliente, barrio=barrio, numero=numero)
        return response_success(mensaje="Resultados de la búsqueda", data=resultados, code=200)

    except Exception as error:
        return response_error(mensaje="Error al buscar alquileres", error=str(error), code=500)


@router.get("/proximos-vencer", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def proximos_a_vencer(dias: int = 2, db: Session = Depends(get_db)):

    try:
        resultados = alquileres_proximos_a_vencer(db, dias)
        return response_success(mensaje="Alquileres próximos a vencer", data=resultados, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar alquileres próximos a vencer", error=str(error), code=500)


@router.get("/pendientes-entrega", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def pendientes_entrega(solo_transporte: bool = False, db: Session = Depends(get_db)):

    try:
        resultados = alquileres_pendientes_entrega(db, solo_transporte=solo_transporte)
        return response_success(mensaje="Alquileres pendientes por entregar", data=resultados, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar alquileres pendientes de entrega", error=str(error), code=500)


# =========================================================
# CRUD PRINCIPAL
# =========================================================

@router.post("", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def registrar_alquiler(
    datos: AlquilerCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

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
def consultar_alquiler(id_alquiler: int, db: Session = Depends(get_db)):

    try:
        alquiler = obtener_alquiler(db, id_alquiler)

        if not alquiler:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(mensaje="Alquiler encontrado", data=alquiler, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar el alquiler", error=str(error), code=500)


@router.get("/{id_alquiler}/detalles", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def consultar_detalles_alquiler(id_alquiler: int, db: Session = Depends(get_db)):
    """
    Líneas de producto (detalle_alquiler) de un alquiler, con el
    nombre, precio_base y unidad_minima_alquiler de cada producto ya
    incluidos (join), para no requerir una consulta extra por línea
    desde el frontend. Útil para mostrar el detalle del alquiler y
    para calcular el costo de una renovación.
    """

    try:
        detalles = listar_detalles_por_alquiler(db, id_alquiler)
        return response_success(mensaje="Detalles del alquiler encontrados", data=detalles, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar los detalles del alquiler", error=str(error), code=500)


@router.patch("/{id_alquiler}", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
@router.put("/{id_alquiler}", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
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


@router.patch("/{id_alquiler}/estado", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def cambiar_estado(
    id_alquiler: int,
    datos: AlquilerEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        alquiler = cambiar_estado_alquiler(db, id_alquiler, datos.estado_alquiler, usuario_actual)

        if not alquiler:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(mensaje="Estado del alquiler actualizado", data=alquiler, code=200)

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
    """Borrado lógico / cancelación (RN del ciclo de vida: 'cancelado' es alternativa a 'terminado')."""

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


# =========================================================
# TRAZABILIDAD Y RENOVACIONES
# =========================================================

@router.get("/{id_alquiler}/historial", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def consultar_historial(id_alquiler: int, db: Session = Depends(get_db)):

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

    try:
        alquiler = renovar_alquiler(
            db, id_alquiler, datos.dias, usuario_actual,
            precio_alquiler=datos.precio_alquiler,
        )

        if not alquiler:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(mensaje="Alquiler renovado correctamente", data=alquiler, code=200)

    except ValueError as error:
        return response_error(mensaje=str(error), error="RENOVACION_NO_PERMITIDA", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al renovar el alquiler", error=str(error), code=500)


# =========================================================
# ENTREGAS Y RECOGIDAS
# =========================================================

@router.post("/{id_alquiler}/entregas", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def crear_entrega(
    id_alquiler: int,
    datos: EntregaCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        entrega = registrar_entrega(db, id_alquiler, datos, usuario_actual)

        if not entrega:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(
            mensaje="Entrega registrada correctamente. El alquiler pasó a estado 'activo'.",
            data={
                "id_logistica_alquiler": entrega["id_logistica_alquiler"],
                "id_alquiler": entrega["id_alquiler"],
                "tipo_movimiento": entrega["tipo_movimiento"]
            },
            code=201
        )

    except ValueError as error:
        return response_error(mensaje=str(error), error="ENTREGA_NO_PERMITIDA", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al registrar la entrega", error=str(error), code=500)


@router.get("/{id_alquiler}/entregas", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def listar_entregas(id_alquiler: int, db: Session = Depends(get_db)):

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

    try:
        recogida = registrar_recogida(db, id_alquiler, datos, usuario_actual)

        if not recogida:
            return response_error(mensaje="El alquiler no existe", error="ALQUILER_NOT_FOUND", code=404)

        return response_success(
            mensaje="Recogida registrada correctamente. El alquiler pasó a estado 'recogido'.",
            data={
                "id_logistica_alquiler": recogida["id_logistica_alquiler"],
                "id_alquiler": recogida["id_alquiler"],
                "tipo_movimiento": recogida["tipo_movimiento"]
            },
            code=201
        )

    except ValueError as error:
        return response_error(mensaje=str(error), error="RECOGIDA_NO_PERMITIDA", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al registrar la recogida", error=str(error), code=500)


@router.get("/{id_alquiler}/recogidas", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def listar_recogidas(id_alquiler: int, db: Session = Depends(get_db)):

    try:
        recogidas = obtener_recogidas(db, id_alquiler)
        return response_success(mensaje="Recogidas del alquiler", data=recogidas, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar las recogidas", error=str(error), code=500)
