# Índice y diccionario rápido — SGA (`sga_db`)

Referencia rápida de las 5 tablas del esquema de la base de datos `sga_db`, alineada con la estructura y las columnas reales definidas para la gestión de alquileres de andamios.

---

## `usuario`

| Columna | Tipo | Notas |
|---|---|---|
| `id_usuario` | VARCHAR(20) PK | |
| `rol_usuario` | VARCHAR(30) | CHECK: `admin`, `encargado_facturacion`, `encargado_logistico`, `cliente`. Default `'cliente'` |
| `nombres_usuario` | VARCHAR(100) NOT NULL | |
| `apellidos_usuario` | VARCHAR(100) NOT NULL | |
| `email_usuario` | VARCHAR(100) UNIQUE | Opcional |
| `telefono_usuario` | VARCHAR(20) NOT NULL UNIQUE | |
| `contrasena_usuario` | VARCHAR(255) | Opcional |
| `tipo_documento` | VARCHAR(20) NOT NULL | CHECK: `CC`, `CE`, `NIT`, `PPT` |
| `fecha_creacion` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |
| `fecha_actualizacion` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |
| `estado_usuario` | BOOLEAN NOT NULL | Default `TRUE` |

## `producto`

| Columna | Tipo | Notas |
|---|---|---|
| `id_producto` | SERIAL PK | |
| `nombre_producto` | VARCHAR(100) NOT NULL | |
| `descripcion_producto` | VARCHAR(300) NOT NULL | |
| `precio_base_producto` | NUMERIC(10,2) NOT NULL | CHECK `>= 0` |
| `stock_total` | INTEGER NOT NULL | CHECK `>= 0` y `>= stock_alquilado` |
| `stock_alquilado` | INTEGER NOT NULL | Default `0`. Mantenido por triggers de `detalle_alquiler` |
| `fecha_creacion` / `fecha_actualizacion` | TIMESTAMP NOT NULL | Auditoría |
| `creado_por` / `actualizado_por` / `eliminado_por` | VARCHAR(50) | Auditoría |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE` (borrado lógico) |
| `fecha_eliminacion` | TIMESTAMP | |

## `alquiler`

| Columna | Tipo | Notas |
|---|---|---|
| `id_alquiler` | SERIAL PK | |
| `id_usuario_creador` | VARCHAR(20) NOT NULL | FK → `usuario.id_usuario` (empleado facturador) |
| `id_usuario_cliente` | VARCHAR(20) NOT NULL | FK → `usuario.id_usuario` (cliente asociado) |
| `estado_alquiler` | VARCHAR(30) NOT NULL | CHECK: `pendiente`, `activo`, `vencido`, `recogido`, `terminado`, `cancelado`. Default `'pendiente'` |
| `barrio` | VARCHAR(100) NOT NULL | Barrio de entrega de la obra |
| `deposito` | NUMERIC(10,2) NOT NULL | CHECK `>= 0` (depósito en garantía) |
| `precio_alquiler` | NUMERIC(10,2) NOT NULL | CHECK `> 0` (costo total acordado) |
| `direccion` | VARCHAR(255) NOT NULL | Dirección exacta de la obra |
| `fecha_inicio` | DATE NOT NULL | Fecha de inicio del contrato |
| `tiempo_alquiler_dias` | INTEGER NOT NULL | Duración estimada en días |
| `se_lleva` | BOOLEAN NOT NULL | Default `TRUE` (transporte a cargo de la empresa) |
| `se_recoge` | BOOLEAN NOT NULL | Default `TRUE` (recogida en obra a cargo de la empresa) |
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
| `precio_conjunto` | NUMERIC(10,2) NOT NULL | CHECK `>= 0` (precio total de esta línea) |
| `cantidad_productos` | INTEGER NOT NULL | CHECK `> 0` |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE` |

## `logistica_alquiler`

| Columna | Tipo | Notas |
|---|---|---|
| `id_logistica_alquiler` | SERIAL PK | |
| `id_usuario_logistico` | VARCHAR(20) NOT NULL | FK → `usuario.id_usuario` (empleado logístico) |
| `id_alquiler` | INTEGER NOT NULL | FK → `alquiler.id_alquiler` (ON DELETE RESTRICT) |
| `fecha_gasto` | TIMESTAMP NOT NULL | Default `CURRENT_TIMESTAMP` |
| `descripcion_gasto_logistico` | TEXT | Concepto del gasto o flete |
| `valor_gasto_logistico` | NUMERIC(10,2) NOT NULL | Default `0.00`. CHECK `>= 0` |
| `observaciones_logistica_alquiler` | TEXT | Notas de campo |
| `es_recogida` | BOOLEAN NOT NULL | `TRUE` = recogida en obra, `FALSE` = despacho inicial |
| `fecha_actualizacion` | TIMESTAMP NOT NULL | Auditoría |
| `estado_registro` | BOOLEAN NOT NULL | Default `TRUE` |
| `actualizado_por` / `eliminado_por` | VARCHAR(50) | |
| `fecha_eliminacion` | TIMESTAMP | |

---

## Índice de archivos operacionales

| Archivo | Tipo | Descripción breve |
|---|---|---|
| `plantillas.sql` | DML | Colección modular de scripts de escritura (`crear_alquiler`, `detalle_alquiler`, `logistica_alquiler`, ajustes y gestión de usuarios) |
| `consultas.sql` | DQL | Colección de consultas analíticas y reportes de inventario, finanzas, logística y personal |

## Roles válidos (`usuario.rol_usuario`)
`admin`, `encargado_facturacion`, `encargado_logistico`, `cliente`

## Tipos de documento válidos (`usuario.tipo_documento`)
`CC`, `CE`, `NIT`, `PPT`

## Estados válidos (`alquiler.estado_alquiler`)
`pendiente`, `activo`, `vencido`, `recogido`, `terminado`, `cancelado`