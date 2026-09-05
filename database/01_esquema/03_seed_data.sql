-- =========================================================
-- SEED DATA: EMPLEADOS (encargado_facturacion y encargado_logistico)
-- =========================================================

INSERT INTO usuario (nombres_usuario, apellidos_usuario, id_usuario, telefono_usuario, email_usuario, contrasena_usuario, rol_usuario, estado_registro, tipo_documento) VALUES
-- Encargados de Facturación
('Francisco Gabriel', 'Rodriguez Sanabria', '1001234567', '3000000000', 'francisco.admin@sga.com', 'hash_pwd_123', 'admin', TRUE, 'CC'),
('Carlos Arturo', 'Gómez Ruiz', '1010203040', '3101234567', 'carlos.facturacion@sga.com', 'hash_pwd_123', 'encargado_facturacion', TRUE, 'CC'),
('María Fernanda', 'López Díaz', '1010203041', '3111234567', 'maria.facturacion@sga.com', 'hash_pwd_123', 'encargado_facturacion', TRUE, 'CC'),
('Jorge Eliecer', 'Pérez Mora', '1010203042', '3121234567', 'jorge.facturacion@sga.com', 'hash_pwd_123', 'encargado_facturacion', TRUE, 'CC'),
('Laura Camila', 'Ramírez Soto', '1010203043', '3131234567', 'laura.facturacion@sga.com', 'hash_pwd_123', 'encargado_facturacion', TRUE, 'CC'),
('Andrés Felipe', 'Castro Vargas', '1010203044', '3141234567', 'andres.facturacion@sga.com', 'hash_pwd_123', 'encargado_facturacion', TRUE, 'CC'),

-- Encargados Logísticos
('Diana Marcela', 'Rojas Peña', '1020304050', '3151234567', 'diana.logistica@sga.com', 'hash_pwd_123', 'encargado_logistico', TRUE, 'CC'),
('Javier Eduardo', 'Silva Cruz', '1020304051', '3161234567', 'javier.logistica@sga.com', 'hash_pwd_123', 'encargado_logistico', TRUE, 'CC'),
('Paola Andrea', 'Herrera Gil', '1020304052', '3171234567', 'paola.logistica@sga.com', 'hash_pwd_123', 'encargado_logistico', TRUE, 'CC'),
('Miguel Ángel', 'Torres Alba', '1020304053', '3181234567', 'miguel.logistica@sga.com', 'hash_pwd_123', 'encargado_logistico', TRUE, 'CC'),
('Luisa Fernanda', 'Guzmán Ríos', '1020304054', '3191234567', 'luisa.logistica@sga.com', 'hash_pwd_123', 'encargado_logistico', TRUE, 'CC');

-- =========================================================
-- SEED DATA: CLIENTES (Registrados en la tabla usuario con rol 'cliente')
-- Nota: Al ser clientes almacenados como usuarios, no tienen email ni contraseña.
-- =========================================================

INSERT INTO usuario (
    nombres_usuario, 
    apellidos_usuario, 
    id_usuario, 
    telefono_usuario, 
    email_usuario, 
    contrasena_usuario, 
    rol_usuario, 
    estado_registro, 
    tipo_documento
) VALUES
('Juan David', 'Martínez', '80123456', '3009876541', NULL, NULL, 'cliente', TRUE, 'CC'),
('Ana Milena', 'García', '52431289', '3009876542', NULL, NULL, 'cliente', TRUE, 'CC'),
('Pedro Pablo', 'Rodríguez', '79345678', '3009876543', NULL, NULL, 'cliente', TRUE, 'CC'),
('Carmen Rosa', 'Sánchez', '41234567', '3009876544', NULL, NULL, 'cliente', TRUE, 'CC'),
('Luis Fernando', 'Ortiz', '11223344', '3009876545', NULL, NULL, 'cliente', TRUE, 'CC'),
('Gloria Inés', 'Méndez', '22334455', '3009876546', NULL, NULL, 'cliente', TRUE, 'CC'),
('Héctor Fabio', 'Rincón', '33445566', '3009876547', NULL, NULL, 'cliente', TRUE, 'CC'),
('Marta Cecilia', 'Bustos', '44556677', '3009876548', NULL, NULL, 'cliente', TRUE, 'CC'),
('Óscar Iván', 'Castañeda', '55667788', '3009876549', NULL, NULL, 'cliente', TRUE, 'CC'),
('Claudia Patricia', 'Velasco', '66778899', '3009876550', NULL, NULL, 'cliente', TRUE, 'CC');
-- =========================================================
-- SEED DATA: PRODUCTOS
-- El stock_alquilado inicia en 0. Los precios son por día (estimados).
-- =========================================================

INSERT INTO producto (nombre_producto, descripcion_producto, precio_base_producto, stock_total, stock_alquilado, estado_registro) VALUES
('Sección de andamio ancha', 'Estructura tubular estándar de 1.50m x 1.50m. Ideal para fachadas.', 2500.00, 150, 0, TRUE),
('Sección de andamio angosta', 'Estructura de 1.50m x 0.80m. Diseñada para pasillos y espacios reducidos.', 2800.00, 80, 0, TRUE),
('Planchón mediano', 'Plataforma metálica antideslizante de 2.00m de longitud con ganchos de seguridad.', 1500.00, 200, 0, TRUE),
('Cruceta corta', 'Tijera/cruceta metálica de estabilización para andamios angostos.', 800.00, 160, 0, TRUE),
('Cruceta mediana', 'Tijera/cruceta metálica de estabilización para andamios de ancho estándar.', 1000.00, 300, 0, TRUE);

