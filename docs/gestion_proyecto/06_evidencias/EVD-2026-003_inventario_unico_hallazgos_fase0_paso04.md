# EVD-2026-003 — Inventario único consolidado de hallazgos y decisiones pendientes · Fase 0, paso 0.4

> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git`
> **Fuente de verdad:** `C:\Users\Acer\Documents\Default Project\SGA_repo\SGA`
> **Rama:** `dev`   **Commit (HEAD):** `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c`
> **Fecha de elaboración:** 2026-10-30   **Modo:** solo lectura (consolidación y registro documental)
> **Estado del informe:** inventario consolidado definitivo registrado en `06_evidencias/`; **pendiente de revisión y aprobación del usuario**
> **Fuentes integradas:** `AUD-2026-004` (inventario original de OpenCode), `AUD-2026-005` (primera revisión de consistencia), `AUD-2026-006` (ajuste final de consistencia con sustituciones `S-1` a `S-6`), `EVD-2026-002` (clasificación aprobada del paso 0.3 y resolución de `C-14`) y `00_indice.md`

---

## ÍNDICE

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Recuentos definitivos y explicación de unidades de conteo](#2-recuentos-definitivos-y-explicación-de-unidades-de-conteo)
3. [Inventario único consolidado (Matrices B-1 a B-8: elementos I-001 a I-091)](#3-inventario-único-consolidado-matrices-b-1-a-b-8-elementos-i-001-a-i-091)
4. [Tabla de trazabilidad completa (130 identificadores → 91 elementos)](#4-tabla-de-trazabilidad-completa-130-identificadores--91-elementos)
5. [Clasificación de propuestas funcionales (P-01 a P-26) y decisiones pendientes](#5-clasificación-de-propuestas-funcionales-p-01-a-p-26-y-decisiones-pendientes)
6. [Verificaciones pendientes](#6-verificaciones-pendientes)
7. [Estado definitivo de C-14 (I-017)](#7-estado-definitivo-de-c-14-i-017)
8. [Limitaciones y dependencias](#8-limitaciones-y-dependencias)
9. [Procedencia de la información y registro de correcciones aplicadas](#9-procedencia-de-la-información-y-registro-de-correcciones-aplicadas)
10. [Declaración de operaciones realizadas](#10-declaración-de-operaciones-realizadas)

---

## 1. Resumen ejecutivo

### 1.1 Estado del repositorio verificado

| Campo | Valor verificado |
|---|---|
| Raíz Git | `C:/Users/Acer/Documents/Default Project/SGA_repo/SGA` |
| Rama activa | `dev` — HEAD `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` |
| Árbol de trabajo | 0 archivos trackeados modificados; untracked: `?? AGENTS.md`, `?? docs/gestion_proyecto/` |
| Línea base | Idéntica a la verificada en los pasos 0.1 (`EVD-2026-001`), 0.2 (`AUD-2026-003`) y 0.3 (`EVD-2026-002`) → la evidencia estática de las auditorías y diagnósticos sigue siendo plenamente aplicable |

### 1.2 Fuentes consultadas

- **Gestión y auditorías previas:** `docs/gestion_proyecto/00_indice.md`; `AUD-2026-001`, `AUD-2026-002`, `AUD-2026-003`; `EVD-2026-001`, `EVD-2026-002`; diagnósticos `DXC-2026-001` a `DXC-2026-006`.
- **Entregables del paso 0.4 integrados:** `AUD-2026-004_inventario_original_fase0_paso04.md` (entrega inicial), `AUD-2026-005_revision_consistencia_fase0_paso04.md` (primera revisión de consistencia) y `AUD-2026-006_ajuste_final_consistencia_fase0_paso04.md` (ajuste final con sustituciones `S-1` a `S-6`).
- **Archivos del proyecto inspeccionados en solo lectura:** `database/01_esquema/01_tablas.sql`, `02_funciones_y_triggers.sql`, `04_plantillas.sql`; `sga_backend_jwt/entrypoint.sh`, `docker-compose.yml`, `Dockerfile`s, `nginx.conf`, `alembic/env.py`, `alembic.ini`, `app/config/settings.py`, `requirements.txt`, `venv/Lib/site-packages/dotenv/main.py`, rutas/controllers/esquemas backend; `sga_frontend_jwt/vite.config.ts`, `Dockerfile` frontend, interfaces y utilidades del frontend.

### 1.3 Alcance y síntesis del inventario consolidado (con sustituciones `S-4` y `S-5` aplicadas)

- **130 identificadores originales:** 116 provenientes del paso 0.3 (`49 F + 16 R + 10 S + 14 H + 15 C + 12 P`) + **14 nuevos `P-13`…`P-26`** (procedentes de `DXC-2026-005` §8) incorporados como ampliación de alcance del paso 0.4.
- **91 elementos consolidados (`I-001`…`I-091`)** tras aplicar deduplicación únicamente cuando existe evidencia comprobada de equivalencia (numeración continua del `I-001` al `I-091`, sin omisiones ni duplicados).
- **Revalidaciones ejecutadas en el paso 0.4:** 12 identificadores que en el paso 0.3 estaban pendientes de lectura puntual cambian de estado con evidencia verificada en el árbol `12760d4` (sin alterar retroactivamente `EVD-2026-002`): `H-03`, `H-09`, `H-12`, `C-04`, `C-07`, `P-08`, `P-09`, `P-10`, `P-11` y `P-12` pasan a **Verificado**; `H-06` y `P-07` pasan a **Refutado**.
- **Resultado global de certeza (estados mutuamente excluyentes):** sobre los **130 identificadores originales** — **123 verificados · 1 probable (`R-02`) · 3 no verificados (`F-46`, `F-47`, `C-13`) · 2 refutados (`H-06`, `P-07`) · 1 mixto (`C-14`)**. Sobre los **91 elementos consolidados** — **83 verificados · 1 probable (`I-016`) · 4 no verificados (`I-066`…`I-069`) · 2 refutados (`I-089`, `I-090`) · 1 mixto (`I-017`)**. Las 12 revalidaciones del paso 0.4 (`H-03`, `H-06`→refutado, `H-09`, `H-12`, `C-04`, `C-07`, `P-07`→refutado, `P-08`…`P-12`) y la reclasificación de `C-14` conforme a `EVD-2026-002` §9.1 explican la evolución respecto al paso 0.3 (`100/1/15` sobre 116 IDs).

---

## 2. Recuentos definitivos y explicación de unidades de conteo

### 2.1 Por qué existen tres unidades de conteo distintas

El inventario opera con tres unidades de medida complementarias que no deben mezclarse:

1. **Identificadores originales (`130`):** son las etiquetas individuales emitidas en las seis fuentes analíticas (`F-01`…`F-49` [49], `R-01`…`R-16` [16], `S-01`…`S-10` [10], `H-01`…`H-14` [14], `C-01`…`C-15` [15] y `P-01`…`P-26` [26]). Varios identificadores de distintas series describen la misma condición técnica subyacente (por ejemplo, `F-24` y `R-08` sobre las credenciales del seed, o `F-23`, `H-01`, `C-05` y `S-01` sobre CORS).
2. **Elementos consolidados (`91`, `I-001`…`I-091`):** son las unidades únicas del inventario tras fusionar por equivalencia demostrada los identificadores que refieren al mismo hecho técnico (reducción de `130` identificadores a `91` elementos únicos). Además, para el identificador `F-14`, su condición histórica en el directorio de auditoría ya está verificada (sin duplicar el identificador en el conteo de 130 IDs), mientras que la acción pendiente de comprobar el estado real de `lint`/`build` en ejecución constituye el elemento dedicado de verificación pendiente `I-068` dentro de la Matriz B-6 (razón por la cual hay **3** identificadores «No verificados» [`F-46`, `F-47`, `C-13`], pero **4** elementos «No verificados» [`I-066`, `I-067`, `I-068`, `I-069`]).
3. **Propuestas `P-01`…`P-26` (`26`):** constituyen un subconjunto de los 130 identificadores originales procedente de la sección de pendientes de negocio de `DXC-2026-005` (§8). En el conteo de certeza técnica (130 IDs), 25 de ellas tienen su **comportamiento técnico actual (`A`) verificado** y 1 está **refutada** (`P-07`); en cambio, en su clasificación funcional de negocio se evalúa el estado de aprobación y alcance de la **propuesta asociada (`C` o `D`)**, resultando en `20` propuestas nuevas no aprobadas (`C`), `5` de pertenencia al alcance sin determinar (`D`) y `1` refutada (`P-07`).

### 2.2 Resumen por unidad de conteo (sin mezclar)

| Unidad de conteo | Cantidad | Composición |
|---|---|---|
| **Identificadores originales** | **130** | `49 F + 16 R + 10 S + 14 H + 15 C + 26 P` (`116` de la base del paso 0.3 + `14` de la ampliación `P-13`…`P-26`) |
| **Elementos consolidados** | **91** | `I-001`…`I-091` distribuidos en las 8 matrices `B-1`…`B-8` (`10 + 12 + 12 + 9 + 22 + 4 + 11 + 11 = 91`) |
| **Propuestas `P-01`…`P-26`** | **26** | `12` evaluadas inicialmente en el paso 0.3 (`P-01`…`P-12`) + `14` incorporadas en el paso 0.4 (`P-13`…`P-26`) |

### 2.3 Certeza sobre los 130 identificadores (estados mutuamente excluyentes — `S-1`)

| Estado | IDs | Detalle |
|---|---|---|
| **Verificado** | **123** | 99 de la base 0.3 (100 de `EVD-2026-002` menos `C-14`, reclasificado como mixto) + 10 revalidados en 0.4 (`H-03`, `H-09`, `H-12`, `C-04`, `C-07`, `P-08`, `P-09`, `P-10`, `P-11`, `P-12`) + 14 nuevos `P-13`…`P-26` |
| **Probable** | **1** | `R-02` |
| **No verificado** | **3** | `F-46`, `F-47`, `C-13` |
| **Refutado** | **2** | `H-06`, `P-07` |
| **Mixto** | **1** | `C-14` (verificado en código / refutado en sobrescritura / no verificado en despliegue real) |
| **Total** | **130** | `123 + 1 + 3 + 2 + 1 = 130` |

> **Nota sobre `F-14`:** `F-14` cuenta una sola vez como **Verificado** (su condición histórica en el entorno de auditoría está verificada); su sub-verificación de ejecución (`lint`/`build`) es una acción pendiente representada en el elemento `I-068`, no un identificador adicional.

### 2.4 Certeza sobre los 91 elementos consolidados (estados mutuamente excluyentes — `S-2`)

| Estado | Elementos | Detalle |
|---|---|---|
| **Verificado** | **83** | Condición verificada sin residual pendiente (`B-1`: 10 · `B-2` sin `I-016`/`I-017`: 10 · `B-3`: 12 · `B-4`: 9 · `B-5`: 22 · `B-7`: 11 · `B-8` sin `I-089`/`I-090`: 9) |
| **Probable** | **1** | `I-016` (`R-02`: arranque Alembic vs BD inicializada por SQL) |
| **No verificado** | **4** | `I-066` (`F-46`), `I-067` (`F-47`), `I-068` (`F-14` sub-verificación `lint`/`build`), `I-069` (`C-13`) |
| **Refutado** | **2** | `I-089` (`P-07`), `I-090` (`H-06`) |
| **Mixto** | **1** | `I-017` (`C-14`: verificado en código / refutado en sobrescritura / no verificado en despliegue real) |
| **Total** | **91** | `83 + 1 + 4 + 2 + 1 = 91` |

### 2.5 Recuento definitivo de las propuestas `P-01`…`P-26` (`S-3`)

| Clasificación funcional | Cantidad | Identificadores |
|---|---|---|
| **Categoría B — Requisito aprobado y no implementado** | **0** | Ninguno (`03_decisiones/`, `05_roadmap/` y `02_consultas_tecnicas/` vacíos; ninguna propuesta de `DXC-2026-005` §8 está aprobada) |
| **Categoría C — Propuesta nueva no aprobada** (con hecho técnico actual `A` comprobado) | **20** | `P-01`, `P-02`, `P-03`, `P-04`, `P-05`, `P-06`, `P-08`, `P-09`, `P-13`, `P-14`, `P-15`, `P-16`, `P-17`, `P-18`, `P-19`, `P-20`, `P-21`, `P-22`, `P-23`, `P-25` |
| **Categoría D — Pertenencia al alcance sin determinar** (con hecho técnico actual `A` comprobado) | **5** | `P-10` (facturación), `P-11` (IVA/descuentos), `P-12` (recargos por mora), `P-24` (multisucursal), `P-26` (reglas por tipo de documento) |
| **Refutada** | **1** | `P-07` (`I-089`) |
| **Total** | **26** | `0 + 20 + 5 + 1 = 26` |

### 2.6 Distribución de los 91 elementos por matriz y naturaleza

| Matriz | Naturaleza | Cantidad de elementos | Rango de IDs |
|---|---|---:|---|
| **B-1** | Riesgos de seguridad | 10 | `I-001`…`I-010` |
| **B-2** | Defectos técnicos vigentes y hechos técnicos de configuración/código | 12 | `I-011`…`I-022` |
| **B-3** | Deuda técnica | 12 | `I-023`…`I-034` |
| **B-4** | Inconsistencias documentales | 9 | `I-035`…`I-043` |
| **B-5** | Decisiones pendientes (requieren validación del usuario/negocio) | 22 | `I-044`…`I-065` |
| **B-6** | Verificaciones pendientes (sin evidencia suficiente aún) | 4 | `I-066`…`I-069` |
| **B-7** | Fortalezas y controles existentes | 11 | `I-070`…`I-080` |
| **B-8** | Históricos, resueltos, refutados y de contexto | 11 | `I-081`…`I-091` |
| **Total** | **8 matrices** | **91** | **`I-001`…`I-091`** |

---

## 3. Inventario único consolidado (Matrices B-1 a B-8: elementos I-001 a I-091)

### B-1. RIESGOS DE SEGURIDAD (`I-001`…`I-010`)

| ID | Orig. | Nombre | Cert. | Vigencia | Prioridad (orig. → prop.) | Evidencia | Impacto | Acción pendiente | Deps. | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| **I-001** | R-01, R-10 | Exposición de hash bcrypt en `GET /usuarios[/{id}]` (causa raíz: `_orm_to_dict` sin allowlist) | Verificado (estático) | Vigente | P0 → **P0** | `response.py:14-29,53-54`; `usuario_routes.py:96,115`; `models/usuario.py:22,51` | Credenciales expuestas; riesgo de cracking | Prueba en runtime + allowlist/`response_model` | — | Runtime pendiente no altera la prioridad: el flujo estático está probado |
| **I-002** | F-24, R-08 | Credencial de prueba en texto plano + hash bcrypt compartido en 11 usuarios, en archivos versionados | Verificado | Vigente | P0 → **P0** | `03_seed_data.sql:3,6,14`; `INDICE.md:26,120`; `README_base_de_datos.md:46,75,76` (solo ubicación) | Acceso con credenciales conocidas | Saneamiento P0 + rotación | — | Secretos no reproducidos aquí; copias DXC en `gestion_proyecto/` ya saneadas |
| **I-003** | F-27 | Login sin rate limiting | Verificado (ausencia) | Vigente | P0 → **P0** | Grep sin coincidencias | Fuerza bruta / credential stuffing | Rate limiting + lockout | — | Complementa I-002 |
| **I-004** | R-04 | Puertos BD y API publicados en `0.0.0.0` vs comentarios "solo localhost" | Verificado | Vigente | P0 (AUD-002) → **P0** | `docker-compose.yml:47-48,76-77` | Superficie de ataque en red | Prefijo `127.0.0.1:` o quitar `ports` | I-002 | Contradicción documental registrada en 0.3 |
| **I-005** | R-05 | Contenedores como root (sin `USER`) | Verificado | Vigente | P1 → **P1** | Dockerfiles sin `USER` | Escalada de privilegios | Usuario no privilegiado | — | — |
| **I-006** | R-13 | Compose sin endurecimiento (`security_opt`, `read_only`, límites, `user`) | Verificado | Vigente | P2 (AUD-002) / P1 → **P2** | `docker-compose.yml` sin directivas | Contención de incidentes | Endurecer compose | I-005 | Relacionado, no equivalente, a I-005 |
| **I-007** | F-30, R-12 (+S-08) | Cabeceras de seguridad incompletas (faltan CSP/HSTS) y FastAPI sin límites de body/timeout | Verificado | **Parcialmente mitigado** | P2 (AUD) / P1 → **P2** | `nginx.conf:70-75` (3 cabeceras); FastAPI sin límites | XSS/clickjacking; abuso de recursos | Añadir CSP/HSTS (HSTS exige TLS) + límites | — | S-08 (I-076) es la mitigación parcial, no se fusiona |
| **I-008** | F-26 | `str(error)` devuelto en respuestas HTTP 500 (~62 ocurrencias) | Verificado | Vigente | P1 → **P1** | Recuento propio 2026-10-30 en `app/**/*.py` | Fuga de detalles internos | Manejador de excepciones con respuesta genérica | — | Auditorías citan ~68 (diferencia de método) |
| **I-009** | F-29, H-02 | Rol persistido en JWT sin revalidación; TTL 480 min | Verificado | Vigente | P1 → **P1** | `settings.py:26`; `auth_dependency.py:58-61` | Retraso en revocación de permisos | Revalidación de rol o TTL menor + rotación (I-045) | I-045, I-046 | — |
| **I-010** | F-28, R-14 | JWT en `localStorage` + decodificación de `exp`/rol en cliente (solo UX) | Verificado | Vigente | P1 (F-28) / P3 (R-14) → **P2** | `client.ts:29-41`; `AuthContext.tsx`; `src/utils/jwt.ts` | Robo de token vía XSS | HttpOnly cookies o gestión equivalente | — | Backend valida firma: límite UX documentado |

### B-2. DEFECTOS TÉCNICOS VIGENTES Y COMPORTAMIENTOS TÉCNICOS COMPROBADOS (`I-011`…`I-022`)

| ID | Orig. | Nombre | Cert. | Vigencia | Prioridad (orig. → prop.) | Evidencia | Impacto | Acción pendiente | Deps. | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| **I-011** | F-34 | Interpolación f-string en SQL (`INTERVAL '{dias} days'`) | Verificado (revalidado 0.3/0.4) | Vigente | P2 (AUD-001) / P1 → **P1** | `alquiler_controller.py:429` | Inyección SQL (acotada por coerción `int`) | Bind param `:dias` | — | Riesgo acotado pero patrón inseguro |
| **I-012** | F-35 | Curingas `%`/`_` sin escapar en búsquedas `ilike` (8 ocurrencias) | Verificado | Vigente | P3 (AUD-001) / P2 → **P2** | `alquiler_controller.py:404` y controllers | Denegación de servicio / resultados erróneos | Escapar curingas | — | — |
| **I-013** | F-31, R-03, C-08 | Healthcheck depende de `/docs`; no existe `GET /health` | Verificado | Vigente | P1 → **P1** | `docker-compose.yml:80`; `main.py` sin `docs_url` especial | Reinicios del orquestador ante caídas reales del API o exposición forzada de `/docs` | Crear `GET /health` | — | Fusiona equivalencia ya mapeada |
| **I-014** | R-06, C-06 | `uvicorn --workers 2` + APScheduler duplica el job de las 00:05 | Verificado (config); impacto probable | Vigente | P2 (AUD-002) / P1 → **P1** | `entrypoint.sh:52`; scheduler en `main.py` | Doble ejecución de proceso programado | 1 worker o cron externo | I-016 | Idempotencia sin probar |
| **I-015** | R-11 | Regex frágil para parsear `DATABASE_URL` | Verificado | Vigente | P2 → **P2** | `entrypoint.sh:24-29` | Fallo de arranque con URLs no soportadas | `urlparse` o `pg_isready` | I-016 | — |
| **I-016** | R-02 | `alembic upgrade head` automático vs BD inicializada por SQL | **Probable** | Vigente | P0 (AUD-002) → **P1** *(condicionado a decisión de flujo)* | `entrypoint.sh:8,44` vs READMEs (`stamp head`) | Arranque fallido; riesgo de migración no deseada | Prueba de arranque; decisión de flujo | — | Requiere runtime para confirmar (P0 histórico en AUD-002) |
| **I-017** | C-14 | Carga de `.env` por `python-dotenv`: hecho en código verificado; afirmación histórica de sobrescritura **refutada**; comportamiento de despliegue real no verificado | **Mixto:** Verificado (código y biblioteca) / **Refutado** (sobrescritura) / No verificado (despliegue real) | Afirmación histórica: **Refutado** · Despliegue: **Pendiente de determinar** | Sin prioridad (afirmación refutada); verificación de despliegue = **P3** | `settings.py:3,6`; `requirements.txt:18` (`python-dotenv==1.2.3`); `dotenv/main.py:97-110,388-395` (`override=False` preserva `os.environ`); `.dockerignore:15-17` | Ninguno en código actual: un `.env` colado solo poblaría variables ausentes | Únicamente: verificación en ejecución del entorno de despliegue cuando se autorice (acción menor) | — | Naturaleza: verificación (hecho técnico) + componente histórico refutado. Alineada con `EVD-2026-002` §9.1 (`AUD-2026-005` §4.1) |
| **I-018** | P-08 | El resumen semanal de gastos suma `ENTREGA`/`RECOGIDA` junto a `GASTO` | **Verificado (0.4)** | Vigente (comportamiento actual) | Medio (DXC) → **Sin proponer** *(hasta que el negocio defina la regla)* | `logistica_alquiler_controller.py:101-113` (SUM sin filtro `tipo_movimiento`); constraint `01_tablas.sql:236` | Dato financiero agregado incluye envíos si la regla deseada fuera excluirlos | Decisión de negocio: filtrar o exponer desglose (`C`) | I-051, I-052 | **Naturaleza (`S-6`):** comportamiento técnico comprobado (`A`) + propuesta de regla nueva no aprobada (`C`). No es defecto per se |
| **I-019** | P-15 | Tarifa entrega/recogida hardcodeada en el cliente (`15000`) | **Verificado (0.4)** | Vigente | Alto (DXC) → **Alto** *(riesgo técnico de validación server-side; parametrización es propuesta `C`)* | `CrearAlquiler.tsx:195-197` | Precio manipulable desde cliente; tarifa fija no parametrizable | Validación server-side; decidir si se parametriza en BD/config (`C`) | I-052 | Hecho técnico comprobado (`A`) + propuesta de parametrización (`C`) |
| **I-020** | P-22 | Umbral "por vencer" hardcodeado y duplicado (`2` días) | **Verificado (0.4)** | Vigente | Bajo (DXC) → **P3** *(propuesta `C`)* | `alquiler_routes.py:75`; `vencimiento.ts:7,43` | Cambio requiere modificar dos capas | Decidir si se convierte en parámetro configurable (`C`) | I-055 | Hecho técnico comprobado (`A`) + propuesta (`C`) |
| **I-021** | C-07 | `VITE_API_URL` fijada en build time | **Verificado (0.4)** | Vigente (**mitigado** por proxy same-origin) | Medio (DXC) → **P3** | `Dockerfile` frontend:31-34 (ARG/ENV); compose pasa `/api/sga` | Reconstruir imagen para cambiar destino fuera del proxy | Aceptar patrón proxy o runtime config | — | Ascendido de *no verificado* (0.3) a verificado |
| **I-022** | H-12 | `UsuarioCreatePayload` declara `contrasena_usuario` opcional/nullable; el backend la exige (`min_length=4`) | **Verificado (0.4)** | Vigente | — → **P2** | `Usuario.ts:32`; `usuario_schema.py:51` | Errores 422 en runtime; contrato confuso | Alinear tipo frontend con el requisito del backend | — | Ascendido de *no verificado* (0.3) a verificado |

### B-3. DEUDA TÉCNICA (`I-023`…`I-034`)

| ID | Orig. | Nombre | Cert. | Vigencia | Prioridad (orig. → prop.) | Evidencia | Impacto | Acción pendiente | Deps. | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| **I-023** | F-15, F-16, H-11 | Cero pruebas automatizadas (y sin script `test`) | Verificado | Vigente | P0 histórico (AUD-001/002) → **P1** | Sin archivos test/spec/conftest; `package.json:6-11` | Regresiones no detectadas | Framework + suite mínima prioritaria | I-025 | Prioridad histórica P0 conservada; propuesta P1 enfocada en tests de regresión críticos (R-01) |
| **I-024** | F-12 | Sin herramientas de calidad backend (ruff/mypy/pytest ausentes) | Verificado | Vigente | P0 histórico (AUD-001/002) / P1 → **P2** | `git ls-files` sin `pyproject` | Deuda creciente | Añadir tooling | I-023 | Prioridad histórica P0 conservada |
| **I-025** | F-21, C-09, F-20 | Sin CI/CD (typecheck corre solo en el Dockerfile, no en CI) | Verificado | Vigente | P0 histórico (F-21) / P1 → **P1** | Sin `.github/`; único YAML = compose | Regresiones silenciosas | Pipeline mínimo (lint+typecheck+test) | I-023 | Equivalencia mapeada en 0.3 |
| **I-026** | F-13, C-10 (+S-07) | Rangos `^` en `package.json` impiden instalaciones reproducibles | Verificado | **Parcialmente mitigado** | P2 (F-13) / P3 → **P3** | `package.json:12-27`; mitigado por `npm ci` en Docker | Deriva de dependencias fuera de Docker | Estandarizar `npm ci` | I-025 | S-07 (I-075) = mitigación parcial, no equivalencia |
| **I-027** | F-18 | `oxlint` con configuración mínima | Verificado | Vigente | P2 (AUD-001) / P3 → **P3** | `.oxlintrc.json` | Detección superficial | Reglas estrictas | — | — |
| **I-028** | F-19, C-11 | TypeScript sin `strict`; alias `@/*` sin resolver en Vite | Verificado | Vigente | P1 (AUD-001) / P2 → **P2** | `tsconfig.app.json`; `vite.config.ts` sin `resolve.alias` | Bugs de tipos no detectados | `strict` incremental + alias | — | C-11 incluye componente alias verificada en 0.4 |
| **I-029** | F-22 | Sin pre-commit ni formateador | Verificado | Vigente | P2 (AUD-001) / P3 → **P3** | Ausentes en el árbol | Inconsistencia de estilo | Hooks + formateador | I-025 | — |
| **I-030** | F-36 | Sin logging estructurado | Verificado | Vigente | P1 (AUD-001) / P2 → **P2** | Grep `logging` = 0 | Incapacidad de diagnóstico en operación | Logging estructurado | I-061 | Bloquea runbooks |
| **I-031** | F-10 | Dependencias pinneadas sin auditoría CVE | Verificado | Vigente | P2 → **P2** | `requirements.txt` (25 pins); sin Dependabot/`pip-audit` | Vulnerabilidades no detectadas | `pip-audit`/`npm audit` + Dependabot | — | Requiere autorización de ejecución |
| **I-032** | F-17 | Demos SQL manuales con `ROLLBACK` como único "test" | Verificado | Vigente | P2 (AUD-001) / P3 → **P3** | `database/06_demos_endpoints/` | Cobertura ilusoria | Convertir a tests automatizados | I-023 | — |
| **I-033** | F-48 | Complejidad concentrada en controllers (`alquiler_controller.py` >429 líneas) | Verificado | Vigente | P2 → **P2** | Análisis estático | Difícil testeabilidad | Capa de servicios | I-023 | Mitigación parcial: componentización actual |
| **I-034** | H-09 | Vistas del dashboard (`06_vistas_dashboard.sql`) no expuestas por ningún endpoint | **Verificado (0.4)** | Vigente | — → **P3** | Grep `vw_dashboard` = 0 en rutas/controllers | Código SQL sin consumidor en API o dashboard pendiente | Decisión: exponer, eliminar o diferir | — | Ascendido de *no verificado* (0.3) a verificado |

### B-4. INCONSISTENCIAS DOCUMENTALES (`I-035`…`I-043`)

| ID | Orig. | Nombre | Cert. | Vigencia | Prioridad (orig. → prop.) | Evidencia | Impacto | Acción pendiente | Deps. | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| **I-035** | F-08, F-09, F-39, F-40, R-15, H-10 | Documentación de proceso vacía (6×0 B) y auditorías/DXC sin versionar en el remoto | Verificado | Vigente | P0 histórico (F-08/F-39/F-40/R-15) / P1 → **P1** | 6 archivos 0 B; `docs/gestion_proyecto/` untracked | Pérdida de trazabilidad; línea base documental frágil | Commit autorizado + decisión rellenar/eliminar | Autorización | 6 IDs, una misma condición documental |
| **I-036** | F-41 | README raíz desactualizado (acceso inicial, Docker) | Verificado | Vigente | P1 (AUD-001) / P2 → **P2** | `README.md` sin cambios | Onboarding incorrecto | Actualizar README | I-035 | — |
| **I-037** | F-42 | Conflicto PostgreSQL "14+" (README) vs `postgres:16-alpine` | Verificado | **Parcialmente mitigado** | P2 → **P2** | `docker-compose.yml`; README | Despliegues divergentes | Unificar documentación | I-036 | — |
| **I-038** | F-43, H-04 | `INDICE.md` describe esquema antiguo (`es_recogida`) | Verificado | Vigente | P2 → **P2** | `INDICE.md:91` | Referencia errónea para developers | Regenerar índice | I-040 | — |
| **I-039** | F-44, H-07 | `es_recogida` huérfano en el frontend (inexistente en BD) | Verificado | Vigente | P1 (AUD-001) / P2 → **P2** | 7 ocurrencias en `src/` | Expectativa rota frontend↔BD | Eliminar del frontend o añadir a BD + contract tests | — | 6 (auditorías) vs 7 (líneas): diferencia de método |
| **I-040** | H-03 | `04_plantillas.sql`/`05_consultas.sql` referencian `estado_usuario`, inexistente en el esquema vigente | **Verificado (0.4)** | Vigente | — → **P2** | `04_plantillas.sql:80,110`; nota `01_tablas.sql:361-364` confirma la ausencia de la columna | Plantillas/consultas fallan al ejecutarse | Regenerar o eliminar plantillas | I-038 | Ascendido de *no verificado* (0.3) a verificado |
| **I-041** | F-25, H-05 | README lista credenciales que no existen en el seed | Verificado | Vigente | P1 → **P1** | `README.md:80-88` | Usuarios prueban credenciales inexistentes; confusión operativa | Sincronizar README con seed | I-002 | Contradicción registrada en 0.3 |
| **I-042** | F-45 | Sin gobernanza (CONTRIBUTING/CODEOWNERS/SECURITY/CHANGELOG/ADRs) | Verificado | Vigente | P1 (AUD-001) / P2 → **P2** | Ausentes; `AGENTS.md` solo local | Proceso informal no escalable | Elaborar gobernanza | I-035 | — |
| **I-043** | F-07, R-09, C-01, C-02 | Deriva de la estrategia de despliegue: docs Render/Vercel vs stack real Docker Compose | Verificado | Vigente (docs); **parcialmente mitigado en infra** (existen Dockerfiles/compose, sin confirmar en runtime) | P1 → **P1** | `vercel.json` ausente; banner DXC-006; compose existente | Despliegue guiado por docs erróneos | Reescribir capítulo de despliegue + ADR de destino | I-035 | Desglose: artefactos existen (F-07/C-02) y deriva documental vigente (R-09/C-01) |

### B-5. DECISIONES PENDIENTES (`I-044`…`I-065` — todas requieren validación del usuario/negocio; ninguna propuesta está aprobada)

| ID | Orig. | Nombre | Clasif. P | Cert. (hecho técnico `A`) | Vigencia | Prioridad (DXC hist. → estado prop.) | Evidencia | Impacto potencial | Decisión requerida | Deps. | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **I-044** | P-01 | Política de contraseñas (longitud real, complejidad, expiración, restablecimiento) | **A + C** | Verificado (hueco) | Vigente | Alto (DXC) → **Alto** *(propuesta C no aprobada)* | `usuario_schema.py:51,87` (`min_length=4`); seed con contraseña compartida | Control de acceso débil | Definir política | I-002, I-045 | Choca con el seed compartido (I-002); la política en sí requiere aprobación |
| **I-045** | P-02, C-12 | Rotación de `JWT_SECRET_KEY` y política de rotación de credenciales | **A + C** | Verificado (hueco) | Vigente | — (DXC) → **Alto** *(propuesta C no aprobada)* | `settings.py:26`; sin documentos de política (F-45) | Tokens imposibles de invalidar masivamente | Definir rotación y periodicidad | I-009, I-046 | C-12 fusionado por mismo dominio de decisión |
| **I-046** | P-03 | Revocación/blacklist de tokens en servidor (multi-dispositivo) | **A + C** | Verificado (ausencia) | Vigente | — (DXC) → **Medio** *(propuesta C no aprobada)* | Grep `blacklist\|revoc` = 0 | Sesiones activas tras logout/baja | Definir modelo de sesión | I-045 | — |
| **I-047** | P-04 | Reapertura de alquileres solo por consola SQL | **A + C** | Verificado (ausencia en API) | Vigente | — (DXC) → **Medio** *(propuesta C no aprobada)* | Grep `reabrir` = 0 en `app/` | Operación administrativa fuera del API | Definir procedimiento con auditoría | — | La consola SQL puede ser procedimiento legítimo, no un defecto |
| **I-048** | P-05 | Rol logístico sin acceso al historial de auditoría del alquiler | **A + C** | Verificado | Vigente | — (DXC) → **Medio** *(propuesta C no aprobada)* | `alquiler_routes.py:243` (`ADMIN_O_FACTURACION`) | Operación sin vista de historial para logística | Ampliar alcance o mantener diseño actual | — | Opera sobre el marco RBAC aprobado (`RN-AUD-*`); el diseño actual es correcto, no defecto (`S-6`) |
| **I-049** | P-06 | Rol logístico puede cambiar estados (incl. `cancelado`) | **A + C** | Verificado | Vigente | — (DXC) → **Medio** *(propuesta C no aprobada)* | `alquiler_routes.py:191` (`STAFF_INTERNO`) | Estados críticos modificables por logística | Definir alcance por estado | — | Opera sobre el marco RBAC aprobado (`RN-AUD-*`); irreversibilidad garantizada por triggers (`S-6`) |
| **I-050** | P-09 | Depósito: sin estado (retenido/devuelto) ni fecha de devolución | **A + C** | **Verificado (0.4)** | Vigente | Medio (DXC) → **Medio** *(propuesta C no aprobada)* | `01_tablas.sql:115,146-147` (NUMERIC, CHECK ≥0, sin columnas de estado/fecha) | Depósito no conciliable en sistema | Definir modelo y reglas | I-052 | Ascendido de *no verificado* (0.3) a verificado |
| **I-051** | P-10 | Sin facturación ni comprobante (aunque existe el rol `encargado_facturacion`) | **A + D** | **Verificado (0.4)** | Vigente | Alto (DXC) → **Condicionada a determinación de alcance** | Sin tablas/endpoints de factura (grep: solo rol y comentarios); esquema sin entidad fiscal | Si perteneciera al alcance, no emite documento fiscal | Determinar primero si el SGA debe facturar (`D`) | I-052 | **Clasificación D (`S-6`):** etiqueta «Alto» del DXC solo como procedencia histórica |
| **I-052** | P-11 | Sin descuentos, recargos ni IVA auditables (ajuste manual en `precio_alquiler`) | **A + D** | **Verificado (0.4)** | Vigente | Alto (DXC) → **Condicionada a determinación de alcance** | Sin campos/tablas; comentarios en `alquiler_controller.py:173`, `detalle_alquiler_controller.py:50` | Si perteneciera al alcance, ajustes no desglosados | Determinar alcance fiscal/comercial (`D`) | I-051 | **Clasificación D (`S-6`):** etiqueta «Alto» del DXC solo como procedencia histórica |
| **I-053** | P-12 | Renovación manual sin recargos por retraso | **A + D** | **Verificado (0.4)** | Vigente | Medio (DXC) → **Condicionada a determinación de alcance** | `POST /renovaciones` (`alquiler_routes.py:258`); sin lógica de recargo | Si perteneciera al alcance, mora no automatizada | Determinar si existen recargos en el negocio (`D`) | I-052 | **Clasificación D (`S-6`):** etiqueta «Medio» del DXC solo como procedencia histórica |
| **I-054** | P-13 | Sin control de inventario físico (conteo cíclico, merma, mantenimiento) | **A + C** | **Verificado (0.4)** | Vigente | Alto (DXC) → **Condicionada a validación de negocio (`C`)** | `01_tablas.sql:74-75,95-98` (solo `stock_total`/`stock_alquilado`) | Sin registro de mermas/conteos cíclicos | Definir reglas de inventario físico | — | Ampliación 0.4; propuesta nueva no aprobada (`C`) |
| **I-055** | P-14 | Sin días hábiles/festivos para vencimientos (solo días calendario, `America/Bogota`) | **A + C** | **Verificado (0.4)** | Vigente | Medio (DXC) → **Medio** *(propuesta C no aprobada)* | 6 usos de `America/Bogota`; grep festivos/hábiles = solo falsos positivos ("habilitado") | Vencimientos en días calendario | Definir si aplica calendario laboral | I-020 | Ampliación 0.4 |
| **I-056** | P-16 | `DELETE` de producto con stock en obra prohibido por trigger; falta flujo alternativo de baja | **A + C** | **Verificado (0.4)** | Vigente | Medio (DXC) → **Medio** *(propuesta C no aprobada)* | `02_funciones_y_triggers.sql:84,216` (BEFORE DELETE) | Sin flujo asistido de baja con stock en obra | Definir baja lógica/traslado/autorización | — | **Anclada en la regla aprobada `RN-AUD-15`** (implementada); la aprobación de la regla existente no extiende al flujo alternativo (`S-6`) |
| **I-057** | P-17 | Sin retención/purga/partición de `auditoria_sistema` | **A + C** | **Verificado (0.4)** | Vigente | Medio (DXC) → **Medio** *(propuesta C no aprobada)* | Grep `retencion\|purga\|partition` = 0; tabla crece indefinidamente (`:275`) | Crecimiento futuro de tabla de auditoría | Definir ciclo de vida | I-030 | Ampliación 0.4 |
| **I-058** | P-18 | Sin bloqueo de fila ni reservas de stock (carreras entre creaciones simultáneas) | **A + C** | **Verificado (0.4)** | Vigente | Medio (DXC) → **Medio** *(propuesta C no aprobada)* | Grep `FOR UPDATE` = 0 | Error 400 genérico al segundo usuario concurrente | Definir política de reintento/UX | I-054 | BD protege integridad por trigger, pero sin reserva previa definida |
| **I-059** | P-19 | Sin trazabilidad de acciones denegadas en el frontend | **A + C** | **Verificado (0.4)** | Vigente | Bajo (DXC) → **P3** *(propuesta C no aprobada)* | Grep `intento\|denegado\|denied` = 0 en `src/` | Sin telemetría de intentos en UI | Definir si se registra | — | Ampliación 0.4 |
| **I-060** | R-07, P-20 | Sin OpenAPI versionado ni política de deprecación tras la reducción 45→38 endpoints | **A + C** | Verificado | Vigente | P1 (R-07) / Medio (P-20) → **Medio** *(propuesta C)* | `git ls-files openapi` = vacío; 38 decoradores `@router` | Contrato sin versionado formal | Definir versionado + registro de breaking changes | I-025 | Equivalencia R-07↔P-20 por idéntica acción pendiente |
| **I-061** | P-21 | Sin runbook ni procedimiento de escalamiento de incidentes | **A + C** | Verificado | Vigente | Medio (DXC) → **Medio** *(propuesta C no aprobada)* | `git ls-files runbook` = vacío | Recuperación manual ante incidentes | Redactar runbooks | I-030, I-042 | — |
| **I-062** | P-23 | `id_alquiler` es SERIAL técnico, no número de contrato comercial | **A + C** | **Verificado (0.4)** | Vigente | Medio (DXC) → **Condicionada a validación de negocio (`C`)** | `01_tablas.sql:109` | Identificador numérico secuencial simple | Definir si se requiere numeración comercial | I-051 | Ampliación 0.4; propuesta nueva no aprobada (`C`) |
| **I-063** | P-24 | Sin dimensión multiempresa/multi-sucursal | **A + D** | **Verificado (0.4)** | Vigente | Medio (DXC) → **Condicionada a determinación de alcance** | Sin tablas de empresa/sucursal en `01_tablas.sql` | Modelo diseñado para una sola sede | Determinar si multisucursal pertenece al alcance (`D`) | I-064 | **Clasificación D (`S-6`):** etiqueta «Medio» del DXC solo como procedencia histórica |
| **I-064** | P-25 | `barrio` como `VARCHAR(100)` libre sin catálogo | **A + C** | **Verificado (0.4)** | Vigente | Medio (DXC) → **Medio** *(propuesta C no aprobada)* | `01_tablas.sql:113` | Texto libre en agrupaciones por barrio | Definir catálogo o mantener texto libre | I-063, I-012 | Ampliación 0.4 |
| **I-065** | P-26 | `tipo_documento` enum fijo sin reglas por tipo (NIT/empresas, IVA, extranjeros) | **A + D** | **Verificado (0.4)** | Vigente | Bajo (DXC) → **Condicionada a determinación de alcance** | `01_tablas.sql:32,49-51` | Validación uniforme con independencia del tipo de documento | Determinar alcance fiscal/documental (`D`) | I-052 | **Clasificación D (`S-6`):** etiqueta «Bajo» del DXC solo como procedencia histórica |

### B-6. VERIFICACIONES PENDIENTES (`I-066`…`I-069` — sin evidencia suficiente aún)

| ID | Orig. | Nombre | Cert. | Vigencia | Prioridad (orig. → prop.) | Verificación requerida | Limitación |
|---|---|---|---|---|---|---|---|
| **I-066** | F-46 | Protección de ramas y checks obligatorios en GitHub | **No verificado** | Pendiente de determinar | P0 histórico (AUD-001) → **P1** | `gh api` o confirmación del administrador | Metadatos de plataforma; sin red/API |
| **I-067** | F-47 | Uso real de PRs, issues, etiquetas, milestones | **No verificado** | Pendiente de determinar | P1 (AUD-001) → **P2** | `gh api` | Ídem |
| **I-068** | F-14 (sub-afirmación) | Estado real de `lint`/`build` (nunca ejecutados) | **No verificado** | Pendiente de determinar | P0 histórico (AUD-001) → **P2** | Ejecución de `lint`/`build` (autorizada) | La parte histórica del hallazgo (`venv` ausente en directorio de auditoría) sí está verificada y no es vigente en `SGA_repo/SGA` |
| **I-069** | C-13 | Hibernación del plan gratuito de Render | **No verificado** | **Pendiente de determinar** (probablemente histórico bajo Docker) | — → **P3** | Verificación en el entorno desplegado cuando se decida destino (I-043) | Entorno externo inexistente hoy |

> **Verificaciones en ejecución ligadas a elementos vigentes (sin crear elemento duplicado):** confirmación en runtime de `I-001` (hash expuesto en `GET /usuarios[/{id}]`), prueba de arranque de `I-016` (`alembic upgrade head` vs BD inicializada por SQL), idempotencia en runtime de `I-014` (`APScheduler` con 2 workers), comprobación del entorno real de despliegue de `I-017` (`C-14`, acción menor P3) y auditoría dinámica de vulnerabilidades de `I-031` (`pip-audit` / `npm audit`).

### B-7. FORTALEZAS Y CONTROLES EXISTENTES (`I-070`…`I-080` — no se fusionan con los defectos que mitigan)

| ID | Orig. | Fortaleza / Control positivo | Cert. | Evidencia | Relación |
|---|---|---|---|---|---|
| **I-070** | S-01 (+F-23, H-01, C-05 **resueltos**) | CORS parametrizado por env, sin comodín | Verificado | `settings.py:30-39`; `.env.example:14-22` | Resuelve el histórico H-01/C-05/F-23 |
| **I-071** | S-02 (+F-32, H-08, C-03 **resueltos**) | Migración inicial limpia y reversible (`create_*` en upgrade, `drop_*` solo en downgrade) | Verificado | `0001_initial_schema.py` | Resuelve baseline destructiva |
| **I-072** | S-03 | Login con respuesta genérica (anti-enumeración) | Verificado | `auth_routes.py:27-33` | — |
| **I-073** | S-04, S-05 | `.dockerignore`/`.gitignore` excluyen `.env`; plantilla con `<CAMBIAR>` | Verificado | `.dockerignore:15-17`; `.gitignore:225-226` | Refuerza control sobre `.env` (`I-017`) |
| **I-074** | S-06 | Compose con healthchecks, red aislada y volúmenes nombrados | Verificado (config) | `docker-compose.yml:37-42,79-80,120-121` | Salud real sin ejecutar |
| **I-075** | S-07 | Frontend multi-stage con `npm ci` | Verificado | `Dockerfile` frontend:25,35 | Mitiga parcialmente I-026 |
| **I-076** | S-08 | Nginx: `server_tokens off` + 3 cabeceras básicas | Verificado | `nginx.conf:44-49,70-75` | Mitiga parcialmente I-007 |
| **I-077** | S-09 | Exclusión de `PUT` coherente backend↔frontend | Verificado | `client.ts:64` | — |
| **I-078** | S-10, F-38 | RBAC intacto: 38 rutas, 43 usos de `requiere_rol` (37/38 con control; `POST /auth/login` público por diseño) | Verificado | Recuento propio 2026-10-30 | — |
| **I-079** | F-49 | Auditoría BD por triggers + `set_audit_context` | Verificado | `database/`; `audit_context.py` | Sustenta trazabilidad de BD |
| **I-080** | F-37 | Controles positivos: sin secretos cloud/PEM, `.env` ignorado, bcrypt | Verificado | Scans AUD-001/002 | Regresión a proteger con tests |

### B-8. HISTÓRICOS, RESUELTOS, REFUTADOS Y DE CONTEXTO (`I-081`…`I-091`)

| ID | Orig. | Condición | Cert. | Vigencia | Evidencia / Nota |
|---|---|---|---|---|---|
| **I-081** | F-01 | Línea base de la auditoría 1 = `14726ad` | Verificado | **Histórico** (marcador) | Hoy HEAD = `12760d4` |
| **I-082** | F-02 | Clon local single-branch de auditoría | Verificado | **Histórico** (contexto) | Refspec estándar verificada en `SGA_repo/SGA` |
| **I-083** | F-03 | Divergencia local↔remoto en `dev` | Verificado | **Resuelto** (en `dev`) | Hoy HEAD = `origin/dev`; la divergencia de `main` (ahead 26 / behind 37) es hecho independiente persistente |
| **I-084** | F-04 | Autor único con dos identidades (`gabielrodriguez` 41 / `gabrielrodriguez` 2) | Verificado | Vigente (hecho Git) | `git shortlog -sn HEAD` |
| **I-085** | F-05, R-16 | Commits sin convención + merge cruzado `deployment→dev` (`63cb22c`) | Verificado | Vigente | Historial; intención no comprobable → definir flujo de ramas |
| **I-086** | F-06 | Estructura monorepo (145 → 178 archivos) | Verificado | Vigente (contexto) | Condición descriptiva, sin acción |
| **I-087** | F-11, H-13 | `alembic` ausente de `requirements.txt` | Verificado | **Resuelto** | `requirements.txt:1` (`alembic==1.13.3`) |
| **I-088** | F-33, H-14, C-15 | `alembic/env.py` sin importar modelos / `app/models/__init__.py` vacío | Verificado | **Resuelto** | `env.py:24-27` importa `app.models` |
| **I-089** | P-07 | Incoherencia de inventario (dato disponible por otra vía con rol distinto) | **Refutado (0.4)** | **Refutado** | `producto_routes.py`: `GET ""` y `GET /{id}` son ambos `STAFF_INTERNO` — la incoherencia citada (detalle `ADMIN_O_FACTURACION`) ya no existe tras R-07 |
| **I-090** | H-06 | `HistorialAlquiler` incompatible con la respuesta real del historial | **Refutado (0.4)** | **Refutado** | `Alquiler.ts:116` devuelve `{id_alquiler, total_eventos, eventos}` con los campos exactos que retorna `auditoria_controller.py:27-64` (incluye `null` para eventos sin usuario) |
| **I-091** | C-04 | `alembic.ini` con URL de ejemplo | **Verificado (0.4)** | Vigente (**benigno**) | `alembic.ini:89` (placeholder inofensivo) sobrescrito por `env.py:34` con `DATABASE_URL` real — sin riesgo efectivo |

### 3.1 Notas de corrección sobre filas existentes (`S-6` aplicado íntegramente)

- **`I-018` (`P-08`):** naturaleza = *"comportamiento técnico comprobado (la suma semanal incluye `ENTREGA`/`RECOGIDA`) + propuesta de regla nueva no aprobada (`C`)"*. No es defecto: la regla deseada (qué debe incluir el resumen) no está aprobada. Prioridad: **sin proponer** hasta que el negocio defina la regla.
- **`I-051` (`P-10`), `I-052` (`P-11`), `I-053` (`P-12`), `I-063` (`P-24`), `I-065` (`P-26`):** clasificación **`D`** — pertenencia al alcance sin determinar; las prioridades propuestas quedan **condicionadas a la determinación de alcance** y la etiqueta de impacto del DXC se conserva solo como procedencia histórica.
- **`I-056` (`P-16`):** propuesta `C` **anclada en la regla aprobada `RN-AUD-15`** (prohibición de borrar producto con stock en obra, implementada en `02_funciones_y_triggers.sql:84,216`); la aprobación de esa regla existente no extiende al flujo alternativo de baja, que sigue sin aprobar.
- **`I-048` (`P-05`), `I-049` (`P-06`):** propuestas `C` sobre el marco RBAC aprobado (`RN-AUD-*`); el comportamiento actual es diseño correcto, no defecto.
- Todo lo demás del inventario (matrices `B-1`, `B-3`, `B-4`, `B-5` salvo lo aquí anotado, `B-6`, `B-7`, `B-8` y la fila `I-017` en `B-2`) se mantiene intacto.

---

## 4. Tabla de trazabilidad completa (130 identificadores → 91 elementos)

Formato: `ID original → elemento consolidado`. Los 116 identificadores evaluados en el paso 0.3 se marcan con `°`; los 14 incorporados en el paso 0.4 (`P-13`…`P-26`) con `†`; los 12 identificadores cuyo estado de certeza cambió en el paso 0.4 respecto a `EVD-2026-002` se señalan con `↗`.

### 4.1 Serie `F-01`…`F-49` (49 identificadores, todos `°`)

| ID | Elemento | Estado del identificador | ID | Elemento | Estado del identificador | ID | Elemento | Estado del identificador |
|---|---|---|---|---|---|---|---|---|
| F-01° | **I-081** | Verificado (histórico) | F-18° | **I-027** | Verificado (vigente) | F-35° | **I-012** | Verificado (vigente) |
| F-02° | **I-082** | Verificado (histórico) | F-19° | **I-028** | Verificado (vigente) | F-36° | **I-030** | Verificado (vigente) |
| F-03° | **I-083** | Verificado (resuelto en `dev`) | F-20° | **I-025** | Verificado (vigente) | F-37° | **I-080** | Verificado (control positivo) |
| F-04° | **I-084** | Verificado (hecho Git) | F-21° | **I-025** | Verificado (vigente) | F-38° | **I-078** | Verificado (control positivo) |
| F-05° | **I-085** | Verificado (vigente) | F-22° | **I-029** | Verificado (vigente) | F-39° | **I-035** | Verificado (vigente) |
| F-06° | **I-086** | Verificado (contexto) | F-23° | **I-070** | Verificado (resuelto) | F-40° | **I-035** | Verificado (vigente) |
| F-07° | **I-043** | Verificado (parcial en infra) | F-24° | **I-002** | Verificado (vigente P0) | F-41° | **I-036** | Verificado (vigente) |
| F-08° | **I-035** | Verificado (vigente) | F-25° | **I-041** | Verificado (vigente) | F-42° | **I-037** | Verificado (parcial) |
| F-09° | **I-035** | Verificado (vigente) | F-26° | **I-008** | Verificado (vigente) | F-43° | **I-038** | Verificado (vigente) |
| F-10° | **I-031** | Verificado (vigente) | F-27° | **I-003** | Verificado (vigente P0) | F-44° | **I-039** | Verificado (vigente) |
| F-11° | **I-087** | Verificado (resuelto) | F-28° | **I-010** | Verificado (vigente) | F-45° | **I-042** | Verificado (vigente) |
| F-12° | **I-024** | Verificado (vigente) | F-29° | **I-009** | Verificado (vigente) | F-46° | **I-066** | **No verificado** |
| F-13° | **I-026** | Verificado (parcial) | F-30° | **I-007** | Verificado (parcial) | F-47° | **I-067** | **No verificado** |
| F-14° | **I-068** | Verificado (histórico; sub-verificación runtime en I-068) | F-31° | **I-013** | Verificado (vigente) | F-48° | **I-033** | Verificado (vigente) |
| F-15° | **I-023** | Verificado (vigente) | F-32° | **I-071** | Verificado (resuelto) | F-49° | **I-079** | Verificado (control positivo) |
| F-16° | **I-023** | Verificado (vigente) | F-33° | **I-088** | Verificado (resuelto) | | | |
| F-17° | **I-032** | Verificado (vigente) | F-34° | **I-011** | Verificado (vigente) | | | |

### 4.2 Serie `R-01`…`R-16` (16 identificadores, todos `°`)

| ID | Elemento | Estado del identificador | ID | Elemento | Estado del identificador |
|---|---|---|---|---|---|
| R-01° | **I-001** | Verificado (estático; P0) | R-09° | **I-043** | Verificado (vigente) |
| R-02° | **I-016** | **Probable** | R-10° | **I-001** | Verificado (estático; P0) |
| R-03° | **I-013** | Verificado (vigente) | R-11° | **I-015** | Verificado (vigente) |
| R-04° | **I-004** | Verificado (vigente P0) | R-12° | **I-007** | Verificado (parcial) |
| R-05° | **I-005** | Verificado (vigente) | R-13° | **I-006** | Verificado (vigente) |
| R-06° | **I-014** | Verificado (config) | R-14° | **I-010** | Verificado (vigente) |
| R-07° | **I-060** | Verificado (vigente) | R-15° | **I-035** | Verificado (vigente) |
| R-08° | **I-002** | Verificado (vigente P0) | R-16° | **I-085** | Verificado (vigente) |

### 4.3 Serie `S-01`…`S-10` (10 identificadores, todos `°`)

| ID | Elemento | Estado del identificador | ID | Elemento | Estado del identificador |
|---|---|---|---|---|---|
| S-01° | **I-070** | Verificado (fortaleza) | S-06° | **I-074** | Verificado (fortaleza) |
| S-02° | **I-071** | Verificado (fortaleza) | S-07° | **I-075** | Verificado (fortaleza) |
| S-03° | **I-072** | Verificado (fortaleza) | S-08° | **I-076** | Verificado (fortaleza) |
| S-04° | **I-073** | Verificado (fortaleza) | S-09° | **I-077** | Verificado (fortaleza) |
| S-05° | **I-073** | Verificado (fortaleza) | S-10° | **I-078** | Verificado (fortaleza) |

### 4.4 Serie `H-01`…`H-14` (14 identificadores, todos `°`)

| ID | Elemento | Estado del identificador | ID | Elemento | Estado del identificador |
|---|---|---|---|---|---|
| H-01° | **I-070** | Verificado (resuelto) | H-08° | **I-071** | Verificado (resuelto) |
| H-02° | **I-009** | Verificado (vigente) | H-09° | **I-034** | **Verificado en 0.4 (↗)** |
| H-03° | **I-040** | **Verificado en 0.4 (↗)** | H-10° | **I-035** | Verificado (vigente) |
| H-04° | **I-038** | Verificado (vigente) | H-11° | **I-023** | Verificado (vigente) |
| H-05° | **I-041** | Verificado (vigente) | H-12° | **I-022** | **Verificado en 0.4 (↗)** |
| H-06° | **I-090** | **Refutado en 0.4 (↗)** | H-13° | **I-087** | Verificado (resuelto) |
| H-07° | **I-039** | Verificado (vigente) | H-14° | **I-088** | Verificado (resuelto) |

### 4.5 Serie `C-01`…`C-15` (15 identificadores, todos `°`)

| ID | Elemento | Estado del identificador | ID | Elemento | Estado del identificador |
|---|---|---|---|---|---|
| C-01° | **I-043** | Verificado (vigente en docs) | C-09° | **I-025** | Verificado (vigente) |
| C-02° | **I-043** | Verificado (modificado en infra) | C-10° | **I-026** | Verificado (parcial) |
| C-03° | **I-071** | Verificado (resuelto) | C-11° | **I-028** | Verificado (vigente) |
| C-04° | **I-091** | **Verificado en 0.4 (benigno, ↗)** | C-12° | **I-045** | Verificado (vigente) |
| C-05° | **I-070** | Verificado (resuelto) | C-13° | **I-069** | **No verificado** |
| C-06° | **I-014** | Verificado (config) | C-14° | **I-017** | **Mixto** (verificado en código / refutado en sobrescritura / no verificado en despliegue real) |
| C-07° | **I-021** | **Verificado en 0.4 (↗)** | C-15° | **I-088** | Verificado (resuelto) |
| C-08° | **I-013** | Verificado (vigente) | | | |

### 4.6 Serie `P-01`…`P-26` (26 identificadores: 12 `°` del paso 0.3 + 14 `†` incorporados en el paso 0.4)

| ID | Elemento | Estado técnico (130 IDs) | Clasif. funcional P | ID | Elemento | Estado técnico (130 IDs) | Clasif. funcional P |
|---|---|---|---|---|---|---|---|
| P-01° | **I-044** | Verificado (hueco) | A + C | P-14† | **I-055** | Verificado en 0.4 | A + C |
| P-02° | **I-045** | Verificado (hueco) | A + C | P-15† | **I-019** | Verificado en 0.4 | A + C |
| P-03° | **I-046** | Verificado (ausencia) | A + C | P-16† | **I-056** | Verificado en 0.4 | A + C (anclada en RN-AUD-15) |
| P-04° | **I-047** | Verificado (ausencia) | A + C | P-17† | **I-057** | Verificado en 0.4 | A + C |
| P-05° | **I-048** | Verificado | A + C (sobre RBAC aprobado) | P-18† | **I-058** | Verificado en 0.4 | A + C |
| P-06° | **I-049** | Verificado | A + C (sobre RBAC aprobado) | P-19† | **I-059** | Verificado en 0.4 | A + C |
| P-07° | **I-089** | **Refutado en 0.4 (↗)** | **Refutado** | P-20† | **I-060** | Verificado en 0.4 | A + C |
| P-08° | **I-018** | **Verificado en 0.4 (↗)** | A + C | P-21† | **I-061** | Verificado en 0.4 | A + C |
| P-09° | **I-050** | **Verificado en 0.4 (↗)** | A + C | P-22† | **I-020** | Verificado en 0.4 | A + C |
| P-10° | **I-051** | **Verificado en 0.4 (↗)** | A + **D** | P-23† | **I-062** | Verificado en 0.4 | A + C |
| P-11° | **I-052** | **Verificado en 0.4 (↗)** | A + **D** | P-24† | **I-063** | Verificado en 0.4 | A + **D** |
| P-12° | **I-053** | **Verificado en 0.4 (↗)** | A + **D** | P-25† | **I-064** | Verificado en 0.4 | A + C |
| P-13† | **I-054** | Verificado en 0.4 | A + C | P-26† | **I-065** | Verificado en 0.4 | A + **D** |

**Control de cobertura:** `49 + 16 + 10 + 14 + 15 + 26 = 130/130` identificadores trazados. Cada uno de los 130 identificadores mapea a un único elemento consolidado entre `I-001` y `I-091`, y cada uno de los 91 elementos consolidados tiene al menos un identificador de origen.

---

## 5. Clasificación de propuestas funcionales (P-01 a P-26) y decisiones pendientes

### 5.1 Criterio de separación entre reglas existentes (`RN-AUD-*`) y propuestas nuevas (`P-01`…`P-26`)

1. **Reglas de negocio existentes aprobadas (`RN-AUD-*`):** documentadas en `DXC-2026-005` §7, ya están aprobadas e implementadas en el código y en los triggers/constraints de la base de datos.
2. **Propuestas pendientes de validación (`P-01`…`P-26`):** provienen de `DXC-2026-005` §8, cuyo encabezado establece expresamente que *"deben ser validadas por el responsable del negocio antes de implementarse"*. Además, las carpetas `02_consultas_tecnicas/`, `03_decisiones/` y `05_roadmap/` están vacías (no existen documentos `DEC-*`).
3. **Categorías de evaluación funcional:**
   - **A:** Comportamiento técnico actual comprobado en código/BD.
   - **B:** Requisito funcional aprobado y no implementado (**0 casos** en todo `P-01`…`P-26`).
   - **C:** Propuesta nueva no aprobada (**20 casos**).
   - **D:** Propuesta cuya pertenencia al alcance del sistema está sin determinar (**5 casos**: `P-10`, `P-11`, `P-12`, `P-24`, `P-26`).

### 5.2 Matriz de clasificación de `P-01`…`P-26` (con resumen `S-3` aplicado)

| ID | Elem. | Clasificación | Comentario de trazabilidad y relación con reglas existentes |
|---|---|---|---|
| **P-01** | I-044 | **A + C** | `min_length=4` comprobado; la política de contraseñas es propuesta nueva no aprobada (choca con el hecho del seed compartido en `I-002`). |
| **P-02** | I-045 | **A + C** | Ausencia de rotación comprobada; el procedimiento de rotación es propuesta no aprobada. |
| **P-03** | I-046 | **A + C** | Ausencia de blacklist comprobada; el modelo de sesión multi-dispositivo es propuesta no aprobada. |
| **P-04** | I-047 | **A + C** | Reapertura solo por SQL comprobada; un endpoint o flujo de reapertura es propuesta (la consola SQL puede ser procedimiento legítimo, no defecto). |
| **P-05** | I-048 | **A + C** | RBAC actual comprobado y correcto según el marco aprobado (`RN-AUD-*`); ampliar acceso del rol logístico al historial es propuesta no aprobada. |
| **P-06** | I-049 | **A + C** | RBAC actual comprobado sobre el marco aprobado (`RN-AUD-*`); restringir estados modificables por logística es propuesta no aprobada. |
| **P-07** | I-089 | **Refutado** | La incoherencia citada ya no existe tras `R-07` (`GET /productos` y `GET /productos/{id}` usan ambos `STAFF_INTERNO`). |
| **P-08** | I-018 | **A + C** | Comportamiento de la consulta (`SUM` sin filtro `tipo_movimiento`) comprobado; la regla deseada de filtrar o desglosar es propuesta nueva no aprobada (`S-6`). |
| **P-09** | I-050 | **A + C** | Esquema de `deposito_alquiler` comprobado; el modelo de conciliación/devolución es propuesta no aprobada. |
| **P-10** | I-051 | **A + D** | Ausencia de entidad fiscal comprobada; **si el SGA debe emitir facturación está sin determinar en el alcance** (no asumir facturación electrónica). |
| **P-11** | I-052 | **A + D** | Ausencia de campos de IVA/descuentos comprobada; **pertenencia al alcance sin determinar**. |
| **P-12** | I-053 | **A + D** | Renovación manual comprobada; **pertenencia de recargos por retraso al alcance sin determinar**. |
| **P-13** | I-054 | **A + C** | Solo `stock_total`/`stock_alquilado` comprobado; conteo cíclico/merma es propuesta no aprobada. |
| **P-14** | I-055 | **A + C** | Cálculo en días calendario comprobado; el calendario laboral/festivos es propuesta no aprobada. |
| **P-15** | I-019 | **A + C** | Tarifa hardcodeada en cliente (`15000`) comprobada (con riesgo técnico de falta de validación server-side); su parametrización en BD/config es propuesta no aprobada. |
| **P-16** | I-056 | **A + C** | Se ancla en la regla **aprobada `RN-AUD-15`** (trigger que prohíbe borrar producto con stock en obra, implementada en `02_funciones_y_triggers.sql:84,216`); el flujo alternativo de baja es propuesta nueva no aprobada (`S-6`). |
| **P-17** | I-057 | **A + C** | Ausencia de purga/partición comprobada; la política de retención de `auditoria_sistema` es propuesta no aprobada. |
| **P-18** | I-058 | **A + C** | Ausencia de `FOR UPDATE` comprobada; la política de reserva/concurrencia es propuesta no aprobada. |
| **P-19** | I-059 | **A + C** | Ausencia de trazabilidad de denegaciones en UI comprobada; registrarla es propuesta de baja prioridad no aprobada. |
| **P-20** | I-060 | **A + C** | Ausencia de OpenAPI versionado comprobada; el esquema de versionado de contrato es propuesta técnica no aprobada. |
| **P-21** | I-061 | **A + C** | Ausencia de runbooks comprobada; redactarlos es propuesta operativa no aprobada. |
| **P-22** | I-020 | **A + C** | Hardcodeo de `2` días comprobado; convertirlo en parámetro configurable es propuesta no aprobada. |
| **P-23** | I-062 | **A + C** | `SERIAL` técnico comprobado; la numeración comercial de contratos es propuesta no aprobada. |
| **P-24** | I-063 | **A + D** | Ausencia de dimensión de sede comprobada; **multisucursal sin determinar en alcance** (no asumir). |
| **P-25** | I-064 | **A + C** | `VARCHAR(100)` libre comprobado; el catálogo normalizado de barrios es propuesta no aprobada. |
| **P-26** | I-065 | **A + D** | Enum `tipo_documento` comprobado; **las reglas fiscales por tipo de documento dependen de la determinación de alcance de facturación**. |

> **Resumen (`S-3`):** categoría `B` (requisito aprobado y no implementado) = **0** · **20** propuestas nuevas no aprobadas (`C`) · **5** casos con pertenencia al alcance sin determinar (`D`: `P-10`, `P-11`, `P-12`, `P-24`, `P-26`) · **1** refutado (`P-07`). Todas las `RN-AUD-*` están aprobadas e implementadas; ninguna aprueba las propuestas de §8. `P-16` se ancla en la regla aprobada `RN-AUD-15`; `P-05`/`P-06` en el marco RBAC aprobado — la aprobación de la regla existente no se extiende a las propuestas nuevas.

### 5.3 Catálogo de las 25 decisiones pendientes (alternativas identificadas, no elegidas)

| Elemento | Origen | Decisión requerida | Clasif. | Alternativas identificadas (sin elegir) |
|---|---|---|---|---|
| **I-044** | P-01 | Política de contraseñas | A + C | (a) Longitud 8+ con complejidad; (b) solo longitud larga sin complejidad (NIST); (c) con expiración; (d) rotación forzada en el seed |
| **I-045** | P-02, C-12 | Rotación de `JWT_SECRET_KEY` y credenciales | A + C | (a) Rotación manual programada con doble clave; (b) rotación automática periódica; (c) claves por entorno; (d) sin rotación documentando el riesgo |
| **I-046** | P-03 | Revocación de tokens | A + C | (a) Blacklist en BD por sesión; (b) tokens cortos + refresh; (c) sin revocación (aceptar TTL 480 min) |
| **I-047** | P-04 | Reapertura de alquileres | A + C | (a) Endpoint admin con auditoría; (b) procedimiento documentado por consola SQL con registro; (c) prohibición absoluta |
| **I-048** | P-05 | Rol logístico ↔ historial | A + C | (a) Acceso total al historial; (b) historial acotado a estados operativos; (c) mantener exclusión actual |
| **I-049** | P-06 | Estados modificables por logística | A + C | (a) Solo estados operativos (`activo`/`recogido`); (b) todos menos `cancelado`; (c) mantener `STAFF_INTERNO` completo |
| **I-050** | P-09 | Modelo del depósito | A + C | (a) Columnas de estado+fecha en `alquiler`; (b) tabla de conciliación; (c) derivarlo de auditoría |
| **I-051** | P-10 | Facturación | A + **D** | (a) Fuera de alcance; (b) comprobante interno no fiscal; (c) factura electrónica; (d) integración externa |
| **I-052** | P-11 | Descuentos/IVA | A + **D** | (a) Fuera de alcance inicial; (b) tabla de conceptos con historial; (c) campos en `precio_alquiler` con motivo obligatorio |
| **I-053** | P-12 | Recargos por retraso | A + **D** | (a) Sin recargo (fuera de alcance); (b) cálculo automático en renovación; (c) recargo manual con motivo |
| **I-054** | P-13 | Inventario físico | A + C | (a) Tabla de movimientos/mermas; (b) conteos cíclicos con auditoría; (c) solo ajuste manual administrativo |
| **I-055** | P-14 | Días hábiles/festivos | A + C | (a) Mantener días calendario; (b) catálogo de festivos configurable; (c) calendario laboral |
| **I-056** | P-16 | Baja de producto con stock en obra | A + C | (a) Baja lógica con stock bloqueado; (b) traslado a "repuestos"; (c) mantener solo bloqueo `RN-AUD-15` hasta devolución |
| **I-057** | P-17 | Retención de auditoría | A + C | (a) Particionado por mes; (b) archivado a tabla fría; (c) purga con exportación; (d) sin política por ahora |
| **I-058** | P-18 | Concurrencia de stock | A + C | (a) `FOR UPDATE` + reintento; (b) reserva optimista; (c) aceptar el 400 del trigger con UX clara |
| **I-059** | P-19 | Trazabilidad de denegaciones en front | A + C | (a) Evento de auditoría en backend ante intento; (b) telemetría de UI; (c) no registrar |
| **I-060** | R-07, P-20 | Contrato de API | A + C | (a) OpenAPI versionado en repo; (b) generación automática en CI; (c) solo changelog de breaking changes |
| **I-061** | P-21 | Escalamiento de incidentes | A + C | (a) Runbooks por severidad; (b) un solo runbook operativo; (c) integrar con `I-042` (gobernanza) |
| **I-062** | P-23 | Numeración de contratos | A + C | (a) Mantener `SERIAL` técnico; (b) campo `numero_contrato` con secuencia anual; (c) comprobante PDF numerado |
| **I-063** | P-24 | Multi-sucursal | A + **D** | (a) Fuera de alcance (monosede); (b) tabla `sucursal` + FK; (c) multi-tenant completo |
| **I-064** | P-25 | Catálogo de barrios | A + C | (a) Texto libre con sanitización; (b) autocompletado sugerido; (c) tabla `barrio` normalizada |
| **I-065** | P-26 | Reglas por tipo de documento | A + **D** | (a) Dejar enum simple actual; (b) validadores de formato en front/back; (c) reglas fiscales condicionadas a `I-051` |
| **I-043** | F-07, R-09, C-01, C-02 | Destino de despliegue | Decisión arq. | (a) Docker Compose self-hosted; (b) Docker + orquestador; (c) PaaS con Dockerfile |
| **I-035** | F-08, F-09, F-39, F-40, R-15, H-10 | Destino de `docs/` vacíos (6×0 B) | Decisión doc. | (a) Rellenar con contenido; (b) eliminar placeholders de 0 B; (c) consolidar en `docs/gestion_proyecto/` |
| **I-034** | H-09 | Vistas del dashboard (`06_vistas_dashboard.sql`) | Decisión arq. | (a) Exponer endpoints; (b) eliminar vistas sin uso; (c) diferir a módulo futuro de reportes |

 *(Además, `I-018` [`P-08`] contiene la decisión funcional tipo `A + C` sobre si el resumen semanal de gastos debe filtrar solo `GASTO` o desglosar `ENTREGA`/`RECOGIDA`).*

---

## 6. Verificaciones pendientes

| Verificación pendiente | Elemento(s) | Categoría | Dependencias y limitaciones |
|---|---|---|---|
| Prueba en runtime de `GET /usuarios` y `GET /usuarios/{id}` (confirmar exposición de `contrasena_usuario`) | **I-001** (`R-01`, `R-10`) | Ejecución (API levantada) | Requiere autorización para levantar servidor; el análisis estático de flujo ya está verificado (P0) |
| Prueba de arranque del contenedor backend: `alembic upgrade head` vs BD inicializada por scripts SQL | **I-016** (`R-02`) | Ejecución (Docker/entrypoint) | Requiere autorización; depende también de la decisión sobre fuente única de esquema y despliegue (`I-043`) |
| Prueba de comportamiento en ejecución del job 00:05 (`APScheduler`) con `uvicorn --workers 2` | **I-014** (`R-06`, `C-06`) | Ejecución (runtime) | Requiere autorización de ejecución |
| Consulta a GitHub sobre protección de ramas, checks obligatorios, PRs, issues, etiquetas y milestones | **I-066** (`F-46`), **I-067** (`F-47`) | Red / API de GitHub (`gh api`) | Metadatos exclusivos de GitHub; sin acceso de red/API en modo solo lectura local |
| Ejecución real de `lint`, `typecheck` y `build` en backend y frontend | **I-068** (`F-14` sub-afirmación) | Ejecución local | Requiere autorización para ejecutar comandos de build/lint |
| Verificación en ejecución del entorno real de despliegue (incl. hibernación si se usara Render y variables del entorno desplegado) | **I-069** (`C-13`), **I-017** (`C-14` despliegue real) | Entorno externo / runtime | Condicionado a la decisión de destino de despliegue (`I-043`) y autorización de ejecución |
| Auditoría dinámica de vulnerabilidades en dependencias (`pip-audit` y `npm audit`) | **I-031** (`F-10`) | Ejecución + red | Requiere autorización de red y ejecución |
| Re-consulta en vivo de `origin/dev` en GitHub | Contexto general | Red (`git ls-remote` / `git fetch`) | La identidad `origin/dev = 12760d4` se apoya en `EVD-2026-001` (2026-10-28 10:59) |

---

## 7. Estado definitivo de C-14 (I-017)

Conforme a la conclusión aprobada del paso 0.3 (`EVD-2026-002` §9.1) y ratificada en `AUD-2026-005` (§5) y `AUD-2026-006`, el hallazgo `C-14` (`I-017`) conserva su clasificación **Mixta** desglosada en cuatro dimensiones verificables:

1. **Hecho en código — Verificado:** `sga_backend_jwt/app/config/settings.py:3,6` importa `from dotenv import load_dotenv` e invoca `load_dotenv()` sin pasar `override=True`; además, `sga_backend_jwt/.dockerignore:15-17` excluye `.env` y `.env.*` del contexto de imagen Docker (`S-04` / `I-073`).
2. **Comportamiento de `python-dotenv` — Verificado:** `sga_backend_jwt/requirements.txt:18` fija `python-dotenv==1.2.3` y el código instalado en `sga_backend_jwt/venv/Lib/site-packages/dotenv/main.py:97-110, 388-395` define `override: bool = False` por omisión (`if k in os.environ and not self.override: continue`), por lo que las variables ya presentes en `os.environ` **no son sobrescritas**.
3. **Afirmación histórica de sobrescritura (*«sobrescribe variables del panel»*, `DXC-2026-006` L456) — Refutada:** queda descartada con evidencia estática (no es «Probable» y no requiere volver a inspeccionar `venv` ni `pip show`). Un archivo `.env` solo poblaría variables que no estén definidas previamente en `os.environ`.
4. **Comportamiento del despliegue real — No verificado en ejecución:** la revisión estática del código y de la biblioteca no prueba cómo está configurado un entorno productivo en ejecución (único componente pendiente, clasificado con prioridad menor `P3`).

---

## 8. Limitaciones y dependencias

### 8.1 Limitaciones metodológicas

- **Sin ejecución en tiempo de ejecución (runtime):** por mandato estricto de solo lectura, no se levantaron contenedores Docker, ni servidores FastAPI/Vite, ni se ejecutaron migraciones, linters, compiladores o pruebas.
- **Sin consultas de red ni API de GitHub:** no se consultó la API de GitHub (`F-46`, `F-47`) ni se ejecutaron auditorías dinámicas de paquetes (`pip-audit`, `npm audit`).
- **Alcance de la revisión sobre los diagnósticos `DXC`:** las revalidaciones del paso 0.4 resolvieron con lectura directa sobre el árbol `12760d4` los 12 identificadores que estaban pendientes desde el paso 0.3 y los 14 nuevos `P-13`…`P-26`, sin constituir una reescritura de los documentos históricos `DXC-2026-001` a `DXC-2026-006`.

### 8.2 Dependencias críticas entre elementos

- **Contención P0 inmediata (seguridad e integridad):** `I-001` (`R-01`/`R-10`, fuga de hashes bcrypt), `I-002` (`F-24`/`R-08`, credenciales en archivos versionados), `I-003` (`F-27`, rate limiting en login) e `I-004` (`R-04`, puertos en `0.0.0.0`) condicionan cualquier exposición del entorno.
- **Definición de fuente de verdad de esquema y despliegue:** `I-016` (`R-02`, Alembic en `entrypoint.sh` vs scripts SQL) e `I-043` (`R-09`, estrategia Docker vs Render/Vercel) requieren decisión arquitectónica antes de automatizar despliegues.
- **Red de seguridad para desarrollo asistido por IA:** `I-023` (pruebas automatizadas), `I-024` (calidad backend) e `I-025` (pipeline CI/CD) son prerrequisitos para validar objetivamente cambios futuros.
- **Línea base documental en Git:** toda la carpeta `docs/gestion_proyecto/` y `AGENTS.md` permanecen como archivos sin seguimiento (`untracked`); su incorporación al historial de Git (`I-035`) requiere autorización explícita de escritura Git por parte del usuario.

---

## 9. Procedencia de la información y registro de correcciones aplicadas

Para garantizar trazabilidad auditable entre las entregas de OpenCode y este documento definitivo, se registran las inconsistencias detectadas en el borrador inicial (`AUD-2026-004`) y cómo quedaron corregidas mediante `AUD-2026-005` y `AUD-2026-006`:

| ID de corrección | Inconsistencia en el borrador original (`AUD-2026-004`) | Corrección aplicada en `EVD-2026-003` (`AUD-2026-005` + `AUD-2026-006`) |
|---|---|---|
| **INC-1 / S-5** | El resumen preliminar declaraba 92 elementos consolidados, cuando las 8 matrices `B-1`…`B-8` suman exactamente **91 elementos** (`10 + 12 + 12 + 9 + 22 + 4 + 11 + 11 = 91`, último identificador `I-091`). | Se corrige la cifra a **91 elementos consolidados (`I-001`…`I-091`)** con numeración continua, sin elementos faltantes ni adicionales posteriores a `I-091`. |
| **INC-2** | `I-017` (`C-14`) aparecía como «Probable / pendiente de determinar» y listaba como verificación pendiente consultar `venv`/`pip show`. | Se alinea `I-017` con `EVD-2026-002` §9.1: **Mixto** (código y `python-dotenv==1.2.3` verificados con `override=False`; sobrescritura histórica refutada; despliegue real no verificado en ejecución) y se retira de §6 la verificación ya realizada sobre `venv`. |
| **INC-3 / S-1 / S-2 / S-4** | El resumen preliminar mezclaba unidades de conteo («110 verificados · 2 probables · 12 no verificados = 124») y la primera revisión tenía un desfase de 1 en el texto de identificadores («122» por sumar `109 + 14`) y una nota ambigua en los 83 elementos. | Se aplican íntegramente `S-1`, `S-2` y `S-4`: **130 identificadores** (`123 verificados · 1 probable · 3 no verificados · 2 refutados · 1 mixto`) y **91 elementos** (`83 verificados · 1 probable · 4 no verificados · 2 refutados · 1 mixto`). |
| **INC-4** | La sección F.2 proponía registrar `EVD-2026-002` en `00_indice.md` como pendiente del paso 0.3. | Descartado por obsoleto: `EVD-2026-002` ya estaba registrado en `00_indice.md` (§7). Solo se agrega la referencia a `EVD-2026-003`. |
| **INC-5 / S-6** | `I-018` (`P-08`) se rotulaba como defecto con prioridad `Medio → Medio`. | Se aplica `S-6`: naturaleza corregida a *«comportamiento técnico comprobado (`A`) + propuesta de regla nueva no aprobada (`C`)»*, sin prioridad propuesta hasta que el negocio defina la regla. |
| **INC-6 / S-6** | Se proponían prioridades firmes («Alto»/«Medio»/«P3») para funcionalidades de alcance indeterminado (`I-051`, `I-052`, `I-053`, `I-063`, `I-065`). | Se aplica `S-6`: las 5 propuestas `D` (`P-10`, `P-11`, `P-12`, `P-24`, `P-26`) quedan con prioridad **condicionada a determinación de alcance**, conservando la etiqueta del DXC solo como referencia histórica. |
| **INC-7 / S-3 / S-6** | Las decisiones funcionales no distinguían entre requisitos aprobados (`B`), propuestas nuevas (`C`) y alcance sin determinar (`D`), y el primer recuento anotaba 21 en `C`. | Se aplica `S-3` y `S-6`: `0` en `B`, **20** propuestas nuevas no aprobadas (`C`), **5** de pertenencia al alcance sin determinar (`D`) y **1** refutada (`P-07`), distinguiendo explícitamente las reglas `RN-AUD-*` ya aprobadas e implementadas (como `RN-AUD-15` en `P-16` y el marco RBAC en `P-05`/`P-06`) de las propuestas nuevas. |

---

## 10. Declaración de operaciones realizadas

- **Operaciones Git:** exclusivamente de solo lectura (`rev-parse --show-toplevel`, `branch --show-current`, `rev-parse HEAD`, `status --short`). No se ejecutó `git add`, `git commit`, `git push`, `git merge`, `git reset`, `git checkout` ni ninguna otra operación Git de escritura.
- **Código, entorno y configuración:** no se modificó código backend ni frontend, ni base de datos, ni migraciones, ni dependencias, ni archivos `.env` o de configuración.
- **Archivos documentales creados o modificados:**
  1. Creado `docs/gestion_proyecto/06_evidencias/EVD-2026-003_inventario_unico_hallazgos_fase0_paso04.md` (este documento).
  2. Actualizado `docs/gestion_proyecto/00_indice.md` únicamente para registrar la referencia a `EVD-2026-003` en la tabla de la sección `7. Evidencias` (sin duplicar `EVD-2026-002`).
  3. Intactos `AGENTS.md`, `AUD-2026-001` a `AUD-2026-006`, `EVD-2026-001`, `EVD-2026-002`, `DXC-2026-001` a `DXC-2026-006` y demás archivos del repositorio.
- **Seguridad:** no se reprodujeron contraseñas, hashes completos, tokens ni secretos en este documento.

> **Estado del paso 0.4:** inventario único consolidado registrado en `EVD-2026-003` y referenciado en `00_indice.md`. **No se declara el paso 0.4 formalmente cerrado por cuenta propia ni se han iniciado pasos posteriores**; queda a la espera de la revisión y aprobación explícita del usuario.
