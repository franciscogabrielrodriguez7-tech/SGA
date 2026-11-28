# 05 — Validación Técnica e Integridad Referencial (`sga_db` local)

> **Nota de trazabilidad documental:** documento completado en el cierre documental consolidando los resultados del script [03_validacion_sga_db.sql](./scripts/03_validacion_sga_db.sql) y la auditoría independiente de solo lectura en `docs/auditoria_post_poblamiento/` (`OP` = verificado personalmente por OpenCode en `sga_db`; `AG` = declarado por Antigravity).

---

## 1. Estructura, conteos e integridad verificados en `sga_db` (`OP`)

Resultados comprobados mediante sesión `transaction_read_only = on` sobre `sga_db` local (`PostgreSQL 18.4`):

| Verificación | Resultado comprobado en `sga_db` | Clasificación |
|---|---|---|
| Objetos del esquema `public` | `8` tablas, `1` vista (`vw_dashboard_operativo`), `5` secuencias, `12` funciones PL/pgSQL, `19` triggers activos, `26` índices, `92` restricciones, `alembic_version = d4f74f3d4896` | **Ejecutado y verificado (`OP`)** |
| Conteos por tabla | `usuario=14`, `producto=10`, `alquiler=8`, `detalle_alquiler=20`, `logistica_alquiler=14`, `logistica_alquiler_alquiler=14`, `auditoria_sistema=97`, `alembic_version=1` | **Ejecutado y verificado (`OP`)** |
| Integridad referencial (`7` FKs) | `0` registros huérfanos en las `7` llaves foráneas | **Ejecutado y verificado (`OP`)** |
| Conciliación de inventario | `stock_alquilado` coincide con `SUM(detalle_alquiler.cantidad_productos)` en contratos abiertos (`pendiente`, `activo`, `vencido`) en `10/10` productos (`68` unidades en obra) | **Ejecutado y verificado (`OP`)** |
| Vista `vw_dashboard_operativo` | `contratos_activos=2, contratos_pendientes=2, contratos_vencidos=1, stock_total_inventario=532, stock_en_obra=68, stock_bodega=464` | **Ejecutado y verificado (`OP`)** |
| Separación de credenciales por rol | `9` clientes con `contrasena_usuario IS NULL`; `5` empleados internos con hash en formato bcrypt | **Ejecutado y verificado (`OP`)** |
| Trazabilidad en `auditoria_sistema` | `97` eventos (`0` actores `NULL`, `0` actores inexistentes); persisten `14` filas de inserción de `usuario` con la clave `"contrasena_usuario"` en `datos_nuevos` (`H-DB-08`) | **Ejecutado y verificado (`OP`)** |
| Estado de las 5 secuencias | Todas cumplen `last_value >= MAX(id)` con `is_called = True` (`producto=10/10`, `alquiler=9/8`, `detalle_alquiler=21/20`, `logistica_alquiler=14/14`, `auditoria_sistema=103/97`) | **Ejecutado y verificado (`OP`)** |

---

## 2. Pruebas de triggers en transacciones revertidas (`AG`)

Las pruebas negativas/transaccionales ejecutadas mediante `SAVEPOINT` / `ROLLBACK` sobre `sga_db` (que explican el avance `+1`/`+1`/`+6` en las secuencias de `alquiler`, `detalle_alquiler` y `auditoria_sistema`) corresponden a **ejecuciones declaradas por Antigravity (`AG`)**:

- Bloqueo por stock insuficiente (`trg_validar_detalle_alquiler`) sobre producto `id=9`.
- Bloqueo de `fecha_inicio < CURRENT_DATE` (`trg_validar_fecha_inicio`).
- Bloqueo de reapertura directa de contrato `recogido` (`trg_prohibir_reabrir_alquiler`) y reapertura administrativa (`fn_admin_reabrir_alquiler`).
- Reproducción empírica de `H-DB-03` (`fn_impedir_autodesactivacion_admin` con `app.usuario_actual` vs `app.current_user_id`).
