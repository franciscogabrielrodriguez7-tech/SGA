# 06 — Estado actual de los datos

Todas las consultas fueron de lectura y devolvieron **solo agregados**. No se extrajeron nombres, documentos, teléfonos, correos, direcciones ni hashes de contraseña.

## 1. Cantidad de registros por tabla

| Tabla | Filas |
|---|---:|
| `alembic_version` | 1 |
| `alquiler` | 3 |
| `auditoria_sistema` | 78 |
| `detalle_alquiler` | 8 |
| `logistica_alquiler` | 5 |
| `logistica_alquiler_alquiler` | 5 |
| `producto` | 7 |
| `usuario` | 21 |

La tabla con más crecimiento es `auditoria_sistema` (78 filas), seguida de `usuario` (21). El resto de tablas de negocio tiene entre 3 y 8 filas.

## 2. Distribuciones observadas

- `usuario.rol_usuario`: `cliente` = 10, `encargado_facturacion` = 5, `encargado_logistico` = 5, `admin` = 1
- `usuario.estado_usuario`: sin filas o columna no presente.
- `producto.estado_producto`: sin filas o columna no presente.
- `alquiler.estado_alquiler`: `recogido` = 2, `vencido` = 1
- `detalle_alquiler.estado_detalle`: sin filas o columna no presente.
- `logistica_alquiler.tipo_movimiento`: `ENTREGA` = 3, `RECOGIDA` = 2
- `logistica_alquiler.estado_registro`: `True` = 5
- `auditoria_sistema.tipo_accion`: sin filas o columna no presente.

Notas:

- `usuario` tiene 21 filas, todas activas: 1 administrador, 5 `encargado_facturacion`, 5 `encargado_logistico` y 10 `cliente`. El rol `cliente` existe en la BD, pero la regla RBAC del backend (`app/utils/roles.py:10-19`) no lo admite en ningún grupo de acceso.
- `producto` tiene 6 filas activas y 1 dada de baja lógicamente (`estado_registro = false`).
- `alquiler` tiene 2 en estado `recogido` y 1 en `vencido`; no hay filas en `pendiente`, `activo`, `terminado` ni `cancelado`.
- `logistica_alquiler` tiene 3 `ENTREGA` y 2 `RECOGIDA`; no hay movimientos `GASTO`, por lo que el resumen semanal de gastos no produce evidencia de gasto operativo.
- `auditoria_sistema` tiene 44 `INSERT` y 34 `UPDATE`, sin `DELETE`.

## 3. Auditoría

| Consulta agregada | Resultado |
|---|---|
| Filas por tabla auditada | `producto` 22, `alquiler` 22, `usuario` 21, `detalle_alquiler` 8, `logistica_alquiler` 5 |
| Sin `id_usuario_accion` | 33 |
| Con `id_usuario_accion` | 45 |
| `id_usuario_accion` inexistente en `usuario` | 1 |

La existencia de 33 filas sin actor es congruente con escrituras realizadas antes de que se implementara `set_audit_context()` y con escrituras internas (reconciliación de vencimientos, scheduler) que no establecen el contexto. El caso de actor inexistente se detalla en `10_hallazgos_y_riesgos.md`.

## 4. Verificaciones de integridad (agregados)

| Comprobación | Resultado | Interpretación |
|---|---:|---|
| Alquileres sin detalle activo | 0 | Correcto |
| Movimientos logísticos sin alquiler asociado | 0 | Correcto |
| Alquileres sin movimiento logístico | 0 | Correcto en los 3 contratos existentes |
| Nombres de producto activos duplicados | 0 | Correcto |
| Productos con `stock_alquilado` inconsistente | **1** | Ver H-DB-04 |
| Alquileres abiertos con fecha ya vencida | 0 | Coherente con el estado `vencido` observado |
| Filas de auditoría con actor inexistente | **1** | Ver H-DB-05 |
| Huérfanos en las 7 FK | 0 | Correcto |

La comprobación de stock compara `producto.stock_alquilado` contra la suma de `detalle_alquiler.cantidad_productos` de líneas activas pertenecientes a alquileres en `pendiente`, `activo` o `vencido`.

## 5. Secuencias y contadores

| Columna | Secuencia | `max(id)` | `last_value` |
|---|---|---:|---:|
| `alquiler.id_alquiler` | `alquiler_id_alquiler_seq` | 3 | 3 |
| `auditoria_sistema.id_auditoria` | `auditoria_sistema_id_auditoria_seq` | 78 | 78 |
| `detalle_alquiler.id_detalle_alquiler` | `detalle_alquiler_id_detalle_alquiler_seq` | 8 | 8 |
| `logistica_alquiler.id_logistica_alquiler` | `logistica_alquiler_id_logistica_alquiler_seq` | 5 | 5 |
| `producto.id_producto` | `producto_id_producto_seq` | 7 | 7 |

Todas las secuencias están alineadas con el máximo de su columna (`is_called = true`). No hay desfase que provoque colisiones por inserciones manuales con ID explícito.

## 6. Rangos temporales (sin datos personales)

| Tabla / columna | Mínimo | Máximo |
|---|---|---|
| `usuario.fecha_creacion` | 2026-09-15 20:42:27 | 2026-09-15 20:42:27 |
| `alquiler.fecha_creacion` | 2026-09-23 17:43:50 | 2026-09-23 18:24:41 |
| `auditoria_sistema.fecha_accion` | 2026-09-15 20:42:27 | 2026-10-28 10:54:00 |

## 7. Información que debe conservarse

- La fila de administrador activo: las reglas `fn_garantizar_minimo_un_admin` y `fn_impedir_autodesactivacion_admin` dependen de que exista al menos un administrador.
- El historial completo de `auditoria_sistema`: es la única traza de las operaciones realizadas y no tiene FK que permita reconstruirlo.
- Los 3 contratos y sus 8 líneas de detalle: son la base de las relaciones logísticas observadas.
- La revisión de `alembic_version`, incluso siendo inconsistente: forma parte del estado real que debe documentarse antes de cualquier intervención.

Cualquier limpieza o poblamiento debe hacerse sobre una copia aislada, nunca sobre esta base.
