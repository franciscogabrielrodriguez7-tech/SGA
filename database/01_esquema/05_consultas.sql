-- =========================================================
-- ÍNDICE DE CONSULTAS ANALÍTICO-OPERATIVAS (consultas.sql)
-- =========================================================
-- 1. AUDITORÍA DE INVENTARIO Y OCUPACIÓN: Stock total vs. alquilado y disponible
-- 2. LISTADO GENERAL DE PRODUCTOS:        Catálogo base de equipos y tarifas
-- 3. RESUMEN FINANCIERO Y DEPÓSITOS:      Valores y plazos de contratos
-- 4. LISTADO GENERAL DE ALQUILERES:       Historial completo de contratos y estados
-- 5. HISTORIAL DE LOGÍSTICA EN CAMPO:     Fletes, costos operativos y responsables
-- 6. DETALLE DE PRODUCTOS POR CONTRATO:   Equipos alquilados en obra (activos)
-- 7. LISTADO DE PERSONAL Y ROLES:         Usuarios administrativos y operativos activos
-- =========================================================


-- =========================================================
-- 1. CONSULTA: Auditoría de Estado de Inventario y Ocupación
-- Control para verificar stock total, stock alquilado y stock disponible real en bodega.
-- =========================================================

SELECT 
    id_producto,
    nombre_producto,
    stock_total,
    stock_alquilado,
    (stock_total - stock_alquilado) AS stock_disponible_bodega,
    precio_base_producto,
    estado_registro
FROM producto
WHERE estado_registro = TRUE
ORDER BY id_producto ASC;


-- =========================================================
-- 2. CONSULTA BÁSICA: Listado General de Productos
-- Muestra el catálogo completo de equipos disponibles, descripciones y precios base.
-- =========================================================

SELECT 
    id_producto,
    nombre_producto,
    descripcion_producto,
    precio_base_producto,
    stock_total,
    estado_registro
FROM producto
WHERE estado_registro = TRUE
ORDER BY nombre_producto ASC;


-- =========================================================
-- 3. CONSULTA: Resumen Financiero y Depósitos por Contrato
-- Permite auditar el valor de los alquileres y los depósitos en garantía asociados.
-- =========================================================

SELECT 
    a.id_alquiler,
    a.id_usuario_cliente AS documento_cliente,
    CONCAT(u.nombres_usuario, ' ', u.apellidos_usuario) AS nombre_cliente,
    a.estado_alquiler,
    a.deposito,
    a.precio_alquiler,
    a.fecha_inicio,
    a.fecha_inicio + (a.tiempo_alquiler_dias || ' days')::INTERVAL AS fecha_estimada_fin
FROM alquiler a
JOIN usuario u ON a.id_usuario_cliente = u.id_usuario
WHERE a.estado_registro = TRUE
ORDER BY a.fecha_inicio DESC;


-- =========================================================
-- 4. CONSULTA BÁSICA: Listado General de Alquileres
-- Muestra la información principal de todos los contratos, sus ubicaciones y estados.
-- =========================================================

SELECT 
    a.id_alquiler,
    a.id_usuario_creador AS documento_facturador,
    a.id_usuario_cliente AS documento_cliente,
    a.estado_alquiler,
    a.barrio,
    a.direccion,
    a.fecha_inicio,
    a.tiempo_alquiler_dias,
    a.se_lleva,
    a.se_recoge
FROM alquiler a
WHERE a.estado_registro = TRUE
ORDER BY a.id_alquiler DESC;


-- =========================================================
-- 5. CONSULTA: Historial de Gastos y Operaciones Logísticas
-- Relaciona los fletes, transportadores y observaciones por contrato de alquiler.
-- =========================================================

SELECT 
    l.id_logistica_alquiler,
    l.id_alquiler,
    l.id_usuario_logistico AS documento_logistico,
    CONCAT(u.nombres_usuario, ' ', u.apellidos_usuario) AS nombre_empleado,
    l.descripcion_gasto_logistico,
    l.valor_gasto_logistico,
    CASE 
        WHEN l.es_recogida = FALSE THEN 'Despacho Inicial'
        ELSE 'Recogida en Obra'
    END AS tipo_operacion_logistica,
    l.observaciones_logistica_alquiler,
    l.fecha_creacion AS fecha_movimiento
FROM logistica_alquiler l
JOIN usuario u ON l.id_usuario_logistico = u.id_usuario
WHERE l.estado_registro = TRUE
ORDER BY l.fecha_creacion DESC;


-- =========================================================
-- 6. CONSULTA: Detalle de Productos por Contrato Activo
-- Muestra los equipos específicos alquilados y las cantidades en cada obra.
-- =========================================================

SELECT 
    da.id_alquiler,
    a.barrio,
    a.direccion,
    p.nombre_producto,
    da.cantidad_productos,
    da.precio_conjunto
FROM detalle_alquiler da
JOIN alquiler a ON da.id_alquiler = a.id_alquiler
JOIN producto p ON da.id_producto = p.id_producto
WHERE da.estado_registro = TRUE AND a.estado_alquiler = 'activo'
ORDER BY da.id_alquiler ASC;


-- =========================================================
-- 7. CONSULTA: Listado de Personal Administrativo y Operativo
-- Filtra los usuarios activos y sus respectivos roles dentro del sistema.
-- =========================================================

SELECT 
    id_usuario,
    CONCAT(nombres_usuario, ' ', apellidos_usuario) AS nombre_completo,
    rol_usuario,
    email_usuario,
    telefono_usuario,
    tipo_documento,
    fecha_creacion
FROM usuario
WHERE estado_registro = TRUE AND rol_usuario <> 'cliente'
ORDER BY rol_usuario ASC, nombres_usuario ASC;