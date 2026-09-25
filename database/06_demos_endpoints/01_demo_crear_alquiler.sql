-- =========================================================================
-- DEMO: CREAR ALQUILER (Equivalente a POST /alquileres)
-- =========================================================================
-- Este script simula exactamente lo que hace el endpoint 'crear_alquiler' 
-- en la base de datos.
-- Se envuelve en una transacción con ROLLBACK final para que sirva 
-- como demostración segura sin afectar permanentemente tu inventario.
-- =========================================================================

-- =========================================================================
-- PASO 1: VERIFICAR EL ESTADO INICIAL (Antes de la operación)
-- =========================================================================
-- Verificamos el stock alquilado actual de los productos que vamos a rentar:
-- ID 1 (Sección de andamio ancha) e ID 3 (Planchón mediano).
SELECT 
    id_producto, 
    nombre_producto, 
    stock_total, 
    stock_alquilado 
FROM producto 
WHERE id_producto IN (1, 3);

-- =========================================================================
-- PASO 2: SIMULACIÓN DE LA TRANSACCIÓN DEL BACKEND
-- =========================================================================
BEGIN;

    -- 2.1 Mantenimiento previo (simulado desde alquiler_controller.py)
    -- El backend ejecuta esto para asegurarse de que no haya vencidos sin marcar.
    UPDATE alquiler 
    SET estado_alquiler = 'vencido', 
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE estado_alquiler = 'activo' 
      AND (fecha_inicio + (tiempo_alquiler_dias - 1)) < CURRENT_DATE;

    -- 2.2 Inyectar el usuario actual para la auditoría (Middleware JWT)
    -- Usamos el ID del admin (Francisco Gabriel) del Seed Data.
    SET LOCAL app.usuario_actual = '1001234567';

    -- 2.3 Insertar la cabecera del alquiler
    -- Alquiler a 7 días para el cliente Juan David (CC 80123456).
    INSERT INTO alquiler (
        id_usuario_creador, 
        id_usuario_cliente, 
        estado_alquiler, 
        barrio, 
        direccion, 
        deposito, 
        precio_alquiler, 
        fecha_inicio, 
        tiempo_alquiler_dias, 
        se_lleva, 
        se_recoge
    ) VALUES (
        '1001234567', 
        '80123456', 
        'pendiente', 
        'Laureles', 
        'Carrera 70 # 40-50', 
        100000.00, 
        300000.00, 
        CURRENT_DATE, 
        7, 
        TRUE, 
        TRUE
    );

    -- Como no estamos en una aplicación para atrapar el ID generado con RETURNING,
    -- creamos un bloque anónimo (o usamos currval) temporalmente para insertar
    -- los detalles asociados a ese mismo alquiler recién creado.
    -- (Asumimos que el alquiler insertado arriba es el último en la secuencia actual).
    
    INSERT INTO detalle_alquiler (
        id_alquiler, 
        id_producto, 
        precio_conjunto, 
        cantidad_productos, 
        es_producto_extra
    ) VALUES 
    -- Producto Base (10 Secciones de andamio)
    (currval('alquiler_id_alquiler_seq'), 1, 150000.00, 10, FALSE),
    -- Producto Extra (2 Planchones)
    (currval('alquiler_id_alquiler_seq'), 3, 16000.00, 2, TRUE);

-- =========================================================================
-- PASO 3: VERIFICAR LOS EFECTOS SECUNDARIOS (Mientras la transacción está activa)
-- =========================================================================

    -- 3.1 Ver los registros creados en el contrato y su detalle
    SELECT 
        a.id_alquiler, 
        a.estado_alquiler, 
        a.tiempo_alquiler_dias,
        d.id_producto,
        d.cantidad_productos,
        d.es_producto_extra
    FROM alquiler a
    JOIN detalle_alquiler d ON a.id_alquiler = d.id_alquiler
    WHERE a.id_alquiler = currval('alquiler_id_alquiler_seq');

    -- 3.2 Verificar el Stock Alquilado (Efecto de PostgreSQL Trigger)
    -- Deberíamos ver que el stock_alquilado sumó 10 para el andamio y 2 para el planchón.
    SELECT 
        id_producto, 
        nombre_producto, 
        stock_total, 
        stock_alquilado AS stock_alquilado_tras_trigger
    FROM producto 
    WHERE id_producto IN (1, 3);

    -- 3.3 Verificar la Auditoría (Efecto de PostgreSQL Trigger)
    -- Deberíamos ver registros de INSERT en la tabla alquiler y detalle_alquiler
    -- con id_usuario_accion = '1001234567'.
    SELECT 
        id_auditoria,
        nombre_tabla,
        tipo_operacion,
        id_usuario_accion,
        datos_nuevos
    FROM auditoria_sistema
    ORDER BY fecha_accion DESC
    LIMIT 3;

-- =========================================================================
-- PASO 4: REVERSIÓN SEGURA
-- =========================================================================
-- Deshacemos todo lo hecho arriba. El inventario volverá a como estaba en el Paso 1
-- y el registro de auditoría falso desaparecerá, manteniendo tu DB de dev impecable.
ROLLBACK;
