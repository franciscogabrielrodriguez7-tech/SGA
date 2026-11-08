# EVD-2026-002 — Verificación y clasificación de evidencias · Fase 0, paso 0.3

> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git`
> **Fuente de verdad:** `C:\Users\Acer\Documents\Default Project\SGA_repo\SGA`
> **Rama:** `dev`   **Commit (HEAD):** `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c`
> **Fecha de elaboración:** 2026-10-30   **Modo:** solo lectura (clasificación documental)
> **Estado del informe:** registrado en `06_evidencias/` con corrección documental puntual de `C-14`; **pendiente de revisión y aprobación del usuario**
> **Origen:** encargo del paso 0.3 (clasificación de evidencias por OpenCode + verificación y corrección puntual de `C-14`), tras aprobación del paso 0.2

---

## ÍNDICE

1. [Objetivo y alcance](#1-objetivo-y-alcance)
2. [Verificación previa del repositorio](#2-verificación-previa-del-repositorio)
3. [Fuentes consultadas](#3-fuentes-consultadas)
4. [Criterios de clasificación](#4-criterios-de-clasificación)
5. [Matriz A — Hallazgos F-01…F-49](#5-matriz-a--hallazgos-f-01f-49)
6. [Matriz B — Hallazgos R-01…R-16](#6-matriz-b--hallazgos-r-01r-16)
7. [Matriz C — Fortalezas S-01…S-10](#7-matriz-c--fortalezas-s-01s-10)
8. [Matriz D — Históricos H-01…H-14](#8-matriz-d--históricos-h-01h-14)
9. [Matriz E — Configuración C-01…C-15](#9-matriz-e--configuración-c-01c-15)
10. [Matriz F — Decisiones pendientes P-01…P-12](#10-matriz-f--decisiones-pendientes-p-01p-12)
11. [Resumen numérico](#11-resumen-numérico)
12. [Contradicciones detectadas](#12-contradicciones-detectadas)
13. [Dependencias para el paso 0.4](#13-dependencias-para-el-paso-04)
14. [Limitaciones](#14-limitaciones)
15. [Conclusión y estado del paso 0.3](#15-conclusión-y-estado-del-paso-03)
16. [Declaración de operaciones realizadas](#16-declaración-de-operaciones-realizadas)

---

## 1. Objetivo y alcance

Clasificar de forma trazable el nivel de certeza de las afirmaciones técnicas y hallazgos documentados en AUD-2026-001, AUD-2026-002 y AUD-2026-003, más los identificadores históricos `H-01…H-14`, `C-01…C-15` y `P-01…P-12` de los diagnósticos `DXC-2026-001`, `DXC-2026-005` y `DXC-2026-006` (alcance previsto en AUD-2026-003 §15 para el paso 0.3), incorporando la clasificación completa elaborada por OpenCode y la corrección documental puntual del hallazgo `C-14`.

**Alcance:** exclusivamente documental y de solo lectura sobre el árbol `12760d4`. No se ejecutaron pruebas, migraciones, contenedores, instalaciones ni operaciones Git de escritura. No se modificaron auditorías previas, el roadmap ni `AGENTS.md`. No se reprodujeron contraseñas, hashes utilizables, tokens ni secretos (las credenciales se citan solo por ubicación `archivo:línea`).

**Fuera del alcance:** inicio del paso 0.4 (inventario único maestro), saneamiento del hallazgo R-08 en archivos versionados, y cualquier corrección de código o configuración.

**Cobertura:** **116 identificadores individuales** clasificados (`49 F + 16 R + 10 S + 14 H + 15 C + 12 P`), presentados en **115 filas de tabla** en las Matrices A–F. La diferencia aritmética de 1 entre identificadores (`116`) y filas (`115`) se debe a que en la Matriz C los identificadores `S-04 / S-05` comparten una única fila agrupada (9 filas para 10 identificadores `S`), mientras que las referencias cruzadas mostradas en la columna `ID` de otras matrices (como `F-24 / R-08` en la Matriz A, que además mantiene su fila `R-08` en la Matriz B) se contabilizan una sola vez por identificador individual (véase desglose detallado en §11.5).

> **Nota:** este documento conserva íntegramente el análisis original de OpenCode para el paso 0.3 y añade la verificación estática sobre `sga_backend_jwt/app/config/settings.py` y `python-dotenv==1.2.3` para corregir la clasificación de `C-14`. Su presencia dentro de `docs/gestion_proyecto/06_evidencias/` mantiene el estado de `git status --short` en `?? AGENTS.md` y `?? docs/gestion_proyecto/`, sin afectar a ningún archivo trackeado.

---

## 2. Verificación previa del repositorio

Operaciones de solo lectura ejecutadas el 2026-10-30 sobre `SGA_repo/SGA`:

| Campo | Valor verificado | Comando |
|---|---|---|
| Raíz Git | `C:/Users/Acer/Documents/Default Project/SGA_repo/SGA` | `git rev-parse --show-toplevel` |
| Rama actual | `dev` | `git branch --show-current` |
| HEAD | `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` | `git rev-parse HEAD` |
| Último commit | `feat(docker): dockerizar stack completo` (2026-10-20 20:37:19 -0500) | `git log -1` |
| Árbol de trabajo | 0 trackeados modificados; untracked: `?? AGENTS.md`, `?? docs/gestion_proyecto/` | `git status --porcelain` |
| `main` local vs `origin/main` | ahead 26 / behind 37 | `git rev-list --left-right --count main...origin/main` |
| Autores | `gabielrodriguez` 41 · `gabrielrodriguez` 2 | `git shortlog -sn HEAD` |

**Consecuencia metodológica:** HEAD coincide exactamente con el commit auditado en AUD-2026-002 y EVD-2026-001, y el árbol trackeado está limpio. Por tanto, la evidencia estática de las auditorías es aplicable al repositorio actual, lo que permite distinguir con precisión entre **afirmación histórica** (base `14726ad`, AUD-2026-001) y **condición vigente** (base `12760d4`).

---

## 3. Fuentes consultadas

| Documento | Rol |
|---|---|
| `docs/gestion_proyecto/00_indice.md` | Convenciones, estructura y estado documental |
| `docs/gestion_proyecto/01_auditorias/AUD-2026-001_auditoria_inicial_dev_14726ad.md` | Base histórica F-01…F-49 + Anexo I (confirmación de H/C/P) |
| `docs/gestion_proyecto/01_auditorias/AUD-2026-002_auditoria_dev_remota_12760d4.md` | Base vigente R-01…R-16, S-01…S-10 y revalidación de F |
| `docs/gestion_proyecto/01_auditorias/AUD-2026-003_consolidacion_comparativa_fase0_paso02.md` | Consolidación aprobada (paso 0.2); matriz F↔R y correcciones |
| `docs/gestion_proyecto/06_evidencias/EVD-2026-001_verificacion_linea_base_fase01.md` | Identidad de `origin/dev` (2026-10-28 10:59) |
| `C:\Users\Acer\Documents\Default Project\VERIFICACION_DIRECTORIO_PRINCIPAL_FASE_0_2.md` | Refspec estándar, `venv/`/`.env` presentes, divergencia de `main` |
| `C:\Users\Acer\Documents\Default Project\VERIFICACION_FINAL_ORGANIZACION_DOCUMENTAL.md` | Saneamiento de copias DXC; 0 secretos en `gestion_proyecto/` |
| `docs/gestion_proyecto/04_diagnostico/DXC-2026-001_arquitectura.md` §8 | Tabla H-01…H-14 |
| `docs/gestion_proyecto/04_diagnostico/DXC-2026-005_reglas_negocio_rbac.md` §441+ | Tabla P-01…P-26 (alcance referenciado: P-01…P-12) |
| `docs/gestion_proyecto/04_diagnostico/DXC-2026-006_despliegue_configuracion.md` §6 | Tabla C-01…C-15 |
| `sga_backend_jwt/app/config/settings.py` y `sga_backend_jwt/requirements.txt` | Verificación de invocación `load_dotenv()` (L3, L6) y versión declarada `python-dotenv==1.2.3` (L18) para `C-14` |
| `sga_backend_jwt/venv/Lib/site-packages/dotenv/main.py` | Verificación en solo lectura de la implementación instalada de `python-dotenv==1.2.3` (`override: bool = False` en L388-395 y no sobrescritura de `os.environ` en L97-110) |
| Comprobaciones puntuales propias (solo lectura, 2026-10-30) | Revalidación de extremos clave directamente sobre el árbol `12760d4` |

---

## 4. Criterios de clasificación

| Clasificación | Definición aplicada |
|---|---|
| **Verificado** | Existe evidencia concreta suficiente para sostener la afirmación dentro del alcance y momento de la comprobación (estática, documental, Git o de configuración). Cuando la verificación estática demuestra que una sub-afirmación histórica es incorrecta en código (caso `C-14`), el hecho real verificado se registra y la sub-afirmación incorrecta se declara explícitamente **Refutada**. |
| **Probable** | Existe evidencia o razonamiento técnico que respalda la hipótesis, pero falta una comprobación necesaria (normalmente runtime). |
| **No verificado** | No existe evidencia suficiente para afirmar ni descartar la condición (incluye el comportamiento en ejecución real cuando solo se ha inspeccionado el código o la biblioteca). |

La clasificación **no** equivale a severidad, prioridad, estado de resolución ni aprobación de decisión: un hallazgo P0 puede estar verificado por análisis estático y tener pendiente una prueba en ejecución (caso paradigmático: R-01).

---

## 5. Matriz A — Hallazgos F-01…F-49

| ID | Afirmación evaluada | Clasificación | Evidencia y ubicación | Alcance y limitaciones | Verificación adicional |
|---|---|---|---|---|---|
| F-01 | Línea base de la auditoría = `14726ad` | Verificado (histórico) | AUD-001 §2.1; condición actual: HEAD = `12760d4` (verificado 2026-10-30) | Git; marcador actualizado, no defecto | Ninguna |
| F-02 | Clon local single-branch | Verificado (histórico) | AUD-001 §2.1; refspec estándar en `SGA_repo/SGA` (VERIFICACION_DIR §2, DIF-04/05) | Contexto del clon de auditoría; no vigente en el repo principal | Ninguna |
| F-03 | Divergencia local↔remoto en `dev` | Verificado (histórico) y resuelto | AUD-002 §2.1 (merge-base = HEAD); hoy HEAD = `origin/dev` = `12760d4` | La divergencia de `main` (ahead 26/behind 37) es hecho independiente persistente | Gestionar `main` por separado (0.4) |
| F-04 | Autor único / 2 identidades de autor | Verificado | `git shortlog -sn` (2026-10-30): 41 / 2 | Git | Ninguna |
| F-05 | Commits sin convención (`dc8aecd`, `b6457e0`) | Verificado | Historial (AUD-002 §2.2) | Git | Ninguna |
| F-06 | Estructura monorepo (145 archivos) | Verificado (histórico; ampliado a 178) | AUD-001 §2.2; +33 archivos en `12760d4` | Estático/Git | Ninguna |
| F-07 | Ausencia total de artefactos de infraestructura | Verificado (histórico); hoy **modificado** | AUD-001 §2.2; hoy existen `docker-compose.yml`, 2 `Dockerfile`, `entrypoint.sh` (leídos 2026-10-30) | Estático; funcionamiento del stack sin confirmar en runtime (ver R-02) | `docker compose config`/arranque (autorizado) |
| F-08 | Auditoría `docs/01..06` sin trackear | Verificado | AUD-002 §4.1; hoy `?? docs/gestion_proyecto/` + `?? AGENTS.md` | Git/documental; commit pendiente de autorización | Commit autorizado |
| F-09 | Rutas de documentación de proceso vacías | Verificado | Hoy: 6 archivos de 0 B en `docs/` | Estático; relación con F-39 | Decisión rellenar/eliminar |
| F-10 | Dependencias pinneadas sin auditoría CVE | Verificado | `requirements.txt` (25 pins); sin Dependabot/`pip-audit` | Documental; sin auditoría dinámica | `pip-audit`/`npm audit` (autorizado) |
| F-11 | `alembic` ausente en `requirements.txt` | Verificado (histórico) y **resuelto** | Hoy `requirements.txt:1` → `alembic==1.13.3` | Estático | Ninguna |
| F-12 | Sin herramientas de calidad backend | Verificado | Hoy `git ls-files` sin `pyproject`/ruff/mypy/pytest | Estático | Ninguna |
| F-13 | Rangos `^` en `package.json` | Verificado; mitigado por `npm ci` (S-07) | `package.json:12-27`; `sga_frontend_jwt/Dockerfile` | Estático | Estandarizar `npm ci` en CI |
| F-14 | Entornos no instalados; lint/build sin ejecutar | Verificado como condición del directorio de auditoría; **no vigente** en `SGA_repo/SGA` (posee `venv/` y `.env`, VERIFICACION_DIR §2 DIF-06) | AUD-001 §2.3 | Sub-afirmación "estado real de lint/build" = **no verificada** (nunca ejecutados) | Ejecución de lint/build (autorizada) |
| F-15 | Cero pruebas automatizadas | Verificado | AUD-002 §11.6; hoy sin archivos test/spec/conftest | Estático | Ninguna |
| F-16 | Sin script `test` | Verificado | `package.json:6-11` (solo dev/build/lint/preview) | Estático | Ninguna |
| F-17 | Demos SQL manuales con `ROLLBACK` | Verificado | `database/06_demos_endpoints/` (árbol sin cambios) | Estático; no ejecutados | Conversión a tests |
| F-18 | `oxlint` con configuración mínima | Verificado | `.oxlintrc.json` sin cambios | Estático | Ninguna |
| F-19 | TypeScript sin `strict` | Verificado | `tsconfig.app.json` sin cambios | Estático | Ninguna |
| F-20 | Build con typecheck no ejecutado en CI | Verificado | Corre en el `Dockerfile` multi-stage; sin CI | Estático/config | Ninguna |
| F-21 | Sin CI/CD | Verificado | Hoy: sin `.github/`; único YAML = `docker-compose.yml` | Estático | Ninguna |
| F-22 | Sin pre-commit ni formateador | Verificado | Ausentes en el árbol | Estático | Ninguna |
| F-23 | CORS `"*"` + `allow_credentials=True` | Verificado (histórico) y **resuelto** | AUD-001; hoy `settings.py:30-39` (`CORS_ORIGINS` por env) y `main.py:62` | Estático/config | Ninguna |
| **F-24 / R-08** | Credencial de prueba en texto plano y hash bcrypt compartido en 11 usuarios del seed | Verificado **persistente** en archivos versionados | Ubicación verificada 2026-10-30 (sin reproducir valores): `database/01_esquema/03_seed_data.sql` L3/L6/L14; `database/03_documentacion/INDICE.md` L26 y **L120 con patrón sensible confirmado**; `database/README_base_de_datos.md` L46/L75/L76 | Estático; copias DXC en `gestion_proyecto/` ya saneadas | Saneamiento P0 en archivos versionados (autorización propia) |
| F-25 | README raíz con credenciales que no existen en el seed | Verificado | `README.md:80-88` sin cambios (AUD-002 §4.1) | Documental | Sincronizar README con el seed |
| F-26 | `str(error)` devuelto en respuestas HTTP 500 | Verificado (magnitud aproximada) | Recuento propio 2026-10-30: 62 ocurrencias en `sga_backend_jwt/app/**/*.py` (auditorías citan ~68; diferencia de método) | Estático | Ninguna |
| F-27 | Sin rate limiting en `POST /auth/login` | Verificado | Grep sin coincidencias (AUD-002; árbol idéntico al auditado) | Estático (ausencia) | Ninguna |
| F-28 / R-14 | JWT en `localStorage`; decodificación de `exp` en cliente (UX) | Verificado | `client.ts:29-41`; `AuthContext.tsx`; `src/utils/jwt.ts` | Estático | Ninguna |
| F-29 | Rol en JWT sin revalidación; TTL 480 min | Verificado | Hoy `settings.py:26` (480); `auth_dependency.py:58-61` | Estático | Ninguna |
| F-30 / R-12 | Sin cabeceras de seguridad completas ni límites de request | Verificado; **parcialmente mitigado** | Nginx añade 3 cabeceras (S-08); faltan CSP/HSTS; FastAPI sin límites de body/timeout | Config | Añadir cabeceras y límites |
| F-31 / R-03 | `/docs` expuesto por defecto; hoy acoplado al healthcheck | Verificado | Hoy `main.py` sin `docs_url`; `docker-compose.yml:80` → `curl -f http://localhost:8000/docs` | Config | `GET /health` |
| F-32 | Migración baseline destructiva (`drop_table` en `upgrade()`) | Verificado (histórico) y **resuelto** | Hoy `alembic/versions/0001_initial_schema.py`: docstring "solo `op.create_*`"; `op.drop_*` solo dentro de `downgrade()` (L266+) | Estático | Guardarraíl de migraciones en CI |
| F-33 / C-15 | `alembic/env.py` sin importar `AuditoriaSistema` | Verificado (histórico) y **resuelto** | Hoy `alembic/env.py:24-27` → `import app.models`; `app/models/__init__.py` centraliza los modelos | Estático | Ninguna |
| **F-34** | Interpolación f-string en SQL (`INTERVAL '{dias} days'`) | **Verificado — revalidado el 2026-10-30** (antes "no revalidado") | Hoy `sga_backend_jwt/app/controllers/alquiler_controller.py:429`: `text(f"INTERVAL '{dias} days'")` persiste | Estático; riesgo acotado por coerción `int` de FastAPI (AUD-001); sin ejecución | Bind param `:dias` |
| F-35 | Filtros `ilike` con curingas sin escapar | Verificado | Hoy `alquiler_controller.py:404` → `ilike(f"%{barrio}%")`; 8 ocurrencias en controllers | Estático | Escapar `%`/`_` |
| F-36 | Sin logging estructurado | Verificado | Grep `logging` sin coincidencias (AUD-002 §11.6) | Estático (ausencia) | Ninguna |
| F-37 | Controles positivos (sin secretos cloud/PEM, `.env` ignorado, bcrypt) | Verificado | Scans AUD-001 §8.6 y AUD-002 §11.6; `.dockerignore`/`.gitignore` (S-04/S-05) | Estático | Tests de regresión |
| F-38 / S-10 | RBAC aplicado en 37 de 38 endpoints | Verificado | Hoy: 38 decoradores `@router`; 43 usos de `requiere_rol` | Estático | Test de matriz RBAC |
| F-39 | 6 documentos trackeados de 0 bytes | Verificado | Hoy: 6 archivos de 0 B confirmados en `docs/` | Estático | Decisión rellenar/eliminar |
| F-40 / R-15 | Documentación técnica no versionada y ausente del remoto | Verificado | AUD-002 §7.2; hoy los DXC viven untracked en `docs/gestion_proyecto/04_diagnostico/` | Git/documental; estado del remoto apoyado en EVD-2026-001 (2026-10-28), no re-consultado el 2026-10-30 | Commit autorizado |
| F-41 | README raíz desactualizado (acceso inicial, Docker) | Verificado | Sin cambios desde la auditoría 1 | Documental | Actualizar README |
| F-42 | Conflicto de versión PostgreSQL 14+ vs 16 | Verificado; **parcialmente mitigado** | `docker-compose.yml` fija `postgres:16-alpine`; README raíz pide 14+ | Config/documental | Unificar documentación |
| F-43 / H-04 | `INDICE.md` con esquema antiguo (`es_recogida`) | Verificado | Hoy `database/03_documentacion/INDICE.md:91` contiene `es_recogida` | Estático | Regenerar índice |
| F-44 / H-07 | `es_recogida` huérfano en el frontend | Verificado | Hoy 7 ocurrencias en `sga_frontend_jwt/src/` (auditorías citan 6 — diferencia de método: líneas vs archivos) | Estático | Contract tests |
| F-45 | Sin documentos de gobernanza | Verificado | Ausentes CONTRIBUTING/CODEOWNERS/SECURITY/CHANGELOG/ADRs; `AGENTS.md` existe solo como untracked local | Git | Elaborar gobernanza |
| **F-46** | Protección de ramas y checks obligatorios en GitHub | **No verificado** | Metadatos exclusivos de la plataforma GitHub; sin API ni red en esta sesión | Fuera del alcance local | `gh api` o verificación del administrador (autorizada) |
| **F-47** | Uso real de PRs, issues, etiquetas y milestones | **No verificado** | Ídem; el historial solo muestra 1 merge, sin evidencia de PR | Fuera del alcance local | `gh api` (autorizada) |
| F-48 | Complejidad concentrada en controllers | Verificado; mitigación parcial | `alquiler_controller.py` >429 líneas; componentización y ORM reducen superficie | Estático | Capa de servicios testeable |
| F-49 | Auditoría de BD por triggers + `set_audit_context` | Verificado | `database/` sin cambios; `sga_backend_jwt/app/utils/audit_context.py` | Estático | Tests de trigger |

---

## 6. Matriz B — Hallazgos R-01…R-16

| ID | Afirmación evaluada | Clasificación | Evidencia y ubicación | Alcance y limitaciones | Verificación adicional |
|---|---|---|---|---|---|
| **R-01** | `GET /usuarios[/{id}]` exponen el hash bcrypt vía `_orm_to_dict` | **Verificado (análisis estático de flujo de datos)**; confirmación en runtime pendiente | Verificado 2026-10-30: `app/utils/response.py:14-29` copia todo `__dict__` sin `_` y evalúa todas las `@property`; `:53-54` detecta ORM vía `__tablename__`; `app/routes/usuario_routes.py:96` (`data=usuarios`) y `:115` (`data=usuario`); `app/models/usuario.py:22,51` (`contrasena_usuario`); el controller ya no usa allowlist (sin `SELECT_USUARIO_CAMPOS`; solo `return usuario` en `:140,:171`) | Estático; sin levantar la API | Prueba en ejecución + test de regresión "ninguna respuesta contiene `contrasena_*`" (autorizadas) |
| **R-02** | `alembic upgrade head` automático en cada arranque choca con la BD creada por SQL | **Probable** | Verificado 2026-10-30: `entrypoint.sh:8` (`set -e`) y `:44` (`alembic upgrade head`) vs READMEs (`SQL scripts` + `alembic stamp head`) | Inferencia estática; no ejecutado | Prueba de arranque contra BD inicializada por SQL (autorizada) |
| R-03 | Healthcheck del backend depende de `/docs` | Verificado | Hoy `docker-compose.yml:80`; `GET /health` no existe | Config | Crear `GET /health` |
| R-04 | Puertos `"5432:5432"` y `"8000:8000"` publicados en `0.0.0.0` contra comentarios "solo localhost" | Verificado | Hoy `docker-compose.yml:47-48, 76-77` sin prefijo `127.0.0.1` | Config | Prefijo `127.0.0.1:` o eliminar `ports` |
| R-05 | Contenedores ejecutándose como root (sin `USER`) | Verificado | AUD-002 §5 (Dockerfiles sin `USER`); árbol idéntico al auditado | Config | Usuario no privilegiado en ambos |
| R-06 | `uvicorn --workers 2` + APScheduler en proceso duplica el job de las 00:05 | Verificado (configuración); impacto en runtime **probable** | Hoy `entrypoint.sh:52`; scheduler en startup de `main.py` | Config; idempotencia no probada | 1 worker o cron externo |
| R-07 | Reducción de 45 a 38 endpoints sin versionado de contrato | Verificado | Hoy: 38 decoradores `@router` (recuento propio) | Estático/Git | OpenAPI versionado + registro de breaking changes |
| R-08 | Credencial en texto plano en 4 archivos versionados | Verificado | Ver fila conjunta F-24/R-08 | Estático | Saneamiento P0 |
| R-09 | Deriva de la estrategia de despliegue (Vercel retirado vs docs Render/Vercel) | Verificado | Hoy: `vercel.json` ausente del árbol; DXC-2026-006 con banner de obsolescencia | Git/documental | Reescribir capítulo de despliegue sobre Docker |
| R-10 | `_orm_to_dict` serializa sin allowlist cualquier ORM (causa raíz de R-01) | Verificado | Hoy `response.py:14-29` (incluye todas las `@property` vía `dir(type(obj))`) | Estático | Allowlist por modelo o `response_model` de Pydantic |
| R-11 | Regex frágiles para parsear `DATABASE_URL` en `entrypoint.sh` | Verificado | Hoy `entrypoint.sh:24-29` | Código | `urlparse` de SQLAlchemy o `pg_isready` |
| R-12 | Nginx sin CSP/HSTS | Verificado | `nginx.conf:70-75` (3 cabeceras básicas) | Config | Añadir cabeceras (requiere TLS para HSTS) |
| R-13 | `docker-compose` sin directivas de endurecimiento | Verificado | `docker-compose.yml` sin `security_opt`/`read_only`/límites/`user` | Config | Endurecer compose |
| R-14 | Decodificación de JWT sin verificar firma en cliente (solo UX) | Verificado | `src/utils/jwt.ts:1-31`; `AuthContext.tsx:37-56` | Estático; el backend valida la firma | Documentar límite UX |
| R-15 | Docs vacíos y auditoría ausentes del remoto | Verificado | AUD-002 (`git ls-tree -r -l origin/dev docs/`); hoy 0 B confirmado | Git; remoto vía EVD-2026-001 | Commit autorizado |
| R-16 | Merge cruzado `deployment→dev` (`63cb22c`) + ida/vuelta de configuración Vercel | Verificado | Historial de commits | Git; intención no comprobable | Definir flujo de ramas |

---

## 7. Matriz C — Fortalezas S-01…S-10

| ID | Afirmación | Clasificación | Evidencia | Alcance y limitaciones |
|---|---|---|---|---|
| S-01 | CORS parametrizado y sin comodín | Verificado | `settings.py:30-39` (hoy); `.env.example:14-22`; `.env.docker.example:47` | Estático/config |
| S-02 | Migración inicial limpia y reversible | Verificado | `0001_initial_schema.py` (hoy: `create_*` en upgrade; `drop_*` solo en downgrade) | Estático |
| S-03 | Login con respuesta genérica (anti-enumeración) | Verificado | `auth_routes.py:27-33` + controller con `return None` (AUD-002 §3) | Estático |
| S-04 / S-05 | `.dockerignore` excluye `.env`; plantilla `.env.docker.example` con `<CAMBIAR>` | Verificado | `sga_backend_jwt/.dockerignore:15-17`; `.gitignore:225-226` | Estático (2 identificadores agrupados en 1 fila) |
| S-06 | Compose con healthchecks, red aislada y volúmenes nombrados | Verificado | `docker-compose.yml:37-42, 79-80, 120-121` (hoy) | Config; salud real sin ejecutar |
| S-07 | Frontend multi-stage con `npm ci` | Verificado | `sga_frontend_jwt/Dockerfile:25,35` | Estático |
| S-08 | Nginx: `server_tokens off` + `X-Frame-Options`, `nosniff`, `Referrer-Policy` | Verificado | `nginx.conf:44-49, 70-75` | Config |
| S-09 | Exclusión de `PUT` coherente backend↔frontend | Verificado | `client.ts:64`; sin usos de `"PUT"` en `src/` | Estático |
| S-10 | RBAC intacto tras la refactorización (37/38) | Verificado | Recuento propio: 38 `@router` | Estático |

---

## 8. Matriz D — Históricos H-01…H-14

| ID | Afirmación | Clasificación | Evidencia y ubicación | Nota de vigencia | Verificación adicional |
|---|---|---|---|---|---|
| H-01 / C-05 | CORS `"*"` con `allow_credentials=True` | Verificado (@`14726ad`, confirmado AUD-001 Anexo I) | `app/main.py:59-69` (histórico) | **Resuelta** en `12760d4` (F-23/S-01, verificado 2026-10-30) | Ninguna |
| H-02 | Rol en JWT sin revalidación | Verificado | AUD-001 Anexo I; hoy `settings.py:26` | Vigente (= F-29) | Ninguna |
| H-03 | `04_plantillas.sql` y `05_consultas.sql` desalineados del esquema vigente | **No verificado** | No revalidado por AUD-001/002 ni en 2026-10-30 | — | Lectura de ambos SQL contra `01_tablas.sql` |
| H-04 | `INDICE.md` describe un esquema anterior | Verificado | Hoy `INDICE.md:91` con `es_recogida` | Vigente (= F-43) | Ninguna |
| H-05 | README con credenciales que no coinciden con el seed | Verificado | AUD-001 Anexo I; sin cambios (`README.md:80-88`) | Vigente (= F-25) | Ninguna |
| H-06 | `HistorialAlquiler` incompatible con la respuesta real de `GET /alquileres/{id}/historial` | **No verificado** | No revalidado; posible cambio por R-14 y el nuevo `src/utils/historialAlquiler.ts` | — | Lectura de `src/interfaces/Alquiler.ts` vs contrato actual |
| H-07 | `es_recogida` en tipos frontend, inexistente en BD | Verificado | AUD-001 Anexo I; hoy 7 ocurrencias en `src/` | Vigente (= F-44) | Ninguna |
| H-08 / C-03 | Baseline de Alembic destructivo | Verificado (@`14726ad`) | `d4f74f3d4896_baseline_schema.py:21-60` (histórico) | **Resuelta** (F-32/S-02, verificado 2026-10-30) | Ninguna |
| H-09 | Vistas del dashboard no expuestas por ningún endpoint | **No verificado** | No revalidado | — | Lectura de `06_vistas_dashboard.sql` vs rutas |
| H-10 | 6 documentos vacíos en `docs/` | Verificado | Hoy 6×0 B | Vigente (= F-39) | Ninguna |
| H-11 | Sin suite de pruebas automatizadas | Verificado | Hoy sin archivos test/spec | Vigente (= F-15) | Ninguna |
| H-12 | `UsuarioCreatePayload` desalineado con exigencias del backend | **No verificado** | No revalidado | — | Lectura de `src/interfaces/Usuario.ts` vs `usuario_schema.py` |
| H-13 | `alembic` no declarado en `requirements.txt` | Verificado (@`14726ad`) | AUD-001 | **Resuelta** (F-11, verificado 2026-10-30) | Ninguna |
| H-14 | `app/models/__init__.py` vacío | Verificado (@`14726ad`) | AUD-001 | **Resuelta** (F-33: `__init__.py` centraliza modelos) | Ninguna |

---

## 9. Matriz E — Configuración C-01…C-15

| ID | Afirmación | Clasificación | Evidencia y ubicación | Nota de vigencia | Verificación adicional |
|---|---|---|---|---|---|
| C-01 | No existe `render.yaml` | Verificado | AUD-002 §7.2; hoy ausente del árbol | Histórico; bajo Docker queda pendiente la decisión de destino (R-09) | Decisión de despliegue (ADR) |
| C-02 | No existe `Procfile` ni `Dockerfile` | Verificado (@`14726ad`) | AUD-001 | **Modificada**: hoy existen Dockerfiles (F-07) | Ninguna |
| C-03 | Baseline de Alembic destructiva | Verificado (@`14726ad`) | = H-08 | Resuelta (F-32) | Ninguna |
| C-04 | `alembic.ini` con URL de ejemplo inofensiva | **No verificado** | No revalidado | — | Lectura de `alembic.ini` y `env.py` |
| C-05 | CORS `"*"` con credenciales | Verificado (@`14726ad`) | = H-01 | Resuelta (F-23) | Ninguna |
| C-06 | Scheduler corre por worker (N ejecuciones del job) | Verificado (configuración) | = R-06 (`entrypoint.sh:52`) | Vigente; impacto runtime probable | Prueba de arranque |
| C-07 | `VITE_API_URL` fijada en build time | **No verificado** | No revalidada | — | Lectura de `vite.config.ts`/`Dockerfile` frontend |
| C-08 | Sin health check dedicado | Verificado | R-03 confirma que `GET /health` no existe | Vigente | Crear `GET /health` |
| C-09 | Sin `.github/workflows` | Verificado | = F-21 (hoy) | Vigente | Ninguna |
| C-10 | Rangos `^` impiden instalaciones reproducibles | Verificado | = F-13 | Vigente; mitigado por `npm ci` en Docker | Estandarizar en CI |
| C-11 | `tsconfig` sin `strict` y alias `@/*` sin resolver en Vite | Verificado | = F-19 | Vigente | Activar `strict` incremental |
| C-12 | Sin política de rotación de credenciales | Verificado (ausencia) | Sin documentos de gobernanza (F-45); sin registro de política | Vigente | Definir rotación (P-01/P-02) |
| C-13 | Hibernación del plan gratuito de Render | **No verificado** | Entorno externo a la infraestructura actual (Docker) | Probablemente histórica; confirmar destino de despliegue | Verificar en el entorno desplegado (autorizada) |
| **C-14** | Afirmación histórica (`DXC-2026-006` L456): *«`python-dotenv` carga `.env` sin filtrar el entorno / En producción, si se cuela un `.env` en la imagen, sobrescribe variables del panel»* | **Verificado en código (`override=False`) · Afirmación histórica de sobrescritura: Refutada · Despliegue real: No verificado en ejecución** *(reclasificado desde «Probable»)* | Verificado 2026-10-30: `sga_backend_jwt/app/config/settings.py:3,6` invoca `load_dotenv()` sin `override=True`; `sga_backend_jwt/requirements.txt:18` declara `python-dotenv==1.2.3`; `sga_backend_jwt/venv/Lib/site-packages/dotenv/main.py:388-395` fija `override: bool = False` por defecto y `:104-108` (`if k in os.environ and not self.override: continue`) preserva las variables ya definidas en `os.environ`. Además, `sga_backend_jwt/.dockerignore:15-17` excluye `.env` y `.env.*` (`S-04`). | La afirmación de sobrescritura de variables ya definidas en el entorno queda **refutada** en el código actual (un `.env` solo cargaría variables ausentes en `os.environ`). El comportamiento en despliegue real no se declara probado por revisión estática de la biblioteca. | Verificación del entorno de despliegue real en ejecución (cuando se autorice) |
| C-15 | `env.py` no importa `AuditoriaSistema` | Verificado (@`14726ad`) | = H-14 | Resuelta (F-33) | Ninguna |

### 9.1 Registro histórico y desglose técnico de `C-14`

En el diagnóstico histórico `DXC-2026-006_despliegue_configuracion.md` (§6, L456) se registró:

- **Hallazgo original (`C-14`):** *«`python-dotenv` carga `.env` sin filtrar el entorno»*.
- **Impacto afirmado originalmente:** *«En producción, si se cuela un `.env` en la imagen, sobrescribe variables del panel»*.
- **Observación inicial de OpenCode (paso 0.3):** detectó la contradicción entre dicha afirmación y la llamada `load_dotenv()` sin parámetros en `settings.py`, dejándola provisionalmente como «Probable (con contradicción registrada)» pendiente de confirmar la versión/parametrización instalada.

Tras verificar en modo solo lectura la versión declarada e instalada de `python-dotenv`, se separa `C-14` en cuatro elementos trazables:

| Componente evaluado de `C-14` | Estado / Clasificación | Evidencia técnica verificada |
|---|---|---|
| **1. Hecho en código (`settings.py`)** | **Verificado** | `sga_backend_jwt/app/config/settings.py:3,6` importa `from dotenv import load_dotenv` e invoca `load_dotenv()` de forma incondicional y sin pasar `override=True`. Adicionalmente, `sga_backend_jwt/.dockerignore:15-17` excluye `.env` y `.env.*` del contexto de construcción Docker (`S-04`). |
| **2. Comportamiento predeterminado de la biblioteca (`python-dotenv==1.2.3`)** | **Verificado** | Declarada en `sga_backend_jwt/requirements.txt:18` (`python-dotenv==1.2.3`) e inspeccionada en `sga_backend_jwt/venv/Lib/site-packages/dotenv/main.py`: `load_dotenv` (L388-395) define `override: bool = False` por omisión y `DotEnv.set_as_environment_variables` (L97-110) ejecuta `if k in os.environ and not self.override: continue`. En consecuencia, **las variables ya definidas en el entorno del proceso (`os.environ`) no son sobrescritas**; un archivo `.env` solo poblaría variables que no existan previamente en `os.environ`. |
| **3. Afirmación histórica de sobrescritura (*«sobrescribe variables del panel»*)** | **Refutada** *(no «Probable»)* | La evidencia del código fuente de `settings.py` y de `python-dotenv==1.2.3` refuta que `load_dotenv()` sobrescriba variables ya inyectadas en el entorno. Se retira la etiqueta «Probable» porque la evidencia demuestra que esa sub-afirmación es incorrecta. |
| **4. Comportamiento del despliegue real** | **No verificado en ejecución** | La revisión estática de `settings.py`, `.dockerignore` y `python-dotenv` no equivale a una prueba en tiempo de ejecución ni confirma cómo está configurado o desplegado un entorno productivo real (no se construyeron imágenes ni se iniciaron contenedores). |

---

## 10. Matriz F — Decisiones pendientes P-01…P-12

| ID | Afirmación | Clasificación | Evidencia y ubicación | Alcance y limitaciones | Verificación adicional |
|---|---|---|---|---|---|
| P-01 | Sin política de contraseñas; el backend solo exige `min_length=4` | Verificado | Hoy `app/schemas/usuario_schema.py:51,87` → `min_length=4`; sin documentación de política (F-45) | Estático/documental | Definir política (decisión) |
| P-02 | Sin rotación de `JWT_SECRET_KEY`; rol no revalidado | Verificado | `settings.py:26` (hoy) + F-29; secretos solo por variable de entorno | Estático/documental | Definir rotación (decisión) |
| P-03 | Sin blacklist/revocación de tokens en servidor | Verificado (ausencia) | Grep `blacklist|revoc` = 0 en `app/` (2026-10-30) | Estático | Definir sesión multi-dispositivo |
| P-04 | Reapertura de alquileres solo por consola SQL | Verificado (ausencia en API) | Grep `reabrir` = 0 en `app/` (2026-10-30) | Estático (solo backend `app/`) | Definir procedimiento con trazabilidad |
| P-05 | El logístico no ve el historial de auditoría del alquiler | Verificado | Hoy `app/routes/alquiler_routes.py:243`: `GET /{id}/historial` = `ADMIN_O_FACTURACION` | Estático | Decisión de alcance (decisión) |
| P-06 | El logístico puede cambiar estados del alquiler (incl. `cancelado`) | Verificado | Hoy `alquiler_routes.py:191`: `PATCH /{id}/estado` = `STAFF_INTERNO` | Estático; la irreversibilidad es regla de BD (triggers) | Decisión de alcance (decisión) |
| P-07 | Incoherencia de inventario (mismo dato vía otra ruta) | **No verificado** | Los endpoints `inventario` citados fueron eliminados por R-07: la condición original está **modificada/sin objeto parcial** | Reevaluar contra el catálogo vigente (38 endpoints) | Reevaluación tras R-07 |
| P-08 | El resumen semanal de gastos incluye entregas/recogidas | **No verificado** | No revalidado | — | Lectura de la lógica de `gastos` |
| P-09 | Depósito sin estado (retenido/devuelto) ni fecha de devolución | **No verificado** | No revalidado | — | Lectura de esquema/modelo |
| P-10 | Sin facturación ni comprobante | **No verificado** | No revalidado | — | Lectura de esquema/API |
| P-11 | Sin descuentos, recargos ni IVA auditables | **No verificado** | No revalidado | — | Lectura de esquema |
| P-12 | Renovación manual sin recargos por retraso | **No verificado** | No revalidado; parcialmente modificado (R-07 eliminó el GET de renovaciones; `POST /renovaciones` persiste) | — | Reevaluación de vigencia |

---

## 11. Resumen numérico

### 11.1 Clasificación total (sobre los 116 identificadores individuales)

| Clasificación | Cantidad (tras corrección de C-14) | Conteo previo (OpenCode) | Detalle por serie (`49 F + 16 R + 10 S + 14 H + 15 C + 12 P = 116`) |
|---|---|---|---|
| **Verificado** *(incluye `C-14`: hecho en código verificado y afirmación histórica de sobrescritura refutada)* | **100** *(99 verificados + 1 `C-14` verificado en código / refutado en sobrescritura)* | 99 | `F: 47 · R: 15 · S: 10 · H: 10 · C: 12 (11 verificados + C-14 corregido; su despliegue real sigue no verificado en ejecución) · P: 6` |
| **Probable** | **1** | 2 | `R-02` (arranque Alembic vs BD SQL; se retira `C-14` de «Probable» al quedar refutada la sobrescritura en `python-dotenv==1.2.3`) |
| **No verificado** | **15** | 15 | `F-46, F-47 · H-03, H-06, H-09, H-12 · C-04, C-07, C-13 · P-07, P-08, P-09, P-10, P-11, P-12` *(más la dimensión de ejecución real en despliegue de `C-14`, `R-01`, `R-02`, `R-06` y `F-14`)* |
| **Total** | **116 identificadores** | **116 identificadores** | Presentados en **115 filas** de tabla (véase §11.5) |

### 11.2 Evidencias suficientes e insuficientes (nivel estático/documental)

| Concepto | Cantidad (corregida) | % (sobre 116) | Referencia previa (OpenCode) |
|---|---|---|---|
| Evidencias estáticas suficientes (`99 Verificados` + `1 C-14` verificado en código / refutado en sobrescritura) | **100** | **86,2 %** | 99 (85,3 %) |
| Evidencias estáticas insuficientes (`1 Probable` [`R-02`] + `15 No verificados`) | **16** | **13,8 %** | 17 (14,7 %) |

### 11.3 Revalidaciones y correcciones incorporadas en esta sesión

| ID | Estado previo (AUD-2026-003 / DXC) | Estado actual (EVD-2026-002) | Evidencia |
|---|---|---|---|
| F-34 | No revalidado | **Verificado** (2026-10-30) | `alquiler_controller.py:429`: `text(f"INTERVAL '{dias} days'")` |
| P-05, P-06 | No revalidados en auditorías | **Verificado** (2026-10-30) | `alquiler_routes.py:243` y `:191` |
| P-03, P-04 | No revalidados en auditorías | **Verificado (ausencia)** (2026-10-30) | Grep sin coincidencias en `app/` |
| R-01 (extremos) | Verificado estáticamente | Reconfirmado sobre árbol actual | `response.py:14-29,53-54`; `usuario_routes.py:96,115`; `models/usuario.py:22,51` |
| **C-14** | Afirmación en DXC-2026-006 de sobrescritura por `load_dotenv()` / «Probable (con contradicción)» en borrador inicial | **Verificado en código (`override=False`) · Afirmación histórica de sobrescritura: Refutada · Despliegue real: No verificado en ejecución** | `settings.py:3,6` (`load_dotenv()` sin argumentos); `requirements.txt:18` (`python-dotenv==1.2.3`); `venv/Lib/site-packages/dotenv/main.py:97-110, 388-395` (`override=False` preserva `os.environ`) |

### 11.4 Riesgos P0 abiertos con evidencia clasificada

| IDs | Condición | Clasificación |
|---|---|---|
| R-01 / R-10 | Exposición de hashes bcrypt en `GET /usuarios[/{id}]` | Verificado (estático); runtime pendiente |
| R-04 | Puertos PostgreSQL y API en `0.0.0.0` | Verificado (configuración) |
| F-24 / R-08 | Credencial en texto plano en archivos versionados | Verificado (persistente) |
| F-27 | Sin rate limiting en login | Verificado |
| F-12 / F-15 / F-21 | Cero pruebas, cero calidad backend, cero CI | Verificado |
| F-08 / F-39 / F-40 / R-15 | Docs vacíos y documentación no versionada | Verificado |
| R-02 | Conflicto Alembic vs inicialización SQL | **Probable** (runtime pendiente) |
| F-46 | Protección de ramas no comprobada | **No verificado** |

### 11.5 Consistencia de recuentos: identificadores individuales (116) vs filas de tabla (115)

Para evitar ambigüedades entre el conteo por **identificador individual** (`116`) y el conteo por **filas de tabla** (`115`), se documenta la estructura exacta de las seis matrices:

| Matriz | Serie de identificadores | Identificadores individuales | Filas físicas en la tabla | Explicación de agrupaciones y referencias cruzadas |
|---|---|---|---|---|
| **Matriz A** (§5) | `F-01`…`F-49` | **49** | **49** | Cada `F-01`…`F-49` ocupa una fila. Nueve celdas `ID` muestran además su correspondencia con otra serie (`F-24 / R-08`, `F-28 / R-14`, `F-30 / R-12`, `F-31 / R-03`, `F-33 / C-15`, `F-38 / S-10`, `F-40 / R-15`, `F-43 / H-04`, `F-44 / H-07`), pero esos segundos identificadores tienen también su fila propia en las Matrices B, C, D o E y no se duplican en el conteo de la serie `F`. |
| **Matriz B** (§6) | `R-01`…`R-16` | **16** | **16** | Cada `R-01`…`R-16` ocupa una fila propia (incluida la fila `R-08`, que remite al detalle conjunto de `F-24 / R-08`). |
| **Matriz C** (§7) | `S-01`…`S-10` | **10** | **9** | Los identificadores **`S-04 / S-05`** están agrupados en una sola fila física (`10 identificadores` en `9 filas`), originando la diferencia de `-1` fila en el total global (`116` vs `115`). |
| **Matriz D** (§8) | `H-01`…`H-14` | **14** | **14** | Cada `H-01`…`H-14` ocupa una fila propia (las etiquetas `H-01 / C-05` y `H-08 / C-03` indican correspondencia con `C-05` y `C-03`, que tienen fila propia en la Matriz E). |
| **Matriz E** (§9) | `C-01`…`C-15` | **15** | **15** | Cada `C-01`…`C-15` ocupa una fila propia. |
| **Matriz F** (§10) | `P-01`…`P-12` | **12** | **12** | Cada `P-01`…`P-12` ocupa una fila propia. |
| **Total** | **6 series** | **116 identificadores** | **115 filas** | **Unidad de conteo de los resúmenes (§11.1 y §11.2):** los `116` identificadores individuales (`49 + 16 + 10 + 14 + 15 + 12 = 116`). |

---

## 12. Contradicciones detectadas

Registradas sin resolverlas mediante suposiciones (con excepción de `C-14`, cuya contradicción documental quedó resuelta mediante evidencia estática en §9.1):

1. **R-04** — comentarios "solo localhost" en `docker-compose.yml` vs sintaxis de puertos que publica en `0.0.0.0`.
2. **R-02** — READMEs instruyen `SQL scripts + alembic stamp head` vs `entrypoint.sh` que ejecuta `alembic upgrade head` incondicionalmente.
3. **R-09** — documentación de despliegue Render/Vercel vs stack real Docker Compose + Nginx.
4. **F-42** — README raíz "PostgreSQL 14+" vs `postgres:16-alpine` en compose y README de BD.
5. **F-25** — credenciales listadas en `README.md:80-88` que no existen en el seed.
6. **C-14 (detectada por OpenCode y resuelta documentalmente en esta sesión)** — la afirmación histórica de `DXC-2026-006` (L456) de que `python-dotenv` sobrescribe variables del panel chocaba con `load_dotenv()` en `settings.py:6`. La inspección de `requirements.txt:18` y `venv/Lib/site-packages/dotenv/main.py:97-110, 388-395` (`python-dotenv==1.2.3`) confirmó que `override=False` es el valor predeterminado y no sobrescribe variables ya presentes en `os.environ`, quedando **refutada** la afirmación histórica de sobrescritura y manteniéndose el despliegue real como **no verificado en ejecución** (§9.1).
7. **Deriva de citación de líneas** entre AUD-2026-002 y el árbol actual pese a HEAD idéntico (p. ej. `entrypoint.sh`: `set -e` citado L6 vs actual L8; `alembic upgrade` L47-49 vs L44; regex L14-31 vs L24-29; `docker-compose` puertos L83-84 vs L76-77; `usuario_routes` L82/L113 vs L96/L115; seed `:7` vs L6/L3). Diferencias de método de conteo, no de condición; conviene corregir las citas en el inventario del paso 0.4.
8. **Recuentos aproximados** — `str(error)`: ~68 (auditorías) vs 62 (recuento propio); `es_recogida`: 6 (auditorías) vs 7 líneas (2026-10-30). Diferencia de método (archivos vs líneas/patrón), sin efecto sobre la condición.
9. **Alcance de P** — `DXC-2026-005` contiene P-01…P-26, pero las auditorías y el plan solo referencian P-01…P-12; el alcance de P-13…P-26 debe definirse en el paso 0.4.
10. **Vigencia parcial de P-05/P-07/P-12** — citan endpoints afectados por R-07 (inventario/renovaciones eliminados): no asumir supresión del problema; reevaluar.
11. **EVD-2026-001 (contextual)** — su snapshot de `git status` (8 archivos untracked) es histórico, previo a la reubicación; hoy los untracked de la sesión verificada son `AGENTS.md` y `docs/gestion_proyecto/` (que incluye este informe). No es contradicción: debe contextualizarse en el paso 0.4.

---

## 13. Dependencias para el paso 0.4

1. **Autorizaciones externas:** `gh api` para F-46/F-47; ejecución en runtime para confirmar R-01 y R-02 (el entorno ejecutable existe en `SGA_repo/SGA`: `venv/`, `.env`).
2. **Decisiones de revalidación:** H-03, H-06, H-09, H-12, C-04, C-07, C-13 y P-08…P-12 requieren lecturas puntuales; P-07 requiere reevaluación contra el catálogo vigente.
3. **Definición de alcance:** P-13…P-26 (presentes en DXC-2026-005, fuera de lo referenciado).
4. **Reglas de deduplicación ya mapeadas** para el inventario maestro: F-24/R-08 · F-28/R-14 · F-05/R-16 · F-07/R-09 · F-31/R-03 · F-39/F-08/F-40/R-15 · F-30/R-12/S-08 · F-38/S-10 · F-13/S-07 · F-23/S-01 · F-32/F-33/S-02 · H-01/C-05 · H-08/C-03 · H-14/C-15 · F-43/H-04 · F-44/H-07 · F-11/H-13 · F-15/H-11 · F-39/H-10 · F-29/H-02 · F-25/H-05.
5. **Trazabilidad:** `docs/gestion_proyecto/` sigue sin commitear; el commit requiere autorización y afecta la propia línea base documental del paso 0.4.
6. **Registro de cambios de estado:** F-34 (no revalidado → verificado), P-03…P-06 (no revalidados → verificados), C-14 (contradicción resuelta: `override=False` verificado en código y en `python-dotenv==1.2.3`, afirmación histórica de sobrescritura refutada, despliegue real no verificado en ejecución).

---

## 14. Limitaciones

- **Sin ejecución en runtime:** no se levantaron contenedores, servidores, migraciones, linters ni pruebas (mandato de solo lectura).
- **Sin red:** `origin/dev` no se re-consultó el 2026-10-30; la identidad del remoto se apoya en EVD-2026-001 (2026-10-28 10:59), con HEAD local verificado el 2026-10-30.
- **Sin acceso a la API de GitHub** (F-46/F-47) y **sin auditoría dinámica de dependencias** (`pip-audit`/`npm audit`).
- Las clasificaciones de H/C/P se apoyan en las confirmaciones de AUD-2026-001 Anexo I, en AUD-2026-002, en los banners de vigencia de los DXC y en comprobaciones puntuales de 2026-10-30; **no constituyen reauditoría completa** de los diagnósticos.

---

## 15. Conclusión y estado del paso 0.3

**La evidencia disponible permite completar documentalmente el paso 0.3.** Los 116 identificadores fueron clasificados con fuente, alcance y fecha/línea base, sobre un HEAD coincidente con la base auditada (`12760d4`) y un árbol trackeado limpio, incluyendo la resolución documental de la contradicción en `C-14`. **No existen impedimentos bloqueantes**: los 16 elementos sin evidencia estática suficiente (`1 Probable` [`R-02`] y `15 No verificados`), así como las comprobaciones de ejecución en despliegue real, quedan legítimamente clasificados con su verificación adicional especificada.

> **Estado del paso 0.3:** informe registrado como `EVD-2026-002` en `docs/gestion_proyecto/06_evidencias/` y referenciado en `docs/gestion_proyecto/00_indice.md`. **No se marca como completado automáticamente**: queda pendiente la revisión y aprobación explícita del usuario. El paso 0.4 (inventario único maestro de hallazgos y decisiones pendientes) **no ha sido iniciado**.

---

## 16. Declaración de operaciones realizadas

- **Operaciones Git:** exclusivamente de solo lectura (`rev-parse`, `branch --show-current`, `status --porcelain`, `status --short`, `log`, `shortlog`, `ls-files`, `rev-list --left-right --count`). Sin `fetch`, `checkout`, `merge`, `commit`, `push` ni cambios de rama. Sin operaciones Git de escritura.
- **Sistema:** sin instalación de dependencias, sin ejecución de migraciones, sin contenedores, sin servidores, sin modificaciones de código, archivos `.env` o base de datos.
- **Archivos:** actualización de este informe (`docs/gestion_proyecto/06_evidencias/EVD-2026-002_verificacion_clasificacion_evidencias_fase0_paso03.md`) y registro de su referencia en `docs/gestion_proyecto/00_indice.md` por autorización explícita del usuario. Ningún otro archivo fue creado, modificado ni eliminado; las auditorías previas, los diagnósticos, `AGENTS.md` y el roadmap permanecen intactos.
- **Seguridad:** ninguna credencial, hash utilizable, token ni secreto fue reproducido; las detecciones se citan únicamente por `archivo:línea` (hallazgo R-08).

*Fin del informe — Fase 0, paso 0.3. Espera revisión y aprobación del usuario.*
