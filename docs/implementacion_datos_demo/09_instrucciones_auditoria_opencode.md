# 09 — Instrucciones y Trazabilidad para Auditoría Independiente (`sga_db` local)

> **Nota de trazabilidad documental:** documento completado en el cierre documental. La auditoría independiente sobre `sga_db` local ya fue ejecutada por OpenCode y sus resultados obran en `docs/auditoria_post_poblamiento/01_resumen_auditoria.md` a `09_dictamen_final.md` (Dictamen **A. APROBADO PARA PREPARAR LA SIGUIENTE ETAPA**).

---

## 1. Procedimiento de verificación en solo lectura sobre `sga_db` local

Para repetir en cualquier momento la validación técnica en modo solo lectura sobre `sga_db` local (`localhost:5432`):

1. Verificar que la sesión esté conectada exclusivamente a `sga_db` en `localhost`/`127.0.0.1` con `SET default_transaction_read_only = on;`.
2. Ejecutar las consultas de [03_validacion_sga_db.sql](./scripts/03_validacion_sga_db.sql).
3. Comprobar los valores de referencia verificados en `docs/auditoria_post_poblamiento/`:
   - **Estructura:** `8` tablas, `1` vista (`vw_dashboard_operativo`), `5` secuencias, `12` funciones, `19` triggers activos, `26` índices, `92` restricciones, `alembic_version = 'd4f74f3d4896'`.
   - **Conteos:** `usuario=14`, `producto=10`, `alquiler=8`, `detalle_alquiler=20`, `logistica_alquiler=14`, `logistica_alquiler_alquiler=14`, `auditoria_sistema=97`, `alembic_version=1`.
   - **Inventario y vista:** `0` discrepancias entre `stock_alquilado` y contratos abiertos; `vw_dashboard_operativo = (2, 2, 1, 532, 68, 464)`.
   - **Auditoría:** `auditoria_sin_actor = 0`, `auditoria_actor_inexistente = 0`.
4. Comprobar la integridad de los respaldos locales en `<DIRECTORIO_BACKUPS>\` (fuera del repositorio):
   - `sga_db_previo_20261126_210134.dump` (`59119` bytes, SHA-256 `90c05df5a9f22000b5b9ac065a755770869cf6ffd811cd6254e7c164226e709c`, `101` entradas TOC).
   - `sga_db_final_demo_20261126_210652.dump` (`60161` bytes, SHA-256 `679913dbc14f55d05091874466159ba280507abe691c96cd475b69ce42270b60`, `101` entradas TOC).
