-- =========================================================
-- SGA - Sistema de Gestión de Alquileres de Andamios
-- ARCHIVO: 02_funciones_y_triggers.sql
-- CONTENIDO: Funciones PL/pgSQL y triggers asociados.
-- ORIGEN: extraído sin modificaciones de CREAR_TABLAS.sql
--         (líneas 223-585 del archivo original), como parte
--         de la reorganización documental del proyecto.
-- ORDEN DE EJECUCIÓN: 2 de 2 (requiere que 01_tablas.sql ya
--         se haya ejecutado, pues los triggers se asocian a
--         tablas existentes).
--
-- FUNCIONES / TRIGGERS INCLUIDOS (en orden de aparición):
--   fn_actualizar_stock_alquiler_insert       -> trg_sincronizar_stock_insert (AFTER INSERT detalle_alquiler)
--   fn_actualizar_stock_alquiler_delete       -> (función definida; sin trigger asociado en el original)
--   fn_actualizar_stock_alquiler_update       -> trg_sincronizar_stock_update (AFTER UPDATE detalle_alquiler)
--   fn_cerrar_alquiler_devolver_stock         -> trg_finalizar_alquiler_stock (AFTER UPDATE alquiler)
--   fn_verificar_stock_disponible             -> trg_validar_stock_disponible (BEFORE INSERT detalle_alquiler)
--   fn_ajustar_stock_en_actualizacion         -> trg_ajustar_stock_actualizacion (BEFORE UPDATE detalle_alquiler)
--   fn_validar_estado_alquiler_activo         -> trg_validar_estado_alquiler_activo (BEFORE INSERT/UPDATE detalle_alquiler)
--   fn_prohibir_reabrir_alquiler              -> trg_prohibir_reabrir_alquiler (BEFORE UPDATE alquiler)
--   fn_actualizar_timestamp                   -> trg_timestamp_usuario / _producto / _alquiler / _detalle / _logistica
--   fn_validar_fechas_alquiler                -> trg_validar_fecha_inicio (BEFORE INSERT alquiler)
--   fn_validar_eliminacion_producto           -> trg_validar_eliminacion_producto (BEFORE DELETE producto)
--   fn_validar_modificacion_stock             -> trg_validar_modificacion_stock (BEFORE UPDATE stock_total/stock_alquilado producto)
--   fn_prevenir_borrado_detalle               -> trg_prevenir_borrado_detalle (BEFORE DELETE detalle_alquiler)
--
-- NOTA: la función fn_actualizar_stock_alquiler_delete está
-- definida en el script original pero, según lo revisado, no
-- tiene un CREATE TRIGGER asociado en el archivo fuente. Se
-- deja tal cual estaba (sin agregar el trigger, para no
-- inventar comportamiento no presente en el original).
--
-- NOTA: el contenido SQL de este archivo es idéntico al
-- original. Solo se agregó este encabezado informativo.
-- =========================================================

-- =========================================================
-- TRIGGERS
-- =========================================================

CREATE OR REPLACE FUNCTION fn_actualizar_stock_alquiler_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizamos la tabla producto sumando la cantidad alquilada 
    -- utilizando el ID del producto que viene en la nueva fila del detalle.
    UPDATE producto
    SET stock_alquilado = stock_alquilado + NEW.cantidad_productos,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_producto = NEW.id_producto;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creamos el disparador que se activa después de insertar en detalle_alquiler
CREATE TRIGGER trg_sincronizar_stock_insert
AFTER INSERT ON detalle_alquiler
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_stock_alquiler_insert();

  CREATE OR REPLACE FUNCTION fn_actualizar_stock_alquiler_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Restamos del stock alquilado la cantidad que tenía el registro que se va a eliminar
    UPDATE producto
    SET stock_alquilado = stock_alquilado - OLD.cantidad_productos,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_producto = OLD.id_producto;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION fn_actualizar_stock_alquiler_update()
RETURNS TRIGGER AS $$
BEGIN
    -- CASO 1: El registro del detalle pasa de ACTIVO (TRUE) a INACTIVO (FALSE - Eliminación lógica)
    IF OLD.estado_registro = TRUE AND NEW.estado_registro = FALSE THEN
        UPDATE producto
        SET stock_alquilado = stock_alquilado - NEW.cantidad_productos,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_producto = NEW.id_producto;
    END IF;

    -- CASO 2 (Seguridad opcional): Si por error se reactiva el registro, vuelve a sumar al stock
    IF OLD.estado_registro = FALSE AND NEW.estado_registro = TRUE THEN
        UPDATE producto
        SET stock_alquilado = stock_alquilado + NEW.cantidad_productos,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_producto = NEW.id_producto;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_sincronizar_stock_update
AFTER UPDATE ON detalle_alquiler
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_stock_alquiler_update();

CREATE OR REPLACE FUNCTION fn_cerrar_alquiler_devolver_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado anterior NO era terminado/recogido, pero EL NUEVO SÍ lo es:
    IF OLD.estado_alquiler NOT IN ('terminado', 'recogido') 
       AND NEW.estado_alquiler IN ('terminado', 'recogido') THEN
        
        -- Marcamos lógicamente los detalles como inactivos. 
        -- Al hacer esto, el trigger trg_sincronizar_stock_update se encargará 
        -- automáticamente de devolver el stock de forma limpia y segura fila por fila.
        UPDATE detalle_alquiler
        SET estado_registro = FALSE,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_alquiler = NEW.id_alquiler 
          AND estado_registro = TRUE;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_finalizar_alquiler_stock
AFTER UPDATE ON alquiler
FOR EACH ROW
EXECUTE FUNCTION fn_cerrar_alquiler_devolver_stock();


CREATE OR REPLACE FUNCTION fn_verificar_stock_disponible()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_total INTEGER;
    v_stock_alquilado INTEGER;
    v_stock_disponible INTEGER;
    v_nombre_producto VARCHAR(100);
BEGIN
    -- 1. Consultamos el estado actual del producto en la tabla producto
    SELECT stock_total, stock_alquilado, nombre_producto 
    INTO v_stock_total, v_stock_alquilado, v_nombre_producto
    FROM producto
    WHERE id_producto = NEW.id_producto;

    -- 2. Calculamos cuánto hay realmente libre en la bodega
    v_stock_disponible := v_stock_total - v_stock_alquilado;

    -- 3. Si lo que piden supera lo que hay disponible, abortamos la operación
    IF NEW.cantidad_productos > v_stock_disponible THEN
        RAISE EXCEPTION 'Stock insuficiente para el producto "%". Stock disponible: %, Solicitado: %', 
            v_nombre_producto, v_stock_disponible, NEW.cantidad_productos;
    END IF;

    -- Si hay suficiente stock, permitimos que continúe la inserción normalmente
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_stock_disponible
BEFORE INSERT ON detalle_alquiler
FOR EACH ROW
EXECUTE FUNCTION fn_verificar_stock_disponible();


CREATE OR REPLACE FUNCTION fn_ajustar_stock_en_actualizacion()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_total INTEGER;
    v_stock_alquilado INTEGER;
    v_stock_disponible INTEGER;
    v_diferencia_cantidad INTEGER;
    v_nombre_producto VARCHAR(100);
BEGIN
    -- CASO A: Solo nos importa si el registro está activo y cambió la cantidad o el producto
    IF NEW.estado_registro = TRUE AND OLD.estado_registro = TRUE THEN
        
        -- Si cambiaron de producto por completo en la misma línea
        IF NEW.id_producto != OLD.id_producto THEN
            RAISE EXCEPTION 'No se permite cambiar el producto de una línea ya creada. Debe eliminar la línea y crear una nueva.';
        END IF;

        -- Calculamos la diferencia de cantidad (ej: si pasó de 5 a 8, la diferencia es +3)
        v_diferencia_cantidad := NEW.cantidad_productos - OLD.cantidad_productos;

        -- Si la cantidad aumentó, debemos verificar si hay stock disponible para ese incremento
        IF v_diferencia_cantidad > 0 THEN
            SELECT stock_total, stock_alquilado, nombre_producto 
            INTO v_stock_total, v_stock_alquilado, v_nombre_producto
            FROM producto
            WHERE id_producto = NEW.id_producto;

            -- Stock disponible real (excluyendo lo que ya tenía esta misma línea)
            v_stock_disponible := (v_stock_total - v_stock_alquilado);

            IF v_diferencia_cantidad > v_stock_disponible THEN
                RAISE EXCEPTION 'Stock insuficiente para aumentar el producto "%". Faltan unidades en bodega.', 
                    v_nombre_producto;
            END IF;
        END IF;

        -- Actualizamos el stock alquilado en la tabla producto aplicando la diferencia
        IF v_diferencia_cantidad != 0 THEN
            UPDATE producto
            SET stock_alquilado = stock_alquilado + v_diferencia_cantidad,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_producto = NEW.id_producto;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ajustar_stock_actualizacion
BEFORE UPDATE ON detalle_alquiler
FOR EACH ROW
EXECUTE FUNCTION fn_ajustar_stock_en_actualizacion();

CREATE OR REPLACE FUNCTION fn_validar_estado_alquiler_activo()
RETURNS TRIGGER AS $$
DECLARE
    v_estado_alquiler VARCHAR(30);
BEGIN
    -- 1. Consultamos el estado actual del alquiler al que pertenece este detalle
    SELECT estado_alquiler 
    INTO v_estado_alquiler
    FROM alquiler
    WHERE id_alquiler = NEW.id_alquiler;

    -- 2. Si el alquiler ya está cerrado/finalizado
    IF v_estado_alquiler IN ('terminado', 'recogido', 'cancelado') THEN
        
        -- EXCEPCIÓN PERMITIDA: Si es la actualización automática del sistema para 
        -- desactivar el registro (cerrar el detalle) sin alterar productos ni cantidades.
        IF (TG_OP = 'UPDATE' AND OLD.estado_registro = TRUE AND NEW.estado_registro = FALSE 
            AND OLD.id_producto = NEW.id_producto 
            AND OLD.cantidad_productos = NEW.cantidad_productos) THEN
            RETURN NEW; -- Permitimos el cierre automático
        END IF;

        -- De lo contrario, prohibimos cualquier cambio o adición manual
        RAISE EXCEPTION 'Operación denegada. No se pueden agregar o modificar productos en un alquiler que ya se encuentra en estado "%".', 
            v_estado_alquiler;
    END IF;

    -- Si el alquiler sigue activo o pendiente, permitimos la acción
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_estado_alquiler_activo
BEFORE INSERT OR UPDATE ON detalle_alquiler
FOR EACH ROW
EXECUTE FUNCTION fn_validar_estado_alquiler_activo();

CREATE OR REPLACE FUNCTION fn_prohibir_reabrir_alquiler()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado anterior era cerrado, prohibimos cambiarlo a un estado abierto
    IF OLD.estado_alquiler IN ('terminado', 'recogido', 'cancelado') 
       AND NEW.estado_alquiler NOT IN ('terminado', 'recogido', 'cancelado') THEN
        RAISE EXCEPTION 'Operación denegada. Un alquiler en estado "%" no puede ser reabierto. Por seguridad de inventario, debe crear un nuevo contrato.', 
            OLD.estado_alquiler;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prohibir_reabrir_alquiler
BEFORE UPDATE ON alquiler
FOR EACH ROW
EXECUTE FUNCTION fn_prohibir_reabrir_alquiler();

CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Para la tabla USUARIO
CREATE TRIGGER trg_timestamp_usuario
BEFORE UPDATE ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

-- Para la tabla PRODUCTO
CREATE TRIGGER trg_timestamp_producto
BEFORE UPDATE ON producto
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

-- Para la tabla ALQUILER
CREATE TRIGGER trg_timestamp_alquiler
BEFORE UPDATE ON alquiler
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

-- Para la tabla DETALLE_ALQUILER
CREATE TRIGGER trg_timestamp_detalle
BEFORE UPDATE ON detalle_alquiler
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

-- Para la tabla LOGISTICA_ALQUILER
CREATE TRIGGER trg_timestamp_logistica
BEFORE UPDATE ON logistica_alquiler
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE OR REPLACE FUNCTION fn_validar_fechas_alquiler()
RETURNS TRIGGER AS $$
BEGIN
    -- Validamos que al crear un alquiler, la fecha de inicio no sea del pasado
    IF NEW.fecha_inicio < CURRENT_DATE THEN
        RAISE EXCEPTION 'La fecha de inicio del alquiler (%) no puede ser anterior al día de hoy (%).', 
            NEW.fecha_inicio, CURRENT_DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_fecha_inicio
BEFORE INSERT ON alquiler
FOR EACH ROW
EXECUTE FUNCTION fn_validar_fechas_alquiler();

CREATE OR REPLACE FUNCTION fn_validar_eliminacion_producto()
RETURNS TRIGGER AS $$
BEGIN
    -- REGLA: No se puede eliminar un producto si tiene stock alquilado activo
    IF OLD.stock_alquilado > 0 THEN
        RAISE EXCEPTION 'Acción denegada. No se puede eliminar el producto "%" porque actualmente tiene % unidades alquiladas en campo.', 
            OLD.nombre_producto, OLD.stock_alquilado;
    END IF;

    -- Si el stock alquilado es 0, permitimos que el DELETE se ejecute con normalidad
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_eliminacion_producto
BEFORE DELETE ON producto
FOR EACH ROW
EXECUTE FUNCTION fn_validar_eliminacion_producto();

CREATE OR REPLACE FUNCTION fn_validar_modificacion_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- REGLA: El stock total nunca puede ser menor al stock que actualmente está alquilado
    IF NEW.stock_total < NEW.stock_alquilado THEN
        RAISE EXCEPTION 'Modificación denegada. No puedes reducir el stock total a %. Actualmente hay % unidades alquiladas en campo.', 
            NEW.stock_total, NEW.stock_alquilado;
    END IF;

    -- Opcional: Validar que el stock alquilado no se intente modificar manualmente de forma ilógica
    IF NEW.stock_alquilado < 0 THEN
        RAISE EXCEPTION 'El stock alquilado no puede ser un número negativo.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_modificacion_stock
BEFORE UPDATE OF stock_total, stock_alquilado ON producto
FOR EACH ROW
EXECUTE FUNCTION fn_validar_modificacion_stock();


-- trigger para prevenir la eliminación de un detalle de alquiler si el alquiler sigue activo o si el detalle sigue activo (stock descontado)
CREATE OR REPLACE FUNCTION fn_prevenir_borrado_detalle()
RETURNS TRIGGER AS $$
DECLARE
    v_estado_alquiler VARCHAR;
BEGIN
    -- Consultamos el estado actual del alquiler asociado
    SELECT estado_alquiler INTO v_estado_alquiler
    FROM alquiler
    WHERE id_alquiler = OLD.id_alquiler;

    -- Si el alquiler sigue activo/vencido o el detalle sigue marcado como activo (stock descontado)
    IF v_estado_alquiler NOT IN ('terminado', 'recogido') OR OLD.estado_registro = TRUE THEN
        RAISE EXCEPTION 'Acción denegada: No se puede eliminar el registro del detalle porque el alquiler sigue en curso o el stock no ha sido devuelto a bodega.';
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Asociamos el trigger a la tabla detalle_alquiler
CREATE TRIGGER trg_prevenir_borrado_detalle
BEFORE DELETE ON detalle_alquiler
FOR EACH ROW
EXECUTE FUNCTION fn_prevenir_borrado_detalle();


CREATE OR REPLACE FUNCTION fn_verificar_usuario_activo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_estado_usuario BOOLEAN;
BEGIN
    SELECT estado_usuario
    INTO v_estado_usuario
    FROM usuario
    WHERE id_usuario = NEW.id_usuario_creador;

    IF v_estado_usuario IS NULL OR v_estado_usuario = FALSE THEN
        RAISE EXCEPTION 'Operación denegada: El usuario creador no se encuentra activo en el sistema.';
    END IF;

    RETURN NEW;
END;
$$;
-- =========================================================
-- FIN DEL SCRIPT
-- =========================================================