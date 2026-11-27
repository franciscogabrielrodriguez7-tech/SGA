# 04 — Funciones, triggers y vistas

Fuente: `pg_proc`, `pg_trigger` y `information_schema.views` de `sga_db`, esquema `public`. El código SQL se reproduce desde `pg_get_functiondef()` / `pg_get_viewdef()`.

## 1. Resumen

- 12 funciones PL/pgSQL, todas en `public`, ninguna `SECURITY DEFINER`.
- 19 triggers de usuario; **ninguno** incluye el evento `TRUNCATE`.
- 1 vista, 0 vistas materializadas.
- El único tipo de retorno no trigger es `fn_admin_reabrir_alquiler` (`void`).

## 2. Funciones

### `fn_actualizar_timestamp()`

- **Retorno:** `trigger`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Actualiza `fecha_actualizacion` a `CURRENT_TIMESTAMP` en operaciones UPDATE de las tablas auditadas.

```sql
CREATE OR REPLACE FUNCTION public.fn_actualizar_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
```

### `fn_admin_reabrir_alquiler(p_id_alquiler integer)`

- **Retorno:** `void`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Procedimiento de reversión para reabrir un alquiler cerrado por un administrador; no aparece asociado a ningún trigger de usuario en el catálogo.

```sql
CREATE OR REPLACE FUNCTION public.fn_admin_reabrir_alquiler(p_id_alquiler integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    r RECORD;
    v_stock_total INT;
    v_stock_alquilado INT;
    v_stock_disponible INT;
    v_estado_actual VARCHAR(30);
BEGIN
    -- A. Verificar que el estado no sea 'cancelado'
    SELECT estado_alquiler INTO v_estado_actual FROM alquiler WHERE id_alquiler = p_id_alquiler;
    IF v_estado_actual = 'cancelado' THEN
        RAISE EXCEPTION 'Operación denegada: No se puede reabrir un alquiler que fue cancelado (anulado). Solo se pueden reabrir contratos terminados o recogidos.';
    END IF;

    -- B. Verificar disponibilidad real en bodega
    FOR r IN (
        SELECT id_producto, cantidad_productos 
        FROM detalle_alquiler 
        WHERE id_alquiler = p_id_alquiler AND estado_registro = TRUE
    ) LOOP
        SELECT stock_total, stock_alquilado INTO v_stock_total, v_stock_alquilado
        FROM producto WHERE id_producto = r.id_producto;

        v_stock_disponible := v_stock_total - v_stock_alquilado;

        IF v_stock_disponible < r.cantidad_productos THEN
            RAISE EXCEPTION 'Reapertura denegada: El producto ID % no tiene suficiente stock libre en bodega (% disponibles, % requeridos).', 
                r.id_producto, v_stock_disponible, r.cantidad_productos;
        END IF;
    END LOOP;

    -- B. Habilitar sesión para saltar restricción
    PERFORM set_config('app.permitir_reapertura', 'true', true);

    -- C. Revertir estado a 'activo'
    UPDATE alquiler 
    SET estado_alquiler = 'activo' 
    WHERE id_alquiler = p_id_alquiler;

    -- D. Re-descontar el stock
    UPDATE producto p
    SET stock_alquilado = p.stock_alquilado + d.cantidad_productos
    FROM detalle_alquiler d
    WHERE d.id_alquiler = p_id_alquiler 
      AND d.id_producto = p.id_producto 
      AND d.estado_registro = TRUE;

    -- E. Limpiar sesión
    PERFORM set_config('app.permitir_reapertura', 'false', true);
END;
$function$
```

### `fn_auditar_cambios()`

- **Retorno:** `trigger`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Inserta una fila en `auditoria_sistema` con OLD/NEW en JSONB y el actor leído de `current_setting('app.usuario_actual', true)`.

```sql
CREATE OR REPLACE FUNCTION public.fn_auditar_cambios()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_id_afectado VARCHAR(50);
    v_datos_viejos JSONB := NULL;
    v_datos_nuevos JSONB := NULL;
    -- [FIX SGA-BACKEND-JWT-3]: auditoria_sistema.id_usuario_accion existe en
    -- la tabla pero esta función nunca lo poblaba (el INSERT original no
    -- incluía la columna, así que siempre quedaba NULL). Esto contradice la
    -- regla de negocio de "auditoría inyectada desde el JWT". Como un
    -- trigger de PostgreSQL no puede leer el token JWT directamente, el
    -- backend deja el id_usuario autenticado en una variable de sesión
    -- (SET LOCAL app.usuario_actual = '<id_usuario>', ver
    -- app/utils/audit_context.py) al inicio de cada transacción de
    -- escritura, y este trigger simplemente la lee aquí.
    v_usuario_accion VARCHAR(20);
BEGIN
    v_usuario_accion := NULLIF(current_setting('app.usuario_actual', true), '');

    IF (TG_OP = 'DELETE') THEN
        v_datos_viejos := to_jsonb(OLD);
        CASE TG_TABLE_NAME
            WHEN 'usuario' THEN v_id_afectado := OLD.id_usuario::TEXT;
            WHEN 'producto' THEN v_id_afectado := OLD.id_producto::TEXT;
            WHEN 'alquiler' THEN v_id_afectado := OLD.id_alquiler::TEXT;
            WHEN 'detalle_alquiler' THEN v_id_afectado := OLD.id_detalle_alquiler::TEXT;
            WHEN 'logistica_alquiler' THEN v_id_afectado := OLD.id_logistica_alquiler::TEXT;
            ELSE v_id_afectado := 'DESCONOCIDO';
        END CASE;
    ELSE
        v_datos_nuevos := to_jsonb(NEW);
        CASE TG_TABLE_NAME
            WHEN 'usuario' THEN v_id_afectado := NEW.id_usuario::TEXT;
            WHEN 'producto' THEN v_id_afectado := NEW.id_producto::TEXT;
            WHEN 'alquiler' THEN v_id_afectado := NEW.id_alquiler::TEXT;
            WHEN 'detalle_alquiler' THEN v_id_afectado := NEW.id_detalle_alquiler::TEXT;
            WHEN 'logistica_alquiler' THEN v_id_afectado := NEW.id_logistica_alquiler::TEXT;
            ELSE v_id_afectado := 'DESCONOCIDO';
        END CASE;

        IF (TG_OP = 'UPDATE') THEN
            v_datos_viejos := to_jsonb(OLD);
        END IF;
    END IF;

    INSERT INTO auditoria_sistema (
        nombre_tabla,
        tipo_operacion,
        id_registro_afectado,
        datos_anteriores,
        datos_nuevos,
        id_usuario_accion
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        v_id_afectado,
        v_datos_viejos,
        v_datos_nuevos,
        v_usuario_accion
    );

    RETURN NULL;
END;
$function$
```

### `fn_cerrar_alquiler_devolver_stock()`

- **Retorno:** `trigger`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Cuando un alquiler pasa a `terminado`/`recogido`/`cancelado`, descuenta las cantidades activas de `stock_alquilado`.

```sql
CREATE OR REPLACE FUNCTION public.fn_cerrar_alquiler_devolver_stock()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.estado_alquiler NOT IN ('terminado', 'recogido', 'cancelado') 
       AND NEW.estado_alquiler IN ('terminado', 'recogido', 'cancelado') THEN
        
        UPDATE producto p
        SET stock_alquilado = p.stock_alquilado - d.cantidad_productos
        FROM detalle_alquiler d
        WHERE d.id_alquiler = NEW.id_alquiler
          AND d.id_producto = p.id_producto
          AND d.estado_registro = TRUE;
    END IF;

    RETURN NEW;
END;
$function$
```

### `fn_garantizar_minimo_un_admin()`

- **Retorno:** `trigger`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Impide borrar o desactivar al último administrador activo del sistema.

```sql
CREATE OR REPLACE FUNCTION public.fn_garantizar_minimo_un_admin()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_conteo_admins INT;
BEGIN
    -- Validar si el usuario que se va a desactivar o borrar es administrador
    IF OLD.rol_usuario = 'admin' AND (TG_OP = 'DELETE' OR NEW.estado_registro = FALSE) THEN
        
        -- Contar cuántos administradores activos quedan en el sistema
        SELECT COUNT(*) INTO v_conteo_admins
        FROM usuario
        WHERE rol_usuario = 'admin' AND estado_registro = TRUE AND id_usuario <> OLD.id_usuario;

        IF v_conteo_admins < 1 THEN
            RAISE EXCEPTION 'Operación denegada: El sistema no puede quedarse sin administradores activos.';
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$function$
```

### `fn_impedir_autodesactivacion_admin()`

- **Retorno:** `trigger`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Impide que un administrador desactive su propia cuenta; lee `current_setting('app.current_user_id', true)` (ver H-DB-03).

```sql
CREATE OR REPLACE FUNCTION public.fn_impedir_autodesactivacion_admin()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_usuario_actual VARCHAR;
BEGIN
    v_usuario_actual := current_setting('app.current_user_id', true);

    IF OLD.rol_usuario = 'admin' AND NEW.estado_registro = FALSE AND OLD.id_usuario = v_usuario_actual THEN
        RAISE EXCEPTION 'Operación denegada: Un administrador no puede desactivar su propia cuenta.';
    END IF;

    RETURN NEW;
END;
$function$
```

### `fn_prohibir_reabrir_alquiler()`

- **Retorno:** `trigger`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Bloquea la transición desde estados cerrados; prevé excepción para administradores.

```sql
CREATE OR REPLACE FUNCTION public.fn_prohibir_reabrir_alquiler()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_permitido VARCHAR;
BEGIN
    v_permitido := current_setting('app.permitir_reapertura', true);

    IF OLD.estado_alquiler IN ('terminado', 'recogido', 'cancelado') THEN
        IF NEW.estado_alquiler NOT IN ('terminado', 'recogido', 'cancelado') THEN
            IF v_permitido IS NULL OR v_permitido != 'true' THEN
                RAISE EXCEPTION 'Operación denegada: Un alquiler en estado "%" está finalizado. Utilice el procedimiento administrativo para reabrirlo.', OLD.estado_alquiler;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
```

### `fn_sincronizar_stock_producto()`

- **Retorno:** `trigger`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Ajusta `stock_alquilado` ante INSERT/UPDATE/DELETE de líneas de detalle activas.

```sql
CREATE OR REPLACE FUNCTION public.fn_sincronizar_stock_producto()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.estado_registro = TRUE THEN
            UPDATE producto 
            SET stock_alquilado = stock_alquilado + NEW.cantidad_productos
            WHERE id_producto = NEW.id_producto;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- Borrado lógico
        IF OLD.estado_registro = TRUE AND NEW.estado_registro = FALSE THEN
            UPDATE producto 
            SET stock_alquilado = stock_alquilado - OLD.cantidad_productos
            WHERE id_producto = OLD.id_producto;
        -- Reactivación
        ELSIF OLD.estado_registro = FALSE AND NEW.estado_registro = TRUE THEN
            UPDATE producto 
            SET stock_alquilado = stock_alquilado + NEW.cantidad_productos
            WHERE id_producto = NEW.id_producto;
        -- Modificación de cantidad
        ELSIF OLD.estado_registro = TRUE AND NEW.estado_registro = TRUE THEN
            UPDATE producto 
            SET stock_alquilado = stock_alquilado + (NEW.cantidad_productos - OLD.cantidad_productos)
            WHERE id_producto = NEW.id_producto;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.estado_registro = TRUE THEN
            UPDATE producto 
            SET stock_alquilado = stock_alquilado - OLD.cantidad_productos
            WHERE id_producto = OLD.id_producto;
        END IF;
    END IF;

    RETURN NULL;
END;
$function$
```

### `fn_validar_detalle_alquiler()`

- **Retorno:** `trigger`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Valida que el alquiler esté abierto, que no se cambie el producto de una línea y que exista stock disponible.

```sql
CREATE OR REPLACE FUNCTION public.fn_validar_detalle_alquiler()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_estado_alquiler VARCHAR(30);
    v_stock_total INTEGER;
    v_stock_alquilado INTEGER;
    v_stock_disponible INTEGER;
    v_nombre_producto VARCHAR(100);
    v_diferencia INTEGER := 0;
BEGIN
    SELECT estado_alquiler INTO v_estado_alquiler
    FROM alquiler WHERE id_alquiler = NEW.id_alquiler;

    IF v_estado_alquiler IN ('terminado', 'recogido', 'cancelado') THEN
        RAISE EXCEPTION 'Operación denegada. No se pueden modificar ítems de un alquiler en estado "%".', v_estado_alquiler;
    END IF;

    SELECT stock_total, stock_alquilado, nombre_producto 
    INTO v_stock_total, v_stock_alquilado, v_nombre_producto
    FROM producto WHERE id_producto = NEW.id_producto;

    IF (TG_OP = 'INSERT') THEN
        v_diferencia := NEW.cantidad_productos;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF NEW.id_producto != OLD.id_producto THEN
            RAISE EXCEPTION 'No se permite cambiar el producto de una línea activa. Debe eliminar la línea y agregar una nueva.';
        END IF;
        v_diferencia := NEW.cantidad_productos - OLD.cantidad_productos;
    END IF;

    v_stock_disponible := (v_stock_total - v_stock_alquilado);

    IF v_diferencia > v_stock_disponible THEN
        RAISE EXCEPTION 'Stock insuficiente para el producto "%". Disponible: %, Solicitado adicional: %', 
            v_nombre_producto, v_stock_disponible, v_diferencia;
    END IF;

    RETURN NEW;
END;
$function$
```

### `fn_validar_fechas_alquiler()`

- **Retorno:** `trigger`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Valida la coherencia de fechas al insertar un alquiler.

```sql
CREATE OR REPLACE FUNCTION public.fn_validar_fechas_alquiler()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.fecha_inicio < CURRENT_DATE THEN
        RAISE EXCEPTION 'La fecha de inicio del alquiler (%) no puede ser anterior a hoy (%).', 
            NEW.fecha_inicio, CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$function$
```

### `fn_validar_modificacion_producto()`

- **Retorno:** `trigger`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Restringe UPDATE/DELETE de productos con dependencias de inventario.

```sql
CREATE OR REPLACE FUNCTION public.fn_validar_modificacion_producto()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Bloqueo de eliminación física o borrado lógico
    IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.estado_registro = FALSE AND OLD.estado_registro = TRUE) THEN
        IF OLD.stock_alquilado > 0 THEN
            RAISE EXCEPTION 'Operación cancelada: El producto "%" tiene % unidades en obra. No se puede dar de baja.', 
                OLD.nombre_producto, OLD.stock_alquilado;
        END IF;
    END IF;

    -- Garantizar que el stock_total jamás sea menor al stock_alquilado
    IF (TG_OP = 'UPDATE') THEN
        IF NEW.stock_total < NEW.stock_alquilado THEN
            RAISE EXCEPTION 'Ajuste denegado para "%": El stock total (%) no puede ser menor al stock alquilado actualmente en obras (%).', 
                NEW.nombre_producto, NEW.stock_total, NEW.stock_alquilado;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
```

### `fn_verificar_usuario_activo()`

- **Retorno:** `trigger`
- **Lenguaje:** plpgsql | **Volatilidad:** v | **SECURITY DEFINER:** False
- **Propósito:** Impide usar usuarios inactivos como creador de alquiler o responsable logístico.

```sql
CREATE OR REPLACE FUNCTION public.fn_verificar_usuario_activo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_estado BOOLEAN;
BEGIN
    -- Se corrige para apuntar a id_usuario_creador que es el campo real en la tabla alquiler
    SELECT estado_registro INTO v_estado
    FROM usuario 
    WHERE id_usuario = NEW.id_usuario_creador;

    IF v_estado IS FALSE THEN
        RAISE EXCEPTION 'Operación cancelada: El usuario creador con ID % se encuentra inactivo en el sistema y no puede generar alquileres.', 
            NEW.id_usuario_creador;
    END IF;

    RETURN NEW;
END;
$function$
```


## 3. Triggers

| Tabla | Trigger | Momento | Eventos | Nivel | Función |
|---|---|---|---|---|---|
| `alquiler` | `trg_auditoria_alquiler` | AFTER | INSERT/DELETE/UPDATE | ROW | `fn_auditar_cambios` |
| `alquiler` | `trg_cerrar_alquiler_devolver_stock` | AFTER | UPDATE | ROW | `fn_cerrar_alquiler_devolver_stock` |
| `alquiler` | `trg_prohibir_reabrir_alquiler` | BEFORE | UPDATE | ROW | `fn_prohibir_reabrir_alquiler` |
| `alquiler` | `trg_timestamp_alquiler` | BEFORE | UPDATE | ROW | `fn_actualizar_timestamp` |
| `alquiler` | `trg_validar_fecha_inicio` | BEFORE | INSERT | ROW | `fn_validar_fechas_alquiler` |
| `alquiler` | `trg_verificar_usuario_activo_alquiler` | BEFORE | INSERT/UPDATE | ROW | `fn_verificar_usuario_activo` |
| `detalle_alquiler` | `trg_auditoria_detalle` | AFTER | INSERT/DELETE/UPDATE | ROW | `fn_auditar_cambios` |
| `detalle_alquiler` | `trg_sincronizar_stock_producto` | AFTER | INSERT/DELETE/UPDATE | ROW | `fn_sincronizar_stock_producto` |
| `detalle_alquiler` | `trg_timestamp_detalle` | BEFORE | UPDATE | ROW | `fn_actualizar_timestamp` |
| `detalle_alquiler` | `trg_validar_detalle_alquiler` | BEFORE | INSERT/UPDATE | ROW | `fn_validar_detalle_alquiler` |
| `logistica_alquiler` | `trg_auditoria_logistica` | AFTER | INSERT/DELETE/UPDATE | ROW | `fn_auditar_cambios` |
| `logistica_alquiler` | `trg_timestamp_logistica` | BEFORE | UPDATE | ROW | `fn_actualizar_timestamp` |
| `producto` | `trg_auditoria_producto` | AFTER | INSERT/DELETE/UPDATE | ROW | `fn_auditar_cambios` |
| `producto` | `trg_timestamp_producto` | BEFORE | UPDATE | ROW | `fn_actualizar_timestamp` |
| `producto` | `trg_validar_modificacion_producto` | BEFORE | DELETE/UPDATE | ROW | `fn_validar_modificacion_producto` |
| `usuario` | `trg_auditoria_usuario` | AFTER | INSERT/DELETE/UPDATE | ROW | `fn_auditar_cambios` |
| `usuario` | `trg_garantizar_minimo_un_admin` | BEFORE | UPDATE | ROW | `fn_garantizar_minimo_un_admin` |
| `usuario` | `trg_impedir_autodesactivacion_admin` | BEFORE | UPDATE | ROW | `fn_impedir_autodesactivacion_admin` |
| `usuario` | `trg_timestamp_usuario` | BEFORE | UPDATE | ROW | `fn_actualizar_timestamp` |

### Observaciones sobre los triggers

- `fn_auditar_cambios()` está enlazado a 5 tablas (`usuario`, `producto`, `alquiler`, `detalle_alquiler`, `logistica_alquiler`). **No** hay trigger de auditoría en `logistica_alquiler_alquiler`.
- `fn_impedir_autodesactivacion_admin()` usa una variable de sesión distinta de la que escribe el backend (`app.current_user_id` frente a `app.usuario_actual`); ver H-DB-03.
- `fn_cerrar_alquiler_devolver_stock()` descuenta stock pero no llama a `set_audit_context`, por lo que la fila de auditoría resultante puede quedar sin actor.
- Ningún trigger de `TRUNCATE`: una limpieza con `TRUNCATE` no dispara las reglas de stock ni de auditoría. Esto se usa deliberadamente en el plan de demo (`08_plan_sql_poblamiento.md`) y se advierte explícitamente.

## 4. Vistas

### `vw_dashboard_operativo`

Tablas de origen: `alquiler` y `producto`. No depende de funciones ni de otras vistas.

```sql
 WITH alquileres_estado AS (
         SELECT alquiler.estado_alquiler,
            count(alquiler.id_alquiler) AS cantidad_contratos,
            sum(alquiler.precio_alquiler) AS dinero_comprometido
           FROM alquiler
          WHERE (alquiler.estado_registro = true)
          GROUP BY alquiler.estado_alquiler
        ), stock_general AS (
         SELECT sum(producto.stock_total) AS stock_total_inventario,
            sum(producto.stock_alquilado) AS stock_en_obra,
            sum((producto.stock_total - producto.stock_alquilado)) AS stock_bodega
           FROM producto
          WHERE (producto.estado_registro = true)
        )
 SELECT COALESCE(( SELECT alquileres_estado.cantidad_contratos
           FROM alquileres_estado
          WHERE ((alquileres_estado.estado_alquiler)::text = 'activo'::text)), (0)::bigint) AS contratos_activos,
    COALESCE(( SELECT alquileres_estado.cantidad_contratos
           FROM alquileres_estado
          WHERE ((alquileres_estado.estado_alquiler)::text = 'pendiente'::text)), (0)::bigint) AS contratos_pendientes,
    COALESCE(( SELECT alquileres_estado.cantidad_contratos
           FROM alquileres_estado
          WHERE ((alquileres_estado.estado_alquiler)::text = 'vencido'::text)), (0)::bigint) AS contratos_vencidos,
    stock_total_inventario,
    stock_en_obra,
    stock_bodega
   FROM stock_general sg;
```

**Salida observada:** una única fila con 6 columnas (`contratos_activos`, `contratos_pendientes`, `contratos_vencidos`, `stock_total_inventario`, `stock_en_obra`, `stock_bodega`). La vista solo cuenta contratos con `estado_registro = true` y solo suma productos activos.

## 5. Otros objetos

- Extensiones instaladas: `plpgsql` 1.0 en `pg_catalog` (la estándar).
- No hay tipos `ENUM` definidos por el usuario, ni reglas (`CREATE RULE`), ni funciones de agregado personalizadas en `public`.
