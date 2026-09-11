from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.schemas.usuario_schema import LoginRequest
from app.controllers.usuario_controller import login_usuario
from app.utils.response import response_success, response_error


router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login")
def login(datos: LoginRequest, db: Session = Depends(get_db)):

    try:
        resultado = login_usuario(
            db,
            datos.contrasena_usuario,
            telefono_usuario=datos.telefono_usuario,
            email_usuario=datos.email_usuario
        )

        if not resultado:
            return response_error(
                mensaje="Credenciales incorrectas",
                error="LOGIN_INVALID",
                code=401,
                data={"logueado": False}
            )

        return response_success(mensaje="Login exitoso", data=resultado, code=200)

    except ValueError as error:
        return response_error(mensaje=str(error), error="LOGIN_VALIDATION_ERROR", code=400)

    except Exception as error:
        return response_error(mensaje="Error al iniciar sesión", error=str(error), code=500)
