from typing import Any, Optional

from datetime import date, datetime, time

from decimal import Decimal

from fastapi.responses import JSONResponse


# =========================================================
# CONVERTIR DATOS A FORMATO JSON
# =========================================================

def convertir_json(data: Any):

    if isinstance(data, dict):
        return {
            key: convertir_json(value)
            for key, value in data.items()
        }

    if isinstance(data, (list, tuple)):
        return [
            convertir_json(item)
            for item in data
        ]

    if isinstance(data, (datetime, date, time)):
        return data.isoformat()

    if isinstance(data, Decimal):
        return float(data)

    return data


# =========================================================
# RESPUESTA EXITOSA
# =========================================================

def response_success(
    mensaje: str,
    data: Any = None,
    code: int = 200
):

    return JSONResponse(
        status_code=code,
        content={
            "status": True,
            "mensaje": mensaje,
            "data": convertir_json(data),
            "error": None,
            "code": code
        }
    )


# =========================================================
# RESPUESTA DE ERROR
# =========================================================

def response_error(
    mensaje: str,
    error: Optional[str] = None,
    code: int = 400,
    data: Any = None
):

    return JSONResponse(
        status_code=code,
        content={
            "status": False,
            "mensaje": mensaje,
            "data": convertir_json(data),
            "error": error,
            "code": code
        }
    )
