# SGA — Sistema de Gestión de Alquileres de Andamios (`database`)

Base de datos PostgreSQL para el sistema de gestión de alquileres de andamios
(SGA). Este documento describe la estructura actual del directorio de base de
datos, el contenido de cada script, el orden lógico de ejecución, el estado de
validación de cada archivo y el diccionario del esquema.

## Estructura del proyecto

```text
database/
├── 01_esquema/
│   ├── 01_tablas.sql                <- CREATE TABLE + índices
│   ├── 02_funciones_y_triggers.sql  <- Funciones PL/pgSQL + triggers de negocio
│   ├── 03_seed_data.sql             <- Datos semilla iniciales
│   ├── 04_plantillas.sql            <- Plantillas DML modulares para operaciones
│   └── 05_consultas.sql             <- Consultas DQL analíticas y reportes
├── 03_documentacion/
│   └── INDICE.md                    <- Diccionario rápido de tablas y archivos
└── README_base_de_datos.md          <- Este archivo
```

## Orden lógico de ejecución

Los tres primeros scripts de `01_esquema/` deben ejecutarse **en este orden
exacto** sobre una base de datos PostgreSQL 16 vacía; cada uno depende de que
el anterior haya corrido sin errores:

```bash
psql -d TU_BASE_DE_DATOS -f 01_esquema/01_tablas.sql
psql -d TU_BASE_DE_DATOS -f 01_esquema/02_funciones_y_triggers.sql
psql -d TU_BASE_DE_DATOS -f 01_esquema/03_seed_data.sql   # opcional, datos de prueba
```

`04_plantillas.sql` y `05_consultas.sql` **no** son parte de la carga inicial
del esquema: son colecciones de scripts sueltos que se ejecutan bajo demanda,
uno a la vez, una vez que ya existen datos reales con los que operar (ver
estado de validación más abajo).

## Estado de validación de cada script

| Script | Estado | Detalle |
|---|---|---|
| `01_tablas.sql` | ✅ Corregido y validado | Se corrigió un bug bloqueante (`idx_usuario_rol` referenciaba una columna inexistente, `estado_usuario` en vez de `estado_registro`) que impedía cargar el esquema completo. Verificado con `psql` contra PostgreSQL 16 real. |
| `02_funciones_y_triggers.sql` | ✅ Corregido y validado | Se corrigió que `fn_auditar_cambios()` nunca poblaba `auditoria_sistema.id_usuario_accion` (quedaba siempre `NULL`). Ahora lee `current_setting('app.usuario_actual', true)`, poblado por el backend vía `SET LOCAL` en cada transacción de escritura. Verificado end-to-end contra la API real. |
| `03_seed_data.sql` | ✅ Corregido y validado | La contraseña de los usuarios de prueba venía en texto plano (`hash_pwd_123`); se regeneró con un hash bcrypt real. Contraseña de prueba para todos los empleados del seed: `Sga2026*`. |
| `04_plantillas.sql` | ⚠️ Sin revisar / esquema anterior | Colección de plantillas DML (crear alquiler, detalle, logística, ajustes, gestión de usuarios). No se ha verificado su compatibilidad con las columnas y triggers del esquema corregido (por ejemplo, algunas plantillas de ejemplo referencian IDs de alquiler que no existen en el seed actual). Revisar antes de usar en producción. |
| `05_consultas.sql` | ⚠️ Sin revisar / esquema anterior | Colección de consultas DQL analíticas y de reportes (inventario, finanzas, logística, personal). Si alguna consulta referencia `estado_usuario` (reemplazado por `estado_registro`) o asume que `auditoria_sistema.id_usuario_accion` siempre es `NULL` (ya no lo es), necesitará ajustarse. |

## Contenido de cada script

### `01_tablas.sql`
Define las 6 tablas del esquema (`usuario`, `producto`, `alquiler`,
`detalle_alquiler`, `logistica_alquiler`, `auditoria_sistema`), sus
restricciones `CHECK`/`FOREIGN KEY`, y los índices de rendimiento —incluyendo
el índice único parcial que garantiza una sola línea base por producto en un
alquiler (`idx_unico_producto_alquiler`), y los índices de auditoría por
tabla/registro, por usuario y por fecha.

### `02_funciones_y_triggers.sql`
Contiene la lógica de negocio que vive en la base de datos:
- Sincronización automática de `producto.stock_alquilado` a partir de
  `detalle_alquiler` (entregas y recogidas).
- Protecciones de integridad: impide desactivar el único `admin` activo del
  sistema, impide que un `admin` se autodesactive, impide reabrir un alquiler
  ya cerrado (`terminado`/`cancelado`) salvo excepción controlada
  (`app.permitir_reapertura`).
- `fn_auditar_cambios()`: trigger genérico que registra automáticamente cada
  `INSERT`/`UPDATE`/`DELETE` de las tablas de negocio en `auditoria_sistema`,
  incluyendo el usuario que hizo el cambio.

### `03_seed_data.sql`
Datos de prueba: 1 usuario `admin`, 1 `encargado_facturacion`, 1
`encargado_logistico`, un lote de productos de andamiaje y clientes de
ejemplo. Todas las contraseñas de empleados usan el mismo hash bcrypt
(contraseña en texto plano: `Sga2026*`).

### `04_plantillas.sql`
Plantillas DML modulares — ejemplos parametrizables de operaciones típicas
(crear alquiler completo con su detalle, registrar gasto logístico, ajustes de
inventario, alta/baja de usuarios). Pensadas como punto de partida para
scripts de administración manual, no para ejecutarse tal cual sin adaptar los
valores de ejemplo.

### `05_consultas.sql`
Consultas DQL de solo lectura para reportes: estado de inventario
(disponible vs. alquilado), resúmenes financieros, actividad logística y
desempeño de personal.

## Diccionario del esquema

El diccionario completo tabla por tabla (columnas, tipos, restricciones,
notas) vive en [`03_documentacion/INDICE.md`](03_documentacion/INDICE.md).
Resumen de las 6 tablas:

| Tabla | Propósito |
|---|---|
| `usuario` | Personal (`admin`, `encargado_facturacion`, `encargado_logistico`) y clientes (`cliente`), en una sola tabla diferenciada por `rol_usuario` |
| `producto` | Catálogo de piezas de andamiaje, con `stock_total` y `stock_alquilado` |
| `alquiler` | Contrato de alquiler: cliente, obra, fechas, precio, ciclo de vida |
| `detalle_alquiler` | Líneas de producto asociadas a un alquiler (base + extras) |
| `logistica_alquiler` | Entregas y recogidas en obra, con su gasto asociado |
| `auditoria_sistema` | Registro centralizado de todo cambio (`INSERT`/`UPDATE`/`DELETE`) en las tablas anteriores, con el usuario responsable |

## Reglas de negocio clave

- **Auditoría inyectada, nunca confiada al payload**: `id_usuario_creador`,
  `id_usuario_logistico` (en las tablas de negocio) e `id_usuario_accion` (en
  `auditoria_sistema`) siempre provienen del usuario autenticado por JWT,
  nunca de lo que envía el cliente HTTP.
- **Jerarquía de roles**: `admin` > `encargado_facturacion` >
  `encargado_logistico`. `encargado_facturacion` puede hacer todo lo que hace
  `encargado_logistico`, pero no al revés. `cliente` no tiene acceso al
  sistema.
- **Ciclo de vida de un alquiler**:
  `pendiente → activo → vencido → recogido → terminado`, con `cancelado`
  como alternativa desde `pendiente`, `activo` o `vencido`.
- **Vencimiento automático**: `activo` pasa a `vencido` solo, por dos vías
  independientes — reconciliación en cada lectura/escritura del backend, y un
  job diario programado a las 00:05 (America/Bogota). Ver
  `app/utils/tiempo.py` y `app/utils/scheduler.py` en el backend.
- **Stock**: `producto.stock_alquilado` nunca se actualiza manualmente desde
  el backend — lo mantienen sincronizado los triggers al registrar/liberar
  líneas de `detalle_alquiler`.
- **Borrado lógico**: todas las tablas de negocio usan `estado_registro`
  (booleano); no hay `DELETE` físico de registros con historial.
