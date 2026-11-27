-- ============================================================================
-- SGA - Consultas de validación técnica y de integridad sobre sga_db local
-- Archivo: 03_validacion_sga_db.sql
-- Destino exclusivo: base local sga_db (solo lectura, sin credenciales).
-- ============================================================================

-- 1. Identidad de la base
SELECT current_database() AS base_actual, version() AS motor;

-- 2. Revisión Alembic (conservada)
SELECT version_num FROM public.alembic_version;

-- 3. Conteos de objetos estructurales y programables
SELECT count(*) AS tablas_base FROM pg_tables WHERE schemaname = 'public';
SELECT count(*) AS vistas FROM pg_views WHERE schemaname = 'public';
SELECT count(*) AS secuencias FROM information_schema.sequences WHERE sequence_schema = 'public';
SELECT count(*) AS funciones_public FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public';
SELECT count(*) AS triggers_usuario FROM pg_trigger tg
  JOIN pg_class c ON c.oid = tg.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND NOT tg.tgisinternal;

-- 4. Conteos por tabla
SELECT 'usuario' AS tabla, count(*) AS filas FROM public.usuario
UNION ALL SELECT 'producto', count(*) FROM public.producto
UNION ALL SELECT 'alquiler', count(*) FROM public.alquiler
UNION ALL SELECT 'detalle_alquiler', count(*) FROM public.detalle_alquiler
UNION ALL SELECT 'logistica_alquiler', count(*) FROM public.logistica_alquiler
UNION ALL SELECT 'logistica_alquiler_alquiler', count(*) FROM public.logistica_alquiler_alquiler
UNION ALL SELECT 'auditoria_sistema', count(*) FROM public.auditoria_sistema
UNION ALL SELECT 'alembic_version', count(*) FROM public.alembic_version;

-- 5. Distribuciones clave
SELECT rol_usuario, count(*) FROM public.usuario GROUP BY 1 ORDER BY 1;
SELECT estado_alquiler, count(*) FROM public.alquiler GROUP BY 1 ORDER BY 1;
SELECT tipo_movimiento, count(*) FROM public.logistica_alquiler GROUP BY 1 ORDER BY 1;
SELECT nombre_tabla, tipo_operacion, count(*) FROM public.auditoria_sistema GROUP BY 1, 2 ORDER BY 1, 2;

-- 6. Coherencia de stock_alquilado vs detalles de alquileres abiertos (pendiente, activo, vencido)
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

-- 7. Integridad referencial y de auditoría (deben devolver 0)
SELECT count(*) AS auditoria_sin_actor
FROM public.auditoria_sistema
WHERE id_usuario_accion IS NULL;

SELECT count(*) AS auditoria_actor_inexistente
FROM public.auditoria_sistema au
WHERE au.id_usuario_accion IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u.id_usuario = au.id_usuario_accion);

-- 8. Vista operativa
SELECT * FROM public.vw_dashboard_operativo;
