-- ============================================================================
-- SGA - Consultas de validación de solo lectura sobre sga_db_mydd
-- Archivo: 03_validacion_produccion.sql
-- ============================================================================

SELECT current_database() AS base_actual, current_schema() AS esquema, version() AS motor;
SELECT version_num FROM public.alembic_version;

SELECT 'usuario' AS tabla, count(*) AS filas FROM public.usuario
UNION ALL SELECT 'producto', count(*) FROM public.producto
UNION ALL SELECT 'alquiler', count(*) FROM public.alquiler
UNION ALL SELECT 'detalle_alquiler', count(*) FROM public.detalle_alquiler
UNION ALL SELECT 'logistica_alquiler', count(*) FROM public.logistica_alquiler
UNION ALL SELECT 'logistica_alquiler_alquiler', count(*) FROM public.logistica_alquiler_alquiler
UNION ALL SELECT 'auditoria_sistema', count(*) FROM public.auditoria_sistema
UNION ALL SELECT 'alembic_version', count(*) FROM public.alembic_version;

SELECT rol_usuario, count(*) FROM public.usuario GROUP BY 1 ORDER BY 1;
SELECT estado_alquiler, count(*) FROM public.alquiler GROUP BY 1 ORDER BY 1;
SELECT tipo_movimiento, count(*) FROM public.logistica_alquiler GROUP BY 1 ORDER BY 1;

SELECT p.id_producto, p.nombre_producto, p.stock_total, p.stock_alquilado,
       COALESCE((
           SELECT SUM(d.cantidad_productos)
           FROM public.detalle_alquiler d
           JOIN public.alquiler a ON a.id_alquiler = d.id_alquiler
           WHERE d.id_producto = p.id_producto
             AND d.estado_registro = TRUE
             AND a.estado_alquiler IN ('pendiente', 'activo', 'vencido')
       ), 0) AS stock_calculado
FROM public.producto p
ORDER BY p.id_producto;

SELECT count(*) AS clientes_con_contrasena
FROM public.usuario
WHERE rol_usuario = 'cliente' AND contrasena_usuario IS NOT NULL;

SELECT count(*) AS auditoria_sin_actor
FROM public.auditoria_sistema
WHERE id_usuario_accion IS NULL;

SELECT count(*) AS auditoria_clave_contrasena_usuario
FROM public.auditoria_sistema
WHERE (datos_nuevos ? 'contrasena_usuario') OR (datos_anteriores ? 'contrasena_usuario');

SELECT * FROM public.vw_dashboard_operativo;
