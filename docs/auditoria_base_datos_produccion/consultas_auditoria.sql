-- =====================================================================
-- consultas_auditoria.sql
-- Consultas de SOLO LECTURA utilizadas en la auditoría de sga_db (2026-11-26).
-- No contienen credenciales, cadenas de conexión ni datos personales.
-- La conexión se establece desde el entorno; la sesión se configuró como
-- READ ONLY + autocommit antes de ejecutar cualquier consulta.
-- =====================================================================

-- FASE 1: identidad del servidor --------------------------------------
SELECT version(), current_database(), current_user, inet_server_port();
SELECT schema_name FROM information_schema.schemata
 WHERE schema_name NOT LIKE 'pg_%' AND schema_name <> 'information_schema'
 ORDER BY 1;

-- FASE 2: tablas y columnas -------------------------------------------
SELECT table_name, table_type FROM information_schema.tables
 WHERE table_schema = 'public' ORDER BY table_name;

SELECT table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default, character_maximum_length,
       numeric_precision, numeric_scale, is_identity, identity_generation
  FROM information_schema.columns
 WHERE table_schema = 'public'
 ORDER BY table_name, ordinal_position;

SELECT t.relname AS tabla, con.conname, con.contype,
       pg_get_constraintdef(con.oid) AS definicion
  FROM pg_constraint con
  JOIN pg_class t ON t.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
 WHERE n.nspname = 'public'
 ORDER BY t.relname, con.contype, con.conname;

SELECT schemaname, tablename, indexname, indexdef
  FROM pg_indexes WHERE schemaname = 'public'
 ORDER BY tablename, indexname;

SELECT sequence_name, data_type, start_value, increment,
       minimum_value, maximum_value, cycle_option
  FROM information_schema.sequences
 WHERE sequence_schema = 'public' ORDER BY sequence_name;

-- Repetir para cada secuencia de la consulta anterior:
-- SELECT last_value, is_called FROM public.<secuencia>;

SELECT c.relname AS hija, p.relname AS padre, c.relkind
  FROM pg_inherits i
  JOIN pg_class c ON c.oid = i.inhrelid
  JOIN pg_class p ON p.oid = i.inhparent
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public';

SELECT c.relname FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'p';

-- FASE 3: objetos programables ----------------------------------------
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS argumentos,
       pg_get_function_result(p.oid) AS retorno,
       l.lanname AS lenguaje, p.provolatile, p.prosecdef,
       obj_description(p.oid) AS comentario,
       pg_get_functiondef(p.oid) AS definicion
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  LEFT JOIN pg_language l ON l.oid = p.prolang
 WHERE n.nspname = 'public'
 ORDER BY p.proname, p.oid;

SELECT tg.tgname, c.relname AS tabla, tg.tgtype,
       pg_get_triggerdef(tg.oid) AS definicion, f.proname AS funcion
  FROM pg_trigger tg
  JOIN pg_class c ON c.oid = tg.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_proc f ON f.oid = tg.tgfoid
 WHERE n.nspname = 'public' AND NOT tg.tgisinternal
 ORDER BY c.relname, tg.tgname;

SELECT table_name, view_definition FROM information_schema.views
 WHERE table_schema = 'public' ORDER BY table_name;

SELECT c.relname, pg_get_viewdef(c.oid, true)
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'm';

SELECT extname, extversion, extnamespace::regnamespace::text
  FROM pg_extension ORDER BY extname;

SELECT t.typname, e.enumlabel
  FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
  JOIN pg_namespace n ON n.oid = t.typnamespace
 WHERE n.nspname = 'public' ORDER BY t.typname, e.enumsortorder;

-- FASE 4: Alembic ------------------------------------------------------
SELECT version_num FROM public.alembic_version;

-- FASE 5: estado de datos (solo agregados) ----------------------------
SELECT 'usuario' AS tabla, count(*) FROM public.usuario
UNION ALL SELECT 'producto', count(*) FROM public.producto
UNION ALL SELECT 'alquiler', count(*) FROM public.alquiler
UNION ALL SELECT 'detalle_alquiler', count(*) FROM public.detalle_alquiler
UNION ALL SELECT 'logistica_alquiler', count(*) FROM public.logistica_alquiler
UNION ALL SELECT 'logistica_alquiler_alquiler', count(*) FROM public.logistica_alquiler_alquiler
UNION ALL SELECT 'auditoria_sistema', count(*) FROM public.auditoria_sistema
UNION ALL SELECT 'alembic_version', count(*) FROM public.alembic_version;

SELECT rol_usuario, estado_registro, count(*) FROM public.usuario GROUP BY 1,2 ORDER BY 1,2;
SELECT estado_alquiler, count(*) FROM public.alquiler GROUP BY 1 ORDER BY 2 DESC;
SELECT tipo_movimiento, count(*) FROM public.logistica_alquiler GROUP BY 1 ORDER BY 2 DESC;
SELECT nombre_tabla, count(*) FROM public.auditoria_sistema GROUP BY 1 ORDER BY 2 DESC;
SELECT tipo_operacion, count(*) FROM public.auditoria_sistema GROUP BY 1 ORDER BY 2 DESC;
SELECT count(*) FILTER (WHERE id_usuario_accion IS NULL) AS sin_actor,
       count(*) FILTER (WHERE id_usuario_accion IS NOT NULL) AS con_actor
  FROM public.auditoria_sistema;

-- Presencia de la clave de contraseña en la auditoría (sin exponer valores):
SELECT count(*) FILTER (WHERE datos_nuevos ? 'contrasena_usuario') AS claves_en_nuevos
  FROM public.auditoria_sistema WHERE nombre_tabla = 'usuario';

-- Plantilla de huérfanos: sustituir <hija>, <padre>, <col_hija>, <col_padre>.
-- SELECT count(*) FROM public.<hija> c
--   LEFT JOIN public.<padre> p ON c.<col_hija> = p.<col_padre>
--  WHERE c.<col_hija> IS NOT NULL AND p.<col_padre> IS NULL;

-- Stock inconsistente:
SELECT count(*) FROM public.producto p
 WHERE p.estado_registro = TRUE
   AND p.stock_alquilado <> COALESCE((
     SELECT sum(d.cantidad_productos) FROM public.detalle_alquiler d
       JOIN public.alquiler a ON a.id_alquiler = d.id_alquiler
      WHERE d.id_producto = p.id_producto AND d.estado_registro = TRUE
        AND a.estado_alquiler IN ('pendiente','activo','vencido')), 0);

SELECT count(*) FROM public.alquiler a
 WHERE NOT EXISTS (SELECT 1 FROM public.detalle_alquiler d
                    WHERE d.id_alquiler = a.id_alquiler AND d.estado_registro = TRUE);

SELECT count(*) FROM public.logistica_alquiler l
 WHERE NOT EXISTS (SELECT 1 FROM public.logistica_alquiler_alquiler x
                    WHERE x.id_logistica_alquiler = l.id_logistica_alquiler);

SELECT count(*) FROM public.auditoria_sistema au
 WHERE au.id_usuario_accion IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u.id_usuario = au.id_usuario_accion);

-- Secuencias frente a máximos:
SELECT max(id_alquiler) FROM public.alquiler;
SELECT max(id_producto) FROM public.producto;
SELECT max(id_detalle_alquiler) FROM public.detalle_alquiler;
SELECT max(id_logistica_alquiler) FROM public.logistica_alquiler;
SELECT max(id_auditoria) FROM public.auditoria_sistema;

-- Tamaños:
SELECT pg_size_pretty(pg_database_size(current_database()));
SELECT relname, pg_size_pretty(pg_total_relation_size(c.oid))
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
 ORDER BY pg_total_relation_size(c.oid) DESC;

-- Vista:
SELECT * FROM public.vw_dashboard_operativo;
