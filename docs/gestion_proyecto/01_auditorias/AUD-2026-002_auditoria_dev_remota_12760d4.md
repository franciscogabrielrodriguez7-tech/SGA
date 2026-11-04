# AUDITORÍA INICIAL (2/2) — RAMA REMOTA `dev` → `origin/dev`

> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git`
> **Objeto auditado:** `origin/dev` = `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` (2026-10-20 20:37:19 -0500)
> **Complementa a:** `AUDITORIA_INICIAL_SGA.md` (auditoría de la rama local `dev` @ `14726ad`, 2026-10-27)
> **Fecha de auditoría:** 2026-10-28
> **Modo:** lectura · **Única operación de red/Git:** `git fetch origin dev` (autorizada por el usuario)
> **Commits/push/cambios de rama/checkouts:** ninguno · **Dependencias instaladas:** ninguna · **Migraciones ejecutadas:** ninguna

---

## ÍNDICE

1. [Resumen ejecutivo y diferencias con la auditoría 1](#1-resumen-ejecutivo-y-diferencias-con-la-auditoría-1)
2. [Estado del repositorio tras el fetch](#2-estado-del-repositorio-tras-el-fetch)
3. [Diagnóstico: hallazgos resueltos (auditoría 1)](#3-hallazgos-resueltos-respecto-a-la-auditoría-1)
4. [Diagnóstico: hallazgos que persisten](#4-hallazgos-que-persisten)
5. [Diagnóstico: hallazgos NUEVOS en `origin/dev` (R-01…R-16)](#5-hallazgos-nuevos-en-origindev)
6. [Inventario de herramientas y pruebas (estado remoto)](#6-entregable-2--inventario-de-herramientas-y-pruebas-estado-remoto)
7. [Documentación disponible y faltante (estado remoto)](#7-entregable-3--documentación-disponible-y-faltante)
8. [Riesgos prioritarios (estado remoto)](#8-entregable-4--riesgos-prioritarios-estado-remoto)
9. [Plan de implementación por etapas (recalibrado)](#9-entregable-5--plan-de-implementación-por-etapas-recalibrado)
10. [Anexo I — Matriz de resolución de la auditoría 1](#10-anexo-i--matriz-de-resolución-de-la-auditoría-1)
11. [Anexo II — Evidencia bruta](#11-anexo-ii--evidencia-bruta)

---

## 1. Resumen ejecutivo y diferencias con la auditoría 1

### 1.1 Veredicto

La rama remota `dev` está **25 commits por delante** de la copia local auditada (43 commits totales vs 18), con **80 archivos cambiados: +5.497 / −1.920 líneas**. El equipo de desarrollo ha trabajado durante casi un mes (2026-09-21 → 2026-10-20) y ha **resuelto 5 hallazgos P0/P1 de la auditoría 1** (CORS, migración destructiva, `alembic` sin declarar, registro centralizado de modelos, infraestructura de despliegue inexistente), además de endurecer el login.

Sin embargo, **introdujo una regresión de seguridad nueva y crítica (R-01)**: la migración de consultas SQL crudas a ORM, combinada con el nuevo serializador de objetos ORM, **expone el hash bcrypt de las contraseñas** en `GET /usuarios` y `GET /usuarios/{id}`.

Y **persisten los déficits estructurales de proceso**: sigue sin existir **ninguna prueba automatizada**, **ningún CI**, ninguna herramienta de calidad en backend y TypeScript **sin modo `strict`**. La documentación de requisitos/scrum sigue en **0 bytes** y la auditoría técnica de la auditoría 1 (`docs/01..06`) **sigue sin versionarse** (no existe en el remoto).

### 1.2 Tabla comparativa de estado

| Dimensión | Local `dev` (auditoría 1) | Remoto `dev` (esta auditoría) | Δ |
|---|---|---|---|
| HEAD | `14726ad` (2026-09-21) | `12760d4` (2026-10-20) | +25 commits |
| Commits / autores | 18 / 1 | 43 / 2 (mismo autor, distinto nombre) | +25 |
| Archivos trackeados | 145 | 178 | +33 |
| Divergencia local↔remoto | **Sí** (objeto remoto inexistente local) | Resuelta: **fast-forward** | ✅ |
| CORS `"*"` + credentials | **Presente** (F-23) | **Eliminado** → `CORS_ORIGINS` por env | ✅ |
| Migración Alembic destructiva | **Presente** (F-32) | **Reemplazada** por `0001_initial_schema` solo `create_*` | ✅ |
| `alembic/env.py` incompleto | **Presente** (F-33) | **Corregido** (`import app.models`) | ✅ |
| `alembic` en requirements | **Ausente** (F-11) | **Presente** (`alembic==1.13.3`) | ✅ |
| Dockerfile / compose / Procfile | **Ausentes** (F-07) | Docker stack completo (2 Dockerfiles, compose, nginx, entrypoint) | ✅ |
| Pruebas automatizadas | **0** (F-15) | **0** | ⛔ |
| CI / `.github/workflows` | **0** (F-21) | **0** | ⛔ |
| Linter backend / mypy | **0** (F-12) | **0** | ⛔ |
| TypeScript `strict` | **No** (F-19) | **No** | ⛔ |
| Contraseñas de seed publicadas | **Sí** (F-24) | **Sí, en 4 archivos** | ⛔ peor |
| `str(error)` en respuestas 500 | **Sí** (~68 sitios) | **Sí, ~68 sitios** | ⛔ |
| Rate limiting en login | **No** (F-27) | **No** | ⛔ |
| Logging estructurado | **No** (F-36) | **No** | ⛔ |
| Docs requisitos/scrum vacíos | **6 × 0 bytes** (F-39) | **6 × 0 bytes** | ⛔ |
| Auditoría `docs/01..06` versionada | No (F-40) | **No existe en el remoto** | ⛔ |
| **Nuevo: hash de contraseña en API** | No | **Sí (R-01)** | 🔴 regresión |

---

## 2. Estado del repositorio tras el fetch

### 2.1 Operación realizada

```text
$ git fetch origin dev
 * branch            dev        -> FETCH_HEAD
   14726ad..12760d4  dev        -> origin/dev
```

| Referencia | Antes | Después |
|---|---|---|
| `HEAD` / rama local `dev` | `14726adea5ea21512071ba339fbdb704bb953b29` | **sin cambio** (no se hizo checkout) |
| `origin/dev` (ref de seguimiento) | `14726ad…` | `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` |
| `merge-base(HEAD, origin/dev)` | — | `14726ad…` = HEAD → **fast-forward seguro** |

> **Resolución de F-03:** el remoto **no reescribió historia**: el commit local es ancestro directo del remoto. La rama local está simplemente **25 commits atrasada** y puede hacerse fast-forward sin conflicto. **No se ejecutó** (constituiría cambio de rama/working tree).

### 2.2 Los 25 commits nuevos (`HEAD..origin/dev`)

```
12760d4 2026-10-20 feat(docker): dockerizar stack completo — postgres, backend FastAPI y frontend Nginx multi-stage
0bc33ac 2026-10-19 config(backend): extraer CORS_ORIGINS a variable de entorno desde settings.py
f9613f8 2026-10-19 fix(frontend): remover import no utilizado de useEffect en AgregarProductoSection
df94d07 2026-10-15 refactor(ui): layout 3 columnas en detalle de alquiler con pestanas centrales y sidebar contextual
cea3c8f 2026-10-14 feat(alquiler): matriz de edicion por estado, reglas espejo frontend y clasificacion historial
459e035 2026-10-14 refactor(api-history): depuracion de endpoints no usados e implementacion de historial de auditoria con filtros
e4d4411 2026-09-29 refactor(alembic): reemplazar baseline por migracion inicial limpia sin op.drop_*
8f64042 2026-09-29 fix: hacer op.drop_index condicional para despliegue en BD limpia
63cb22c 2026-09-24 Merge branch 'dev' into deployment
2d25a15 2026-09-24 fix: redireccion correcta al expirar JWT y tema oscuro fijo en Login
10a454c 2026-09-24 fix: agregar stock_disponible como @property en Producto y serializar ORM en response.py
26d4460 2026-09-24 refactor: migrar consultas SQL crudas a ORM en usuario, cliente y producto controllers
b2fded7 2026-09-24 chore: sincronizar indices y FK del ORM con el esquema real de la base de datos
0ceaed8 2026-09-24 chore: agregar alembic a requirements y centralizar importacion de modelos ORM
ca15d4c 2026-09-23 feat(login): aceptar email o telefono, mensajes genericos de seguridad
374791d 2026-09-23 fix: calculo de precio conjunto usando precio extra en CrearAlquiler y mostrar precio normal en detalle
53c33bb 2026-09-23 feat: mostrar precio unitario extra en detalle de productos y corregir query
2502cce 2026-09-23 refactor: division de Usuarios, Productos, AlquilerDetalle y Gastos en componentes
9947f40 2026-09-22 refactor: divisón de CrearAlquiler en componentes
b6457e0 2026-09-22 refacto: cambios en uso de metodos en const resultadoTelefono dentro del archivo Usuarios.tsx
f19e845 2026-09-12 fix: remove vercel configuration
44b80b6 2026-09-12 fix: update vercel ubication_
3ff3765 2026-09-12 fix: update vercel ubication
015e9a4 2026-09-12 fix: update vercel configuration
dc8aecd 2026-09-12 commit de actualizacíón
```

**Observaciones de proceso (verificadas):**
- Aparece un **commit de merge de `deployment` dentro de `dev`** (`63cb22c Merge branch 'dev' into deployment`) → el flujo declarado dev→deployment se usó en algún momento por merge cruzado. **Estado: verificado** (existe el merge); su intención/semántica = **no comprobado**.
- 4 commits consecutivos `fix: update vercel configuration` + 1 `remove vercel configuration` → **deriva en la estrategia de despliegue** (Vercel retirado).
- Siguen apareciendo commits sin tipo convencional (`commit de actualizacíón`, `refacto:`) → **F-05 persiste**.

### 2.3 Archivos añadidos / eliminados / modificados

| Estado | Cantidad | Contenido destacado |
|---|---|---|
| **Añadidos (37)** | 9 de infra | `.env.docker.example`, `docker-compose.yml`, `sga_backend_jwt/{Dockerfile,.dockerignore,entrypoint.sh}`, `sga_frontend_jwt/{Dockerfile,.dockerignore,nginx.conf}`, `alembic/versions/0001_initial_schema.py` |
| | 25 componentes UI | `alquilerComponents/*` (5), `alquilerDetalleComponents/*` (10), `gastosComponents/*` (2), `productosComponents/*` (4), `usuariosComponents/*` (4) |
| | 3 utilidades TS | `src/utils/{historialAlquiler,jwt,reglasAlquiler}.ts` |
| **Eliminados (4)** | | `alembic/versions/d4f74f3d4896_baseline_schema.py`, `app/controllers/inventario_controller.py`, `app/routes/inventario_routes.py`, `sga_frontend_jwt/vercel.json` |
| **Modificados (39)** | | `main.py`, `settings.py`, `requirements.txt`, `alembic/env.py`, `response.py`, 5 controllers, 7 modelos, 6 routers, 8 páginas TSX, `AuthContext.tsx`, `client.ts`, estilos |
| **Total** | **80** | **+5.497 / −1.920 líneas** |

---

## 3. Hallazgos resueltos respecto a la auditoría 1

| ID previo | Hallazgo | Evidencia en `origin/dev` | Estado |
|---|---|---|---|
| **F-03** | Divergencia local↔remoto | `merge-base` = HEAD → fast-forward | ✅ **Resuelto** (auditado en §2.1) |
| **F-07** | Sin Dockerfile/compose/Procfile | `docker-compose.yml` (121 líneas), 2 `Dockerfile`, `nginx.conf`, `entrypoint.sh`, 2 `.dockerignore` | ✅ **Resuelto** (parcial: sin `render.yaml`/`Procfile`, ver R-09) |
| **F-11** | `alembic` ausente de `requirements.txt` | `requirements.txt:1-3` → `alembic==1.13.3`, `Mako==1.3.5`, `MarkupSafe==3.0.3` | ✅ **Resuelto** |
| **F-23** | CORS `"*"` + `allow_credentials=True` | `settings.py:30-38` (`CORS_ORIGINS` por env, default solo `localhost:5173/127.0.0.1:5173`) + `main.py:61-67` (`allow_origins=CORS_ORIGINS`) + `.env.example:14-22` | ✅ **Resuelto** |
| **F-32** | Baseline destructivo (`drop_table` en `upgrade()`) | `d4f74f3d4896_baseline_schema.py` **eliminado**; nuevo `0001_initial_schema.py` con `upgrade()` **solo `op.create_*`** (273 líneas) y `downgrade()` ordenado | ✅ **Resuelto** |
| **F-33** | `alembic/env.py` sin `AuditoriaSistema` | `env.py:24-27` → `import app.models  # noqa: F401` + `app/models/__init__.py` (+20 líneas) centraliza registros | ✅ **Resuelto** |
| **F-42** (parcial) | Conflicto PostgreSQL 14 vs 16 | `docker-compose.yml:26` → `image: postgres:16-alpine` fija la versión real del stack | ⚠️ **Parcial**: `README.md` raíz sigue pidiendo "PostgreSQL 14+" |
| **N-01 (mejora)** | Login con mensajes diferenciados (enumeración de usuarios) | `usuario_controller.py` → `rol cliente`, `estado False` y password incorrecta ahora **`return None`** todos; `auth_routes.py:27-33` → mensaje único `"Credenciales incorrectas"` (commit `ca15d4c`) | ✅ **Endurecido** |
| **N-02 (mejora)** | `/docs` como healthcheck + Swagger obligatorio | Ver R-03 (efecto secundario negativo) | ⚠️ Doble filo |

**Resumen: 6 hallazgos P0/P1 resueltos, 1 parcial, 2 mejoras de seguridad añadidas.**

---

## 4. Hallazgos que persisten

### 4.1 Persisten sin cambios (verificados de nuevo sobre el árbol remoto)

| ID | Hallazgo | Evidencia actualizada en `origin/dev` | Prioridad |
|---|---|---|---|
| **F-04** | Autor único (2 identificadores de nombre para la misma persona: `gabielrodriguez` 41, `gabrielrodriguez` 2) | `git shortlog -sn origin/dev` | P1 |
| **F-05** | Commits sin convención (`commit de actualizacíón`, `refacto:`) | `git log` → `dc8aecd`, `b6457e0` | P2 |
| **F-08/F-40** | Auditoría `docs/01..06` **sin versionar y ausente en el remoto** | `git ls-tree -r origin/dev docs/` → no contiene `0X_*.md` | **P0** |
| **F-12** | Sin `pyproject.toml` / ruff / mypy / pytest / pre-commit | `git ls-tree -r origin/dev` filtrado → vacío | **P0** |
| **F-14** | Entornos no instalados localmente → lint/build **no ejecutados** | `node_modules`/`venv` ausentes; no instalados por restricción | **P0** |
| **F-15 / F-16** | **Cero pruebas**; `package.json` sin script `test` | `git ls-tree` filtrado `test\|spec` → vacío; `package.json:6-11` solo `dev/build/lint/preview` | **P0** |
| **F-18 / F-19 / F-20** | `oxlint` con 2 reglas; **`tsconfig` sin `strict`**; build `tsc -b && vite build` | `.oxlintrc.json` y `tsconfig.app.json` **sin cambios** (`git diff` vacío) | P1 |
| **F-21 / F-22** | **Sin CI** ni `.github/`, sin pre-commit | Único YAML del árbol = `docker-compose.yml` | **P0** |
| **F-24** | Contraseña en texto plano del seed publicada — **ahora en 4 archivos** | `03_seed_data.sql:7`, `INDICE.md:120`, `README_base_de_datos.md:46` y `:76` | **P0** (ver R-10) |
| **F-25** | README raíz con credenciales que no coinciden con el seed | `README.md:80-88` **sin cambios** (`git diff HEAD..origin/dev -- README.md` vacío) | P1 |
| **F-26** | `str(error)` devuelto en respuestas 500 | **68 ocurrencias** en 8 archivos bajo `app/routes/` + `auth_dependency.py` | P1 |
| **F-27** | Sin rate limiting en `POST /auth/login` | grep `ratelimit\|slowapi\|limiter` → sin coincidencias | **P0** |
| **F-28** | JWT en `localStorage` | `client.ts:29-41`; `AuthContext.tsx` (persistencia igual) | P1 |
| **F-29** | Rol en JWT sin revalidación; TTL 480 min | `auth_dependency.py:58-61`; `settings.py:26` sin cambios | P1 |
| **F-31** | `/docs` expuesto por defecto | `main.py:31-35` sin `docs_url=None`; además **ahora depende el healthcheck** (R-03) | P1 |
| **F-34 / F-35** | f-string en SQL (`INTERVAL '{dias} days'`) y `ilike` con curingas | `alquiler_controller.py` (revisado en diff: se migró a ORM, verificar persistencia en runtime) | P2/P3 |
| **F-36** | Sin `logging` estructurado (solo 2 `print`) | grep `import logging\|getLogger` → **sin coincidencias**; `main.py:13,16` | P1 |
| **F-37** | **Sin secretos hardcodeados** (control positivo) | scan AWS/PEM/`ghp_`/`AIza` sobre `origin/dev` → sin coincidencias; `.dockerignore` excluye `.env`; `.gitignore` + `.env.docker` | ✅ |
| **F-38** | RBAC completo: **37 de 38 endpoints** con `requiere_rol`; 6 de 7 routers con `get_current_user` | grep `@router` (38) y `dependencies=[Depends(get_current_user)]` (6) | ✅ |
| **F-39** | **6 documentos de 0 bytes** | `git ls-tree -r -l origin/dev docs/` → blob `e69de29…` (0) ×6 | **P0** |
| **F-41/F-42** | README raíz y de BD desactualizados | Sin cambios (`git diff` vacío para `README.md`, `database/`) | P1/P2 |
| **F-43** | `INDICE.md` con esquema antiguo (`es_recogida`) | `INDICE.md:91` sin cambios | P2 |
| **F-44** | Contratos frontend desalineados (`es_recogida`) | `src/api/alquileres.ts:94,108`, `src/api/gastos.ts:14`, `src/interfaces/Logistica.ts:28,36`, `src/pages/Gastos/Gastos.tsx:104`, `src/components/gastosComponents/ListaGastos.tsx:71` | P1 |
| **F-45** | Sin `CONTRIBUTING`, `CODEOWNERS`, `SECURITY`, `CHANGELOG`, ADRs, guía de IA | `git ls-tree -r origin/dev` → ausentes | P1 |
| **F-46/F-47** | Protección de ramas y uso de PR/issues | **No comprobado** (sin API de GitHub) | **P0** |
| **F-48** | Controllers grandes / lógica mezclada | Refactor a componentes y a ORM mejora parcialmente la organización | P2 |
| **F-49** | Auditoría de BD por triggers | Sin cambios en `database/` | ✅ |

### 4.2 Persistencia por categoría

| Categoría | Persisten | Resueltos |
|---|---|---|
| **Seguridad** | F-24, F-25, F-26, F-27, F-28, F-29, F-31, F-36 | F-23 ✅ |
| **Integridad de datos** | F-34, F-44 | F-32 ✅, F-33 ✅ |
| **Proceso / trazabilidad** | F-04, F-05, F-08, F-21, F-45, F-46, F-47 | F-03 ✅ |
| **Calidad** | F-12, F-14, F-15, F-16, F-18, F-19, F-22 | — |
| **Documentación** | F-39, F-40, F-41, F-42, F-43 | — |
| **Operación** | F-07 (parcial), F-11 ✅ | F-07 ✅ parcial |

---

## 5. Hallazgos nuevos en `origin/dev`

| ID | Descripción | Evidencia | Estado | Riesgo / Impacto | Recomendación | Prioridad |
|---|---|---|---|---|---|---|
| **R-01** 🔴 | **REGRESIÓN — Fuga de hashes de contraseñas en la API.** `GET /usuarios` y `GET /usuarios/{id_usuario}` devuelven objetos ORM `Usuario` completos; el nuevo `_orm_to_dict` serializa **todas** las columnas, incluida `contrasena_usuario` (hash bcrypt). En la auditoría 1 estos endpoints usaban SQL crudo con una allowlist (`SELECT_USUARIO_CAMPOS`) que **excluía** la contraseña | `app/utils/response.py:14-30` (`_orm_to_dict` copia todo `obj.__dict__` sin `_`) y `:52-54` (`hasattr(data,"__tablename__")`) ← `app/routes/usuario_routes.py:82` (`data=usuarios`) y `:113` (`data=usuario`) ← `app/controllers/usuario_controller.py:66-68,80-84` (retornan ORM). Contraste local: `usuario_controller.py:12-26` (`SELECT_USUARIO_CAMPOS` **sin** `contrasena_usuario`) | **Verificado** (por lectura de flujo de datos; no ejecutado en runtime) | Un `encargado_logistico`/`facturación` autenticado obtiene hashes bcrypt de usuarios internos → crackeo offline. Alto impacto si el mismo hash se reutiliza (ver F-24) | Excluir `contrasena_usuario` en `_orm_to_dict` (allowlist/rejectlist global) o no devolver entidades ORM crudas; añadir test de regresión que falle si la respuesta contiene `contrasena_*` | **P0** |
| **R-02** | **`alembic upgrade head` automático en cada arranque del contenedor**, en conflicto con el flujo documentado de "crear BD con scripts SQL y luego `alembic stamp head`" | `entrypoint.sh:47-49` (`set -e` en línea 6 → aborta el arranque) vs `sga_backend_jwt/README.md:91-97` y `README.md:47-64` | **Probable** (no ejecutado) | Si la BD ya fue poblada por `01_tablas.sql`, `0001_initial_schema` fallará por "relation already exists" → **contenedor no arranca** (`set -e`). Si la BD está vacía, los scripts SQL quedarían obsoletos | Definir una única fuente de verdad del esquema (SQL **o** Alembic), documentar el orden y añadir verificación en CI | **P0** |
| **R-03** | El **healthcheck del backend depende de `/docs`** (`curl -f .../docs`) → fuerza a mantener Swagger público en producción | `docker-compose.yml:76-78` | Verificado | Cualquier intento de deshabilitar `/docs` (F-31) **rompe el healthcheck** y por tanto el `depends_on: service_healthy` del frontend | Usar `GET /health` (que además no existe) como healthcheck | P1 |
| **R-04** | **Puertos publicados en todas las interfaces** aunque el comentario dice "solo localhost": `"5432:5432"` y `"8000:8000"` (Docker publica en `0.0.0.0` salvo prefijo `127.0.0.1:`) | `docker-compose.yml:47-48` y `:83-84` vs comentarios `:45, :81` | Verificado (config) | En un host con IP pública, PostgreSQL y la API quedan expuestas; el comentario genera falsa confianza | Cambiar a `"127.0.0.1:5432:5432"` y `"127.0.0.1:8000:8000"`, o eliminar los bloques `ports` | **P0** |
| **R-05** | **Contenedores ejecutándose como root**: el Dockerfile de backend no declara `USER`; Nginx arranca como root (por defecto) aunque los archivos se owneran a `nginx` | `sga_backend_jwt/Dockerfile` (sin `USER`); `sga_frontend_jwt/Dockerfile:52-53` (`chown nginx` sin `USER`) | Verificado | Escalada de privilegios si hay una vulnerabilidad en la app/servidor | Añadir usuario no privilegiado + `USER` en ambos Dockerfiles | P1 |
| **R-06** | `uvicorn --workers 2` con APScheduler **en proceso** → el job de las 00:05 se ejecuta 2 veces (idempotente, pero duplica trabajo y confunde los logs) | `entrypoint.sh:52-56` (workers 2) vs `main.py:44-52` (scheduler en startup) | Verificado (config) / impacto **probable** | Doble ejecución diaria; documentado como "revisar esta decisión" en la auditoría previa (C-06) sin resolver | 1 worker, o mover el job a cron externo/`pg_cron` | P2 |
| **R-07** | **Endpoints eliminados = cambio de contrato API**: desaparecen `GET /inventario`, `GET /inventario/productos/{id}` (router completo) y `GET /alquileres/{id}/renovaciones/{id_auditoria}` (`router_renovaciones`); también se eliminaron los alias `PUT` de cliente/producto/usuario/alquiler (45 → **38 endpoints**) | `main.py` ya no importa `inventario_router` ni `renovaciones_router`; archivos eliminados; `git grep @router` → 38 | Verificado | Rompe a consumidores externos y deja obsoleta cualquier documentación/SDK; el frontend **no** los usa (verificado: sin referencias a `inventario`; solo `POST /renovaciones` que sigue existiendo) | Versionar el contrato (OpenAPI) y registrar los breaking changes; mantener deprecación si hay consumidores | P1 |
| **R-08** | La contraseña en texto plano del seed está publicada en **4 archivos** (no en 1 como se registró en F-24) | `database/01_esquema/03_seed_data.sql:7`; `database/03_documentacion/INDICE.md:120`; `database/README_base_de_datos.md:46` y `:76` | Verificado | Amplía la superficie de exposición de la credencial de prueba | Eliminarla de los 4 archivos, rotar en cualquier entorno que la use | **P0** |
| **R-09** | **Deriva de la estrategia de despliegue**: se eliminó `vercel.json` (commit `f19e845`) y no existe `render.yaml`/`Procfile`, mientras la documentación de auditoría (local, sin versionar) sigue describiendo **Render + Vercel** | `git diff --name-status` → `D sga_frontend_jwt/vercel.json`; `docs/06_despliegue_configuracion.md:3,272-274,347-406` (archivo local sin versionar) | Verificado | Documentación de despliegue incompatible con el estado real (Docker + Nginx); riesgo de seguir instrucciones obsoletas | Reescribir el capítulo de despliegue sobre Docker Compose y versionarlo | P1 |
| **R-10** | **`_orm_to_dict` es una serialización sin allowlist** aplicada a *cualquier* objeto ORM de la API: copia todas las columnas y además evalúa **todas** las `@property` del modelo vía `dir(type(obj))`/`getattr` | `response.py:14-30` | Verificado | Raíz de R-01; futuros modelos con columnas sensibles (tokens, notas internas) se expondrán sin avisar; coste extra por reflejo en listados grandes | Allowlist explícita por modelo (o `response_model` de Pydantic) y excluir campos sensibles por defecto | **P0** |
| **R-11** | `entrypoint.sh` extrae usuario/contraseña de `DATABASE_URL` con **expresiones regulares frágiles** | `entrypoint.sh:14-31` (`re.search(r':([^@]+)@', db_url)`) | Verificado | Contraseñas con `@`, `:`, `%` u otros caracteres URL-encoded rompen la espera y el arranque | Usar `sqlalchemy.engine` o `urlparse` de SQLAlchemy, o `pg_isready` con variables sueltas | P2 |
| **R-12** | Nginx carece de `Strict-Transport-Security`, `Content-Security-Policy` y `X-XSS-Protection`; solo añade 3 cabeceras básicas | `nginx.conf:70-75` | Verificado | Superficie de XSS y de degradación TLS si se expone tras HTTPS | Añadir CSP/HSTS (cuando haya TLS) | P2 |
| **R-13** | `docker-compose` sin `security_opt`, `read_only`, límites de recursos ni `user` | `docker-compose.yml` (121 líneas) | Verificado | Contenedores con privilegios por defecto y sin techo de recursos | Endurecer el compose (hardening) | P2 |
| **R-14** | El frontend ahora **decodifica el JWT sin verificar firma** en cliente para detectar expiración (buena práctica de UX) pero confía en `exp` del cliente | `src/utils/jwt.ts:1-31`; `AuthContext.tsx:37-56` | Verificado | Aceptable (solo UX): el backend sigue validando. Riesgo solo si se usara para autorización | Mantener documentado que es solo UX; no usar para decisiones de permisos | P3 |
| **R-15** | Los 6 documentos vacíos y la auditoría `docs/01..06` **no existen en el remoto**: todo el trabajo de documentación vive solo en la máquina local | `git ls-tree -r -l origin/dev docs/` (6 × 0 B; sin `0X_*.md`) | Verificado | Pérdida total del trabajo documental si se pierde el equipo local | Versionar (Etapa 0) | **P0** |
| **R-16** | El historial contiene un **merge de `deployment` hacia dentro de `dev`** y 5 commits de ida y vuelta de configuración de Vercel | `63cb22c`; `015e9a4, 3ff3765, 44b80b6, f19e845` | Verificado | Flujo de ramas no lineal/consistente con lo documentado; posible contaminación de entornos | Reglas de rama + flujo PR único (Etapa 0/2) | P1 |

### 5.1 Puntos fuertes nuevos verificados (mantener como regresión vigilada)

| ID | Fortaleza | Evidencia |
|---|---|---|
| **S-01** | CORS parametrizado y sin comodín | `settings.py:30-38`; `.env.example:14-22`; `.env.docker.example:47` |
| **S-02** | Migración inicial limpia y reversible | `0001_initial_schema.py` (`upgrade` solo `create_*`; `downgrade` ordenado por FKs) |
| **S-03** | Login con respuesta genérica (anti-enumeración) | `usuario_controller.py` (`return None` en cliente/desactivado/hash inválido); `auth_routes.py:27-33` |
| **S-04** | `.dockerignore` excluye `.env` y `.env.*` | `sga_backend_jwt/.dockerignore:15-17` |
| **S-05** | `.env.docker` en `.gitignore`; plantilla con `<CAMBIAR>` | `.gitignore:225-226`; `.env.docker.example` |
| **S-06** | Compose con healthchecks, red aislada y volúmenes nombrados | `docker-compose.yml:37-42, 76-79, 120-121` |
| **S-07** | Frontend multi-stage con `npm ci` (reproducible) | `sga_frontend_jwt/Dockerfile:25, 35` |
| **S-08** | Nginx: `server_tokens off`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, reverse proxy que elimina CORS en el navegador | `nginx.conf:44-49, 70-75` |
| **S-09** | Exclusión de `PUT` consistente entre backend y frontend | `client.ts:64` (unión sin `PUT`); sin usos de `"PUT"` en `src/` |
| **S-10** | RBAC intacto tras la refactorización (37/38 endpoints con rol) | grep `@router` + `requiere_rol` |

---

## 6. Entregable 2 — Inventario de herramientas y pruebas (estado remoto)

| Categoría | Backend | Frontend | Infra / BD |
|---|---|---|---|
| **Stack** | Python 3.11, FastAPI 0.141.1, SQLAlchemy 2.0.52, Pydantic 2.13.4, uvicorn 0.52.3, gunicorn 23.0.0 | React 19, TypeScript 6.0.2, Vite 8.2, React Router 7, Zod 4 | PostgreSQL 16 (`postgres:16-alpine`), Nginx 1.27, Docker Compose |
| **Migraciones** | Alembic **1.13.3** ✅ (declarado) + `Mako`, `MarkupSafe`; 1 migración limpia `0001_initial_schema` | — | Scripts SQL siguen existiendo (doble fuente → R-02) |
| **Dependencias** | 25 pins exactos | rangos `^` + `package-lock.json` | imágenes pinneadas por tag (no digest) |
| **Linter** | ❌ Ninguno | `oxlint` (2 reglas, sin cambios) | ❌ |
| **Tipado** | ❌ Sin mypy | `tsc -b` solo en build; **sin `strict`** | ❌ |
| **Tests** | ❌ **0** | ❌ **0** | 4 scripts SQL demo con `ROLLBACK` (manuales) |
| **CI/CD** | ❌ Sin `.github/` | ❌ | ❌ (solo `docker-compose.yml`) |
| **Despliegue** | `Dockerfile` + `entrypoint.sh` | `Dockerfile` multi-stage + `nginx.conf` | `docker-compose.yml` + `.env.docker` |
| **Salud** | healthcheck vía `/docs` (R-03) | hereda del backend | healthcheck `pg_isready` ✅ |
| **Scripts `package.json`** | — | `dev`, `build`, `lint`, `preview` — **sin `test`** | — |

**Matriz de endpoints remota (38 en lugar de 45):**

| Router | Auth router | Endpoints | Con rol |
|---|---|---|---|
| `alquiler_routes` | ✅ | 16 (antes 17: sin `PUT`) | 16 |
| `auth_routes` | — (correcto) | 1 (`POST /login`) | 0 |
| `cliente_routes` | ✅ | 5 (antes 6: sin `PUT`) | 5 |
| `detalle_alquiler_routes` | ✅ | 3 (antes 4: sin `router_renovaciones`) | 3 |
| `gastos_routes` | ✅ | 3 | 3 |
| `producto_routes` | ✅ | 5 (antes 6: sin `PUT`) | 5 |
| `usuario_routes` | ✅ | 5 (antes 6: sin `PUT`) | 5 |
| ~~`inventario_routes`~~ | — | **eliminado** (antes 2) | — |
| **Total** | 6/7 | **38** | **37/38** |

---

## 7. Entregable 3 — Documentación disponible y faltante

### 7.1 Disponible en `origin/dev`

| Documento | Estado |
|---|---|
| `README.md` (raíz) | **Sin cambios** desde la auditoría 1 → credenciales desactualizadas (F-25) y versión de PG desactualizada (F-42) |
| `sga_backend_jwt/README.md` | **Sin cambios** → paso `alembic stamp head` en conflicto con `entrypoint.sh` (R-02) |
| `sga_frontend_jwt/README.md` | **Sin cambios** → no documenta Docker/Nginx ni `npm ci` |
| `database/README_base_de_datos.md` | **Sin cambios** → **contiene la contraseña en texto plano** (R-08) y estructura sin `06_demos_endpoints` |
| `database/03_documentacion/INDICE.md` | **Sin cambios** → esquema antiguo **y** contraseña en texto plano (`:120`) |
| `.env.example` (backend) | ✅ **Actualizado** con `CORS_ORIGINS` y ejemplos por entorno |
| `.env.docker.example` | ✅ **Nuevo**, con placeholders `<CAMBIAR>` e instrucciones de uso |
| `docker-compose.yml` | ✅ Comentarios extensos de uso (20 líneas de cabecera) |
| `entrypoint.sh`, `Dockerfile*`, `nginx.conf` | ✅ Bien comentados |
| `docs/architecture/*.png|docx` | Sin cambios (4 archivos de apoyo) |

### 7.2 Faltante o vacío (idéntico a la auditoría 1, confirmado en el remoto)

| Ítem | Estado |
|---|---|
| `docs/architecture/architecture_map.md` | **0 bytes** |
| `docs/requirements/user_cases.md` · `user_stories.md` | **0 bytes** ×2 |
| `docs/scrum/product_backlog.md` · `sprint_1_act.md` | **0 bytes** ×2 |
| `docs/ui_ux/mockups_links.md` | **0 bytes** |
| `docs/01..06` (auditoría técnica, ~179 KB) | **No existen en el remoto** (solo en local, sin versionar) |
| `CONTRIBUTING`, `CODEOWNERS`, `SECURITY`, `CHANGELOG`, ADRs, guía de IA | Inexistentes |
| OpenAPI versionado / CHANGELOG de API | Inexistente (R-07 lo hace necesario) |
| Guía de despliegue Docker vigente | Inexistente (R-09) |
| `render.yaml` / `Procfile` | Inexistentes (decisión pendiente: ¿Docker self-host vs Render?) |

---

## 8. Entregable 4 — Riesgos prioritarios (estado remoto)

### 8.1 Top 10 priorizado

| # | ID | Riesgo | Prioridad |
|---|---|---|---|
| 1 | **R-01 / R-10** | **Hashes de contraseñas expuestos** en `GET /usuarios[/{id}]` (regresión nueva, verificada por flujo) | **P0** |
| 2 | **R-04** | PostgreSQL y API publicados en `0.0.0.0` pese al comentario de "solo localhost" | **P0** |
| 3 | **R-02** | `alembic upgrade head` automático en conflicto con el flujo SQL documentado → arranque fallido o doble fuente de esquema | **P0** |
| 4 | **F-15 / F-21 / F-12** | Cero pruebas, cero CI, cero calidad en backend | **P0** |
| 5 | **R-08 / F-24** | Credencial en texto plano publicada en 4 archivos | **P0** |
| 6 | **F-08 / F-40 / R-15** | Documentación técnica completa sin versionar y ausente del remoto; 6 docs en 0 bytes | **P0** |
| 7 | **F-27 / F-26** | Sin rate limiting en login; `str(error)` en ~68 respuestas 500 | **P0/P1** |
| 8 | **R-05 / R-13** | Contenedores como root, sin endurecimiento ni límites de recursos | P1 |
| 9 | **R-07 / R-09** | Breaking changes de API sin contrato versionado; documentación de despliegue obsoleta | P1 |
| 10 | **F-44 / F-29 / F-31 / R-03** | Contratos `es_recogida`, rol no revalidado, `/docs` público y obligatorio por healthcheck | P1 |

### 8.2 Ítems NO comprobados

1. Reglas de protección de rama y requerimiento de checks en GitHub.
2. Existencia de PRs/issues/etiquetas (el historial muestra al menos 1 merge de `deployment`, sin evidencia de PR).
3. Ejecución real de `npm run lint` / `npm run build` / del backend (entornos no instalados; nada se ejecutó).
4. **Confirmación en runtime de R-01** (lectura de flujo de datos estática; no se levantó la API).
5. Comportamiento real de `alembic upgrade head` sobre una BD poblada por SQL (R-02).
6. Estado de `main` y `deployment` (no traídas; `git fetch` se limitó a `dev` por instrucción).
7. Vulnerabilidades de dependencias (`pip-audit`/`npm audit` no ejecutados).
8. Imágenes Docker: no se construyeron ni analizaron (`docker build` no ejecutado).
9. Configuración de secretos en el hipotético entorno desplegado.
10. Si `GET /clientes` devuelve también campos no deseados en runtime (contraseña es `NULL` por diseño en clientes).

### 8.3 Hipótesis

- **H-d:** El equipo migró a ORM (`26d4460`) y luego "arregló" el fallo de serialización con `_orm_to_dict` (`10a454c`) sin notar que la allowlist implícita anterior (SELECT explícito de columnas) se perdió → origen de **R-01**.
- **H-e:** El healthcheck por `/docs` (`R-03`) se eligió por comodidad ante la ausencia de `GET /health`.
- **H-f:** El equipo está probando Docker Compose localmente y aún no ha definido el destino de producción real (Render vs self-host), lo que explica la deriva Vercel→Docker sin actualizar documentación (R-09).

---

## 9. Entregable 5 — Plan de implementación por etapas (recalibrado)

> **Nada de lo siguiente ha sido implementado.** El plan de la auditoría 1 sigue siendo válido; aquí se **recalibra por los hallazgos nuevos** y por lo ya resuelto.

### Etapa 0 — Alineación del repositorio *(≈3-4 días)* — **parcialmente desbloqueada**

1. ~~Resolver divergencia local↔remoto~~ → **ya resuelta** (fast-forward seguro). Ejecutar `git merge --ff-only origin/dev` **previa autorización**.
2. Versionar `docs/01..06` y registrar hallazgos como issues (R-15).
3. Verificar protección de ramas y checks en GitHub (F-46/F-47).
4. Decidir destino de los 6 docs vacíos (F-39) y del flujo de ramas tras el merge cruzado de `deployment` (R-16).
5. `CONTRIBUTING.md` + Conventional Commits (F-05).

**Gate G0:** HEAD local = remoto · docs versionados · reglas de rama verificadas · backlog con IDs.

### Etapa 0.5 — **Contención de seguridad *(nueva, urgente)* *(≈1-2 días)***

1. **R-01/R-10:** excluir `contrasena_usuario` (y campos sensibles) de `_orm_to_dict`; añadir test de "ninguna respuesta contiene `contrasena_*`".
2. **R-04:** restringir puertos a `127.0.0.1:` o eliminarlos.
3. **R-08/F-24:** retirar la credencial de los 4 archivos y rotar donde aplique.
4. **R-03:** crear `GET /health` y apuntar el healthcheck allí.

**Gate G0.5:** los 4 ítems cerrados con test de regresión asociado.

### Etapa 1 — Baseline de calidad *(≈1 semana)* — **igual que auditoría 1**
`pyproject.toml` + ruff + mypy gradual (F-12) · `strict` incremental de TS (F-19) · oxlint ampliado (F-18) · pre-commit (F-22) · primera ejecución real de lint/build (F-14).
**Gate G1:** lint/typecheck en 0 errores o deuda acotada.

### Etapa 2 — CI mínima *(≈1 semana)* — **igual + Docker**
Workflow con lint/typecheck/build/secret-scan + **build de imágenes Docker** y **validación de `docker-compose config`** · checks obligatorios en PR · Dependabot.
**Gate G2:** sin merge sin checks verdes; imágenes construibles en CI.

### Etapa 3 — Pruebas *(≈2-3 semanas)* — **prioridad recalibrada**
1. **Test de seguridad R-01** (regresión de serialización) — primero.
2. Unitarias de `utils/` (`tiempo`, `unidades`, `precios`, `reglasAlquiler`, `historialAlquiler`, `jwt.ts`, `security`, `db_errors`).
3. **Matriz RBAC** 38×4 (F-38).
4. Integración BD desde los 4 scripts demo (F-17).
5. Contract test (OpenAPI) que detecte los breaking changes de **R-07**.
6. E2E Playwright (login, alquiler, entrega/recogida, 403).
**Gate G3:** suite en cada PR; R-01 con test que falla ante reintroducción.

### Etapa 4 — Seguridad correctiva *(≈1-2 semanas)*
F-27 (rate limit) · F-26 (`str(error)` → log) · F-36 (logging) · F-31 (deshabilitar `/docs` en prod, ahora posible con `GET /health`) · F-29 (revalidación de rol/TTL) · F-28 (cookie HttpOnly) · R-05/R-13 (contenedores no-root, hardening) · R-06 (1 worker).
**Gate G4:** checklist cerrado con evidencia por hallazgo.

### Etapa 5 — Trazabilidad y agentes *(≈1-2 semanas)*
Issue → rama → PR → checks → evidencia · `AGENTS.md` con política de agentes · ADR (¿Alembic vs SQL? ¿Render vs self-host Docker?) · contrato OpenAPI versionado (cierra R-07) · definir P-01…P-12.
**Gate G5:** trazabilidad completa y política publicada.

### Etapa 6 — Mantenimiento continuo
Dependabot/pip-audit, cobertura, revisión RBAC semestral, checklist de despliegue Docker.

| Etapa | Semana | Cambio respecto a la auditoría 1 |
|---|---|---|
| 0 | 1 | Simplificada (ya no hay que resolver ancestry) |
| **0.5** | **1** | **Nueva: contención de R-01, R-04, R-08, R-03** |
| 1 | 2 | Igual |
| 2 | 3 | + build/validación Docker en CI |
| 3 | 4-6 | Test de seguridad R-01 en primer lugar |
| 4 | 5-7 | + hardening de contenedores |
| 5 | 7-9 | + ADR de estrategia de despliegue (R-09) |
| 6 | Continuo | Igual |

---

## 10. Anexo I — Matriz de resolución de la auditoría 1

| ID | Hallazgo | Estado en `origin/dev` | ID nuevo si aplica |
|---|---|---|---|
| F-01 | Rama/commit baseline | Actualizado → `12760d4` | — |
| F-02 | Clon single-branch (sin `main`/`deployment`) | **Perciste** (fetch limitado a `dev`) | — |
| F-03 | Divergencia local↔remoto | ✅ **Resuelto** (fast-forward) | — |
| F-04 | Autor único | Persiste (2 identificadores de nombre) | — |
| F-05 | Commits sin convención | Persiste | R-16 |
| F-06 | Estructura monorepo | Ampliada (+33 archivos, Docker) | — |
| F-07 | Sin artefactos de infra | ✅ **Resuelto** (Docker); falta `render.yaml`/`Procfile` | R-09 |
| F-08 | Docs sin trackear | Persiste | R-15 |
| F-09 | Docs de proceso vacíos | Persiste | F-39 |
| F-10 | Dependencias pinned | Persiste (ahora 25, sin auditoría CVE) | — |
| F-11 | `alembic` ausente | ✅ **Resuelto** | — |
| F-12 | Sin herramientas de calidad backend | Persiste | — |
| F-13 | Rangos `^` en frontend | Persiste (`npm ci` ahora sí usado en Docker) | S-07 |
| F-14 | Entornos no instalados / baseline desconocido | Persiste | — |
| F-15 | Cero pruebas | Persiste | — |
| F-16 | Sin script `test` | Persiste | — |
| F-17 | Demos SQL manuales | Persiste | — |
| F-18 | oxlint mínimo | Persiste | — |
| F-19 | TS sin `strict` | Persiste | — |
| F-20 | Build con typecheck | Persiste (y ahora corre en el build Docker) | S-07 |
| F-21 | Sin CI | Persiste | — |
| F-22 | Sin pre-commit | Persiste | — |
| F-23 | CORS `"*"` | ✅ **Resuelto** | S-01 |
| F-24 | Credencial de seed publicada | Persiste **en 4 archivos** | R-08 |
| F-25 | README con credenciales falsas | Persiste | — |
| F-26 | `str(error)` en 500 | Persiste (~68 sitios) | — |
| F-27 | Sin rate limiting | Persiste | — |
| F-28 | JWT en `localStorage` | Persiste (mejora de UX en expiry) | R-14 |
| F-29 | Rol sin revalidación | Persiste | — |
| F-30 | Sin cabeceras/limites de request | Parcial: Nginx añade 3 cabeceras | R-12 |
| F-31 | `/docs` público | Persiste **y ahora es healthcheck** | R-03 |
| F-32 | Migración destructiva | ✅ **Resuelto** | S-02 |
| F-33 | `env.py` incompleto | ✅ **Resuelto** | S-02 |
| F-34 | f-string en SQL (`dias`) | No re-verificado en el refactor a ORM | — |
| F-35 | `ilike` sin escapar | Persiste (cliente: `ilike(f"%…%")`) | — |
| F-36 | Sin logging | Persiste | — |
| F-37 | Sin secretos hardcodeados | ✅ Persiste positivo | S-04/S-05 |
| F-38 | RBAC completo | ✅ Persiste (37/38) | S-10 |
| F-39 | 6 docs en 0 bytes | Persiste | R-15 |
| F-40 | Auditoría sin versionar | Persiste y **ausente en el remoto** | R-15 |
| F-41/F-42 | READMEs desactualizados | Persiste | R-09 |
| F-43 | `INDICE.md` obsoleto | Persiste + credencial publicada | R-08 |
| F-44 | `es_recogida` en frontend | Persiste (6 archivos) | — |
| F-45 | Sin gobernanza | Persiste | — |
| F-46/F-47 | Protección de ramas / PRs | **No comprobado** | R-16 |
| F-48 | Complejidad en controllers | Mejor parcial (componentización + ORM) | — |
| F-49 | Auditoría de BD por triggers | ✅ Persiste | — |

**Totales:** 6 resueltos (F-03, F-07 parcial, F-11, F-23, F-32, F-33) · 1 mejorado (login anti-enumeración) · ~34 persisten · **16 hallazgos nuevos** (R-01…R-16) de los cuales **3 son P0**.

---

## 11. Anexo II — Evidencia bruta

### 11.1 Identificadores clave

```text
origin/dev (tras fetch): 12760d4b86d40e0eefa7ef8cc4a9bb68292b476c
HEAD / rama local dev:   14726adea5ea21512071ba339fbdb704bb953b29   (sin checkout)
merge-base:              14726adea5ea21512071ba339fbdb704bb953b29   → fast-forward
Commits en origin/dev:   43  (gabielrodriguez 41, gabrielrodriguez 2)
Commits nuevos:          25
Archivos trackeados:     178 (antes 145)
Diff HEAD..origin/dev:   80 archivos (A 37, D 4, M 39) · +5.497 / −1.920 líneas
```

### 11.2 Flujo del hallazgo crítico R-01

```text
GET /api/sga/usuarios            (usuario_routes.py:82)   data=usuarios  ← ORM Usuario[]
GET /api/sga/usuarios/{id}       (usuario_routes.py:113)  data=usuario   ← ORM Usuario
        │
        ▼
response_success(...)  →  convertir_json(data)            (response.py:64)
        │
        ▼
hasattr(data, "__tablename__") → _orm_to_dict(obj)        (response.py:52-54, 14-30)
        │
        ▼
{ k: v for k, v in obj.__dict__.items() if not k.startswith("_") }
        │
        ▼
incluye "contrasena_usuario"  (Column(String(255)) en models/usuario.py:19)
        │
        ▼
JSONResponse → hash bcrypt en la respuesta HTTP

CONTRASTE (rama local 14726ad, sin la fuga):
usuario_controller.py:12-26  SELECT_USUARIO_CAMPOS = """id_usuario, rol_usuario,
                              nombres_usuario, apellidos_usuario, email_usuario,
                              telefono_usuario, tipo_documento, estado_registro,
                              fecha_creacion, fecha_actualizacion"""   ← SIN contraseña
```

### 11.3 Endpoints afectados por R-01

| Endpoint | Rol requerido | ¿Expone hash? |
|---|---|---|
| `GET /usuarios` | admin sin filtro / staff con `?rol=encargado_logistico` | **Sí** |
| `GET /usuarios/{id}` | `SOLO_ADMIN` | **Sí** |
| `POST /usuarios` | `SOLO_ADMIN` | No (dict explícito, `usuario_routes.py:43-48`) |
| `PATCH /usuarios/{id}` | `SOLO_ADMIN` | No (dict explícito, `:137-144`) |
| `PATCH /usuarios/{id}/estado` | `SOLO_ADMIN` | No (dict explícito, `:181`) |
| `GET /clientes[/{id}]` | `STAFF_INTERNO` | Sin hash (contraseña `NULL` por diseño) pero expone todos los campos del cliente |

### 11.4 Configuración Docker relevante

```yaml
# docker-compose.yml:47-48 y 83-84  (comentario "solo localhost" no se cumple)
ports:
  - "5432:5432"    # publica en 0.0.0.0
  - "8000:8000"    # publica en 0.0.0.0
  - "80:80"

# docker-compose.yml:76-78  (healthcheck = Swagger)
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:8000/docs || exit 1"]
```

```sh
# entrypoint.sh:6   set -e  → aborta el contenedor ante cualquier fallo
# entrypoint.sh:48  alembic upgrade head   → en conflicto con "SQL scripts + stamp head"
# entrypoint.sh:52  uvicorn ... --workers 2 → duplica el job de APScheduler
```

### 11.5 Contraseñas en texto plano detectadas en `origin/dev` (solo ubicación)

| Archivo | Línea |
|---|---|
| `database/01_esquema/03_seed_data.sql` | 7 |
| `database/03_documentacion/INDICE.md` | 120 |
| `database/README_base_de_datos.md` | 46 |
| `database/README_base_de_datos.md` | 76 |

*(No se reproduce el valor; ver R-08.)*

### 11.6 Búsquedas de seguridad sobre `origin/dev`

| Búsqueda | Resultado |
|---|---|
| `AKIA…` / clave privada PEM / `ghp_…` / `AIza…` | Sin coincidencias ✅ |
| `import logging` / `getLogger` | Sin coincidencias ⛔ |
| `ratelimit` / `slowapi` / `limiter` | Sin coincidencias ⛔ |
| Archivos `test`/`spec` en el árbol | Sin coincidencias ⛔ |
| `.github` / workflows / YAML de CI | Solo `docker-compose.yml` ⛔ |
| `pyproject` / `ruff` / `mypy` / `pre-commit` / `pytest` | Sin coincidencias ⛔ |
| `"strict"` en `tsconfig.app.json` | Sin coincidencias ⛔ |
| `str(error)` en `app/` | 68 coincidencias ⛔ |
| `es_recogida` | 6 coincidencias (todas en frontend/documentación) ⛔ |

---

## Declaración final

- **Operaciones de Git realizadas:** exclusivamente `git fetch origin dev` (autorizada por el usuario). **No** se hizo `checkout`, `merge`, `commit`, `push` ni cambio de rama; la rama local `dev` y el working tree **siguen en `14726ad`**.
- **Único archivo creado:** este informe (`AUDITORIA_RAMA_REMOTA_DEV.md`). No se modificó ni eliminó ningún archivo del repositorio.
- **No** se instalaron dependencias, **no** se ejecutaron migraciones ni operaciones sobre datos, **no** se construyeron imágenes Docker.
- Los hallazgos se apoyan en evidencia citada (`archivo:línea`); R-01 y R-02 se marcan explícitamente como no confirmados en runtime por las restricciones del entorno.
- Este informe **no implementa ninguna recomendación**: espera autorización para proceder (etapa 0, etapa 0.5 de contención, o hallazgos concretos).
