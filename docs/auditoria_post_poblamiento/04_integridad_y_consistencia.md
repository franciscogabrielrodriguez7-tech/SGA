# 04 — Integridad y consistencia

> **Fecha:** 2026-11-26 · **Base:** `sga_db` local · **Esquema:** `public` · **Sesión:** `READ ONLY`  
> **Origen:** `OP` = verificado personalmente por OpenCode · `AG` = declarado por Antigravity

---

## 1. Claves foráneas y registros huérfanos

Se obtuvieron las 7 FK desde `pg_constraint` (`contype='f'`) y se generó para cada una una consulta `LEFT JOIN ... WHERE hija.clave IS NOT NULL AND padre.clave IS NULL`.

| Restricción | Hija → padre | Filas huérfanas | Resultado esperado | Estado |
|---|---|---:|---:|---|
| `fk_alquiler_usuario_cliente` | `alquiler.id_usuario_cliente` → `usuario.id_usuario` | 0 | 0 | **aprobado** |
| `fk_alquiler_usuario_creador` | `alquiler.id_usuario_creador` → `usuario.id_usuario` | 0 | 0 | **aprobado** |
| `fk_detalle_alquiler_alquiler` | `detalle_alquiler.id_alquiler` → `alquiler.id_alquiler` | 0 | 0 | **aprobado** |
| `fk_detalle_alquiler_producto` | `detalle_alquiler.id_producto` → `producto.id_producto` | 0 | 0 | **aprobado** |
| `fk_logistica_usuario` | `logistica_alquiler.id_usuario_logistico` → `usuario.id_usuario` | 0 | 0 | **aprobado** |
| `fk_logalq_alquiler` | `logistica_alquiler_alquiler.id_alquiler` → `alquiler.id_alquiler` | 0 | 0 | **aprobado** |
| `fk_logalq_logistica` | `logistica_alquiler_alquiler.id_logistica_alquiler` → `logistica_alquiler.id_logistica_alquiler` | 0 | 0 | **aprobado** |

Las 7 relaciones coinciden con la auditoría inicial. Antigravity declaró ausencia de huérfanos; confirmado personalmente.

---

## 2. Reconciliación de stock

Procedimiento (`OP`):

```sql
SELECT p.id_producto, p.stock_total, p.stock_alquilado,
       p.stock_total - p.stock_alquilado AS stock_disponible,
       COALESCE(x.cantidad_abiertos, 0) AS calculado_abiertos,
       p.stock_alquilado - COALESCE(x.cantidad_abiertos, 0) AS diferencia
FROM public.producto p
LEFT JOIN (
  SELECT d.id_producto, SUM(d.cantidad_productos) AS cantidad_abiertos
  FROM public.detalle_alquiler d
  JOIN public.alquiler a ON a.id_alquiler = d.id_alquiler
  WHERE d.estado_registro = TRUE
    AND a.estado_alquiler IN ('pendiente','activo','vencido')
  GROUP BY d.id_producto
) x ON x.id_producto = p.id_producto
ORDER BY p.id_producto;
```

| `id_producto` | `stock_total` | `stock_alquilado` | Disponible | Calculado en alquileres abiertos | Diferencia |
|---:|---:|---:|---:|---:|---:|
| 1 | 60 | 18 | 42 | 18 | 0 |
| 2 | 120 | 12 | 108 | 12 | 0 |
| 3 | 40 | 7 | 33 | 7 | 0 |
| 4 | 30 | 5 | 25 | 5 | 0 |
| 5 | 25 | 2 | 23 | 2 | 0 |
| 6 | 35 | 4 | 31 | 4 | 0 |
| 7 | 20 | 4 | 16 | 4 | 0 |
| 8 | 200 | 16 | 184 | 16 | 0 |
| 9 | 2 | 0 | 2 | 0 | 0 |
| 10 | 10 | 0 | 10 | 0 | 0 |
| **Total** | **542** | **68** | **474** | **68** | **0** |

| Verificado | Consulta / procedimiento | Resultado obtenido | Esperado | Origen | Estado |
|---|---|---|---|---|---|
| Coherencia por producto | Consulta anterior | `0` discrepancias en 10/10 productos | `0` (`AG`: H-DB-04 corregido) | OP | **aprobado** |
| Stock en rango válido | `stock_alquilado < 0 OR stock_alquilado > stock_total` | `0` productos | `0` | OP | **aprobado** |
| Vista vs stock bruto | `vw_dashboard_operativo` y `pg_get_viewdef` | Vista reporta 532; bruto 542; diferencia 10 = producto inactivo | Coherente con filtro `estado_registro = true` | OP | **aprobado** |

---

## 3. Coherencia alquiler–detalle y estados

| Verificado | Consulta / procedimiento (resumen) | Resultado obtenido | Esperado | Origen | Estado |
|---|---|---:|---:|---|---|
| Alquileres sin detalle activo | `NOT EXISTS (SELECT 1 FROM detalle_alquiler d WHERE d.id_alquiler=a.id_alquiler AND d.estado_registro)` | 0 | 0 | OP | **aprobado** |
| Detalles inactivos | `count(*) FROM detalle_alquiler WHERE estado_registro=FALSE` | 0 | 0 | OP | **aprobado** |
| Estados inválidos | `estado_alquiler NOT IN ('pendiente','activo','vencido','recogido','terminado','cancelado')` | 0 | 0 | OP | **aprobado** |
| Unidades incompatibles | `SEMANA` sin múltiplo de 7 o `MES` sin múltiplo de 30 sobre `tiempo_alquiler_dias` | 0 | 0 | OP | **aprobado** |
| IDs de detalle duplicados | `GROUP BY id_detalle_alquiler HAVING count(*)>1` | 0 | 0 | OP | **aprobado** |

---

## 4. Coherencia logística

| Verificado | Consulta / procedimiento (resumen) | Resultado obtenido | Esperado | Origen | Estado |
|---|---|---:|---:|---|---|
| Movimientos sin relación puente | `NOT EXISTS` sobre `logistica_alquiler_alquiler` | 0 | 0 | OP | **aprobado** |
| Puente con logística inexistente | `NOT EXISTS` inverso | 0 | 0 | OP | **aprobado** |
| Puente con alquiler inexistente | `NOT EXISTS` inverso | 0 | 0 | OP | **aprobado** |
| Relaciones compuestas duplicadas | `GROUP BY (id_logistica_alquiler,id_alquiler) HAVING count(*)>1` | 0 | 0 | OP | **aprobado** |
| Enlaces por movimiento | `GROUP BY tipo_movimiento, número_de_enlaces` | `ENTREGA` 7 con 1 enlace, `RECOGIDA` 2 con 1, `GASTO` 5 con 1 | 1 enlace cada uno | OP | **aprobado** |
| Movimientos incompatibles con estado | `ENTREGA` en `pendiente`/`cancelado` o `RECOGIDA` fuera de `recogido`/`terminado` | 0 | 0 | OP | **aprobado** |
| Encargado logístico con rol no esperado | `NOT EXISTS` con roles internos | 0 | 0 | OP | **aprobado** |

---

## 5. Actores de auditoría y duplicados

| Verificado | Consulta / procedimiento | Resultado obtenido | Esperado | Origen | Estado |
|---|---|---:|---:|---|---|
| Eventos con actor NULL | `count(*) FILTER (WHERE id_usuario_accion IS NULL)` | 0 | 0 (`AG`: H-DB-06 corregido en datos) | OP | **aprobado** |
| Eventos con actor inexistente | `NOT EXISTS (SELECT 1 FROM usuario u WHERE u.id_usuario=au.id_usuario_accion)` | 0 | 0 (`AG`: H-DB-05 corregido en datos) | OP | **aprobado** |
| Duplicados en PK/composite | `GROUP BY ... HAVING count(*)>1` para 8 claves | 0 en todas | 0 | OP | **aprobado** |

Detalle de actores: `DEMO-ADM-01` 27, `DEMO-FAC-01` 9, `DEMO-FAC-02` 44, `DEMO-LOG-01` 14, `DEMO-LOG-02` 3; total 97.

---

## 6. Alineación de secuencias

| Secuencia | `last_value` | `is_called` | `MAX(id)` | `cache_size` | Interpretación | Estado |
|---|---:|---|---:|---:|---|---|
| `alquiler_id_alquiler_seq` | 9 | true | 8 | 1 | 1 valor por delante | **observado** |
| `auditoria_sistema_id_auditoria_seq` | 103 | true | 97 | 1 | 6 valores por delante | **observado** |
| `detalle_alquiler_id_detalle_alquiler_seq` | 21 | true | 20 | 1 | 1 valor por delante | **observado** |
| `logistica_alquiler_id_logistica_alquiler_seq` | 14 | true | 14 | 1 | Alineada | **aprobado** |
| `producto_id_producto_seq` | 10 | true | 10 | 1 | Alineada | **aprobado** |

| Verificado | Consulta / procedimiento | Resultado obtenido | Resultado esperado | Origen | Estado |
|---|---|---|---|---|---|
| Criterio declarado por Antigravity | `last_value >= MAX(id)` | 5/5 cumplen | `last_value >= MAX(id)` | OP | **aprobado** |
| Igualdad estricta frente a auditoría inicial | `last_value = MAX(id)` | 2/5 cumplen; 3 quedaron por delante | Igualdad en 5/5 (comportamiento inicial) | OP | **observado** |

No hay solapamiento ni riesgo de inserción duplicada: `cycle=false`, `cache_size=1` y `is_called=true`. Los huecos son compatibles con `nextval` consumido en transacciones revertidas (las secuencias no son transaccionales), incluida la prueba de H-DB-03 que Antigravity declaró como revertida; la causa exacta no es verificable con la evidencia disponible.

---

## 7. Resultado global

No se detectaron inconsistencias referenciales, de stock, de estados, de actores ni de identificadores. La única diferencia respecto de la auditoría inicial es el desfase hacia adelante de tres secuencias, clasificado como `observado` y no bloqueante para la integridad de los datos actuales.
