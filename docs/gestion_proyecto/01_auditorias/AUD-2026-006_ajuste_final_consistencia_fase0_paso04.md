# AUD-2026-006 — Ajuste final de consistencia · Fase 0, paso 0.4 (entrega histórica de OpenCode)

> **Origen:** ajuste final de consistencia del inventario del paso 0.4, entregado íntegro por OpenCode tras AUD-2026-005, conservado como entregable histórico a autorización expresa del usuario.
> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git` · **Fuente de verdad:** `C:\Users\Acer\Documents\Default Project\SGA_repo\SGA`
> **Rama:** `dev` · **Commit (HEAD) de la línea base analizada:** `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c`
> **Fecha de la entrega:** 2026-10-30 · **Modo:** solo lectura (análisis; sin ejecución, sin escritura)
> **Nota de ensamblaje:** esta entrega se transmitió en el chat en **tres turnos** debido a interrupciones del canal. El texto íntegro se conserva aquí **en orden y sin alteraciones**: se incluyen las frases de transición entre turnos tal como se pronunciaron ("Continúo desde S-4…", "Completo S-6 y cierre la entrega.") y el cuerpo completo de cada fragmento, incluida la continuación final de S-6.

---

# SGA — FASE 0, PASO 0.4: AJUSTE FINAL DE CONSISTENCIA

Ejecuto el recuento reconstruido y entrego el ajuste final. Solo lectura; sin cambios en archivos, Git ni código.

## 1. Recuento definitivo de los 130 identificadores

**Método:** partir de la clasificación corregida y aprobada de EVD-2026-002 (116 IDs: 100 verificados · 1 probable · 15 no verificados, con C-14 contado dentro de los 100 "verificado en código"), aplicar los 12 cambios de estado que el paso 0.4 aportó con evidencia, extraer C-14 a la categoría propia "mixto" y añadir los 14 IDs nuevos P-13…P-26 (hueco verificado en todos).

| Estado (mutuamente excluyente) | Cantidad | Detalle |
|---|---|---|
| **Verificado** | **123** | 109 de la base de 0.3 (99 verificados tras extraer C-14 + 10 revalidados en 0.4: H-03, H-09, H-12, C-04, C-07, P-08, P-09, P-10, P-11, P-12) + 14 nuevos P-13…P-26 |
| **Probable** | **1** | R-02 (arranque Alembic vs BD por SQL) |
| **No verificado** | **3** | F-46, F-47, C-13 |
| **Refutado** | **2** | H-06, P-07 |
| **Mixto** | **1** | C-14 (verificado en código / refutado en sobrescritura / no verificado en despliegue) |
| **Total** | **130** | |

**La distribución propuesta (123 / 1 / 3 / 2 / 1) es correcta.** El "122" anterior era erróneo: la frase "109 + 14" suma 123. F-14 se cuenta **una sola vez** como verificado (su condición histórica está verificada); su sub-verificación de ejecución (lint/build) es una acción pendiente dentro del elemento I-068, no un segundo identificador. Comprobación de cierre: 123 + 1 + 3 + 2 + 1 = 130. ✓

## 2. Recuento definitivo de P-01…P-26

**Método:** clasificar cada P según (i) estado de la afirmación y (ii) origen de la regla. Distinguir **aprobación de reglas existentes** (las RN-AUD-* documentadas en DXC-2026-005 §7, ya aprobadas e implementadas en código/BD) de **aprobación de propuestas nuevas** (§8, cuyo encabezado declara expresamente que "deben ser validadas por el responsable del negocio antes de implementarse"). La ausencia de archivos `DEC-*` no se usa como argumento único.

| Clasificación | Cantidad | IDs |
|---|---|---|
| **C — propuesta nueva no aprobada** | **20** | P-01, P-02, P-03, P-04, P-05, P-06, P-08, P-09, P-13, P-14, P-15, P-16, P-17, P-18, P-19, P-20, P-21, P-22, P-23, P-25 |
| **D — pertenencia al alcance sin determinar** | **5** | P-10 (facturación), P-11 (IVA/descuentos), P-12 (recargos), P-24 (multisucursal), P-26 (reglas por tipo de documento) |
| **Refutado** | **1** | P-07 |
| **Total** | **26** | |

**La distribución propuesta (20 / 5 / 1) es correcta.** El resumen anterior decía "21 con propuesta C" — error aritmético; 26 − 5 − 1 = 20.

**Matiz de aprobación (corrección conceptual):** ninguna RN-AUD-* aprobada convierte una propuesta P en requisito aprobado (categoría B = 0). Pero algunas propuestas C **se anclan en reglas existentes aprobadas**, lo que debe declararse:
- **P-16** se origina en la regla **aprobada RN-AUD-15** (prohibición de borrar producto con stock en obra, ya implementada en los triggers `02_funciones_y_triggers.sql:84,216`); lo pendiente es la propuesta de flujo alternativo de baja.
- **P-05, P-06** operan sobre el marco RBAC aprobado (RN-AUD-* de roles); lo pendiente es la propuesta de ampliar/limitar alcance.
- **P-01** choca con el hecho aprobado-implícito del seed (credenciales compartidas ya saneadas como hallazgo); la política en sí sigue sin aprobar.

## 3. Recuento definitivo de la certeza de los 91 elementos

**Método:** recuento directo de las filas de las matrices B-1…B-8, con cinco estados mutuamente excluyentes y sin doble conteo.

| Estado | Elementos | Detalle |
|---|---|---|
| **Verificado** (sin condición residual) | **83** | B-1 (10) + B-2 sin I-016/I-017 (10) + B-3 (12) + B-4 (9) + B-5 (22) + B-7 (11) + B-8 sin I-089/I-090 (9) |
| **Probable** | **1** | I-016 (R-02) |
| **No verificado** | **4** | I-066 (F-46), I-067 (F-47), I-068 (F-14 sub-verificación), I-069 (C-13) |
| **Refutado** | **2** | I-089 (P-07), I-090 (H-06) |
| **Mixto** | **1** | I-017 (C-14) |
| **Total** | **91** | |

83 es correcto como "verificado puro"; el error era solo la frase descriptiva que sugería doble pertenencia con las refutaciones. Cierre: 83 + 1 + 4 + 2 + 1 = 91. ✓

## 4. Frases y tablas exactas a sustituir

**S-1** — Reemplazo de la sección 3.3 de la última revisión (recuento por identificadores):

> ### 3.3 Certeza sobre los 130 identificadores (estados mutuamente excluyentes)
>
> | Estado | IDs | Detalle |
> |---|---|---|
> | Verificado | **123** | 99 de la base 0.3 (100 de EVD-2026-002 menos C-14, reclasificado como mixto) + 10 revalidados en 0.4 (H-03, H-09, H-12, C-04, C-07, P-08, P-09, P-10, P-11, P-12) + 14 nuevos P-13…P-26 |
> | Probable | **1** | R-02 |
> | No verificado | **3** | F-46, F-47, C-13 |
> | Refutado | **2** | H-06, P-07 |
> | Mixto | **1** | C-14 |
> | **Total** | **130** | |
>
> F-14 cuenta una sola vez como verificado; su sub-verificación de ejecución (lint/build) es una acción pendiente del elemento I-068, no un identificador adicional.

**S-2** — Reemplazo de la fila de certeza elemental (sección 3.2), eliminando la doble mención:

> ### 3.2 Certeza sobre los 91 elementos (estados mutuamente excluyentes)
>
> | Estado | Elementos | Detalle |
> |---|---|---|
> | Verificado | **83** | Condición verificada sin residual pendiente |
> | Probable | **1** | I-016 |
> | No verificado | **4** | I-066, I-067, I-068, I-069 |
> | Refutado | **2** | I-089, I-090 |
> | Mixto | **1** | I-017 |
> | **Total** | **91** | |

**S-3** — Reemplazo del resumen de la clasificación P (sección 6):

> **Resumen:** categoría B (requisito aprobado y no implementado) = **0** · **20** propuestas nuevas no aprobadas (C) · **5** casos con pertenencia al alcance sin determinar (D: P-10, P-11, P-12, P-24, P-26) · **1** refutado (P-07). Todas las RN-AUD-* están aprobadas e implementadas; ninguna aprueba las propuestas de §8. P-16 se ancla en la regla aprobada RN-AUD-15; P-05/P-06 en el marco RBAC aprobado — la aprobación de la regla existente no extiende a las propuestas nuevas.

**S-4** — Reemplazo del

Continúo desde S-4, que completa el bloque de frases exactas a sustituir.

**S-4** — Reemplazo de la frase del resumen ejecutivo (sección A del informe 0.4) que agregaba los recuentos globales:

> **Resultado global de certeza (estados mutuamente excluyentes):** sobre los 130 identificadores originales — **123 verificados · 1 probable (R-02) · 3 no verificados (F-46, F-47, C-13) · 2 refutados (H-06, P-07) · 1 mixto (C-14)**. Sobre los 91 elementos consolidados — **83 verificados · 1 probable · 4 no verificados · 2 refutados · 1 mixto**. Las 12 revalidaciones del paso 0.4 (H-03, H-06→refutado, H-09, H-12, C-04, C-07, P-07→refutado, P-08…P-12) y la reclasificación de C-14 conforme a EVD-2026-002 §9.1 explican la diferencia respecto al paso 0.3 (100/1/15 sobre 116 IDs).

**S-5** — Reemplazo de la frase del resumen ejecutivo que declaraba la cantidad de elementos:

> **91 elementos consolidados** (I-001…I-091) tras aplicar deduplicación solo con evidencia de equivalencia. (Sustituye a "92 elementos consolidados (I-001…I-092)"; no existe I-092 y no falta ningún elemento.)

**S-6** — Sustitución del encabezado de la sección 4.2 de la última revisión (notas sobre I-018 y prioridades condicionadas), para reflejar la corrección de la categoría C:

> **I-018 (P-08):** naturaleza = "comportamiento técnico comprobado (la suma semanal incluye `ENTREGA`/`RECOGIDA`) + propuesta de regla nueva no aprobada (C)". No es defecto: la regla deseada (qué debe incluir el resumen) no está aprobada. **I-051, I-052, I-053, I-063, I-065 (P-10, P-11, P-12, P-24, P-26):** pertenencia al alcance sin determinar (D); las prioridades propuestas quedan condicionadas y la etiqueta de impacto

Completo S-6 y cierre la entrega.

**S-6** (continuación) — Texto completo de sustitución de la sección 4.2 (notas de corrección sobre filas existentes):

> ### 4.2 Notas de corrección sobre filas existentes (sin rehacerlas)
>
> - **I-018 (P-08):** naturaleza = "comportamiento técnico comprobado (la suma semanal incluye `ENTREGA`/`RECOGIDA`) + propuesta de regla nueva no aprobada (C)". No es defecto: la regla deseada (qué debe incluir el resumen) no está aprobada. Prioridad: **sin proponer** hasta que el negocio defina la regla.
> - **I-051 (P-10), I-052 (P-11), I-053 (P-12), I-063 (P-24), I-065 (P-26):** clasificación **D** — pertenencia al alcance sin determinar; las prioridades propuestas quedan **condicionadas a la determinación de alcance** y la etiqueta de impacto del DXC se conserva solo como procedencia histórica.
> - **I-056 (P-16):** propuesta C **anclada en la regla aprobada RN-AUD-15** (prohibición de borrar producto con stock en obra, implementada en `02_funciones_y_triggers.sql:84,216`); la aprobación de esa regla existente no extiende al flujo alternativo de baja, que sigue sin aprobar.
> - **I-048 (P-05), I-049 (P-06):** propuestas C sobre el marco RBAC aprobado (RN-AUD-*); el comportamiento actual es diseño correcto, no defecto.
> - Todo lo demás del inventario (matrices B-1, B-3, B-4, B-5 salvo lo aquí anotado, B-6, B-7, B-8 y la sección 4.1 con la fila I-017) queda **intacto**.

---

## Confirmación final

- **Inventario:** no requiere otras modificaciones. Los 91 elementos (I-001…I-091) conservan su estructura; las únicas correcciones son las ya descritas: fila I-017 (C-14, conforme al paso 0.3), notas de la sección 4.2 (naturaleza de I-018, clasificación D condicionada de cinco elementos, ancla RN-AUD-15 en I-056) y los recuentos reconstruidos.
- **Trazabilidad:** no requiere modificaciones. 130/130 identificadores con asignación única a elemento; los cambios de estado (H-06, P-07 → refutados; C-14 → mixto) afectan a la columna de estado, no a la asignación; ningún ID duplicado ni huérfano.
- **C-14:** se mantiene conforme al paso 0.3 (verificado en código con `override=False` y `python-dotenv==1.2.3`; afirmación histórica de sobrescritura refutada; despliegue real no verificado en ejecución).
- **Operaciones realizadas:** exclusivamente de lectura y aritmética sobre datos ya verificados; sin modificación de archivos, Git ni código. Paso 0.4 **no marcado como completado**.

Con estos tres recuentos definitivos (123/1/3/2/1 identifiers · 20/5/1 proposiciones P · 83/1/4/2/1 elementos) el informe queda consistente y listo para que, tras su autorización, Antigravity registre el documento del inventario con las sustituciones S-1…S-6 aplicadas.
