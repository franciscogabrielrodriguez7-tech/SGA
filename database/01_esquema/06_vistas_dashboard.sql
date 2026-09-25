-- =========================================================
-- SGA - Sistema de Gestión de Alquileres de Andamios
-- ARCHIVO: 06_vistas_dashboard.sql
-- CONTENIDO: Vistas especializadas para el Dashboard Operativo
-- ORDEN DE EJECUCIÓN: 6 de 6
-- MOTOR: PostgreSQL
-- =========================================================

-- Vista: vw_dashboard_operativo
-- Propósito: Agrupar la información esencial para las métricas rápidas
-- del dashboard (totales de alquileres activos, stock en uso vs libre, etc).
CREATE OR REPLACE VIEW vw_dashboard_operativo AS
WITH 
alquileres_estado AS (
    SELECT 
        estado_alquiler, 
        COUNT(id_alquiler) AS cantidad_contratos,
        SUM(precio_alquiler) AS dinero_comprometido
    FROM alquiler
    WHERE estado_registro = TRUE
    GROUP BY estado_alquiler
),
stock_general AS (
    SELECT 
        SUM(stock_total) AS stock_total_inventario,
        SUM(stock_alquilado) AS stock_en_obra,
        SUM(stock_total - stock_alquilado) AS stock_bodega
    FROM producto
    WHERE estado_registro = TRUE
)
SELECT 
    COALESCE((SELECT cantidad_contratos FROM alquileres_estado WHERE estado_alquiler = 'activo'), 0) AS contratos_activos,
    COALESCE((SELECT cantidad_contratos FROM alquileres_estado WHERE estado_alquiler = 'pendiente'), 0) AS contratos_pendientes,
    COALESCE((SELECT cantidad_contratos FROM alquileres_estado WHERE estado_alquiler = 'vencido'), 0) AS contratos_vencidos,
    sg.stock_total_inventario,
    sg.stock_en_obra,
    sg.stock_bodega
FROM stock_general sg;
