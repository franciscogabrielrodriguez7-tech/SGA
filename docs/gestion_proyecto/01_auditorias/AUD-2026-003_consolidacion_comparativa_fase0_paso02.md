# AUD-2026-003 — SGA: Consolidación comparativa de auditorías · Fase 0, paso 0.2

> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git`
> **Rama:** `dev`   **Commit:** `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c`
> **Fecha de elaboración:** 2026-10-29   **Modo:** solo lectura
> **Estado del informe:** vigente
> **Fuentes:** AUD-2026-001, AUD-2026-002, 00_indice.md, VERIFICACION_DIRECTORIO_PRINCIPAL_FASE_0_2.md, VERIFICACION_FINAL_ORGANIZACION_DOCUMENTAL.md

---

## ÍNDICE

1. [Objetivo y alcance](#1-objetivo-y-alcance)
2. [Repositorio, rama y commit verificados](#2-repositorio-rama-y-commit-verificados)
3. [Fuentes consultadas](#3-fuentes-consultadas)
4. [Metodología de comparación](#4-metodología-de-comparación)
5. [Resumen de diferencias entre auditorías](#5-resumen-de-diferencias-entre-auditorías)
6. [Matriz de correspondencias F↔R](#6-matriz-de-correspondencias-fr)
7. [Hallazgos sin correspondencia identificada](#7-hallazgos-sin-correspondencia-identificada)
8. [Hallazgos resueltos con evidencia](#8-hallazgos-resueltos-con-evidencia)
9. [Hallazgos persistentes o parcialmente mitigados](#9-hallazgos-persistentes-o-parcialmente-mitigados)
10. [Hallazgos históricos o dependientes del entorno](#10-hallazgos-históricos-o-dependientes-del-entorno)
11. [Hallazgos no revalidados](#11-hallazgos-no-revalidados)
12. [Riesgos críticos pendientes (P0 abiertos)](#12-riesgos-críticos-pendientes-p0-abiertos)
13. [Contradicciones y limitaciones](#13-contradicciones-y-limitaciones)
14. [Condiciones de aceptación del paso 0.2](#14-condiciones-de-aceptación-del-paso-02)
15. [Relación con pasos siguientes](#15-relación-con-pasos-siguientes)

---

## 1. Objetivo y alcance

Este documento constituye la consolidación comparativa formal del **Paso 0.2** de la Fase 0 del roadmap del proyecto SGA. Su propósito es:

- Contrastar los hallazgos de las auditorías AUD-2026-001 (rama local `dev` @ `14726ad`) y AUD-2026-002 (rama remota `origin/dev` @ `12760d4`).
- Establecer correspondencias entre hallazgos F-01…F-49 (auditoría 1) y R-01…R-16 (auditoría 2).
- Clasificar cada hallazgo con el vocabulario de evidencia aprobado: **Resuelto con evidencia / Persistente con evidencia / Parcialmente mitigado / Modificado / Histórico o dependiente del entorno / No revalidado / Requiere comprobación adicional**.
- Identificar los riesgos P0 abiertos que condicionan el avance a las etapas siguientes.
- Documentar contradicciones y limitaciones sin forzar conclusiones.

**Alcance:** exclusivamente documental y de solo lectura. No se ejecutaron comandos de escritura sobre el código, instalación de dependencias, migraciones ni operaciones Git de escritura.

**Fuera del alcance:** inicio del paso 0.3 (clasificación de evidencias), paso 0.4 (consolidación de inventario), ni declaración de cierre del paso 0.2 sin aprobación explícita del usuario.

---

## 2. Repositorio, rama y commit verificados

| Campo | Valor |
|---|---|
| Repositorio raíz | `C:\Users\Acer\Documents\Default Project\SGA_repo\SGA` |
| Rama activa | `dev` |
| HEAD local | `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` |
| `origin/dev` | `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` (identidad confirmada) |
| Estado Git | `?? AGENTS.md` · `?? docs/gestion_proyecto/` (ambos sin seguimiento) |
| Archivos trackeados | 178 |
| Verificación | `git rev-parse HEAD` · `git branch --show-current` · `git status --short` |

> **Nota:** el directorio `Default Project\` contiene un repositorio Git externo con 178 archivos marcados como eliminados (reubicados a `SGA_obsoleto/`). No se ejecutan comandos Git desde ese directorio.

---

## 3. Fuentes consultadas

| Documento | Ruta | Rol |
|---|---|---|
| AUD-2026-001 | `docs/gestion_proyecto/01_auditorias/AUD-2026-001_auditoria_inicial_dev_14726ad.md` | Base de hallazgos F-01…F-49 |
| AUD-2026-002 | `docs/gestion_proyecto/01_auditorias/AUD-2026-002_auditoria_dev_remota_12760d4.md` | Base de hallazgos R-01…R-16; §3 (resueltos); Anexo I (matriz) |
| 00_indice.md | `docs/gestion_proyecto/00_indice.md` | Convenciones y estructura documental |
| VERIFICACION_DIRECTORIO_PRINCIPAL_FASE_0_2.md | `C:\Users\Acer\Documents\Default Project\VERIFICACION_DIRECTORIO_PRINCIPAL_FASE_0_2.md` | Confirmación del estado del repositorio (`venv/`, ramas, hashes) |
| VERIFICACION_FINAL_ORGANIZACION_DOCUMENTAL.md | `C:\Users\Acer\Documents\Default Project\VERIFICACION_FINAL_ORGANIZACION_DOCUMENTAL.md` | Verificación post-organización |

**Hash de integridad de AUD-2026-001 (verificado en esta sesión):**
`EAD1197FEE60ED7C6B7CD32452B42F1FFFD929E3B6EBF3CF9F157D69B57741E7` (SHA-256, 55059 B)

> **Nota de seguridad:** este documento no reproduce contraseñas ni hashes de contraseñas. Las credenciales detectadas se referencian por ubicación (`<credencial — ver R-08>`).

---

## 4. Metodología de comparación

1. **Lectura completa** de AUD-2026-001 (673 líneas) y AUD-2026-002 (562 líneas), incluyendo sus anexos.
2. **Fuente primaria de resolución:** §3 de AUD-2026-002 ("Hallazgos resueltos respecto a la auditoría 1") y Anexo I (Matriz de resolución, AUD-2026-002 L400-452).
3. **Criterio de resolución:** un hallazgo se declara resuelto solo si AUD-2026-002 lo documenta explícitamente como resuelto **con evidencia citada**. No se declara resuelto por ausencia en la segunda auditoría.
4. **Criterio de persistencia:** un hallazgo se declara persistente si AUD-2026-002 §4 lo lista como persistente, con evidencia actualizada sobre el árbol remoto.
5. **Clasificación corregida respecto a la consolidación preliminar:** se aplican las correcciones documentadas en §4 del encargo (F-01, F-02, F-03, F-07, F-14, F-24/R-08, R-01/R-10).
6. **Nivel de evidencia:** se distingue explícitamente entre evidencia verificada por lectura de archivos, evidencia probable por análisis estático de flujo de datos, y comprobación en runtime no ejecutada.

**Vocabulario de clasificación aprobado:**

| Clasificación | Definición |
|---|---|
| **Resuelto con evidencia** | AUD-2026-002 documenta la corrección con archivo y línea citados |
| **Persistente con evidencia** | AUD-2026-002 §4 confirma la persistencia con evidencia actualizada |
| **Parcialmente mitigado** | Artefactos que mitigan el hallazgo existen, pero su funcionamiento en runtime no está confirmado o persisten brechas operacionales |
| **Modificado** | El hallazgo cambió de forma o alcance sin estar completamente resuelto |
| **Histórico o dependiente del entorno** | La condición describía el entorno de auditoría, no un defecto inherente del repositorio |
| **No revalidado** | No hay evidencia suficiente en AUD-2026-002 para afirmar persistencia ni resolución |
| **Requiere comprobación adicional** | La condición no puede determinarse sin ejecución en runtime o acceso a recursos externos |

---

## 5. Resumen de diferencias entre auditorías

### 5.1 Tabla comparativa de estado

| Dimensión | AUD-2026-001 (`14726ad`) | AUD-2026-002 (`12760d4`) | Δ |
|---|---|---|---|
| HEAD auditado | `14726adea5ea21512071ba339fbdb704bb953b29` | `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` | +25 commits |
| Commits / autores | 18 / 1 (`gabielrodriguez`) | 43 / 2 (mismo autor, distinto nombre) | +25 commits |
| Archivos trackeados | 145 | 178 | +33 archivos |
| Hallazgos documentados | F-01…F-49 (49 total) | R-01…R-16 (16 nuevos) + evaluación de persistencias | — |
| Divergencia local↔remoto en `dev` | Sí (objeto remoto inexistente) | Resuelta en `dev` (fast-forward seguro); divergencia en `main` independiente persiste | ⚠️ |
| CORS con comodín + credentials | Presente (F-23, P0) | Eliminado → `CORS_ORIGINS` por env | ✅ |
| Migración Alembic destructiva | Presente (F-32, P0) | Reemplazada por migración limpia | ✅ |
| `alembic` en requirements | Ausente (F-11, P1) | Presente (`alembic==1.13.3`) | ✅ |
| `alembic/env.py` incompleto | Presente (F-33, P1) | Corregido (`import app.models`) | ✅ |
| Artefactos de infraestructura | Ninguno (F-07, P1) | Docker stack completo (parcial; no confirmado en runtime) | ⚠️ |
| Pruebas automatizadas | 0 (F-15, P0) | 0 | ⛔ |
| CI / `.github/workflows` | 0 (F-21, P0) | 0 | ⛔ |
| Herramientas de calidad backend | 0 (F-12, P0) | 0 | ⛔ |
| TypeScript `strict` | No (F-19, P1) | No | ⛔ |
| Credencial en texto plano publicada | 1 archivo (F-24, P0) | 4 archivos versionados (R-08, P0); copias en `docs/gestion_proyecto/` saneadas | ⛔ peor en código versionado |
| `str(error)` en respuestas 500 | ~68 sitios (F-26, P1) | ~68 sitios | ⛔ |
| Rate limiting en login | No (F-27, P0) | No | ⛔ |
| Logging estructurado | No (F-36, P1) | No | ⛔ |
| 6 docs en 0 bytes | Sí (F-39, P0) | Sí (en el árbol trackeado) | ⛔ |
| Auditoría `docs/01..06` versionada | No (F-40, P0) | No existe en remoto (organizada localmente en `docs/gestion_proyecto/`, aún untracked) | ⛔ |
| **Nuevo — hash de contraseña en API** | No | Sí (R-01, P0 — regresión) | 🔴 |
| **Nuevo — serialización ORM sin allowlist** | No | Sí (R-10, P0 — raíz de R-01) | 🔴 |
| **Nuevo — alembic automático en arranque** | No | Sí (R-02, P0 — probable) | 🔴 |
| **Nuevo — puertos en 0.0.0.0** | No | Sí (R-04, P0) | 🔴 |

### 5.2 Balance numérico

| Categoría | Cantidad |
|---|---|
| Hallazgos F resueltos con evidencia | 5 (`F-03` en rama `dev`, `F-11`, `F-23`, `F-32`, `F-33`) |
| Hallazgos F parcialmente mitigados | 4 (`F-07`, `F-30`, `F-42`, `F-48`) |
| Hallazgos F históricos / dependientes del entorno | 3 (`F-01`, `F-02`, `F-14`) |
| Hallazgos F controles positivos / contexto | 4 (`F-06`, `F-37`, `F-38`, `F-49`) |
| Hallazgos F persistentes con evidencia | 30 |
| Hallazgos F no revalidados / requieren comprobación | 3 (`F-34`, `F-46`, `F-47`) |
| Hallazgos R nuevos en `origin/dev` | 16 (`R-01`…`R-16`) |
| De los cuales P0 | 5 (`R-01`, `R-02`, `R-04`, `R-08`, `R-10`, más `R-15`) |
| Fortalezas nuevas (`S-01`…`S-10`) | 10 |

---

## 6. Matriz de correspondencias F↔R

| F (AUD-2026-001) | Descripción resumida | Correspondencia R / S (AUD-2026-002) | Clasificación corregida y naturaleza de la relación |
|---|---|---|---|
| **F-01** | Baseline `dev` @ `14726ad` | — | **Actualizado** — marcador de línea base, ahora `12760d4` (ver §10) |
| **F-02** | Clon single-branch | — | **Histórico / contexto específico** — describe el clon de OpenCode; `SGA_repo/SGA` tiene clon completo con `main` local (ver §10) |
| **F-03** | Divergencia local↔remoto en `dev` | — | **Resuelto con evidencia (en `dev`) / Divergencia independiente en `main` persistente** — fast-forward confirmado en `dev`; `main` local presenta ahead 26 / behind 37 respecto a `origin/main` (ver §8 y §10) |
| **F-04** | Autor único | — | **Persistente con evidencia** — 2 identificadores de autor para la misma persona (`gabielrodriguez` 41, `gabrielrodriguez` 2) |
| **F-05** | Commits sin convención | **R-16** | **Persistente con evidencia / Modificado** — R-16 amplía con merge cruzado `deployment→dev` y commits de ida/vuelta de Vercel |
| **F-06** | Estructura monorepo | — | **Modificado (contexto estructural)** — ampliado (+33 archivos, stack Docker) |
| **F-07** | Sin artefactos de infra | **R-09** (y relacionado con R-02, R-04, R-05, R-11) | **Parcialmente mitigado — artefactos verificados, funcionamiento no confirmado** — existe stack Docker, pero con riesgos operacionales abiertos y deriva documental respecto a Render/Vercel (ver §9.3) |
| **F-08** | 6 docs de diagnóstico sin trackear | **R-15** | **Persistente con evidencia** — R-15 confirma que no existen en `origin/dev`; organizados localmente en `docs/gestion_proyecto/04_diagnostico/` pendientes de commit autorizado |
| **F-09** | Rutas de documentación de proceso vacías | **R-15** (junto con F-39) | **Persistente con evidencia** — carpetas `docs/requirements`, `docs/scrum`, `docs/ui_ux` siguen con archivos de 0 bytes |
| **F-10** | Dependencias backend pinneadas sin auditoría CVE | — | **Persistente con evidencia** — ahora 25 dependencias pinneadas; sin `pip-audit`/Dependabot |
| **F-11** | `alembic` ausente en `requirements.txt` | — | **Resuelto con evidencia** — `alembic==1.13.3` añadido en `requirements.txt:1-3` (ver §8) |
| **F-12** | Sin herramientas de calidad backend | — | **Persistente con evidencia (P0)** — sin `pytest`, `ruff`, `mypy`, `pyproject.toml` |
| **F-13** | Rangos `^` en `package.json` con lockfile | **S-07** | **Parcialmente mitigado** — `sga_frontend_jwt/Dockerfile` usa `npm ci`, pero en desarrollo local y docs aún no está estandarizado |
| **F-14** | Entornos no instalados (`venv/`, `node_modules/` ausentes) | — | **Histórico / dependiente del entorno** — `SGA_repo/SGA` sí cuenta con `venv/` y `.env` locales; la no ejecución de lint/build se mantiene como limitación metodológica de lectura (ver §10) |
| **F-15** | Cero pruebas automatizadas | — | **Persistente con evidencia (P0)** — 0 archivos de test en todo el repositorio |
| **F-16** | Sin script `test` en `package.json` | — | **Persistente con evidencia** — `package.json:6-11` solo define `dev`, `build`, `lint`, `preview` |
| **F-17** | Demos SQL manuales con `ROLLBACK` | — | **Persistente con evidencia** — se mantienen los 4 scripts en `database/06_demos_endpoints/` |
| **F-18** | `oxlint` con configuración mínima (2 reglas) | — | **Persistente con evidencia** — `.oxlintrc.json` sin cambios |
| **F-19** | TypeScript sin `"strict": true` | — | **Persistente con evidencia** — `tsconfig.app.json` sin cambios |
| **F-20** | Build con typecheck (`tsc -b && vite build`) no en CI | **S-07** | **Persistente con evidencia** — corre dentro del `Dockerfile` multi-stage, pero no existe CI que lo ejecute en PRs |
| **F-21** | Sin CI/CD (`.github/workflows` ausente) | — | **Persistente con evidencia (P0)** — único YAML del repo es `docker-compose.yml` |
| **F-22** | Sin hooks de pre-commit ni formateador | — | **Persistente con evidencia** — sin `.pre-commit-config.yaml` ni `.editorconfig` |
| **F-23** | CORS `"*"` + `allow_credentials=True` | **S-01** | **Resuelto con evidencia** — `CORS_ORIGINS` parametrizado por variable de entorno (ver §8) |
| **F-24** | Credencial de seed publicada y hash repetido | **R-08** | **Persistente con evidencia (P0) / Modificado (agravado a 4 archivos versionados)** — copias en `docs/gestion_proyecto/` saneadas, pero persiste en 4 archivos trackeados de `database/` (ver §9.2) |
| **F-25** | `README.md` raíz con credenciales que no existen en el seed | — | **Persistente con evidencia** — `README.md:80-88` sin cambios |
| **F-26** | `str(error)` devuelto en respuestas HTTP 500 | — | **Persistente con evidencia** — ~68 ocurrencias en `app/routes/` y `auth_dependency.py` |
| **F-27** | Sin rate limiting en `POST /auth/login` | — | **Persistente con evidencia (P0)** — sin middleware ni limitador |
| **F-28** | JWT almacenado en `localStorage` | **R-14** | **Persistente con evidencia** — R-14 añade decodificación de `exp` en cliente para UX; almacenamiento en `localStorage` se mantiene |
| **F-29** | `rol_usuario` en JWT sin revalidación; TTL 480 min | — | **Persistente con evidencia** — `auth_dependency.py:58-61` y `settings.py:26` sin cambios |
| **F-30** | Sin cabeceras de seguridad ni límites de request | **R-12** | **Parcialmente mitigado** — Nginx añade 3 cabeceras (S-08), pero faltan CSP/HSTS (R-12) y límites en FastAPI |
| **F-31** | Swagger `/docs` expuesto por defecto | **R-03** | **Persistente con evidencia / Agravado operacionalmente** — ahora el healthcheck de Docker depende de `/docs` (R-03) |
| **F-32** | Migración baseline destructiva (`drop_table` en `upgrade`) | **S-02** | **Resuelto con evidencia** — reemplazada por `0001_initial_schema.py` solo con `op.create_*` (ver §8) |
| **F-33** | `alembic/env.py` sin `AuditoriaSistema` | **S-02** | **Resuelto con evidencia** — `import app.models` centralizado en `app/models/__init__.py` (ver §8) |
| **F-34** | Interpolación f-string en SQL (`INTERVAL '{dias} days'`) | — | **No revalidado** — AUD-2026-002 Anexo I indica no reverificado tras refactor a ORM (ver §11) |
| **F-35** | Filtros `ilike` con comodines sin escapar | — | **Persistente con evidencia** — patrón `ilike(f"%{...}%")` persiste en controladores ORM |
| **F-36** | Sin logging estructurado (solo 2 `print`) | — | **Persistente con evidencia** — sin uso de `logging` en `app/` |
| **F-37** | Controles positivos de seguridad (sin secretos cloud/PEM, `.env` ignorado, bcrypt) | **S-04, S-05** | **Control positivo persistente** — reforzado con `.dockerignore` y `.env.docker.example` (excepción: regresión de serialización en R-01) |
| **F-38** | RBAC aplicado en endpoints (44/45 → 37/38) | **S-10** (y **R-07** por reducción de endpoints) | **Control positivo persistente** — 37 de 38 endpoints protegen rol; la reducción de 45 a 38 corresponde a R-07 |
| **F-39** | 6 documentos trackeados de 0 bytes | **R-15** | **Persistente con evidencia (P0)** — los 6 archivos continúan en 0 bytes en `origin/dev` |
| **F-40** | Documentación técnica `docs/01..06` sin versionar | **R-15** | **Persistente con evidencia (P0)** — inexistente en `origin/dev`; organizada localmente en `docs/gestion_proyecto/04_diagnostico/` sin commit aún |
| **F-41** | `README.md` raíz con sección de acceso inicial desactualizada | **R-09** | **Persistente con evidencia** — sin cambios en `origin/dev`; además no refleja Docker |
| **F-42** | `database/README_base_de_datos.md` desactualizado y conflicto PG 14 vs 16 | **R-09** | **Parcialmente mitigado** — `docker-compose.yml` fija `postgres:16-alpine`, pero los READMEs siguen en conflicto y desactualizados |
| **F-43** | `database/03_documentacion/INDICE.md` con esquema antiguo (`es_recogida`) | **R-08** | **Persistente con evidencia** — sigue con esquema antiguo y además contiene credencial en texto plano (`INDICE.md:120`) |
| **F-44** | Contratos frontend↔backend desalineados (`es_recogida`) | — | **Persistente con evidencia** — presente en 6 archivos de `sga_frontend_jwt/src/` |
| **F-45** | Sin documentos de gobernanza (`CONTRIBUTING`, `CODEOWNERS`, `SECURITY`, `CHANGELOG`, ADRs) | — | **Persistente con evidencia** — ausentes en `origin/dev` (`AGENTS.md` creado localmente para OpenCode, aún untracked) |
| **F-46** | Cumplimiento de flujo `dev → deployment` y protección de ramas | **R-16** | **Requiere comprobación adicional** — reglas en GitHub no comprobadas; R-16 evidencia merge inverso `deployment` en `dev` (`63cb22c`) |
| **F-47** | Existencia de PRs, issues, etiquetas y milestones en GitHub | — | **Requiere comprobación adicional** — no comprobado sin acceso a API de GitHub |
| **F-48** | Complejidad concentrada en controllers | — | **Parcialmente mitigado** — división de vistas en 25 componentes UI y paso parcial a ORM |
| **F-49** | Auditoría de BD por triggers PL/pgSQL + `set_audit_context` | — | **Control positivo persistente** — intacto en `database/` y `app/utils/audit_context.py` |

---

## 7. Hallazgos sin correspondencia identificada

### 7.1 Hallazgos nuevos de `AUD-2026-002` sin antecedente directo en `AUD-2026-001`

Estos hallazgos surgen de los 25 commits introducidos entre `14726ad` y `12760d4` (migración a ORM, serializador `_orm_to_dict`, dockerización y eliminación de rutas):

| ID | Descripción | Estado / Nivel de evidencia | Prioridad |
|---|---|---|---|
| **R-01** | **Regresión:** `GET /usuarios` y `GET /usuarios/{id_usuario}` exponen `contrasena_usuario` (hash bcrypt) al devolver entidades ORM serializadas por `_orm_to_dict` | **Verificado por análisis estático de flujo de datos; confirmación en runtime pendiente** | **P0** |
| **R-02** | `entrypoint.sh` ejecuta `alembic upgrade head` en cada arranque con `set -e`, entrando en conflicto con el flujo SQL manual (`01_tablas.sql` + `alembic stamp head`) | **Probable** (inferido estáticamente; requiere prueba de arranque contra BD inicializada por SQL) | **P0** |
| **R-04** | `docker-compose.yml` publica `"5432:5432"` y `"8000:8000"` en `0.0.0.0`, contradiciendo los comentarios que afirman exposición solo en `localhost` | **Verificado en configuración** | **P0** |
| **R-05** | Contenedores backend y frontend se ejecutan como `root` (sin directiva `USER` en ambos `Dockerfile`) | **Verificado en configuración** | P1 |
| **R-06** | `entrypoint.sh` lanza `uvicorn --workers 2` mientras APScheduler corre en el evento startup del proceso, duplicando el job diario de las 00:05 | **Verificado en configuración / impacto probable en runtime** | P2 |
| **R-07** | Eliminación de 7 endpoints (`inventario_routes`, `GET .../renovaciones/{id_auditoria}` y alias `PUT`), pasando de 45 a 38 endpoints sin versionado de contrato | **Verificado en código** | P1 |
| **R-10** | `_orm_to_dict` (`app/utils/response.py:14-30`) serializa sin allowlist todos los atributos y `@property` de cualquier entidad ORM (causa raíz estructural de R-01) | **Verificado por análisis estático de flujo de datos; confirmación en runtime pendiente** | **P0** |
| **R-11** | `entrypoint.sh:14-31` parsea `DATABASE_URL` con expresiones regulares frágiles (`re.search(r':([^@]+)@', db_url)`) que fallan ante caracteres especiales en la contraseña | **Verificado en código** | P2 |
| **R-13** | `docker-compose.yml` carece de directivas de endurecimiento (`security_opt`, `read_only`, límites de CPU/memoria, `user`) | **Verificado en configuración** | P2 |

### 7.2 Hallazgos de `AUD-2026-001` sin par `R-XX` específico en `AUD-2026-002`

No tienen un identificador `R-XX` nuevo porque su estado fue evaluado directamente en las secciones §3, §4 y Anexo I de `AUD-2026-002`:
- **Resueltos directamente:** `F-03` (en `dev`), `F-11`, `F-23` (asociado a fortaleza `S-01`), `F-32` y `F-33` (asociados a `S-02`).
- **Históricos / de entorno:** `F-01`, `F-02`, `F-14`.
- **Persistentes directos sin cambio de naturaleza:** `F-04`, `F-10`, `F-12`, `F-15`, `F-16`, `F-17`, `F-18`, `F-19`, `F-21`, `F-22`, `F-25`, `F-26`, `F-27`, `F-29`, `F-35`, `F-36`, `F-44`, `F-45`, `F-47`, `F-48`.
- **No revalidado:** `F-34`.

---

## 8. Hallazgos resueltos con evidencia

Únicamente se declaran resueltos los hallazgos cuya corrección consta verificada en el árbol de `origin/dev` (`12760d4`):

| ID | Hallazgo | Evidencia verificada en `12760d4` | Alcance de la resolución |
|---|---|---|---|
| **F-03** *(alcance `dev`)* | Divergencia local↔remoto en rama `dev` | `AUD-2026-002` §2.1 demostró que `14726ad` es ancestro directo de `12760d4` (fast-forward limpio de 25 commits). En `SGA_repo/SGA`, `HEAD` local y `origin/dev` apuntan a `12760d4` | **Resuelto en `dev`**. *(Nota: la divergencia de la rama local `main` respecto a `origin/main` es un hecho independiente y permanece abierta; ver §10)* |
| **F-11** | `alembic` no declarado en `requirements.txt` | `sga_backend_jwt/requirements.txt:1-3` declara explícitamente `alembic==1.13.3`, `Mako==1.3.5` y `MarkupSafe==3.0.3` (commit `0ceaed8`) | **Resuelto con evidencia** |
| **F-23** | CORS inseguro con `"*"` y `allow_credentials=True` | `sga_backend_jwt/app/config/settings.py:30-38` lee `CORS_ORIGINS` desde entorno (default local seguro) y `app/main.py:61-67` lo aplica sin comodín (commit `0bc33ac`, fortaleza `S-01`) | **Resuelto con evidencia** |
| **F-32** | Migración baseline de Alembic destructiva (`drop_table` en `upgrade()`) | Eliminado `d4f74f3d4896_baseline_schema.py`; reemplazado por `alembic/versions/0001_initial_schema.py` con `upgrade()` compuesto únicamente por `op.create_*` (commit `e4d411`, fortaleza `S-02`) | **Resuelto con evidencia** *(el conflicto operacional de su ejecución en `entrypoint.sh` se registra por separado en `R-02`)* |
| **F-33** | `alembic/env.py` no importaba todos los modelos (`AuditoriaSistema` ausente) | `alembic/env.py:24-27` importa `app.models` y `app/models/__init__.py` centraliza los 7 modelos ORM (commit `0ceaed8`, fortaleza `S-02`) | **Resuelto con evidencia** |

> **Mejora adicional verificada (N-01 / S-03):** endurecimiento de `POST /auth/login` contra enumeración de usuarios (`usuario_controller.py` y `auth_routes.py:27-33` devuelven un mensaje genérico único `"Credenciales incorrectas"`, commit `ca15d4c`).

---

## 9. Hallazgos persistentes o parcialmente mitigados

### 9.1 Hallazgos persistentes con evidencia

Se mantienen vigentes en `12760d4` según comprobación estática de `AUD-2026-002` §4:
- **Gobernanza, proceso y calidad (P0/P1/P2):** `F-04` (autor único), `F-05` / `R-16` (commits sin convención y merge cruzado), `F-10` (dependencias sin auditoría CVE), `F-12` (**P0**, sin linter/typecheck/tests en backend), `F-15` (**P0**, cero pruebas automatizadas), `F-16` (sin script `test`), `F-17` (demos SQL manuales), `F-18` (`oxlint` mínimo), `F-19` (TypeScript sin `strict`), `F-20` (build no ejecutado en CI), `F-21` (**P0**, sin CI/CD), `F-22` (sin pre-commit), `F-45` (sin documentos de gobernanza versionados).
- **Seguridad y configuración (P0/P1/P2/P3):** `F-24` / `R-08` (**P0**, credencial en texto plano y hash repetido en archivos versionados), `F-25` (credenciales en `README.md` raíz no coinciden con el seed), `F-26` (`str(error)` en ~68 respuestas 500), `F-27` (**P0**, sin rate limiting en login), `F-28` / `R-14` (JWT en `localStorage`), `F-29` (rol en JWT sin revalidar contra BD y TTL de 480 min), `F-31` / `R-03` (`/docs` expuesto y acoplado al healthcheck), `F-35` (`ilike` sin escapar comodines), `F-36` (sin logging estructurado).
- **Documentación y contratos (P0/P1/P2):** `F-08` / `F-09` / `F-39` / `F-40` / `R-15` (**P0**, 6 docs de 0 bytes trackeados y diagnósticos aún no comiteados en Git), `F-41` (README raíz desactualizado), `F-43` (`INDICE.md` obsoleto), `F-44` (`es_recogida` huérfano en 6 archivos del frontend), `R-07` (breaking changes de API sin versionado), `R-09` (deriva documental Render/Vercel vs Docker).

### 9.2 Estado dual de `F-24` / `R-08` (credencial de prueba expuesta)

Es crítico distinguir entre las copias documentales de gestión y los archivos del repositorio versionado:

| Ámbito | Archivos | Estado actual |
|---|---|---|
| **Documentación organizada en `docs/gestion_proyecto/04_diagnostico/`** | `DXC-2026-001`, `DXC-2026-002`, `DXC-2026-006` | **Saneado localmente** (credencial reemplazada por `<credencial — ver R-08>`; verificado en `VERIFICACION_FINAL_ORGANIZACION_DOCUMENTAL.md`) |
| **Archivos versionados del proyecto (`HEAD = 12760d4`)** | `database/01_esquema/03_seed_data.sql:7` (y hash repetido en `:16-28`), `database/03_documentacion/INDICE.md:120`, `database/README_base_de_datos.md:46` y `:76` | **Persistente abierto (P0)** — el problema en el código y documentación de BD trackeada **NO está resuelto** |

### 9.3 Hallazgos parcialmente mitigados

| ID | Hallazgo | Mitigación introducida en `12760d4` | Por qué no está completamente resuelto |
|---|---|---|---|
| **F-07** | Ausencia de artefactos de infraestructura y despliegue | Se añadieron `docker-compose.yml`, 2 `Dockerfile`, `nginx.conf`, `entrypoint.sh` y `.env.docker.example` | **Artefactos verificados estáticamente, pero funcionamiento no confirmado en runtime.** Presenta además fallos P0/P1 asociados (`R-02` conflicto Alembic/SQL, `R-04` puertos en `0.0.0.0`, `R-05` ejecución como root, `R-11` regex frágil) y deriva respecto a la documentación (`R-09`) |
| **F-13** | Dependencias frontend con rangos `^` | `sga_frontend_jwt/Dockerfile` utiliza `npm ci` (`S-07`) | No existe CI ni guía actualizada que imponga `npm ci` fuera del build Docker |
| **F-30** | Sin cabeceras de seguridad HTTP ni límites | `nginx.conf:70-75` añade `X-Frame-Options`, `X-Content-Type-Options` y `Referrer-Policy` (`S-08`) | Faltan `Content-Security-Policy` y `Strict-Transport-Security` (`R-12`), y el backend FastAPI sigue sin límites de tamaño de body ni timeouts |
| **F-42** | Inconsistencia de versión PostgreSQL (14+ vs 16) y árbol SQL desactualizado | `docker-compose.yml:26` fija `postgres:16-alpine` | `README.md` raíz sigue declarando PostgreSQL 14+ y `database/README_base_de_datos.md` continúa sin reflejar `06_demos_endpoints/` |
| **F-48** | Controladores extensos y lógica acoplada | Refactor de frontend en 25 componentes y migración de consultas a ORM | `alquiler_controller.py` mantiene alta concentración de responsabilidades sin capa de servicios puros testeada |

---

## 10. Hallazgos históricos o dependientes del entorno

Las siguientes clasificaciones corrigen la consolidación preliminar incorporando la evidencia de `VERIFICACION_DIRECTORIO_PRINCIPAL_FASE_0_2.md`:

| ID | Clasificación anterior | Clasificación corregida | Justificación con evidencia |
|---|---|---|---|
| **F-01** | Marcador estático | **Actualizado (histórico)** | En `AUD-2026-001` registraba el SHA base (`14726ad`). En el repositorio fuente de verdad (`SGA_repo/SGA`), la línea base verificada de la rama `dev` es `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c`. |
| **F-02** | Persistente en el repositorio | **Histórico / contexto específico del clon de auditoría** | `F-02` reflejaba que el clon donde se ejecutaron `AUD-2026-001` y `AUD-2026-002` tenía refspec single-branch (`--single-branch` solo para `dev`). Según `VERIFICACION_DIRECTORIO_PRINCIPAL_FASE_0_2.md` (§2, `DIF-04` y `DIF-05`), el repositorio principal `SGA_repo/SGA` tiene refspec estándar (`+refs/heads/*:refs/remotes/origin/*`) y cuenta con `origin/main` y `origin/deployment`. |
| **F-03** *(diferenciación `dev` vs `main`)* | Resuelto globalmente | **Resuelto en `dev` / Divergencia independiente en `main` persistente** | La divergencia de `dev` entre `14726ad` y `12760d4` quedó resuelta (fast-forward). Sin embargo, `VERIFICACION_DIRECTORIO_PRINCIPAL_FASE_0_2.md` (§2, `DIF-05`) demostró que en `SGA_repo/SGA` la rama local `main` (`58bf6b9`) diverge de `origin/main` (`ahead 26, behind 37`). Ambos hechos deben mantenerse separados. |
| **F-14** | Persistente como problema del repositorio | **Histórico / dependiente del entorno (con verificación de build/lint pendiente)** | En el directorio auditado originalmente no existían `venv/` ni `node_modules/`. En cambio, `VERIFICACION_DIRECTORIO_PRINCIPAL_FASE_0_2.md` (§2, `DIF-06`) verificó que `SGA_repo/SGA` **sí posee `sga_backend_jwt/venv/` y `.env`**. Por tanto, la ausencia de entorno virtual era una condición del directorio obsoleto, aunque la ejecución real de `lint`/`build`/tests sigue pendiente por restricción de modo solo lectura. |

---

## 11. Hallazgos no revalidados

No se declara ni resuelto ni vigente ningún hallazgo cuya evidencia no haya sido comprobada en el commit `12760d4`:

| ID | Hallazgo | Estado de validación | Acción requerida para revalidar |
|---|---|---|---|
| **F-34** | Interpolación f-string `text(f"INTERVAL '{dias} days'")` en `alquiler_controller.py` | **No revalidado** (`AUD-2026-002` Anexo I L437 indica expresamente *"No re-verificado en el refactor a ORM"*) | Inspección de lectura puntual sobre `sga_backend_jwt/app/controllers/alquiler_controller.py` en `12760d4` |
| **F-46** | Reglas de protección de ramas (`dev`, `deployment`, `main`) en GitHub | **Requiere comprobación adicional** (no comprobable localmente sin API de GitHub; `R-16` muestra un merge de `deployment` hacia `dev`, pero no informa la configuración actual del servidor remoto) | Consulta autorizada a la API de GitHub (`gh api`) o verificación manual del administrador del repositorio |
| **F-47** | Uso de Pull Requests, issues, etiquetas y milestones en GitHub | **Requiere comprobación adicional** (metadatos exclusivos de la plataforma GitHub, fuera de los objetos Git locales) | Consulta autorizada a la API de GitHub (`gh api`) |

---

## 12. Riesgos críticos pendientes (P0 abiertos)

Se mantienen en máxima prioridad (**P0**) todos los hallazgos bloqueantes que siguen abiertos en `12760d4`:

| ID | Riesgo P0 abierto | Clasificación y nivel de evidencia | Impacto principal |
|---|---|---|---|
| **R-01 / R-10** | Exposición de `contrasena_usuario` (hash bcrypt) en `GET /usuarios` y `GET /usuarios/{id_usuario}` debido a serialización ORM sin allowlist en `_orm_to_dict` (`response.py:14-30`) | **Persistente con evidencia — Verificado por análisis estático de flujo de datos; confirmación en runtime pendiente** | Cualquier rol interno con acceso de lectura a usuarios obtiene los hashes bcrypt (agravado por el hash único compartido en el seed de `F-24`/`R-08`). |
| **R-02** | Ejecución automática de `alembic upgrade head` en `entrypoint.sh:47-49` incompatible con bases de datos inicializadas mediante scripts SQL (`01_tablas.sql`) | **Probable — Requiere comprobación en runtime** | Fallo de arranque del contenedor backend (`set -e`) por colisión de tablas existentes, o divergencia entre dos fuentes de verdad del esquema. |
| **R-04** | Puertos de PostgreSQL (`5432:5432`) y backend (`8000:8000`) publicados en `0.0.0.0` en `docker-compose.yml:47-48, 83-84` pese a comentarios que indican solo localhost | **Persistente con evidencia — Verificado en configuración** | Exposición directa del motor de base de datos y de la API en todas las interfaces de red del host. |
| **F-24 / R-08** | Contraseña de prueba en texto plano publicada en 4 archivos versionados (`03_seed_data.sql:7`, `INDICE.md:120`, `README_base_de_datos.md:46,76`) y mismo hash bcrypt reutilizado en 11 usuarios del seed | **Persistente con evidencia (en archivos versionados)** *(copias en `docs/gestion_proyecto/` ya saneadas)* | Acceso inmediato si algún entorno utiliza los datos semilla; compromiso masivo si se revierte el único hash compartido. |
| **F-27** | Ausencia de rate limiting o bloqueo por intentos fallidos en `POST /auth/login` | **Persistente con evidencia — Verificado** | Vulnerabilidad a ataques de fuerza bruta y diccionario contra identificadores de usuario. |
| **F-12 / F-15 / F-21** | Cero pruebas automatizadas (`F-15`), cero herramientas de calidad en backend (`F-12`) y ausencia total de CI/CD (`F-21`) | **Persistente con evidencia — Verificado** | Imposibilidad de detectar regresiones (como `R-01`) de forma automatizada antes de integrar cambios humanos o de agentes IA. |
| **F-08 / F-39 / F-40 / R-15** | 6 documentos de requisitos/arquitectura/scrum en 0 bytes (`F-39`) y documentación técnica/de gestión aún no versionada en Git (`F-08`/`F-40`/`R-15`) | **Persistente con evidencia — Verificado** *(organizada localmente en `docs/gestion_proyecto/`, pendiente de commit autorizado)* | Falta de línea base documental versionada en el remoto y ausencia de especificaciones funcionales en los archivos de 0 bytes. |
| **F-46** | Protección de ramas principales y obligatoriedad de checks no comprobadas en GitHub | **Requiere comprobación adicional** | Riesgo de pushes directos o merges sin revisión ni validación automática. |

---

## 13. Contradicciones y limitaciones

### 13.1 Contradicciones documentales y técnicas detectadas

1. **Comentarios vs configuración real de puertos (`R-04`):** `docker-compose.yml` afirma en comentarios (`:45`, `:81`) que expone PostgreSQL y backend solo hacia el host local, pero la sintaxis `"5432:5432"` y `"8000:8000"` enlaza con `0.0.0.0`.
2. **Flujo de inicialización de BD (`R-02`):** `README.md` y `sga_backend_jwt/README.md` instruyen ejecutar los scripts SQL de `database/` y luego marcar Alembic con `alembic stamp head`, mientras que `sga_backend_jwt/entrypoint.sh` ejecuta incondicionalmente `alembic upgrade head`.
3. **Estrategia de despliegue (`R-09`):** el diagnóstico `DXC-2026-006` (basado en el estado previo) documenta despliegue en Render + Vercel, pero en `12760d4` se eliminó `vercel.json` y se incorporó un stack completo Docker Compose + Nginx sin actualizar la documentación técnica.
4. **Versión de PostgreSQL (`F-42`):** `README.md` raíz solicita PostgreSQL 14+, mientras `database/README_base_de_datos.md` y `docker-compose.yml` (`postgres:16-alpine`) exigen PostgreSQL 16.
5. **Credenciales de prueba (`F-25`):** las credenciales listadas en `README.md:80-88` no existen en `database/01_esquema/03_seed_data.sql`.

### 13.2 Limitaciones del presente análisis

- **Sin ejecución en tiempo de ejecución (runtime):** por mandato de solo lectura, no se levantaron contenedores Docker, no se iniciaron servidores FastAPI/Vite ni se ejecutaron linters, compiladores o pruebas.
- **Sin consultas de red ni API de GitHub:** no se verificaron reglas de protección de ramas, PRs ni issues en GitHub (`F-46`, `F-47`).
- **Sin auditoría dinámica de dependencias:** no se ejecutaron `pip-audit` ni `npm audit`.

---

## 14. Condiciones de aceptación del paso 0.2

El paso 0.2 de la Fase 0 cuenta con los siguientes criterios verificados en este documento:

- [x] Comparación íntegra de los 49 hallazgos de `AUD-2026-001` (`F-01`…`F-49`) y los 16 hallazgos + 10 fortalezas de `AUD-2026-002` (`R-01`…`R-16`, `S-01`…`S-10`).
- [x] Trazabilidad conservada con identificadores originales sin duplicación.
- [x] Corrección de las clasificaciones de `F-01`, `F-02`, `F-03` (separando `dev` y `main`), `F-07`, `F-14`, `F-24`/`R-08` (separando copias saneadas de archivos versionados) y `R-01`/`R-10`.
- [x] Distinción explícita entre evidencia estática verificada, inferencia probable y comprobación en runtime pendiente.
- [x] Registro documental en `docs/gestion_proyecto/01_auditorias/AUD-2026-003_consolidacion_comparativa_fase0_paso02.md` sin reproducción de secretos.
- [x] Referencia incorporada en `docs/gestion_proyecto/00_indice.md`.

> **Estado del paso 0.2:** documento consolidado y registrado, **pendiente de revisión y aprobación explícita del usuario** para declarar formalmente cerrado el paso 0.2.

---

## 15. Relación con pasos siguientes

Una vez que el usuario apruebe el cierre del paso 0.2, la secuencia prevista en la Fase 0 continúa con:

- **Paso 0.3:** Clasificación formal de evidencias en *verificadas*, *probables* y *no verificadas* (incluyendo los hallazgos históricos `H-01`…`H-14`, `C-01`…`C-15`, `P-01`…`P-12` de los diagnósticos `DXC-2026-001` a `DXC-2026-006`).
- **Paso 0.4:** Consolidación del inventario único maestro de hallazgos y registro de decisiones pendientes (ADRs / backlog priorizado).

*(Ninguno de los pasos 0.3 o 0.4 se desarrolla en este documento).*
