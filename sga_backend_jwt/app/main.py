# =========================================================
# PRUEBA DE CONEXIÓN A BASE DE DATOS
# =========================================================

from sqlalchemy import text

from app.config.database import engine


try:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    print("Conexion exitosa a PostgreSQL")

except Exception as error:
    print(f"Error de conexion: {error}")


# =========================================================
# FASTAPI
# =========================================================

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException

from app.utils.response import response_error


app = FastAPI(
    title="API SGA",
    description="API para el Sistema de Gestión de Alquileres de Andamios",
    version="2.0.0"
)


# =========================================================
# SCHEDULER — actualiza activo -> vencido diariamente a las
# 00:05 America/Bogota. Ver app/utils/scheduler.py.
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
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# MANEJADOR DE EXCEPCIONES HTTP
# -----------------------------------------------------------
# Sin esto, un 401/403 levantado como HTTPException (JWT ausente/
# inválido, rol insuficiente) devolvería el formato por defecto de
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
    elif exc.status_code == 404:
        codigo_error = "NOT_FOUND"

    return response_error(
        mensaje=str(exc.detail),
        error=codigo_error,
        code=exc.status_code
    )


# =========================================================
# IMPORTAR ROUTES
# =========================================================

from app.routes.auth_routes import router as auth_router
from app.routes.usuario_routes import router as usuario_router
from app.routes.cliente_routes import router as cliente_router
from app.routes.producto_routes import router as producto_router
from app.routes.inventario_routes import router as inventario_router
from app.routes.alquiler_routes import router as alquiler_router
from app.routes.detalle_alquiler_routes import (
    router as detalle_alquiler_router,
    router_renovaciones as renovaciones_router,
)
from app.routes.gastos_routes import router as gastos_router


# =========================================================
# PREFIJO DE LA API
# =========================================================

API_PREFIX = "/api/sga"


# =========================================================
# ROUTES
# =========================================================

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(usuario_router, prefix=API_PREFIX)
app.include_router(cliente_router, prefix=API_PREFIX)
app.include_router(producto_router, prefix=API_PREFIX)
app.include_router(inventario_router, prefix=API_PREFIX)
app.include_router(alquiler_router, prefix=API_PREFIX)
app.include_router(detalle_alquiler_router, prefix=API_PREFIX)
app.include_router(renovaciones_router, prefix=API_PREFIX)
app.include_router(gastos_router, prefix=API_PREFIX)


# =========================================================
# INICIO
# =========================================================

@app.get("/")
def inicio():

    return {
        "status": True,
        "mensaje": "API SGA funcionando",
        "data": {
            "version": "2.0.0",
            "api": API_PREFIX
        },
        "error": None,
        "code": 200
    }
