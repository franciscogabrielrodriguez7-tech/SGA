# 07 — Diseño de datos de demostración

**Estado:** propuesta. No se ha insertado ningún registro. Todo lo aquí descrito debe ejecutarse únicamente sobre una base de demostración aislada (`sga_demo`), nunca sobre `sga_db`.

## 1. Entidades reales disponibles

Se respeta estrictamente el esquema observado. **No existe tabla de categorías**, ni tabla de clientes separada (los clientes son filas de `usuario` con `rol_usuario = 'cliente'`), ni tabla de inventario independiente (el inventario es `producto.stock_total` / `stock_alquilado`). Tampoco hay tabla de estados: los estados son columnas `VARCHAR` con `CHECK`.

Entidades a poblar: `usuario`, `producto`, `alquiler`, `detalle_alquiler`, `logistica_alquiler`, `logistica_alquiler_alquiler`. `auditoria_sistema` se puebla de forma indirecta mediante los triggers. `alembic_version` no se modifica.

## 2. Volúmenes propuestos

| Tabla | Filas propuestas | Criterio |
|---|---:|---|
| `usuario` | 14 | 1 admin, 2 `encargado_facturacion`, 2 `encargado_logistico`, 9 `cliente` |
| `producto` | 10 | 8 activos con stock variado, 1 activo con stock bajo, 1 dado de baja lógica (`estado_registro = false`, `stock_alquilado = 0`) |
| `alquiler` | 8 | 2 `pendiente`, 2 `activo`, 1 `vencido`, 1 `recogido`, 1 `terminado`, 1 `cancelado` |
| `detalle_alquiler` | 20 | 2–3 líneas por alquiler; 1 línea `es_producto_extra = true` |
| `logistica_alquiler` | 14 | 7 `ENTREGA`, 4 `RECOGIDA`, 3 `GASTO` (con importes > 0) |
| `logistica_alquiler_alquiler` | 14 | una asociación por movimiento, respetando la PK compuesta |
| `auditoria_sistema` | generada | No se inserta a mano; la generan los triggers de las 5 tablas auditadas |

## 3. Identificadores y convención

- IDs de usuario sintéticos: `DEMO-ADM-01`, `DEMO-FAC-01`…`DEMO-FAC-02`, `DEMO-LOG-01`…`DEMO-LOG-02`, `DEMO-CLI-01`…`DEMO-CLI-09` (≤ 20 caracteres, cumple la columna).
- `tipo_documento = 'CC'` para todos (valor permitido por `chk_usuario_tipo_documento`).
- Correos en el dominio reservado `example.invalid` y teléfonos con prefijo `3009…`, todos únicos (cumple las dos restricciones UNIQUE).
- `contrasena_usuario`: **no se escribe un hash en este documento**. Se genera con `app.utils.security.hashear_contrasena()` al cargar y se sustituye el marcador `<HASH_BCRYPT_DEMO>` por el valor resultante. No se registran contraseñas ni hashes en los informes.
- IDs numéricos de producto, alquiler y detalle: se dejan a las secuencias; no se fijan explícitamente.

## 4. Escenarios de prueba cubiertos

| Escenario | Datos | Permite probar |
|---|---|---|
| A — Alquiler pendiente | 2 contratos, `fecha_inicio` futura, 2 líneas cada uno | Alta, validación de stock, RBAC de creación |
| B — Alquiler activo | 2 contratos, `fecha_inicio = CURRENT_DATE`, stock ocupado | Cálculo de vencimiento, consulta de entregas pendientes |
| C — Vencido | 1 contrato abierto con fecha pasada tras UPDATE | Reconciliación de `verificar_y_actualizar_vencidos`, scheduler |
| D — Recogido / terminado | 1 de cada, con líneas insertadas antes del cierre | `fn_cerrar_alquiler_devolver_stock`, bloqueo de modificación de líneas |
| E — Cancelado | 1 contrato sin logística de recogida | Regla de no reapertura (`fn_prohibir_reabrir_alquiler`) |
| F — Stock insuficiente | Producto con `stock_total = 2`, intento de línea de 5 | Mensaje de negocio de `fn_validar_detalle_alquiler` |
| G — Roles | 1 admin, 2 facturación, 2 logístico, 9 cliente | Matriz RBAC; `cliente` no debe autenticarse según regla del backend |
| H — Gastos | 3 movimientos `GASTO` con fechas en semanas distintas | `GET /gastos/resumen-semanal` con `SUM` y `date_trunc` |
| I — Auditoría | Todas las escrituras con `app.usuario_actual` | Verificación de `id_usuario_accion` en `auditoria_sistema` |

## 5. Restricciones que el diseño respeta

- `fecha_inicio` nunca es anterior a `CURRENT_DATE` en el INSERT (exigencia de `fn_validar_fechas_alquiler`). El estado `vencido` se obtiene con un UPDATE posterior, no con una fecha pasada en el INSERT.
- `stock_alquilado` se deja en `0` al insertar productos: los triggers `fn_sincronizar_stock_producto` y `fn_cerrar_alquiler_devolver_stock` lo ajustan.
- Las líneas de los contratos cerrados se insertan **antes** de cambiar el estado a `recogido`/`terminado`/`cancelado`, porque `fn_validar_detalle_alquiler` prohíbe modificar líneas de contratos cerrados.
- No se insertan dos líneas no extra con el mismo `(id_alquiler, id_producto)` (índice único parcial `idx_unico_producto_alquiler`).
- Para llegar al estado `cancelado` se usa UPDATE directo; para reabrir un `recogido`/`terminado` se invoca `fn_admin_reabrir_alquiler(p_id_alquiler)`, nunca un UPDATE simple.
- Los usuarios `cliente` se crean como datos de negocio, pero no se usan para autenticar en la UI por la regla RBAC del backend.

## 6. Lo que NO se propone

- No se crean tablas ni columnas nuevas.
- No se usa `session_replication_role` ni se desactivan triggers para la carga.
- No se insertan filas directas en `auditoria_sistema` para simular auditoría.
- No se modifica `alembic_version` en el procedimiento de carga.
- No se usa ningún dato observado en la base real (ni IDs, ni nombres, ni teléfonos) como dato demo.
