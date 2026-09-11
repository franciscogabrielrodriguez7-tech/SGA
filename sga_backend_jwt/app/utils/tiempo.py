"""
tiempo.py
---------
Única fuente de verdad para toda la lógica temporal del proyecto.
Tanto el SQL (ver FECHA_VENCIMIENTO_SQL, que se inserta literalmente
en las consultas) como Python (ver enriquecer_temporal) usan la MISMA
fórmula, para que nunca puedan desincronizarse.

FÓRMULA (decisión de diseño, flagged explícitamente a Gabriel):
    fecha_vencimiento = fecha_inicio + (tiempo_alquiler_dias - 1) días

El nuevo esquema unificó el tiempo de alquiler a días
(tiempo_alquiler_dias) para ganar flexibilidad frente al esquema
anterior, que lo manejaba en semanas. Se conserva aquí el mismo
principio ya validado antes para la fórmula semanal (fecha_inicio +
(tiempo*7 - 1)): el día de inicio cuenta como el primer día del
alquiler, así que un alquiler de N días que empieza el día X vence el
día X + (N - 1), no X + N. Ejemplo: inicio 01/09, tiempo = 15 días ->
vencimiento = 15/09 (no 16/09).

Zona horaria: America/Bogota, centralizada aquí en
`fecha_actual_bogota()` — ningún otro archivo debe llamar
`date.today()` o `datetime.now()` directamente.
"""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

ZONA_BOGOTA = ZoneInfo("America/Bogota")

# ----------------------------------------------------------------------------
# Fórmula SQL (se inserta literalmente en las consultas de
# alquiler_controller.py). Se expone en dos formas: con alias "a." (para
# los SELECT con JOIN) y sin alias (para el UPDATE del scheduler), ambas
# generadas desde la MISMA plantilla para que nunca diverjan.
# ----------------------------------------------------------------------------


def _plantilla_fecha_vencimiento(prefijo: str = "") -> str:
    return (
        f"({prefijo}fecha_inicio + ({prefijo}tiempo_alquiler_dias - 1) "
        "* INTERVAL '1 day')::date"
    )


FECHA_VENCIMIENTO_SQL = _plantilla_fecha_vencimiento("a.")
FECHA_VENCIMIENTO_SQL_SIN_ALIAS = _plantilla_fecha_vencimiento("")


def fecha_actual_bogota() -> date:
    """Único punto del proyecto donde se obtiene la fecha 'de hoy'."""
    return datetime.now(ZONA_BOGOTA).date()


def fecha_vencimiento(fecha_inicio: date, tiempo_alquiler_dias: int) -> date:
    """Misma fórmula que FECHA_VENCIMIENTO_SQL, en Python."""
    return fecha_inicio + timedelta(days=(tiempo_alquiler_dias - 1))


def enriquecer_temporal(alquiler: dict) -> dict:
    """
    Agrega a un dict de alquiler (ya con 'fecha_vencimiento' calculada
    por SQL) los campos derivados: dias_restantes, dias_vencido,
    vence_hoy, inicio_pendiente.

    Reglas:
    - pendiente / recogido / terminado / cancelado: fecha_vencimiento se
      deja (ya viene calculada), pero NO se calculan dias_restantes ni
      dias_vencido (no aplican fuera de un ciclo activo).
    - activo:
        * si hoy < fecha_inicio -> inicio_pendiente = True
        * si hoy < fecha_vencimiento -> dias_restantes = vencimiento - hoy
        * si hoy == fecha_vencimiento -> vence_hoy = True, dias_restantes = 0
        * si hoy > fecha_vencimiento -> se reporta dias_vencido igualmente,
          para que la respuesta nunca mienta aunque el scheduler no haya
          corrido todavía ese día.
    - vencido: se calcula dias_vencido siempre.
    """

    hoy = fecha_actual_bogota()

    venc = alquiler["fecha_vencimiento"]
    if isinstance(venc, str):
        venc = date.fromisoformat(venc)

    inicio = alquiler["fecha_inicio"]
    if isinstance(inicio, str):
        inicio = date.fromisoformat(inicio)

    alquiler["dias_restantes"] = None
    alquiler["dias_vencido"] = None
    alquiler["vence_hoy"] = False
    alquiler["inicio_pendiente"] = False

    estado = alquiler.get("estado_alquiler")

    if estado == "activo":

        if hoy < inicio:
            alquiler["inicio_pendiente"] = True

        if hoy < venc:
            alquiler["dias_restantes"] = (venc - hoy).days
        elif hoy == venc:
            alquiler["vence_hoy"] = True
            alquiler["dias_restantes"] = 0
        else:
            alquiler["dias_vencido"] = (hoy - venc).days

    elif estado == "vencido":
        alquiler["dias_vencido"] = max((hoy - venc).days, 0)

    return alquiler


def calcula_nueva_fecha_vencimiento_tras_reduccion(
    fecha_inicio: date, tiempo_nuevo_dias: int
) -> date:
    """Helper explícito para la validación de reducción de tiempo."""
    return fecha_vencimiento(fecha_inicio, tiempo_nuevo_dias)
