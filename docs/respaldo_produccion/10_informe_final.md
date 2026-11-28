# 10 — Informe Final de Respaldo, Limpieza, Corrección `H-DB-08` y Poblamiento en Producción (`sga_db_mydd`)

**Estado general:** **Ejecutado por Antigravity (`AG`) / Revisado estáticamente en `AUD-2026-008`**  
**Fecha:** 2026-11-27

---

## 1. Control de versiones Git

- **Rama Git utilizada:** `backup/sga-antes-carga-produccion-2026-11-27`
- **Commit base de respaldo del código:** `d5496b1091df4ea039324d7ed7f2c1abeb026a61`
- **Commit documental previo a la ejecución:** `7371be151a02044423f85c2fee52f68a2f653687`
- **Commit documental posterior a la ejecución:** `cb2ee5e49e1c572a13074ccaa8484d57d8c7466f`
- **Estado de `dev`:** intacta en `599f96fd28e282725e6a325604e8ddaa0b8850b5`
- **Estado de `feat/taller-6-calidad-sqa`:** intacta en `cd4a48590334675569409f197f446679065974ab`

---

## 2. Identidad de producción y respaldos físicos (`[DECLARADO — AG]`)

- **Base verificada:** `sga_db_mydd` (`<HOST_RENDER_PRODUCCION>:5432`, esquema `public`, `PostgreSQL 18.6`, usuario `sga_db_mydd_user`).
- **Respaldo físico de la ejecución autorizada (fuera del repositorio, en `<DIRECTORIO_BACKUPS>`):**
  - **Archivo:** `sga_db_mydd_previo_carga_20261127_094023.dump`
  - **Tamaño:** `58726` bytes (`NEW_DUMP_EXIT = 0`, `102` elementos TOC en `pg_restore -l`)
  - **SHA-256:** `c6bd1db2b8656bad26a44ca8282560e22995bd9ab9db9249b3ccd1fb4157c242`
  - **Resultado de restauración de prueba:** restaurado íntegramente en `sga_prod_verify_tmp2` (`TMP_RESTORE_EXIT = 0`, paridad exacta de `8` tablas y conteos previos `1, 6, 12, 6, 9, 9, 7, 22`, eliminada al finalizar).
- **Respaldo previo conservado sin sobrescribir:** `sga_db_mydd_previo_carga_20261127_091347.dump` (`58726` bytes, SHA-256 `0d5b35e6e5a5d40e8811323cfb73f287ccbc3d9540b0bbc4aa8af571c1d4f3c2`).

---

## 3. Operaciones ejecutadas y conteos antes / después (`[DECLARADO — AG]` / Aritmética `[VERIFICADA ESTÁTICAMENTE — AUD-2026-008]`)

Dentro de una única transacción atómica (`BEGIN ... COMMIT`) sobre `sga_db_mydd`:

1. **Fase 4 (`H-DB-08`):** actualización de `public.fn_auditar_cambios()` directamente en `sga_db_mydd` para excluir `- 'contrasena_usuario'` de `to_jsonb(NEW)` y `to_jsonb(OLD)` en `INSERT`, `UPDATE` y `DELETE` (probado previamente en `sga_prod_verify_tmp2` para las 3 operaciones).
2. **Fase 5 (Limpieza):** `TRUNCATE TABLE public.logistica_alquiler_alquiler, public.detalle_alquiler, public.logistica_alquiler, public.alquiler, public.producto, public.usuario RESTART IDENTITY;` sin `CASCADE`, conservando `auditoria_sistema` (`12` filas históricas) y `alembic_version` (`0001_initial_schema`).
3. **Fase 6 (Poblamiento):** inserción del dataset demo validado en `sga_db` con triggers activos.

| Tabla | Filas antes | Filas después | Secuencia final (`last_value / max`) |
|---|---:|---:|---|
| `usuario` | 22 | **14** | PK alfanumérica (`DEMO-*`) |
| `producto` | 7 | **10** | `10 / 10` (`is_called = True`) |
| `alquiler` | 6 | **8** | `8 / 8` (`is_called = True`) |
| `detalle_alquiler` | 6 | **20** | `20 / 20` (`is_called = True`) |
| `logistica_alquiler` | 9 | **14** | `14 / 14` (`is_called = True`) |
| `logistica_alquiler_alquiler` | 9 | **14** | Tabla puente compuesta |
| `auditoria_sistema` | 12 | **109** (`12` históricos + `97` nuevos) | `117 / 117` (`is_called = True`) |
| `alembic_version` | 1 (`0001_initial_schema`) | **1** (`0001_initial_schema`) | Sin secuencia |

---

## 4. Estado de auditoría, inventario y estructura

- **Estructura:** `8` tablas, `1` vista (`vw_dashboard_operativo`), `12` funciones, `19` triggers activos, `26` índices y `92` restricciones.
- **Auditoría:** `12` registros históricos conservados (`id_auditoria <= 20`, incluyendo `id_auditoria = 20` documentado con clave histórica `contrasena_usuario` sin modificar); `97` eventos nuevos (`id_auditoria 21..117`) con `0` actores nulos y `0` apariciones de `contrasena_usuario`.
- **Inventario y vista operativa:** `0` discrepancias entre `stock_alquilado` y contratos abiertos en los `10` productos; `vw_dashboard_operativo = (2, 2, 1, 532, 68, 464)`.
- **Confirmación de aislamiento:** `sga_db` local permaneció intacta (`14, 10, 8, 20, 14, 14, 97, 1`) y la rama `dev` permaneció intacta (`599f96fd28e282725e6a325604e8ddaa0b8850b5`).

---

## 5. Trazabilidad con la auditoría independiente estática (`AUD-2026-008`)

Posteriormente a la emisión inicial de este informe, OpenCode realizó la revisión [AUD-2026-008_auditoria_estatica_produccion_sin_conexion.md](../gestion_proyecto/01_auditorias/AUD-2026-008_auditoria_estatica_produccion_sin_conexion.md) en **modalidad exclusivamente estática (sin conexión a `sga_db_mydd`)**, emitiendo el dictamen **C. NO APROBADO** por las siguientes razones:

1. **Verificado estáticamente (`AUD-2026-008`):** coherencia aritmética de los scripts SQL preparados (`14/10/8/20/14/14` filas, `97` eventos nuevos de auditoría que sumados a `12` históricos dan `109` y secuencia `117/117`, stock en obra `68` y vista `(2, 2, 1, 532, 68, 464)`), ausencia de credenciales/hashes/`.dump` en el repositorio e integridad de las ramas Git.
2. **Declarado por Antigravity (`AG`) / No verificado en vivo por `AUD-2026-008`:** la identidad de `sga_db_mydd`, los conteos vivos en producción, la definición activa de `fn_auditar_cambios()` en el servidor, las secuencias reales y las pruebas ASGI del backend requieren una verificación de solo lectura con conexión directa a `sga_db_mydd`.
3. **Actividades pendientes identificadas:** versionar la corrección de `H-DB-08` en `database/01_esquema/02_funciones_y_triggers.sql` y en una migración Alembic; resolver `H-DB-02` (objetos procedimentales fuera de Alembic), `H-DB-03` (`app.current_user_id` vs `app.usuario_actual`) y `H-DB-07` (`PostgreSQL 16` en `docker-compose.yml` vs `18.4`/`18.6`).
