# 02 — Verificación de estructura

> **Fecha:** 2026-11-26 · **Base:** `sga_db` local · **Esquema:** `public` · **Sesión:** `READ ONLY`  
> **Origen:** `OP` = verificado personalmente por OpenCode · `AG` = declarado por Antigravity

---

## 1. Inventario de objetos

| # | Verificado | Consulta / procedimiento | Resultado obtenido | Resultado esperado | Origen | Estado |
|---:|---|---|---|---|---|---|
| 1 | Tablas base | `SELECT count(*) FROM pg_tables WHERE schemaname='public'` | `8` | `8` | OP | **aprobado** |
| 2 | Vista | `SELECT count(*) FROM pg_views WHERE schemaname='public'` | `1` (`vw_dashboard_operativo`) | `1` | OP | **aprobado** |
| 3 | Vistas materializadas | `SELECT count(*) FROM pg_matviews WHERE schemaname='public'` | `0` | `0` (coherente con auditoría inicial) | OP | **aprobado** |
| 4 | Secuencias | `SELECT count(*) FROM information_schema.sequences WHERE sequence_schema='public'` | `5` | `5` | OP | **aprobado** |
| 5 | Funciones en `public` | `SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'` | `12` | `12` | OP | **aprobado** |
| 6 | Funciones PL/pgSQL | Ídem, con `JOIN pg_language l ... l.lanname='plpgsql'` | `12` | `12` | OP | **aprobado** |
| 7 | Triggers de usuario | `SELECT count(*) FROM pg_trigger ... WHERE n.nspname='public' AND NOT tg.tgisinternal` | `19` | `19` | OP | **aprobado** |
| 8 | Triggers habilitados | Ídem, con `AND tg.tgenabled <> 'O'` | `0` deshabilitados | `0` | OP | **aprobado** |
| 9 | Índices | `SELECT count(*) FROM pg_indexes WHERE schemaname='public'` | `26` | `26` | OP | **aprobado** |
| 10 | Restricciones | `SELECT count(*) FROM pg_constraint con JOIN pg_class t ... JOIN pg_namespace n ... WHERE n.nspname='public'` | `92` | `92` | OP | **aprobado** |
| 11 | Desglose de restricciones | `SELECT con.contype, count(*) ... GROUP BY 1` | `p=8`, `f=7`, `u=2`, `c=16`, `n=59` | `8 PK + 7 FK + 2 UNIQUE + 16 CHECK + 59 NOT NULL` | OP | **aprobado** |
| 12 | Columnas `NOT NULL` | `SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND is_nullable='NO'` | `59` | `59` | OP | **aprobado** |
| 13 | Particiones / ENUM | Consultas a `pg_class.relkind='p'` y `pg_type.typtype='e'` | `0` / `0` | `0` / `0` | OP | **aprobado** |
| 14 | Revisión Alembic | `SELECT version_num FROM public.alembic_version` | `d4f74f3d4896` (1 fila) | `d4f74f3d4896` (1 fila) | OP | **aprobado** |

> Nota de metodología: PostgreSQL 18 cuenta las restricciones `NOT NULL` como filas de `pg_constraint` (`contype='n'`). Por ello el total `92` ya incluye las `59` columnas obligatorias; no deben sumarse dos veces.

### Tablas observadas

`alembic_version`, `alquiler`, `auditoria_sistema`, `detalle_alquiler`, `logistica_alquiler`, `logistica_alquiler_alquiler`, `producto`, `usuario`.

### Funciones observadas (12)

`fn_actualizar_timestamp`, `fn_admin_reabrir_alquiler`, `fn_auditar_cambios`, `fn_cerrar_alquiler_devolver_stock`, `fn_garantizar_minimo_un_admin`, `fn_impedir_autodesactivacion_admin`, `fn_prohibir_reabrir_alquiler`, `fn_sincronizar_stock_producto`, `fn_validar_detalle_alquiler`, `fn_validar_fechas_alquiler`, `fn_validar_modificacion_producto`, `fn_verificar_usuario_activo`.

### Triggers observados (19)

Todos con `tgenabled = 'O'` (habilitados). Distribución: `alquiler` 6, `detalle_alquiler` 4, `logistica_alquiler` 2, `producto` 3, `usuario` 4.

---

## 2. Comparación con la auditoría inicial

| Elemento | Auditoría inicial (2026-11-26, pre-poblamiento) | Auditoría actual | Diferencia | Estado |
|---|---:|---:|---|---|
| Tablas base | 8 | 8 | Ninguna | **aprobado** |
| Vista | 1 | 1 | Ninguna | **aprobado** |
| Secuencias | 5 | 5 | Ninguna | **aprobado** |
| Funciones PL/pgSQL | 12 | 12 | Ninguna | **aprobado** |
| Triggers de usuario | 19 | 19 | Ninguna; todos activos | **aprobado** |
| Índices | 26 | 26 | Ninguna | **aprobado** |
| Restricciones | 92 | 92 | Ninguna | **aprobado** |
| Revisión Alembic | `d4f74f3d4896` | `d4f74f3d4896` | Ninguna | **aprobado** |

**Conclusión parcial:** la limpieza y el poblamiento no alteraron la estructura. No hay diferencias respecto del inventario inicial.

---

## 3. Hallazgos estructurales pendientes

| ID | Verificado | Consulta / procedimiento | Resultado obtenido | Resultado esperado | Origen | Estado |
|---|---|---|---|---|---|---|
| H-DB-01 | Disponibilidad de la revisión en el repositorio | `SELECT version_num FROM alembic_version`; listado de `sga_backend_jwt/alembic/versions/`; `git log --all -- ...d4f74f3d4896_baseline_schema.py` | DB: `d4f74f3d4896`. Árbol: solo `0001_initial_schema.py`. Historial: `d4f74f3d4896_baseline_schema.py` eliminado en `e4d4411` | Revisión de la BD resoluble en el árbol | OP | **fallido** |
| H-DB-02 | Cobertura Alembic de objetos programables | Conteo de 12 funciones/19 triggers/1 vista en BD + inspección de `0001_initial_schema.py` | BD: 12/19/1. Migración: 7 `op.create_table`, 16 `op.create_index`, 0 `op.execute`, 0 `CREATE FUNCTION/TRIGGER/VIEW` | Objetos programables gestionados por migraciones o step documentado obligatorio | OP | **fallido** |
| H-DB-07 | Coincidencia de versión PostgreSQL | `SELECT version()` vs `Select-String 'image:\s*postgres' docker-compose.yml` | Local `18.4`; Compose (`docker-compose.yml:21`) declara `postgres:16-alpine` | Misma versión | OP | **fallido** |

Antigravity declaró estos mismos tres hallazgos como pendientes (`AG`); su existencia fue confirmada personalmente. El impacto de H-DB-01 sobre una ejecución real de Alembic no se probó: es inferencia estática.

---

## 4. Declaración no reproducida

Antigravity declaró `34` eventos en `information_schema.triggers` derivados de los 19 triggers. Esta auditoría verificó los 19 triggers de usuario y su estado, pero no reprodujo el desglose por evento; se registra como **no verificable** en esa forma exacta, sin que afecte al conteo de triggers.
