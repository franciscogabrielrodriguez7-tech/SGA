# AUDITORÍA INICIAL — ENTORNO DE DESARROLLO SGA

> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git`
> **Fecha de auditoría:** 2026-10-27
> **Modo:** exclusivamente lectura
> **Archivo creado:** solo este informe (autorizado por el usuario)
> **Dependencias instaladas:** ninguna · **Migraciones ejecutadas:** ninguna · **Commits/push/cambios de rama:** ninguno · **Archivos modificados/eliminados:** ninguno

---

## ÍNDICE

1. [Alcance, método y clasificación de evidencia](#1-alcance-método-y-clasificación-de-evidencia)
2. [Diagnóstico general (hallazgos A–H)](#2-diagnóstico-general)
3. [Inventario de herramientas y pruebas existentes](#3-entregable-2--inventario-de-herramientas-y-pruebas-existentes)
4. [Documentación disponible y faltante](#4-entregable-3--documentación-disponible-y-faltante)
5. [Riesgos y problemas prioritarios](#5-entregable-4--riesgos-y-problemas-prioritarios)
6. [Plan recomendado de implementación por etapas](#6-entregable-5--plan-recomendado-de-implementación-por-etapas)
7. [Anexo I — Verificación de hallazgos previos (H/C/P)](#7-anexo-i--verificación-de-hallazgos-previos-hcp)
8. [Anexo II — Evidencia bruta recolectada](#8-anexo-ii--evidencia-bruta-recolectada)
9. [Declaración final](#9-declaración-final)

---

## 1. Alcance, método y clasificación de evidencia

### 1.1 Acciones ejecutadas (solo lectura)

| Acción | Herramienta |
|---|---|
| Estado de repo, historia, ramas, archivos trackeados, remoto | `git status`, `git log`, `git branch -a`, `git ls-files`, `git ls-remote --heads origin`, `git shortlog`, `git cat-file`, `git merge-base`, `git config --get-all remote.origin.fetch` |
| Lectura de ~45 archivos (código, configs, docs, SQL) | `read` |
| Búsqueda estática de secretos, SQL crudo, auth, TODOs, contratos | `grep` (regex) |
| Inventario y métricas de estructura | `glob`, conteo por extensión, tamaños, líneas |
| Escaneo de patrones de credenciales (AWS/GitHub/OpenAI/clave privada) | `grep` regex |

### 1.2 Acciones NO ejecutadas (por restricción)

- `git fetch`, `commit`, `push`, `checkout`, `stash`, cambios de rama.
- `pip install`, `npm install`, `npm audit`, `pip-audit`.
- `alembic upgrade/revision/stamp`, `psql`, cualquier operación sobre datos.
- Ejecución de `npm run lint`, `npm run build`, `pytest` (entornos no instalados).
- Escaneo dinámico, pentest, verificación de servicios desplegados.

### 1.3 Convención de estados

| Estado | Significado |
|---|---|
| **Verificado** | Comprobado directamente en el repositorio local o en metadatos de Git. |
| **Probable** | Inferido desde evidencia estática; requiere confirmación en runtime o en GitHub. |
| **No comprobado** | No pudo establecerse sin salir del modo lectura. |

### 1.4 Convención de prioridad

| Prioridad | Significado |
|---|---|
| **P0** | Bloqueante: debe resolverse antes de iniciar desarrollo asistido por IA. |
| **P1** | Alto: resolver en las primeras 2 etapas. |
| **P2** | Medio: resolver en etapas intermedias. |
| **P3** | Bajo: deuda aceptable a corto plazo. |

> **Nota de seguridad del informe:** no se reproducen valores de credenciales. Las contraseñas de prueba detectadas se referencian solo por su ubicación (`archivo:línea`).

---

## 2. Diagnóstico general

SGA es un monorepo full-stack funcional con una base de ingeniería razonable para su tamaño: **FastAPI + SQLAlchemy 2 + JWT/bcrypt + PostgreSQL** en backend, **React 19 + TypeScript + Vite** en frontend, RBAC aplicado en casi todos los endpoints, auditoría de BD por triggers y **7.977 líneas** en `app/` + `src/`. La actividad está concentrada en 11 días (2026-09-10 → 2026-09-21, 18 commits, 1 autor).

Existe una **capa de documentación técnica de alta calidad (6 archivos, ~179 KB) aún no versionada**, que ya contiene tablas de riesgos propias (H-01…H-14, C-01…C-15, P-01…P-12).

El déficit estructural **no es de código sino de proceso**: no hay CI, no hay una sola prueba automatizada, no hay herramientas de calidad en backend, el TypeScript no está en `strict`, la documentación de requisitos/scrum existe pero está vacía, y **la rama local diverge del remoto**. Un proceso de desarrollo asistido por IA carecería hoy del circuito de verificación (checks automáticos + trazabilidad) necesario para confiar en la salida de un agente.

---

### 2.1 Bloque A — Repositorio, ramas e historia

| ID | Descripción | Evidencia | Estado | Riesgo / Impacto | Recomendación | Prioridad |
|---|---|---|---|---|---|---|
| **F-01** | Rama actual `dev`; HEAD = `14726adea5ea21512071ba339fbdb704bb953b29` — "docs: add SQL demo scripts for endpoints behavior", 2026-09-21, autor `gabielrodriguez` | `git status`; `git log -1` | Verificado | Ninguno por sí mismo; es la línea base de la auditoría | Fijar este SHA como "baseline de auditoría" en el registro de trazabilidad | P3 |
| **F-02** | El clon local es **single-branch** (`+refs/heads/dev:refs/remotes/origin/dev`). Existente además en remoto: `main` y `deployment`, no traídas localmente | `git config --get-all remote.origin.fetch`; `git ls-remote --heads origin` → `deployment`, `dev`, `main` | Verificado | No se puede auditar `main`/`deployment` ni validar el flujo dev→deployment | Fetch completo (con autorización) antes de la siguiente fase | P1 |
| **F-03** | **Divergencia local ↔ remoto en `dev`**: local `14726ad…`, remoto `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c`; el objeto remoto **no existe localmente** | `git rev-parse HEAD`/`origin/dev` = `14726ad`; `git ls-remote` = `12760d4`; `git cat-file -t 12760d4` → *could not get object info* | Verificado (divergencia); **ancestry: no comprobado** | Trabajar sobre base desactualizada; posible historia reescrita; el plan partiría de un estado no oficial | Resolver antes de cualquier implementación: fetch + `git merge-base` + decisión explícita (merge/rebase/reset) | **P0** |
| **F-04** | Historia corta y de autor único: 18 commits, 100 % `gabielrodriguez`, 2026-09-10 → 2026-09-21; sin actividad local posterior (36 días hasta hoy) | `git shortlog -sn --all`; `git log --format=%ad` | Verificado | Sin revisión por pares ni separación de roles; factor humano = 1 | Revisión obligatoria + CODEOWNERS antes de introducir agentes | P1 |
| **F-05** | Mensajes de commit inconsistentes: 2 commits idénticos `commit de actualizacíón` sin tipo; el resto mezcla Conventional Commits en inglés/español (`feat(ui)`, `fix(db)`, `chore`, `style`, `data`, `merge:`) | `git log --oneline` → `9c4a0fe`, `157e4a1` | Verificado | Imposible análisis semántico de cambios y generación de changelog automática | Adoptar Conventional Commits + commitlint en CI | P2 |

---

### 2.2 Bloque B — Estructura del proyecto

| ID | Descripción | Evidencia | Estado | Riesgo / Impacto | Recomendación | Prioridad |
|---|---|---|---|---|---|---|
| **F-06** | Monorepo de 3 componentes + docs: `database/` (10 SQL), `sga_backend_jwt/` (49 `.py`), `sga_frontend_jwt/` (41 `.ts/.tsx` en `src/`), `docs/`. **145 archivos trackeados**; **7.977 líneas** en `app/` + `src/` | `git ls-files`; conteo por extensión; `Measure-Object -Line` | Verificado | Define el alcance de las políticas por componente | Políticas y pipelines **por componente** (Python / TS / SQL) | P3 |
| **F-07** | Ausencia total de artefactos de infraestructura: sin `Dockerfile`, `docker-compose`, `Procfile`, `render.yaml`, `Makefile`, `Taskfile` | Glob de patrones → *No files found*; `git ls-files` | Verificado | Arranque y despliegue manuales y no reproducibles | Priorizar `render.yaml` + `Procfile` (y más adelante contenedorización) | P1 |
| **F-08** | **6 documentos de auditoría sin trackear** (`docs/01_arquitectura.md` … `docs/06_despliegue_configuracion.md`, ~179 KB, escritos 2026-10-19) | `git status --porcelain` → `?? docs/0X_*.md` | Verificado | Trabajo valioso fuera de versionado; pérdida posible; contienen hallazgos de seguridad sin issue asociado | Versionar (previa autorización) y registrar hallazgos en un tracker | **P0** |
| **F-09** | Rutas de documentación de proceso creadas pero sin contenido real (`docs/architecture`, `docs/requirements`, `docs/scrum`, `docs/ui_ux`) | `git ls-files docs/` | Verificado | Falsa sensación de documentación de proceso existente | Ver F-39 | P1 |

**Distribución de archivos trackeados por extensión:**

| Extensión | Cantidad | | Extensión | Cantidad |
|---|---|---|---|---|
| `.py` | 51 | | `.sql` | 10 |
| `.ts` | 23 | | `.css` | 7 |
| `.tsx` | 18 | | `.json` | 7 |
| `.md` | 17 | | `.png` / `.svg` / `.example` | 3 / 3 / 2 |
| *(otros)* | `.html` 1, `.ini` 1, `.mako` 1, `.docx` 1, `.jpeg` 1, `.txt` 1 | | | |

---

### 2.3 Bloque C — Tecnologías y dependencias

| ID | Descripción | Evidencia | Estado | Riesgo / Impacto | Recomendación | Prioridad |
|---|---|---|---|---|---|---|
| **F-10** | Backend con 21 dependencias **pinneadas exactas**: FastAPI 0.141.1, SQLAlchemy 2.0.52, pydantic 2.13.4, PyJWT 2.10.1, bcrypt 4.2.1, psycopg2-binary 2.9.12, APScheduler 3.11.3, uvicorn 0.52.3, gunicorn 23.0.0, python-dotenv 1.2.3, starlette 1.6.0, annotated-doc 0.0.5, anyio 4.14.2, click 8.4.2, greenlet 3.5.5, h11 0.16.0, idna 3.19, pydantic_core 2.46.4, typing-inspection 0.4.4, typing_extensions 4.16.0, annotated-types 0.8.0 | `sga_backend_jwt/requirements.txt:1-21` | Verificado | Reproducibilidad alta, pero sin herramienta de actualización ni auditoría de CVE | Mantener pins + `pip-audit`/Dependabot en CI | P2 |
| **F-11** | **`alembic` NO está declarado** en `requirements.txt` pese a ser obligatorio en la guía (`alembic stamp head`) y existir `alembic/` + `alembic.ini` | `requirements.txt` (ausente) vs `sga_backend_jwt/README.md:91-97` | Verificado | La instalación limpia descrita en el README falla en el paso 6 | Declarar `alembic` (y `pytest`, ver F-15) como dependencias explícitas | P1 |
| **F-12** | Sin **ninguna** herramienta de calidad ni grupo *dev* en backend: ausentes `pytest`, `ruff`, `mypy`, `black`, `pre-commit`; ausentes `pyproject.toml`, `ruff.toml`, `mypy.ini`, `setup.cfg` | `requirements.txt` + glob de configs → *No files found* | Verificado | Cero verificación estática en la capa con más lógica de negocio | `pyproject.toml` con ruff (+mypy gradual) y `requirements-dev.txt` | **P0** |
| **F-13** | Frontend con rangos `^` en dependencias (react 19.2.8, react-dom 19.2.8, react-router-dom 7.18.3, zod 4.6.5, @hookform/resolvers 5.9.1, typescript ~6.0.2, vite 8.2.0, oxlint 1.75.0, @types/*), pero con `package-lock.json` presente | `sga_frontend_jwt/package.json:12-27`; `package-lock.json` trackeado | Verificado | Riesgo controlado **solo si** se usa `npm ci`; con `npm install` la resolución puede variar | Estandarizar `npm ci` en CI y docs | P2 |
| **F-14** | Entornos **no instalados** en la máquina auditada (`node_modules/` y `venv/` ausentes) → por restricción no se ejecutaron `npm run lint` ni `npm run build` | `Test-Path sga_frontend_jwt\node_modules` = False; `Test-Path sga_backend_jwt\venv` = False | Verificado | El estado real de lint/build es **desconocido** (podría no compilar) | Ejecutar baseline de calidad en Etapa 1 (requiere autorización para instalar) | **P0** |

---

### 2.4 Bloque D — Herramientas de pruebas existentes

| ID | Descripción | Evidencia | Estado | Riesgo / Impacto | Recomendación | Prioridad |
|---|---|---|---|---|---|---|
| **F-15** | **Cero pruebas automatizadas**: sin `tests/`, sin `*.test.*`/`*.spec.*`, sin `pytest`/`vitest`/`jest`/`playwright`/`cypress`; el historial git **nunca** contuvo archivos de test | Glob `**/test*/**`, `**/*.{test,spec}.*` → *No files found*; `git log --all --name-only` filtrado por `test\|spec` → vacío | Verificado | Sin red de seguridad ante refactors; imposible validar salida de agentes IA objetivamente | Pirámide de pruebas en Etapa 3 | **P0** |
| **F-16** | Sin script `test` en `package.json`; único script de calidad = `"lint": "oxlint"` | `package.json:6-11` | Verificado | No hay punto de entrada único para "verificar" un cambio | Crear `npm run test`, `npm run typecheck` y task único por componente | P1 |
| **F-17** | Única "verificación" existente: 4 scripts SQL de demostración envueltos en transacción con `ROLLBACK` final (no alteran datos) | `database/06_demos_endpoints/01..04_*.sql` (ROLLBACK en `01:129`, `02:118`, `03:54`, `04:48`) | Verificado | Buen patrón, pero manual, no automatizado y no ejecutado por nadie | Convertirlos en semilla de pruebas de integración de BD | P2 |

---

### 2.5 Bloque E — Lint, tipado, compilación y CI

| ID | Descripción | Evidencia | Estado | Riesgo / Impacto | Recomendación | Prioridad |
|---|---|---|---|---|---|---|
| **F-18** | Linter frontend: `oxlint` con config **mínima** (2 reglas) | `.oxlintrc.json:4-7` (`react/rules-of-hooks` = error; `react/only-export-components` = warn; plugins `react`, `typescript`, `oxc`) | Verificado | Reglas de tipos/seguridad/posibles-bugs mínimas | Ampliar reglas y pasar a `--deny-warnings` en CI | P2 |
| **F-19** | **TypeScript sin `"strict": true`**; alias `@/*` declarado en `tsconfig.app.json` pero **no** configurado en `vite.config.ts` | `tsconfig.app.json:2-27` (sin `strict`; sí `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`); `vite.config.ts:1-7` | Verificado | Chequeo de tipos mucho más débil (null checks, `any` implícitos) | Activar `strict` incremental (`strictNullChecks` primero) y/o eliminar el alias | P1 |
| **F-20** | Build de producción definido: `"build": "tsc -b && vite build"` (incluye typecheck) | `package.json:8` | Verificado | Punto de control disponible y no usado automáticamente | Llevarlo a CI como check obligatorio | P2 |
| **F-21** | **Sin CI/CD**: no existe `.github/`, ningún workflow, ni GitLab/Circle/Travis; el historial de `dev` **nunca** tuvo YAML de CI | Glob `**/.github/**, **/*.yml, **/*.yaml` → *No files found*; `git log --all --name-only -- "*.yml" "*.yaml"` → vacío | Verificado | Lint, build y seguridad no se validan en ningún PR; un agente puede introducir regresiones sin detección | Crear workflows mínimos (Etapa 2) | **P0** |
| **F-22** | Sin hooks de pre-commit ni configuración de formateo (backend ni frontend) | Glob `.pre-commit-config.yaml`, `.editorconfig`, `biome.json` → *No files found* | Verificado | Formato y reglas solo se aplican "si el autor se acuerda" | Pre-commit local + equivalente en CI | P2 |

**Scripts disponibles en `package.json`:**

| Script | Comando | Función |
|---|---|---|
| `dev` | `vite` | Servidor de desarrollo (HMR) |
| `build` | `tsc -b && vite build` | Typecheck + build de producción |
| `lint` | `oxlint` | Análisis estático (2 reglas) |
| `preview` | `vite preview` | Vista previa del build |
| *(test)* | — | **No existe** |

---

### 2.6 Bloque F — Riesgos de seguridad (análisis estático)

| ID | Descripción | Evidencia | Estado | Riesgo / Impacto | Recomendación | Prioridad |
|---|---|---|---|---|---|---|
| **F-23** | **CORS inseguro**: `allow_origins` incluye `"*"` junto con `allow_credentials=True`; `allow_methods/headers = ["*"]` | `sga_backend_jwt/app/main.py:59-69` | Verificado (config); impacto en prod = **probable** | Cualquier origen puede invocar la API con credenciales; conflicto técnico CORS | Lista de orígenes fija por variable de entorno (Vercel + localhost) | **P0** |
| **F-24** | **Credenciales de prueba publicadas**: el seed incluye en un comentario la contraseña en texto plano de los empleados, y **todos comparten el mismo hash bcrypt** en 11 filas | `database/01_esquema/03_seed_data.sql:2-8` (comentario con credencial); `:16-28` (mismo `$2b$12$…` repetido) | Verificado | En repo público: credencial conocida + usuarios intercambiables; si un entorno real usó ese seed → acceso directo | Sacar la credencial del comentario, hashes únicos, regenerar seed, rotar en entornos que lo usen | **P0** |
| **F-25** | README documenta **tres credenciales de prueba que no existen** en el seed vigente (documentos y contraseñas distintos) | `README.md:80-88` vs `03_seed_data.sql:14-28` | Verificado | Imposible iniciar sesión siguiendo la guía oficial; incentiva improvisar credenciales | Sincronizar README con el seed real | P1 |
| **F-26** | **Fuga de información interna**: respuestas HTTP 500 devuelven `str(error)` al cliente (mensajes de BD/internos) | `app/routes/gastos_routes.py:48-51`, `:60-61`, `:71-72`; patrón `error=str(error)` con `code=500` | Verificado | Exposición de esquema/SQL/motivos internos al atacante | Respuesta genérica + log server-side (ver F-36) | P1 |
| **F-27** | **Sin rate limiting ni bloqueo de intentos** en `POST /auth/login` | `app/routes/auth_routes.py:13`; `requirements.txt` sin limitador; `main.py` sin middleware análogo; grep `rate.?limit\|slowapi\|max_attempts` → sin coincidencias | Verificado (ausencia) | Fuerza bruta sobre identificador (documento/teléfono) + contraseña | Limitar por IP/identificador con ventana de bloqueo | **P0** |
| **F-28** | JWT almacenado en `localStorage` y leído por todas las peticiones | `src/api/client.ts:29-41, 101-105`; `sga_frontend_jwt/README.md:118` | Verificado (diseño) | Cualquier XSS exfiltra la sesión completa (8 h) | Evaluar cookie `HttpOnly` + `SameSite`, o mitigación XSS estricta | P1 |
| **F-29** | El `rol_usuario` viaja en el JWT y **no se revalida contra BD** en cada petición; expiración 480 min | `app/utils/auth_dependency.py:58-61`; `app/config/settings.py:26` | Verificado | Token robado conserva privilegios hasta 8 h; cambiar rol/desactivar no surte efecto inmediato | Revalidar rol/estado por petición o TTL menor + revocación | P1 |
| **F-30** | Sin cabeceras de seguridad ni límites de request (sin helmet-equivalente, sin `max body size`, sin timeouts) | `app/main.py` (solo CORS + handler de HTTPException) | Verificado (ausencia) | Superficie ampliable de ataques a la API pública | Añadir middleware de cabeceras y límites | P2 |
| **F-31** | Swagger `/docs` expuesto **por defecto**; el checklist de producción **recomienda verificarlo públicamente** | `app/main.py:30-34` (`FastAPI(...)` sin `docs_url=None`); `docs/06_despliegue_configuracion.md:473` | Verificado (config); riesgo en prod = **probable** | Auto-documentación del catálogo completo de endpoints para atacantes | Deshabilitar `/docs` y `/openapi.json` en producción por variable de entorno | P1 |
| **F-32** | **Migración baseline destructiva**: `upgrade()` ejecuta `DROP` de índices, constraints e incluso `DROP TABLE auditoria_sistema` | `alembic/versions/d4f74f3d4896_baseline_schema.py:21-60` (p. ej. `:27 drop_table('auditoria_sistema')`, `:24-26` drops de índices) | Verificado | `alembic upgrade head` sobre BD creada por SQL **destruye** índices, FKs y la auditoría | Prohibir `upgrade` en BD existentes; usar `stamp head`; regenerar migración | **P0** |
| **F-33** | `alembic/env.py` **no importa `AuditoriaSistema`** (importa 6 modelos, no ese) → `revision --autogenerate` generaría `DROP TABLE auditoria_sistema` | `alembic/env.py:21-34` | Verificado | Migración destructiva generada por un comando de rutina | Importar el modelo + test de "migración limpia" | P1 |
| **F-34** | Interpolación f-string en SQL: `text(f"INTERVAL '{dias} days'")` con `dias` **proveniente del query string** | `app/controllers/alquiler_controller.py:402` ← `app/routes/alquiler_routes.py:75` (`dias: int = 2`) | Verificado | **Riesgo bajo**: FastAPI coerce a `int` y rechaza no-enteros con 422; patrón inseguro escalable | Bind param `:dias` (`CAST(:dias AS int)`) | P2 |
| **F-35** | Filtros de búsqueda con curingas sin escapar: `ilike(f"%{barrio}%")` | `app/controllers/alquiler_controller.py:377` y análogos | Verificado | No es inyección SQL (valor parametrizado), pero permite *wildcard injection* | Escapar `%`/`_` antes de `ilike` | P3 |
| **F-36** | **Sin logging estructurado**: solo dos `print()` en el arranque; sin `logging`, rotación ni captura de excepciones no manejadas | `app/main.py:13,16`; grep `import logging\|getLogger` → sin coincidencias | Verificado | Sin rastro de errores de producción; trazabilidad limitada a auditoría de BD | `logging` estructurado + handler global de excepciones | P1 |
| **F-37** | **Controles positivos verificados**: (a) sin secretos hardcodeados (scan AWS/GitHub/OpenAI/clave privada → *No matches*); (b) `.env` **no** trackeado (solo `.env.example`), excluido en `.gitignore:151,223`; (c) bcrypt real con `gensalt` y verificación segura; (d) **44 de 45 endpoints** declaran `requiere_rol(...)` y **7 de 8 routers** declaran `Depends(get_current_user)` (solo `POST /login` no lo hace, correcto); (e) SQL mayoritariamente parametrizado | `security.py:11-44`; `app/utils/roles.py`; `git ls-files` grep `.env`; `main.py`; `*_routes.py` | Verificado | — | Mantener como regresión vigilada por tests | — |
| **F-38** | RBAC con jerarquía documentada y grupos reutilizables coherentes con la matriz del proyecto | `app/utils/roles.py:10-59` (`SOLO_ADMIN`, `ADMIN_O_FACTURACION`, `ADMIN_O_LOGISTICO`, `STAFF_INTERNO`; jerarquía `admin > encargado_facturacion > encargado_logistico > cliente`) | Verificado | — | Formalizar la matriz como test de autorización (Etapa 3) | — |

**Detalle de autenticación/autorización verificado:**

- `app/utils/auth_dependency.py` → `HTTPBearer(auto_error=False)`, 401 propio si falta header, `UsuarioActual(id_usuario, rol_usuario)` desde `payload["sub"]` / `payload["rol_usuario"]`.
- `app/utils/roles.py` → `requiere_rol(*roles)` devuelve 403 (no 401) si el rol no alcanza.
- `app/utils/jwt_utils.py` → `crear_access_token`, `decodificar_access_token` con manejo de `TokenExpirado` y `TokenInvalido`.
- `app/utils/security.py` → `hashear_contrasena` / `verificar_contrasena` (bcrypt, `checkpw` protegido contra `ValueError`).
- Routers con auth a nivel de router (`dependencies=[Depends(get_current_user)]`): `alquiler:49`, `cliente:30`, `detalle_alquiler:31` y `:107`, `gastos:24`, `inventario:19`, `producto:28`, `usuario:30`. `auth_routes:10` no lo declara (correcto).

---

### 2.7 Bloque G — Documentación

| ID | Descripción | Evidencia | Estado | Riesgo / Impacto | Recomendación | Prioridad |
|---|---|---|---|---|---|---|
| **F-39** | **6 documentos de 0 bytes** trackeados: `docs/architecture/architecture_map.md`, `docs/requirements/user_cases.md`, `docs/requirements/user_stories.md`, `docs/scrum/product_backlog.md`, `docs/scrum/sprint_1_act.md`, `docs/ui_ux/mockups_links.md` | Tamaño 0 B en los 6 (`Get-ChildItem -Recurse docs`) | Verificado | Sin requisitos ni criterios de aceptación; sin "definición de hecho" verificable para agentes | Rellenar o eliminar (decisión explícita) en Etapa 0/1 | **P0** |
| **F-40** | Documentación técnica **de alta calidad pero sin versionar** (6 archivos, 179 KB): arquitectura, diccionario de datos, contrato API completo, componentes frontend, RBAC/reglas, despliegue — con tablas de riesgos propias (H-01…H-14, C-01…C-15, P-01…P-12) | `docs/01..06`; `git status` → untracked | Verificado | Mejor base de partida del proyecto, fuera de trazabilidad y sin issue asociado | Versionar y vincular cada hallazgo a un issue con prioridad | **P0** |
| **F-41** | README raíz completo (estructura, stack, instalación, acceso inicial, ramas), pero con **datos desactualizados** (credenciales, ver F-25) | `README.md:1-100` | Verificado | El primer contacto de un nuevo dev/agente recibe información falsa | Corregir sección "Acceso Inicial" | P1 |
| **F-42** | `database/README_base_de_datos.md` desactualizado: estructura sin `06_demos_endpoints/` ni `06_vistas_dashboard.sql`; exige **PostgreSQL 16** mientras el README raíz exige **14+** | `database/README_base_de_datos.md` (árbol y §"Orden lógico") vs `README.md:19,34` | Verificado | Conflicto de requisitos; guía de ejecución incompleta | Unificar versión mínima de PostgreSQL y árbol real | P2 |
| **F-43** | `database/03_documentacion/INDICE.md` describe un esquema anterior (documenta `es_recogida`, inexistente en `01_tablas.sql`; no refleja `tipo_movimiento` ni la tabla puente) | `INDICE.md:91` vs `01_tablas.sql:215,236,237` (posee `tipo_movimiento`; sin `es_recogida`) | Verificado | Diccionario de datos engañoso | Regenerar el índice desde el esquema real | P2 |
| **F-44** | **Contratos frontend ↔ backend desalineados**: `es_recogida` declarado/uso en el frontend pero ya inexistente en el modelo de datos (sustituido por `tipo_movimiento`) | `src/api/alquileres.ts:94,108`; `src/api/gastos.ts:14`; `src/interfaces/Logistica.ts:28,36`; `src/pages/Gastos/Gastos.tsx:102,266` vs `01_tablas.sql` | Verificado | Deserialización silenciosa (ya ocurrió: commit `1c93f17` corrigió un 422 similar) | Tipos generados desde OpenAPI o contract tests | P1 |
| **F-45** | Faltan documentos de gobernanza: `CONTRIBUTING.md`, `CODEOWNERS`, `SECURITY.md`, `CHANGELOG.md`, ADRs, guía de branching/PR, guía de uso de IA, política de versionado | `git ls-files` (ausentes) | Verificado | Sin reglas, un proceso asistido por IA no tiene límites ni criterios de aceptación | Elaborar en Etapa 0/1 | P1 |

---

### 2.8 Bloque H — Prácticas actuales de desarrollo

| ID | Descripción | Evidencia | Estado | Riesgo / Impacto | Recomendación | Prioridad |
|---|---|---|---|---|---|---|
| **F-46** | El README declara flujo `dev → deployment` vía PR y "nunca push directo a `main`" | `README.md:92-100` | Declaración **verificada**; cumplimiento = **no comprobado** (reglas de GitHub no consultables sin API/fetch) | Sin protección efectiva, la regla es solo intención | Verificar/activar protección de ramas y checks obligatorios (Etapa 2) | **P0** |
| **F-47** | Sin evidencia local de PRs, issues, etiquetas ni milestones | Sin acceso a la API de GitHub en esta auditoría | **No comprobado** | Imposible afirmar que existe trazabilidad real de cambios | Verificar en Etapa 0 con `gh api` (requiere autorización) | P1 |
| **F-48** | Complejidad concentrada: `alquiler_controller.py` = 546 líneas; patrón general *router → controller → SQL/ORM* con `try/except` por endpoint | Conteo por archivo; `git ls-files` | Verificado | Controllers difíciles de testear; lógica de negocio mezclada con acceso a datos | Extraer servicios puros (`utils/` ya existe) y testearlos primero | P2 |
| **F-49** | Auditoría de BD bien resuelta: triggers PL/pgSQL + tabla `auditoria_sistema` + `set_audit_context` (usuario por petición, ya que un trigger no lee un JWT) | `app/utils/audit_context.py:8-10`; `database/01_esquema/02_funciones_y_triggers.sql`; `sga_backend_jwt/README.md:153` | Verificado | — | Mantener y añadir pruebas de trigger | — |

---

## 3. Entregable 2 — Inventario de herramientas y pruebas existentes

### 3.1 Inventario por componente

| Categoría | Backend (`sga_backend_jwt`) | Frontend (`sga_frontend_jwt`) | Base de datos (`database/`) |
|---|---|---|---|
| **Runtime / stack** | Python 3.11+, FastAPI 0.141.1, SQLAlchemy 2.0.52, Pydantic 2.13.4, uvicorn 0.52.3 / gunicorn 23.0.0 | Node 20+, React 19.2.8, TypeScript 6.0.2, Vite 8.2.0, React Router 7.18.3, Zod 4.6.5 | PostgreSQL (14+ / 16 según documento) |
| **Auth / datos** | PyJWT 2.10.1, bcrypt 4.2.1, psycopg2-binary 2.9.12, APScheduler 3.11.3 | `localStorage` + Bearer token (`client.ts`) | Triggers PL/pgSQL, funciones, vistas dashboard |
| **Migraciones** | Alembic (presente en árbol, **ausente** en `requirements.txt`) — 1 baseline destructivo | — | Scripts SQL manuales ordenados (fuente de verdad real) |
| **Config de variables** | `.env.example` (4 vars) + `settings.py` con obligatorias validadas | `.env.example` (1 var `VITE_API_URL`) | — |
| **Linter** | **Ninguno** | `oxlint` (2 reglas) | **Ninguno** (sin `sqlfluff`) |
| **Tipado** | Sin `mypy`/`pyright` | `tsc -b` en build; **sin `strict`** | — |
| **Formateo** | Ninguno | Ninguno (sin Prettier/Biome) | Ninguno |
| **Tests** | **Ninguno** | **Ninguno** | 4 scripts demo con `ROLLBACK` (manual) |
| **CI/CD** | **Ninguno** | **Ninguno** | **Ninguno** |
| **Lockfile** | `requirements.txt` (pins exactos) | `package-lock.json` | — |
| **Infra / despliegue** | Sin Dockerfile/Procfile/render.yaml | `vercel.json` (rewrite SPA `/(.*) → /index.html`) | — |
| **Variables de entorno** | `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES` | `VITE_API_URL` | — |

### 3.2 Estado real de las pruebas

| Tipo | Existe | Detalle |
|---|:---:|---|
| Unitarias backend | ❌ | Sin `pytest`, sin `tests/` |
| Unitarias frontend | ❌ | Sin vitest/jest |
| Integración / BD | ❌ | Solo 4 scripts `06_demos_endpoints/*.sql` con `ROLLBACK` (manuales, nunca en CI) |
| Contract / API | ❌ | Swagger generado, pero sin test de contrato |
| E2E | ❌ | Sin Playwright/Cypress |
| Cobertura | ❌ | No medible (0 ejecuciones) |
| Verificación estática en CI | ❌ | Ningún check automático en ningún PR |

### 3.3 Capas funcionales verificadas (base para diseñar pruebas)

| Capa | Evidencia | Estado |
|---|---|---|
| Contrato de respuesta estándar `{status, mensaje, data, error, code}` | `app/utils/response.py`; `src/api/client.ts:43-49` | Verificado |
| Validación de entrada con Pydantic v2 | `app/schemas/*.py` (6 esquemas) | Verificado |
| Validación en cliente con Zod + `@hookform/resolvers` | `package.json:14,17`; `src/utils/validations.ts`, `validacionesAlquiler.ts` | Verificado |
| Manejo unificado de errores HTTP → sobre estándar | `app/main.py:81-97` | Verificado |
| Scheduler de vencimientos (00:05 America/Bogota, APScheduler) | `app/main.py:42-52`; `app/utils/scheduler.py` | Verificado |
| Protección de rutas en cliente | `src/components/layout/ProtectedRoute.tsx`; `src/context/AuthContext.tsx` | Verificado |
| Permisos por rol en UI | `src/utils/permisos.ts` | Verificado |

---

## 4. Entregable 3 — Documentación disponible y faltante

### 4.1 Disponible y vigente

| Documento | Tamaño | Contenido | Vigencia |
|---|---|---|---|
| `README.md` (raíz) | — | Descripción, stack, instalación (4 pasos), acceso inicial, ramas | Vigente **salvo** credenciales (F-25) |
| `sga_backend_jwt/README.md` | — | Instalación backend, Alembic, comandos, notas | Vigente; dependencia `alembic` ausente (F-11) |
| `sga_frontend_jwt/README.md` | — | Instalación frontend, comandos, auth/roles/CORS | Vigente |
| `database/README_base_de_datos.md` | 7.697 B | Scripts, orden de ejecución, estado de validación | Parcialmente desactualizado (F-42) |
| `database/03_documentacion/INDICE.md` | 8.528 B | Diccionario de tablas | **Desactualizado** (F-43) |
| `docs/01_arquitectura.md` | 24.508 B | Tiers, stack, flujo, despliegue, riesgos H-01…H-14 | Reciente, **sin versionar** (F-40) |
| `docs/02_base_de_datos.md` | 34.385 B | Diccionario de datos, triggers PL/pgSQL | Reciente, **sin versionar** |
| `docs/03_api_contrato.md` | 36.324 B | Catálogo completo de endpoints y códigos | Reciente, **sin versionar** |
| `docs/04_frontend_componentes.md` | 24.432 B | Organización, CSS, consumo de servicios | Reciente, **sin versionar** |
| `docs/05_reglas_negocio_rbac.md` | 36.164 B | Reglas de negocio, matriz RBAC, pendientes P-01…P-12 | Reciente, **sin versionar** |
| `docs/06_despliegue_configuracion.md` | 22.970 B | Despliegue Render/Vercel, riesgos C-01…C-15, checklists | Reciente, **sin versionar** |
| `docs/architecture/*` | 4 archivos | MER, diagrama de clases/dominio (PNG), diccionario (.docx) | Útil; `architecture_map.md` = 0 B |
| Swagger `/docs` | auto | API interactiva en runtime | No ejecutado en esta auditoría |
| `database/06_demos_endpoints/*.sql` | 4 archivos | Demos transaccionales con `ROLLBACK` | Vigente (commit `14726ad`) |

### 4.2 Faltante o vacío

| Ítem | Estado | Hallazgo |
|---|---|---|
| `docs/requirements/user_cases.md` | **0 bytes** | F-39 |
| `docs/requirements/user_stories.md` | **0 bytes** | F-39 |
| `docs/scrum/product_backlog.md` | **0 bytes** | F-39 |
| `docs/scrum/sprint_1_act.md` | **0 bytes** | F-39 |
| `docs/ui_ux/mockups_links.md` | **0 bytes** | F-39 |
| `docs/architecture/architecture_map.md` | **0 bytes** | F-39 |
| `CONTRIBUTING.md` | Inexistente | F-45 |
| `CODEOWNERS` | Inexistente | F-45 |
| `SECURITY.md` / política de divulgación | Inexistente | F-45 |
| `CHANGELOG.md` | Inexistente | F-45 |
| ADR (Architecture Decision Records) | Inexistente | F-45 |
| Guía de branching / PR / commits | Inexistente | F-45 |
| Guía de uso de IA en el proyecto | Inexistente | F-45 |
| OpenAPI versionado (fuente de verdad del contrato) | No versionado | F-44 |
| Informe de dependencias / CVEs | Inexistente | F-10 |
| Matriz de autorización oficial aprobada | Parcial (`docs/05`, 12 decisiones **pendientes** P-01…P-12) | F-45 |

### 4.3 Decisiones de negocio pendientes detectadas (`docs/05`)

| ID | Decisión pendiente | Impacto declarado |
|---|---|---|
| P-01 | Política de contraseñas (longitud, complejidad, expiración, reutilización) | Alto — el backend solo exige `min_length=4`; seed con contraseña compartida |
| P-02 | Rotación/revocación de `JWT_SECRET_KEY` y invalidación al cambiar rol | Alto — token robado conserva privilegios 8 h |
| P-03 | Sesión multi-dispositivo / blacklist de tokens | Medio — solo cierre de sesión local |
| P-04 | Reapertura de alquileres (hoy solo por consola SQL, sin trazabilidad) | Medio — operación crítica sin auditoría de usuario |
| P-05 | ¿El logístico ve el historial de auditoría? | Medio |
| P-06 | Alcance del logístico sobre estados (`cancelado` es irreversible) | Alto |
| P-07 | Incoherencia de inventario (mismo dato vía otra ruta) | Bajo |
| P-08 | El resumen semanal de gastos incluye entregas/recogidas | Medio — dato financiero posible­mente incorrecto |
| P-09 | Política de depósito (retenido/devuelto, morosidad) | Medio |

---

## 5. Entregable 4 — Riesgos y problemas prioritarios

### 5.1 Top 10 priorizado

| # | ID | Riesgo | Prioridad |
|---|---|---|---|
| 1 | **F-03** | Rama local `dev` diverge del remoto: todo el trabajo posterior partiría de una base no oficial | **P0** |
| 2 | **F-08 / F-40** | Auditoría técnica completa (179 KB) sin versionar y sin issues asociados | **P0** |
| 3 | **F-15 / F-21** | Cero pruebas y cero CI: ningún cambio queda verificado automáticamente | **P0** |
| 4 | **F-12 / F-14** | Sin herramientas de calidad en backend y baseline de lint/build **desconocido** | **P0** |
| 5 | **F-32 / F-33** | Migración Alembic destructiva + `env.py` incompleto → riesgo de destrucción de esquema y auditoría | **P0** |
| 6 | **F-24 / F-25** | Credenciales de prueba publicadas + hash compartido + README contradictorio | **P0** |
| 7 | **F-27 / F-23** | Login sin rate limiting y CORS comodín con credenciales en API expuesta | **P0** |
| 8 | **F-39** | Requisitos/stories/backlog vacíos: no existe criterio de aceptación verificable | **P0** |
| 9 | **F-46 / F-47** | Flujo de ramas declarado pero sin verificación de protección de GitHub (**no comprobado**) | **P0** |
| 10 | **F-26 / F-29 / F-31** | Fuga de errores internos, rol no revalidado (TTL 8 h), Swagger público | **P1** |

### 5.2 Mapa de riesgos por categoría

| Categoría | Hallazgos |
|---|---|
| **Seguridad** | F-23, F-24, F-25, F-26, F-27, F-28, F-29, F-30, F-31, F-32, F-33 — *positivos: F-37, F-38, F-49* |
| **Integridad de datos** | F-32, F-33, F-17 (verificación manual), F-44 |
| **Proceso / trazabilidad** | F-03, F-04, F-05, F-08, F-21, F-45, F-46, F-47 |
| **Calidad de software** | F-12, F-14, F-15, F-16, F-18, F-19, F-22, F-44, F-48 |
| **Documentación** | F-39, F-40, F-41, F-42, F-43 |
| **Operación / despliegue** | F-07, F-11, F-36 |

### 5.3 Ítems NO comprobados

1. Reglas de protección de rama y requerimiento de checks en GitHub (`main`, `deployment`, `dev`).
2. Existencia real de PRs / issues / etiquetas / milestones.
3. Contenido y ancestry de las ramas `main` y `deployment` (no traídas: F-02).
4. Relación exacta local↔remoto en `dev` (remoto avanzado vs historia reescrita).
5. Ejecución real de `npm run lint`, `npm run build` y del backend (entornos no instalados por restricción).
6. Estado real de la BD: correspondencia entre `01_tablas.sql`, modelos ORM y el baseline de Alembic.
7. Versión efectiva de PostgreSQL en los entornos existentes.
8. Servicios ya desplegados (Render/Vercel) y secretos configurados allí.
9. Vulnerabilidades en dependencias (`pip-audit` / `npm audit` no ejecutados: requieren red e instalación).
10. Contenido de `.env` reales en máquinas de desarrollo (localmente solo existen los `.env.example`).

### 5.4 Hipótesis (razonables, no verificadas)

- **H-a:** La divergencia de `dev` (F-03) se deba a trabajo hecho directamente en GitHub (editor web / Codespaces) sin pull local.
- **H-b:** El proyecto está en fase de "prototipo avanzado / despliegue piloto": despliegue Render/Vercel documentado pero sin CI ni pruebas que lo acompañen.
- **H-c:** La documentación `docs/01..06` fue generada recientemente por una auditoría asistida por IA y quedó pendiente de commit.

---

## 6. Entregable 5 — Plan recomendado de implementación por etapas

> **Ninguna acción de este plan ha sido implementada.** Está propuesta a la espera de autorización. Cada etapa tiene un **gate** (condición de salida verificable) para trazar el avance.

### Etapa 0 — Alineación del repositorio y gobernanza base *(≈3-4 días)*

1. Resolver la divergencia local↔remoto (F-03) con análisis de ancestry y decisión explícita documentada.
2. Fetch completo de `main` y `deployment`; auditar su estado (F-02).
3. Versionar `docs/01..06` y registrar sus hallazgos H/C/P como issues con prioridad (F-40).
4. Verificar/activar protección de ramas y checks obligatorios en GitHub (F-46, F-47).
5. Elaborar `CONTRIBUTING.md` + regla de Conventional Commits (F-05, F-45).
6. Decidir el destino de los 6 docs vacíos: rellenar o eliminar (F-39).

**Gate G0:** HEAD oficial sincronizado · docs versionados · reglas de rama verificadas · backlog de hallazgos con IDs y responsables.

### Etapa 1 — Baseline de calidad por componente *(≈1 semana)*

1. Backend: `pyproject.toml` + `ruff` (lint/format) + `requirements-dev.txt`; declarar `alembic` (F-11, F-12).
2. Backend: `mypy` gradual (empezar por `app/utils/` y `app/schemas/`).
3. Frontend: activar `strict` por etapas y ampliar `oxlint` (F-18, F-19).
4. Pre-commit local equivalente a los checks de CI (F-22).
5. Ejecutar por primera vez lint + build y **registrar la deuda existente** (F-14).

**Gate G1:** `lint` y `typecheck` en 0 errores sobre el código actual, o deuda lista y acotada.

### Etapa 2 — Integración continua mínima *(≈1 semana)*

1. `.github/workflows/ci.yml` por componente: `npm ci` → oxlint → `tsc --noEmit` → `npm run build` → ruff → mypy (F-21).
2. Secret scanning (gitleaks/trufflehog) + `pip-audit`/`npm audit` como check no bloqueante inicial (prevención F-24).
3. Checks obligatorios en PR (F-46) + Dependabot.
4. Guardarraíl de migraciones: impedir `alembic upgrade` sobre BD ya creada y corregir `env.py` (F-32, F-33) **antes** de automatizar migraciones.

**Gate G2:** ningún PR mergeable sin checks verdes; cero secretos detectados en historial.

### Etapa 3 — Estrategia de pruebas *(≈2-3 semanas, incremental)*

1. **Unidades (backend)** en `utils/` puro: `tiempo.py`, `unidades.py`, precios, `db_errors.py`, `security.py` → alto rendimiento bajo esfuerzo.
2. **RBAC como test**: matriz de autorización (44 endpoints × 4 roles) generada automáticamente → protege F-37/F-38.
3. **Integración BD**: convertir los 4 scripts `06_demos_endpoints` (con `ROLLBACK`) en tests de integración (F-17) + tests de triggers.
4. **Contract**: exportar OpenAPI y validar respuestas (ataca F-44).
5. **E2E (Playwright):** login, creación de alquiler, entrega/recogida, 403 por rol.
6. `pytest` + `vitest` en CI con cobertura creciente (5 % → 30 % → 60 %).

**Gate G3:** suite automatizada en cada PR; 5 flujos críticos E2E cubiertos.

### Etapa 4 — Correcciones de seguridad prioritarias *(≈1-2 semanas, tras autorización)*

1. CORS parametrizable sin `"*"` (F-23)
2. Rate limiting en login (F-27)
3. Respuestas 500 genéricas + logging (F-26, F-36)
4. `/docs` deshabilitable en producción (F-31)
5. Revalidación de rol/estado o TTL menor (F-29)
6. Corrección de seed y README (F-24, F-25)
7. Cabeceras y límites de request (F-30)
8. `GET /health` con `SELECT 1`

**Gate G4:** checklist de seguridad cerrado con evidencia por hallazgo y test de regresión asociado.

### Etapa 5 — Trazabilidad y políticas de agentes de IA *(≈1-2 semanas)*

1. **Registro de trazabilidad unívoco:** `issue ID` → rama `feat/<issue>-slug` → PR → checks → evidencia (test output) → commit semántico.
2. **Política de agentes** (`AGENTS.md` / `CONTRIBUTING`): alcance permitido por rol del agente (lectura, propuesta, implementación, prueba), prohibición de merge automático, obligación de citar evidencia verificable y separar hechos / hipótesis, prohibición de inventar funcionalidades.
3. **Checklist de auditoría automatable:** lint + typecheck + tests + secret scan + diff de contrato API + revisión humana obligatoria.
4. **ADRs** para decisiones estructurales (JWT vs cookie, Alembic vs SQL, estado de contratos).
5. Definir las 12 decisiones pendientes P-01…P-12 de `docs/05`.

**Gate G5:** todo cambio con trazabilidad completa issue→PR→check→evidencia; política de agentes publicada.

### Etapa 6 — Mantenimiento continuo *(recurrente)*

Checklist por despliegue · revisión mensual de accesos y auditoría · trimestral de dependencias (F-10) · semestral de matriz RBAC (F-38) · medición de cobertura y lead time.

### Resumen de priorización

| Etapa | Semana aprox. | Objetivo | Gate |
|---|---|---|---|
| 0 | 1 | Sincronizar y gobernar | G0 |
| 1 | 2 | Calidad estática local | G1 |
| 2 | 3 | CI obligatoria | G2 |
| 3 | 4-6 | Pruebas automatizadas | G3 |
| 4 | 5-7 | Seguridad correctiva | G4 |
| 5 | 7-9 | Trazabilidad y agentes | G5 |
| 6 | Continuo | Mantenimiento | Métricas |

---

## 7. Anexo I — Verificación de hallazgos previos (H/C/P)

La documentación sin versionar de `docs/01..06` contiene una auditoría previa. Se **verificaron independientemente** los siguientes:

| ID previo | Afirmación | Verificación propia | Estado |
|---|---|---|---|
| **H-01 / C-05** | CORS con `"*"` + `allow_credentials=True` | `app/main.py:59-69` | ✅ Confirmado |
| **H-02 / P-02** | Rol en JWT sin revalidación; TTL 480 min | `auth_dependency.py:58-61`; `settings.py:26` | ✅ Confirmado |
| **H-05** | README con credenciales que no coinciden con el seed | `README.md:80-88` vs `03_seed_data.sql:14-28` | ✅ Confirmado |
| **H-07** | `es_recogida` en tipos frontend, ya inexistente en BD | `src/api/*.ts`, `interfaces/Logistica.ts` vs `01_tablas.sql` | ✅ Confirmado |
| **H-08 / C-03** | Baseline de Alembic destructivo en `upgrade()` | `d4f74f3d4896_baseline_schema.py:21-60` | ✅ Confirmado |
| **H-10** | 6 documentos de `docs/` vacíos | Tamaño 0 B en los 6 | ✅ Confirmado |
| **H-11** | Sin suite de pruebas automatizadas | Glob + historial git | ✅ Confirmado |
| **H-13** | `alembic` no declarado en `requirements.txt` | `requirements.txt:1-21` | ✅ Confirmado |
| **C-09** | Sin `.github/workflows` | Glob + historial git | ✅ Confirmado |
| **C-10** | `package.json` con rangos `^` | `package.json:12-27` | ✅ Confirmado |
| **C-11** | `tsconfig` sin `strict` y alias sin resolver en Vite | `tsconfig.app.json`; `vite.config.ts` | ✅ Confirmado |
| **C-15** | `alembic/env.py` sin importar `AuditoriaSistema` | `env.py:21-34` | ✅ Confirmado |
| **H-03, H-04, H-06, H-09, H-12, H-14, C-01, C-02, C-04, C-06…C-08, C-12…C-14, P-01…P-12** | — | No re-verificadas una a una en esta auditoría | ⚠️ No comprobadas aquí |

**Hallazgos nuevos no presentes en la auditoría previa:** F-02, F-03 (divergencia local/remoto), F-04, F-05 (historia y commits), F-06, F-14 (entornos no instalados), F-16, F-17, F-22, F-24 (credencial en comentario + hash compartido), F-26 (`str(error)` en 500), F-27 (sin rate limiting), F-28 (localStorage), F-30, F-31 (`/docs` público), F-34, F-35, F-36 (sin logging), F-42 (PostgreSQL 14 vs 16).

---

## 8. Anexo II — Evidencia bruta recolectada

### 8.1 Estado del repositorio

```
Rama: dev (up to date con origin/dev según ref local)
HEAD: 14726adea5ea21512071ba339fbdb704bb953b29
Autor: gabielrodriguez · Fecha: 2026-09-21 · Mensaje: docs: add SQL demo scripts for endpoints behavior
remote: https://github.com/franciscogabrielrodriguez7-tech/SGA.git
remote.origin.fetch: +refs/heads/dev:refs/remotes/origin/dev   ← clon single-branch
origin/dev (local): 14726adea5ea21512071ba339fbdb704bb953b29
HEAD (local):       14726adea5ea21512071ba339fbdb704bb953b29

git ls-remote --heads origin:
  0bc33acba885f22362b693c890152dfeb7f4688c  refs/heads/deployment
  12760d4b86d40e0eefa7ef8cc4a9bb68292b476c  refs/heads/dev      ← DIFIERE del local
  e4d44117522b79b1c6c68bf5040aaa46a517773f  refs/heads/main

git cat-file -t 12760d4b… → fatal: could not get object info (objeto inexistente localmente)
Archivos trackeados: 145 · Commits: 18 · Autor único: gabielrodriguez
Primer commit: 2026-09-10 · Último commit: 2026-09-21
Archivos untracked: docs/01..06_*.md (escritos 2026-10-19)
```

### 8.2 Historial completo de commits

```
14726ad 2026-09-21 docs: add SQL demo scripts for endpoints behavior
a962621 2026-09-16 style(ui): ocultar titulo SGA en la barra superior en version movil
30529b6 2026-09-16 style(ui): arreglar grid de form de usuarios en version movil
1c93f17 2026-09-16 fix(ui): mapear correctamente estado_registro en frontend para evitar errores de deserialización y status 422
8ad273c 2026-09-16 fix(db): corregir trigger de autodesactivacion y refactorizar UI de usuarios con modal
8bb17ad 2026-09-16 feat(ui): toggle para mostrar/ocultar productos inactivos en frontend
5b26a61 2026-09-16 style(ui): vista responsive con cards para gestion de productos
b7e425a 2026-09-16 feat(ui): implementar CRUD completo para gestion de productos mediante modal (Opción B)
84f77de 2026-09-16 fix(orm): corregir bugs en refactorizacion ORM de alquiler_controller
9c1af42 2026-09-15 feat(audit): auditoria maestra completa -- DB, backend ORM, frontend UX
9c4a0fe 2026-09-11 commit de actualizacíón
157e4a1 2026-09-11 commit de actualizacíón
b0f6a5b 2026-09-11 chore: rename favicon to sga_favicon.jpeg and add gunicorn to requirements
782fe26 2026-09-10 data: actualizar seed — andamios y accesorios en SEMANA, rana y escalera en DIA
ba5a190 2026-09-10 build: add vercel.json deploy config from remote
fb2c62c 2026-09-10 data: precios reales en seed — andamios 15000, planchón extra 8000, crucetas gratis
8e0986f 2026-09-10 feat: precio_base_extra en producto — precios diferenciados para items extra
a4c0cc7 2026-09-10 merge: local + remote/database - tipo_movimiento, tabla puente, resumen UI
```

### 8.3 Estructura de archivos trackeados (145)

```
.gitignore · LICENSE · README.md
database/
  01_esquema/01_tablas.sql … 06_vistas_dashboard.sql      (6 archivos)
  03_documentacion/INDICE.md
  06_demos_endpoints/01..04_demo_*.sql                    (4 archivos)
  README_base_de_datos.md
docs/
  architecture/{architecture_map.md (0 B), Diagrama_clases_SGA.png,
                Diagrama_dominio_SGA.drawio.png, Diccionario_Datos_SGA.docx, MER_SGA.drawio.png}
  requirements/{user_cases.md (0 B), user_stories.md (0 B)}
  scrum/{product_backlog.md (0 B), sprint_1_act.md (0 B)}
  ui_ux/mockups_links.md (0 B)
sga_backend_jwt/
  .env.example · README.md · alembic.ini · requirements.txt
  alembic/{env.py, script.py.mako, README, versions/d4f74f3d4896_baseline_schema.py}
  app/{main.py, __init__.py}
  app/config/{database.py, settings.py, __init__.py}
  app/controllers/{alquiler, auditoria, cliente, detalle_alquiler, inventario,
                   logistica_alquiler, producto, usuario}_controller.py
  app/models/{alquiler, auditoria_sistema, detalle_alquiler, logistica_alquiler,
              logistica_alquiler_alquiler, producto, usuario}.py
  app/routes/{alquiler, auth, cliente, detalle_alquiler, gastos, inventario,
              producto, usuario}_routes.py
  app/schemas/{alquiler, cliente, detalle_alquiler, logistica_alquiler,
               producto, usuario}_schema.py
  app/utils/{audit_context, auth_dependency, db_errors, jwt_utils, response, roles,
             scheduler, security, tiempo, unidades}.py
sga_frontend_jwt/
  .env.example · .oxlintrc.json · LICENSE · README.md · index.html · package.json
  package-lock.json · tsconfig{,.app,.node}.json · vercel.json · vite.config.ts
  src/{App.tsx, main.tsx, index.css}
  src/api/{alquileres, auth, client, clientes, detalleAlquiler, gastos, productos, usuarios}.ts
  src/components/{inputs, layout, productos, ui}/*
  src/context/AuthContext.tsx
  src/interfaces/{Alquiler, Cliente, DetalleProducto, InputMonedaProps, Logistica,
                  PrecioFinal, Producto, Usuario}.ts
  src/pages/{Alquileres, CrearAlquiler, Dashboard, Gastos, Login, Productos, Usuarios}/*
  src/styles/{base, components, layout, tokens}.css
  src/utils/{permisos, precios, tiempoUi, validacionesAlquiler, validations, vencimiento}.ts
```

### 8.4 Métricas de tamaño

| Métrica | Valor |
|---|---|
| Archivos trackeados | 145 |
| Archivos `.py` en `sga_backend_jwt/app` | 49 (149.973 bytes) |
| Archivos en `sga_frontend_jwt/src` | 48 (190.219 bytes) |
| Líneas totales en `app/` + `src/` | 7.977 |
| Líneas en `alquiler_controller.py` | 546 |
| Documentación `docs/01..06` (sin versionar) | ~179 KB en 6 archivos |
| Commits / autores | 18 / 1 |

### 8.5 Dependencias declaradas

**Backend — `sga_backend_jwt/requirements.txt` (21, pins exactos):**
`annotated-doc 0.0.5`, `annotated-types 0.8.0`, `anyio 4.14.2`, `APScheduler 3.11.3`, `bcrypt 4.2.1`, `click 8.4.2`, `fastapi 0.141.1`, `greenlet 3.5.5`, `h11 0.16.0`, `idna 3.19`, `psycopg2-binary 2.9.12`, `PyJWT 2.10.1`, `pydantic 2.13.4`, `pydantic_core 2.46.4`, `python-dotenv 1.2.3`, `SQLAlchemy 2.0.52`, `starlette 1.6.0`, `typing-inspection 0.4.4`, `typing_extensions 4.16.0`, `uvicorn 0.52.3`, `gunicorn 23.0.0`.
**Ausentes:** `alembic`, `pytest`, `ruff`, `mypy`, `pre-commit`, `pip-audit`.

**Frontend — `sga_frontend_jwt/package.json`:**
- `dependencies`: `@hookform/resolvers ^5.9.1`, `react ^19.2.8`, `react-dom ^19.2.8`, `react-router-dom ^7.18.3`, `zod ^4.6.5`
- `devDependencies`: `@types/node ^24.13.3`, `@types/react ^19.2.17`, `@types/react-dom ^19.2.3`, `@vitejs/plugin-react ^6.0.4`, `oxlint ^1.75.0`, `typescript ~6.0.2`, `vite ^8.2.0`
- **Ausentes**: framework de tests, Prettier/Biome, Playwright/Cypress.

### 8.6 Resultados de búsquedas de seguridad

| Búsqueda (regex) | Resultado |
|---|---|
| `AKIA[0-9A-Z]{16}` / clave privada PEM / `sk-…` / `ghp_…` / `xox…` / `AIza…` | **Sin coincidencias** |
| Archivos `.env` trackeados | **Ninguno** (solo `.env.example` ×2) |
| Archivos `.env` existentes localmente | **Ninguno** |
| `rate limit` / `slowapi` / `limiter` / `max_attempts` | **Sin coincidencias** |
| `import logging` / `getLogger` | **Sin coincidencias** |
| `TODO` / `FIXME` / `HACK` / `XXX` en `.py` | **Sin coincidencias reales** (2 falsos positivos por palabra "TODO" dentro de "TODOS") |
| `text(f"…")` / SQL con f-string | **5 coincidencias**: `producto_controller:71`, `inventario_controller:35`, `alquiler_controller:98,402`, `usuario_controller:88` (columnas/constantes internas; `dias` es la única de origen externo) |
| `BEGIN TRANSACTION` / `ROLLBACK` en SQL | 4 archivos (los demos) |
| YAML de CI en historial | **Ninguno** |
| Archivos de test en historial | **Ninguno** |

### 8.7 Matriz de autorización por endpoint (45 endpoints)

| Router | Auth de router | Endpoints con `requiere_rol` |
|---|---|---|
| `alquiler_routes.py` | ✅ `get_current_user` (`:49`) | 17/17 (`STAFF_INTERNO` ×11, `ADMIN_O_FACTURACION` ×6) |
| `auth_routes.py` | — (correcto) | 0/1 (`POST /login` público) |
| `cliente_routes.py` | ✅ (`:30`) | 6/6 (`STAFF_INTERNO` ×2, `ADMIN_O_FACTURACION` ×4) |
| `detalle_alquiler_routes.py` | ✅ (`:31`, `:107`) | 4/4 (`ADMIN_O_FACTURACION` ×3, `STAFF_INTERNO` ×1) |
| `gastos_routes.py` | ✅ (`:24`) | 3/3 (`STAFF_INTERNO` ×2, `ADMIN_O_FACTURACION` ×1) |
| `inventario_routes.py` | ✅ (`:19`) | 2/2 (`STAFF_INTERNO` ×1, `ADMIN_O_FACTURACION` ×1) |
| `producto_routes.py` | ✅ (`:28`) | 6/6 (`SOLO_ADMIN` ×3, `STAFF_INTERNO` ×3) |
| `usuario_routes.py` | ✅ (`:30`) | 6/6 (`SOLO_ADMIN` ×6) |
| **Total** | 7/8 routers | **44/45 endpoints** |

### 8.8 Bloques de código clave

**CORS — `app/main.py:59-69`**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Configuración JWT — `app/config/settings.py:9-26`**
```python
DATABASE_URL = os.getenv("DATABASE_URL")        # obligatoria
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")    # obligatoria
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))  # 8 horas
```

**Patrón de error con fuga — `app/routes/gastos_routes.py:48-51`**
```python
except Exception as error:
    db.rollback()
    return response_error(mensaje="Error al registrar el gasto", error=str(error), code=500)
```

**Interpolación en SQL — `app/controllers/alquiler_controller.py:402`**
```python
func.current_date() + text(f"INTERVAL '{dias} days'")   # 'dias' llega del query string
```

**Configuración de tipado — `sga_frontend_jwt/tsconfig.app.json` (sin `strict`)**
```jsonc
{
  "compilerOptions": {
    "target": "es2023", "module": "esnext", "moduleResolution": "bundler",
    "noEmit": true, "jsx": "react-jsx",
    "noUnusedLocals": true, "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": { "@/*": ["./src/*"] }   // no resuelto en vite.config.ts
    // "strict": AUSENTE
  },
  "include": ["src"]
}
```

---

## 9. Declaración final

- **No se modificó, creó ni eliminó ningún archivo del repositorio, con la única excepción de este informe (`AUDITORIA_INICIAL_SGA.md`), creado por decisión expresa del usuario.**
- **No se instalaron dependencias, no se ejecutaron migraciones ni operaciones sobre datos, no se realizaron commits, push ni cambios de rama.**
- Todos los hallazgos se apoyan en evidencia citada (ruta y línea cuando aplica); lo no verificable está declarado como **no comprobado** o **hipótesis**.
- Este informe **no implementa ninguna recomendación**: espera autorización para proceder, indicando la etapa o los hallazgos concretos a atacar.
