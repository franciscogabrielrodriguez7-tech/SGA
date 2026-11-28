# 08 — Hallazgos Resueltos y Pendientes en `sga_db` Local

> **Nota de trazabilidad documental:** documento completado en el cierre documental en concordancia con `docs/auditoria_post_poblamiento/08_hallazgos_y_recomendaciones.md` (`OP`).

---

## 1. Hallazgos corregidos en el estado de los datos de `sga_db` local (`OP`)

| ID | Descripción del hallazgo previo | Estado en los datos de `sga_db` local | Clasificación |
|---|---|---|---|
| `H-DB-04` | Desincronización de `stock_alquilado` en `producto` (`id=3` tenía `6` vs `3` calculado) | **Corregido en los datos** (`10/10` productos conciliados con `0` diferencias) | **Verificado (`OP`)** |
| `H-DB-05` | `1` evento en `auditoria_sistema` con `id_usuario_accion` inexistente en `usuario` | **Corregido en los datos** (`0` actores inexistentes en los `97` registros) | **Verificado (`OP`)** |
| `H-DB-06` | `33` eventos en `auditoria_sistema` con `id_usuario_accion IS NULL` | **Corregido en los datos** (`0` actores `NULL` en los `97` registros) | **Verificado (`OP`)** |

---

## 2. Hallazgos estructurales, de configuración y seguridad que permanecen pendientes en `sga_db` local (`OP`)

| ID | Severidad | Descripción | Estado en `sga_db` local / repositorio |
|---|---|---|---|
| `H-DB-01` | Alta | `alembic_version` en `sga_db` local registra `d4f74f3d4896`, revisión ausente de `sga_backend_jwt/alembic/versions/` (`0001_initial_schema.py`) | **Pendiente en `sga_db` local** *(en producción `sga_db_mydd` la revisión es `0001_initial_schema`)* |
| `H-DB-02` | Media-Alta | Las `12` funciones PL/pgSQL, `19` triggers y la vista `vw_dashboard_operativo` están definidos en `database/01_esquema/` pero no están incorporados en la migración Alembic `0001_initial_schema.py` | **Pendiente en repositorio** |
| `H-DB-03` | Alta | `fn_impedir_autodesactivacion_admin()` lee `current_setting('app.current_user_id', true)` mientras el backend establece `SET LOCAL app.usuario_actual` (`sga_backend_jwt/app/utils/audit_context.py`) | **Pendiente en repositorio y bases** |
| `H-DB-07` | Media | Diferencia de versiones PostgreSQL: `docker-compose.yml` declara `postgres:16-alpine`, `sga_db` local ejecuta PostgreSQL `18.4` y `sga_db_mydd` ejecuta PostgreSQL `18.6` | **Pendiente de homologar en configuración/documentación** |
| `H-DB-08` | Alta | En `sga_db` local y en el SQL versionado (`database/01_esquema/02_funciones_y_triggers.sql`), `fn_auditar_cambios()` serializa `to_jsonb(NEW)` completo sin excluir `contrasena_usuario` (`14` registros `INSERT` de `usuario` en `sga_db` local contienen la clave) | **Pendiente en `sga_db` local y en SQL versionado** *(corregido directamente en producción `sga_db_mydd` durante la Fase 4 de carga en producción, pendiente de versionar en migración)* |
