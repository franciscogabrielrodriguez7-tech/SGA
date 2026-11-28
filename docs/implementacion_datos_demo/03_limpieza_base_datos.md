# 03 — Limpieza Controlada de la Base de Datos Local (`sga_db`)

> **Nota de trazabilidad documental:** documento completado durante el cierre documental a partir del script versionado `docs/implementacion_datos_demo/scripts/01_limpieza_sga_db.sql` y de la verificación independiente en solo lectura registrada en `docs/auditoria_post_poblamiento/` (`OP` = verificado por auditoría independiente; `AG` = declarado por Antigravity).

---

## 1. Estrategia y alcance de limpieza

La limpieza sobre `sga_db` local se definió en [01_limpieza_sga_db.sql](./scripts/01_limpieza_sga_db.sql):

1. Comprobación previa de identidad mediante `SELECT current_database() AS base_actual, version() AS motor;`.
2. Ejecución transaccional (`BEGIN ... COMMIT`) de un único `TRUNCATE TABLE ... RESTART IDENTITY` **sin `CASCADE`** sobre las `7` tablas de dominio:
   - `public.logistica_alquiler_alquiler`
   - `public.detalle_alquiler`
   - `public.logistica_alquiler`
   - `public.alquiler`
   - `public.producto`
   - `public.usuario`
   - `public.auditoria_sistema`
3. Exclusión expresa de `public.alembic_version` para conservar la revisión local `d4f74f3d4896`.
4. Preservación completa de objetos estructurales y programables sin desactivar triggers (`DISABLE TRIGGER ALL` no utilizado).

---

## 2. Clasificación de evidencias

| Aspecto | Estado / Evidencia | Clasificación |
|---|---|---|
| Contenido del script `scripts/01_limpieza_sga_db.sql` sin credenciales ni `CASCADE` | Inspeccionado en el repositorio (`docs/auditoria_post_poblamiento/07_verificacion_repositorio.md`) | **Verificado estáticamente (`OP`)** |
| Estado intermedio de `0` filas en las 7 tablas inmediatamente después del `TRUNCATE` | Reportado durante la ejecución del poblamiento local | **Declarado (`AG`)** |
| Conservación intacta tras la operación de `8` tablas, `1` vista, `5` secuencias, `12` funciones, `19` triggers, `26` índices, `92` restricciones y `alembic_version = d4f74f3d4896` | Comprobado por consulta directa en solo lectura (`docs/auditoria_post_poblamiento/02_verificacion_estructura.md`) | **Ejecutado y verificado (`OP`)** |
