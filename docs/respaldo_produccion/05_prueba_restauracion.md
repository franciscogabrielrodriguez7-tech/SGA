# 05 — Prueba de Restauración Aislada del Respaldo de Producción

**Estado de la actividad:** **Ejecutada** (sobre base temporal local aislada `sga_prod_verify_tmp`, eliminada al finalizar; producción y `sga_db` local intactas).  
**Fecha:** 2026-11-27

---

## 1. Procedimiento ejecutado

1. Creación de la base temporal aislada `sga_prod_verify_tmp` en el servidor local (`localhost:5432`).
2. Restauración mediante `pg_restore.exe -Fc --no-owner --no-privileges` del archivo `C:\RespaldosSGA\sga_db_mydd_previo_carga_20261127_091347.dump` (SHA-256 `0d5b35e6e5a5d40e8811323cfb73f287ccbc3d9540b0bbc4aa8af571c1d4f3c2`).
3. Ejecución de consultas de verificación en modo solo lectura sobre `sga_prod_verify_tmp`.
4. Eliminación limpia de la base temporal (`DROP DATABASE IF EXISTS sga_prod_verify_tmp`).

---

## 2. Resultados verificados en `sga_prod_verify_tmp`

| Aspecto verificado | Resultado en `sga_prod_verify_tmp` | Esperado según `sga_db_mydd` | Estado |
|---|---|---|---|
| Código de salida de `pg_restore` | `0` | `0` | Cumplida |
| Tablas restauradas | `8` (`Tables match prod: True`) | `8` | Cumplida |
| `alembic_version` | `['0001_initial_schema']` | `['0001_initial_schema']` | Cumplida |
| `usuario` | `22` filas | `22` | Cumplida |
| `producto` | `7` filas | `7` | Cumplida |
| `alquiler` | `6` filas | `6` | Cumplida |
| `detalle_alquiler` | `6` filas | `6` | Cumplida |
| `logistica_alquiler` | `9` filas | `9` | Cumplida |
| `logistica_alquiler_alquiler` | `9` filas | `9` | Cumplida |
| `auditoria_sistema` | `12` filas | `12` | Cumplida |
| `alembic_version` (filas) | `1` | `1` | Cumplida |
| Funciones PL/pgSQL | `12` | `12` | Cumplida |
| Triggers | `19` | `19` | Cumplida |
| Vistas | `1` | `1` | Cumplida |
| Huérfanos en las 7 llaves foráneas | `0` en todas | `0` en todas | Cumplida |
| Limpieza de `sga_prod_verify_tmp` | Eliminada tras la prueba | No persistir temporales | Cumplida |
