# 02 — Inventario de tablas y columnas

Fuente: catálogo de la base `sga_db`, esquema `public`, consultado en sesión de solo lectura el 2026-11-26.
Tipos y valores por defecto se reproducen tal como los informa PostgreSQL. Los valores por defecto de `nextval(...)` se muestran truncados solo por presentación.

## 1. Tablas base

- `alembic_version`
- `alquiler`
- `auditoria_sistema`
- `detalle_alquiler`
- `logistica_alquiler`
- `logistica_alquiler_alquiler`
- `producto`
- `usuario`

No existen tablas de categorías, ni tablas auxiliares de autenticación distintas de `usuario` (la autenticación usa JWT emitido por el backend; no hay tabla de tokens, sesiones ni roles). El sistema de auditoría usa `auditoria_sistema`. `alembic_version` es la tabla de control de migraciones.

## 2. Columnas por tabla

### `alquiler`

| # | Columna | Tipo | Nulo | Valor por defecto | Observaciones |
|---:|---|---|---|---|---|
| 1 | `id_alquiler` | integer | NO | `nextval('alquiler_id_alquiler_seq'::regclass)` | prec.=32,0 |
| 2 | `id_usuario_creador` | character varying | NO | `—` | long.=20 |
| 3 | `id_usuario_cliente` | character varying | NO | `—` | long.=20 |
| 4 | `estado_alquiler` | character varying | NO | `'pendiente'::character varying` | long.=30 |
| 5 | `barrio` | character varying | NO | `—` | long.=100 |
| 6 | `direccion` | character varying | NO | `—` | long.=255 |
| 7 | `deposito` | numeric | NO | `—` | prec.=10,2 |
| 8 | `precio_alquiler` | numeric | NO | `—` | prec.=10,2 |
| 9 | `fecha_inicio` | date | NO | `—` | — |
| 10 | `tiempo_alquiler_dias` | integer | NO | `—` | prec.=32,0 |
| 11 | `se_lleva` | boolean | NO | `true` | — |
| 12 | `se_recoge` | boolean | NO | `true` | — |
| 13 | `estado_registro` | boolean | NO | `true` | — |
| 14 | `fecha_creacion` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |
| 15 | `fecha_actualizacion` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |


### `auditoria_sistema`

| # | Columna | Tipo | Nulo | Valor por defecto | Observaciones |
|---:|---|---|---|---|---|
| 1 | `id_auditoria` | integer | NO | `nextval('auditoria_sistema_id_auditoria_seq':...` | prec.=32,0 |
| 2 | `nombre_tabla` | character varying | NO | `—` | long.=50 |
| 3 | `tipo_operacion` | character varying | NO | `—` | long.=10 |
| 4 | `id_registro_afectado` | character varying | NO | `—` | long.=50 |
| 5 | `datos_anteriores` | jsonb | YES | `—` | — |
| 6 | `datos_nuevos` | jsonb | YES | `—` | — |
| 7 | `id_usuario_accion` | character varying | YES | `—` | long.=20 |
| 8 | `fecha_accion` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |


### `detalle_alquiler`

| # | Columna | Tipo | Nulo | Valor por defecto | Observaciones |
|---:|---|---|---|---|---|
| 1 | `id_detalle_alquiler` | integer | NO | `nextval('detalle_alquiler_id_detalle_alquiler...` | prec.=32,0 |
| 2 | `id_alquiler` | integer | NO | `—` | prec.=32,0 |
| 3 | `id_producto` | integer | NO | `—` | prec.=32,0 |
| 4 | `precio_conjunto` | numeric | NO | `—` | prec.=10,2 |
| 5 | `cantidad_productos` | integer | NO | `—` | prec.=32,0 |
| 6 | `es_producto_extra` | boolean | NO | `false` | — |
| 7 | `estado_registro` | boolean | NO | `true` | — |
| 8 | `fecha_creacion` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |
| 9 | `fecha_actualizacion` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |


### `logistica_alquiler`

| # | Columna | Tipo | Nulo | Valor por defecto | Observaciones |
|---:|---|---|---|---|---|
| 1 | `id_logistica_alquiler` | integer | NO | `nextval('logistica_alquiler_id_logistica_alqu...` | prec.=32,0 |
| 2 | `id_usuario_logistico` | character varying | NO | `—` | long.=20 |
| 3 | `tipo_movimiento` | character varying | NO | `—` | long.=10 |
| 4 | `fecha_gasto` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |
| 5 | `descripcion_gasto_logistico` | text | YES | `—` | — |
| 6 | `valor_gasto_logistico` | numeric | NO | `0.00` | prec.=10,2 |
| 7 | `observaciones_logistica_alquiler` | text | YES | `—` | — |
| 8 | `estado_registro` | boolean | NO | `true` | — |
| 9 | `fecha_creacion` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |
| 10 | `fecha_actualizacion` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |


### `logistica_alquiler_alquiler`

| # | Columna | Tipo | Nulo | Valor por defecto | Observaciones |
|---:|---|---|---|---|---|
| 1 | `id_logistica_alquiler` | integer | NO | `—` | prec.=32,0 |
| 2 | `id_alquiler` | integer | NO | `—` | prec.=32,0 |


### `producto`

| # | Columna | Tipo | Nulo | Valor por defecto | Observaciones |
|---:|---|---|---|---|---|
| 1 | `id_producto` | integer | NO | `nextval('producto_id_producto_seq'::regclass)` | prec.=32,0 |
| 2 | `nombre_producto` | character varying | NO | `—` | long.=100 |
| 3 | `descripcion_producto` | character varying | YES | `—` | long.=300 |
| 4 | `precio_base_producto` | numeric | NO | `—` | prec.=10,2 |
| 5 | `precio_base_extra` | numeric | NO | `0.00` | prec.=10,2 |
| 6 | `stock_total` | integer | NO | `—` | prec.=32,0 |
| 7 | `stock_alquilado` | integer | NO | `0` | prec.=32,0 |
| 8 | `unidad_minima_alquiler` | character varying | NO | `'DIA'::character varying` | long.=10 |
| 9 | `estado_registro` | boolean | NO | `true` | — |
| 10 | `fecha_creacion` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |
| 11 | `fecha_actualizacion` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |


### `usuario`

| # | Columna | Tipo | Nulo | Valor por defecto | Observaciones |
|---:|---|---|---|---|---|
| 1 | `id_usuario` | character varying | NO | `—` | long.=20 |
| 2 | `rol_usuario` | character varying | NO | `'cliente'::character varying` | long.=30 |
| 3 | `nombres_usuario` | character varying | NO | `—` | long.=100 |
| 4 | `apellidos_usuario` | character varying | NO | `—` | long.=100 |
| 5 | `email_usuario` | character varying | YES | `NULL::character varying` | long.=100 |
| 6 | `telefono_usuario` | character varying | NO | `—` | long.=20 |
| 7 | `contrasena_usuario` | character varying | YES | `NULL::character varying` | long.=255 |
| 8 | `tipo_documento` | character varying | NO | `—` | long.=20 |
| 9 | `estado_registro` | boolean | NO | `true` | — |
| 10 | `fecha_creacion` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |
| 11 | `fecha_actualizacion` | timestamp without time zone | NO | `CURRENT_TIMESTAMP` | — |


### `alembic_version`

| # | Columna | Tipo | Nulo | Valor por defecto | Observaciones |
|---:|---|---|---|---|---|
| 1 | `version_num` | character varying | NO | `—` | long.=32 |


## 3. Secuencias

| Secuencia | Inicio | Incremento | Mínimo | Máximo | Ciclo | `last_value` observado |
|---|---:|---:|---:|---:|---|---:|
| `alquiler_id_alquiler_seq` | 1 | 1 | 1 | 2147483647 | NO | 3 |
| `auditoria_sistema_id_auditoria_seq` | 1 | 1 | 1 | 2147483647 | NO | 78 |
| `detalle_alquiler_id_detalle_alquiler_seq` | 1 | 1 | 1 | 2147483647 | NO | 8 |
| `logistica_alquiler_id_logistica_alquiler_seq` | 1 | 1 | 1 | 2147483647 | NO | 5 |
| `producto_id_producto_seq` | 1 | 1 | 1 | 2147483647 | NO | 7 |

Nota: `logistica_alquiler_alquiler` no tiene secuencia propia; su clave es compuesta `(id_logistica_alquiler, id_alquiler)`. `alembic_version` usa `version_num` como clave natural.

## 4. Particiones

No se encontraron tablas particionadas (`relkind = 'p'`) ni relaciones heredadas (`pg_inherits`) en el esquema `public`.

## 5. Columnas de la vista `vw_dashboard_operativo`

| Columna | Tipo |
|---|---|
| `contratos_activos` | bigint |
| `contratos_pendientes` | bigint |
| `contratos_vencidos` | bigint |
| `stock_total_inventario` | bigint |
| `stock_en_obra` | bigint |
| `stock_bodega` | bigint |

## 6. Observaciones de tipos

- Los estados no son `ENUM`: se implementan como `VARCHAR` con restricciones `CHECK ... = ANY(ARRAY[...])`.
- `numeric(10,2)` se usa para todos los importes (`deposito`, `precio_alquiler`, `precio_conjunto`, precios de producto, valor de gasto).
- Las marcas de borrado lógico son `estado_registro BOOLEAN NOT NULL DEFAULT true` en las tablas de dominio, salvo en la tabla puente.
- Las marcas de tiempo son `timestamp without time zone` con valor por defecto `CURRENT_TIMESTAMP`; no se encontró columna `fecha_vencimiento` almacenada: el vencimiento se calcula como `fecha_inicio + tiempo_alquiler_dias - 1` (índice funcional `idx_alquiler_fecha_vencimiento`).
