-- ============================================================================
-- SGA - Poblamiento controlado de datos ficticios en sga_db local
-- Archivo: 02_poblamiento_demo_sga_db.sql
-- Destino exclusivo: base local sga_db (NUNCA ejecutar en sga_db_mydd).
-- Marcador <HASH_BCRYPT_EMPLEADOS>: se sustituye en memoria durante la carga
-- usando app.utils.security.hashear_contrasena(). No almacena secretos.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. USUARIOS (14 filas: 1 admin, 2 facturación, 2 logísticos, 9 clientes)
-- Regla de negocio:
--   - Empleados internos reciben hash bcrypt generado con el backend.
--   - Clientes tienen contrasena_usuario = NULL (no autentican en RBAC).
-- ----------------------------------------------------------------------------
SET LOCAL app.usuario_actual = 'DEMO-ADM-01';

INSERT INTO public.usuario (
    id_usuario, rol_usuario, nombres_usuario, apellidos_usuario,
    email_usuario, telefono_usuario, contrasena_usuario, tipo_documento, estado_registro
) VALUES
    ('DEMO-ADM-01', 'admin', 'Ana Lucía', 'Vargas Demo', 'admin.demo@example.invalid', '3009100001', '<HASH_BCRYPT_EMPLEADOS>', 'CC', TRUE),
    ('DEMO-FAC-01', 'encargado_facturacion', 'Luis Eduardo', 'Mendoza Demo', 'fac1.demo@example.invalid', '3009100002', '<HASH_BCRYPT_EMPLEADOS>', 'CC', TRUE),
    ('DEMO-FAC-02', 'encargado_facturacion', 'Marta Isabel', 'Salazar Demo', 'fac2.demo@example.invalid', '3009100003', '<HASH_BCRYPT_EMPLEADOS>', 'CC', TRUE),
    ('DEMO-LOG-01', 'encargado_logistico', 'Carlos Andrés', 'Ríos Demo', 'log1.demo@example.invalid', '3009100004', '<HASH_BCRYPT_EMPLEADOS>', 'CC', TRUE),
    ('DEMO-LOG-02', 'encargado_logistico', 'Sofía Alejandra', 'Pardo Demo', 'log2.demo@example.invalid', '3009100005', '<HASH_BCRYPT_EMPLEADOS>', 'CC', TRUE),
    ('DEMO-CLI-01', 'cliente', 'Mateo', 'Cárdenas Demo', 'cli1.demo@example.invalid', '3009100006', NULL, 'CC', TRUE),
    ('DEMO-CLI-02', 'cliente', 'Valentina', 'Osorio Demo', 'cli2.demo@example.invalid', '3009100007', NULL, 'CC', TRUE),
    ('DEMO-CLI-03', 'cliente', 'Julián', 'Benítez Demo', 'cli3.demo@example.invalid', '3009100008', NULL, 'CC', TRUE),
    ('DEMO-CLI-04', 'cliente', 'Camila', 'Navarro Demo', 'cli4.demo@example.invalid', '3009100009', NULL, 'CC', TRUE),
    ('DEMO-CLI-05', 'cliente', 'Santiago', 'Quintero Demo', 'cli5.demo@example.invalid', '3009100010', NULL, 'CC', TRUE),
    ('DEMO-CLI-06', 'cliente', 'Paula', 'Escobar Demo', 'cli6.demo@example.invalid', '3009100011', NULL, 'CC', TRUE),
    ('DEMO-CLI-07', 'cliente', 'Daniel', 'Cabrera Demo', 'cli7.demo@example.invalid', '3009100012', NULL, 'CC', TRUE),
    ('DEMO-CLI-08', 'cliente', 'Laura', 'Peñaloza Demo', 'cli8.demo@example.invalid', '3009100013', NULL, 'CC', TRUE),
    ('DEMO-CLI-09', 'cliente', 'Constructora', 'Demo Norte SAS', 'cli9.demo@example.invalid', '3009100014', NULL, 'NIT', TRUE);

-- ----------------------------------------------------------------------------
-- 2. PRODUCTOS (10 filas; stock_alquilado inicia en 0 y los triggers ajustan)
-- ----------------------------------------------------------------------------
SET LOCAL app.usuario_actual = 'DEMO-ADM-01';

INSERT INTO public.producto (
    nombre_producto, descripcion_producto, precio_base_producto,
    precio_base_extra, stock_total, stock_alquilado, unidad_minima_alquiler, estado_registro
) VALUES
    ('Planchón metálico 2.00m', 'Plataforma metálica antideslizante estándar demo.', 12000.00, 8000.00, 60, 0, 'DIA', TRUE),
    ('Cruceta galvanizada estándar', 'Tijera metálica estabilizadora para andamio demo.', 4000.00, 0.00, 120, 0, 'DIA', TRUE),
    ('Sección andamio tubular ancha', 'Módulo tubular 1.50m x 1.50m demo.', 25000.00, 25000.00, 40, 0, 'SEMANA', TRUE),
    ('Sección andamio tubular angosta', 'Módulo tubular 1.50m x 0.80m demo.', 22000.00, 22000.00, 30, 0, 'SEMANA', TRUE),
    ('Escalera de extensión aluminio', 'Escalera multipropósito de aluminio 4m demo.', 15000.00, 15000.00, 25, 0, 'DIA', TRUE),
    ('Baranda de seguridad lateral', 'Baranda de protección perimetral para torre demo.', 18000.00, 7000.00, 35, 0, 'SEMANA', TRUE),
    ('Tablero estructural de madera', 'Tablero de soporte mensual para obra demo.', 80000.00, 12000.00, 20, 0, 'MES', TRUE),
    ('Abrazadera doble giratoria', 'Conector metálico para acople de tubería demo.', 3500.00, 1500.00, 200, 0, 'DIA', TRUE),
    ('Rana compactadora (stock bajo)', 'Equipo con stock bajo (2 uds) para probar bloqueo por stock insuficiente.', 95000.00, 95000.00, 2, 0, 'DIA', TRUE),
    ('Andamio colgante descontinuado', 'Ítem inactivo de referencia sin unidades en obra.', 40000.00, 0.00, 10, 0, 'DIA', FALSE);

-- ----------------------------------------------------------------------------
-- 3. ALQUILERES (8 filas; fecha_inicio >= CURRENT_DATE en INSERT)
-- Los estados finales/vencidos (5, 6, 7, 8) se transicionan después de cargar detalles.
-- ----------------------------------------------------------------------------
SET LOCAL app.usuario_actual = 'DEMO-FAC-01';

INSERT INTO public.alquiler (
    id_usuario_creador, id_usuario_cliente, estado_alquiler, barrio, direccion,
    deposito, precio_alquiler, fecha_inicio, tiempo_alquiler_dias, se_lleva, se_recoge, estado_registro
) VALUES
    ('DEMO-FAC-01', 'DEMO-CLI-01', 'pendiente', 'Centro', 'Calle Demo 101 # 10-20', 80000.00, 280000.00, CURRENT_DATE + 2, 7, TRUE, TRUE, TRUE),
    ('DEMO-FAC-01', 'DEMO-CLI-02', 'pendiente', 'Norte', 'Carrera Demo 15 # 45-12', 120000.00, 390000.00, CURRENT_DATE + 4, 14, TRUE, TRUE, TRUE),
    ('DEMO-FAC-02', 'DEMO-CLI-03', 'activo', 'Chapinero', 'Avenida Demo 7 # 52-08', 60000.00, 210000.00, CURRENT_DATE, 2, TRUE, TRUE, TRUE),
    ('DEMO-FAC-02', 'DEMO-CLI-04', 'activo', 'Suba', 'Transversal Demo 91 # 127-30', 150000.00, 620000.00, CURRENT_DATE, 30, TRUE, TRUE, TRUE),
    ('DEMO-FAC-01', 'DEMO-CLI-05', 'activo', 'Kennedy', 'Diagonal Demo 38 Sur # 78-11', 90000.00, 310000.00, CURRENT_DATE, 7, TRUE, TRUE, TRUE),
    ('DEMO-FAC-02', 'DEMO-CLI-06', 'activo', 'Usaquén', 'Calle Demo 116 # 18-40', 100000.00, 340000.00, CURRENT_DATE, 7, TRUE, TRUE, TRUE),
    ('DEMO-FAC-01', 'DEMO-CLI-07', 'activo', 'Fontibón', 'Carrera Demo 100 # 22-15', 140000.00, 540000.00, CURRENT_DATE, 30, TRUE, TRUE, TRUE),
    ('DEMO-FAC-02', 'DEMO-CLI-08', 'pendiente', 'Engativá', 'Calle Demo 72 # 84-09', 50000.00, 175000.00, CURRENT_DATE + 1, 7, TRUE, FALSE, TRUE);

-- ----------------------------------------------------------------------------
-- 4. DETALLES DE ALQUILER (20 filas; compatibles con unidades mínimas)
-- Al insertarse con alquileres abiertos, trg_validar_detalle_alquiler valida
-- disponibilidad y trg_sincronizar_stock_producto suma stock_alquilado.
-- ----------------------------------------------------------------------------
SET LOCAL app.usuario_actual = 'DEMO-FAC-02';

INSERT INTO public.detalle_alquiler (
    id_alquiler, id_producto, precio_conjunto, cantidad_productos, es_producto_extra, estado_registro
) VALUES
    -- Alquiler 1 (pendiente, 7d)
    (1, 3, 100000.00, 4, FALSE, TRUE),
    (1, 1, 48000.00, 4, FALSE, TRUE),
    (1, 8, 9000.00, 6, TRUE, TRUE),
    -- Alquiler 2 (pendiente, 14d)
    (2, 4, 220000.00, 5, FALSE, TRUE),
    (2, 6, 144000.00, 4, FALSE, TRUE),
    -- Alquiler 3 (activo próximo a vencer, 2d DIA)
    (3, 1, 144000.00, 6, FALSE, TRUE),
    (3, 2, 48000.00, 6, FALSE, TRUE),
    (3, 5, 60000.00, 2, FALSE, TRUE),
    -- Alquiler 4 (activo, 30d MES/DIA)
    (4, 7, 320000.00, 4, FALSE, TRUE),
    (4, 1, 192000.00, 8, FALSE, TRUE),
    (4, 8, 15000.00, 10, TRUE, TRUE),
    -- Alquiler 5 (vencido pendiente recogida, 7d)
    (5, 3, 75000.00, 3, FALSE, TRUE),
    (5, 2, 24000.00, 6, FALSE, TRUE),
    -- Alquiler 6 (será recogido, 7d)
    (6, 4, 88000.00, 4, FALSE, TRUE),
    (6, 6, 72000.00, 4, FALSE, TRUE),
    -- Alquiler 7 (será terminado, 30d MES/DIA)
    (7, 7, 240000.00, 3, FALSE, TRUE),
    (7, 5, 135000.00, 3, FALSE, TRUE),
    (7, 8, 84000.00, 8, FALSE, TRUE),
    -- Alquiler 8 (será cancelado, 7d)
    (8, 1, 60000.00, 5, FALSE, TRUE),
    (8, 2, 20000.00, 5, FALSE, TRUE);

-- ----------------------------------------------------------------------------
-- 5. MOVIMIENTOS LOGÍSTICOS (14 filas: 7 ENTREGA, 2 RECOGIDA, 5 GASTO)
-- Solo contratos entregados/cerrados tienen ENTREGA; solo recogido/terminado
-- tienen RECOGIDA; gastos en semanas distintas para probar resumen semanal.
-- ----------------------------------------------------------------------------
SET LOCAL app.usuario_actual = 'DEMO-LOG-01';

INSERT INTO public.logistica_alquiler (
    id_usuario_logistico, tipo_movimiento, fecha_gasto,
    descripcion_gasto_logistico, valor_gasto_logistico, observaciones_logistica_alquiler, estado_registro
) VALUES
    ('DEMO-LOG-01', 'ENTREGA', CURRENT_TIMESTAMP, 'Entrega inicial contrato 3', 0.00, 'Despacho completo a obra Chapinero', TRUE),
    ('DEMO-LOG-02', 'ENTREGA', CURRENT_TIMESTAMP, 'Entrega adicional contrato 3', 0.00, 'Entrega de escaleras de refuerzo', TRUE),
    ('DEMO-LOG-01', 'ENTREGA', CURRENT_TIMESTAMP, 'Entrega inicial contrato 4', 0.00, 'Despacho inicial obra Suba', TRUE),
    ('DEMO-LOG-02', 'ENTREGA', CURRENT_TIMESTAMP, 'Entrega adicional contrato 4', 0.00, 'Entrega de abrazaderas extra', TRUE),
    ('DEMO-LOG-01', 'ENTREGA', CURRENT_TIMESTAMP, 'Entrega inicial contrato 5', 0.00, 'Despacho obra Kennedy', TRUE),
    ('DEMO-LOG-02', 'ENTREGA', CURRENT_TIMESTAMP, 'Entrega inicial contrato 6', 0.00, 'Despacho obra Usaquén', TRUE),
    ('DEMO-LOG-01', 'ENTREGA', CURRENT_TIMESTAMP, 'Entrega inicial contrato 7', 0.00, 'Despacho obra Fontibón', TRUE),
    ('DEMO-LOG-02', 'RECOGIDA', CURRENT_TIMESTAMP, 'Recogida completa contrato 6', 0.00, 'Equipo recibido en bodega sin daños', TRUE),
    ('DEMO-LOG-01', 'RECOGIDA', CURRENT_TIMESTAMP, 'Recogida completa contrato 7', 0.00, 'Devolución total conforme contrato 7', TRUE),
    ('DEMO-LOG-01', 'GASTO', CURRENT_TIMESTAMP, 'Combustible ruta norte', 85000.00, 'Tanqueo camión demo semana actual', TRUE),
    ('DEMO-LOG-02', 'GASTO', CURRENT_TIMESTAMP - INTERVAL '3 days', 'Peajes corredor occidental', 45000.00, 'Peajes ruta Fontibón demo', TRUE),
    ('DEMO-LOG-01', 'GASTO', CURRENT_TIMESTAMP - INTERVAL '7 days', 'Acarreo auxiliar', 120000.00, 'Flete adicional semana -1', TRUE),
    ('DEMO-LOG-02', 'GASTO', CURRENT_TIMESTAMP - INTERVAL '10 days', 'Cargue y descargue', 60000.00, 'Apoyo cuadrilla semana -1', TRUE),
    ('DEMO-LOG-01', 'GASTO', CURRENT_TIMESTAMP - INTERVAL '14 days', 'Mantenimiento menor vehículo', 75000.00, 'Revisión preventiva semana -2', TRUE);

-- ----------------------------------------------------------------------------
-- 6. RELACIÓN LOGÍSTICA <-> ALQUILER (14 filas en tabla puente)
-- ----------------------------------------------------------------------------
INSERT INTO public.logistica_alquiler_alquiler (id_logistica_alquiler, id_alquiler) VALUES
    (1, 3), (2, 3),
    (3, 4), (4, 4),
    (5, 5), (6, 6), (7, 7),
    (8, 6), (9, 7),
    (10, 3), (11, 7), (12, 4), (13, 5), (14, 6);

-- ----------------------------------------------------------------------------
-- 7. TRANSICIONES DE ESTADO CONTROLADAS (disparan devolución de stock y auditoría)
-- ----------------------------------------------------------------------------
-- Contrato 5: simular contrato vencido (fecha_inicio anterior tras INSERT)
SET LOCAL app.usuario_actual = 'DEMO-FAC-01';
UPDATE public.alquiler
SET estado_alquiler = 'vencido',
    fecha_inicio = CURRENT_DATE - 10
WHERE id_alquiler = 5;

-- Contrato 6: recogido (trg_cerrar_alquiler_devolver_stock devuelve stock)
SET LOCAL app.usuario_actual = 'DEMO-LOG-02';
UPDATE public.alquiler
SET estado_alquiler = 'recogido'
WHERE id_alquiler = 6;

-- Contrato 7: terminado (trg_cerrar_alquiler_devolver_stock devuelve stock)
SET LOCAL app.usuario_actual = 'DEMO-FAC-02';
UPDATE public.alquiler
SET estado_alquiler = 'terminado'
WHERE id_alquiler = 7;

-- Contrato 8: cancelado (trg_cerrar_alquiler_devolver_stock devuelve stock)
SET LOCAL app.usuario_actual = 'DEMO-ADM-01';
UPDATE public.alquiler
SET estado_alquiler = 'cancelado'
WHERE id_alquiler = 8;

COMMIT;
