# AUD-2026-007 — Hallazgos técnicos de la auditoría estática de OpenCode · Fase 0, ampliación posterior

> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git`
> **Fuente de verdad:** `C:\Users\Acer\Documents\Default Project\SGA_repo\SGA`
> **Rama:** `dev`   **Commit de referencia:** `9a0428822637197763ec3125ee5e3c64da78864e`
> **Fecha de elaboración:** 2026-11-10   **Modo:** solo lectura (registro; sin modificación de código)
> **Estado del informe:** vigente — pendiente de revisión y aprobación del propietario
> **Restricciones aplicadas:** no se corrigen hallazgos en código; no se ejecutan migraciones; no se alteran evidencias históricas; no se crean tareas `RM-DOC` nuevas; no se marcan como resueltos hallazgos no validados
> **Fuentes consultadas:** diagnósticos `DXC-2026-001`…`DXC-2026-006`; `EVD-2026-003`; `MAT-2026-001`; `CHK-2026-001`; `00_indice.md`; archivos del repositorio inspeccionados en solo lectura

---

## 1. Alcance y método

Este documento registra los hallazgos técnicos identificados por una auditoría estática de OpenCode sobre el commit `9a0428822637197763ec3125ee5e3c64da78864e` de la rama `dev`. La auditoría fue de solo lectura; no ejecutó el sistema ni verificó comportamiento en producción.

Los identificadores usados internamente en este informe siguen el prefijo `DXA-` (hallazgo de auditoría técnica ampliada), asignado de forma correlativa dentro de este documento. No reemplazan ni modifican los identificadores `F-`, `R-`, `I-` ni `P-` existentes en las auditorías y el inventario previos. Cuando un hallazgo se corresponde con un elemento del inventario existente (`I-NNN`), la referencia se indica explícitamente.

Cada hallazgo se clasifica conforme a las convenciones de `00_indice.md` §10.4:
- **Estado de certeza:** verificado por inspección estática / probable / no comprobado en ejecución
- **Estado de cierre:** abierto (pendiente de corrección y validación)

---

## 2. Resumen ejecutivo

La auditoría estática identificó cuatro categorías de hallazgos: (A) un riesgo de seguridad relacionado con la serialización de objetos ORM, (B) un riesgo de integridad de base de datos por diferencia potencial entre la inicialización SQL y la inicialización Alembic, (C) una inconsistencia documental sobre Alembic, y (D) múltiples discrepancias entre la documentación existente y el estado actual del código. Ningún hallazgo está cerrado.

| ID | Título | Prioridad propuesta | Estado |
|---|---|---|---|
| DXA-06 | Exposición potencial del hash de contraseña en respuestas de API | P0 | Abierto |
| DXA-12b | Inicialización incompleta de funciones y triggers en entorno Docker | P1 | Abierto |
| DXA-41 | Inconsistencia documental sobre comando Alembic (`stamp` vs `upgrade`) | P2 | Abierto |
| DXA-D | Discrepancias entre documentación técnica existente y estado actual del código | P1–P2 | Abiertos (ver §4) |

> [!IMPORTANT]
> Las prioridades indicadas son propuestas de esta auditoría. No son prioridades aprobadas por el propietario. `EVD-2026-003` es la fuente maestra de prioridades sobre los hallazgos anteriores.

---

## 3. Hallazgos de seguridad e integridad

### DXA-06 — Exposición potencial del hash de contraseña en respuestas de API

| Campo | Valor |
|---|---|
| **Descripción** | El serializador genérico de objetos ORM (`app/utils/serializer.py` o equivalente) puede incluir atributos internos y propiedades del modelo si no se excluyen explícitamente. Las rutas de consulta de usuarios (`app/routes/usuarios.py`) podrían devolver el campo `contrasena_usuario` (hash bcrypt) como parte de la respuesta JSON, si no existe un esquema Pydantic de salida que lo excluya. |
| **Evidencia** | Inspección estática de `app/routes/usuarios.py`, `app/models/usuario_model.py` y `app/schemas/usuario_schema.py` en el commit `9a04288`. Estado: **probable** — la exposición efectiva depende del esquema de salida (`response_model`) definido en cada endpoint y no fue verificada en ejecución. |
| **Relación con inventario** | Corresponde a una ampliación de `I-002` (R-08: política de credenciales) y del área de RBAC de `DXC-2026-005`. No es un duplicado exacto de ningún `I-NNN` existente. |
| **Estado de certeza** | **Probable** — identificado por análisis estático; la exposición real en producción no ha sido verificada. |
| **Riesgo** | Alto si se confirma: exposición de hashes bcrypt en respuestas de API permite ataques offline de fuerza bruta. Clasificación de seguridad P0 si se verifica en ejecución. |
| **Recomendación** | (Propuesta — no aprobada) Revisar todos los `response_model` de las rutas de usuario; asegurarse de que `contrasena_usuario` esté excluido de todos los esquemas de salida Pydantic. Verificar con una llamada real a los endpoints de consulta de usuarios. |
| **Prioridad propuesta** | P0 (seguridad; pendiente de verificación en ejecución) |
| **Estado de cierre** | **Abierto** — pendiente de corrección y validación controlada. No está autorizado corregirlo en esta intervención. |

---

### DXA-12b — Inicialización incompleta de funciones y triggers en entorno Docker

| Campo | Valor |
|---|---|
| **Descripción** | El entrypoint Docker del backend (`sga_backend_jwt/entrypoint.sh`, L44) ejecuta `alembic upgrade head`, que aplica la migración `0001_initial_schema.py`. Esta migración crea las tablas mediante SQLAlchemy, pero puede no crear las funciones PL/pgSQL, los 19 triggers y la vista `vw_dashboard_operativo` definidos en `database/01_esquema/02_funciones_y_triggers.sql` y `database/01_esquema/06_vistas_dashboard.sql`. El contexto de construcción (`Dockerfile` del backend) no incluye los scripts SQL externos de `database/`. |
| **Evidencia** | — `sga_backend_jwt/entrypoint.sh` L44: `alembic upgrade head` (verificado en `12760d4`). — `sga_backend_jwt/alembic/versions/0001_initial_schema.py`: crea tablas mediante `op.create_table`; inspección estática no muestra invocación de los scripts SQL externos. — `database/01_esquema/02_funciones_y_triggers.sql`: define funciones PL/pgSQL y 19 triggers. — `docker-compose.yml` L21: `postgres:16-alpine` sin `volumes` que monten los scripts de `database/`. Corresponde al elemento `I-016` de `EVD-2026-003` (estado: **Probable**). |
| **Relación con inventario** | `I-016` (`R-02`, probable): «Divergencia entre `alembic upgrade head` y los scripts SQL». Hallazgo ya registrado. Este registro amplía su descripción con la especificación del contexto Docker. |
| **Estado de certeza** | **Probable** — no comprobado en ejecución. La diferencia entre objetos creados por Alembic y objetos definidos en SQL no ha sido verificada contra una base de datos real. |
| **Riesgo** | Alto si se confirma: las reglas de negocio implementadas como triggers (`fn_auditar_cambios`, actualizaciones de stock, validaciones) no estarían activas en el entorno Docker. Los dashboards que dependen de `vw_dashboard_operativo` fallarían. |
| **Recomendación** | (Propuesta — no aprobada) Verificar en un entorno controlado qué objetos de base de datos existen tras `alembic upgrade head` sin los scripts externos. Evaluar si `entrypoint.sh` debe ejecutar también los scripts SQL externos o si la migración debe incorporarlos. Registrar la decisión en `D-3` (sección 9 de `CHK-2026-001`). |
| **Prioridad propuesta** | P1 (integridad funcional; requiere investigación antes de despliegue en producción) |
| **Estado de cierre** | **Abierto** — pendiente de investigación y validación. No está autorizado investigarlo en esta intervención. |

---

### DXA-41 — Inconsistencia documental sobre comando Alembic (`stamp` vs `upgrade`)

| Campo | Valor |
|---|---|
| **Descripción** | Existe una contradicción entre la documentación histórica (`sga_backend_jwt/README.md` L96, estado `12760d4`): menciona `alembic stamp head` (comando de marcado sin aplicar migraciones), mientras que `entrypoint.sh` L44 ejecuta `alembic upgrade head` (comando que aplica las migraciones pendientes). La diferencia es semánticamente significativa: `stamp head` marca la BD como si estuviera al día sin ejecutar cambios; `upgrade head` aplica las migraciones. |
| **Evidencia** | — `sga_backend_jwt/README.md` L96: `alembic stamp head` (verificado en `12760d4`, registrado en `DOC-EX-05` de `MAT-2026-001`). — `sga_backend_jwt/entrypoint.sh` L44: `alembic upgrade head` (verificado). — Referenciado en `I-016` de `EVD-2026-003` y en `RM-DOC-009` criterio 3 de `CHK-2026-001`. |
| **Relación con inventario** | `I-016` y `DOC-EX-05`. La discrepancia documental ya está identificada en la checklist (`RM-DOC-009` criterio 3: «El procedimiento de Alembic es coherente con `entrypoint.sh` (`alembic upgrade head`) o la divergencia está explicada»). Este registro amplía la descripción de la discrepancia con precisión de evidencia. |
| **Estado de certeza** | **Verificado por inspección estática** — ambos archivos inspeccionados en el commit de referencia. |
| **Riesgo** | Medio (documental): quien siga el README para configurar manualmente el entorno ejecutará `stamp` en lugar de `upgrade`, dejando la BD sin las tablas creadas por la migración. |
| **Recomendación** | (Propuesta — no aprobada) Corregir el README del backend (`RM-DOC-009`) una vez resuelta la decisión `D-3` sobre el flujo de inicialización. |
| **Prioridad propuesta** | P2 (documental; condiciona `RM-DOC-009`) |
| **Estado de cierre** | **Abierto** — se resolverá al ejecutar `RM-DOC-009`. |

---

## 4. Discrepancias entre documentación existente y estado actual del código

Los siguientes hallazgos de tipo documental se registran como ampliación del contexto de las tareas existentes `RM-DOC-*`. No son tareas nuevas y no alteran los identificadores ni el orden de las 18 tareas oficiales.

### DXA-D1 — Inventario de routers y operaciones de API desactualizado

| Campo | Valor |
|---|---|
| **Descripción** | `DXC-2026-003_api_contrato.md` documenta 45 endpoints y los routers `inventario` y `renovaciones` GET, que fueron eliminados (R-07, `12760d4`). El estado real verificado es 38 endpoints en 7 routers activos (AUD-2026-002). |
| **Evidencia** | `DXC-2026-003` cabecera: «45 endpoints»; `AUD-2026-002` R-07: eliminación de `inventario`/`renovaciones`. Registrado en `I-022`, `DOC-EX-03` de `MAT-2026-001`. |
| **Relación con inventario** | `I-022`, `RM-DOC-011` (referencia de API pendiente de creación). |
| **Estado de certeza** | Verificado. Hallazgo ya registrado. Este ítem consolida la descripción para `RM-DOC-011`. |
| **Estado de cierre** | Abierto — se cerrará al completar `RM-DOC-011`. |

### DXA-D2 — Matriz RBAC con endpoints eliminados

| Campo | Valor |
|---|---|
| **Descripción** | La documentación de `DXC-2026-005_reglas_negocio_rbac.md` referencia la matriz RBAC sobre los 45 endpoints originales. Los endpoints de `inventario` y `renovaciones` GET ya no existen (R-07). |
| **Evidencia** | `DXC-2026-005` §RBAC; AUD-2026-002 R-07. Referenciado en `I-018`–`I-020`. |
| **Relación con inventario** | `I-018`, `I-019`, `I-020`, `RM-DOC-012`. |
| **Estado de certeza** | Verificado. |
| **Estado de cierre** | Abierto — se cerrará al completar `RM-DOC-012`. |

### DXA-D3 — Diferencias entre respuestas documentadas y respuestas reales del código

| Campo | Valor |
|---|---|
| **Descripción** | `DXC-2026-003` describe el sobre de respuesta estándar y formatos de algunos endpoints a partir del estado `14726ad`. Cambios posteriores (eliminar routers, ajustes de esquemas) pueden hacer que algunos formatos de respuesta documentados ya no coincidan con el código vigente en `9a04288`. |
| **Evidencia** | `DXC-2026-003` §1–§9; AUD-2026-002 R-07; diferencia de commits `14726ad` → `9a04288`. No verificado endpoint por endpoint en este informe. |
| **Relación con inventario** | `I-022`, `I-077`, `I-078`, `RM-DOC-011`. |
| **Estado de certeza** | **Probable** — no comprobado contrastando cada endpoint contra el código. |
| **Estado de cierre** | Abierto — se verificará al redactar `RM-DOC-011`. |

### DXA-D4 — Referencia a revisión de migración obsoleta en documentación

| Campo | Valor |
|---|---|
| **Descripción** | `DXC-2026-002_base_de_datos.md` y posiblemente `sga_backend_jwt/README.md` citan la baseline de Alembic `d4f74f3d4896`, que fue eliminada y reemplazada por `0001_initial_schema` (F-32, registrado). |
| **Evidencia** | `DXC-2026-002` §migraciones; AUD-2026-002 R-01 (F-32). Registrado en `I-016`, `DOC-EX-05`. |
| **Relación con inventario** | `I-016`, `RM-DOC-009`. |
| **Estado de certeza** | Verificado (ya registrado). |
| **Estado de cierre** | Abierto — se cerrará al completar `RM-DOC-009`. |

### DXA-D5 — Diferencias entre documentación frontend y estructura actual de componentes y utilidades

| Campo | Valor |
|---|---|
| **Descripción** | `DXC-2026-004_frontend_componentes.md` y la versión anterior de `sga_frontend_jwt/README.md` no reflejaban las 5 carpetas modulares de componentes (25+ archivos `.tsx`) ni los 9 archivos de `src/utils/`. La actualización del README del frontend (intervención 2026-11-09, RM-DOC-014 en progreso) corrigió el árbol de directorios. |
| **Evidencia** | `DXC-2026-004` §componentes; verificación `git ls-files src` en `9a04288`. Registrado en `I-021`, `I-075`, `DOC-EX-08` de `MAT-2026-001`. |
| **Relación con inventario** | `I-021`, `I-075`, `RM-DOC-014`. |
| **Estado de certeza** | Verificado. |
| **Estado de cierre** | Parcialmente cerrado en README del frontend (pendiente de commit); `DXC-2026-004` permanece histórico y no se modifica. |

### DXA-D6 — Documentación de TypeScript `strict` sin evidencia verificada

| Campo | Valor |
|---|---|
| **Descripción** | Documentación técnica anterior afirma que `tsconfig.json` del frontend tiene `"strict": true` activo. La inspección del `tsconfig.json` real en `9a04288` debe verificar esta afirmación antes de incluirla en documentación nueva. |
| **Evidencia** | `sga_frontend_jwt/tsconfig.json` — estado: **pendiente de inspección puntual en este commit**. |
| **Relación con inventario** | `I-075` (relacionado), `RM-DOC-014`. |
| **Estado de certeza** | **No comprobado** en esta auditoría. Requiere lectura del archivo. |
| **Estado de cierre** | Abierto — verificar antes de incluir en documentación técnica del frontend. |

### DXA-D7 — Despliegue de backend y base de datos: decisión confirmada por propietario, no reflejada en documentación histórica

| Campo | Valor |
|---|---|
| **Descripción** | El propietario confirmó el 2026-11-09 que el backend y la base de datos están alojados en Render. Esta decisión no estaba registrada en la documentación histórica (`DXC-2026-006` la marcaba como pendiente; `MAT-2026-001` §2.2 la listaba como propuesta sin decisión comunicada). Los README del repositorio han sido actualizados (intervención 2026-11-09/10) para reflejar esta confirmación, distinguiendo lo confirmado por el propietario de lo verificado en el repositorio. |
| **Evidencia** | Confirmación del propietario en la sesión de 2026-11-09. `README.md` actualizado (pendiente de commit): sección «Estrategia de Despliegue» refleja Render como backend y base de datos; nota que el repositorio no contiene `render.yaml` ni `Procfile`. `MAT-2026-001` §2.2 lista la decisión de Render como «sin decisión comunicada». |
| **Relación con inventario** | `I-043`, `RM-DOC-013`, `MAT-2026-001` §2.2 (propuesta pendiente). |
| **Estado de certeza** | **Confirmado por el propietario** — no verificado independientemente en la plataforma. |
| **Estado de cierre** | Parcialmente resuelto (documentación actualizada); pendiente de formalizar como `DEC-*` en `RM-DOC-005`. |

---

## 5. Ítems no comprobados e hipótesis

| Aspecto | Estado |
|---|---|
| Exposición real del hash de contraseña en respuestas HTTP (DXA-06) | No comprobado en ejecución. Solo análisis estático de código. |
| Objetos BD reales tras `alembic upgrade head` sin scripts SQL externos (DXA-12b / I-016) | No comprobado en ejecución. |
| Versión real de PostgreSQL en el entorno Render de producción | No verificado — depende de la plataforma. El repositorio declara `postgres:16-alpine` en Docker Compose. |
| Valor de `CORS_ORIGINS` en producción (Render) y origen del frontend en Vercel | No existen valores de producción en el repositorio. |
| Comportamiento de `tsconfig.json` `strict` (DXA-D6) | No inspeccionado en esta auditoría. |
| Protección de ramas y PR en GitHub (I-066, I-067) | Requieren la plataforma GitHub; no verificables en solo lectura del repositorio. |

---

## 6. Declaración de operaciones realizadas

- **Solo lectura:** no se modificó código, configuraciones, migraciones ni bases de datos.
- **Documentos nuevos:** se crea únicamente este archivo `AUD-2026-007`.
- **Documentos no alterados:** `AUD-2026-001`…`AUD-2026-006`, `EVD-2026-003`, `MAT-2026-001`, `CHK-2026-001`, `00_indice.md`, todos los `DXC-*`, todos los archivos de código fuente.
- **Git:** sin staging, commit ni push en esta fase de elaboración del documento.
- **No se crearon tareas `RM-DOC` nuevas** ni se modificaron las 18 existentes.
- **No se marcó como resuelto** ningún hallazgo sin corrección y validación verificada.
