# AUD-2026-004 — Inventario original · Fase 0, paso 0.4 (entrega histórica de OpenCode)

> **Origen:** entrega íntegra de OpenCode correspondiente al paso 0.4 (inventario único de hallazgos y decisiones pendientes), conservada como entregable histórico a autorización expresa del usuario.
> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git` · **Fuente de verdad:** `C:\Users\Acer\Documents\Default Project\SGA_repo\SGA`
> **Rama:** `dev` · **Commit (HEAD) de la línea base analizada:** `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c`
> **Fecha de la entrega:** 2026-10-30 · **Modo:** solo lectura (análisis; sin ejecución, sin escritura)
> **Advertencia de integridad:** el cuerpo de este documento reproduce la entrega **tal como se entregó en chat**, incluidos los errores que fueron corregidos posteriormente (cantidad de elementos declarada "92", recuentos globales "110/2/12", C-14 clasificado como "probable", propuesta de registrar EVD-2026-002 en `00_indice.md`). **No corregir retroactivamente**: las correcciones se aplican en `EVD-2026-003` conforme a `AUD-2026-005` y `AUD-2026-006`.

---

# SGA — FASE 0, PASO 0.4: INVENTARIO ÚNICO DE HALLAZGOS Y DECISIONES PENDIENTES

> **Modo:** solo lectura. **Fecha:** 2026-10-30. **Estado:** entregado en chat, pendiente de revisión/aprobación del usuario. **No se marca el paso como completado.**

---

## A. RESUMEN EJECUTIVO

### Estado del repositorio (verificado hoy)

| Campo | Valor |
|---|---|
| Raíz Git | `C:/Users/Acer/Documents/Default Project/SGA_repo/SGA` |
| Rama | `dev` — HEAD `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` |
| Árbol | 0 trackeados modificados; untracked: `AGENTS.md`, `docs/gestion_proyecto/` (incluye `EVD-2026-002`, creado a solicitud del usuario en 0.3) |
| Línea base | Idéntica a la verificada en el paso 0.3 → la evidencia estática de las auditorías sigue siendo aplicable |

### Fuentes consultadas

`00_indice.md`; AUD-2026-001/002/003; EVD-2026-001/002; DXC-2026-001…006; `01_tablas.sql`, `02_funciones_y_triggers.sql`, `04_plantillas.sql`; `entrypoint.sh`, `docker-compose.yml`, `Dockerfile`s, `nginx.conf`, `alembic/env.py`, `alembic.ini`; rutas/controllers/esquemas backend; `vite.config.ts`, `Dockerfile` frontend, interfaces y utilidades del frontend. Más ~20 comprobaciones puntuales nuevas (grep/lectura) ejecutadas hoy para P-08, P-10…P-26, H-03, H-06, H-09, H-12, C-04, C-07, P-07.

### Alcance real

- **130 identificadores originales**: 116 del paso 0.3 (F-49 + R-16 + S-10 + H-14 + C-15 + P-12) + **14 nuevos P-13…P-26** incorporados como ampliación de alcance de este paso.
- **92 elementos consolidados** (I-001…I-092) tras aplicar deduplicación solo con evidencia de equivalencia.
- Revalidaciones que **cambian el estado** respecto al paso 0.3 (registradas, sin alterar EVD-2026-002): P-08, P-09, P-10, P-11, P-12, P-07 (refutado), H-03, H-06 (refutado), H-09, H-12, C-04, C-07 pasan de *no verificado* a **verificado/refutado**.
- Resultado global de certeza: **110 verificados · 2 probables (R-02, C-14) · 12 no verificados / pendientes de determinar** (F-14, F-46, F-47, C-13 y las sub-verificaciones de runtime).

---

## B. INVENTARIO ÚNICO (matrices consolidadas por naturaleza)

Columnas: **ID** · IDs originales · Nombre · Naturaleza · Certeza · Vigencia · Prioridad (original → propuesta) · Evidencia · Impacto · Acción pendiente · Deps. · Observaciones.

### B-1. RIESGOS DE SEGURIDAD

| ID | Orig. | Nombre | Cert. | Vigencia | Prioridad (orig. → prop.) | Evidencia | Impacto | Acción pendiente | Deps. | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| **I-001** | R-01, R-10 | Exposición de hash bcrypt en `GET /usuarios[/{id}]` (causa raíz: `_orm_to_dict` sin allowlist) | Verificado (estático) | Vigente | P0 → **P0** | `response.py:14-29,53-54`; `usuario_routes.py:96,115`; `models/usuario.py:22,51` | Credenciales expuestas; riesgo de cracking | Prueba en runtime + allowlist/`response_model` | — | Runtime pendiente no altera la prioridad: el flujo estático está probado |
| **I-002** | F-24, R-08 | Credencial de prueba en texto plano + hash bcrypt compartido en 11 usuarios, en archivos versionados | Verificado | Vigente | P0 → **P0** | `03_seed_data.sql:3,6,14`; `INDICE.md:26,120`; `README_base_de_datos.md:46,75,76` (solo ubicación) | Acceso con credenciales conocidas | Saneamiento P0 + rotación | — | Secretos no reproducidos aquí |
| **I-003** | F-27 | Login sin rate limiting | Verificado (ausencia) | Vigente | P0 → **P0** | Grep sin coincidencias | Fuerza bruta / credential stuffing | Rate limiting + lockout | — | Complementa I-002 |
| **I-004** | R-04 | Puertos BD y API publicados en `0.0.0.0` vs comentarios "solo localhost" | Verificado | Vigente | P1 → **P0** | `docker-compose.yml:47-48,76-77` | Superficie de ataque en red | Prefijo `127.0.0.1:` o quitar `ports` | I-002 | Contradicción documental registrada en 0.3 |
| **I-005** | R-05 | Contenedores como root (sin `USER`) | Verificado | Vigente | P1 → **P1** | Dockerfiles sin `USER` | Escalada de privilegios | Usuario no privilegiado | — | — |
| **I-006** | R-13 | Compose sin endurecimiento (`security_opt`, `read_only`, límites, `user`) | Verificado | Vigente | P1 → **P2** | `docker-compose.yml` sin directivas | Contención de incidentes | Endurecer compose | I-005 | Relacionado, no equivalente, a I-005 |
| **I-007** | F-30, R-12 (+S-08) | Cabeceras de seguridad incompletas (faltan CSP/HSTS) y FastAPI sin límites de body/timeout | Verificado | **Parcialmente mitigado** | P1 → **P2** | `nginx.conf:70-75` (3 cabeceras); FastAPI sin límites | XSS/clickjacking; abuso de recursos | Añadir CSP/HSTS (HSTS exige TLS) + límites | — | S-08 (I-076) es la mitigación parcial, no se fusiona |
| **I-008** | F-26 | `str(error)` devuelto en respuestas HTTP 500 (~62 ocurrencias) | Verificado | Vigente | P1 → **P1** | Recuento propio 2026-10-30 en `app/**/*.py` | Fuga de detalles internos | Manejador de excepciones con respuesta genérica | — | Auditorías citan ~68 (diferencia de método) |
| **I-009** | F-29, H-02 | Rol persistido en JWT sin revalidación; TTL 480 min | Verificado | Vigente | P1 → **P1** | `settings.py:26`; `auth_dependency.py:58-61` | Retraso en revocación de permisos | Revalidación de rol o TTL menor + rotación (I-045) | I-045, I-046 | — |
| **I-010** | F-28, R-14 | JWT en `localStorage` + decodificación de `exp`/rol en cliente (solo UX) | Verificado | Vigente | P2 → **P2** | `client.ts:29-41`; `AuthContext.tsx`; `src/utils/jwt.ts` | Robo de token vía XSS | HttpOnly cookies o gestión equivalente | — | Backend valida firma: límite UX documentado |

### B-2. DEFECTOS TÉCNICOS VIGENTES

| ID | Orig. | Nombre | Cert. | Vigencia | Prioridad (orig. → prop.) | Evidencia | Impacto | Acción pendiente | Deps. | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| **I-011** | F-34 | Interpolación f-string en SQL (`INTERVAL '{dias} days'`) | Verificado (revalidado 0.3/0.4) | Vigente | P1 → **P1** | `alquiler_controller.py:429` | Inyección SQL (acotada por coerción `int`) | Bind param `:dias` | — | Riesgo acotado pero patrón inseguro |
| **I-012** | F-35 | Curingas `%`/`_` sin escapar en búsquedas `ilike` (8 ocurrencias) | Verificado | Vigente | P2 → **P2** | `alquiler_controller.py:404` y controllers | Denegación de servicio / resultados erróneos | Escapar curingas | — | — |
| **I-013** | F-31, R-03, C-08 | Healthcheck depende de `/docs`; no existe `GET /health` | Verificado | Vigente | P1 → **P1** | `docker-compose.yml:80`; `main.py` sin `docs_url` especial | Reinicios del orquestador ante caídas reales del API | Crear `GET /health` | — | Fusiona equivalencia ya mapeada |
| **I-014** | R-06, C-06 | `uvicorn --workers 2` + APScheduler duplica el job de las 00:05 | Verificado (config); impacto probable | Vigente | P1 → **P1** | `entrypoint.sh:52`; scheduler en `main.py` | Doble ejecución de proceso programado | 1 worker o cron externo | I-016 | Idempotencia sin probar |
| **I-015** | R-11 | Regex frágil para parsear `DATABASE_URL` | Verificado | Vigente | P2 → **P2** | `entrypoint.sh:24-29` | Fallo de arranque con URLs no soportadas | `urlparse` o `pg_isready` | I-016 | — |
| **I-016** | R-02 | `alembic upgrade head` automático vs BD inicializada por SQL | **Probable** | Vigente | P1 → **P1** | `entrypoint.sh:8,44` vs READMEs (`stamp head`) | Arranque fallido; riesgo de migración no deseada | Prueba de arranque; decisión de flujo | — | Requiere runtime para confirmar |
| **I-017** | C-14 | `load_dotenv()` sin `override`: la afirmación de sobrescritura contradice el default de la librería | **Probable** | **Pendiente de determinar** | P2 → **P2** | `settings.py:3,6` | Variables de panel preservadas o no, según versión/parametrización | Verificar versión instalada/parametrización | — | Contradicción 0.3 preservada; corrección aprobada respetada |
| **I-018** | P-08 | El resumen semanal de gastos suma `ENTREGA`/`RECOGIDA` junto a `GASTO` | **Verificado (hoy)** | Vigente | Medio → **Medio** | `logistica_alquiler_controller.py:101-113` (SUM sin filtro `tipo_movimiento`); constraint `01_tablas.sql:236` | Dato financiero agregado incorrecto | Decisión: filtrar o exponer desglose (I-044 dominio) | I-051, I-052 | Ascendido de *no verificado* (0.3) a verificado |
| **I-019** | P-15 | Tarifa entrega/recogida hardcodeada en el cliente (`15000`) | **Verificado (hoy)** | Vigente | Alto → **Alto** | `CrearAlquiler.tsx:195-197` | Decisión de negocio no parametrizable; precio manipulable en cliente | Parámetro en BD/config; validación server-side | I-052 | Sin respaldo en BD |
| **I-020** | P-22 | Umbral "por vencer" hardcodeado y duplicado (`2` días) | **Verificado (hoy)** | Vigente | Bajo → **P3** | `alquiler_routes.py:75`; `vencimiento.ts:7,43` | Cambio requiere reimplementación en dos capas | Parámetro configurable | I-056 | — |
| **I-021** | C-07 | `VITE_API_URL` fijada en build time | **Verificado (hoy)** | Vigente (**mitigado** por proxy same-origin) | Medio → **P3** | `Dockerfile` frontend:31-34 (ARG/ENV); compose pasa `/api/sga` | Reconstruir imagen para cambiar destino | Aceptar (patrón proxy) o runtime config | — | Ascendido de *no verificado* |
| **I-022** | H-12 | `UsuarioCreatePayload` declara `contrasena_usuario` opcional/nullable; el backend la exige (`min_length=4`) | **Verificado (hoy)** | Vigente | — → **P2** | `Usuario.ts:32`; `usuario_schema.py:51` | Errores 422 en runtime; contrato confuso | Alinear tipo frontend con el requisito | — | Ascendido de *no verificado* |

### B-3. DEUDA TÉCNICA

| ID | Orig. | Nombre | Cert. | Vigencia | Prioridad (orig. → prop.) | Evidencia | Impacto | Acción pendiente | Deps. | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| **I-023** | F-15, F-16, H-11 | Cero pruebas automatizadas (y sin script `test`) | Verificado | Vigente | P0 histórico → **P1** | Sin archivos test/spec/conftest; `package.json:6-11` | Regresiones no detectadas | Framework + suite mínima prioritaria | I-025 | **No es P0 automático**: prioridad propuesta P1 por riesgo de regresión, no por "falta de pruebas" en abstracto |
| **I-024** | F-12 | Sin herramientas de calidad backend (ruff/mypy/pytest ausentes) | Verificado | Vigente | P1 → **P2** | `git ls-files` sin `pyproject` | Deuda creciente | Añadir tooling | I-023 | — |
| **I-025** | F-21, C-09, F-20 | Sin CI/CD (typecheck corre solo en el Dockerfile, no en CI) | Verificado | Vigente | P1 → **P1** | Sin `.github/`; único YAML = compose | Regresiones silenciosas | Pipeline mínimo (lint+typecheck+test) | I-023 | Equivalencia mapeada en 0.3 |
| **I-026** | F-13, C-10 (+S-07) | Rangos `^` en `package.json` impiden instalaciones reproducibles | Verificado | **Parcialmente mitigado** | P3 → **P3** | `package.json:12-27`; mitigado por `npm ci` en Docker | Deriva de dependencias fuera de Docker | Estandarizar `npm ci` | I-025 | S-07 = mitigación parcial, no equivalencia |
| **I-027** | F-18 | `oxlint` con configuración mínima | Verificado | Vigente | P3 → **P3** | `.oxlintrc.json` | Detección superficial | Reglas estrictas | — | — |
| **I-028** | F-19, C-11 | TypeScript sin `strict`; alias `@/*` sin resolver en Vite | Verificado | Vigente | P2 → **P2** | `tsconfig.app.json`; `vite.config.ts` sin `resolve.alias` | Bugs de tipos no detectados | `strict` incremental + alias | — | C-11 incluye componente alias verificada hoy |
| **I-029** | F-22 | Sin pre-commit ni formateador | Verificado | Vigente | P3 → **P3** | Ausentes en el árbol | Inconsistencia de estilo | Hooks + formateador | I-025 | — |
| **I-030** | F-36 | Sin logging estructurado | Verificado | Vigente | P2 → **P2** | Grep `logging` = 0 | Incapacidad de diagnóstico en operación | Logging estructurado | I-061 | Bloquea runbooks |
| **I-031** | F-10 | Dependencias pinneadas sin auditoría CVE | Verificado | Vigente | P2 → **P2** | `requirements.txt` (25 pins); sin Dependabot/`pip-audit` | Vulnerabilidades no detectadas | `pip-audit`/`npm audit` + Dependabot | — | Requiere autorización de ejecución |
| **I-032** | F-17 | Demos SQL manuales con `ROLLBACK` como único "test" | Verificado | Vigente | P3 → **P3** | `database/06_demos_endpoints/` | Cobertura ilusoria | Convertir a tests automatizados | I-023 | — |
| **I-033** | F-48 | Complejidad concentrada en controllers (`alquiler_controller.py` >429 líneas) | Verificado | Vigente | P2 → **P2** | Análisis estático | Difícil testeabilidad | Capa de servicios | I-023 | Mitigación parcial: componentización actual |
| **I-034** | H-09 | Vistas del dashboard (`06_vistas_dashboard.sql`) no expuestas por ningún endpoint | **Verificado (hoy)** | Vigente | — → **P3** | Grep `vw_dashboard` = 0 en rutas/controllers | Código SQL muerto o dashboard pendiente | Decisión: exponer o eliminar | I-044 | Ascendido de *no verificado* |

### B-4. INCONSISTENCIAS DOCUMENTALES

| ID | Orig. | Nombre | Cert. | Vigencia | Prioridad (orig. → prop.) | Evidencia | Impacto | Acción pendiente | Deps. | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| **I-035** | F-08, F-09, F-39, F-40, R-15, H-10 | Documentación de proceso vacía (6×0 B) y auditorías/DXC sin versionar en el remoto | Verificado | Vigente | P1 → **P1** | 6 archivos 0 B; `docs/gestion_proyecto/` untracked | Pérdida de trazabilidad; línea base documental frágil | Commit autorizado + decisión rellenar/eliminar | Autorización | 6 IDs, una misma condición documental |
| **I-036** | F-41 | README raíz desactualizado (acceso inicial, Docker) | Verificado | Vigente | P2 → **P2** | `README.md` sin cambios | Onboarding incorrecto | Actualizar README | I-035 | — |
| **I-037** | F-42 | Conflicto PostgreSQL "14+" (README) vs `postgres:16-alpine` | Verificado | **Parcialmente mitigado** | P2 → **P2** | `docker-compose.yml`; README | Despliegues divergentes | Unificar documentación | I-036 | — |
| **I-038** | F-43, H-04 | `INDICE.md` describe esquema antiguo (`es_recogida`) | Verificado | Vigente | P2 → **P2** | `INDICE.md:91` | Referencia errónea para developers | Regenerar índice | I-040 | — |
| **I-039** | F-44, H-07 | `es_recogida` huérfano en el frontend (inexistente en BD) | Verificado | Vigente | P2 → **P2** | 7 ocurrencias en `src/` | Expectativa rota frontend↔BD | Eliminar del frontend o añadir a BD + contract tests | — | 6 (auditorías) vs 7 (líneas): diferencia de método |
| **I-040** | H-03 | `04_plantillas.sql`/`05_consultas.sql` referencian `estado_usuario`, inexistente en el esquema vigente | **Verificado (hoy)** | Vigente | — → **P2** | `04_plantillas.sql:80,110`; nota `01_tablas.sql:361-364` confirma la ausencia de la columna | Plantillas/consultas fallan al ejecutarse | Regenerar o eliminar plantillas | I-038 | Ascendido de *no verificado* |
| **I-041** | F-25, H-05 | README lista credenciales que no existen en el seed | Verificado | Vigente | P1 → **P1** | `README.md:80-88` | Usuarios prueban credenciales inexistentes; confusión operativa | Sincronizar README con seed | I-002 | Contradicción registrada en 0.3 |
| **I-042** | F-45 | Sin gobernanza (CONTRIBUTING/CODEOWNERS/SECURITY/CHANGELOG/ADRs) | Verificado | Vigente | P2 → **P2** | Ausentes; `AGENTS.md` solo local | Proceso informal no escalable | Elaborar gobernanza | I-035 | — |
| **I-043** | F-07, R-09, C-01, C-02 | Deriva de la estrategia de despliegue: docs Render/Vercel vs stack real Docker Compose | Verificado | Vigente (docs); **histórico resuelto** (infra: hoy existen Dockerfiles/compose) | P1 → **P1** | `vercel.json` ausente; banner DXC-006; compose existente | Despliegue guiado por docs erróneos | Reescribir capítulo de despliegue (ADR) | I-035 | Desglose: sub-claims resueltos (F-07/C-02) y vigente (R-09/C-01) |

### B-5. DECISIONES PENDIENTES (todas requieren validación del usuario/negocio)

| ID | Orig. | Nombre | Cert. | Vigencia | Prioridad (orig. → prop.) | Evidencia | Impacto | Decisión requerida | Deps. | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| **I-044** | P-01 | Política de contraseñas (longitud real, complejidad, expiración, restablecimiento) | Verificado (hueco) | Vigente | Alto → **Alto** | `usuario_schema.py:51,87` (`min_length=4`); seed con contraseña compartida | Control de acceso débil | Definir política | I-002, I-045 | — |
| **I-045** | P-02, C-12 | Rotación de `JWT_SECRET_KEY` y política de rotación de credenciales | Verificado (hueco) | Vigente | — → **Alto** | `settings.py:26`; sin documentos de política (F-45) | Tokens imposibles de invalidar masamente | Definir rotación y periodicidad | I-009, I-046 | C-12 fusionado por mismo dominio de decisión |
| **I-046** | P-03 | Revocación/blacklist de tokens en servidor (multi-dispositivo) | Verificado (ausencia) | Vigente | — → **Medio** | Grep `blacklist|revoc` = 0 | Sesiones activas tras logout/baja | Definir modelo de sesión | I-045 | — |
| **I-047** | P-04 | Reapertura de alquileres solo por consola SQL | Verificado (ausencia en API) | Vigente | — → **Medio** | Grep `reabrir` = 0 en `app/` | Operación sin trazabilidad | Definir procedimiento con auditoría | — | — |
| **I-048** | P-05 | Rol logístico sin acceso al historial de auditoría del alquiler | Verificado | Vigente | — → **Medio** | `alquiler_routes.py:243` (`ADMIN_O_FACTURACION`) | Operación ciega para logística | Ampliar alcance o mantener | — | RBAC actual correcto; la decisión es de negocio |
| **I-049** | P-06 | Rol logístico puede cambiar estados (incl. `cancelado`) | Verificado | Vigente | — → **Medio** | `alquiler_routes.py:191` (`STAFF_INTERNO`) | Estados críticos modificables | Definir alcance por estado | — | Irreversibilidad garantizada por triggers |
| **I-050** | P-09 | Depósito: sin estado (retenido/devuelto) ni fecha de devolución | **Verificado (hoy)** | Vigente | Medio → **Medio** | `01_tablas.sql:115,146-147` (NUMERIC, CHECK ≥0, sin columnas de estado/fecha) | Depósito no conciliable | Definir modelo y reglas | I-052 | Ascendido de *no verificado* |
| **I-051** | P-10 | Sin facturación ni comprobante (aunque existe el rol `encargado_facturacion`) | **Verificado (hoy)** | Vigente | Alto → **Alto** | Sin tablas/endpoints de factura (grep: solo rol y comentarios); esquema sin entidad fiscal | El core del negocio no emite documento fiscal | Definir alcance fiscal | I-052 | Coherencia nominal rol↔funcionalidad pendiente |
| **I-052** | P-11 | Sin descuentos, recargos ni IVA auditables (ajuste manual en `precio_alquiler`) | **Verificado (hoy)** | Vigente | Alto → **Alto** | Sin campos/tablas; comentarios en `alquiler_controller.py:173`, `detalle_alquiler_controller.py:50` | Imposibilidad de auditar ajustes de precio | Definir modelo de ajustes | I-051 | — |
| **I-053** | P-12 | Renovación manual sin recargos por retraso | **Verificado (hoy)** | Vigente | Medio → **Medio** | `POST /renovaciones` (`alquiler_routes.py:258`); sin lógica de recargo | Ingreso por mora no capturado | Definir política de recargos | I-052 | Condición modificada por R-07 pero persistente |
| **I-054** | P-13 | Sin control de inventario físico (conteo cíclico, merma, mantenimiento) | **Verificado (hoy)** | Vigente | Alto → **Alto** | `01_tablas.sql:74-75,95-98` (solo `stock_total`/`stock_alquilado`) | Inventario no auditable | Definir reglas de inventario | — | Ampliación 0.4 |
| **I-055** | P-14 | Sin días hábiles/festivos para vencimientos (solo días calendario, `America/Bogota`) | **Verificado (hoy)** | Vigente | Medio → **Medio** | 6 usos de `America/Bogota`; grep festivos/hábiles = solo falsos positivos ("habilitado") | Vencimientos en días no hábiles | Definir calendario laboral | I-020 | Ampliación 0.4 |
| **I-056** | P-16 | `DELETE` de producto con stock en obra prohibido por trigger; falta flujo alternativo de baja | **Verificado (hoy)** | Vigente | Medio → **Medio** | `02_funciones_y_triggers.sql:84,216` (BEFORE DELETE) | Imposibilidad funcional de dar de baja | Definir baja lógica/traslado/autorización | — | Ampliación 0.4 |
| **I-057** | P-17 | Sin retención/purga/partición de `auditoria_sistema` | **Verificado (hoy)** | Vigente | Medio → **Medio** | Grep `retencion|purga|partition` = 0; tabla crece indefinidamente (`:275`) | Crecimiento y degradación futura | Definir ciclo de vida | I-030 | Ampliación 0.4 |
| **I-058** | P-18 | Sin bloqueo de fila ni reservas de stock (carreras entre creaciones simultáneas) | **Verificado (hoy)** | Vigente | Medio → **Medio** | Grep `FOR UPDATE` = 0 | Error 400 genérico al segundo usuario | Definir política de reintento/UX | I-054 | BD protege por trigger, pero sin UX definida |
| **I-059** | P-19 | Sin trazabilidad de acciones denegadas en el frontend | **Verificado (hoy)** | Vigente | Bajo → **P3** | Grep `intento|denegado|denied` = 0 en `src/` | Sin telemetría de intentos | Definir si se registra | — | Ampliación 0.4 |
| **I-060** | R-07, P-20 | Sin OpenAPI versionado ni política de deprecación tras la reducción 45→38 endpoints | Verificado | Vigente | Medio → **Medio** | `git ls-files openapi` = vacío; 38 decoradores `@router` | Contrato inestable para consumidores | Definir versionado + registro de breaking changes | I-025 | Equivalencia R-07↔P-20 por idéntica acción pendiente |
| **I-061** | P-21 | Sin runbook ni procedimiento de escalamiento de incidentes | Verificado | Vigente | Medio → **Medio** | `git ls-files runbook` = vacío | Recuperación lenta ante incidentes | Redactar runbooks | I-030, I-042 | — |
| **I-062** | P-23 | `id_alquiler` es SERIAL técnico, no número de contrato comercial | **Verificado (hoy)** | Vigente | Medio → **Medio** | `01_tablas.sql:109` | Sin documento contractual numerado | Definir esquema de numeración | I-051 | Ampliación 0.4 |
| **I-063** | P-24 | Sin dimensión multiempresa/multi-sucursal | **Verificado (hoy)** | Vigente | Medio → **Medio** | Sin tablas de empresa/sucursal en `01_tablas.sql` | Limita crecimiento | Definir modelo de sedes | I-064 | Ampliación 0.4 |
| **I-064** | P-25 | `barrio` como `VARCHAR(100)` libre sin catálogo | **Verificado (hoy)** | Vigente | Medio → **Medio** | `01_tablas.sql:113` | Búsquedas/reportes degradados | Definir catálogo/normalización | I-063, I-012 | Ampliación 0.4 |
| **I-065** | P-26 | `tipo_documento` enum fijo sin reglas por tipo (NIT/empresas, IVA, extranjeros) | **Verificado (hoy)** | Vigente | Bajo → **P3** | `01_tablas.sql:32,49-51` | Reglas fiscales no soportadas | Definir reglas por documento | I-052 | Ampliación 0.4 |

### B-6. VERIFICACIONES PENDIENTES (sin evidencia suficiente aún)

| ID | Orig. | Nombre | Cert. | Vigencia | Prioridad prop. | Verificación requerida | Limitación |
|---|---|---|---|---|---|---|---|
| **I-066** | F-46 | Protección de ramas y checks obligatorios en GitHub | **No verificado** | Pendiente de determinar | P1 | `gh api` o confirmación del administrador | Metadatos de plataforma; sin red/API |
| **I-067** | F-47 | Uso real de PRs, issues, etiquetas, milestones | **No verificado** | Pendiente de determinar | P2 | `gh api` | Ídem |
| **I-068** | F-14 (sub-afirmación) | Estado real de lint/build (nunca ejecutados) | **No verificado** | Pendiente de determinar | P2 | Ejecución de lint/build (autorizada) | La parte histórica del hallazgo sí está verificada y no vigente en `SGA_repo/SGA` |
| **I-069** | C-13 | Hibernación del plan gratuito de Render | **No verificado** | **Pendiente de determinar** (probablemente histórico bajo Docker) | P3 | Verificación en el entorno desplegado cuando se decida destino (I-043) | Entorno externo inexistente hoy |

Además, **verificaciones de runtime asociadas a items vigentes**: confirmación en ejecución de I-001 (hash expuesto), I-016 (arranque Alembic vs BD SQL) e idempotencia de I-014. No generan items propios: son acciones dentro de esos items.

### B-7. FORTALEZAS Y CONTROLES EXISTENTES (no se fusionan con los defectos que mitigan)

| ID | Orig. | Fortaleza | Cert. | Evidencia | Relación |
|---|---|---|---|---|---|
| **I-070** | S-01 (+F-23, H-01, C-05 **resueltos**) | CORS parametrizado por env, sin comodín | Verificado | `settings.py:30-39`; `.env.example:14-22` | Resuelve el histórico H-01/C-05 |
| **I-071** | S-02 (+F-32, H-08, C-03 **resueltos**) | Migración inicial limpia y reversible (`create_*` en upgrade, `drop_*` solo en downgrade) | Verificado | `0001_initial_schema.py` | Resuelve baseline destructiva |
| **I-072** | S-03 | Login con respuesta genérica (anti-enumeración) | Verificado | `auth_routes.py:27-33` | — |
| **I-073** | S-04, S-05 | `.dockerignore`/`.gitignore` excluyen `.env`; plantilla con `<CAMBIAR>` | Verificado | `.dockerignore:15-17`; `.gitignore:225-226` | — |
| **I-074** | S-06 | Compose con healthchecks, red aislada y volúmenes nombrados | Verificado (config) | `docker-compose.yml:37-42,79-80,120-121` | Salud real sin ejecutar |
| **I-075** | S-07 | Frontend multi-stage con `npm ci` | Verificado | `Dockerfile` frontend:25,35 | Mitiga parcialmente I-026 |
| **I-076** | S-08 | Nginx: `server_tokens off` + 3 cabeceras básicas | Verificado | `nginx.conf:44-49,70-75` | Mitiga parcialmente I-007 |
| **I-077** | S-09 | Exclusión de `PUT` coherente backend↔frontend | Verificado | `client.ts:64` | — |
| **I-078** | S-10, F-38 | RBAC intacto: 38 rutas, 43 usos de `requiere_rol` (37/38 con control) | Verificado | Recuento propio hoy | El 1/38 restante documentado en auditorías |
| **I-079** | F-49 | Auditoría BD por triggers + `set_audit_context` | Verificado | `database/`; `audit_context.py` | Sustenta I-047 (trazabilidad futura) |
| **I-080** | F-37 | Controles positivos: sin secretos cloud/PEM, `.env` ignorado, bcrypt | Verificado | Scans AUD-001/002 | Regresión a proteger con tests |

### B-8. HISTÓRICOS, RESUELTOS, REFUTADOS Y DE CONTEXTO

| ID | Orig. | Condición | Cert. | Vigencia | Evidencia/Nota |
|---|---|---|---|---|---|
| **I-081** | F-01 | Línea base de la auditoría = `14726ad` | Verificado | **Histórico** (marcador) | Hoy HEAD `12760d4` |
| **I-082** | F-02 | Clon local single-branch de auditoría | Verificado | **Histórico** (contexto) | Refspec estándar verificada |
| **I-083** | F-03 | Divergencia local↔remoto en `dev` | Verificado | **Resuelto** | Hoy HEAD = `origin/dev`; la divergencia de `main` (26/37) es hecho independiente |
| **I-084** | F-04 | Autor único con dos identidades (41/2 commits) | Verificado | Vigente (hecho Git) | `git shortlog` |
| **I-085** | F-05, R-16 | Commits sin convención + merge cruzado `deployment→dev` | Verificado | Vigente | Historial; intención no comprobable → definir flujo de ramas |
| **I-086** | F-06 | Estructura monorepo (145 → 178 archivos) | Verificado | Vigente (contexto) | Condición descriptiva, sin acción |
| **I-087** | F-11, H-13 | `alembic` ausente de `requirements.txt` | Verificado | **Resuelto** | `requirements.txt:1` (`alembic==1.13.3`) |
| **I-088** | F-33, H-14, C-15 | `env.py` sin importar modelos / `__init__.py` vacío | Verificado | **Resuelto** | `env.py:24-27` importa `app.models` |
| **I-089** | P-07 | Incoherencia de inventario (dato disponible por otra vía con rol distinto) | Verificado (hoy) | **Refutado** | `producto_routes.py`: `GET ""` y `GET /{id}` son ambos `STAFF_INTERNO` — la incoherencia citada (detalle `ADMIN_O_FACTURACION`) ya no existe tras R-07 |
| **I-090** | H-06 | `HistorialAlquiler` incompatible con la respuesta real del historial | Verificado (hoy) | **Refutado** | `Alquiler.ts:116` devuelve `{id_alquiler, total_eventos, eventos}` con los campos exactos que retorna `auditoria_controller.py:27-64` (incluye `null` para eventos sin usuario) |
| **I-091** | C-04 | `alembic.ini` con URL de ejemplo | Verificado (hoy) | Vigente (**benigno**) | `alembic.ini:89` (placeholder inofensivo) sobrescrito por `env.py:34` con `DATABASE_URL` real — sin riesgo efectivo |

---

## C. TABLA DE TRAZABILIDAD (130 identificadores → 92 elementos)

Formato: `ID` → consolidado · estado del identificador. Los 116 del paso 0.3 se marcan con °; los 14 nuevos (P-13…P-26) con †.

**F-01…F-49 (49, todos °):** F-01→I-081 · F-02→I-082 · F-03→I-083 · F-04→I-084 · F-05→I-085 · F-06→I-086 · F-07→I-043 · F-08→I-035 · F-09→I-035 · F-10→I-031 · F-11→I-087 · F-12→I-024 · F-13→I-026 · F-14→I-068 · F-15→I-023 · F-16→I-023 · F-17→I-032 · F-18→I-027 · F-19→I-028 · F-20→I-025 · F-21→I-025 · F-22→I-029 · F-23→I-070 · F-24→I-002 · F-25→I-041 · F-26→I-008 · F-27→I-003 · F-28→I-010 · F-29→I-009 · F-30→I-007 · F-31→I-013 · F-32→I-071 · F-33→I-088 · F-34→I-011 · F-35→I-012 · F-36→I-030 · F-37→I-080 · F-38→I-078 · F-39→I-035 · F-40→I-035 · F-41→I-036 · F-42→I-037 · F-43→I-038 · F-44→I-039 · F-45→I-042 · F-46→I-066 · F-47→I-067 · F-48→I-033 · F-49→I-079.

**R-01…R-16 (16, todos °):** R-01→I-001 · R-02→I-016 · R-03→I-013 · R-04→I-004 · R-05→I-005 · R-06→I-014 · R-07→I-060 · R-08→I-002 · R-09→I-043 · R-10→I-001 · R-11→I-015 · R-12→I-007 · R-13→I-006 · R-14→I-010 · R-15→I-035 · R-16→I-085.

**S-01…S-10 (10, todos °):** S-01→I-070 · S-02→I-071 · S-03→I-072 · S-04→I-073 · S-05→I-073 · S-06→I-074 · S-07→I-075 · S-08→I-076 · S-09→I-077 · S-10→I-078.

**H-01…H-14 (14, todos °):** H-01→I-070 (resuelto) · H-02→I-009 · H-03→I-040 **(verificado hoy, ↗)** · H-04→I-038 · H-05→I-041 · H-06→I-090 **(refutado hoy, ↗)** · H-07→I-039 · H-08→I-071 (resuelto) · H-09→I-034 **(verificado hoy, ↗)** · H-10→I-035 · H-11→I-023 · H-12→I-022 **(verificado hoy, ↗)** · H-13→I-087 (resuelto) · H-14→I-088 (resuelto).

**C-01…C-15 (15, todos °):** C-01→I-043 · C-02→I-043 · C-03→I-071 (resuelto) · C-04→I-091 **(verificado hoy, benigno, ↗)** · C-05→I-070 (resuelto) · C-06→I-014 · C-07→I-021 **(verificado hoy, ↗)** · C-08→I-013 · C-09→I-025 · C-10→I-026 · C-11→I-028 · C-12→I-045 · C-13→I-069 · C-14→I-017 (probable, contradicción preservada) · C-15→I-088 (resuelto).

**P-01…P-12 (12, °, paso 0.3):** P-01→I-044 · P-02→I-045 · P-03→I-046 · P-04→I-047 · P-05→I-048 · P-06→I-049 · P-07→I-089 **(refutado hoy, ↗)** · P-08→I-018 **(verificado hoy, ↗)** · P-09→I-050 **(verificado hoy, ↗)** · P-10→I-051 **(verificado hoy, ↗)** · P-11→I-052 **(verificado hoy, ↗)** · P-12→I-053 **(verificado hoy, ↗)**.

**P-13…P-26 (14, †, ampliación de alcance del paso 0.4):** P-13→I-054 · P-14→I-055 · P-15→I-019 · P-16→I-056 · P-17→I-057 · P-18→I-058 · P-19→I-059 · P-20→I-060 · P-21→I-061 · P-22→I-020 · P-23→I-062 · P-24→I-063 · P-25→I-064 · P-26→I-065.

**Control de cobertura:** 49+16+10+14+15+26 = **130/130 trazados**. Ningún identificador se perdió; los 92 elementos consolidados tienen ≥1 identificador origen. ↗ = cambio de estado respecto a EVD-2026-002 (12 identificadores), registrado aquí sin alterar ese documento.

**Nota sobre P-13…P-26:** todos son decisiones/reglas de negocio pendientes (naturaleza "decisión pendiente") con evidencia verificada del hueco; ninguno asume propuesta aprobada. Se analizaron como ampliación de alcance del paso 0.4, sin modificar retroactivamente el paso 0.3.

---

## D. DECISIONES PENDIENTES (requieren intervención del usuario; alternativas identificadas, no elegidas)

| Item | Decisión | Alternativas identificadas (sin elegir) |
|---|---|---|
| I-044 | Política de contraseñas | (a) Longitud 8+ con complejidad; (b) solo longitud larga sin complejidad (NIST); (c) con expiración; (d) con rotación forzada en el seed |
| I-045 | Rotación de `JWT_SECRET_KEY` | (a) Rotación manual programada con doble clave; (b) rotación automática periódica; (c) claves por tenant; (d) sin rotación documentando el riesgo |
| I-046 | Revocación de tokens | (a) Blacklist en BD por sesión; (b) tokens cortos + refresh; (c) sin revocación (aceptar TTL 480 min) |
| I-047 | Reapertura de alquileres | (a) Endpoint admin con auditoría; (b) procedimiento documentado por consola con registro; (c) prohibición absoluta |
| I-048 | Rol logístico ↔ historial | (a) Acceso total al historial; (b) historial acotado a estados operativos; (c) mantener exclusión |
| I-049 | Estados modificables por logística | (a) Solo estados operativos (preparado/entregado/recogido); (b) todos menos cancelado; (c) mantener `STAFF_INTERNO` completo |
| I-050 | Modelo del depósito | (a) Columnas de estado+fecha en `alquiler`; (b) tabla de conciliación; (c) derivarlo de auditoría |
| I-051 | Facturación | (a) Comprobante interno no fiscal; (b) factura electrónica completa; (c) integración externa; (d) posponer con registro de deuda |
| I-052 | Descuentos/IVA | (a) Tabla de conceptos con historial; (b) campos en `precio_alquiler` con motivo obligatorio; (c) fuera de alcance inicial |
| I-053 | Recargos por retraso | (a) Cálculo automático en renovación; (b) recargo manual con motivo; (c) sin recargo |
| I-054 | Inventario físico | (a) Tabla de movimientos/mermas; (b) conteos cíclicos con auditoría; (c) solo ajuste manual administrativo |
| I-055 | Días hábiles/festivos | (a) Catálogo de festivos configurable; (b) calendario laboral por sucursal; (c) mantener días calendario |
| I-056 | Baja de producto con stock en obra | (a) Baja lógica con stock bloqueado; (b) traslado a "repuestos"; (c) baja con autorización admin |
| I-057 | Retención de auditoría | (a) Particionado por mes; (b) archivado a tabla fría; (c) purga con exportación; (d) sin política por ahora |
| I-058 | Concurrencia de stock | (a) `FOR UPDATE` + reintento; (b) reserva optimista con contador; (c) aceptar el 400 con UX clara |
| I-059 | Trazabilidad de denegaciones en front | (a) Evento de auditoría en backend ante intento; (b) telemetría de UI; (c) no registrar |
| I-060 | Contrato de API | (a) OpenAPI versionado en repo; (b) generación automática desde FastAPI; (c) solo changelog de breaking changes |
| I-061 | Escalamiento | (a) Runbooks por severidad; (b) un solo runbook de guardia; (c) integrar con I-042 (gobernanza) |
| I-062 | Numeración de contratos | (a) Campo `numero_contrato` con secuencia por año; (b) PDF generado con número; (c) mantener SERIAL técnico |
| I-063 | Multi-sucursal | (a) Tabla `sucursal` + FK; (b) multi-tenant completo; (c) fuera de alcance |
| I-064 | Catálogo de barrios | (a) Tabla `barrio` normalizada; (b) autocompletado con validación; (c) libre con sanitización |
| I-065 | Reglas por tipo de documento | (a) Tabla de reglas por tipo; (b) validadores en frontend/backend; (c) dejar enum simple |
| I-043 | Destino de despliegue | (a) Solo Docker Compose (self-hosted); (b) Docker + orquestador; (c) PaaS con Dockerfile |
| I-035 | Destino de `docs/` vacíos | (a) Rellenar con contenido; (b) eliminar; (c) consolidar en `gestion_proyecto/` |
| I-034 | Vistas del dashboard | (a) Exponer endpoints; (b) eliminar vistas; (c) diferir a un módulo de reportes |

---

## E. VERIFICACIONES PENDIENTES

| Verificación | Item(s) | Tipo | Dependencias y limitaciones |
|---|---|---|---|
| Prueba en runtime de `GET /usuarios[/{id}]` (hash expuesto) | I-001 | Ejecución (API levantada) | Requiere autorización; entorno existe (`venv/`, `.env`) |
| Prueba de arranque: `alembic upgrade head` vs BD por SQL | I-016 | Ejecución (compose/entrypoint) | Requiere autorización; decisión I-043 influye |
| Idempotencia del job 00:05 con 2 workers | I-014 | Ejecución | Ídem |
| `gh api`: protección de ramas, PRs, issues | I-066, I-067 | Red/API de GitHub | Sin API disponible en sesión |
| Ejecución de lint/build backend y frontend | I-068 | Ejecución | Requiere autorización |
| Versión/parametrización de `python-dotenv` instalada | I-017 | Lectura de `venv`/`pip show` | Decide la contradicción C-14 |
| Hibernación de Render (si se retoma ese destino) | I-069 | Entorno externo | Depende de decisión de despliegue (I-043) |
| Auditoría dinámica de dependencias (`pip-audit`/`npm audit`) | I-031 | Ejecución + red | Requiere autorización |
| Estado real de `origin/dev` (no re-consultado hoy) | Contexto general | `git fetch` (escritura red) | Identidad del remoto apoyada en EVD-2026-001 (2026-10-28) |

**Limitaciones generales:** sin runtime, sin red, sin escritura; las clasificaciones de P/H/C se apoyan en confirmaciones documentales, banners de vigencia y comprobaciones puntuales — no constituyen reauditoría completa de los DXC.

---

## F. PREPARACIÓN DEL REGISTRO (para Antigravity, tras aprobación)

### F.1 Propuesta de documento

- **Nombre:** `INV-2026-001_inventario_unico_hallazgos_fase0_paso04.md` (o, si se prefiere mantener la familia de evidencias, `EVD-2026-003_inventario_unico_hallazgos_fase0_paso04.md`).
- **Ubicación:** `docs/gestion_proyecto/07_inventarios/` (carpeta nueva) o, en su defecto, `docs/gestion_proyecto/06_evidencias/`.
- **Contenido:** secciones A–F de este chat, con la matriz consolidada, la trazabilidad de los 130 IDs, las decisiones y verificaciones pendientes y la declaración de operaciones (solo lectura; 0 archivos creados/modificados en este paso).

### F.2 Ajustes necesarios en `00_indice.md`

1. Añadir el nuevo documento a la sección de catálogo (índice general).
2. **Pendiente desde 0.3:** registrar también `EVD-2026-002` en la tabla de evidencias (oferta aún abierta).
3. Si se crea la carpeta `07_inventarios/`, reflejarla en la sección de estructura.
4. Anotar que el paso 0.4 incorpora la ampliación P-13…P-26 (quedan 26 decisiones P, no 12).

### F.3 Información que debe registrar Antigravity

- El inventario con los **92 elementos consolidados** y su trazabilidad completa.
- Los **12 cambios de estado** respecto a EVD-2026-002 (↗ en §C), sin modificar ese documento.
- Que `docs/gestion_proyecto/` sigue **sin commitear**: el commit requiere autorización explícita y afecta la línea base documental.
- Que el paso 0.4 **no está marcado como completado**: espera revisión/aprobación del usuario.

---

**Estado:** entregable completo en chat. Paso 0.4 **no marcado como completado**. Quedo a la espera de su revisión para registrar el inventario (vía Antigravity o, si lo autoriza, crear el MD como hicimos con EVD-2026-002) e incorporar los ajustes al índice.
