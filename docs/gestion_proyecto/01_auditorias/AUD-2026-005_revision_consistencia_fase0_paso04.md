# AUD-2026-005 — Revisión de consistencia · Fase 0, paso 0.4 (entrega histórica de OpenCode)

> **Origen:** primera revisión de consistencia del inventario del paso 0.4, entregada íntegra por OpenCode tras la entrega original (AUD-2026-004), conservada como entregable histórico a autorización expresa del usuario.
> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git` · **Fuente de verdad:** `C:\Users\Acer\Documents\Default Project\SGA_repo\SGA`
> **Rama:** `dev` · **Commit (HEAD) de la línea base analizada:** `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c`
> **Fecha de la entrega:** 2026-10-30 · **Modo:** solo lectura (análisis; sin ejecución, sin escritura)
> **Advertencia de integridad:** el cuerpo reproduce la entrega **tal como se entregó en chat**, incluidos los errores corregidos posteriormente en AUD-2026-006 (recuento de identificadores "122", frase descriptiva de los 83 elementos con doble mención de refutaciones, resumen P con "21 con propuesta C"). **No corregir retroactivamente**: las correcciones se aplican en `EVD-2026-003` conforme a `AUD-2026-006`.

---

# SGA — FASE 0, PASO 0.4: REVISIÓN DE CONSISTENCIA DEL INVENTARIO

Verificaciones completadas (solo lectura). Entrego la revisión de consistencia.

---

## 1. Inconsistencias confirmadas

| # | Inconsistencia | Evidencia de la corrección |
|---|---|---|
| **INC-1** | El resumen ejecutivo declara **92 elementos (I-001…I-092)**; las matrices entregadas contienen **91** (B-1: 10 · B-2: 12 · B-3: 12 · B-4: 9 · B-5: 22 · B-6: 4 · B-7: 11 · B-8: 11 = 91; último ID = I-091) | Recuento manual de las matrices. **No hay elemento omitido ni duplicado**: es un error aritmético del resumen, no un faltante. No se crea I-092. |
| **INC-2** | **I-017 (C-14)** se clasificó como "Probable / pendiente de determinar" y se pidió "verificar versión instalada/parametrización" | `EVD-2026-002` (ya corregido en el repositorio, §9.1) refuta la afirmación histórica de sobrescritura con evidencia estática: `settings.py:3,6` (`load_dotenv()` sin `override=True`), `requirements.txt:18` (`python-dotenv==1.2.3`) y el código de la biblioteca (`venv/.../dotenv/main.py:97-110, 388-395`, `override=False` por defecto, preserva `os.environ`). Pedir de nuevo esa comprobación duplica un trabajo ya realizado y aprobado. |
| **INC-3** | Recuentos globales declarados: "110 verificados · 2 probables · 12 no verificados" | Suman 124, que no coincide con 130 (IDs) ni con 91 (elementos): **unidades de conteo mezcladas** y aritmética inconsistente. |
| **INC-4** | Sección F.2: "Pendiente desde 0.3: registrar EVD-2026-002 en `00_indice.md`" | **Obsoleto**: `00_indice.md:118` ya registra EVD-2026-002 en la tabla de evidencias. No debe proponerse de nuevo. |
| **INC-5** | **I-018 (P-08)** se rotuló como "defecto" con prioridad "Medio→Medio" | Es comportamiento técnico comprobado de la consulta + propuesta de regla de negocio **no aprobada** ("el resumen *debe* incluir solo GASTO" no está en ningún requisito aprobado). No es un defecto per se. |
| **INC-6** | Prioridades "Alto" propuestas para **I-051 (facturación)**, **I-052 (IVA/descuentos)** e implícitamente **I-062/I-063/I-065** | Heredadas del impacto del DXC sin evidencia de que la funcionalidad pertenezca al alcance. `03_decisiones/`, `05_roadmap/` y `02_consultas_tecnicas/` están **vacíos**; no existe ningún archivo `DEC-*`. No hay requisitos aprobados que justifiquen esas prioridades propuestas. |
| **INC-7** | La sección D presentó 25 decisiones sin distinguir su estado de aprobación | Misma evidencia: ninguna decisión funcional está aprobada; todas son propuestas o determinaciones de alcance pendientes. |

## 2. Correcciones justificadas

1. **Cantidad de elementos: 91, no 92.** Rango correcto I-001…I-091. Numeración contigua, sin duplicados, sin omisiones.
2. **C-14/I-017 reclasificado** conforme al estado aprobado del paso 0.3 (ver §5 más abajo).
3. **Recuentos reconstruidos** con unidades separadas (ver §3).
4. **F.2 corregido**: EVD-2026-002 ya está registrado; el único ajuste pendiente de `00_indice.md` es agregar el futuro documento del inventario (cuando se apruebe).
5. **I-018 (P-08)**: naturaleza corregida a "comportamiento técnico comprobado + propuesta de regla no aprobada"; prioridad propuesta retirada hasta determinar la regla de negocio.
6. **I-051, I-052, I-053, I-054, I-062…I-065**: las prioridades propuestas pasan a **"condicionadas a determinación de alcance"**; se conserva la prioridad original del DXC como referencia histórica.
7. **Sección D**: se añade a cada decisión su clasificación A/B/C/D (ver §6).

## 3. Recuentos corregidos

### 3.1 Por unidad de conteo (sin mezclar)

| Unidad | Cantidad | Nota |
|---|---|---|
| Identificadores originales | **130** | F-49 + R-16 + S-10 + H-14 + C-15 + P-26 |
| — del paso 0.3 | 116 | Base aprobada |
| — incorporados en 0.4 (P-13…P-26) | 14 | Ampliación de alcance |
| Elementos consolidados | **91** | I-001…I-091 (corregido desde 92) |

### 3.2 Certeza sobre los 91 elementos

| Estado | Elementos | Detalle |
|---|---|---|
| Verificado | **83** | Incluye las 2 refutaciones verificadas contadas aparte abajo como estado propio |
| Probable | **1** | I-016 (R-02: arranque Alembic vs BD por SQL — requiere runtime) |
| No verificado | **4** | I-066 (F-46), I-067 (F-47), I-068 (F-14 sub-afirmación), I-069 (C-13) |
| Refutado | **2** | I-089 (P-07), I-090 (H-06) |
| Mixto | **1** | I-017 (C-14: verificado en código / refutado en sobrescritura / no verificado en despliegue) |
| **Total** | **91** | |

### 3.3 Certeza sobre los 130 identificadores

| Estado | IDs | Detalle |
|---|---|---|
| Verificado | **122** | 109 de la base de 0.3 (tras revalidaciones de 0.4) + 14 nuevos P-13…P-26 (hueco verificado) |
| Probable | **1** | R-02 |
| No verificado | **4** | F-46, F-47, C-13, F-14 (sub-afirmación) |
| Refutado | **2** | P-07, H-06 |
| Mixto | **1** | C-14 |
| **Total** | **130** | |

**Coherencia con EVD-2026-002 (paso 0.3):** 100 verificados / 1 probable / 15 no verificados sobre 116 IDs. Las 12 revalidaciones de 0.4 (H-03, H-06→refutado, H-09, H-12, C-04, C-07, P-07→refutado, P-08…P-12) retiran 12 IDs de "no verificado" (15 − 12 = 3: F-46, F-47, C-13; F-14 ya contado con sub-afirmación pendiente) y R-02 permanece probable. La cadena cuadra exactamente.

### 3.4 Por naturaleza (dimensión independiente de la certeza)

| Naturaleza | Elementos |
|---|---|
| Decisión que requiere validación del usuario/negocio | **22** (I-044…I-065) + componentes de decisión en I-034, I-035, I-043 = **25 filas de decisión** |
| Verificación pendiente (elemento dedicado) | **4** (I-066…I-069) + verificaciones de runtime ligadas a I-001, I-014, I-016, I-017-despliegue, I-031 |
| Defecto/riesgo/deuda/documental/fortaleza/histórico | el resto de las matrices B-1…B-4, B-7, B-8 |

## 4. Inventario y trazabilidad corregidos (solo partes afectadas)

### 4.1 Fila I-017 reemplazada

| ID | Orig. | Nombre | Naturaleza | Certeza | Vigencia | Prioridad | Evidencia | Impacto | Acción pendiente | Deps. | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **I-017** | C-14 | Carga de `.env` por `python-dotenv`: hecho en código verificado; afirmación histórica de sobrescritura **refutada**; comportamiento de despliegue real no verificado | Verificación (hecho técnico) + componente histórico refutado | Verificado (código) / **Refutado** (sobrescritura) / No verificado (despliegue real) | Afirmación histórica: **Refutado** · Despliegue: **Pendiente de determinar** | Sin prioridad (afirmación refutada); verificación de despliegue = P3 | `settings.py:3,6`; `requirements.txt:18` (`python-dotenv==1.2.3`); `dotenv/main.py:97-110,388-395` (`override=False` preserva `os.environ`); `.dockerignore:15-17` | Ninguno en código actual: un `.env` colado solo poblaría variables ausentes | Únicamente: verificación en ejecución del entorno de despliegue cuando se autorice (acción menor) | — | Corrige la fila entregada en 0.4; alineada con EVD-2026-002 §9.1 |

### 4.2 Notas de corrección sobre filas existentes (sin rehacerlas)

- **I-018 (P-08):** naturaleza = "comportamiento técnico comprobado (la suma semanal incluye `ENTREGA`/`RECOGIDA`) + propuesta de regla no aprobada". No es defecto: la regla deseada (qué debe incluir el resumen) no está aprobada.
- **I-051 (P-10), I-052 (P-11), I-053 (P-12), I-054 (P-13), I-062 (P-23), I-063 (P-24), I-065 (P-26):** la prioridad propuesta queda **condicionada a la determinación de alcance**; se conserva la etiqueta de impacto del DXC solo como procedencia histórica.
- **Trazabilidad (§C):** sin cambios estructurales; solo la anotación de estado de C-14 → I-017 (mixto/refutado en sobrescritura) y de P-07/H-06 ya marcados como refutados.

Todo lo demás del inventario (matrices B-1, B-3, B-4, B-7, B-8 y el resto de B-2, B-5, B-6) queda **intacto**.

## 5. Estado final de C-14

**C-14 (I-017), conforme a la corrección aprobada del paso 0.3 y verificada hoy en EVD-2026-002 §9.1:**

1. **Hecho en código — Verificado:** `load_dotenv()` se invoca sin `override=True` (`settings.py:3,6`); `.dockerignore` excluye `.env` de la imagen.
2. **Comportamiento de la biblioteca — Verificado:** `python-dotenv==1.2.3` usa `override=False` por defecto y preserva las variables ya presentes en `os.environ`.
3. **Afirmación histórica de sobrescritura ("sobrescribe variables del panel") — Refutada.** No es "probable". No se solicita comprobación adicional: ya se realizó en el paso 0.3.
4. **Comportamiento en despliegue real — No verificado en ejecución** (único componente pendiente; verificación menor, condicionada a autorización de runtime).

## 6. Clasificación de decisiones funcionales (P-01…P-26)

Evidencia de contexto: `03_decisiones/`, `05_roadmap/` y `02_consultas_tecnicas/` están **vacíos**; no existe ningún `DEC-*`. **Conclusión: la categoría B (requisito aprobado y no implementado) está vacía para todo el conjunto P.** Todos los P tienen dos componentes: (A) un comportamiento técnico comprobado y (C) una propuesta de mejora no aprobada. La diferencia entre C y D es si la pertenencia al alcance está indeterminada.

| ID | Elem. | Clasificación | Comentario |
|---|---|---|---|
| P-01 | I-044 | A + C | `min_length=4` comprobado; la política de contraseñas es propuesta |
| P-02 | I-045 | A + C | Sin rotación comprobado; el procedimiento es propuesta |
| P-03 | I-046 | A + C | Ausencia de blacklist comprobada; el modelo de sesión es propuesta |
| P-04 | I-047 | A + C | Reapertura solo por SQL comprobada; el procedimiento es propuesta (la consola SQL puede ser un procedimiento legítimo, no un defecto) |
| P-05 | I-048 | A + C | RBAC actual comprobado y correcto según diseño; cambiarlo es propuesta |
| P-06 | I-049 | A + C | Ídem |
| P-07 | I-089 | **Refutado** | La incoherencia citada ya no existe (ambas rutas `STAFF_INTERNO`) |
| P-08 | I-018 | A + C | Comportamiento de la consulta comprobado; la regla deseada es propuesta |
| P-09 | I-050 | A + C | Esquema comprobado; el modelo de depósito es propuesta |
| P-10 | I-051 | A + **D** | Ausencia de entidad fiscal comprobada; **si el SGA debe facturar está sin determinar** (no asumir facturación electrónica) |
| P-11 | I-052 | A + **D** | Ausencia comprobada; IVA/descuentos pueden estar fuera de alcance o ser obligación legal — sin evidencia |
| P-12 | I-053 | A + **D** | Renovación manual comprobada; los recargos son propuesta cuya pertenencia al alcance no está determinada |
| P-13 | I-054 | A + C | Solo `stock_total`/`stock_alquilado` comprobado; conteo cíclico/merma es propuesta |
| P-14 | I-055 | A + C | Días calendario comprobado; el calendario laboral es propuesta |
| P-15 | I-019 | A + C | Tarifa hardcodeada en cliente comprobada (riesgo técnico real: precio no validado server-side); parametrizar es propuesta |
| P-16 | I-056 | A + C | Trigger que impide borrar con stock en obra comprobado (regla aprobada RN-AUD-15, implementada); el flujo alternativo de baja es propuesta |
| P-17 | I-057 | A + C | Sin retención comprobado; la política de ciclo de vida es propuesta |
| P-18 | I-058 | A + C | Sin `FOR UPDATE` comprobado; la política de concurrencia es propuesta |
| P-19 | I-059 | A + C | Sin trazabilidad de denegaciones comprobada; registrarla es propuesta de baja prioridad |
| P-20 | I-060 | A + C | Sin OpenAPI comprobado; el versionado es propuesta técnica no aprobada |
| P-21 | I-061 | A + C | Sin runbook comprobado; redactarlos es propuesta |
| P-22 | I-020 | A + C | Hardcodeo `2` días comprobado; hacerlo configurable es propuesta |
| P-23 | I-062 | A + C | SERIAL técnico comprobado; la numeración comercial es propuesta |
| P-24 | I-063 | A + **D** | Ausencia de dimensión de sede comprobada; **multisucursal sin determinar en alcance** (no asumir) |
| P-25 | I-064 | A + C | `VARCHAR(100)` libre comprobado; el catálogo es propuesta |
| P-26 | I-065 | A + **D** | Enum comprobado; las reglas fiscales por tipo de documento dependen de la determinación de alcance de facturación |

**Resumen:** 0 elementos en B · 26 con componente A comprobado · 21 con propuesta C · 5 con alcance D sin determinar (P-10, P-11, P-12, P-24, P-26) · 1 refutado (P-07). Ninguna ausencia de implementación se convierte en defecto; ninguna funcionalidad se asume necesaria.

## 7. Confirmación de trazabilidad

- **130/130 identificadores con trazabilidad** hacia un elemento consolidado existente (verificado uno por uno: F-01…F-49 → todos mapeados; R-01…R-16 → todos; S-01…S-10 → todos; H-01…H-14 → todos; C-01…C-15 → todos; P-01…P-26 → todos).
- **91 elementos, cada uno con ≥1 identificador origen**; ningún ID mapea a dos elementos y ningún elemento carece de ID origen.
- **Ningún identificador quedó sin trazabilidad tras las correcciones** (las correcciones afectan estado/prioridad/naturaleza, no la asignación).

---

**Estado:** revisión de consistencia entregada en chat. Paso 0.4 **no marcado como completado**. No se modificó ningún archivo, código, Git ni documentación (operaciones realizadas: solo lectura de `EVD-2026-002`, `00_indice.md`, `AGENTS.md` y listado de carpetas). Quedo a la espera de su aprobación para que Antigravity registre el inventario corregido (91 elementos, C-14 alineado, recuentos reconstruidos) y el correspondiente ajuste del `00_indice.md` (únicamente con el nuevo documento del inventario, ya que EVD-2026-002 ya figura en el índice).
