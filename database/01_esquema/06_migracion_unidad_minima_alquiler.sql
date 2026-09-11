-- =========================================================
-- MIGRACIÓN: unidad_minima_alquiler en producto
-- =========================================================
-- Solo es necesario ejecutar este script si la base de datos YA
-- estaba desplegada antes de este cambio. Si vas a crear la base de
-- datos desde cero con 01_tablas.sql, este script no hace falta: la
-- columna ya viene incluida ahí.
--
-- Es seguro ejecutarlo más de una vez (IF NOT EXISTS / DO block).

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'producto' AND column_name = 'unidad_minima_alquiler'
    ) THEN
        ALTER TABLE producto
            ADD COLUMN unidad_minima_alquiler VARCHAR(10) NOT NULL DEFAULT 'DIA';

        ALTER TABLE producto
            ADD CONSTRAINT chk_producto_unidad_minima_alquiler
            CHECK (unidad_minima_alquiler IN ('DIA', 'SEMANA', 'MES'));
    END IF;
END $$;
