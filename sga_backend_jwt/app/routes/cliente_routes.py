from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.cliente_schema import (
    ClienteCreate,
    ClienteUpdate,
    ClienteEstadoUpdate,
)

from app.controllers.cliente_controller import (
    crear_cliente,
    obtener_cliente,
    obtener_clientes,
    actualizar_cliente,
    cambiar_estado_cliente,
)

from app.utils.response import response_success, response_error
from app.utils.auth_dependency import get_current_user, UsuarioActual
from app.utils.roles import requiere_rol, ADMIN_O_FACTURACION, STAFF_INTERNO


router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"],
    dependencies=[Depends(get_current_user)]
)


@router.post("", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def registrar_cliente(
    datos: ClienteCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        cliente = crear_cliente(db, datos, usuario_actual)

        return response_success(
            mensaje="Cliente creado correctamente",
            data={
                "id_usuario": cliente.id_usuario,
                "nombres_usuario": cliente.nombres_usuario,
                "apellidos_usuario": cliente.apellidos_usuario,
            },
            code=201
        )

    except ValueError as error:
        db.rollback()
        return response_error(mensaje=str(error), error="CLIENTE_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al crear el cliente", error=str(error), code=500)


@router.get("", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def listar_clientes(busqueda: Optional[str] = None, db: Session = Depends(get_db)):

    try:
        clientes = obtener_clientes(db, busqueda)
        return response_success(mensaje="Clientes encontrados", data=clientes, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar clientes", error=str(error), code=500)


@router.get("/{id_usuario}", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def consultar_cliente(id_usuario: str, db: Session = Depends(get_db)):

    try:
        cliente = obtener_cliente(db, id_usuario)

        if not cliente:
            return response_error(mensaje="El cliente no existe", error="CLIENTE_NOT_FOUND", code=404)

        return response_success(mensaje="Cliente encontrado", data=cliente, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar cliente", error=str(error), code=500)


@router.patch("/{id_usuario}", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
@router.put("/{id_usuario}", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def modificar_cliente(
    id_usuario: str,
    datos: ClienteUpdate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        cliente = actualizar_cliente(db, id_usuario, datos, usuario_actual)

        if not cliente:
            return response_error(mensaje="El cliente no existe", error="CLIENTE_NOT_FOUND", code=404)

        return response_success(mensaje="Cliente actualizado correctamente", data={
            "id_usuario": cliente.id_usuario,
            "nombres_usuario": cliente.nombres_usuario,
            "apellidos_usuario": cliente.apellidos_usuario,
            "telefono_usuario": cliente.telefono_usuario,
            "email_usuario": cliente.email_usuario,
        }, code=200)

    except ValueError as error:
        db.rollback()
        return response_error(mensaje=str(error), error="CLIENTE_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al actualizar el cliente", error=str(error), code=500)


@router.patch("/{id_usuario}/estado", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])
def cambiar_estado(
    id_usuario: str,
    datos: ClienteEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        cliente = cambiar_estado_cliente(db, id_usuario, datos.estado_registro, usuario_actual)

        if not cliente:
            return response_error(mensaje="El cliente no existe", error="CLIENTE_NOT_FOUND", code=404)

        return response_success(
            mensaje="Estado del cliente actualizado",
            data={"id_usuario": cliente.id_usuario, "estado_registro": cliente.estado_registro},
            code=200
        )

    except ValueError as error:
        db.rollback()
        return response_error(mensaje=str(error), error="CLIENTE_ESTADO_INVALIDO", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al cambiar el estado del cliente", error=str(error), code=500)
