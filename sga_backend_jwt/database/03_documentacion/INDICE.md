# Índice y diccionario rápido — SGA

Referencia rápida de las 5 tablas del esquema, extraída directamente de `01_esquema/01_tablas.sql`. No se agregó ni se infirió ninguna columna que no esté en el script original.

---

## `usuario`

| Columna | Tipo | Notas |
|---|---|---|
| `id_usuario` | VARCHAR(20) PK | |
| `rol_usuario` | VARCHAR(30) | CHECK: `admin`, `encargado_facturacion`, `encargado_logistico`, `cliente`. Default `'cliente'`. **Corregido de VARCHAR(20) a VARCHAR(30)**: `'encargado_facturacion'` tiene 21 caracteres y no cabía en el tipo original — bug detectado al probar el backend contra PostgreSQL real. |
| `nombres_usuario` | VARCHAR(100) NOT NULL | |
| `apellidos_usuario` | VARCHAR(100) NOT NULL | |
| `email_usuario` | VARCHAR(100) UNIQUE | Opcional |
| `telefono_usuario` | VARCHAR(20) NOT NULL UNIQUE | |
| `contrasena_usuario` | VARCHAR(255) | Opcional |
| `tipo_documento` | VARCHAR(20) NOT NULL | CHECK: `CC`, `CE`, `NIT`, `PPT` |
| `fecha_creacion` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |
| `fecha_actualizacion` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP`; mantenido por `trg_timestamp_usuario` |
| `estado_usuario` | BOOLEAN NOT NULL | Default `TRUE` |

## `producto`

| Columna | Tipo | Notas |
|---|---|---|
| `id_producto` | SERIAL PK | |
| `nombre_producto` | VARCHAR(100) NOT NULL | |
| `descripcion_producto` | VARCHAR(300) NOT NULL | |
| `precio_base_producto` | NUMERIC(10,2) NOT NULL | CHECK `>= 0` |
| `stock_total` | INTEGER NOT NULL | CHECK `>= 0` y `>= stock_alquilado` |
| `stock_alquilado` | INTEGER NOT NULL | Default `0`. Mantenido automáticamente por triggers de `detalle_alquiler` |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP NOT NULL | Auditoría |
| `creado_por` / `actualizado_por` / `eliminado_por` | VARCHAR(50) | Auditoría (sin FK explícita a `usuario` en el script original) |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE` (borrado lógico) |
| `fecha_eliminacion` | TIMESTAMP | |

## `alquiler`

| Columna | Tipo | Notas |
|---|---|---|
| `id_alquiler` | SERIAL PK | |
| `id_usuario_creador` | VARCHAR(20) NOT NULL | FK → `usuario.id_usuario` (ON DELETE RESTRICT) |
| `id_usuario_cliente` | VARCHAR(20) NOT NULL | FK → `usuario.id_usuario` (ON DELETE RESTRICT) |
| `estado_alquiler` | VARCHAR(30) NOT NULL | CHECK: `pendiente`, `activo`, `vencido`, `recogido`, `terminado`, `cancelado`. Default `'pendiente'` |
| `barrio` | VARCHAR(100) NOT NULL | |
| `deposito` | NUMERIC(10,2) NOT NULL | CHECK `>= 0`, sin default |
| `precio_alquiler` | NUMERIC(10,2) NOT NULL | CHECK `> 0` |
| `direccion` | VARCHAR(255) NOT NULL | |
| `fecha_inicio` | DATE NOT NULL | Validada por trigger: no puede ser anterior a hoy (solo en INSERT) |
| `tiempo_alquiler` | INTEGER NOT NULL | En semanas. CHECK `> 0` (sin límite máximo en el script) |
| `se_lleva` | BOOLEAN NOT NULL | Default `TRUE` |
| `se_recoge` | BOOLEAN NOT NULL | Default `TRUE` |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP NOT NULL | Auditoría |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE` |
| `actualizado_por` / `eliminado_por` | VARCHAR(50) | |
| `fecha_eliminacion` | TIMESTAMP | |

## `detalle_alquiler`

| Columna | Tipo | Notas |
|---|---|---|
| `id_detalle_alquiler` | SERIAL PK | |
| `id_alquiler` | INTEGER NOT NULL | FK → `alquiler.id_alquiler` (ON DELETE RESTRICT) |
| `id_producto` | INTEGER NOT NULL | FK → `producto.id_producto` (ON DELETE RESTRICT) |
| `precio_conjunto` | NUMERIC(10,2) NOT NULL | CHECK `>= 0` |
| `cantidad_productos` | INTEGER NOT NULL | CHECK `> 0` |
| `es_producto_extra` | BOOLEAN NOT NULL | Default `FALSE`. Permite duplicar producto en el mismo alquiler solo si es `TRUE` (índice único condicional) |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP NOT NULL | Auditoría |
| `creado_por` / `actualizado_por` / `eliminado_por` | VARCHAR(50) | |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE`. Se pone en `FALSE` automáticamente cuando el alquiler se cierra (devuelve stock) |
| `fecha_eliminacion` | TIMESTAMP | |

## `logistica_alquiler`

| Columna | Tipo | Notas |
|---|---|---|
| `id_logistica_alquiler` | SERIAL PK | |
| `id_usuario_logistico` | VARCHAR(20) NOT NULL | FK → `usuario.id_usuario` (ON DELETE RESTRICT) |
| `id_alquiler` | INTEGER NOT NULL | FK → `alquiler.id_alquiler` (ON DELETE RESTRICT) |
| `fecha_gasto` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |
| `descripcion_gasto_logistico` | TEXT | Opcional |
| `valor_gasto_logistico` | NUMERIC(10,2) NOT NULL | Default `0.00`. CHECK `>= 0` |
| `observaciones_logistica_alquiler` | TEXT | Opcional |
| `es_recogida` | BOOLEAN NOT NULL | `TRUE` = recogida, `FALSE` = entrega |
| `fecha_actualizacion` | TIMESTAMP NOT NULL | Auditoría |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE` |
| `actualizado_por` / `eliminado_por` | VARCHAR(50) | |
| `fecha_eliminacion` | TIMESTAMP | |

---

## Índice de archivos

| Archivo | Tipo | Descripción breve |
|---|---|---|
| `01_esquema/01_tablas.sql` | DDL | 5 tablas + 1 índice único condicional |
| `01_esquema/02_funciones_y_triggers.sql` | DDL | 13 funciones, 16 triggers |
| `02_datos_prueba/01_insertar_usuarios.sql` | DML | Semilla: 2 usuarios, 1 producto, 1 alquiler + detalle |
| `02_datos_prueba/02_flujo_alquiler.sql` | DML | Alquiler nuevo → simula vencimiento → verifica |
| `02_datos_prueba/03_verificar_triggers.sql` | DML | Pruebas de stock insuficiente, fechas, integridad referencial, devolución de stock, logística, bloqueo de duplicados |
| `_revisar/VERIFICAR_DATOS_INSERTADOS.sql` | ⚠️ Cuarentena | No pertenece a SGA — ver advertencia en el README y en el propio archivo |

## Roles válidos (`usuario.rol_usuario`)
`admin`, `encargado_facturacion`, `encargado_logistico`, `cliente`

## Tipos de documento válidos (`usuario.tipo_documento`)
`CC`, `CE`, `NIT`, `PPT`

## Estados válidos (`alquiler.estado_alquiler`)
`pendiente`, `activo`, `vencido`, `recogido`, `terminado`, `cancelado`
