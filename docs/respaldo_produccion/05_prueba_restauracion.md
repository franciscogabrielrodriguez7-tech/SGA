# 05 — Prueba de Restauración Aislada del Respaldo de Producción

**Estado de la actividad:** **Ejecutada** (sobre bases temporales locales aisladas `sga_prod_verify_tmp` y `sga_prod_verify_tmp2`, eliminadas tras verificar).  
**Fecha:** 2026-11-27

---

## 1. Restauración del nuevo respaldo (`sga_db_mydd_previo_carga_20261127_094023.dump`)

Antes de abrir la transacción en `sga_db_mydd`, el archivo `C:\RespaldosSGA\sga_db_mydd_previo_carga_20261127_094023.dump` (SHA-256 `c6bd1db2b8656bad26a44ca8282560e22995bd9ab9db9249b3ccd1fb4157c242`) fue restaurado en la base temporal local `sga_prod_verify_tmp2` (`localhost:5432`) mediante `pg_restore.exe -Fc --no-owner --no-privileges`.

| Verificación en `sga_prod_verify_tmp2` | Resultado observado | Estado |
|---|---|---|
| Código de salida de `pg_restore` | `0` (`TMP_RESTORE_EXIT = 0`) | Cumplida |
| Conteos restaurados | `alembic_version: 1, alquiler: 6, auditoria_sistema: 12, detalle_alquiler: 6, logistica_alquiler: 9, logistica_alquiler_alquiler: 9, producto: 7, usuario: 22` | Paridad exacta con producción previa |
| Prueba previa del fix `H-DB-08` (`fn_auditar_cambios()`) en `sga_prod_verify_tmp2` | `INSERT`: `new_has_pwd=False, old_has_pwd=None`; `UPDATE`: `new_has_pwd=False, old_has_pwd=False`; `DELETE`: `new_has_pwd=None, old_has_pwd=False` | Cumplida (`0` exposición de `contrasena_usuario` en las 3 operaciones) |
| Limpieza de la base temporal | `DROP DATABASE IF EXISTS sga_prod_verify_tmp2` (`TMP_DB_DROPPED = sga_prod_verify_tmp2`) | Cumplida |
