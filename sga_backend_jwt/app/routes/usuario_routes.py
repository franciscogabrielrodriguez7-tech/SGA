from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.usuario_schema import (
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioEstadoUpdate,
)

from app.controllers.usuario_controller import (
    crear_usuario,
    obtener_usuario,
    obtener_usuarios,
    actualizar_usuario,
    cambiar_estado_usuario,
)

from app.utils.response import response_success, response_error
from app.utils.auth_dependency import get_current_user, UsuarioActual
from app.utils.roles import requiere_rol, SOLO_ADMIN, STAFF_INTERNO


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
    dependencies=[Depends(get_current_user)]
)


# =========================================================
# CREAR USUARIO DE PERSONAL — SOLO ADMIN
# =========================================================

@router.post("", dependencies=[Depends(requiere_rol(*SOLO_ADMIN))])
def registrar_usuario(
    datos: UsuarioCreate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        usuario = crear_usuario(db, datos, usuario_actual)

        return response_success(
            mensaje="Usuario creado correctamente",
            data={
                "id_usuario": usuario.id_usuario,
                "rol_usuario": usuario.rol_usuario,
                "nombres_usuario": usuario.nombres_usuario,
                "apellidos_usuario": usuario.apellidos_usuario
            },
            code=201
        )

    except ValueError as error:
        db.rollback()
        return response_error(mensaje=str(error), error="USUARIO_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al crear el usuario", error=str(error), code=500)


# =========================================================
# LISTAR USUARIOS
# -----------------------------------------------------------
# admin: acceso sin restricciones (con o sin filtro por rol).
# encargado_facturacion / encargado_logistico: SOLO pueden consultar
# la lista de logísticos (rol_usuario=encargado_logistico), por
# ejemplo para asignar una entrega/recogida.
# =========================================================

@router.get("", dependencies=[Depends(requiere_rol(*STAFF_INTERNO))])
def listar_usuarios(
    rol_usuario: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    if usuario_actual.rol_usuario != "admin" and rol_usuario != "encargado_logistico":
        raise HTTPException(
            status_code=403,
            detail=(
                "Solo un administrador puede listar usuarios sin filtro. "
                "Los demás roles solo pueden consultar "
                "?rol=encargado_logistico."
            ),
        )

    try:
        usuarios = obtener_usuarios(db, rol_usuario)
        return response_success(mensaje="Usuarios encontrados", data=usuarios, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar usuarios", error=str(error), code=500)


# =========================================================
# CONSULTAR USUARIO — SOLO ADMIN
# =========================================================

@router.get("/{id_usuario}", dependencies=[Depends(requiere_rol(*SOLO_ADMIN))])
def consultar_usuario(id_usuario: str, db: Session = Depends(get_db)):

    try:
        usuario = obtener_usuario(db, id_usuario)

        if not usuario:
            return response_error(mensaje="El usuario no existe", error="USUARIO_NOT_FOUND", code=404)

        return response_success(mensaje="Usuario encontrado", data=usuario, code=200)

    except Exception as error:
        return response_error(mensaje="Error al consultar usuario", error=str(error), code=500)


# =========================================================
# ACTUALIZAR USUARIO — SOLO ADMIN
# =========================================================

@router.patch("/{id_usuario}", dependencies=[Depends(requiere_rol(*SOLO_ADMIN))])
@router.put("/{id_usuario}", dependencies=[Depends(requiere_rol(*SOLO_ADMIN))])
def modificar_usuario(
    id_usuario: str,
    datos: UsuarioUpdate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        usuario = actualizar_usuario(db, id_usuario, datos, usuario_actual)

        if not usuario:
            return response_error(mensaje="El usuario no existe", error="USUARIO_NOT_FOUND", code=404)

        return response_success(mensaje="Usuario actualizado correctamente", data={
            "id_usuario": usuario.id_usuario,
            "rol_usuario": usuario.rol_usuario,
            "nombres_usuario": usuario.nombres_usuario,
            "apellidos_usuario": usuario.apellidos_usuario,
            "email_usuario": usuario.email_usuario,
            "telefono_usuario": usuario.telefono_usuario,
        }, code=200)

    except ValueError as error:
        db.rollback()
        return response_error(mensaje=str(error), error="USUARIO_VALIDATION_ERROR", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al actualizar el usuario", error=str(error), code=500)


# =========================================================
# CAMBIAR ESTADO (borrado lógico) — SOLO ADMIN
# -----------------------------------------------------------
# Los triggers de la BD (trg_impedir_autodesactivacion_admin,
# trg_garantizar_minimo_un_admin) protegen contra que un admin se
# desactive a sí mismo o que el sistema se quede sin administradores.
# =========================================================

@router.patch("/{id_usuario}/estado", dependencies=[Depends(requiere_rol(*SOLO_ADMIN))])
def cambiar_estado(
    id_usuario: str,
    datos: UsuarioEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: UsuarioActual = Depends(get_current_user)
):

    try:
        usuario = cambiar_estado_usuario(db, id_usuario, datos.estado_registro, usuario_actual)

        if not usuario:
            return response_error(mensaje="El usuario no existe", error="USUARIO_NOT_FOUND", code=404)

        return response_success(
            mensaje="Estado del usuario actualizado",
            data={"id_usuario": usuario.id_usuario, "estado_registro": usuario.estado_registro},
            code=200
        )

    except ValueError as error:
        db.rollback()
        return response_error(mensaje=str(error), error="USUARIO_ESTADO_INVALIDO", code=400)

    except Exception as error:
        db.rollback()
        return response_error(mensaje="Error al cambiar el estado del usuario", error=str(error), code=500)
