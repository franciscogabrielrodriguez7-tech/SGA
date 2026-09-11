"""
unidades.py
------------
Única fuente de verdad para la jerarquía de unidades de alquiler de un
producto (DIA < SEMANA < MES) y su conversión a días — la única unidad
que persiste alquiler.tiempo_alquiler_dias (ver app/utils/tiempo.py).

REGLA DE NEGOCIO (unidad_minima_alquiler de producto):
    Un producto puede alquilarse con su unidad mínima o una superior,
    nunca una inferior. precio_base_producto se interpreta siempre
    "por" esa unidad (ej. unidad_minima_alquiler='SEMANA' implica que
    precio_base_producto es un precio semanal).

CONVENCIÓN COMERCIAL (flagged explícitamente a Gabriel):
    1 semana = 7 días
    1 mes    = 30 días (no el mes calendario real)

Esto significa que tiempo_alquiler_dias, para que sea válido con un
producto que exige SEMANA o MES, debe ser múltiplo de 7 o de 30
respectivamente — de lo contrario se estaría prorrateando una unidad
comercial en fracciones, que es precisamente lo que se quiere evitar
(ver validar_tiempo_alquiler_para_productos).
"""

UNIDADES_VALIDAS = ("DIA", "SEMANA", "MES")

# Jerarquía DIA < SEMANA < MES, usada para "unidad seleccionada >= unidad mínima".
ORDEN_UNIDAD = {"DIA": 0, "SEMANA": 1, "MES": 2}

DIAS_POR_UNIDAD = {"DIA": 1, "SEMANA": 7, "MES": 30}


def unidad_mas_restrictiva(unidades: list[str]) -> str:
    """De una lista de unidad_minima_alquiler (una por producto en el
    carrito), retorna la más restrictiva (la de mayor jerarquía)."""
    if not unidades:
        return "DIA"
    return max(unidades, key=lambda u: ORDEN_UNIDAD.get(u, 0))


def validar_tiempo_alquiler_para_productos(
    tiempo_alquiler_dias: int, unidades_minimas: list[str]
) -> None:
    """
    Valida que tiempo_alquiler_dias sea compatible con TODOS los
    productos del alquiler (autoridad real de la regla de negocio,
    independiente de lo que haya restringido la UI). Lanza ValueError
    con un mensaje de negocio legible si no lo es.

    - Si algún producto exige MES: tiempo_alquiler_dias debe ser
      múltiplo de 30 (mínimo 30).
    - Si algún producto exige SEMANA (y ninguno MES): múltiplo de 7
      (mínimo 7).
    - Si todos son DIA: cualquier entero positivo es válido (ya
      garantizado por el schema, gt=0).
    """

    restrictiva = unidad_mas_restrictiva(unidades_minimas)

    if restrictiva == "MES" and tiempo_alquiler_dias % 30 != 0:
        raise ValueError(
            "Uno de los productos de este alquiler solo puede alquilarse "
            "por mes (múltiplos de 30 días). Ajusta el tiempo de alquiler."
        )

    if restrictiva == "SEMANA" and tiempo_alquiler_dias % 7 != 0:
        raise ValueError(
            "Uno de los productos de este alquiler solo puede alquilarse "
            "por semana o mes (múltiplos de 7 días). Ajusta el tiempo de "
            "alquiler."
        )
