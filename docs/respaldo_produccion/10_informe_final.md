# 10 — Informe de Punto de Control (Fases 1 a 6 — Pendiente de Autorización Expresa)

**Estado general:** **Detenido en Fase 6 (Punto de control obligatorio)** — NO se ha borrado ni modificado producción (`sga_db_mydd`) ni la base local (`sga_db`).  
**Fecha:** 2026-11-27

---

## 1. Resumen por fase

| Fase | Descripción | Estado |
|---|---|---|
| **Fase 1** | Respaldo de rama Git (`backup/sga-antes-carga-produccion-2026-11-27`) | **Ejecutada** (`d5496b1091df4ea039324d7ed7f2c1abeb026a61`) |
| **Fase 2** | Inspección de `sga_db_mydd` y comparación contra `sga_db` | **Ejecutada** (solo lectura) |
| **Fase 3** | Respaldo físico `pg_dump` y prueba de restauración aislada | **Ejecutada** (`58726` bytes, SHA-256 verificado) |
| **Fase 4** | Preparación de datos demo y compatibilidad con triggers | **Preparada** |
| **Fase 5** | Plan de limpieza controlada de `sga_db_mydd` | **Preparada** |
| **Fase 6** | Punto de control y solicitud de autorización expresa | **En curso (detenido aquí)** |
| **Fase 7** | Ejecución autorizada (limpieza, carga, validación post-carga) | **Pendiente de autorización expresa** |
| **Fase 8** | Plan de recuperación | **Preparada (contingencia)** |

---

## 2. Confirmaciones de seguridad al cierre de Fase 6

- **`sga_db_mydd` (producción):** intacta (`0` operaciones de escritura ejecutadas).
- **`sga_db` (local):** intacta (`0` modificaciones).
- **`dev`:** intacta en `599f96fd28e282725e6a325604e8ddaa0b8850b5`.
- **`backup/sga-antes-estabilizacion-2026-11-27`:** intacta en `d5496b1091df4ea039324d7ed7f2c1abeb026a61`.
- **`feat/taller-6-calidad-sqa`:** intacta en `cd4a48590334675569409f197f446679065974ab`.
- **Operaciones remotas Git:** ninguna (`0` `push`).
- **Pendiente de decisión expresa del usuario para pasar a Fase 7:**
  1. Autorización expresa para limpiar las 6 tablas operativas de `sga_db_mydd` (conservando `auditoria_sistema` y `alembic_version`) y cargar el dataset demo.
  2. Decisión sobre `H-DB-08`: si se autoriza corregir `fn_auditar_cambios()` antes de insertar empleados (**Opción A**) o mantener intacta `fn_auditar_cambios()` aceptando la excepción documentada (**Opción B**).
  3. Decisión sobre archivos no versionados en Git (`docs/respaldo_rama/01_informe_respaldo_rama.md` y `docs/respaldo_produccion/`).
