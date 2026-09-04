# =========================================================
# PRUEBA DE CONEXIÓN A BASE DE DATOS
# =========================================================

from sqlalchemy import text

from app.config.database import engine


try:

    with engine.connect() as connection:

        connection.execute(
            text("SELECT 1")
        )

    print("Conexion exitosa a PostgreSQL")

except Exception as error:

    print(
        f"Error de conexion: {error}"
    )


# =========================================================
# FASTAPI
# =========================================================

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException

# NUEVO respecto a la variante sin JWT
from app.utils.response import response_error


# =========================================================
# CREAR APLICACIÓN
# =========================================================

app = FastAPI(
    title="API SGA",
    description="API para el Sistema de Gestión de Alquileres de Andamios",
    version="1.0.0"
)


# =========================================================
# SCHEDULER (NUEVO) — actualiza activo -> vencido diariamente
# a las 00:00 America/Bogota. Ver app/utils/scheduler.py.
# =========================================================

from app.utils.scheduler import iniciar_scheduler, detener_scheduler


@app.on_event("startup")
def _iniciar_scheduler_evento():
    iniciar_scheduler()


@app.on_event("shutdown")
def _detener_scheduler_evento():
    detener_scheduler()


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://sga-three-kappa.vercel.app"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# MANEJADOR DE EXCEPCIONES HTTP (NUEVO)
# -----------------------------------------------------------
# Sin esto, un 401 del JWT (levantado como HTTPException por
# app/utils/auth_dependency.py) devolvería el formato por defecto de
# FastAPI ({"detail": "..."}), distinto al sobre estándar
# {status, mensaje, data, error, code} que usa el resto de la API.
# =========================================================

@app.exception_handler(HTTPException)
async def manejar_http_exception(request: Request, exc: HTTPException):

    codigo_error = "HTTP_ERROR"

    if exc.status_code == 401:
        codigo_error = "AUTH_ERROR"
    elif exc.status_code == 403:
        codigo_error = "FORBIDDEN"

    return response_error(
        mensaje=str(exc.detail),
        error=codigo_error,
        code=exc.status_code
    )


# =========================================================
# IMPORTAR ROUTES
# =========================================================

from app.routes.usuario_routes import (
    router as usuario_router
)

from app.routes.producto_routes import (
    router as producto_router
)

from app.routes.alquiler_routes import (
    router as alquiler_router
)

from app.routes.detalle_alquiler_routes import (
    router as detalle_alquiler_router
)

from app.routes.logistica_alquiler_routes import (
    router as logistica_alquiler_router
)


# =========================================================
# VERSION API
# =========================================================

API_PREFIX = "/api/sga"


# =========================================================
# ROUTES
# =========================================================

app.include_router(
    usuario_router,
    prefix=API_PREFIX
)

app.include_router(
    producto_router,
    prefix=API_PREFIX
)

app.include_router(
    alquiler_router,
    prefix=API_PREFIX
)

app.include_router(
    detalle_alquiler_router,
    prefix=API_PREFIX
)

app.include_router(
    logistica_alquiler_router,
    prefix=API_PREFIX
)


# =========================================================
# INICIO
# =========================================================

@app.get("/")
def inicio():

    return {
        "status": True,
        "mensaje": "API SGA funcionando",
        "data": {
            "version": "v1",
            "api": API_PREFIX
        },
        "error": None,
        "code": 200
    }
