# MAT-2026-001 — Matriz Maestra Documental del Proyecto SGA

> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git`
> **Fuente de verdad:** `SGA_repo/SGA` · rama `dev` · línea base verificada `c100a78f53a61828bec1c17aff4c9e2017336c1b`; `HEAD` verificado el 2026-11-09: `9a0428822637197763ec3125ee5e3c64da78864e`
> **Fecha de elaboración:** 2026-10-31 · **Última actualización:** 2026-11-10 (v0.4)
> **Naturaleza:** documento vivo, actualizable y versionado mediante Git
> **Estado:** versionado en `dev` (commit `0f56f5d`) y presente en `deployment` (merge `3ee0d66`); contenido en revisión del propietario; la actualización v0.4 (2026-11-10) está pendiente de commit; las propuestas aquí registradas no son decisiones aprobadas salvo donde se indique expresamente
> **Documento asociado:** [`CHK-2026-001_checklist_tareas_sga.md`](CHK-2026-001_checklist_tareas_sga.md)

---

## ÍNDICE

1. [Identificación y gobierno](#1-identificación-y-gobierno)
2. [Decisiones aprobadas, propuestas pendientes y aspectos no verificados](#2-decisiones-aprobadas-propuestas-pendientes-y-aspectos-no-verificados)
3. [Inventario de documentos existentes (DOC-EX-01 a DOC-EX-50)](#3-inventario-de-documentos-existentes)
4. [Catálogo de documentos oficiales (DOC-OF y DOC-OP)](#4-catálogo-de-documentos-oficiales)
5. [Documentación de pruebas y de despliegue](#5-documentación-de-pruebas-y-de-despliegue)
6. [Correspondencia con tareas RM-DOC y hallazgos EVD-2026-003](#6-correspondencia-con-tareas-rm-doc-y-hallazgos-evd-2026-003)
7. [Observaciones de verificación y correcciones respecto a informes previos](#7-observaciones-de-verificación-y-correcciones-respecto-a-informes-previos)
8. [Mantenimiento de la matriz](#8-mantenimiento-de-la-matriz)
9. [Historial de versiones](#9-historial-de-versiones)

---

## 1. Identificación y gobierno

| Campo | Valor |
|---|---|
| **Identificador** | `MAT-2026-001` |
| **Nombre oficial** | Matriz Maestra Documental del Proyecto SGA |
| **Propósito** | Catalogar de forma única y estable los documentos del repositorio (existentes, por actualizar y futuros), su estado real verificado, su relación con las tareas `RM-DOC-001`…`RM-DOC-018` y con los hallazgos `I-001`…`I-091` de `EVD-2026-003`. |
| **Alcance** | Documentación técnica y de gestión del SGA: guías (`README`), plantillas de configuración, scripts SQL autodocumentados, `docs/` y `docs/gestion_proyecto/`. No cataloga código funcional ni sustituye al roadmap de correcciones técnicas. |
| **Fecha de elaboración** | 2026-10-31 |
| **Línea base verificada** | Rama `dev`, `HEAD` `c100a78f53a61828bec1c17aff4c9e2017336c1b` (`docs: consolidate phase 0 audit baseline`). Las cifras de tamaño y los recuentos de este documento se verificaron el 2026-10-31 sobre el árbol de trabajo. Actualización v0.2 (2026-11-09): `HEAD` `9a0428822637197763ec3125ee5e3c64da78864e`; los recuentos y tamaños del 2026-10-31 no se reverificaron salvo lo indicado en 3.5, 7.11 y 7.12. Actualización v0.3 (2026-11-10): registro de `AUD-2026-007`, decisión de Render confirmada por propietario, correcciones IA-001/IA-002 en `README.md` y finalización de `RM-DOC-014` en `sga_frontend_jwt/README.md`. |
| **Naturaleza** | Documento vivo. Git conserva el historial de modificaciones. |
| **Ubicación** | `docs/gestion_proyecto/05_roadmap/` |

**Relación con otros documentos**

| Documento | Relación |
|---|---|
| [`00_indice.md`](../00_indice.md) | Catálogo de navegación de `docs/gestion_proyecto/` y fuente de las convenciones de identificadores (prefijos `MAT-`, `CHK-`, `RDM-`, `DEC-`). La matriz no lo sustituye. |
| [`CHK-2026-001`](CHK-2026-001_checklist_tareas_sga.md) | Seguimiento operativo (casillas, criterios de aceptación, evidencia de cierre) de las tareas `RM-DOC-001`…`RM-DOC-018`. La matriz define **qué documentos existen y por qué**; la checklist controla **el estado de ejecución**. |
| [`EVD-2026-003`](../06_evidencias/EVD-2026-003_inventario_unico_hallazgos_fase0_paso04.md) | Fuente maestra de hallazgos `I-001`…`I-091`. La matriz solo los referencia; no los redefine ni los modifica. |
| `RDM-2026-001_roadmap_correccion_sga.md` | Roadmap oficial futuro (ruta prevista según la convención del índice). **No existe todavía.** |
| `docs/scrum/product_backlog.md` | Product Backlog Scrum. Documento distinto del roadmap (decisión n.º 5 del 2026-10-31). |

> [!NOTE]
> Las rutas de esta matriz se expresan relativas a la raíz del repositorio (`SGA_repo/SGA`). Los documentos futuros se escriben como texto de código, no como enlaces, para no introducir enlaces rotos.

---

## 2. Decisiones aprobadas, propuestas pendientes y aspectos no verificados

Las decisiones se registran aquí tal como fueron comunicadas por el propietario. `03_decisiones/` está vacío (solo `.gitkeep`), por lo que todavía no existe ningún `DEC-*`.

### 2.1 Decisiones aprobadas

**a) Decisiones de la intervención del 2026-10-31**

| N.º | Decisión aprobada | Efecto en la matriz |
|---|---|---|
| 1 | La matriz y la checklist se ubican en `docs/gestion_proyecto/05_roadmap/`. | Rutas de `MAT-2026-001` y `CHK-2026-001`. |
| 2 | Ambos documentos son vivos, actualizables y versionados mediante Git. | Sección 8 y sección 9. |
| 3 | Se conserva y se actualizará `docs/requirements/user_stories.md` en una intervención posterior. | `DOC-OF-10` (existente, vacío, se conserva). |
| 4 | Las reglas de negocio y RBAC tienen documentación independiente. | `DOC-OF-08`. |
| 5 | Se mantienen el roadmap y el Product Backlog como documentos distintos. | `DOC-OF-18` y `DOC-OF-19`. |
| 6 | La documentación de pruebas está separada de la de despliegue. | `DOC-OF-12` independiente de `DOC-OF-11`. |
| 7 | Se respetan las convenciones de `00_indice.md`. | Prefijos `MAT-`, `CHK-`, `RDM-`, `DEC-`. |
| 8 | El cambio local de comentario de `database/01_esquema/03_seed_data.sql` puede formar parte del futuro commit mientras siga siendo exclusivamente documental. | Verificado el 2026-10-31: el diff local tiene 6 líneas modificadas, todas comentarios SQL; 0 líneas no comentario. |
| 9 | Se conserva `docs/gestion_proyecto/05_roadmap/.gitkeep`. | `DOC-EX-49` permanece intacto. |
| 10 | La checklist inicial se limita a `RM-DOC-001`…`RM-DOC-018`. | Sección 6 y `CHK-2026-001`. |
| 11 | `docs/testing/testing_and_qa.md` es la **ruta propuesta** del documento independiente de pruebas. | `DOC-OF-12`: ruta propuesta, archivo pendiente de creación. |
| 12 | El propietario revisa los cambios antes de autorizar cualquier operación Git de escritura. | Estado «en revisión». |

**b) Decisiones previas de Fase 0 (comunicadas por el propietario el 2026-10-30)**

| Decisión | Estado |
|---|---|
| Estructura documental: documentación técnica viva en `docs/architecture/`, `docs/requirements/` y `docs/deployment/`; gestión y registros históricos en `docs/gestion_proyecto/`. | Aprobada. |
| Sincronización de `00_indice.md`, `.gitkeep` en las tres carpetas vacías y primer commit documental. | Ejecutadas en `c100a78f53a61828bec1c17aff4c9e2017336c1b`. |
| Los diagramas PNG y el diccionario Word solo se retiran después de inspeccionar, migrar y validar su contenido. | Aprobada (condición vigente). |
| Decisión sobre los placeholders vacíos de `docs/`. | Pospuesta; resuelta en parte por las decisiones n.º 3 y n.º 5 de arriba (se conservan `user_stories.md` y `product_backlog.md`). El resto sigue pendiente. |
| Credenciales de `03_seed_data.sql`: datos ficticios de prueba; no se modifican contraseñas ni hashes; no se reescribe el historial; el `README.md` se corrige posteriormente. | Aprobada (auditoría P0.1). |

**c) Decisiones comunicadas por el propietario para la actualización documental del 2026-11-09 (motivada por una auditoría de solo lectura de OpenCode que el propietario sitúa el 2026-11-10)**

| N.º | Decisión aprobada | Alcance y límites |
|---|---|---|
| 1 | Vercel es el destino principal del frontend. | Es una decisión comunicada, no un `DEC-*` ni evidencia de que el despliegue en producción se haya ejecutado y validado. |
| 2 | Docker/Nginx se conserva como configuración técnica existente. | No se presenta como destino principal del frontend; su uso en producción no está verificado. |
| 3 | El alcance se limita a correcciones factuales y a los README afectados. | No se modifican código, configuraciones funcionales ni base de datos. |
| 4 | Render es el destino de producción del backend y de la base de datos PostgreSQL. | Confirmado por el propietario el 2026-11-09. No existe `DEC-*`, `render.yaml` ni `Procfile` en el repositorio. La versión real de PostgreSQL en Render no ha sido verificada independientemente. |
| 5 | Alembic gestiona el versionamiento del esquema de la base de datos. El flujo estándar de inicio del backend ejecuta `alembic upgrade head` (vía `entrypoint.sh`); los scripts de `database/01_esquema/` están disponibles como referencia. | Confirmado por el propietario el 2026-11-10. No sustituye la verificación de DXA-12b (funciones y triggers SQL): `I-016` continúa pendiente de comprobación en ejecución. No existe `DEC-*` para esta decisión. |

### 2.2 Propuestas pendientes (no aprobadas)

| Propuesta | Origen | Estado |
|---|---|---|
| Reclasificar `I-002` (`F-24`, `R-08`) de `P0` a `P2` por tratarse de datos ficticios. | Auditoría P0.1 (sección K) | **Propuesta; no aprobada.** `EVD-2026-003` mantiene `P0`. |
| Política sobre si `README_base_de_datos.md` e `INDICE.md` pueden citar la contraseña ficticia o deben remitir al encabezado del seed. | Auditoría P0.1 | Pendiente de decisión (condiciona `RM-DOC-001`). |
| Rutas `docs/architecture/api_reference.md`, `docs/requirements/business_rules_rbac.md`, `docs/deployment/deployment_and_operations.md`. | Inventario maestro (auditoría de solo lectura) | Propuestas de ruta; los documentos están pendientes de creación. |
| Creación de la carpeta `docs/testing/`. | Decisión n.º 11 (ruta propuesta) | Carpeta inexistente; requiere autorización al crear el archivo. |
| Serie `DEC-2026-NNN` en `03_decisiones/`. | Inventario maestro | Propuesta; el prefijo `DEC-` ya existe en el índice. |
| Destino de `database/01_esquema/04_plantillas.sql` (actualizar o retirar). | Inventario maestro | Pendiente de decisión (condiciona `RM-DOC-016`). |
| Destino de `docs/ui_ux/mockups_links.md` y `docs/scrum/sprint_1_act.md`. | Inventario maestro | Pendiente de decisión (condiciona `RM-DOC-018`). |
| Asignar tarea `RM-DOC` a la actualización de `user_stories.md` y `product_backlog.md`. | Esta matriz (observación 7.7) | Pendiente; no se crean tareas nuevas. |
| Formalizar como `DEC-2026-NNN` la decisión de Vercel como destino principal del frontend. | Decisión 2.1.c-1 | Propuesta; no se crea ningún `DEC-*` (condiciona `RM-DOC-005`). |
| Definir el destino de despliegue del backend y de la base de datos. | `I-043`; `vercel.json` no define reglas hacia el backend | Render confirmado como destino por el propietario el 2026-11-09 (ver decisión 2.1.c-4); no existe `DEC-*` ni `render.yaml`/`Procfile` en el repositorio (condiciona `RM-DOC-013`). |

### 2.3 Aspectos todavía no verificados

| Aspecto | Motivo |
|---|---|
| Ejecución real del arranque Docker, de `alembic upgrade head` frente a una BD inicializada por SQL y de cualquier comando de respaldo. | Esta intervención es de solo lectura sobre el comportamiento; `I-016` figura como *Probable* en `EVD-2026-003`. |
| Comportamiento del despliegue real respecto de `python-dotenv` (`I-017`, `C-14`). | Pendiente de verificación en ejecución (`EVD-2026-003`). |
| Contenido interno de los tres PNG y del `.docx` de `docs/architecture/`. | Solo se verificaron tamaño y existencia; la decisión previa exige inspeccionarlos antes de retirarlos. |
| Protección de ramas y uso de PR/issues (`I-066`, `I-067`). | Requieren la plataforma GitHub. |
| Ejecución de `lint` y `build` del frontend (`I-068`). | No ejecutados. |
| Despliegue real del frontend en Vercel: proyecto enlazado, rama conectada (`dev` o `deployment`), directorio raíz, comando de build y variables definidas en la plataforma. | Dependen de la plataforma Vercel; el repositorio solo contiene `sga_frontend_jwt/vercel.json`. |
| Valor de `VITE_API_URL` y de `CORS_ORIGINS` en un entorno desplegado. | No existen valores de producción en el repositorio. |

---

## 3. Inventario de documentos existentes

Inventario de **50 identificadores (`DOC-EX-01`…`DOC-EX-50`)** que corresponden a **51 archivos** (los 49 identificadores y 50 archivos originales, verificados el 2026-10-31, más `DOC-EX-50`, incorporado en la v0.2): `DOC-EX-46` agrupa `EVD-2026-002` y `EVD-2026-003`, que aquí se separan como `DOC-EX-46a` y `DOC-EX-46b` para conservar el identificador histórico. Los 50 archivos originales estaban versionados en `c100a78` salvo el cambio local de `03_seed_data.sql`, versionado después en `0f56f5d`; `DOC-EX-50` se versionó en `9a04288`. Los archivos `MAT-2026-001` y `CHK-2026-001` se crearon después de esa línea base y se catalogan en el catálogo oficial (`DOC-OF-16` y `DOC-OF-17`), no aquí.

**Leyenda de estado:** *Vigente* · *Parcialmente vigente* · *Desactualizado* · *Incompleto (0 B)* · *Histórico*. Los tamaños y los recuentos corresponden a la verificación del 2026-10-31. «—» en hallazgos indica que el documento no tiene un hallazgo directo en `EVD-2026-003`.

### 3.1 Guías, plantillas y configuración (`DOC-EX-01` a `DOC-EX-11`)

| ID | Ruta | Función y tipo | Estado real | Evidencia verificada | Hallazgos EVD-003 | Observaciones |
|---|---|---|---|---|---|---|
| **DOC-EX-01** | `README.md` | Guía raíz del repositorio | Desactualizado | 3523 B. L19 y L34 indican «PostgreSQL 14+»; L61 incluye `04_plantillas.sql` en la carga; L80-86 listan documentos y contraseñas de prueba que no coinciden con el seed y usan «Documento» como identificador; 0 menciones de Docker. | `I-036`, `I-037`, `I-040`, `I-041`, `I-043` | El login real acepta `email_usuario` o `telefono_usuario` (`sga_backend_jwt/app/schemas/usuario_schema.py`, `LoginRequest`, L104-110). |
| **DOC-EX-02** | `AGENTS.md` | Instrucciones operativas exclusivas de OpenCode | Vigente | 7407 B; 218 líneas; versionado en `c100a78`. | `I-042` (relacionado) | Su §1 limita su alcance a OpenCode. No se modifica sin autorización (§13). |
| **DOC-EX-03** | `.env.docker.example` | Plantilla de variables para Docker Compose | Vigente | 2387 B; usa marcadores `<CAMBIAR…>` sin secretos reales. | `I-073` | — |
| **DOC-EX-04** | `docker-compose.yml` | Manifiesto de orquestación comentado | Parcialmente vigente | 4186 B. L21 `postgres:16-alpine`; L47-48 y L76-77 publican los puertos 5432 y 8000; L80 el healthcheck del backend consulta `/docs`. | `I-004`, `I-006`, `I-013`, `I-074` | Sus comentarios sobre exposición «solo localhost» se contrastan en `I-004`. |
| **DOC-EX-05** | `sga_backend_jwt/README.md` | Guía técnica del backend | Desactualizado | 4662 B. L10 indica «PostgreSQL 14»; L72-87 el bloque `.env` no incluye `CORS_ORIGINS` (0 coincidencias en el archivo); L96 indica `alembic stamp head`; L114-127 el árbol omite `Dockerfile`, `entrypoint.sh` y `.dockerignore` (los tres existen). | `I-016`, `I-037`, `I-043` | `entrypoint.sh` L44 ejecuta `alembic upgrade head`. `settings.py` L34-39 lee `CORS_ORIGINS`. |
| **DOC-EX-06** | `sga_backend_jwt/.env.example` | Plantilla local del backend | Vigente | 903 B. | `I-070`, `I-073` | Documenta `CORS_ORIGINS` (control `S-01`). |
| **DOC-EX-07** | `sga_backend_jwt/alembic/README` | Nota autogenerada de Alembic | Incompleto | 38 B; una sola línea boilerplate. | `I-071` (relacionado), `I-016` (relacionado) | No describe `0001_initial_schema.py`. |
| **DOC-EX-08** | `sga_frontend_jwt/README.md` | Guía técnica del frontend | Desactualizado | 4015 B. El árbol L73-94 no refleja las 5 carpetas modulares de componentes (25 archivos `.tsx`) ni `Dockerfile` y `nginx.conf` (ambos existen). | `I-043`, `I-075` (relacionado) | Verificado: `src/components` tiene 32 `.tsx` en total; `src/utils` tiene 9 archivos. |
| **DOC-EX-09** | `sga_frontend_jwt/.env.example` | Plantilla local del frontend | Vigente | 189 B. | `I-021` | — |
| **DOC-EX-10** | `database/README_base_de_datos.md` | Guía operativa de la BD | Desactualizado | 7697 B. El árbol L10-21 omite `06_vistas_dashboard.sql` y `06_demos_endpoints/` (0 menciones de `06_vistas` y `06_demos`); el resumen habla de «6 tablas» (2 coincidencias) y no menciona `logistica_alquiler_alquiler`; L73-74 describe 1 empleado por rol cuando el seed inserta 11 empleados; L46 y L76 citan la contraseña de prueba. | `I-002`, `I-038`, `I-034`, `I-032` | La contraseña es ficticia por decisión del propietario; no se reproduce aquí. |
| **DOC-EX-11** | `database/03_documentacion/INDICE.md` | Diccionario rápido de la BD | Desactualizado | 8528 B. 1 coincidencia de `es_recogida`; 0 de `tipo_movimiento`, `unidad_minima_alquiler`, `logistica_alquiler_alquiler` y `vw_`; 2 menciones de «6 tablas»; L120 describe el seed con 1 empleado por rol y cita la contraseña de prueba. | `I-002`, `I-038` | La línea de `es_recogida` es L91 según `EVD-2026-003` (`I-038`). |

### 3.2 Scripts SQL autodocumentados (`DOC-EX-12` a `DOC-EX-21`)

| ID | Ruta | Función y tipo | Estado real | Evidencia verificada | Hallazgos EVD-003 | Observaciones |
|---|---|---|---|---|---|---|
| **DOC-EX-12** | `database/01_esquema/01_tablas.sql` | DDL principal | Vigente (fuente de verdad DDL) | 16481 B; 7 sentencias `CREATE TABLE`. | — | L361 y L364 mencionan `estado_usuario` como nota sobre una columna inexistente. |
| **DOC-EX-13** | `database/01_esquema/02_funciones_y_triggers.sql` | Funciones y triggers PL/pgSQL | Vigente (fuente de verdad PL/pgSQL) | 17432 B; 19 sentencias `CREATE TRIGGER`. | `I-079`, `I-056` | — |
| **DOC-EX-14** | `database/01_esquema/03_seed_data.sql` | Datos semilla de prueba | Vigente para pruebas locales; cambio de comentario versionado en `0f56f5d` | 6185 B. Inserta 11 empleados (1 `admin`, 5 `encargado_facturacion`, 5 `encargado_logistico`), 10 clientes y 7 productos. Diff verificado el 2026-10-31 (entonces local): 6 líneas de comentario modificadas (1 inserción, 5 eliminaciones); 0 líneas que no sean comentario. | `I-002`, `I-041` | Contraseñas y hashes se conservan por decisión del propietario. Sin ediciones adicionales desde su versionado (árbol de trabajo limpio el 2026-11-09). |
| **DOC-EX-15** | `database/01_esquema/04_plantillas.sql` | Plantillas DML comentadas | Desactualizado | 9468 B. L80 y L110 usan la columna `es_recogida`; 0 coincidencias de `estado_usuario`. | `I-040` | Ver observación 7.4: `EVD-2026-003` cita `estado_usuario` en estas líneas. |
| **DOC-EX-16** | `database/01_esquema/05_consultas.sql` | Consultas DQL de referencia | Parcialmente vigente (sin revisar) | 5458 B; 0 coincidencias de `es_recogida` y de `estado_usuario`. `README_base_de_datos.md` L48 lo marca «Sin revisar / esquema anterior». | `I-040` (citado en `EVD-2026-003`) | La afectación citada no se reproduce en el archivo actual (observación 7.4). |
| **DOC-EX-17** | `database/01_esquema/06_vistas_dashboard.sql` | DDL de vista de dashboard | Parcialmente vigente | 1579 B; define **1** vista (`vw_dashboard_operativo`, L12). No se menciona en `README_base_de_datos.md` ni en `INDICE.md`. | `I-034` | Corrige «3 vistas» de informes previos (observación 7.2). |
| **DOC-EX-18** | `database/06_demos_endpoints/01_demo_crear_alquiler.sql` | Demo SQL de creación de alquiler | Existente (vigencia según auditoría documental; no ejecutado) | 5032 B. | `I-032` | No catalogado en `README_base_de_datos.md`. |
| **DOC-EX-19** | `database/06_demos_endpoints/02_demo_entrega_recogida.sql` | Demo SQL de entrega y recogida | Existente (ídem) | 4710 B. | `I-032` | Ídem. |
| **DOC-EX-20** | `database/06_demos_endpoints/03_demo_renovacion.sql` | Demo SQL de renovación | Existente (ídem) | 2643 B. | `I-032` | Ídem. |
| **DOC-EX-21** | `database/06_demos_endpoints/04_demo_cancelar_alquiler.sql` | Demo SQL de cancelación | Existente (ídem) | 2159 B. | `I-032` | Ídem. |

### 3.3 Carpetas técnicas de `docs/` (`DOC-EX-22` a `DOC-EX-31`)

| ID | Ruta | Función y tipo | Estado real | Evidencia verificada | Hallazgos EVD-003 | Observaciones |
|---|---|---|---|---|---|---|
| **DOC-EX-22** | `docs/architecture/architecture_map.md` | Mapa de arquitectura | Incompleto (0 B) | 0 B; versionado. | `I-035` | — |
| **DOC-EX-23** | `docs/architecture/Diagrama_clases_SGA.png` | Diagrama de clases (binario) | Histórico (diseño inicial) | 97189 B. | `I-035` (relacionado) | Fecha 2026-09-10 según la auditoría documental integral. Contenido no inspeccionado. |
| **DOC-EX-24** | `docs/architecture/Diagrama_dominio_SGA.drawio.png` | Diagrama de dominio (binario) | Histórico (diseño inicial) | 84038 B. | `I-035` (relacionado) | Ídem. |
| **DOC-EX-25** | `docs/architecture/MER_SGA.drawio.png` | Modelo entidad-relación (binario) | Probablemente desactualizado | 204674 B. | `I-038` (relacionado) | Fecha anterior a `01_tablas.sql` según la auditoría documental; contenido no inspeccionado. |
| **DOC-EX-26** | `docs/architecture/Diccionario_Datos_SGA.docx` | Diccionario de datos (Word) | Probablemente desactualizado | 30555 B. | `I-038` (relacionado) | Duplica funcionalmente a `DOC-EX-11`. 0 enlaces entrantes verificados en la auditoría documental. |
| **DOC-EX-27** | `docs/requirements/user_cases.md` | Casos de uso | Incompleto (0 B) | 0 B. | `I-035` | — |
| **DOC-EX-28** | `docs/requirements/user_stories.md` | Historias de usuario | Incompleto (0 B) | 0 B. | `I-035` | Se conserva (decisión n.º 3). |
| **DOC-EX-29** | `docs/scrum/product_backlog.md` | Product Backlog | Incompleto (0 B) | 0 B. | `I-035` | Se conserva (decisión n.º 5). |
| **DOC-EX-30** | `docs/scrum/sprint_1_act.md` | Acta del Sprint 1 | Incompleto (0 B) | 0 B. | `I-035` | Destino pendiente. |
| **DOC-EX-31** | `docs/ui_ux/mockups_links.md` | Enlaces a mockups | Incompleto (0 B) | 0 B. | `I-035` | Destino pendiente. |

### 3.4 Gestión del proyecto (`DOC-EX-32` a `DOC-EX-49`)

| ID | Ruta | Función y tipo | Estado real | Evidencia verificada | Hallazgos EVD-003 | Observaciones |
|---|---|---|---|---|---|---|
| **DOC-EX-32** | `docs/gestion_proyecto/00_indice.md` | Índice maestro de gestión | Vigente (en actualización en esta intervención) | 16043 B antes de esta intervención; registra `AUD-001`…`006`, `DXC-001`…`006`, `EVD-001`…`003` y `AGENTS.md`. | `I-035` | Su cabecera (L4 y L6) conservaba el estado previo al commit; se actualiza en esta intervención. Actualizado de nuevo el 2026-11-09 (v0.2: cabecera, estado de `MAT`/`CHK`, referencias a `HEAD` y nota sobre Vercel); pendiente de commit. |
| **DOC-EX-33** | `docs/gestion_proyecto/01_auditorias/AUD-2026-001_auditoria_inicial_dev_14726ad.md` | Auditoría inicial | Histórico | 55059 B. | — | Inmutable. Origen de `F-01`…`F-49`. |
| **DOC-EX-34** | `docs/gestion_proyecto/01_auditorias/AUD-2026-002_auditoria_dev_remota_12760d4.md` | Auditoría de `12760d4` | Histórico | 44693 B. | — | Origen de `R-01`…`R-16` y `S-01`…`S-10`. |
| **DOC-EX-35** | `docs/gestion_proyecto/01_auditorias/AUD-2026-003_consolidacion_comparativa_fase0_paso02.md` | Consolidación (paso 0.2) | Histórico | 38575 B. | — | — |
| **DOC-EX-36** | `docs/gestion_proyecto/01_auditorias/AUD-2026-004_inventario_original_fase0_paso04.md` | Inventario original del paso 0.4 | Histórico | 39823 B. | — | Superado por `EVD-2026-003`. |
| **DOC-EX-37** | `docs/gestion_proyecto/01_auditorias/AUD-2026-005_revision_consistencia_fase0_paso04.md` | Primera revisión de consistencia | Histórico | 14644 B. | — | Integrado en `EVD-2026-003`. |
| **DOC-EX-38** | `docs/gestion_proyecto/01_auditorias/AUD-2026-006_ajuste_final_consistencia_fase0_paso04.md` | Ajuste final de consistencia | Histórico | 11764 B. | — | Integrado en `EVD-2026-003`. |
| **DOC-EX-39** | `docs/gestion_proyecto/04_diagnostico/DXC-2026-001_arquitectura.md` | Diagnóstico de arquitectura | Histórico (sobre `14726ad`) | 25716 B. | — | Banner de vigencia en cabecera. |
| **DOC-EX-40** | `docs/gestion_proyecto/04_diagnostico/DXC-2026-002_base_de_datos.md` | Diagnóstico de base de datos | Histórico (sobre `14726ad`) | 34905 B. | — | Su diccionario de tablas es fuente para `RM-DOC-006`. |
| **DOC-EX-41** | `docs/gestion_proyecto/04_diagnostico/DXC-2026-003_api_contrato.md` | Diagnóstico del contrato de API | Histórico (sobre `14726ad`) | 36696 B. | — | Documenta 45 endpoints; el código actual tiene 38. |
| **DOC-EX-42** | `docs/gestion_proyecto/04_diagnostico/DXC-2026-004_frontend_componentes.md` | Diagnóstico del frontend | Histórico (sobre `14726ad`) | 24924 B. | — | — |
| **DOC-EX-43** | `docs/gestion_proyecto/04_diagnostico/DXC-2026-005_reglas_negocio_rbac.md` | Diagnóstico de reglas y RBAC | Histórico (sobre `14726ad`) | 36473 B. | — | Mezcla reglas implementadas con propuestas `P-*` no aprobadas. |
| **DOC-EX-44** | `docs/gestion_proyecto/04_diagnostico/DXC-2026-006_despliegue_configuracion.md` | Diagnóstico de despliegue | Histórico (sobre `14726ad`) | 23653 B. | — | Su afirmación `C-14` fue refutada en `EVD-2026-002` (ver `I-017`). |
| **DOC-EX-45** | `docs/gestion_proyecto/06_evidencias/EVD-2026-001_verificacion_linea_base_fase01.md` | Evidencia del paso 0.1 | Histórico | 5209 B. | — | — |
| **DOC-EX-46a** | `docs/gestion_proyecto/06_evidencias/EVD-2026-002_verificacion_clasificacion_evidencias_fase0_paso03.md` | Evidencia del paso 0.3 | Vigente (fuente aprobada para `C-14`) | 47373 B. | — | — |
| **DOC-EX-46b** | `docs/gestion_proyecto/06_evidencias/EVD-2026-003_inventario_unico_hallazgos_fase0_paso04.md` | Inventario único (paso 0.4) | Vigente (fuente maestra de hallazgos) | 72731 B. | Contiene `I-001`…`I-091` | — |
| **DOC-EX-47** | `docs/gestion_proyecto/02_consultas_tecnicas/.gitkeep` | Marcador de carpeta | Vigente | 2 B. | — | — |
| **DOC-EX-48** | `docs/gestion_proyecto/03_decisiones/.gitkeep` | Marcador de carpeta | Vigente | 2 B. | — | — |
| **DOC-EX-49** | `docs/gestion_proyecto/05_roadmap/.gitkeep` | Marcador de carpeta | Vigente (se conserva, decisión n.º 9) | 2 B. | — | — |

### 3.5 Adiciones posteriores a la línea base (`DOC-EX-50`)

Archivos incorporados al repositorio después de `c100a78`. Reciben el identificador correlativo siguiente a `DOC-EX-49`; no se renumera ni se modifica ningún identificador existente.

| ID | Ruta | Función y tipo | Estado real | Evidencia verificada | Hallazgos EVD-003 | Observaciones |
|---|---|---|---|---|---|---|
| **DOC-EX-50** | `sga_frontend_jwt/vercel.json` | Configuración de despliegue del frontend en Vercel (JSON, no documentación narrativa) | Vigente como configuración existente; **despliegue no verificado** | 96 B; UTF-8 sin BOM; JSON válido con una regla `rewrites` (`/(.*)` → `/index.html`); sin reglas `redirects` ni proxy hacia el backend. Versionado en `9a04288` (`dev`); presente en `deployment` (`2f8c93f`, merge `3ee0d66`). | `I-043` (relacionado) | Reintroduce el archivo retirado en `f19e845` (versiones previas guardadas en UTF-16 con BOM). Sin registro `DOC-OF` asociado; no se crea. Decisión de Vercel como destino principal: 2.1.c. |

> [!NOTE]
> Los tamaños y líneas citados para `DOC-EX-01` y `DOC-EX-08` en 3.1 corresponden a `c100a78` y al 2026-10-31. Ambos README se modificaron el 2026-11-09 (observación 7.12); no se reverificó el resto de su contenido.

---

## 4. Catálogo de documentos oficiales

### 4.1 Reglas de numeración

1. Los identificadores `DOC-OF-01`…`DOC-OF-21` son únicos, consecutivos y sin duplicaciones. La cantidad anunciada (**21**) coincide con la cantidad de registros de la tabla 4.2.
2. Cada ID mantiene una relación estable con un nombre y una ruta. Un ID no se reutiliza ni se reasigna; si un documento se retira, su ID queda registrado como retirado.
3. Los documentos opcionales o condicionados usan `DOC-OP-01`…`DOC-OP-06`.
4. Ninguna numeración `DOC-OF` previa fue aprobada formalmente (no existe ningún `DEC-*`). La correspondencia con las propuestas anteriores está en 4.4.

**Estados del catálogo:** *Existente vigente* · *Existente por actualizar* · *Existente vacío, por poblar* · *Futuro (pendiente de creación)* · *Creado en esta intervención*.

### 4.2 Documentos oficiales (`DOC-OF-01` a `DOC-OF-21`)

| ID | Nombre | Ruta | Categoría | Estado verificado | Validación | Tarea RM-DOC | Prioridad | Dependencias | Acción recomendada |
|---|---|---|---|---|---|---|---|---|---|
| **DOC-OF-01** | README principal | `README.md` | Existente por actualizar | Desactualizado (`DOC-EX-01`) | Propuesto | `RM-DOC-008` | P1 | Parte Docker condicionada a `I-016` | Actualizar en su ruta |
| **DOC-OF-02** | Guía del backend | `sga_backend_jwt/README.md` | Existente por actualizar | Desactualizado (`DOC-EX-05`) | Propuesto | `RM-DOC-009` | P1 | Decisión sobre `I-016` | Actualizar en su ruta |
| **DOC-OF-03** | Guía del frontend | `sga_frontend_jwt/README.md` | Existente por actualizar | Desactualizado (`DOC-EX-08`) | Propuesto | `RM-DOC-014` | P2 | — | Actualizar en su ruta |
| **DOC-OF-04** | Guía operativa de base de datos | `database/README_base_de_datos.md` | Existente por actualizar | Desactualizado (`DOC-EX-10`) | Propuesto | `RM-DOC-001`, `RM-DOC-007` | P0/P1 | `RM-DOC-001`, `RM-DOC-006` | Actualizar en su ruta |
| **DOC-OF-05** | Diccionario de base de datos | `database/03_documentacion/INDICE.md` | Existente por actualizar | Desactualizado (`DOC-EX-11`) | Propuesto | `RM-DOC-001`, `RM-DOC-006` | P0/P1 | `DXC-2026-002` como fuente | Actualizar en su ruta |
| **DOC-OF-06** | Mapa de arquitectura | `docs/architecture/architecture_map.md` | Existente vacío, por poblar | 0 B (`DOC-EX-22`) | Propuesto | `RM-DOC-010` | P1 | — | Poblar en su ruta |
| **DOC-OF-07** | Referencia de la API REST | `docs/architecture/api_reference.md` | Futuro | No existe | Propuesto (ruta) | `RM-DOC-011` | P1 | `RM-DOC-010` | Crear tras aprobación |
| **DOC-OF-08** | Reglas de negocio y matriz RBAC | `docs/requirements/business_rules_rbac.md` | Futuro | No existe | Aprobado como documento independiente (decisión n.º 4); ruta propuesta | `RM-DOC-012` | P1 | `RM-DOC-005`; clasificación de `EVD-2026-003` | Crear tras aprobación |
| **DOC-OF-09** | Alcance y casos de uso | `docs/requirements/user_cases.md` | Existente vacío, por poblar | 0 B (`DOC-EX-27`) | Propuesto | `RM-DOC-015` | P2 | `RM-DOC-005`, `RM-DOC-012` | Poblar en su ruta |
| **DOC-OF-10** | Historias de usuario | `docs/requirements/user_stories.md` | Existente vacío, por poblar | 0 B (`DOC-EX-28`) | Aprobado conservar y actualizar (decisión n.º 3) | Sin tarea asignada (obs. 7.7) | Sin priorizar | Intervención posterior | Conservar; actualizar en intervención posterior |
| **DOC-OF-11** | Guía de despliegue y operación | `docs/deployment/deployment_and_operations.md` | Futuro | No existe | Propuesto (ruta) | `RM-DOC-013` | P1 | `I-004`, `I-013`, `I-014`, `I-016` | Crear tras aprobación |
| **DOC-OF-12** | Documentación de pruebas y QA | `docs/testing/testing_and_qa.md` | Futuro | No existe; carpeta `docs/testing/` inexistente | Aprobado como documento separado (decisión n.º 6); ruta propuesta (decisión n.º 11) | `RM-DOC-017` | P2 | `I-023` (parte automatizada) | Crear tras aprobación |
| **DOC-OF-13** | Plantillas de entorno | `.env.docker.example`, `sga_backend_jwt/.env.example`, `sga_frontend_jwt/.env.example` | Existente vigente | Vigentes (`DOC-EX-03`, `06`, `09`) | — | — | Mantenimiento | — | Conservar |
| **DOC-OF-14** | Instrucciones operativas de OpenCode | `AGENTS.md` | Existente vigente | Vigente (`DOC-EX-02`) | — | — | Mantenimiento | — | Conservar; no modificar sin autorización |
| **DOC-OF-15** | Índice maestro de gestión | `docs/gestion_proyecto/00_indice.md` | Existente vigente | Vigente (`DOC-EX-32`) | — | `RM-DOC-002` (completada) | Mantenimiento | — | Mantener sincronizado |
| **DOC-OF-16** | Matriz maestra documental | `docs/gestion_proyecto/05_roadmap/MAT-2026-001_matriz_maestra_documental.md` | Creado en esta intervención | Este documento | Ubicación aprobada (decisión n.º 1); contenido en revisión | — | Mantenimiento | — | Revisión del propietario |
| **DOC-OF-17** | Checklist de tareas documentales | `docs/gestion_proyecto/05_roadmap/CHK-2026-001_checklist_tareas_sga.md` | Creado en esta intervención | [`CHK-2026-001`](CHK-2026-001_checklist_tareas_sga.md) | Ubicación aprobada (decisión n.º 1); contenido en revisión | — | Mantenimiento | `DOC-OF-16` | Revisión del propietario |
| **DOC-OF-18** | Roadmap oficial de corrección | `docs/gestion_proyecto/05_roadmap/RDM-2026-001_roadmap_correccion_sga.md` | Futuro | No existe | Prefijo `RDM-` conforme al índice; contenido no aprobado | `RM-DOC-004` | P1 | `RM-DOC-005` | No crear hasta que esté completo y aprobado |
| **DOC-OF-19** | Product Backlog | `docs/scrum/product_backlog.md` | Existente vacío, por poblar | 0 B (`DOC-EX-29`) | Aprobado conservar (decisión n.º 5) | Sin tarea asignada (obs. 7.7) | Sin priorizar | Roadmap y `user_stories.md` | Conservar; actualizar en intervención posterior |
| **DOC-OF-20** | Registro de decisiones aprobadas | `docs/gestion_proyecto/03_decisiones/DEC-2026-NNN_slug_corto.md` (serie) | Futuro | Carpeta con `.gitkeep`; ningún `DEC-*` | Propuesto | `RM-DOC-005` | P1 | Aprobación expresa por decisión | Crear a medida que se aprueben decisiones |
| **DOC-OF-21** | Archivo histórico de Fase 0 | `docs/gestion_proyecto/01_auditorias/`, `04_diagnostico/`, `06_evidencias/` (15 archivos) | Existente vigente | Histórico inmutable (`DOC-EX-33`…`DOC-EX-46b`) | — | `RM-DOC-003` (completada) | Mantenimiento | — | Conservar intactos |

**Recuento verificado:** 21 registros `DOC-OF`: 5 existentes por actualizar (`01`–`05`), 4 existentes vacíos por poblar (`06`, `09`, `10`, `19`), 4 existentes vigentes (`13`, `14`, `15`, `21`), 2 creados en esta intervención (`16`, `17`) y 6 futuros (`07`, `08`, `11`, `12`, `18`, `20`). Suma: 5 + 4 + 4 + 2 + 6 = 21.

### 4.3 Documentos opcionales o condicionados (`DOC-OP-01` a `DOC-OP-06`)

| ID | Nombre | Ruta | Estado verificado | Tarea | Condición | Acción recomendada |
|---|---|---|---|---|---|---|
| **DOC-OP-01** | Nota de configuración de Alembic | `sga_backend_jwt/alembic/README` | Incompleto, 38 B (`DOC-EX-07`) | `RM-DOC-009` | Útil si se inspecciona `alembic/` directamente | Actualizar con una nota breve o remitir a `DOC-OF-02` |
| **DOC-OP-02** | Plantillas DML y consultas DQL | `database/01_esquema/04_plantillas.sql`, `database/01_esquema/05_consultas.sql` | Desactualizado / sin revisar (`DOC-EX-15`, `DOC-EX-16`) | `RM-DOC-016` | Decisión pendiente: actualizar o retirar | Actualizar o archivar según decisión |
| **DOC-OP-03** | Consultas técnicas | `docs/gestion_proyecto/02_consultas_tecnicas/CON-2026-NNN_slug_corto.md` | No existen | — | Solo bajo demanda | Crear solo si surge una consulta que lo requiera |
| **DOC-OP-04** | Diagramas y diccionario de diseño inicial | `docs/architecture/Diagrama_clases_SGA.png`, `Diagrama_dominio_SGA.drawio.png`, `MER_SGA.drawio.png`, `Diccionario_Datos_SGA.docx` | Históricos / probablemente desactualizados (`DOC-EX-23`…`DOC-EX-26`) | `RM-DOC-018` | Solo se retiran tras inspeccionar, migrar y validar su contenido (decisión previa) | Evaluar tras `RM-DOC-006` y `RM-DOC-010` |
| **DOC-OP-05** | Placeholders de acta y mockups | `docs/scrum/sprint_1_act.md`, `docs/ui_ux/mockups_links.md` | 0 B (`DOC-EX-30`, `DOC-EX-31`) | `RM-DOC-018` | Destino pendiente de decisión | Poblar si hay contenido real o evaluar su retiro |
| **DOC-OP-06** | Gobernanza ampliada (`CONTRIBUTING`, `SECURITY`, `CHANGELOG`, `CODEOWNERS`) | Raíz del repositorio (no existen) | No existen | — | Opcional mientras el proyecto tenga un único autor (`I-042`, `I-084`) | No crear salvo decisión expresa |

**Recuento verificado:** 6 registros `DOC-OP`.

### 4.4 Correspondencia con las propuestas anteriores

Existen dos propuestas previas: el **inventario maestro** (listas B.1 y B.2) y la **sección C.2 del informe preparatorio** (que anunciaba «`DOC-OF-01` a `DOC-OF-19`» pero enumeraba 21). Esta matriz adopta la numeración de C.2 por ser la más reciente y la única consecutiva de 01 a 21.

| Documento | ID en inventario maestro (B.1/B.2) | ID en informe preparatorio (C.2) | **ID en esta matriz** | Motivo de la reasignación |
|---|---|---|---|---|
| `README.md` | `DOC-OF-01` | `DOC-OF-01` | **`DOC-OF-01`** | Sin cambio. |
| `sga_backend_jwt/README.md` | `DOC-OF-02` | `DOC-OF-02` | **`DOC-OF-02`** | Sin cambio. |
| `sga_frontend_jwt/README.md` | `DOC-OF-03` | `DOC-OF-03` | **`DOC-OF-03`** | Sin cambio. |
| `database/README_base_de_datos.md` | `DOC-OF-04` | `DOC-OF-04` | **`DOC-OF-04`** | Sin cambio. |
| `database/03_documentacion/INDICE.md` | `DOC-OF-05` | `DOC-OF-05` | **`DOC-OF-05`** | Sin cambio. |
| `docs/architecture/architecture_map.md` | `DOC-OF-06` | `DOC-OF-06` | **`DOC-OF-06`** | Sin cambio. |
| `docs/architecture/api_reference.md` | `DOC-OF-07` | `DOC-OF-07` | **`DOC-OF-07`** | Sin cambio. |
| `docs/requirements/business_rules_rbac.md` | `DOC-OF-08` | `DOC-OF-08` | **`DOC-OF-08`** | Sin cambio. |
| `docs/requirements/user_cases.md` | `DOC-OF-09` | `DOC-OF-09` | **`DOC-OF-09`** | Sin cambio. |
| `docs/requirements/user_stories.md` | No incluido (propuesto como reemplazable) | `DOC-OF-10` | **`DOC-OF-10`** | Incorporado por la decisión n.º 3. |
| `docs/deployment/deployment_and_operations.md` | `DOC-OF-10` | `DOC-OF-11` | **`DOC-OF-11`** | Libera el 10 para `user_stories.md`. |
| `docs/testing/testing_and_qa.md` | No incluido (era una sección del documento de despliegue) | `DOC-OF-12` | **`DOC-OF-12`** | Decisión n.º 6: documento independiente. |
| Plantillas `.env*.example` | `DOC-OF-11` | `DOC-OF-13` | **`DOC-OF-13`** | Reordenación por la inserción de `10` y `12`. |
| `AGENTS.md` | `DOC-OF-12` | `DOC-OF-14` | **`DOC-OF-14`** | Ídem. |
| `00_indice.md` | `DOC-OF-13` | `DOC-OF-15` | **`DOC-OF-15`** | Ídem. |
| `MAT-2026-001` | No incluido | `DOC-OF-16` | **`DOC-OF-16`** | Documento nuevo de esta línea de trabajo. |
| `CHK-2026-001` | No incluido | `DOC-OF-17` | **`DOC-OF-17`** | Ídem. |
| `RDM-2026-001` | `DOC-OF-14` (con prefijo `RM-2026-001`) | `DOC-OF-18` | **`DOC-OF-18`** | Reordenación; el prefijo se corrige a `RDM-` conforme a `00_indice.md` (decisión n.º 7). |
| `docs/scrum/product_backlog.md` | No incluido (propuesto para retirar) | `DOC-OF-19` | **`DOC-OF-19`** | Decisión n.º 5: se conserva. |
| Serie `DEC-2026-NNN` | `DOC-OF-15` (como `ADR-2026-NNN`) | `DOC-OF-20` | **`DOC-OF-20`** | Reordenación; el prefijo `DEC-` es el vigente en el índice. |
| Archivo histórico de Fase 0 | `DOC-OF-16` | `DOC-OF-21` | **`DOC-OF-21`** | Reordenación. |

**Identificadores `DOC-OP`:** `DOC-OP-01`…`DOC-OP-04` y `DOC-OP-06` no cambian. `DOC-OP-05` amplía su alcance: el inventario maestro solo incluía `mockups_links.md`; se agrega `sprint_1_act.md` porque la tarea `RM-DOC-018` lo cubre y no tenía registro de catálogo.

---

## 5. Documentación de pruebas y de despliegue

Ambos documentos son independientes (decisión n.º 6). Ninguno existe todavía.

| Documento | ID | Ruta | Estado | Observaciones |
|---|---|---|---|---|
| Documentación de pruebas y QA | `DOC-OF-12` | `docs/testing/testing_and_qa.md` | **Ruta propuesta; archivo pendiente de creación** | La carpeta `docs/testing/` tampoco existe (verificado el 2026-10-31). Tarea asociada: `RM-DOC-017`. |
| Guía de despliegue y operación | `DOC-OF-11` | `docs/deployment/deployment_and_operations.md` | Ruta propuesta; archivo pendiente de creación | La carpeta `docs/deployment/` tampoco existe (verificado el 2026-10-31). Tarea asociada: `RM-DOC-013`. |

Para `DOC-OF-11`: por decisión del propietario (2.1.c), Vercel es el destino principal del frontend y Docker Compose/Nginx se documentará como configuración técnica existente. El destino del backend y de la base de datos sigue sin decidirse (`I-043`, observación 7.11).

Reparto de contenido previsto (propuesta, no aprobada): despliegue y operación cubre Docker Compose, Nginx, variables de entorno, seguridad operativa y respaldos; pruebas y QA cubre el protocolo de verificación (scripts de `database/06_demos_endpoints/`, `npm run lint`, `npm run build`) y, cuando existan, las suites automatizadas (`I-023`).

---

## 6. Correspondencia con tareas RM-DOC y hallazgos EVD-2026-003

Las 18 tareas conservan sus identificadores originales; no se crean, eliminan ni renumeran. La **prioridad** es la propuesta por el informe de auditoría documental y por `EVD-2026-003`; no constituye una priorización aprobada de roadmap. El detalle operativo de cada tarea (criterios de aceptación, estado y evidencia de cierre) está en [`CHK-2026-001`](CHK-2026-001_checklist_tareas_sga.md).

| Tarea | Título | Documentos | Hallazgos EVD-003 | Dependencias | Prioridad | Estado |
|---|---|---|---|---|---|---|
| `RM-DOC-001` | Saneamiento documental de credenciales en `README_base_de_datos.md` e `INDICE.md` | `DOC-OF-04`, `DOC-OF-05` | `I-002` | Decisión sobre política de mención de la contraseña ficticia; coordinar con `RM-DOC-006` y `RM-DOC-007` | P0 (`EVD-003`); reclasificación a P2 propuesta, no aprobada | Pendiente |
| `RM-DOC-002` | Sincronización del índice maestro de gestión | `DOC-OF-15` | `I-035` | — | P1 | **Completada** (`c100a78`) |
| `RM-DOC-003` | Commit documental de línea base de Fase 0 | `DOC-OF-14`, `DOC-OF-15`, `DOC-OF-21` | `I-035` | `RM-DOC-002` | P1 | **Completada** (`c100a78`) |
| `RM-DOC-004` | Creación del roadmap oficial del proyecto SGA | `DOC-OF-18` | `I-035`; planificación de `I-001`…`I-091` | `RM-DOC-005`; aprobación del propietario | P1 | Pendiente |
| `RM-DOC-005` | Registro de decisiones de arquitectura y negocio | `DOC-OF-20` | `I-014`, `I-016`, `I-042`, `I-044`…`I-065` | Aprobación expresa de cada decisión | P1 | Pendiente |
| `RM-DOC-006` | Actualización del diccionario rápido de base de datos | `DOC-OF-05` | `I-038`, `I-034`, `I-079` | `RM-DOC-001` (mismo archivo); `DXC-2026-002` como fuente | P1 | Pendiente |
| `RM-DOC-007` | Actualización de la guía de base de datos | `DOC-OF-04` | `I-002`, `I-034`, `I-038`, `I-032` | `RM-DOC-001`, `RM-DOC-006` | P1 | Pendiente |
| `RM-DOC-008` | Actualización del `README.md` raíz | `DOC-OF-01` | `I-036`, `I-037`, `I-040`, `I-041`, `I-043` | Sección Docker condicionada a `I-016` | P1 | Pendiente |
| `RM-DOC-009` | Actualización del README del backend y nota de `alembic/README` | `DOC-OF-02`, `DOC-OP-01` | `I-016`, `I-037`, `I-043`, `I-070`, `I-071`, `I-091` | Decisión sobre el flujo de `I-016` | P1 | Pendiente |
| `RM-DOC-010` | Poblado del mapa de arquitectura | `DOC-OF-06` | `I-035`, `I-043`, `I-074`, `I-076`, `I-079` | — | P1 | Pendiente |
| `RM-DOC-011` | Creación de la referencia viva de la API REST | `DOC-OF-07` | `I-022`, `I-060`, `I-072`, `I-077`, `I-078` | `RM-DOC-010` | P1 | Pendiente |
| `RM-DOC-012` | Creación del catálogo de reglas de negocio y matriz RBAC | `DOC-OF-08` | `I-018`…`I-020`, `I-044`…`I-065`, `I-078`, `I-079` | `RM-DOC-005`; clasificación de `EVD-2026-003` | P1 | Pendiente |
| `RM-DOC-013` | Creación de la guía de despliegue, operación, seguridad y respaldos | `DOC-OF-11` | `I-004`…`I-007`, `I-013`…`I-017`, `I-043`, `I-057`, `I-061` | Definiciones técnicas de `I-004`, `I-013`, `I-014`, `I-016` | P1 | Pendiente |
| `RM-DOC-014` | Actualización del README del frontend | `DOC-OF-03` | `I-021`, `I-043`, `I-075` | — | P2 | Pendiente |
| `RM-DOC-015` | Poblado de alcance funcional y casos de uso | `DOC-OF-09` | `I-035`, `I-051`…`I-053`, `I-063`, `I-065` | `RM-DOC-005`, `RM-DOC-012` | P2 | Pendiente |
| `RM-DOC-016` | Saneamiento o archivo de `04_plantillas.sql` y verificación de `05_consultas.sql` | `DOC-OP-02` | `I-040` | Decisión del propietario sobre conservar o retirar | P2 | Pendiente |
| `RM-DOC-017` | Documentación del protocolo de verificación y ejecución de pruebas | `DOC-OF-12` | `I-023`, `I-024`, `I-025`, `I-032`, `I-068` | `I-023` para la parte automatizada | P2 | Pendiente |
| `RM-DOC-018` | Resolución de placeholders vacíos y binarios de diseño inicial | `DOC-OP-04`, `DOC-OP-05` | `I-035`, `I-038` | `RM-DOC-006`, `RM-DOC-010`, `RM-DOC-012`, `RM-DOC-015`; decisiones n.º 3 y n.º 5 | P3 | Pendiente |

**Resumen:** 18 tareas; 2 completadas (`RM-DOC-002`, `RM-DOC-003`); 16 pendientes.

---

## 7. Observaciones de verificación y correcciones respecto a informes previos

Resultado del contraste del 2026-10-31 entre los informes preparatorios y el repositorio. `EVD-2026-003` y los demás documentos históricos **no se modifican**; las discrepancias quedan registradas aquí.

| N.º | Observación | Verificación | Tratamiento en esta matriz |
|---|---|---|---|
| 7.1 | Numeración `DOC-OF`: el informe preparatorio anunciaba 19 identificadores y enumeraba 21; además, el inventario maestro usaba otra secuencia (hasta `DOC-OF-16`). | Recuento de registros de 4.2 = 21. | Numeración única en 4.2; correspondencia en 4.4. |
| 7.2 | Informes previos indicaban 3 vistas en `06_vistas_dashboard.sql`. | El archivo define 1 vista: `vw_dashboard_operativo` (L12). | `DOC-EX-17` registra 1 vista. |
| 7.3 | Informes previos indicaban 8 routers. | `main.py` incluye 7 routers (`auth`, `usuario`, `cliente`, `producto`, `alquiler`, `detalle_alquiler`, `gastos`); los decoradores de `app/routes/` suman 38 endpoints (16 + 1 + 5 + 3 + 3 + 5 + 5). | La cifra de 38 endpoints coincide; el número de routers es 7. Las tareas `RM-DOC-010` y `RM-DOC-011` deben usar estas cifras y verificarlas de nuevo al redactarse. |
| 7.4 | `EVD-2026-003` (`I-040`) cita `estado_usuario` en `04_plantillas.sql:80,110` y en `05_consultas.sql`. | `04_plantillas.sql` tiene 0 coincidencias de `estado_usuario` y 2 de `es_recogida` (L80, L110); `05_consultas.sql` tiene 0 de ambas. `estado_usuario` solo aparece en `01_tablas.sql` (L361, L364) como nota. | La matriz y la checklist usan el hecho verificado (`es_recogida`). `EVD-2026-003` no se corrige; queda pendiente decidir si se registra una corrección formal. |
| 7.5 | El informe previo vinculaba `INDICE.md` con `I-039`. | En `EVD-2026-003`, `I-039` es `es_recogida` huérfano en el **frontend**; el hallazgo de `INDICE.md` es `I-038`. | `DOC-EX-11` y `RM-DOC-006` citan `I-038`. |
| 7.6 | Los informes previos hablaban en prosa de `RM-DOC-001`…`022` y `…024`, pero enumeraban 18 tareas. | La decisión n.º 10 fija el alcance en `RM-DOC-001`…`RM-DOC-018`. | Se conservan las 18 tareas; no se crean otras. |
| 7.7 | Ninguna tarea `RM-DOC` cubre la actualización de `user_stories.md` (decisión n.º 3) ni de `product_backlog.md` (decisión n.º 5); `RM-DOC-018` los proponía originalmente como candidatos a retirar. | `DOC-EX-28` y `DOC-EX-29` tienen 0 B. | Se conservan como `DOC-OF-10` y `DOC-OF-19`. `RM-DOC-018` se acota en `CHK-2026-001`. La asignación de una tarea queda como decisión pendiente; no se crea ninguna. |
| 7.8 | El criterio original de `RM-DOC-001` exigía 0 coincidencias de credencial también en `03_seed_data.sql`. | El seed conserva por decisión del propietario el comentario con la contraseña ficticia. | El criterio de `CHK-2026-001` se limita a los dos documentos Markdown y depende de la política pendiente. |
| 7.9 | Informes previos hablaban de «31 componentes» de frontend. | `src/components` tiene 32 archivos `.tsx` (25 en 5 carpetas modulares y 7 en `inputs`, `layout`, `productos`, `ui`); `src/utils` tiene 9 archivos. | `DOC-EX-08` usa las cifras verificadas. |
| 7.10 | El informe previo reclasificó `RM-DOC-001` a P2. | La reclasificación de `I-002` figura como propuesta en la auditoría P0.1; no existe decisión aprobada. | Se mantiene P0 con la propuesta anotada como pendiente. |
| 7.11 | `EVD-2026-003` registra `I-043` (P1, abierto) con «`vercel.json` ausente», y plantea las opciones de destino (a) Docker Compose, (b) Docker + orquestador, (c) PaaS con Dockerfile. | El 2026-11-09 existe `sga_frontend_jwt/vercel.json` (`9a04288`) con una regla `rewrites`; `docker-compose.yml`, los `Dockerfile` y `nginx.conf` siguen presentes; el propietario comunicó que Vercel es el destino principal del frontend. No existe `DEC-*`; `vercel.json` no define proxy hacia el backend; no hay evidencia de despliegue ejecutado ni validado. | Nueva evidencia registrada. `I-043` **no se marca como resuelto**: siguen pendientes la decisión formal, el destino del backend y de la base de datos, y la verificación en ejecución. `EVD-2026-003` no se modifica. |
| 7.12 | `DOC-EX-01` y `DOC-EX-08` describen los README raíz y del frontend sin Vercel ni estrategia de despliegue. | El 2026-11-09 se actualizaron `README.md` (badges de stack, estrategia de despliegue, correcciones IA-001: descripción Docker correcta; IA-002: PostgreSQL 16+ con aclaración) y `sga_frontend_jwt/README.md` (árbol real de `src/`, confirmación Vercel operativo); todos pendientes de commit. | `DOC-OF-01` permanece *Existente por actualizar* (`RM-DOC-008` pendiente: credenciales incorrectas, orden de scripts, usuarios de prueba). `DOC-OF-03` actualizado: `RM-DOC-014` **cerrada** (commit `2f1e14e`; criterios verificados). |

| 7.13 | Hallazgos técnicos adicionales identificados por auditoría estática el 2026-11-10 y registrados en `AUD-2026-007`. | DXA-06 (exposición probable de hash de contraseña, P0), DXA-12b (inicialización incompleta de funciones y triggers en entorno Docker, probable P1) y DXA-41 (inconsistencia `stamp` vs `upgrade`, verificado, P2). Los hallazgos documentales DXA-D1…DXA-D7 consolidan discrepancias ya registradas. `EVD-2026-003` no se modifica. | `AUD-2026-007` registrado en `01_auditorias/`; `00_indice.md` actualizado para incluirlo. Las correcciones técnicas no están autorizadas en esta intervención. |
| 7.14 | El propietario eliminó el paso de ejecución manual de scripts SQL del Paso 2 de la guía de instalación (`README.md` raíz) y confirmó que Alembic gestiona el versionamiento del esquema. | `README.md` actualizado: se añadió nota sobre `alembic upgrade head` en `entrypoint.sh`; los scripts de `database/01_esquema/` se conservan como referencia en el repositorio. `DOC-EX-01` permanece *Existente por actualizar* (`RM-DOC-008` pendiente): aún quedan las correcciones de credenciales incorrectas y usuarios de prueba del «Acceso Inicial». `I-016` y DXA-12b no quedan cerrados: la decisión del propietario sobre Alembic no verifica qué objetos SQL crea la migración en ejecución. |

---

## 8. Mantenimiento de la matriz

La matriz es un documento vivo. Git conserva el historial de modificaciones; no se establece una política de aprobación distinta de la ya acordada (el propietario revisa y autoriza las operaciones Git de escritura).

| Evento | Actualización requerida en esta matriz |
|---|---|
| **Se crea un documento** | Cambiar su categoría en 4.2 de *Futuro* a *Existente*; registrar su archivo en la sección 3 con un nuevo identificador `DOC-EX-NN` correlativo (sin reutilizar identificadores); actualizar el estado y la fecha. |
| **Se actualiza un documento** | Actualizar su estado y su evidencia en la sección 3 y su fila en 4.2 (por ejemplo, de *Desactualizado* a *Vigente*), indicando la evidencia verificable. |
| **Se aprueba una decisión documental** | Registrarla en 2.1 con su fecha; retirarla de 2.2; si se emite un `DEC-*`, citar su identificador. Las propuestas no se presentan como aprobadas. |
| **Cambia el estado de validación** | Actualizar la columna *Validación* de 4.2 y, si procede, las secciones 2.2 y 2.3. |
| **Se cierra una tarea relacionada** | Actualizar la sección 6 y marcar la tarea en `CHK-2026-001` con su evidencia de cierre. Los dos documentos deben usar los mismos identificadores y estados. |
| **Se agrega o retira un archivo documental** | Verificar los enlaces de `00_indice.md` y las rutas citadas en la matriz y en la checklist. |

Reglas adicionales:

1. Los identificadores `DOC-EX`, `DOC-OF`, `DOC-OP` y `RM-DOC` son estables y no se reutilizan.
2. Los documentos históricos `AUD-*`, `DXC-*` y `EVD-*` no se editan; sus discrepancias se registran en la sección 7.
3. Ningún documento de esta matriz debe contener contraseñas, hashes completos ni tokens. Las credenciales se citan solo por ruta y hallazgo.
4. Cada cambio relevante agrega una fila en la sección 9.

---

## 9. Historial de versiones

| Versión | Fecha | Línea base | Cambios | Estado |
|---|---|---|---|---|
| 0.1 | 2026-10-31 | `c100a78f53a61828bec1c17aff4c9e2017336c1b` | Creación: inventario `DOC-EX-01`…`DOC-EX-49`, catálogo `DOC-OF-01`…`DOC-OF-21` y `DOC-OP-01`…`DOC-OP-06`, correspondencia con `RM-DOC-001`…`RM-DOC-018`, observaciones de verificación. | En revisión por el propietario; sin commit. |
| 0.2 | 2026-11-09 | `9a0428822637197763ec3125ee5e3c64da78864e` | Actualización de metadatos y del estado Git; incorporación de `DOC-EX-50` (`sga_frontend_jwt/vercel.json`, sección 3.5); decisiones sobre Vercel y Docker/Nginx en 2.1.c; propuestas y aspectos no verificados en 2.2 y 2.3; nota en la sección 5; observaciones 7.11 y 7.12. No se alteran identificadores, estados de tareas ni registros previos. | En revisión por el propietario; sin commit. |
| 0.3 | 2026-11-10 | `9a0428822637197763ec3125ee5e3c64da78864e` | Registro de `AUD-2026-007` (DXA-06, DXA-12b, DXA-41, DXA-D1…DXA-D7); decisión 2.1.c-4 (Render, confirmada por propietario); actualización de propuesta en 2.2; observaciones 7.12 (ampliada) y 7.13 (nueva). No se alteran identificadores, estados de las 18 tareas ni registros históricos. | Versionado en commit `2f1e14e`. |
| 0.4 | 2026-11-10 | `2f1e14eef9ebc7c313b87d8541cf9288d9533a87` | Decisión 2.1.c-5 (Alembic, confirmada por propietario); observación 7.14 (nueva: eliminación de scripts SQL manuales del `README.md` raíz); actualización de obs. 7.12 (`RM-DOC-014` cerrada). No se alteran las 18 tareas ni registros históricos. | Pendiente de commit. |
