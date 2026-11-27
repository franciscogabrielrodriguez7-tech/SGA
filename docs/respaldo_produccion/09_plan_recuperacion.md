# 09 — Plan de Recuperación Ante Fallos (`sga_db_mydd`)

**Estado de la actividad:** **Preparada** (protocolo de contingencia para Fase 8).  
**Fecha:** 2026-11-27

---

## 1. Respaldo de retorno verificado

- **Archivo:** `C:\RespaldosSGA\sga_db_mydd_previo_carga_20261127_091347.dump`
- **Tamaño:** `58726` bytes
- **SHA-256:** `0d5b35e6e5a5d40e8811323cfb73f287ccbc3d9540b0bbc4aa8af571c1d4f3c2`
- **Prueba previa de restauración:** exitosa en `sga_prod_verify_tmp` (`PG_RESTORE_EXIT=0`, paridad exacta de objetos y filas).

---

## 2. Protocolo ante fallo en Fase 7

1. **Rollback transaccional automático:** dado que `01_limpieza_produccion_preparado.sql` y `02_poblamiento_demo_produccion_preparado.sql` están diseñados para correr dentro de una única transacción (`BEGIN ... COMMIT`), cualquier error de restricción, trigger o red revierte automáticamente toda la operación antes de confirmar cambios.
2. **Si llegara a producirse un fallo tras confirmación parcial:**
   - Detener inmediatamente cualquier nueva escritura sobre `sga_db_mydd`.
   - Identificar el punto exacto del fallo y el error reportado por PostgreSQL.
   - **No ejecutar limpiezas adicionales ni restaurar automáticamente producción.**
   - Evaluar en solo lectura la consistencia actual de tablas, secuencias y auditoría.
   - Presentar el diagnóstico completo al usuario junto con el plan exacto de restauración (`pg_restore` desde `sga_db_mydd_previo_carga_20261127_091347.dump` tras validar SHA-256) y **esperar autorización expresa** antes de restaurar.
