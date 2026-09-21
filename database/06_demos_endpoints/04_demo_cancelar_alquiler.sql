-- =========================================================================
-- DEMO: CANCELAR ALQUILER (Equivalente a DELETE /alquileres/{id})
-- =========================================================================
-- En este sistema no se ejecutan sentencias "DELETE" físicas sobre el historial.
-- "Cancelar" un alquiler es transicionar su estado de forma controlada.
-- =========================================================================

BEGIN;

-- =========================================================================
-- PASO 0: SETUP DE LA PRUEBA
-- =========================================================================
-- Creamos un alquiler 'pendiente'
INSERT INTO alquiler (id_usuario_creador, id_usuario_cliente, estado_alquiler, barrio, direccion, deposito, precio_alquiler, fecha_inicio, tiempo_alquiler_dias) 
VALUES ('1001234567', '80123456', 'pendiente', 'Prueba', 'Prueba', 0, 0, CURRENT_DATE, 7);

-- =========================================================================
-- SIMULACIÓN DEL ENDPOINT
-- =========================================================================

    -- 1. Inyectar usuario (El Admin cancela - ID 1001234567)
    SET LOCAL app.usuario_actual = '1001234567';

    -- 2. Controller: cambiar_estado_alquiler() a 'cancelado'
    UPDATE alquiler
    SET estado_alquiler = 'cancelado',
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_alquiler = currval('alquiler_id_alquiler_seq');

-- =========================================================================
-- VERIFICACIÓN DE EFECTOS
-- =========================================================================

    -- Ver el rastro en auditoría
    SELECT 
        id_auditoria,
        nombre_tabla,
        tipo_operacion,
        id_usuario_accion,
        datos_anteriores->>'estado_alquiler' AS estado_anterior,
        datos_nuevos->>'estado_alquiler' AS nuevo_estado
    FROM auditoria_sistema
    WHERE nombre_tabla = 'alquiler' 
      AND id_registro_afectado = CAST(currval('alquiler_id_alquiler_seq') AS TEXT)
    ORDER BY fecha_accion DESC
    LIMIT 1;

ROLLBACK;
