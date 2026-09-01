# SGA — Sistema de Gestión de Alquileres de Andamios

Base de datos PostgreSQL para el sistema de gestión de alquileres de andamios (SGA). Este documento describe la organización de los archivos y el orden de ejecución. **No se modificó ninguna sentencia SQL original**: este trabajo fue exclusivamente de reorganización, comentarios de documentación y estructura de carpetas.

## Estructura del proyecto

```
SGA_db_organizado/
├── README.md                          <- este archivo
├── 01_esquema/
│   ├── 01_tablas.sql                  <- CREATE TABLE + índices
│   └── 02_funciones_y_triggers.sql    <- funciones PL/pgSQL + triggers
├── 02_datos_prueba/
│   ├── 01_insertar_usuarios.sql       <- datos semilla + primer alquiler
│   ├── 02_flujo_alquiler.sql          <- simulación de flujo completo (creación → vencimiento)
│   └── 03_verificar_triggers.sql      <- pruebas de constraints, triggers y logística
├── 03_documentacion/
│   └── INDICE.md                      <- diccionario rápido de tablas y archivos
└── _revisar/
    └── VERIFICAR_DATOS_INSERTADOS.sql <- ⚠️ archivo en cuarentena (ver advertencia abajo)
```

## Orden de ejecución

El orden importa porque hay dependencias directas entre archivos (tablas antes que triggers, triggers antes que datos, y los scripts de datos entre sí referencian IDs generados por los scripts anteriores):

1. `01_esquema/01_tablas.sql`
2. `01_esquema/02_funciones_y_triggers.sql`
3. `02_datos_prueba/01_insertar_usuarios.sql`
4. `02_datos_prueba/02_flujo_alquiler.sql`
5. `02_datos_prueba/03_verificar_triggers.sql`

Esta reorganización y el orden de ejecución fueron **verificados ejecutando los archivos contra una instancia real de PostgreSQL** (esquema completo, sin errores).

⚠️ Los scripts de `02_datos_prueba/` usan IDs de alquiler y producto **hardcodeados** (ej. `id_alquiler = 8`, `id_producto = 1`), asumiendo que las tablas `SERIAL` generan esos valores en ese orden exacto. Si ejecutas estos scripts sobre una base de datos con datos previos, o en un orden distinto, esos IDs pueden no corresponder a los registros reales — este comportamiento ya estaba así en los archivos originales y no se alteró.

## Resumen de tablas (ver detalle completo en `03_documentacion/INDICE.md`)

| Tabla | Contenido |
|---|---|
| `usuario` | Empleados y clientes (rol: `admin`, `encargado_facturacion`, `encargado_logistico`, `cliente`) |
| `producto` | Catálogo de andamios/equipos, con `stock_total` y `stock_alquilado` |
| `alquiler` | Encabezado de cada contrato de alquiler |
| `detalle_alquiler` | Líneas de producto por alquiler |
| `logistica_alquiler` | Movimientos logísticos (entrega/recogida) y sus gastos asociados |

## Lógica de negocio implementada en triggers (resumen)

- Sincronización automática de `producto.stock_alquilado` al insertar, actualizar o eliminar líneas de `detalle_alquiler`.
- Validación de stock disponible antes de aceptar una nueva línea de detalle.
- Bloqueo de modificaciones sobre el detalle de un alquiler ya `terminado`, `recogido` o `cancelado` (salvo el cierre automático del sistema).
- Prohibición de "reabrir" un alquiler que ya pasó a un estado cerrado.
- Devolución automática de stock al pasar un alquiler a `terminado` o `recogido`.
- Validación de que la fecha de inicio de un alquiler no sea anterior a hoy.
- Prohibición de eliminar un producto con stock actualmente alquilado.
- Prohibición de reducir `stock_total` por debajo de `stock_alquilado`.
- Prohibición de eliminar una línea de detalle mientras el alquiler siga activo o el stock no haya sido devuelto.
- Mantenimiento automático de `fecha_actualizacion` en las 5 tablas.
- Índice único condicional que evita duplicar un mismo producto en el detalle de un alquiler, salvo que se marque explícitamente como `es_producto_extra = TRUE`.
- **RN-USR-05** (un usuario desactivado no puede operar): `trg_validar_creador_activo` bloquea la creación de un alquiler si `usuario.id_usuario_creador` no existe o tiene `estado_usuario = FALSE`.

Esta lista es un resumen para navegación rápida; el detalle exacto de cada regla está en los comentarios del propio código en `01_esquema/02_funciones_y_triggers.sql`.

## ⚠️ Advertencia: archivo en cuarentena

`_revisar/VERIFICAR_DATOS_INSERTADOS.sql` **no corresponde al proyecto SGA**. Contiene consultas sobre tablas de un sistema distinto (aparentemente de citas veterinarias: `mascota`, `especialista`, `disponibilidad`, `cita`, `raza`). No se eliminó ni se corrigió — se dejó intacto en cuarentena para que el equipo del proyecto decida qué hacer con él. Ver el encabezado de ese mismo archivo para el detalle completo del hallazgo.

## Corrección aplicada: `usuario.rol_usuario`

Se corrigió `rol_usuario` de `VARCHAR(20)` a `VARCHAR(30)` en `01_esquema/01_tablas.sql`, a solicitud explícita del usuario. El valor `'encargado_facturacion'` (21 caracteres) no cabía en `VARCHAR(20)`, por lo que ese rol nunca se habría podido registrar con el esquema original. Este fue el único cambio de estructura aplicado sobre el SQL original; no se modificó ningún otro campo, constraint, trigger ni relación.

## Trigger agregado: `trg_validar_creador_activo`

Se agregó `fn_verificar_usuario_activo()` / `trg_validar_creador_activo` (BEFORE INSERT ON alquiler) a `01_esquema/02_funciones_y_triggers.sql`, a solicitud explícita del usuario, para bloquear la creación de un alquiler si el usuario creador no existe o está desactivado (RN-USR-05).

**Se corrigió un bug en la versión propuesta originalmente**: consultaba una columna `estado` (VARCHAR) comparada contra el string `'activo'`. Esa columna no existe — la columna real es `usuario.estado_usuario`, de tipo `BOOLEAN`. Usar la versión original rompía la creación de **cualquier** alquiler (el trigger es `BEFORE INSERT`, se ejecuta siempre) con el error `no existe la columna «estado»`, que es exactamente el bug reportado desde el frontend al hacer clic en "Crear alquiler". La versión corregida usa `estado_usuario` y compara contra `TRUE`/`FALSE`. Probado contra PostgreSQL real: usuario activo permite crear el alquiler, usuario inactivo o inexistente lo bloquea con un mensaje de negocio claro.

## Nota sobre código muerto encontrado (no corregido)

La función `fn_actualizar_stock_alquiler_delete` está definida en `02_funciones_y_triggers.sql` pero no tiene ningún `CREATE TRIGGER` asociado en el script original. Se conserva tal cual, documentada con un comentario, sin agregarle el trigger correspondiente — esa sería una decisión de lógica de negocio que no me corresponde tomar por mi cuenta.
