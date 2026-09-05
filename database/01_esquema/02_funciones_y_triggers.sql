-- =========================================================
-- SGA - Sistema de Gestión de Alquileres de Andamios
-- ARCHIVO: 02_funciones_y_triggers.sql
-- CONTENIDO: Lógica de negocio, control de stock y auditoría.
-- ORDEN DE EJECUCIÓN: 2 de 2 (ejecutar después de 01_tablas.sql)
-- MOTOR: PostgreSQL
-- =========================================================

-- =========================================================
-- 1. FUNCIÓN GENÉRICA DE AUDITORÍA CENTRALIZADA
-- Registra cualquier cambio (INSERT, UPDATE, DELETE) en las tablas clave,
-- guardando los datos antiguos y nuevos en formato JSONB.
-- =========================================================
CREATE OR REPLACE FUNCTION fn_auditar_cambios()
RETURNS TRIGGER AS $$
DECLARE
    v_id_afectado VARCHAR(50);
    v_datos_viejos JSONB := NULL;
    v_datos_nuevos JSONB := NULL;
BEGIN
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
        datos_nuevos
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        v_id_afectado,
        v_datos_viejos,
        v_datos_nuevos
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditoria_usuario
AFTER INSERT OR UPDATE OR DELETE ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios();

CREATE TRIGGER trg_auditoria_producto
AFTER INSERT OR UPDATE OR DELETE ON producto
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios();

CREATE TRIGGER trg_auditoria_alquiler
AFTER INSERT OR UPDATE OR DELETE ON alquiler
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios();

CREATE TRIGGER trg_auditoria_detalle
AFTER INSERT OR UPDATE OR DELETE ON detalle_alquiler
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios();

CREATE TRIGGER trg_auditoria_logistica
AFTER INSERT OR UPDATE OR DELETE ON logistica_alquiler
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios();


-- =========================================================
-- 2. MANTENIMIENTO AUTOMÁTICO DE TIMESTAMPS
-- Actualiza automáticamente el campo fecha_actualizacion
-- cada vez que se modifica un registro.
-- =========================================================
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_timestamp_usuario
BEFORE UPDATE ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE TRIGGER trg_timestamp_producto
BEFORE UPDATE ON producto
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE TRIGGER trg_timestamp_alquiler
BEFORE UPDATE ON alquiler
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE TRIGGER trg_timestamp_detalle
BEFORE UPDATE ON detalle_alquiler
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE TRIGGER trg_timestamp_logistica
BEFORE UPDATE ON logistica_alquiler
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();


-- =========================================================
-- 3. GESTIÓN Y REGLAS DE USUARIOS
-- Previene que un admin se desactive a sí mismo y asegura
-- que siempre exista al menos un admin activo en el sistema.
-- =========================================================
CREATE OR REPLACE FUNCTION fn_impedir_autodesactivacion_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Se reemplaza 'OLD.rol' por 'OLD.rol_usuario'
    IF OLD.rol_usuario = 'admin' AND NEW.estado_registro = FALSE THEN
        -- Si manejas la validación de sesión actual para impedir que un admin se apague a sí mismo, 
        -- asegúrate de que tus comparaciones usen rol_usuario.
        RAISE EXCEPTION 'Operación denegada: Un administrador no puede desactivar su propia cuenta.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_impedir_autodesactivacion_admin
BEFORE UPDATE OF estado_registro ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_impedir_autodesactivacion_admin();

CREATE OR REPLACE FUNCTION fn_garantizar_minimo_un_admin()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_garantizar_minimo_un_admin
BEFORE UPDATE OF estado_registro ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_garantizar_minimo_un_admin();


-- =========================================================
-- 4. CONTROL Y VALIDACIÓN DE INVENTARIO (PRODUCTOS Y DETALLES)
-- Sincroniza el stock alquilado y previene modificaciones 
-- o bajas de productos que actualmente están en obra.
-- =========================================================
CREATE OR REPLACE FUNCTION fn_validar_modificacion_producto()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_modificacion_producto
BEFORE UPDATE OR DELETE ON producto
FOR EACH ROW EXECUTE FUNCTION fn_validar_modificacion_producto();

CREATE OR REPLACE FUNCTION fn_validar_detalle_alquiler()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_detalle_alquiler
BEFORE INSERT OR UPDATE ON detalle_alquiler
FOR EACH ROW EXECUTE FUNCTION fn_validar_detalle_alquiler();

CREATE OR REPLACE FUNCTION fn_sincronizar_stock_producto()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sincronizar_stock_producto
AFTER INSERT OR UPDATE OR DELETE ON detalle_alquiler
FOR EACH ROW EXECUTE FUNCTION fn_sincronizar_stock_producto();


-- =========================================================
-- 5. REGLAS Y ESTADOS DEL ALQUILER (CONTRATOS)
-- Validaciones de creación, retorno de stock al cerrar 
-- y manejo controlado (vía admin) para reaperturas.
-- =========================================================
CREATE OR REPLACE FUNCTION fn_verificar_usuario_activo()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verificar_usuario_activo_alquiler
BEFORE INSERT OR UPDATE ON alquiler
FOR EACH ROW EXECUTE FUNCTION fn_verificar_usuario_activo();

CREATE OR REPLACE FUNCTION fn_validar_fechas_alquiler()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_inicio < CURRENT_DATE THEN
        RAISE EXCEPTION 'La fecha de inicio del alquiler (%) no puede ser anterior a hoy (%).', 
            NEW.fecha_inicio, CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_fecha_inicio
BEFORE INSERT ON alquiler
FOR EACH ROW EXECUTE FUNCTION fn_validar_fechas_alquiler();

CREATE OR REPLACE FUNCTION fn_cerrar_alquiler_devolver_stock()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cerrar_alquiler_devolver_stock
AFTER UPDATE ON alquiler
FOR EACH ROW EXECUTE FUNCTION fn_cerrar_alquiler_devolver_stock();

CREATE OR REPLACE FUNCTION fn_prohibir_reabrir_alquiler()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prohibir_reabrir_alquiler
BEFORE UPDATE OF estado_alquiler ON alquiler
FOR EACH ROW EXECUTE FUNCTION fn_prohibir_reabrir_alquiler();

-- =========================================================
-- 6. PROCEDIMIENTO ADMINISTRATIVO
-- Permite a un admin reabrir un alquiler cerrado siempre 
-- y cuando haya stock suficiente en la bodega.
-- =========================================================
CREATE OR REPLACE FUNCTION fn_admin_reabrir_alquiler(
    p_id_alquiler INTEGER
)
RETURNS VOID AS $$
DECLARE
    r RECORD;
    v_stock_total INT;
    v_stock_alquilado INT;
    v_stock_disponible INT;
BEGIN
    -- A. Verificar disponibilidad real en bodega
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
$$ LANGUAGE plpgsql;