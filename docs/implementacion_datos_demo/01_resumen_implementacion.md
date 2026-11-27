# 01 — Resumen de Implementación y Poblamiento Demo (`sga_db` local)

**Fecha de ejecución:** 2026-11-26  
**Alcance exclusivo:** Base de datos PostgreSQL local `sga_db` (`localhost:5432`, esquema `public`).  
**Exclusión explícita:** La base de datos de producción `sga_db_mydd` NO fue conectada, consultada ni modificada en ningún paso.

---

## 1. Estado general y resultado

La base de datos local `sga_db` quedó respaldada antes de intervenir (`sga_db_previo_20261126_210134.dump`), limpiada únicamente en filas de negocio conservando intacta su estructura (`TRUNCATE TABLE ... RESTART IDENTITY` sin `CASCADE`), poblada con un conjunto coherente de datos ficticios de demostración (`scripts/02_poblamiento_demo_sga_db.sql`), validada técnica y funcionalmente, y respaldada nuevamente en su estado final (`sga_db_final_demo_20261126_210652.dump`) con prueba positiva de restauración en base temporal aislada (`sga_verify_tmp`, eliminada tras la verificación).

El código de aplicación (`sga_backend_jwt/app/`), las migraciones (`alembic/`), la revisión registrada (`alembic_version = d4f74f3d4896`) y el esquema de `sga_db` (tablas, funciones, triggers, vista, restricciones e índices) permanecieron sin modificaciones.

---

## 2. Entorno observado

| Elemento | Valor observado en `sga_db` local | Nota de contraste |
|---|---|---|
| Base de datos intervenida | `sga_db` (`localhost:5432`) | Local de desarrollo/pruebas |
| Motor observado | `PostgreSQL 18.4 on x86_64-windows, compiled by msvc-19.44.35226, 64-bit` | `docker-compose.yml` declara PostgreSQL 16 (discrepancia abierta) |
| Revisión `alembic_version` | `d4f74f3d4896` | Conservada intacta; pendiente de alinear en tarea de migraciones |
| Tablas base (`public`) | `8` (`7` de dominio + `alembic_version`) | Preservadas al 100% |
| Vista (`public`) | `1` (`vw_dashboard_operativo`) | Preservada al 100% |
| Funciones PL/pgSQL | `12` | Preservadas al 100% |
| Triggers de usuario | `19` (`34` eventos en `information_schema.triggers`) | Preservados y activos durante toda la carga |
| Secuencias | `5` | Reiniciadas y consistentes (`last_value >= MAX(id)`) |
| Índices / Restricciones | `26` índices / `92` restricciones | Preservados al 100% |

---

## 3. Resumen cuantitativo del poblamiento final

| Tabla | Filas previas | Filas post-limpieza | Filas finales demo | Cobertura funcional |
|---|---:|---:|---:|---|
| `usuario` | 21 | 0 | 14 | `1` admin, `2` facturación, `2` logísticos (`Sga2026*` en hash bcrypt); `9` clientes sin contraseña |
| `producto` | 7 | 0 | 10 | Unidades `DIA`, `SEMANA`, `MES`, ítem de stock bajo (`id=9`) e ítem inactivo (`id=10`) |
| `alquiler` | 3 | 0 | 8 | Cobertura completa de 6 estados: `pendiente` (2), `activo` (2), `vencido` (1), `recogido` (1), `terminado` (1), `cancelado` (1) |
| `detalle_alquiler` | 8 | 0 | 20 | Stock sincronizado por triggers según unidad mínima de alquiler |
| `logistica_alquiler` | 5 | 0 | 14 | `7 ENTREGA`, `2 RECOGIDA`, `5 GASTO` distribuidos en 3 semanas ISO |
| `logistica_alquiler_alquiler` | 5 | 0 | 14 | Trazabilidad logística coherente con estados entregados/cerrados |
| `auditoria_sistema` | 78 | 0 | 97 | Generados automáticamente por triggers con actor válido (`0` NULL, `0` inexistentes) |
| `alembic_version` | 1 | 1 | 1 | Revisión `d4f74f3d4896` intacta |

---

## 4. Respaldos generados (fuera del repositorio)

- **Respaldo previo a la intervención:** `C:\RespaldosSGA\sga_db_previo_20261126_210134.dump` (`59119` bytes, SHA-256 `90c05df5a9f22000b5b9ac065a755770869cf6ffd811cd6254e7c164226e709c`, `101` entradas TOC).
- **Respaldo final tras validación:** `C:\RespaldosSGA\sga_db_final_demo_20261126_210652.dump` (`60161` bytes, SHA-256 `679913dbc14f55d05091874466159ba280507abe691c96cd475b69ce42270b60`, `101` entradas TOC), restaurado y verificado en `sga_verify_tmp` antes de eliminar la base temporal.

---

## 5. Estado de hallazgos respecto a la auditoría previa

- **Corregidos en los datos locales de `sga_db`:**
  - `H-DB-04`: eliminada la desincronización de `stock_alquilado` (`0` discrepancias entre `stock_alquilado` y `detalle_alquiler` abierto en los 10 productos).
  - `H-DB-05`: eliminados actores inexistentes en `auditoria_sistema` (`0` registros huérfanos).
  - `H-DB-06`: eliminados eventos sin actor en `auditoria_sistema` (`0` registros con `id_usuario_accion IS NULL`).
- **Pendientes en esquema / migraciones / entorno (documentados en `08_hallazgos_pendientes.md`):**
  - Revisión Alembic `d4f74f3d4896` sin archivo equivalente en el repositorio actual.
  - Diferencia de versión PostgreSQL entre entorno local (`18.4`) y `docker-compose.yml` (`16`).
  - `H-DB-03`: `fn_impedir_autodesactivacion_admin()` lee `app.current_user_id` mientras el backend asigna `app.usuario_actual` (reproducido empíricamente en transacción revertida).
  - `H-DB-08`: `fn_auditar_cambios()` continúa incluyendo la clave `"contrasena_usuario"` en `auditoria_sistema.datos_nuevos` (`14` registros afectados tras el poblamiento).
