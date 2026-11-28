# 02 — Inspección de Producción (`sga_db_mydd`)

**Estado de la actividad:** **Ejecutada** (conexión exclusivamente de solo lectura; cero modificaciones realizadas).  
**Fecha:** 2026-11-27

---

## 1. Identidad verificada del destino

| Parámetro | Valor observado |
|---|---|
| Host | `<HOST_RENDER_PRODUCCION>` (Render Managed PostgreSQL) |
| Puerto | `5432` |
| Base de datos (`current_database()`) | `sga_db_mydd` |
| Esquema (`current_schema()`) | `public` |
| Usuario de conexión (`current_user`) | `sga_db_mydd_user` *(contraseña y URL completa omitidas)* |
| Motor (`version()`) | `PostgreSQL 18.6 (Debian 18.6-1.pgdg12+2) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14+deb12u1) 12.2.0, 64-bit` |
| Revisión `alembic_version` | `0001_initial_schema` (`1` fila) |

---

## 2. Inventario estructural observado

| Categoría | Cantidad observada | Detalle |
|---|---:|---|
| Tablas base (`public`) | 8 | `alembic_version`, `alquiler`, `auditoria_sistema`, `detalle_alquiler`, `logistica_alquiler`, `logistica_alquiler_alquiler`, `producto`, `usuario` |
| Vistas (`public`) | 1 | `vw_dashboard_operativo` |
| Funciones PL/pgSQL | 12 | `fn_actualizar_timestamp`, `fn_admin_reabrir_alquiler`, `fn_auditar_cambios`, `fn_cerrar_alquiler_devolver_stock`, `fn_garantizar_minimo_un_admin`, `fn_impedir_autodesactivacion_admin`, `fn_prohibir_reabrir_alquiler`, `fn_sincronizar_stock_producto`, `fn_validar_detalle_alquiler`, `fn_validar_fechas_alquiler`, `fn_validar_modificacion_producto`, `fn_verificar_usuario_activo` |
| Triggers de usuario (`NOT tgisinternal`) | 19 | Distribuidos sobre `alquiler` (6), `detalle_alquiler` (4), `logistica_alquiler` (2), `producto` (3) y `usuario` (4) |
| Índices (`pg_indexes`) | 26 | Cobertura completa de PKs y llaves de búsqueda |
| Restricciones (`pg_constraint`) | 92 | `33` restricciones no-`NOT NULL` (PK, FK, UNIQUE, CHECK) + `59` restricciones `NOT NULL` |
| Secuencias | 5 | `alquiler_id_alquiler_seq` (`6`, `TRUE`), `auditoria_sistema_id_auditoria_seq` (`20`, `TRUE`), `detalle_alquiler_id_detalle_alquiler_seq` (`6`, `TRUE`), `logistica_alquiler_id_logistica_alquiler_seq` (`13`, `TRUE`), `producto_id_producto_seq` (`7`, `TRUE`) |

---

## 3. Conteos actuales y estado de los datos en producción

| Tabla | Filas | Distribución observada (sin PII) |
|---|---:|---|
| `usuario` | 22 | `admin`: 1, `cliente`: 10 (`0` con contraseña), `encargado_facturacion`: 6, `encargado_logistico`: 5 (todos con `estado_registro = TRUE`) |
| `producto` | 7 | Todos con `estado_registro = TRUE` |
| `alquiler` | 6 | `activo`: 1, `pendiente`: 2, `recogido`: 2, `vencido`: 1 |
| `detalle_alquiler` | 6 | Relacionados sin huérfanos |
| `logistica_alquiler` | 9 | `ENTREGA`: 4, `GASTO`: 3, `RECOGIDA`: 2 |
| `logistica_alquiler_alquiler` | 9 | Relacionados sin huérfanos |
| `auditoria_sistema` | 12 | `alquiler` (`1 INSERT / 4 UPDATE`), `detalle_alquiler` (`1 INSERT`), `logistica_alquiler` (`3 INSERT`), `producto` (`2 UPDATE`), `usuario` (`1 UPDATE`) |
| `alembic_version` | 1 | `0001_initial_schema` |

### Anomalías detectadas en los datos actuales de producción

- **Integridad referencial:** `0` registros huérfanos en las `7` llaves foráneas.
- **Desfase de inventario (`stock_alquilado`):** detectadas `2` inconsistencias en `producto`:
  - Producto `id=4`: `stock_total=160`, `stock_alquilado=0`, calculado en contratos abiertos=`2`.
  - Producto `id=7`: `stock_total=10`, `stock_alquilado=0`, calculado en contratos abiertos=`12` (sobrecompromiso respecto a `stock_total`).
- **Vista operativa `vw_dashboard_operativo`:** `(1, 2, 1, 905, 0, 905)` (`stock_en_obra = 0` por la desincronización de `stock_alquilado`).
- **Auditoría (`auditoria_sistema`):** `1` evento con `id_usuario_accion IS NULL`, `0` actores inexistentes, `1` fila con clave `contrasena_usuario` en JSONB.
