-- =========================================================================
-- DEMO: LOGÍSTICA (ENTREGA Y RECOGIDA)
-- Equivalentes a POST /alquileres/{id}/entregas y POST /alquileres/{id}/recogidas
-- =========================================================================
-- Este script simula el proceso de despachar material (Entrega) y luego
-- recibirlo de vuelta (Recogida).
-- Todo se envuelve en una transacción segura con ROLLBACK.
-- =========================================================================

BEGIN;

-- =========================================================================
-- PASO 0: SETUP DE LA PRUEBA (Ignorar esto, es solo para tener datos)
-- =========================================================================
-- Creamos rápidamente un alquiler 'pendiente' falso para no depender de la DB real.
INSERT INTO alquiler (id_usuario_creador, id_usuario_cliente, estado_alquiler, barrio, direccion, deposito, precio_alquiler, fecha_inicio, tiempo_alquiler_dias) 
VALUES ('1001234567', '80123456', 'pendiente', 'Prueba', 'Prueba', 0, 0, CURRENT_DATE, 7);

-- =========================================================================
-- FLUJO A: POST /alquileres/{id}/entregas
-- =========================================================================

    -- A.1 Inyectar el usuario logístico (Diana Marcela - ID 1020304050)
    SET LOCAL app.usuario_actual = '1020304050';

    -- A.2 Controller: Registrar el movimiento (logistica_alquiler)
    INSERT INTO logistica_alquiler (
        id_usuario_logistico, 
        tipo_movimiento, 
        valor_gasto_logistico, 
        descripcion_gasto_logistico
    ) VALUES (
        '1020304050', 
        'ENTREGA', 
        35000.00, 
        'Transporte en camión de la empresa'
    );

    -- A.3 Controller: Asociar el movimiento al alquiler (logistica_alquiler_alquiler)
    INSERT INTO logistica_alquiler_alquiler (
        id_logistica_alquiler, 
        id_alquiler
    ) VALUES (
        currval('logistica_alquiler_id_logistica_alquiler_seq'), 
        currval('alquiler_id_alquiler_seq')
    );

    -- A.4 Controller: Transición de Estado del Alquiler ('pendiente' -> 'activo')
    UPDATE alquiler 
    SET estado_alquiler = 'activo',
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_alquiler = currval('alquiler_id_alquiler_seq');


-- =========================================================================
-- FLUJO B: POST /alquileres/{id}/recogidas
-- =========================================================================
-- Supongamos que pasan los días y ahora se va a recoger el andamio.

    -- B.1 Mantener el usuario logístico (u otro diferente)
    SET LOCAL app.usuario_actual = '1020304050';

    -- B.2 Controller: Registrar el movimiento (logistica_alquiler)
    INSERT INTO logistica_alquiler (
        id_usuario_logistico, 
        tipo_movimiento, 
        valor_gasto_logistico, 
        descripcion_gasto_logistico
    ) VALUES (
        '1020304050', 
        'RECOGIDA', 
        35000.00, 
        'Transporte de regreso'
    );

    -- B.3 Controller: Asociar el movimiento al alquiler
    INSERT INTO logistica_alquiler_alquiler (
        id_logistica_alquiler, 
        id_alquiler
    ) VALUES (
        currval('logistica_alquiler_id_logistica_alquiler_seq'), 
        currval('alquiler_id_alquiler_seq')
    );

    -- B.4 Controller: Transición de Estado del Alquiler ('activo' -> 'recogido')
    UPDATE alquiler 
    SET estado_alquiler = 'recogido',
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_alquiler = currval('alquiler_id_alquiler_seq');


-- =========================================================================
-- PASO 3: VERIFICAR EFECTOS
-- =========================================================================

    -- 3.1 Verificar el estado final del alquiler
    SELECT id_alquiler, estado_alquiler 
    FROM alquiler 
    WHERE id_alquiler = currval('alquiler_id_alquiler_seq');

    -- 3.2 Verificar la tabla de auditoría
    -- Veremos 2 UPDATEs sobre la tabla 'alquiler' (cuando pasó a 'activo' y a 'recogido')
    -- y 2 INSERTs en 'logistica_alquiler'.
    SELECT 
        id_auditoria,
        nombre_tabla,
        tipo_operacion,
        id_usuario_accion,
        datos_nuevos
    FROM auditoria_sistema
    WHERE id_usuario_accion = '1020304050'
    ORDER BY fecha_accion DESC
    LIMIT 4;

-- =========================================================================
-- PASO 4: REVERSIÓN SEGURA
-- =========================================================================
ROLLBACK;
