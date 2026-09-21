-- =========================================================================
-- DEMO: RENOVACIONES (Equivalente a POST /alquileres/{id}/renovaciones)
-- =========================================================================
-- Demuestra que la "renovación" es en realidad una extensión de tiempo 
-- en la tabla principal, pero que deja rastro histórico gracias a los triggers.
-- =========================================================================

BEGIN;

-- =========================================================================
-- PASO 0: SETUP DE LA PRUEBA
-- =========================================================================
-- Creamos un alquiler 'activo' para poder renovarlo.
INSERT INTO alquiler (id_usuario_creador, id_usuario_cliente, estado_alquiler, barrio, direccion, deposito, precio_alquiler, fecha_inicio, tiempo_alquiler_dias) 
VALUES ('1001234567', '80123456', 'activo', 'Prueba', 'Prueba', 0, 100000.00, CURRENT_DATE, 7);

-- =========================================================================
-- SIMULACIÓN DEL ENDPOINT
-- =========================================================================

    -- 1. Inyectar usuario (El Facturador - ID 1010203040)
    SET LOCAL app.usuario_actual = '1010203040';

    -- 2. Controller: _aplicar_renovacion()
    -- Se suman días (por ejemplo, 5 días extras) y opcionalmente se ajusta el precio
    UPDATE alquiler
    SET tiempo_alquiler_dias = tiempo_alquiler_dias + 5,
        precio_alquiler = precio_alquiler + 50000.00, -- Supongamos que pagó más
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_alquiler = currval('alquiler_id_alquiler_seq');

-- =========================================================================
-- VERIFICACIÓN DE EFECTOS
-- =========================================================================

    -- Mostrar que PostgreSQL (mediante fn_auditar_cambios) registró esto.
    -- El endpoint consulta esta tabla justo después del UPDATE para devolver
    -- el id_auditoria al cliente.
    SELECT 
        id_auditoria,
        nombre_tabla,
        tipo_operacion,
        id_usuario_accion,
        datos_anteriores->>'tiempo_alquiler_dias' AS dias_antes,
        datos_nuevos->>'tiempo_alquiler_dias' AS dias_nuevos,
        datos_anteriores->>'precio_alquiler' AS precio_antes,
        datos_nuevos->>'precio_alquiler' AS precio_nuevo
    FROM auditoria_sistema
    WHERE nombre_tabla = 'alquiler' 
      AND id_registro_afectado = CAST(currval('alquiler_id_alquiler_seq') AS TEXT)
    ORDER BY fecha_accion DESC
    LIMIT 1;

ROLLBACK;
