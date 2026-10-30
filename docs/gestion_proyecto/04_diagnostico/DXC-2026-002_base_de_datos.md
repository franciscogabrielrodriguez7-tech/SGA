# 02 — Base de Datos

> **Motor:** PostgreSQL 14+ (validado contra PostgreSQL 16)
> **Fuente de verdad del DDL:** `database/01_esquema/01_tablas.sql` y `database/01_esquema/02_funciones_y_triggers.sql`
> **Mapeo ORM:** `sga_backend_jwt/app/models/` (SQLAlchemy 2.0.52, estilo `Column` clásico)
> **Migraciones:** Alembic — revisión base `d4f74f3d4896_baseline_schema` (`sga_backend_jwt/alembic/versions/`)

> ⚠️ **Documento generado el 2026-10-19 sobre la rama local `dev` @ `14726ad`
> (anterior al commit `12760d4`).** Contenido parcialmente desactualizado:
> cita baseline `d4f74f3d4896` (**eliminado**; reemplazado por `0001_initial_schema`, F-32).
> Contrasta con [AUD-2026-002](../01_auditorias/AUD-2026-002_auditoria_dev_remota_12760d4.md) para el estado vigente.
---

## 1. Convenciones del esquema

| Convención | Regla aplicada |
|---|---|
| Nombres de tabla | `snake_case` **singular** (`usuario`, `producto`, `alquiler`, `detalle_alquiler`, `logistica_alquiler`, `logistica_alquiler_alquiler`, `auditoria_sistema`). |
| Claves primarias | `SERIAL` (entero autoincremental) salvo `usuario.id_usuario`, que es **PK natural** = número de documento (CC/NIT/CE/PPT). |
| Nombres de columna | `snake_case` con sufijo de la entidad: `id_producto`, `nombre_producto`, `fecha_creacion`, `estado_registro`. |
| Auditoría ligera | Toda tabla de negocio tiene `estado_registro BOOLEAN DEFAULT TRUE` (borrado lógico), `fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP` y `fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP`. |
| Timestamps | `fecha_actualizacion` **no** se actualiza desde la aplicación: la mantiene el trigger `trg_timestamp_*` (`BEFORE UPDATE`). |
| Tipos monetarios | `NUMERIC(10,2)` (nunca `float`). En la API se serializan a `float` JSON (`app/utils/response.py:convertir_json`). |
| Valores por defecto de dominio | Siempre declarados con `server_default` para que la BD sea consistente aunque se escriba fuera de la API. |
| Restricciones | `CHECK` de dominio en la BD + validación Pydantic en la API (doble barrera, con la BD como autoridad final). |

---

## 2. Diagrama relacional (ER) en texto

```
                    ┌────────────────────┐
                    │      usuario       │  (PK: id_usuario VARCHAR(20))
                    │  rol_usuario       │──► admin
                    │                    │──► encargado_facturacion
                    │                    │──► encargado_logistico
                    │                    │──► cliente
                    └─────────┬──────────┘
          ┌───────────────────┼──────────────────────┬───────────────────────┐
          │ 1:N              │ 1:N                  │ 1:N                  │ 1:N
          ▼                  ▼                      ▼                       ▼
  ┌───────────────┐  ┌──────────────┐   ┌──────────────────┐   ┌──────────────────────┐
  │   alquiler    │  │  producto    │   │ logistica_       │   │ auditoria_sistema    │
  │ id_usuario_   │  │ id_producto  │   │  alquiler        │   │ id_usuario_accion →  │
  │  creador ─────┤  │ stock_total  │   │ id_usuario_      │   │  usuario (informal) │
  │ id_usuario_   │  │ stock_       │   │  logistico ──────┤   │ datos_anteriores    │
  │  cliente ─────┤  │  alquilado   │   │ tipo_movimiento  │   │  (JSONB)            │
  │ estado_       │  │ unidad_     │   │  ENTREGA|RECOGIDA │   │ datos_nuevos (JSONB) │
  │  alquiler     │  │  minima_    │   │  |GASTO            │   └──────────────────────┘
  └───────┬───────┘  │  alquiler   │   └────────┬─────────┘
          │ 1:N      └──────▲─────┘            │ 1:N
          ▼               │ 1:N                ▼
  ┌────────────────────┐  │        ┌───────────────────────────────┐
  │  detalle_alquiler  │──┘        │ logistica_alquiler_alquiler   │
  │ id_alquiler ───────┘           │ (PK compuesta)                │
  │ id_producto ───────────────────►│ id_logistica_alquiler → 1:N   │
  │ precio_conjunto                 │ id_alquiler        → 1:N       │
  │ es_producto_extra               └───────────────────────────────┘
  └────────────────────┘
```

**Relaciones clave:**
- `usuario` ↔ `alquiler`: dos FK desde `alquiler` (`id_usuario_creador`, `id_usuario_cliente`), ambas `ON UPDATE CASCADE ON DELETE RESTRICT`.
- `detalle_alquiler` es la tabla puente N:M entre `alquiler` y `producto`, enriquecida con el precio pactado y la marca de extra.
- `logistica_alquiler_alquiler` es la tabla puente N:M entre `logistica_alquiler` y `alquiler`.
- `auditoria_sistema` no tiene FK declarada (deliberadamente): es polimórfica y debe sobrevivir a borrados.

---

## 3. Diccionario de datos

### 3.1 `usuario`

Personas del sistema: personal interno y clientes, diferenciados por `rol_usuario`.

| Columna | Tipo SQL | Null | Default | Restricciones / Notas |
|---|---|---|---|---|
| `id_usuario` | `VARCHAR(20)` | NO | — | **PK natural**. Documento de identidad. |
| `rol_usuario` | `VARCHAR(30)` | NO | `'cliente'` | `CHECK chk_usuario_rol IN ('admin','encargado_facturacion','encargado_logistico','cliente')` |
| `nombres_usuario` | `VARCHAR(100)` | NO | — | |
| `apellidos_usuario` | `VARCHAR(100)` | NO | — | |
| `email_usuario` | `VARCHAR(100)` | YES | `NULL` | `UNIQUE`. Permite clientes sin credenciales. |
| `telefono_usuario` | `VARCHAR(20)` | NO | — | `UNIQUE`. Es también el identificador de login alternativo. |
| `contrasena_usuario` | `VARCHAR(255)` | YES | `NULL` | Hash **bcrypt** (nunca texto plano). `NULL` en clientes sin acceso. |
| `tipo_documento` | `VARCHAR(20)` | NO | — | `CHECK chk_usuario_tipo_documento IN ('CC','CE','NIT','PPT')` |
| `estado_registro` | `BOOLEAN` | NO | `TRUE` | Borrado lógico. |
| `fecha_creacion` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | |
| `fecha_actualizacion` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Mantenida por trigger. |

**Índices:** `idx_usuario_rol` (parcial, `WHERE estado_registro IS TRUE`), `idx_usuario_email` (parcial, `WHERE email_usuario IS NOT NULL`), más los implícitos de las UNIQUE de `email_usuario` y `telefono_usuario`.

**Modelo ORM:** `app/models/usuario.py` → `Usuario`.

---

### 3.2 `producto`

Catálogo de piezas de andamiaje con control de inventario.

| Columna | Tipo SQL | Null | Default | Restricciones / Notas |
|---|---|---|---|---|
| `id_producto` | `SERIAL` | NO | — | PK |
| `nombre_producto` | `VARCHAR(100)` | NO | — | |
| `descripcion_producto` | `VARCHAR(300)` | YES | `NULL` | Opcional (registro rápido de piezas). |
| `precio_base_producto` | `NUMERIC(10,2)` | NO | — | `CHECK chk_producto_precio >= 0`. Se interpreta **siempre por `unidad_minima_alquiler`**. |
| `precio_base_extra` | `NUMERIC(10,2)` | NO | `0.00` | `CHECK chk_producto_precio_extra >= 0`. Precio cuando el ítem se agrega como extra. El backend lo iguala a `precio_base_producto` si no se envía. |
| `stock_total` | `INTEGER` | NO | — | `CHECK chk_producto_stock_total >= 0`. Stock físico en bodega. |
| `stock_alquilado` | `INTEGER` | NO | `0` | `CHECK chk_producto_stock_alquilado (>= 0 AND <= stock_total)`. **Nunca se escribe desde la API**: lo mantiene `trg_sincronizar_stock_producto`. |
| `unidad_minima_alquiler` | `VARCHAR(10)` | NO | `'DIA'` | `CHECK chk_producto_unidad_minima_alquiler IN ('DIA','SEMANA','MES')`. Jerarquía DIA < SEMANA < MES. |
| `estado_registro` | `BOOLEAN` | NO | `TRUE` | Borrado lógico. |
| `fecha_creacion` / `fecha_actualizacion` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | |

**Índices:** `idx_producto_nombre` (parcial, `WHERE estado_registro IS TRUE`).

**Modelo ORM:** `app/models/producto.py` → `Producto`.

---

### 3.3 `alquiler`

Contrato de alquiler: es el agregado raíz del dominio.

| Columna | Tipo SQL | Null | Default | Restricciones / Notas |
|---|---|---|---|---|
| `id_alquiler` | `SERIAL` | NO | — | PK |
| `id_usuario_creador` | `VARCHAR(20)` | NO | — | FK → `usuario(id_usuario)` `ON UPDATE CASCADE ON DELETE RESTRICT`. **Inyectado desde el JWT**, nunca del payload. |
| `id_usuario_cliente` | `VARCHAR(20)` | NO | — | FK → `usuario(id_usuario)` `ON UPDATE CASCADE ON DELETE RESTRICT`. |
| `estado_alquiler` | `VARCHAR(30)` | NO | `'pendiente'` | `CHECK chk_alquiler_estado IN ('pendiente','activo','vencido','recogido','terminado','cancelado')` |
| `barrio` | `VARCHAR(100)` | NO | — | Barrio de la obra. |
| `direccion` | `VARCHAR(255)` | NO | — | Dirección de la obra. |
| `deposito` | `NUMERIC(10,2)` | NO | — | `CHECK chk_alquiler_deposito >= 0`. |
| `precio_alquiler` | `NUMERIC(10,2)` | NO | — | `CHECK chk_alquiler_precio >= 0`. **Campo controlado por el staff**; NO se recalcula como `SUM(precio_conjunto)`. |
| `fecha_inicio` | `DATE` | NO | — | No puede ser anterior a hoy (`trg_validar_fecha_inicio`). |
| `tiempo_alquiler_dias` | `INTEGER` | NO | — | `CHECK chk_alquiler_tiempo_dias > 0`. Única unidad temporal persistida. |
| `se_lleva` | `BOOLEAN` | NO | `TRUE` | Transporte a cargo de la empresa. |
| `se_recoge` | `BOOLEAN` | NO | `TRUE` | Recogida a cargo de la empresa. |
| `estado_registro` | `BOOLEAN` | NO | `TRUE` | Borrado lógico. |
| `fecha_creacion` / `fecha_actualizacion` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | |

**Columna calculada (no persiste):** `fecha_vencimiento = fecha_inicio + (tiempo_alquiler_dias - 1)`. Se computa en la capa de aplicación (`app/utils/tiempo.py`) y se expone en la API.

**Índices:** `idx_alquiler_cliente`, `idx_alquiler_creador`, `idx_alquiler_estado` (parcial `WHERE estado_registro IS TRUE`), `idx_alquiler_fecha_inicio`, `idx_alquiler_fecha_vencimiento` (índice funcional sobre `fecha_inicio + tiempo_alquiler_dias - 1`).

**Modelo ORM:** `app/models/alquiler.py` → `Alquiler`, con relaciones `creador` y `cliente` hacia `Usuario` (`foreign_keys` explícitas para desambiguar la doble FK).

---

### 3.4 `detalle_alquiler`

Líneas de producto de un alquiler.

| Columna | Tipo SQL | Null | Default | Restricciones / Notas |
|---|---|---|---|---|
| `id_detalle_alquiler` | `SERIAL` | NO | — | PK |
| `id_alquiler` | `INTEGER` | NO | — | FK → `alquiler(id_alquiler)` `CASCADE / RESTRICT` |
| `id_producto` | `INTEGER` | NO | — | FK → `producto(id_producto)` `CASCADE / RESTRICT` |
| `precio_conjunto` | `NUMERIC(10,2)` | NO | — | `CHECK chk_detalle_precio_conjunto >= 0`. "Fotografía" del precio pactado al firmar. |
| `cantidad_productos` | `INTEGER` | NO | — | `CHECK chk_detalle_cantidad > 0` |
| `es_producto_extra` | `BOOLEAN` | NO | `FALSE` | `FALSE` = componente base del conjunto; `TRUE` = adicional cobrado. |
| `estado_registro` | `BOOLEAN` | NO | `TRUE` | Borrado lógico. |
| `fecha_creacion` / `fecha_actualizacion` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | |

**Índices:**
- `idx_unico_producto_alquiler` — **UNIQUE parcial** sobre `(id_alquiler, id_producto) WHERE es_producto_extra = FALSE`: un producto solo puede aparecer una vez como línea base por alquiler; puede repetirse si es extra.
- `idx_detalle_alquiler_id` — aceleración de la vista/factura por alquiler.
- `idx_detalle_producto_id` — trazabilidad producto → alquileres.

**Modelo ORM:** `app/models/detalle_alquiler.py` → `DetalleAlquiler`.

---

### 3.5 `logistica_alquiler`

Movimientos logísticos: entrega, recogida o gasto puro.

| Columna | Tipo SQL | Null | Default | Restricciones / Notas |
|---|---|---|---|---|
| `id_logistica_alquiler` | `SERIAL` | NO | — | PK |
| `id_usuario_logistico` | `VARCHAR(20)` | NO | — | FK → `usuario(id_usuario)` `CASCADE / RESTRICT`. **Inyectado desde el JWT**. |
| `tipo_movimiento` | `VARCHAR(10)` | NO | — | `CHECK chk_logistica_tipo_movimiento IN ('ENTREGA','RECOGIDA','GASTO')` |
| `fecha_gasto` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha del movimiento/gasto. |
| `descripcion_gasto_logistico` | `TEXT` | YES | `NULL` | Concepto (flete, combustible…). |
| `valor_gasto_logistico` | `NUMERIC(10,2)` | NO | `0.00` | `CHECK chk_logistica_valor_gasto >= 0` |
| `observaciones_logistica_alquiler` | `TEXT` | YES | `NULL` | Notas de campo. |
| `estado_registro` | `BOOLEAN` | NO | `TRUE` | Borrado lógico. |
| `fecha_creacion` / `fecha_actualizacion` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | |

> **Cambio de diseño relevante:** esta tabla **ya no tiene** `id_alquiler` directo ni `es_recogida`. La association con el alquiler vive en la tabla puente.

**Índice:** `idx_logistica_usuario` sobre `id_usuario_logistico`.

**Modelo ORM:** `app/models/logistica_alquiler.py` → `LogisticaAlquiler`.

---

### 3.6 `logistica_alquiler_alquiler` (tabla puente)

| Columna | Tipo SQL | Null | Restricciones / Notas |
|---|---|---|---|
| `id_logistica_alquiler` | `INTEGER` | NO | PK (1/2) + FK → `logistica_alquiler` `ON UPDATE CASCADE ON DELETE CASCADE` |
| `id_alquiler` | `INTEGER` | NO | PK (2/2) + FK → `alquiler` `ON UPDATE CASCADE ON DELETE RESTRICT` |

**PK compuesta** `(id_logistica_alquiler, id_alquiler)`. Índice adicional `idx_logalq_alquiler(id_alquiler)`.

**Reglas:** `ENTREGA`/`RECOGIDA` → exactamente 1 fila (lo garantiza la aplicación, no un constraint); `GASTO` → 1..N filas.

**Modelo ORM:** `app/models/logistica_alquiler_alquiler.py` → `LogisticaAlquilerAlquiler`.

---

### 3.7 `auditoria_sistema`

Registro centralizado de todos los cambios en las tablas de negocio.

| Columna | Tipo SQL | Null | Default | Restricciones / Notas |
|---|---|---|---|---|
| `id_auditoria` | `SERIAL` | NO | — | PK. |
| `nombre_tabla` | `VARCHAR(50)` | NO | — | `'usuario'`, `'producto'`, `'alquiler'`, `'detalle_alquiler'`, `'logistica_alquiler'`. |
| `tipo_operacion` | `VARCHAR(10)` | NO | — | `CHECK chk_auditoria_operacion IN ('INSERT','UPDATE','DELETE')` |
| `id_registro_afectado` | `VARCHAR(50)` | NO | — | PK del registro, convertida a texto. |
| `datos_anteriores` | `JSONB` | YES | `NULL` | `NULL` en `INSERT`. |
| `datos_nuevos` | `JSONB` | YES | `NULL` | `NULL` en `DELETE`. |
| `id_usuario_accion` | `VARCHAR(20)` | YES | `NULL` | Poblado desde `current_setting('app.usuario_actual')`, inyectado por la API. |
| `fecha_accion` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | |

**Índices:** `idx_auditoria_tabla_registro (nombre_tabla, id_registro_afectado)`, `idx_auditoria_usuario (id_usuario_accion) WHERE id_usuario_accion IS NOT NULL`, `idx_auditoria_fecha (fecha_accion)`.

**Modelo ORM:** `app/models/auditoria_sistema.py` → `AuditoriaSistema` (usa `sqlalchemy.dialects.postgresql.JSONB`).

---

## 4. Catálogo de funciones PL/pgSQL

Archivo: `database/01_esquema/02_funciones_y_triggers.sql`.

| # | Función | Tipo de trigger | Momento | Tabla | Propósito |
|---|---|---|---|---|---|
| F-01 | `fn_auditar_cambios()` | `AFTER INSERT/UPDATE/DELETE` | AFTER | `usuario`, `producto`, `alquiler`, `detalle_alquiler`, `logistica_alquiler` | Inserta el evento en `auditoria_sistema` con diff JSONB y autor. |
| F-02 | `fn_actualizar_timestamp()` | `BEFORE UPDATE` | BEFORE | las 5 tablas de negocio | Fuerza `fecha_actualizacion = CURRENT_TIMESTAMP`. |
| F-03 | `fn_impedir_autodesactivacion_admin()` | `BEFORE UPDATE OF estado_registro` | BEFORE | `usuario` | Un admin no puede desactivar su propia cuenta. |
| F-04 | `fn_garantizar_minimo_un_admin()` | `BEFORE UPDATE OF estado_registro` | BEFORE | `usuario` | El sistema no puede quedar sin ningún admin activo. |
| F-05 | `fn_validar_modificacion_producto()` | `BEFORE UPDATE OR DELETE` | BEFORE | `producto` | Prohíbe baja de producto con stock en obra; impide bajar `stock_total` por debajo de `stock_alquilado`. |
| F-06 | `fn_validar_detalle_alquiler()` | `BEFORE INSERT OR UPDATE` | BEFORE | `detalle_alquiler` | Bloquea cambios en alquileres cerrados; impide cambiar `id_producto`; valida stock disponible. |
| F-07 | `fn_sincronizar_stock_producto()` | `AFTER INSERT/UPDATE/DELETE` | AFTER | `detalle_alquiler` | **Sincroniza `producto.stock_alquilado`.** |
| F-08 | `fn_verificar_usuario_activo()` | `BEFORE INSERT OR UPDATE` | BEFORE | `alquiler` | El creador del alquiler debe estar activo. |
| F-09 | `fn_validar_fechas_alquiler()` | `BEFORE INSERT` | BEFORE | `alquiler` | `fecha_inicio >= CURRENT_DATE`. |
| F-10 | `fn_cerrar_alquiler_devolver_stock()` | `AFTER UPDATE` | AFTER | `alquiler` | Al cerrar (terminado/recogido/cancelado) devuelve el stock al inventario. |
| F-11 | `fn_prohibir_reabrir_alquiler()` | `BEFORE UPDATE OF estado_alquiler` | BEFORE | `alquiler` | Impide reabrir un alquiler cerrado salvo autorización explícita. |
| F-12 | `fn_admin_reabrir_alquiler(p_id_alquiler)` | **Procedimiento** (no trigger) | — | `alquiler` | Reapertura administrativa controlada. |

---

## 5. Mecánica de los triggers: sincronización del stock de andamios

Esta es la pieza central de la integridad del inventario. El principio es: **`producto.stock_alquilado` es un campo derivado y solo la BD lo modifica.**

### 5.1 `trg_sincronizar_stock_producto` (AFTER INSERT OR UPDATE OR DELETE ON `detalle_alquiler`)

```sql
IF TG_OP = 'INSERT' THEN
    IF NEW.estado_registro = TRUE THEN
        UPDATE producto SET stock_alquilado = stock_alquilado + NEW.cantidad_productos
        WHERE id_producto = NEW.id_producto;
    END IF;

ELSIF TG_OP = 'UPDATE' THEN
    -- Borrado lógico
    IF OLD.estado_registro = TRUE AND NEW.estado_registro = FALSE THEN
        UPDATE producto SET stock_alquilado = stock_alquilado - OLD.cantidad_productos
        WHERE id_producto = OLD.id_producto;
    -- Reactivación
    ELSIF OLD.estado_registro = FALSE AND NEW.estado_registro = TRUE THEN
        UPDATE producto SET stock_alquilado = stock_alquilado + NEW.cantidad_productos
        WHERE id_producto = NEW.id_producto;
    -- Cambio de cantidad
    ELSIF OLD.estado_registro = TRUE AND NEW.estado_registro = TRUE THEN
        UPDATE producto SET stock_alquilado = stock_alquilado
                             + (NEW.cantidad_productos - OLD.cantidad_productos)
        WHERE id_producto = NEW.id_producto;
    END IF;

ELSIF TG_OP = 'DELETE' THEN
    IF OLD.estado_registro = TRUE THEN
        UPDATE producto SET stock_alquilado = stock_alquilado - OLD.cantidad_productos
        WHERE id_producto = OLD.id_producto;
    END IF;
END IF;
RETURN NULL;
```

**Matriz de efectos sobre `stock_alquilado`:**

| Evento sobre `detalle_alquiler` | Δ en `producto.stock_alquilado` |
|---|---|
| INSERT de línea activa | `+ cantidad_productos` |
| INSERT de línea inactiva (`estado_registro = FALSE`) | `0` |
| UPDATE de cantidad (activa → activa) | `+ (nuevo − viejo)` |
| UPDATE con borrado lógico (activa → inactiva) | `− cantidad_productos` (la de OLD) |
| UPDATE con reactivación (inactiva → activa) | `+ cantidad_productos` |
| DELETE físico de línea activa | `− cantidad_productos` |
| DELETE físico de línea inactiva | `0` |

> `RETURN NULL` en un trigger `AFTER` es correcto: el valor de retorno se ignora en triggers AFTER a nivel de fila.

**Invariante final:** `0 ≤ producto.stock_alquilado ≤ producto.stock_total`, garantizada por el `CHECK chk_producto_stock_alquilado`. Si una operación bruise el invariante, la transacción completa se aborta.

### 5.2 `trg_validar_detalle_alquiler` (BEFORE INSERT OR UPDATE) — control previo

Se ejecuta **antes** del trigger de sincronización, de modo que una operación inválida nunca llega a alterar el stock:

1. **Estado del alquiler:** si `alquiler.estado_alquiler IN ('terminado','recogido','cancelado')` → `RAISE EXCEPTION 'Operación denegada. No se pueden modificar ítems de un alquiler en estado "%".'`
2. **Producto inmutable en una línea viva:** si en un UPDATE `NEW.id_producto != OLD.id_producto` → `RAISE EXCEPTION 'No se permite cambiar el producto de una línea activa. Debe eliminar la línea y agregar una nueva.'`
3. **Stock suficiente:** calcula `v_diferencia` (`= NEW.cantidad` en INSERT, `= NEW.cantidad − OLD.cantidad` en UPDATE) y lo compara con `stock_total − stock_alquilado`. Si `v_diferencia > v_stock_disponible` → `RAISE EXCEPTION 'Stock insuficiente para el producto "%". Disponible: %, Solicitado adicional: %'`.

### 5.3 `trg_cerrar_alquiler_devolver_stock` (AFTER UPDATE ON `alquiler`)

Al cambiar de un estado no final a un estado final, devuelve el stock de todas las líneas activas del alquiler:

```sql
IF OLD.estado_alquiler NOT IN ('terminado','recogido','cancelado')
   AND NEW.estado_alquiler IN ('terminado','recogido','cancelado') THEN
    UPDATE producto p
       SET stock_alquilado = p.stock_alquilado - d.cantidad_productos
      FROM detalle_alquiler d
     WHERE d.id_alquiler = NEW.id_alquiler
       AND d.id_producto = p.id_producto
       AND d.estado_registro = TRUE;
END IF;
```

> **Nota de diseño:** las líneas de `detalle_alquiler` permanecen activas; lo que se libera es el stock. Si más adelante se fizeran lógicas las líneas, el trigger de sincronización también lo detectaría y aplicaría una segunda resta. Hoy el diseño es "línea viva + stock liberado al cerrar".

### 5.4 `trg_validar_modificacion_producto` (BEFORE UPDATE OR DELETE ON `producto`)

- Prohíbe dar de baja (física o lógica) un producto con `stock_alquilado > 0`:
  `RAISE EXCEPTION 'Operación cancelada: El producto "%" tiene % unidades en obra. No se puede dar de baja.'`
- Impide que `stock_total` quede por debajo de `stock_alquilado`:
  `RAISE EXCEPTION 'Ajuste denegado para "%": El stock total (%) no puede ser menor al stock alquilado actualmente en obras (%).'`

### 5.5 `fn_admin_reabrir_alquiler(p_id_alquiler)` — procedimiento administrativo

Única vía autorizada para reabrir un alquiler cerrado (`terminado` / `recogido`); un `cancelado` **no** se puede reabrir.

Secuencia:
1. Verifica que el estado actual ≠ `'cancelado'` (de lo contrario, `RAISE EXCEPTION`).
2. Recorre las líneas activas y verifica stock libre real en bodega para cada producto; si falta, `RAISE EXCEPTION 'Reapertura denegada: El producto ID % no tiene suficiente stock libre en bodega (...)'`.
3. `PERFORM set_config('app.permitir_reapertura', 'true', true)` — habilita la sesión para saltar `trg_prohibir_reabrir_alquiler`.
4. `UPDATE alquiler SET estado_alquiler = 'activo'`.
5. Re-descuenta el stock: `stock_alquilado += cantidad` de cada línea activa.
6. `PERFORM set_config('app.permitir_reapertura', 'false', true)` — limpia la bandera.

`set_config(..., true)` es **transaccional** (equivalente a `SET LOCAL`): la autorización no sobrevive al commit, por lo que un usuario sin privilegios no puede reabrir alquileres de forma persistente.

> **Observación de auditoría:** la función existe y es documentada, pero **ningún endpoint de la API la invoca**. La reapertura de alquileres está expuesta únicamente vía `PATCH /alquileres/{id}/estado` (que aplica el grafo de transiciones), y el trigger `trg_prohibir_reabrir_alquiler` bloquea el paso desde estados finales. Es una funcionalidad accesible solo por consola SQL. Ver [`DXC-2026-005_reglas_negocio_rbac.md`](../04_diagnostico/DXC-2026-005_reglas_negocio_rbac.md) §7.

### 5.6 `fn_auditar_cambios()` — auditoría con identidad del JWT

Punto clave del diseño: el trigger **no puede leer el JWT**, así que lee la variable de sesión de PostgreSQL:

```sql
v_usuario_accion := NULLIF(current_setting('app.usuario_actual', true), '');
```

- `current_setting('app.usuario_actual', true)` devuelve `NULL` si la variable no existe (el `true` evita el error), y `NULLIF(..., '')` la normaliza.
- El backend la puebla con `SET LOCAL app.usuario_actual = :uid` (`app/utils/audit_context.py`), en la **misma transacción** y **antes** de cualquier `db.add()`.
- `SET LOCAL` garantiza que el valor muere con la transacción y no se filtra a otra request que reutilice la conexión del pool.

La función serializa el estado completo del registro con `to_jsonb(OLD)` / `to_jsonb(NEW)` y resuelve `id_registro_afectado` según `TG_TABLE_NAME` (con fallback `'DESCONOCIDO'`).

**Triggers asociados:** `trg_auditoria_usuario`, `trg_auditoria_producto`, `trg_auditoria_alquiler`, `trg_auditoria_detalle`, `trg_auditoria_logistica` (todos `AFTER INSERT OR UPDATE OR DELETE FOR EACH ROW`).

---

## 6. Catálogo completo de triggers

| Trigger | Tabla | Evento | Momento | Función |
|---|---|---|---|---|
| `trg_auditoria_usuario` | `usuario` | INSERT/UPDATE/DELETE | AFTER | `fn_auditar_cambios` |
| `trg_auditoria_producto` | `producto` | INSERT/UPDATE/DELETE | AFTER | `fn_auditar_cambios` |
| `trg_auditoria_alquiler` | `alquiler` | INSERT/UPDATE/DELETE | AFTER | `fn_auditar_cambios` |
| `trg_auditoria_detalle` | `detalle_alquiler` | INSERT/UPDATE/DELETE | AFTER | `fn_auditar_cambios` |
| `trg_auditoria_logistica` | `logistica_alquiler` | INSERT/UPDATE/DELETE | AFTER | `fn_auditar_cambios` |
| `trg_timestamp_usuario` | `usuario` | UPDATE | BEFORE | `fn_actualizar_timestamp` |
| `trg_timestamp_producto` | `producto` | UPDATE | BEFORE | `fn_actualizar_timestamp` |
| `trg_timestamp_alquiler` | `alquiler` | UPDATE | BEFORE | `fn_actualizar_timestamp` |
| `trg_timestamp_detalle` | `detalle_alquiler` | UPDATE | BEFORE | `fn_actualizar_timestamp` |
| `trg_timestamp_logistica` | `logistica_alquiler` | UPDATE | BEFORE | `fn_actualizar_timestamp` |
| `trg_impedir_autodesactivacion_admin` | `usuario` | UPDATE OF `estado_registro` | BEFORE | `fn_impedir_autodesactivacion_admin` |
| `trg_garantizar_minimo_un_admin` | `usuario` | UPDATE OF `estado_registro` | BEFORE | `fn_garantizar_minimo_un_admin` |
| `trg_validar_modificacion_producto` | `producto` | UPDATE/DELETE | BEFORE | `fn_validar_modificacion_producto` |
| `trg_validar_detalle_alquiler` | `detalle_alquiler` | INSERT/UPDATE | BEFORE | `fn_validar_detalle_alquiler` |
| `trg_sincronizar_stock_producto` | `detalle_alquiler` | INSERT/UPDATE/DELETE | AFTER | `fn_sincronizar_stock_producto` |
| `trg_verificar_usuario_activo_alquiler` | `alquiler` | INSERT/UPDATE | BEFORE | `fn_verificar_usuario_activo` |
| `trg_validar_fecha_inicio` | `alquiler` | INSERT | BEFORE | `fn_validar_fechas_alquiler` |
| `trg_cerrar_alquiler_devolver_stock` | `alquiler` | UPDATE | AFTER | `fn_cerrar_alquiler_devolver_stock` |
| `trg_prohibir_reabrir_alquiler` | `alquiler` | UPDATE OF `estado_alquiler` | BEFORE | `fn_prohibir_reabrir_alquiler` |

**Total: 19 triggers + 12 funciones/procedimientos.**

### 6.1 Variables de sesión de la BD

| Variable | Tipo de alcance | Propósito | Quien la escribe |
|---|---|---|---|
| `app.usuario_actual` | Transaccional (`SET LOCAL`) | Identidad del actor para la auditoría | `app/utils/audit_context.py` |
| `app.current_user_id` | Sesión | Detecta autodesactivación de admin | (no la escribe hoy el backend — ver *Deuda técnica*) |
| `app.permitir_reapertura` | Transaccional (`set_config(..., true)`) | Autoriza la reapertura administrativa | `fn_admin_reabrir_alquiler` |

> **Deuda técnica:** `fn_impedir_autodesactivacion_admin` lee `app.current_user_id`, pero el backend **nunca la escribe** (solo escribe `app.usuario_actual`). Consecuencia: la autodesactivación de un admin no se bloquea en la BD; el control efectivo depende únicamente del trigger `trg_garantizar_minimo_un_admin` (que sí impide quedarse sin admins) y del rol `SOLO_ADMIN` de la API. Recomendación: unificar ambas variables en `set_audit_context` o documentar explícitamente que `app.current_user_id` está obsoleta.

---

## 7. Scripts del paquete `database/`

| Archivo | Tipo | Estado de validación | Contenido |
|---|---|---|---|
| `01_esquema/01_tablas.sql` | DDL | ✅ Validado contra PostgreSQL 16 | 7 tablas (6 de negocio + 1 puente), 17 índices (incluido 1 único parcial y 1 funcional), 23 restricciones `CHECK`/`FK`/PK. |
| `01_esquema/02_funciones_y_triggers.sql` | PL/pgSQL | ✅ Validado end-to-end contra la API | 12 funciones/procedimientos y 19 triggers. |
| `01_esquema/03_seed_data.sql` | DML | ✅ Validado | 1 admin, 5 `encargado_facturacion`, 5 `encargado_logistico`, 10 clientes, 7 productos. Contraseña única de los empleados: <credencial de prueba — ver R-08> (hash bcrypt real, coste 12). |
| `01_esquema/04_plantillas.sql` | DML | ⚠️ **Esquema anterior** | Plantillas operativas (crear alquiler completo, registrar gasto, ajustes de inventario, alta/baja de usuarios). **No revisar antes de usar**: referencia columnas que ya no existen. |
| `01_esquema/05_consultas.sql` | DQL | ⚠️ **Esquema anterior** | Consultas analíticas de inventario, finanzas, logística y personal. Referencia `estado_usuario` y asumen `id_usuario_accion IS NULL`. |
| `01_esquema/06_vistas_dashboard.sql` | DDL (vista) | ⚠️ No expuesta por la API | `vw_dashboard_operativo`. |
| `03_documentacion/INDICE.md` | Doc | ⚠️ **Desactualizado** | Diccionario de la versión anterior del esquema (6 tablas, sin `precio_base_extra`, sin `unidad_minima_alquiler`, con `es_recogida` e `id_alquiler` directo en `logistica_alquiler`). |
| `06_demos_endpoints/*.sql` | DML | Informativo | 4 demos: crear alquiler, entrega/recogida, renovación, cancelación. |

**Orden de ejecución obligatoria:**

```bash
psql -d sga_db -f database/01_esquema/01_tablas.sql
psql -d sga_db -f database/01_esquema/02_funciones_y_triggers.sql
psql -d sga_db -f database/01_esquema/03_seed_data.sql     # opcional (datos de prueba)
psql -d sga_db -f database/01_esquema/04_plantillas.sql    # opcional, bajo demanda
psql -d sga_db -f database/01_esquema/06_vistas_dashboard.sql
# 05_consultas.sql NO se ejecuta: es solo de referencia.
```

---

## 8. Migraciones (Alembic)

| Revisión | Descripción | Contenido |
|---|---|---|
| `d4f74f3d4896` | `baseline_schema` (`down_revision = None`) | Crea tablas/índices/constraints y **elimina objetos preexistentes** (fix del esquema previo). |

**Punto crítico (H-08 en [`DXC-2026-001_arquitectura.md`](../04_diagnostico/DXC-2026-001_arquitectura.md)):** el `upgrade()` de esta revisión ejecuta `op.drop_table('auditoria_sistema')`, `op.drop_index(...)` y `op.drop_constraint(...)`. Como el esquema real se crea ejecutando los `.sql` a mano, **`alembic upgrade head` sobre una base ya inicializada por SQL destruye la tabla de auditoría y los índices/constraints**. El README del backend indica el procedimiento correcto para este repositorio:

```bash
alembic stamp head    # marcar la BD como alineada, sin ejecutar el DDL
```

**Recomendación:** migrar el proyecto a un modelo en el que `alembic upgrade head` sea la única vía de construcción del esquema, o versionar los `.sql` como migraciones Alembic (operaciones `op.execute()`), de modo que ambos mecanismos no puedan divergir.

> **Hallazgo adicional:** `alembic/env.py` importa los modelos `Usuario`, `Producto`, `Alquiler`, `DetalleAlquiler`, `LogisticaAlquiler` y `LogisticaAlquilerAlquiler`, pero **no importa `AuditoriaSistema`**. Como `target_metadata = Base.metadata` se construye con los modelos importados, un `alembic revision --autogenerate` generaría un `DROP TABLE auditoria_sistema` en la migración resultante. Debe añadirse el import antes de usar `--autogenerate`.

---

## 9. Consultas de lectura relevantes

### 9.1 Disponibilidad de un producto

```sql
SELECT id_producto, nombre_producto, stock_total, stock_alquilado,
       (stock_total - stock_alquilado) AS stock_disponible
FROM producto
WHERE id_producto = :id_producto;
```

Implementada en `app/controllers/producto_controller.py` mediante la constante compartida `SELECT_PRODUCTO_CAMPOS`, reutilizada por `inventario_controller` y `producto_controller`.

### 9.2 Vencimiento de un alquiler (fórmula única)

```sql
(fecha_inicio + tiempo_alquiler_dias - 1)
```

Generada desde `_plantilla_fecha_vencimiento()` en `app/utils/tiempo.py` en dos variantes (`FECHA_VENCIMIENTO_SQL` con alias `a.` y `FECHA_VENCIMIENTO_SQL_SIN_ALIAS` sin alias) para que la versión Python y la SQL no puedan divergir. Hay un índice funcional sobre esa misma expresión: `idx_alquiler_fecha_vencimiento`.

### 9.3 Historial de un alquiler (trazabilidad)

```sql
SELECT au.id_auditoria, au.tipo_operacion, au.datos_anteriores, au.datos_nuevos,
       au.id_usuario_accion, u.nombres_usuario, u.apellidos_usuario, au.fecha_accion
FROM auditoria_sistema au
LEFT JOIN usuario u ON u.id_usuario = au.id_usuario_accion
WHERE au.nombre_tabla = 'alquiler'
  AND au.id_registro_afectado = :id_alquiler
ORDER BY au.fecha_accion DESC, au.id_auditoria DESC;
```

### 9.4 Resumen semanal de gastos logísticos

```sql
SELECT date_trunc('week', fecha_gasto)::date AS semana_inicio,
       COUNT(*) AS cantidad_registros,
       SUM(valor_gasto_logistico) AS total_gasto
FROM logistica_alquiler
GROUP BY date_trunc('week', fecha_gasto)
ORDER BY semana_inicio DESC;
```

---

## 10. Buenas prácticas y recomendaciones

1. **Consultar `stock_disponible`, nunca `stock_total − stock_alquilado` a mano** en el cliente: la API ya expone el campo calculado.
2. **Nunca escribir `producto.stock_alquilado`** desde la aplicación ni desde SQL manual: el trigger lo sincroniza y una escritura manual desincroniza el inventario de forma silenciosa.
3. **No modificar `alquiler.estado_alquiler` con `UPDATE` directo** para estados finales: use el camino de la aplicación para que `trg_cerrar_alquiler_devolver_stock` devuelva el stock.
4. **Para reabrir un alquiler cerrado**, use `fn_admin_reabrir_alquiler(id)` desde consola, no un `UPDATE` directo (el trigger lo rechazaría).
5. **Antes de escribir en cualquier tabla auditada desde un script**, ejecute `SET LOCAL app.usuario_actual = '<documento>';` dentro de la transacción, para que la auditoría no quede sin autor.
6. **Corregir `INDICE.md`**, `04_plantillas.sql` y `05_consultas.sql` para alinearlos con el esquema vigente (ver H-03/H-04).
7. **Unificar `app.current_user_id` y `app.usuario_actual`** en `set_audit_context` para que la autodesactivación de admin quede realmente bloqueada en la BD.
8. **Versionar el esquema**: los `.sql` y Alembic no deben ser dos fuentes de verdad simultáneas.
