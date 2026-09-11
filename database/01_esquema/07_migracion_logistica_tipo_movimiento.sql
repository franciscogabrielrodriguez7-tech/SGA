-- =========================================================
-- MIGRACIÓN: logistica_alquiler → nuevo esquema con tipo_movimiento
--            + tabla puente logistica_alquiler_alquiler
-- =========================================================
-- Cuándo ejecutar este script:
--   Si tu base de datos ya existía con el esquema ANTERIOR de
--   logistica_alquiler (que tenía id_alquiler directa y es_recogida),
--   ejecuta este script para migrarla al nuevo esquema escalable.
--
-- Si estás creando la base de datos desde CERO con 01_tablas.sql,
--   este script NO es necesario: el esquema nuevo ya viene ahí.
--
-- Es SEGURO ejecutarlo más de una vez (bloques IF NOT EXISTS / DO $$).
-- Migra los datos existentes antes de eliminar las columnas viejas.
-- =========================================================

BEGIN;

-- =========================================================
-- PASO 1: Añadir columna tipo_movimiento si no existe
-- =========================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'logistica_alquiler'
          AND column_name = 'tipo_movimiento'
    ) THEN
        ALTER TABLE logistica_alquiler
            ADD COLUMN tipo_movimiento VARCHAR(10);

        -- Poblamos basándonos en es_recogida (esquema viejo):
        -- FALSE = despacho/entrega, TRUE = recogida
        UPDATE logistica_alquiler
        SET tipo_movimiento = CASE
            WHEN es_recogida = FALSE THEN 'ENTREGA'
            WHEN es_recogida = TRUE  THEN 'RECOGIDA'
            ELSE 'ENTREGA'
        END;

        -- Ahora la hacemos NOT NULL y le ponemos el CHECK
        ALTER TABLE logistica_alquiler
            ALTER COLUMN tipo_movimiento SET NOT NULL;

        ALTER TABLE logistica_alquiler
            ADD CONSTRAINT chk_logistica_tipo_movimiento
            CHECK (tipo_movimiento IN ('ENTREGA', 'RECOGIDA', 'GASTO'));

        RAISE NOTICE 'Columna tipo_movimiento añadida y poblada correctamente.';
    ELSE
        RAISE NOTICE 'tipo_movimiento ya existe, se omite el paso 1.';
    END IF;
END $$;


-- =========================================================
-- PASO 2: Crear tabla puente logistica_alquiler_alquiler si no existe
-- =========================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'logistica_alquiler_alquiler'
    ) THEN

        CREATE TABLE logistica_alquiler_alquiler (
            id_logistica_alquiler INTEGER NOT NULL,
            id_alquiler           INTEGER NOT NULL,

            PRIMARY KEY (id_logistica_alquiler, id_alquiler),

            CONSTRAINT fk_logalq_logistica
                FOREIGN KEY (id_logistica_alquiler)
                REFERENCES logistica_alquiler(id_logistica_alquiler)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_logalq_alquiler
                FOREIGN KEY (id_alquiler)
                REFERENCES alquiler(id_alquiler)
                ON UPDATE CASCADE
                ON DELETE RESTRICT
        );

        RAISE NOTICE 'Tabla logistica_alquiler_alquiler creada.';
    ELSE
        RAISE NOTICE 'logistica_alquiler_alquiler ya existe, se omite la creación.';
    END IF;
END $$;


-- =========================================================
-- PASO 3: Migrar datos existentes a la tabla puente
--         (solo si logistica_alquiler aún tiene la columna id_alquiler)
-- =========================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'logistica_alquiler'
          AND column_name = 'id_alquiler'
    ) THEN
        -- Inserta en la tabla puente los pares que aún no estén allí
        INSERT INTO logistica_alquiler_alquiler (id_logistica_alquiler, id_alquiler)
        SELECT l.id_logistica_alquiler, l.id_alquiler
        FROM logistica_alquiler l
        WHERE NOT EXISTS (
            SELECT 1 FROM logistica_alquiler_alquiler laa
            WHERE laa.id_logistica_alquiler = l.id_logistica_alquiler
              AND laa.id_alquiler           = l.id_alquiler
        );

        RAISE NOTICE 'Datos migrados a logistica_alquiler_alquiler.';
    ELSE
        RAISE NOTICE 'id_alquiler ya no existe en logistica_alquiler (migración previa completada). Se omite paso 3.';
    END IF;
END $$;


-- =========================================================
-- PASO 4: Eliminar FK y columna id_alquiler de logistica_alquiler
--         (solo si todavía existen)
-- =========================================================
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    -- Busca el nombre de la FK hacia alquiler (puede variar)
    SELECT conname INTO v_constraint
    FROM pg_constraint
    WHERE conrelid = 'logistica_alquiler'::regclass
      AND contype  = 'f'
      AND confrelid = 'alquiler'::regclass;

    IF v_constraint IS NOT NULL THEN
        EXECUTE 'ALTER TABLE logistica_alquiler DROP CONSTRAINT ' || quote_ident(v_constraint);
        RAISE NOTICE 'FK % eliminada de logistica_alquiler.', v_constraint;
    END IF;

    -- Elimina el índice viejo si existe
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'logistica_alquiler'
          AND indexname  = 'idx_logistica_alquiler_id'
    ) THEN
        DROP INDEX idx_logistica_alquiler_id;
        RAISE NOTICE 'Índice idx_logistica_alquiler_id eliminado.';
    END IF;

    -- Elimina la columna id_alquiler si todavía existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'logistica_alquiler'
          AND column_name = 'id_alquiler'
    ) THEN
        ALTER TABLE logistica_alquiler DROP COLUMN id_alquiler;
        RAISE NOTICE 'Columna id_alquiler eliminada de logistica_alquiler.';
    END IF;
END $$;


-- =========================================================
-- PASO 5: Eliminar columna es_recogida (ya reemplazada por tipo_movimiento)
-- =========================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'logistica_alquiler'
          AND column_name = 'es_recogida'
    ) THEN
        ALTER TABLE logistica_alquiler DROP COLUMN es_recogida;
        RAISE NOTICE 'Columna es_recogida eliminada de logistica_alquiler.';
    ELSE
        RAISE NOTICE 'es_recogida ya no existe, se omite paso 5.';
    END IF;
END $$;


-- =========================================================
-- PASO 6: Crear índice en la tabla puente (si no existe)
-- =========================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'logistica_alquiler_alquiler'
          AND indexname  = 'idx_logalq_alquiler'
    ) THEN
        CREATE INDEX idx_logalq_alquiler ON logistica_alquiler_alquiler(id_alquiler);
        RAISE NOTICE 'Índice idx_logalq_alquiler creado.';
    ELSE
        RAISE NOTICE 'Índice idx_logalq_alquiler ya existe, se omite.';
    END IF;
END $$;


COMMIT;

-- =========================================================
-- VERIFICACIÓN FINAL (opcional — muestra el estado del esquema)
-- =========================================================
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'logistica_alquiler'
ORDER BY ordinal_position;
