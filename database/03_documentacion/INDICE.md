# Índice y diccionario rápido — SGA (`sga_backend_test` / esquema corregido)

Referencia rápida de las **6 tablas** del esquema PostgreSQL actual, alineada con
`database/01_tablas.sql` y `database/02_funciones_y_triggers.sql` tal como quedaron
corregidos y validados contra una base de datos PostgreSQL real.

> ⚠️ **Diferencia frente a versiones anteriores de este índice**: este esquema
> centraliza toda la auditoría en la tabla `auditoria_sistema`. Por eso **no**
> existen columnas `estado_usuario`, `creado_por`, `actualizado_por`,
> `eliminado_por` ni `fecha_eliminacion` en ninguna tabla de negocio — fueron
> reemplazadas por `estado_registro` (borrado lógico, en todas las tablas) y por
> los eventos de `auditoria_sistema` (quién hizo qué, y cuándo).

---

## `usuario`

| Columna | Tipo | Notas |
|---|---|---|
| `id_usuario` | VARCHAR(20) PK | Número de documento como PK natural (CC, NIT, CE, PPT) |
| `rol_usuario` | VARCHAR(30) NOT NULL | CHECK: `admin`, `encargado_facturacion`, `encargado_logistico`, `cliente`. Default `'cliente'` |
| `nombres_usuario` | VARCHAR(100) NOT NULL | |
| `apellidos_usuario` | VARCHAR(100) NOT NULL | |
| `email_usuario` | VARCHAR(100) UNIQUE | Opcional (`NULL` permitido) |
| `telefono_usuario` | VARCHAR(20) NOT NULL UNIQUE | |
| `contrasena_usuario` | VARCHAR(255) | Opcional (`NULL` en clientes sin credenciales); hash bcrypt, nunca texto plano |
| `tipo_documento` | VARCHAR(20) NOT NULL | CHECK: `CC`, `CE`, `NIT`, `PPT` |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE`. Borrado lógico (reemplaza a `estado_usuario`) |
| `fecha_creacion` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |
| `fecha_actualizacion` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |

## `producto`

| Columna | Tipo | Notas |
|---|---|---|
| `id_producto` | SERIAL PK | |
| `nombre_producto` | VARCHAR(100) NOT NULL | |
| `descripcion_producto` | VARCHAR(300) | Opcional (registros rápidos de piezas) |
| `precio_base_producto` | NUMERIC(10,2) NOT NULL | CHECK `>= 0` |
| `stock_total` | INTEGER NOT NULL | CHECK `>= 0` |
| `stock_alquilado` | INTEGER NOT NULL | Default `0`. CHECK `0 <= stock_alquilado <= stock_total`. Mantenido por triggers de `detalle_alquiler`, nunca editado a mano |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE` (borrado lógico) |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |

## `alquiler`

| Columna | Tipo | Notas |
|---|---|---|
| `id_alquiler` | SERIAL PK | |
| `id_usuario_creador` | VARCHAR(20) NOT NULL | FK → `usuario.id_usuario` (empleado facturador). Inyectado desde el JWT, nunca del payload |
| `id_usuario_cliente` | VARCHAR(20) NOT NULL | FK → `usuario.id_usuario` (cliente asociado) |
| `estado_alquiler` | VARCHAR(30) NOT NULL | CHECK: `pendiente`, `activo`, `vencido`, `recogido`, `terminado`, `cancelado`. Default `'pendiente'` |
| `barrio` | VARCHAR(100) NOT NULL | Barrio de entrega de la obra |
| `direccion` | VARCHAR(255) NOT NULL | Dirección exacta de la obra |
| `deposito` | NUMERIC(10,2) NOT NULL | CHECK `>= 0` (garantía) |
| `precio_alquiler` | NUMERIC(10,2) NOT NULL | CHECK `>= 0` (recalculado a partir de la suma de `detalle_alquiler.precio_conjunto`) |
| `fecha_inicio` | DATE NOT NULL | |
| `tiempo_alquiler_dias` | INTEGER NOT NULL | CHECK `> 0`. Unificado a días (ya no semanas) |
| `fecha_vencimiento` | *(calculada, no es columna)* | `fecha_inicio + (tiempo_alquiler_dias - 1)` días — ver `app/utils/tiempo.py` |
| `se_lleva` | BOOLEAN NOT NULL | Default `TRUE` (transporte a cargo de la empresa) |
| `se_recoge` | BOOLEAN NOT NULL | Default `TRUE` (recogida en obra a cargo de la empresa) |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE` |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |

## `detalle_alquiler`

| Columna | Tipo | Notas |
|---|---|---|
| `id_detalle_alquiler` | SERIAL PK | |
| `id_alquiler` | INTEGER NOT NULL | FK → `alquiler.id_alquiler` (ON DELETE RESTRICT) |
| `id_producto` | INTEGER NOT NULL | FK → `producto.id_producto` (ON DELETE RESTRICT) |
| `precio_conjunto` | NUMERIC(10,2) NOT NULL | CHECK `>= 0`. "Fotografía" del precio acordado al momento del contrato |
| `cantidad_productos` | INTEGER NOT NULL | CHECK `> 0` |
| `es_producto_extra` | BOOLEAN NOT NULL | Default `FALSE`. `FALSE` = componente base del conjunto, `TRUE` = adicional cobrado |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE` |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |

**Índice único de negocio**: `(id_alquiler, id_producto) WHERE es_producto_extra = FALSE` — un mismo producto solo puede aparecer una vez como componente base del conjunto por alquiler; puede repetirse si es extra.

## `logistica_alquiler`

| Columna | Tipo | Notas |
|---|---|---|
| `id_logistica_alquiler` | SERIAL PK | |
| `id_usuario_logistico` | VARCHAR(20) NOT NULL | FK → `usuario.id_usuario`. Inyectado desde el JWT, nunca del payload |
| `id_alquiler` | INTEGER NOT NULL | FK → `alquiler.id_alquiler` (ON DELETE RESTRICT) |
| `fecha_gasto` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |
| `descripcion_gasto_logistico` | TEXT | Concepto del gasto o flete |
| `valor_gasto_logistico` | NUMERIC(10,2) NOT NULL | Default `0.00`. CHECK `>= 0` |
| `observaciones_logistica_alquiler` | TEXT | Notas de campo |
| `es_recogida` | BOOLEAN NOT NULL | `TRUE` = recogida en obra, `FALSE` = despacho inicial |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE` |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |

## `auditoria_sistema` — **NUEVA, no existía en el esquema anterior**

| Columna | Tipo | Notas |
|---|---|---|
| `id_auditoria` | SERIAL PK | |
| `nombre_tabla` | VARCHAR(50) NOT NULL | Tabla afectada (`usuario`, `producto`, `alquiler`, `detalle_alquiler`, `logistica_alquiler`) |
| `tipo_operacion` | VARCHAR(10) NOT NULL | CHECK: `INSERT`, `UPDATE`, `DELETE` |
| `id_registro_afectado` | VARCHAR(50) NOT NULL | PK del registro modificado (convertida a texto) |
| `datos_anteriores` | JSONB | Estado antes del cambio. `NULL` en `INSERT` |
| `datos_nuevos` | JSONB | Estado después del cambio. `NULL` en `DELETE` |
| `id_usuario_accion` | VARCHAR(20) | Quién hizo el cambio. Poblado vía `SET LOCAL app.usuario_actual` (inyectado desde el JWT por el backend, ver `app/utils/audit_context.py`) — **no** confiar en el payload |
| `fecha_accion` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |

Poblada automáticamente por el trigger `fn_auditar_cambios()` en cada `INSERT` / `UPDATE` / `DELETE` de las tablas de negocio. Es la fuente real de:
- `GET /alquileres/{id}/historial` (todos los eventos de un alquiler)
- `GET /renovaciones/{id}` (un evento puntual de renovación, por `id_auditoria`)

---

## Índice de archivos del esquema (`database/`)

| Archivo | Tipo | Descripción breve |
|---|---|---|
| `01_tablas.sql` | DDL | Las 6 tablas, restricciones CHECK/FK e índices de rendimiento (incluye el fix de `idx_usuario_rol`) |
| `02_funciones_y_triggers.sql` | DDL/PL-pgSQL | Triggers de sincronización de stock, protecciones de negocio (mínimo un admin activo, no reabrir alquileres cerrados) y `fn_auditar_cambios()` (incluye el fix de `id_usuario_accion`) |
| `03_seed_data.sql` | DML | Datos de prueba: 1 admin, 1 facturación, 1 logístico (password `Sga2026*`, hash bcrypt real), productos y clientes de ejemplo |

> `plantillas.sql` y `consultas.sql` (del paquete original `database.zip`) **no
> forman parte de esta entrega corregida** — siguen en su versión original, sin
> los fixes de `estado_registro` ni de `id_usuario_accion`. Úsalos con
> precaución si los adaptas a este esquema.

## Roles válidos (`usuario.rol_usuario`)
`admin`, `encargado_facturacion`, `encargado_logistico`, `cliente` (sin acceso al sistema)

Jerarquía de permisos: `admin` > `encargado_facturacion` > `encargado_logistico`.

## Tipos de documento válidos (`usuario.tipo_documento`)
`CC`, `CE`, `NIT`, `PPT`

## Estados válidos (`alquiler.estado_alquiler`)
`pendiente` → `activo` → `vencido` → `recogido` → `terminado`, con `cancelado` como alternativa desde `pendiente`, `activo` o `vencido`.

## Tipos de operación válidos (`auditoria_sistema.tipo_operacion`)
`INSERT`, `UPDATE`, `DELETE`
