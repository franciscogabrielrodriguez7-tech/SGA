# 03 — Verificación de datos

> **Fecha:** 2026-11-26 · **Base:** `sga_db` local · **Esquema:** `public` · **Sesión:** `READ ONLY`  
> **Origen:** `OP` = verificado personalmente por OpenCode · `AG` = declarado por Antigravity

---

## 1. Conteos de filas

Procedimiento común (`OP`):

```sql
SELECT 'usuario' AS tabla, count(*) FROM public.usuario
UNION ALL SELECT 'producto', count(*) FROM public.producto
UNION ALL SELECT 'alquiler', count(*) FROM public.alquiler
UNION ALL SELECT 'detalle_alquiler', count(*) FROM public.detalle_alquiler
UNION ALL SELECT 'logistica_alquiler', count(*) FROM public.logistica_alquiler
UNION ALL SELECT 'logistica_alquiler_alquiler', count(*) FROM public.logistica_alquiler_alquiler
UNION ALL SELECT 'auditoria_sistema', count(*) FROM public.auditoria_sistema
UNION ALL SELECT 'alembic_version', count(*) FROM public.alembic_version;
```

| Tabla | Resultado obtenido | Esperado (`AG`) | Diferencia | Estado |
|---|---:|---:|---:|---|
| `usuario` | 14 | 14 | 0 | **aprobado** |
| `producto` | 10 | 10 | 0 | **aprobado** |
| `alquiler` | 8 | 8 | 0 | **aprobado** |
| `detalle_alquiler` | 20 | 20 | 0 | **aprobado** |
| `logistica_alquiler` | 14 | 14 | 0 | **aprobado** |
| `logistica_alquiler_alquiler` | 14 | 14 | 0 | **aprobado** |
| `auditoria_sistema` | 97 | 97 | 0 | **aprobado** |
| `alembic_version` | 1 | 1 | 0 | **aprobado** |

---

## 2. Roles y contraseñas

| Verificado | Consulta / procedimiento | Resultado obtenido | Resultado esperado | Origen | Estado |
|---|---|---|---|---|---|
| Distribución de roles | `SELECT rol_usuario, estado_registro, count(*) FROM public.usuario GROUP BY 1,2` | `admin` 1, `encargado_facturacion` 2, `encargado_logistico` 2, `cliente` 9; todos activos | 1 / 2 / 2 / 9 | OP | **aprobado** |
| Nombres de roles vs backend | Comparación con `sga_backend_jwt/app/utils/roles.py:53-59` (`SOLO_ADMIN`, `ADMIN_O_FACTURACION`, `ADMIN_O_LOGISTICO`, `STAFF_INTERNO`) | Los cuatro roles existen y coinciden; `cliente` no aparece en grupos de acceso | Roles del backend | OP | **aprobado** |
| Clientes sin contraseña | `count(*) FILTER (WHERE rol_usuario='cliente' AND contrasena_usuario IS NULL)` | `9` de `9` | `9` | OP | **aprobado** |
| Clientes con contraseña | `count(*) FILTER (WHERE rol_usuario='cliente' AND contrasena_usuario IS NOT NULL)` | `0` | `0` | OP | **aprobado** |
| Cuentas internas con formato bcrypt | Conteo con regex `^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$` sobre `contrasena_usuario` | `5` de `5` | `5` | OP | **aprobado** |
| Cuentas internas sin formato esperado | Ídem, negado | `0` | `0` | OP | **aprobado** |
| Roles inesperados | `rol_usuario NOT IN (...)` | `0` | `0` | OP | **aprobado** |

**Privacidad:** en ningún caso se seleccionó, imprimió ni copió el valor de `contrasena_usuario`. Solo se evaluó si es `NULL` y si coincide con el patrón de formato. No se verificó qué contraseña en texto plano corresponde a cada hash.

---

## 3. Distribuciones funcionales

| Verificado | Consulta / procedimiento | Resultado obtenido | Esperado (`AG`) | Estado |
|---|---|---|---|---|
| Estados de `alquiler` | `SELECT estado_alquiler, count(*) FROM public.alquiler GROUP BY 1` | `pendiente` 2, `activo` 2, `vencido` 1, `recogido` 1, `terminado` 1, `cancelado` 1 | Igual | **aprobado** |
| Tipos de movimiento | `SELECT tipo_movimiento, count(*) FROM public.logistica_alquiler GROUP BY 1` | `ENTREGA` 7, `RECOGIDA` 2, `GASTO` 5 | Igual | **aprobado** |
| Vista operativa | `SELECT * FROM public.vw_dashboard_operativo` | `contratos_activos=2`, `contratos_pendientes=2`, `contratos_vencidos=1`, `stock_total_inventario=532`, `stock_en_obra=68`, `stock_bodega=464` | Coherente con 8 alquileres y stock activo | **aprobado** |

> Aclaración verificada: la vista filtra `producto.estado_registro = true` (`pg_get_viewdef`). Por eso `stock_total_inventario=532` difiere de la suma bruta de `producto.stock_total=542`: el producto `id_producto=10` está inactivo y aporta 10 unidades. No es una inconsistencia.

---

## 4. Comparación con la auditoría inicial (pre-poblamiento)

| Tabla | Pre-poblamiento | Post-poblamiento | Variación |
|---|---:|---:|---:|
| `usuario` | 21 | 14 | −7 |
| `producto` | 7 | 10 | +3 |
| `alquiler` | 3 | 8 | +5 |
| `detalle_alquiler` | 8 | 20 | +12 |
| `logistica_alquiler` | 5 | 14 | +9 |
| `logistica_alquiler_alquiler` | 5 | 14 | +9 |
| `auditoria_sistema` | 78 | 97 | +19 |
| `alembic_version` | 1 | 1 | 0 |

La variación es esperable tras la limpieza y el poblamiento declarados. La tabla de control de migraciones no fue tocada.

---

## 5. Resultado global

Todos los conteos, distribuciones y comprobaciones de credenciales coinciden con lo declarado por Antigravity. No se encontraron roles inesperados ni cuentas cliente con contraseña, y las cuentas internas conservan el formato esperado por el backend.
