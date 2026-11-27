# 08 — Plan y Registro de Validaciones

**Fecha:** 2026-11-27

---

## 1. Validaciones ya ejecutadas (Fases 1 a 5 — Solo lectura / Aisladas)

| Validación | Alcance | Resultado observado | Estado |
|---|---|---|---|
| Rama Git `backup/sga-antes-carga-produccion-2026-11-27` | Repositorio SGA | Creada en `d5496b1091df4ea039324d7ed7f2c1abeb026a61`; `dev` intacta; `BAD_TRACKED=0`; `WORKTREE_DUMPS=0` | **Ejecutada (OK)** |
| Identidad de producción | `sga_db_mydd` (solo lectura) | Confirmado `current_database() = 'sga_db_mydd'`, PostgreSQL `18.6`, `alembic_version = '0001_initial_schema'` | **Ejecutada (OK)** |
| Comparación estructural `sga_db_mydd` vs `sga_db` | Esquema `public` | `8` tablas, `73` cols equivalentes, `1` vista, `12` funciones, `19` triggers, `26` índices, `92` restricciones; detectado `H-DB-03` y `H-DB-08` en producción | **Ejecutada (OK)** |
| Respaldo físico `pg_dump` | `sga_db_mydd` -> `C:\RespaldosSGA\sga_db_mydd_previo_carga_20261127_091347.dump` | Exit `0`, `58726` bytes, `102` entradas TOC, SHA-256 `0d5b35e6e5a5d40e8811323cfb73f287ccbc3d9540b0bbc4aa8af571c1d4f3c2` | **Ejecutada (OK)** |
| Restauración aislada | `sga_prod_verify_tmp` (local, luego eliminada) | Exit `0`, `8` tablas con conteos exactos (`1,6,12,6,9,9,7,22`), `12` funciones, `19` triggers, `1` vista, `0` huérfanos en 7 FKs | **Ejecutada (OK)** |

---

## 2. Validaciones preparadas para Fase 7.4 (Pendientes de autorización expresa)

Se ejecutará [03_validacion_produccion.sql](file:///C:/Users/Acer/Documents/Default%20Project/SGA_repo/SGA/docs/respaldo_produccion/scripts/03_validacion_produccion.sql) + comprobaciones funcionales tras completar Fase 7.2 y Fase 7.3:

1. **Precondiciones (Fase 7.1):** reconfirmar `current_database() = 'sga_db_mydd'`, existencia y SHA-256 de `sga_db_mydd_previo_carga_20261127_091347.dump`, ausencia de cambios inesperados en conteos desde la inspección previa (`22, 7, 6, 6, 9, 9, 12, 1`).
2. **Conteos y secuencias:** verificar `usuario=14`, `producto=10`, `alquiler=8`, `detalle_alquiler=20`, `logistica_alquiler=14`, `logistica_alquiler_alquiler=14`, `alembic_version=1` (`0001_initial_schema`), `auditoria_sistema` (`12` históricos + eventos generados por la carga) y `last_value >= MAX(id)`.
3. **Integridad referencial y stock:** `0` huérfanos en las `7` llaves foráneas; `stock_alquilado = stock_calculado` en los `10` productos; salida esperada de `vw_dashboard_operativo` (`2, 2, 1, 532, 68, 464`).
4. **Usuarios, roles y auditoría:** `1 admin`, `2 facturación`, `2 logístico`, `9 clientes`; `0` clientes con contraseña; prueba de autenticación contra empleados demo (sin modificar `sga_db_mydd`) y verificación de ausencia de contraseñas en `auditoria_sistema` según la opción aprobada para `H-DB-08`.
5. **Triggers y estructura:** confirmar `12` funciones, `19` triggers activos, `1` vista y `sga_db` local intacta.
