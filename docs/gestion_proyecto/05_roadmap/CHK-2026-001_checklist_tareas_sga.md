# CHK-2026-001 — Checklist de Tareas Documentales del Proyecto SGA

> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git`
> **Fuente de verdad:** `SGA_repo/SGA` · rama `dev` · línea base verificada `c100a78f53a61828bec1c17aff4c9e2017336c1b`
> **Fecha de elaboración:** 2026-10-31
> **Naturaleza:** documento vivo de seguimiento operativo, versionado mediante Git
> **Estado:** en revisión por el propietario (sin commit)
> **Matriz asociada:** [`MAT-2026-001_matriz_maestra_documental.md`](MAT-2026-001_matriz_maestra_documental.md)
> **Evidencia de hallazgos:** [`EVD-2026-003`](../06_evidencias/EVD-2026-003_inventario_unico_hallazgos_fase0_paso04.md)
> **Índice de gobierno:** [`00_indice.md`](../00_indice.md)

---

## ÍNDICE

1. [Alcance y reglas de uso](#1-alcance-y-reglas-de-uso)
2. [Resumen de progreso](#2-resumen-de-progreso)
3. [Tareas completadas](#3-tareas-completadas)
4. [Etapa 1 — Documentación existente junto al código](#4-etapa-1--documentación-existente-junto-al-código)
5. [Etapa 2 — Decisiones y roadmap](#5-etapa-2--decisiones-y-roadmap)
6. [Etapa 3 — Documentación técnica viva en `docs/`](#6-etapa-3--documentación-técnica-viva-en-docs)
7. [Etapa 4 — Documentación dependiente de definiciones técnicas](#7-etapa-4--documentación-dependiente-de-definiciones-técnicas)
8. [Etapa 5 — Placeholders restantes y binarios de diseño inicial](#8-etapa-5--placeholders-restantes-y-binarios-de-diseño-inicial)
9. [Decisiones y bloqueos que condicionan las tareas](#9-decisiones-y-bloqueos-que-condicionan-las-tareas)
10. [Historial de versiones](#10-historial-de-versiones)

---

## 1. Alcance y reglas de uso

**Alcance.** Esta checklist contiene **exclusivamente** las 18 tareas documentales existentes `RM-DOC-001`…`RM-DOC-018`. No añade tareas nuevas, no renumera las existentes y **no sustituye** al futuro roadmap de correcciones técnicas (`RDM-2026-001`, pendiente de creación).

> [!IMPORTANT]
> La agrupación por etapas es una organización de lectura derivada de las dependencias verificadas. **No constituye un roadmap aprobado.**

**Casillas**

| Casilla | Significado |
|---|---|
| `[ ]` | Pendiente. |
| `[x]` | Completada, verificada y con evidencia de cierre. |

**Estado textual** (campo *Estado* de cada tarea; no se usa `[-]`)

| Estado | Significado |
|---|---|
| Completada | Cerrada con evidencia verificable. |
| Pendiente — lista para iniciar | Sin dependencia no satisfecha; requiere autorización de ejecución. |
| Pendiente — dependiente de tareas | Requiere que otras tareas `RM-DOC` terminen antes. |
| Pendiente — condicionada por decisión | Requiere una decisión del propietario o una definición técnica aún no resuelta (ver sección 9). |

**Reglas**

1. Responsable: `Pendiente de asignación` en todas las tareas (no existe asignación previa verificada).
2. Una tarea solo pasa a `[x]` cuando todos sus criterios de aceptación se cumplen y su evidencia de cierre está registrada.
3. La prioridad es la propuesta por la auditoría documental y por `EVD-2026-003`; no es una priorización aprobada de roadmap.
4. Las rutas de documentos futuros se escriben como texto de código; no son enlaces.
5. Las rutas, identificadores `DOC-*` y estados coinciden con los de [`MAT-2026-001`](MAT-2026-001_matriz_maestra_documental.md). Si difieren, prevalece la verificación en el repositorio y ambos documentos se corrigen.
6. Ningún documento producido por estas tareas debe incluir contraseñas, hashes completos ni tokens.

---

## 2. Resumen de progreso

| Concepto | Cantidad |
|---|---:|
| Tareas totales (`RM-DOC-001`…`RM-DOC-018`) | 18 |
| Completadas | 2 (`RM-DOC-002`, `RM-DOC-003`) |
| Pendientes | 16 |
| — lista para iniciar | 5 (`RM-DOC-005`, `RM-DOC-008`, `RM-DOC-010`, `RM-DOC-014`, `RM-DOC-017`) |
| — condicionada por decisión | 4 (`RM-DOC-001`, `RM-DOC-009`, `RM-DOC-013`, `RM-DOC-016`) |
| — dependiente de tareas | 7 (`RM-DOC-004`, `RM-DOC-006`, `RM-DOC-007`, `RM-DOC-011`, `RM-DOC-012`, `RM-DOC-015`, `RM-DOC-018`) |
| Con responsable «Pendiente de asignación» | 18 |

---

## 3. Tareas completadas

- [x] **RM-DOC-002 — Sincronización del índice maestro de gestión**
  - **Actividad:** sincronizar `docs/gestion_proyecto/00_indice.md` con los documentos creados en la Fase 0 (auditorías `AUD-2026-004`…`006`, evidencias `EVD-2026-002`…`003`, `AGENTS.md`).
  - **Documentos:** `DOC-OF-15` · `docs/gestion_proyecto/00_indice.md`
  - **Hallazgos:** `I-035`
  - **Prioridad:** P1
  - **Dependencias:** ninguna
  - **Responsable:** Pendiente de asignación
  - **Estado:** Completada
  - **Criterios de aceptación:**
    1. El árbol de §1, la tabla de auditorías (§2), la de evidencias (§7) y la de documentos versionados (§8) del índice listan los documentos creados en Fase 0.
    2. Los enlaces relativos del índice apuntan a archivos existentes.
  - **Evidencia de cierre:** commit `c100a78f53a61828bec1c17aff4c9e2017336c1b`. Verificado el 2026-10-31: `git show --name-only` de ese commit incluye `docs/gestion_proyecto/00_indice.md`.
  - **Nota de mantenimiento:** la cabecera del índice (L4 y L6) conservaba el estado previo al commit; su corrección figura en la intervención que incorpora `MAT-2026-001` y `CHK-2026-001` y no reabre esta tarea.

- [x] **RM-DOC-003 — Commit documental de línea base de Fase 0**
  - **Actividad:** versionar en `dev` la línea base documental de Fase 0 (`docs/gestion_proyecto/` y `AGENTS.md`).
  - **Documentos:** `DOC-OF-14`, `DOC-OF-15`, `DOC-OF-21`
  - **Hallazgos:** `I-035`
  - **Prioridad:** P1
  - **Dependencias:** `RM-DOC-002`
  - **Responsable:** Pendiente de asignación
  - **Estado:** Completada
  - **Criterios de aceptación:**
    1. Los 17 archivos documentales de Fase 0 (`AGENTS.md` y 16 archivos de `docs/gestion_proyecto/`) están versionados.
    2. Las tres carpetas vacías de gestión conservan su estructura mediante `.gitkeep`.
    3. No se versionaron archivos de código, `.env`, `venv/`, `node_modules/` ni `dist/`.
  - **Evidencia de cierre:** commit `c100a78f53a61828bec1c17aff4c9e2017336c1b` (`docs: consolidate phase 0 audit baseline`). Verificado el 2026-10-31: el commit contiene 20 archivos (`AGENTS.md`, `00_indice.md`, 6 `AUD`, 6 `DXC`, 3 `EVD` y 3 `.gitkeep`), y `AGENTS.md` figura como archivo rastreado.

---

## 4. Etapa 1 — Documentación existente junto al código

- [ ] **RM-DOC-008 — Actualización del `README.md` raíz**
  - **Actividad:** corregir el README raíz: versión de PostgreSQL, orden de carga de scripts SQL, usuarios de prueba y forma de inicio de sesión, y aviso de que el seed es solo para pruebas locales.
  - **Documentos:** `DOC-OF-01` · `README.md`
  - **Hallazgos:** `I-036`, `I-037`, `I-040`, `I-041`, `I-043`
  - **Prioridad:** P1
  - **Dependencias:** la sección de arranque con Docker Compose depende de la definición de `I-016`.
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — lista para iniciar (la sección Docker, condicionada a `I-016`)
  - **Criterios de aceptación:**
    1. La versión de PostgreSQL indicada coincide con la de `docker-compose.yml` (`postgres:16-alpine`) y con `database/README_base_de_datos.md`.
    2. La carga inicial de la BD no incluye `04_plantillas.sql`.
    3. El inicio de sesión se documenta con `email_usuario` o `telefono_usuario`, conforme a `LoginRequest` (`usuario_schema.py`); no se usa «Documento» como identificador de login.
    4. Ya no figuran los tres documentos (`100000001`…`100000003`) ni sus contraseñas, que no existen en `03_seed_data.sql`.
    5. Indica que las cuentas del seed son ficticias y exclusivas para pruebas locales.
    6. El README no contiene la contraseña ficticia ni hashes; remite al encabezado de `03_seed_data.sql`.
    7. Cualquier instrucción sobre Docker Compose está respaldada por un procedimiento verificado o marcada expresamente como no verificada.
    8. Los enlaces Markdown resuelven a archivos existentes.
  - **Evidencia de cierre:** pendiente.

- [ ] **RM-DOC-001 — Saneamiento documental de credenciales en `README_base_de_datos.md` e `INDICE.md`**
  - **Actividad:** aplicar la política que el propietario defina sobre la mención de la contraseña ficticia de prueba en `database/README_base_de_datos.md` (L46, L76) y `database/03_documentacion/INDICE.md` (L120).
  - **Documentos:** `DOC-OF-04`, `DOC-OF-05`
  - **Hallazgos:** `I-002` (`F-24`, `R-08`)
  - **Prioridad:** P0 según `EVD-2026-003`. La reclasificación a P2 propuesta en la auditoría P0.1 **no está aprobada**.
  - **Dependencias:** decisión del propietario sobre la política de mención (sección 9); se ejecuta en coordinación con `RM-DOC-006` y `RM-DOC-007` porque afecta a los mismos archivos.
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — condicionada por decisión
  - **Criterios de aceptación:**
    1. La política aplicada está registrada por escrito (aprobación expresa del propietario o `DEC-*`).
    2. La búsqueda de la contraseña ficticia y de cadenas con formato de hash bcrypt en `database/**/*.md` devuelve 0 coincidencias, o las coincidencias restantes están justificadas por la política aprobada.
    3. Ambos documentos indican que las cuentas del seed son ficticias y de uso local.
    4. `database/01_esquema/03_seed_data.sql` no cambia en sentencias SQL, datos, contraseñas ni hashes (el `git diff` de ese archivo solo contiene líneas de comentario).
  - **Evidencia de cierre:** pendiente.

- [ ] **RM-DOC-006 — Actualización del diccionario rápido de base de datos**
  - **Actividad:** alinear `database/03_documentacion/INDICE.md` con `01_tablas.sql`, `02_funciones_y_triggers.sql` y `06_vistas_dashboard.sql`.
  - **Documentos:** `DOC-OF-05` · `database/03_documentacion/INDICE.md`
  - **Hallazgos:** `I-038`, `I-034`, `I-079`
  - **Prioridad:** P1
  - **Dependencias:** `RM-DOC-001` (mismo archivo); `DXC-2026-002` como fuente de contraste.
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — dependiente de tareas
  - **Criterios de aceptación:**
    1. Documenta las 7 tablas definidas en `01_tablas.sql` (7 sentencias `CREATE TABLE`), incluida `logistica_alquiler_alquiler`.
    2. `logistica_alquiler` muestra `tipo_movimiento` y ya no contiene `es_recogida` (0 coincidencias en el archivo).
    3. `producto` incluye `unidad_minima_alquiler`.
    4. Referencia las funciones y los 19 triggers de `02_funciones_y_triggers.sql`.
    5. Referencia la vista `vw_dashboard_operativo` de `06_vistas_dashboard.sql`.
    6. La descripción del seed coincide con `03_seed_data.sql` (11 empleados, 10 clientes, 7 productos).
    7. La comparación columna por columna con `01_tablas.sql` no deja discrepancias.
  - **Evidencia de cierre:** pendiente.

- [ ] **RM-DOC-007 — Actualización de la guía de base de datos**
  - **Actividad:** actualizar `database/README_base_de_datos.md` con el estado real de los scripts, las vistas y las demos.
  - **Documentos:** `DOC-OF-04` · `database/README_base_de_datos.md`
  - **Hallazgos:** `I-002`, `I-034`, `I-038`, `I-032`
  - **Prioridad:** P1
  - **Dependencias:** `RM-DOC-001`, `RM-DOC-006`
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — dependiente de tareas
  - **Criterios de aceptación:**
    1. El árbol de `database/` incluye `06_vistas_dashboard.sql` y `06_demos_endpoints/` (`01`…`04`).
    2. El resumen del esquema habla de 7 tablas y ya no de 6.
    3. La descripción del seed coincide con `03_seed_data.sql` (11 empleados, 10 clientes, 7 productos).
    4. El orden de carga inicial es `01`, `02` y, opcionalmente, `03`; el estado de `04` y `05` es coherente con la decisión de `RM-DOC-016`.
    5. Cumple la política de credenciales definida en `RM-DOC-001`.
    6. Los enlaces Markdown resuelven a archivos existentes.
  - **Evidencia de cierre:** pendiente.

- [ ] **RM-DOC-014 — Actualización del README del frontend**
  - **Actividad:** actualizar `sga_frontend_jwt/README.md` con la estructura real de `src/` y el modo de construcción con Docker/Nginx.
  - **Documentos:** `DOC-OF-03` · `sga_frontend_jwt/README.md`
  - **Hallazgos:** `I-021`, `I-043`, `I-075`
  - **Prioridad:** P2
  - **Dependencias:** ninguna
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — lista para iniciar
  - **Criterios de aceptación:**
    1. El árbol de `src/` coincide con el sistema de archivos al momento de la edición: las 5 carpetas modulares de componentes (`alquilerComponents`, `alquilerDetalleComponents`, `gastosComponents`, `productosComponents`, `usuariosComponents`) y los archivos de `src/utils/`.
    2. Menciona `Dockerfile` y `nginx.conf`, que existen en `sga_frontend_jwt/`.
    3. La nota sobre CORS refleja que el origen se configura mediante `CORS_ORIGINS` en `settings.py`, no con una lista fija en `main.py`.
    4. Los comandos `npm` documentados corresponden a los scripts de `package.json`.
  - **Evidencia de cierre:** pendiente.

---

## 5. Etapa 2 — Decisiones y roadmap

- [ ] **RM-DOC-005 — Registro de decisiones de arquitectura y negocio**
  - **Actividad:** registrar en `docs/gestion_proyecto/03_decisiones/` cada decisión que el propietario apruebe expresamente, con el formato de decisión del índice (§10.3).
  - **Documentos:** `DOC-OF-20` · `docs/gestion_proyecto/03_decisiones/DEC-2026-NNN_slug_corto.md` (serie futura)
  - **Hallazgos:** `I-014`, `I-016`, `I-042`, `I-044`…`I-065`
  - **Prioridad:** P1
  - **Dependencias:** aprobación expresa del propietario para cada decisión.
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — lista para iniciar
  - **Criterios de aceptación:**
    1. Cada `DEC-2026-NNN` contiene fecha de aprobación, campo `Aprueba`, origen, estado, contexto, decisión, consecuencias y alternativas descartadas.
    2. Solo se registran decisiones con aprobación expresa; las recomendaciones de auditoría no se convierten en decisiones.
    3. Los identificadores son correlativos y no reutilizan ninguno existente.
    4. El índice (§4) lista cada `DEC-*` creado con un enlace válido.
  - **Evidencia de cierre:** pendiente.

- [ ] **RM-DOC-004 — Creación del roadmap oficial del proyecto SGA**
  - **Actividad:** elaborar el roadmap oficial `RDM-2026-001` con fases, dependencias y criterios de aceptación.
  - **Documentos:** `DOC-OF-18` · `docs/gestion_proyecto/05_roadmap/RDM-2026-001_roadmap_correccion_sga.md` (no existe)
  - **Hallazgos:** `I-035`; planificación de `I-001`…`I-091`
  - **Prioridad:** P1
  - **Dependencias:** `RM-DOC-005`; aprobación del contenido por el propietario.
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — dependiente de tareas (no iniciada; `MAT-2026-001` y `CHK-2026-001` no la sustituyen)
  - **Criterios de aceptación:**
    1. El archivo existe en `05_roadmap/` con el prefijo `RDM-` conforme al índice.
    2. Cada elemento `I-001`…`I-091` está asignado a una fase o marcado explícitamente como fuera de alcance.
    3. El propietario lo validó expresamente (no se presenta como aprobado antes).
    4. Está registrado en el índice (§6) con enlace válido.
  - **Evidencia de cierre:** pendiente.

---

## 6. Etapa 3 — Documentación técnica viva en `docs/`

- [ ] **RM-DOC-010 — Poblado del mapa de arquitectura**
  - **Actividad:** redactar `docs/architecture/architecture_map.md`, hoy vacío (0 B).
  - **Documentos:** `DOC-OF-06` · `docs/architecture/architecture_map.md`
  - **Hallazgos:** `I-035`, `I-043`, `I-074`, `I-076`, `I-079`
  - **Prioridad:** P1
  - **Dependencias:** ninguna
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — lista para iniciar
  - **Criterios de aceptación:**
    1. El archivo tiene contenido (más de 0 B).
    2. Describe las capas del sistema, los servicios de `docker-compose.yml` y el modo de desarrollo local.
    3. Las cifras (routers incluidos en `main.py`, endpoints, tablas, triggers) se verifican contra el código al redactar; al 2026-10-31: 7 routers, 38 endpoints, 7 tablas y 19 triggers.
    4. Describe el contexto de auditoría (`audit_context.py` y `fn_auditar_cambios()`).
    5. Indica que los diagramas PNG de `docs/architecture/` son históricos.
    6. No presenta como vigentes afirmaciones de `DXC-2026-001` sin verificarlas.
  - **Evidencia de cierre:** pendiente.

- [ ] **RM-DOC-012 — Creación del catálogo de reglas de negocio y matriz RBAC**
  - **Actividad:** crear la documentación independiente de reglas de negocio y RBAC (decisión n.º 4).
  - **Documentos:** `DOC-OF-08` · `docs/requirements/business_rules_rbac.md` (ruta propuesta; no existe)
  - **Hallazgos:** `I-018`…`I-020`, `I-044`…`I-065`, `I-078`, `I-079`
  - **Prioridad:** P1
  - **Dependencias:** `RM-DOC-005`; clasificación A/B/C/D de `EVD-2026-003`.
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — dependiente de tareas
  - **Criterios de aceptación:**
    1. Documenta la jerarquía de roles y la matriz de permisos por endpoint, coherentes con `app/utils/roles.py` y con los usos de `requiere_rol`.
    2. Documenta el ciclo de estados del alquiler y las reglas implementadas, con evidencia `archivo:línea`.
    3. Distingue estrictamente las reglas implementadas de las propuestas `P-*`, que no se presentan como requisitos.
    4. No duplica `DXC-2026-005`: lo cita como histórico.
  - **Evidencia de cierre:** pendiente.

- [ ] **RM-DOC-011 — Creación de la referencia viva de la API REST**
  - **Actividad:** documentar el contrato de los endpoints vigentes en `docs/architecture/api_reference.md`.
  - **Documentos:** `DOC-OF-07` · `docs/architecture/api_reference.md` (ruta propuesta; no existe)
  - **Hallazgos:** `I-022`, `I-060`, `I-072`, `I-077`, `I-078`
  - **Prioridad:** P1
  - **Dependencias:** `RM-DOC-010`
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — dependiente de tareas
  - **Criterios de aceptación:**
    1. El conjunto de endpoints coincide exactamente con los decoradores de `app/routes/` (38 al 2026-10-31); se comprueba mediante un recuento al redactar.
    2. Cada endpoint indica método, ruta, roles permitidos y formato de respuesta.
    3. Documenta el sobre de respuesta estándar y los códigos de error.
    4. No lista endpoints que no existan en el código (`DXC-2026-003` documenta 45).
  - **Evidencia de cierre:** pendiente.

- [ ] **RM-DOC-015 — Poblado de alcance funcional y casos de uso**
  - **Actividad:** redactar `docs/requirements/user_cases.md`, hoy vacío (0 B).
  - **Documentos:** `DOC-OF-09` · `docs/requirements/user_cases.md`
  - **Hallazgos:** `I-035`, `I-051`…`I-053`, `I-063`, `I-065`
  - **Prioridad:** P2
  - **Dependencias:** `RM-DOC-005`, `RM-DOC-012`
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — dependiente de tareas
  - **Criterios de aceptación:**
    1. El archivo tiene contenido (más de 0 B).
    2. Cada caso de uso corresponde a una funcionalidad existente, trazable a una ruta del backend o a una página del frontend.
    3. Los actores coinciden con los roles del sistema.
    4. Los elementos de clase `D` de `EVD-2026-003` (facturación, descuentos e IVA, recargos, multisucursal, reglas por tipo de documento) figuran como alcance pendiente de determinar, no como defectos ni como casos de uso.
    5. No incorpora propuestas `P-*` sin aprobación.
  - **Evidencia de cierre:** pendiente.

---

## 7. Etapa 4 — Documentación dependiente de definiciones técnicas

- [ ] **RM-DOC-009 — Actualización del README del backend y nota de `alembic/README`**
  - **Actividad:** actualizar `sga_backend_jwt/README.md` y la nota de `sga_backend_jwt/alembic/README`.
  - **Documentos:** `DOC-OF-02`, `DOC-OP-01`
  - **Hallazgos:** `I-016`, `I-037`, `I-043`, `I-070`, `I-071`, `I-091`
  - **Prioridad:** P1
  - **Dependencias:** decisión del propietario sobre el flujo de inicialización (`I-016`).
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — condicionada por decisión
  - **Criterios de aceptación:**
    1. El bloque `.env` incluye las cinco variables de `sga_backend_jwt/.env.example` (incluida `CORS_ORIGINS`).
    2. La versión de PostgreSQL es coherente con `docker-compose.yml`.
    3. El procedimiento de Alembic es coherente con `entrypoint.sh` (`alembic upgrade head`) o la divergencia está explicada y respaldada por la decisión registrada.
    4. El árbol de directorios incluye `Dockerfile`, `entrypoint.sh` y `.dockerignore`.
    5. `alembic/README` deja de ser texto boilerplate y describe `0001_initial_schema.py` o remite al README del backend.
  - **Evidencia de cierre:** pendiente.

- [ ] **RM-DOC-013 — Creación de la guía de despliegue, operación, seguridad y respaldos**
  - **Actividad:** crear la guía de despliegue y operación (documento independiente del de pruebas).
  - **Documentos:** `DOC-OF-11` · `docs/deployment/deployment_and_operations.md` (ruta propuesta; no existe; la carpeta `docs/deployment/` tampoco)
  - **Hallazgos:** `I-004`…`I-007`, `I-013`…`I-017`, `I-043`, `I-057`, `I-061`
  - **Prioridad:** P1
  - **Dependencias:** definiciones técnicas de `I-004`, `I-013`, `I-014` e `I-016`; autorización para crear la carpeta.
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — condicionada por decisión
  - **Criterios de aceptación:**
    1. Cada procedimiento (arranque, parada, variables de entorno, respaldo y restauración) está verificado mediante ejecución o marcado expresamente como no verificado.
    2. Los puertos publicados, el healthcheck y el número de workers reflejan el estado vigente tras las decisiones sobre `I-004`, `I-013` e `I-014`.
    3. Documenta el procedimiento de inicialización de la BD acordado en `I-016`.
    4. No incluye el protocolo de pruebas, que pertenece a `RM-DOC-017`.
    5. No contiene secretos.
  - **Evidencia de cierre:** pendiente.

- [ ] **RM-DOC-017 — Documentación del protocolo de verificación y ejecución de pruebas**
  - **Actividad:** documentar las verificaciones de calidad vigentes en un documento independiente del de despliegue.
  - **Documentos:** `DOC-OF-12` · `docs/testing/testing_and_qa.md` (**ruta propuesta; archivo pendiente de creación**; la carpeta `docs/testing/` tampoco existe)
  - **Hallazgos:** `I-023`, `I-024`, `I-025`, `I-032`, `I-068`
  - **Prioridad:** P2
  - **Dependencias:** la parte de pruebas automatizadas depende de `I-023`; autorización para crear la carpeta.
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — lista para iniciar (parte automatizada condicionada a `I-023`)
  - **Criterios de aceptación:**
    1. Documenta las verificaciones existentes: los cuatro scripts de `database/06_demos_endpoints/`, `npm run lint` y `npm run build`.
    2. Cada verificación indica si fue ejecutada y su resultado, o figura como no ejecutada.
    3. No describe suites automatizadas que no existan en el repositorio.
    4. Es independiente de `docs/deployment/deployment_and_operations.md`.
  - **Evidencia de cierre:** pendiente.

- [ ] **RM-DOC-016 — Saneamiento o archivo de `04_plantillas.sql` y verificación de `05_consultas.sql`**
  - **Actividad:** según la decisión del propietario, actualizar o retirar las plantillas y verificar las consultas frente al esquema vigente.
  - **Documentos:** `DOC-OP-02` · `database/01_esquema/04_plantillas.sql`, `database/01_esquema/05_consultas.sql`
  - **Hallazgos:** `I-040`
  - **Prioridad:** P2
  - **Dependencias:** decisión del propietario (conservar o retirar). Observación `MAT-2026-001` 7.4: `04_plantillas.sql` usa `es_recogida` (L80, L110), no `estado_usuario` como cita `EVD-2026-003`.
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — condicionada por decisión
  - **Criterios de aceptación:**
    1. La decisión adoptada está registrada.
    2. Si se actualizan: `04_plantillas.sql` y `05_consultas.sql` no contienen `es_recogida` ni `estado_usuario` y se validan contra el esquema de `01_tablas.sql`.
    3. Si se retiran: ningún documento activo los referencia como pasos de instalación.
    4. `database/README_base_de_datos.md` refleja el estado real de ambos scripts.
  - **Evidencia de cierre:** pendiente.

---

## 8. Etapa 5 — Placeholders restantes y binarios de diseño inicial

- [ ] **RM-DOC-018 — Resolución de placeholders vacíos y binarios de diseño inicial**
  - **Actividad:** decidir y registrar el destino de los artefactos restantes. Por las decisiones n.º 3 y n.º 5, `docs/requirements/user_stories.md` y `docs/scrum/product_backlog.md` **se conservan** y quedan fuera de esta tarea.
  - **Documentos:** `DOC-OP-04`, `DOC-OP-05` · `docs/scrum/sprint_1_act.md`, `docs/ui_ux/mockups_links.md`, `docs/architecture/Diagrama_clases_SGA.png`, `docs/architecture/Diagrama_dominio_SGA.drawio.png`, `docs/architecture/MER_SGA.drawio.png`, `docs/architecture/Diccionario_Datos_SGA.docx`
  - **Hallazgos:** `I-035`, `I-038`
  - **Prioridad:** P3
  - **Dependencias:** `RM-DOC-006`, `RM-DOC-010`, `RM-DOC-012`, `RM-DOC-015`; decisión del propietario sobre cada artefacto.
  - **Responsable:** Pendiente de asignación
  - **Estado:** Pendiente — dependiente de tareas
  - **Criterios de aceptación:**
    1. Cada artefacto listado tiene una decisión registrada (conservar, actualizar, archivar o retirar).
    2. Ningún binario se retira sin haber inspeccionado su contenido y migrado y validado la información útil en Markdown vigente.
    3. Ningún archivo de 0 B queda sin decisión (salvo los `.gitkeep` y los conservados por decisión).
    4. `MAT-2026-001` y `00_indice.md` reflejan el resultado.
  - **Evidencia de cierre:** pendiente.

---

## 9. Decisiones y bloqueos que condicionan las tareas

Solo se registran decisiones realmente pendientes. Ninguna se considera aprobada.

| N.º | Decisión o bloqueo | Tareas afectadas | Origen | Estado |
|---|---|---|---|---|
| D-1 | Política sobre si la contraseña ficticia puede citarse en `README_base_de_datos.md` e `INDICE.md` o se remite al encabezado del seed. | `RM-DOC-001`, `RM-DOC-006`, `RM-DOC-007`, `RM-DOC-008` | Auditoría P0.1 | Pendiente. |
| D-2 | Reclasificación de `I-002` de P0 a P2. | `RM-DOC-001` | Auditoría P0.1 (propuesta) | Pendiente; `EVD-2026-003` mantiene P0. |
| D-3 | Flujo de inicialización de la BD y de Alembic (`I-016`, `I-013`). | `RM-DOC-008` (sección Docker), `RM-DOC-009`, `RM-DOC-013` | `EVD-2026-003` | Pendiente de decisión técnica. `I-016` figura como *Probable*. |
| D-4 | Exposición de puertos, healthcheck y número de workers (`I-004`, `I-013`, `I-014`). | `RM-DOC-013` | `EVD-2026-003` | Pendiente de decisión técnica. |
| D-5 | Destino de `04_plantillas.sql` (actualizar o retirar). | `RM-DOC-016`, `RM-DOC-008`, `RM-DOC-007` | Inventario maestro | Pendiente. |
| D-6 | Destino de `sprint_1_act.md`, `mockups_links.md`, los tres PNG y el `.docx`. | `RM-DOC-018` | Inventario maestro | Pendiente. |
| D-7 | Aprobación o descarte de las propuestas de clase `C` y `D` (`I-044`…`I-065`). | `RM-DOC-005`, `RM-DOC-012`, `RM-DOC-015` | `EVD-2026-003` | Pendiente. |
| D-8 | Asignar una tarea `RM-DOC` a la actualización de `user_stories.md` y `product_backlog.md` (decisiones n.º 3 y n.º 5). | `RM-DOC-018` (acotada), ninguna otra | `MAT-2026-001` obs. 7.7 | Pendiente; no se crea ninguna tarea nueva. |
| D-9 | Autorización para crear las carpetas `docs/deployment/` y `docs/testing/`. | `RM-DOC-013`, `RM-DOC-017` | Decisión n.º 11 (ruta propuesta) | Pendiente. |
| D-10 | Existencia de pruebas automatizadas (`I-023`). | `RM-DOC-017` (parte automatizada) | `EVD-2026-003` | Sin suites en el repositorio. |
| D-11 | Corrección formal de la evidencia de `I-040` (`estado_usuario` frente a `es_recogida`). | `RM-DOC-016` | `MAT-2026-001` obs. 7.4 | Pendiente de decidir si se registra una corrección. |

---

## 10. Historial de versiones

| Versión | Fecha | Línea base | Cambios | Estado |
|---|---|---|---|---|
| 0.1 | 2026-10-31 | `c100a78f53a61828bec1c17aff4c9e2017336c1b` | Creación con las 18 tareas `RM-DOC-001`…`RM-DOC-018`; 2 completadas con evidencia verificada; 16 pendientes. | En revisión por el propietario; sin commit. |
