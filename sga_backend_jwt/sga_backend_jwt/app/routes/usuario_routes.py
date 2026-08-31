from fastapi import APIRouter, Depends
from typing import Optional

from sqlalchemy.orm import Session

from app.config.database import get_db

from app.schemas.usuario_schema import (
    UsuarioCreate,
    UsuarioEstadoUpdate,
    LoginRequest
)

from app.controllers.usuario_controller import (
    crear_usuario,
    obtener_usuario,
    obtener_usuarios,
    cambiar_estado_usuario,
    login_usuario
)

from app.utils.response import (
    response_success,
    response_error
)

# NUEVO respecto a la variante sin JWT
from app.utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


# =========================================================
# CREAR USUARIO
# =========================================================

@router.post("", dependencies=[Depends(get_current_user)])
def registrar_usuario(
    datos: UsuarioCreate,
    db: Session = Depends(get_db)
):

    try:

        usuario = crear_usuario(db, datos)

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

        return response_error(
            mensaje=str(error),
            error="USUARIO_VALIDATION_ERROR",
            code=400
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al crear el usuario",
            error=str(error),
            code=500
        )


# =========================================================
# LISTAR USUARIOS (filtro opcional por rol)
# =========================================================

@router.get("", dependencies=[Depends(get_current_user)])
def listar_usuarios(
    rol_usuario: Optional[str] = None,
    db: Session = Depends(get_db)
):

    try:

        usuarios = obtener_usuarios(db, rol_usuario)

        return response_success(
            mensaje="Usuarios encontrados",
            data=usuarios,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar usuarios",
            error=str(error),
            code=500
        )


# =========================================================
# CONSULTAR USUARIO
# =========================================================

@router.get("/{id_usuario}", dependencies=[Depends(get_current_user)])
def consultar_usuario(
    id_usuario: str,
    db: Session = Depends(get_db)
):

    try:

        usuario = obtener_usuario(db, id_usuario)

        if not usuario:

            return response_error(
                mensaje="El usuario no existe",
                error="USUARIO_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Usuario encontrado",
            data=usuario,
            code=200
        )

    except Exception as error:

        return response_error(
            mensaje="Error al consultar usuario",
            error=str(error),
            code=500
        )


# =========================================================
# CAMBIAR ESTADO (activar / desactivar, RN-USR-04/05)
# =========================================================

@router.patch("/{id_usuario}/estado", dependencies=[Depends(get_current_user)])
def cambiar_estado(
    id_usuario: str,
    datos: UsuarioEstadoUpdate,
    db: Session = Depends(get_db)
):

    try:

        usuario = cambiar_estado_usuario(
            db,
            id_usuario,
            datos.estado_usuario
        )

        if not usuario:

            return response_error(
                mensaje="El usuario no existe",
                error="USUARIO_NOT_FOUND",
                code=404
            )

        return response_success(
            mensaje="Estado del usuario actualizado",
            data={
                "id_usuario": usuario.id_usuario,
                "estado_usuario": usuario.estado_usuario
            },
            code=200
        )

    except Exception as error:

        db.rollback()

        return response_error(
            mensaje="Error al cambiar el estado del usuario",
            error=str(error),
            code=500
        )


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(
    datos: LoginRequest,
    db: Session = Depends(get_db)
):

    try:

        usuario = login_usuario(
            db,
            datos.contrasena_usuario,
            telefono_usuario=datos.telefono_usuario,
            email_usuario=datos.email_usuario
        )

        if not usuario:

            return response_error(
                mensaje="Credenciales incorrectas",
                error="LOGIN_INVALID",
                code=401,
                data={
                    "logueado": False
                }
            )

        return response_success(
            mensaje="Login exitoso",
            data=usuario,
            code=200
        )

    except ValueError as error:

        return response_error(
            mensaje=str(error),
            error="LOGIN_VALIDATION_ERROR",
            code=400
        )

    except Exception as error:

        return response_error(
            mensaje="Error al iniciar sesión",
            error=str(error),
            code=500
        )
