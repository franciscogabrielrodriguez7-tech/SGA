-- ============================================================================
-- SGA - Limpieza controlada de la base de datos local sga_db
-- Archivo: 01_limpieza_sga_db.sql
-- Destino exclusivo: base local sga_db (NUNCA ejecutar en sga_db_mydd).
-- Sin credenciales. No desactiva triggers ni usa CASCADE.
-- ============================================================================

-- Verificación previa de seguridad: confirmar destino antes de limpiar
SELECT current_database() AS base_actual, version() AS motor;

BEGIN;

-- Reinicia exclusivamente las 7 tablas de dominio en orden de dependencias.
-- Se incluyen juntas para evitar el uso de CASCADE y conservar intactas
-- estructuras, restricciones, índices, 12 funciones, 19 triggers y vista.
-- NO se incluye public.alembic_version (se preserva d4f74f3d4896).
TRUNCATE TABLE
    public.logistica_alquiler_alquiler,
    public.detalle_alquiler,
    public.logistica_alquiler,
    public.alquiler,
    public.producto,
    public.usuario,
    public.auditoria_sistema
RESTART IDENTITY;

COMMIT;
