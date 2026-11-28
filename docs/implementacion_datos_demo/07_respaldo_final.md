# 07 — Respaldo Final de la Base Local (`sga_db`)

> **Nota de trazabilidad documental:** documento completado en el cierre documental a partir de la verificación independiente en `docs/auditoria_post_poblamiento/06_verificacion_respaldos.md` (`OP`) y los registros de ejecución (`AG`).

---

## 1. Metadatos verificados del respaldo final (`OP`)

El respaldo final de `sga_db` local se almacenó fuera del repositorio Git en el directorio local de respaldos (`<DIRECTORIO_BACKUPS>\sga_db_final_demo_20261126_210652.dump`):

| Metadato | Valor verificado | Clasificación |
|---|---|---|
| Nombre del archivo | `sga_db_final_demo_20261126_210652.dump` | **Ejecutado y verificado (`OP`)** |
| Ubicación | Fuera del repositorio (`<DIRECTORIO_BACKUPS>\`, p. ej. `C:\RespaldosSGA\`) | **Ejecutado y verificado (`OP`)** |
| Tamaño | `60161` bytes | **Ejecutado y verificado (`OP`)** |
| SHA-256 | `679913dbc14f55d05091874466159ba280507abe691c96cd475b69ce42270b60` | **Ejecutado y verificado (`OP`)** |
| Catálogo (`pg_restore -l`) | Legible, código de salida `0`, `101` entradas TOC | **Ejecutado y verificado (`OP`)** |
| Ausencia de `.dump` dentro del repositorio Git | `0` archivos `.dump` en el árbol de trabajo e índice Git | **Ejecutado y verificado (`OP`)** |

---

## 2. Prueba de restauración aislada (`AG`)

- **Base temporal local utilizada:** `sga_verify_tmp` (creada en `localhost:5432`, restaurada con `pg_restore -Fc --no-owner --no-privileges` y eliminada posteriormente mediante `DROP DATABASE IF EXISTS sga_verify_tmp`).
- **Resultado (`AG`):** paridad completa de conteos (`14, 10, 8, 20, 14, 14, 97, 1`), `alembic_version = d4f74f3d4896`, `1` vista, `12` funciones, `19` triggers y salida `(2, 2, 1, 532, 68, 464)` en `vw_dashboard_operativo`. *(Clasificación en `docs/auditoria_post_poblamiento/06_verificacion_respaldos.md`: resultado declarado por `AG`, no re-ejecutado durante la auditoría de solo lectura `OP`.)*
