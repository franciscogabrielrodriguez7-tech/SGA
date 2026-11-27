-- ============================================================================
-- SGA - Script PREPARADO (NO EJECUTADO) de limpieza controlada en sga_db_mydd
-- Archivo: 01_limpieza_produccion_preparado.sql
-- Requiere AUTORIZACIÓN EXPRESA del usuario antes de ejecutar.
-- Conserva intactas:
--   - public.auditoria_sistema (12 eventos históricos previos)
--   - public.alembic_version ('0001_initial_schema')
--   - Estructura completa (8 tablas, 1 vista, 12 funciones, 19 triggers, 26 índices, 92 restricciones)
-- Sin CASCADE, sin credenciales, sin desactivar triggers.
-- Se ejecuta dentro de la misma transacción única junto con 02_poblamiento_demo_produccion_preparado.sql.
-- ============================================================================

-- Verificación obligatoria de identidad antes de cualquier operación:
-- Debe devolver exactamente 'sga_db_mydd'.
SELECT current_database() AS base_actual, current_schema() AS esquema_actual, version() AS motor;

-- Limpieza exclusivamente de las 6 tablas operativas en una sola sentencia sin CASCADE:
TRUNCATE TABLE
    public.logistica_alquiler_alquiler,
    public.detalle_alquiler,
    public.logistica_alquiler,
    public.alquiler,
    public.producto,
    public.usuario
RESTART IDENTITY;
