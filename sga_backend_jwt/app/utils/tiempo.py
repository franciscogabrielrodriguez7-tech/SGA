"""
tiempo.py
---------
NUEVO. Antes, la fórmula de fecha_vencimiento estaba hardcodeada en SQL
dentro de alquiler_controller.py (`fecha_inicio + tiempo*7 dias`), sin
zona horaria explícita, y no existía NINGÚN cálculo de dias_restantes,
dias_vencido, vence_hoy o inicio_pendiente en ninguna parte del código.

Este módulo es la ÚNICA fuente de verdad para toda la lógica temporal
del proyecto. Tanto el SQL (ver FECHA_VENCIMIENTO_SQL, que se inserta
literalmente en las consultas) como Python (ver enriquecer_temporal)
usan la MISMA fórmula, para que nunca puedan desincronizarse.

FÓRMULA (corregida, roadmap sección 11):
    fecha_vencimiento = fecha_inicio + (tiempo_alquiler * 7 - 1) días

Ejemplo: inicio 01/09, tiempo = 1 semana -> vencimiento = 07/09
(NO 08/09, que es lo que daba la fórmula anterior: fecha_inicio + tiempo*7).

Zona horaria: America/Bogota (roadmap sección 13), centralizada aquí en
`fecha_actual_bogota()` — ningún otro archivo debe llamar
`date.today()` o `datetime.now()` directamente.
"""

from datetime import date, datetime
from zoneinfo import ZoneInfo

ZONA_BOGOTA = ZoneInfo("America/Bogota")

# ----------------------------------------------------------------------------
# Fórmula SQL (se inserta literalmente en las consultas de
# alquiler_controller.py). OJO: si esta fórmula cambia, también hay que
# actualizar la fórmula equivalente en fecha_vencimiento() más abajo.
#
# Se expone en dos formas: con alias "a." (para los SELECT con JOIN de
# alquiler_controller.py) y sin alias (para el UPDATE del scheduler),
# ambas generadas desde la MISMA plantilla para que nunca diverjan.
# ----------------------------------------------------------------------------

def _plantilla_fecha_vencimiento(prefijo: str = "") -> str:
    return (
        f"({prefijo}fecha_inicio + ({prefijo}tiempo_alquiler * 7 - 1) "
        "* INTERVAL '1 day')::date"
    )


FECHA_VENCIMIENTO_SQL = _plantilla_fecha_vencimiento("a.")
FECHA_VENCIMIENTO_SQL_SIN_ALIAS = _plantilla_fecha_vencimiento("")


def fecha_actual_bogota() -> date:
    """Único punto del proyecto donde se obtiene la fecha 'de hoy'."""
    return datetime.now(ZONA_BOGOTA).date()


def fecha_vencimiento(fecha_inicio: date, tiempo_alquiler: int) -> date:
    """Misma fórmula que FECHA_VENCIMIENTO_SQL, en Python."""
    from datetime import timedelta
    return fecha_inicio + timedelta(days=(tiempo_alquiler * 7 - 1))


def enriquecer_temporal(alquiler: dict) -> dict:
    """
    Agrega a un dict de alquiler (ya con 'fecha_vencimiento' calculada
    por SQL) los campos derivados: dias_restantes, dias_vencido,
    vence_hoy, inicio_pendiente.

    Reglas (roadmap sección 14):
    - pendiente / recogido / terminado / cancelado: fecha_vencimiento se
      deja (ya viene calculada), pero NO se calculan dias_restantes ni
      dias_vencido (no aplican fuera de un ciclo activo).
    - activo:
        * si hoy < fecha_inicio -> inicio_pendiente = True
        * si hoy < fecha_vencimiento -> dias_restantes = vencimiento - hoy
        * si hoy == fecha_vencimiento -> vence_hoy = True, dias_restantes = 0
        * si hoy > fecha_vencimiento -> (el alquiler debería estar
          'vencido'; ver verificar_y_actualizar_vencidos). Si por
          cualquier motivo se consulta en ese instante intermedio, se
          reporta dias_vencido igualmente, para que la respuesta nunca
          mienta aunque el UPDATE del scheduler no haya corrido todavía.
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
    fecha_inicio: date, tiempo_nuevo: int
) -> date:
    """Helper explícito para la validación de reducción de tiempo (sección 19)."""
    return fecha_vencimiento(fecha_inicio, tiempo_nuevo)
