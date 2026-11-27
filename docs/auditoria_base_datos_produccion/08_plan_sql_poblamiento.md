# 08 — Plan SQL de limpieza y poblamiento (DISEÑADO, NO EJECUTADO)

> **Estado:** propuesta para revisión. No se ha ejecutado ninguna sentencia de este documento.
> **Destino:** exclusivamente una base de demostración aislada (`sga_demo`), copia de producción o base nueva.
> **Prohibido:** ejecutar este plan sobre `sga_db`. No se eliminan ni modifican datos reales.

## 1. Precondiciones

1. Verificar que la conexión apunta a `sga_demo` y no a `sga_db` (`SELECT current_database();`).
2. Realizar primero el respaldo descrito en `09_plan_backup_y_restauracion.md`.
3. Si `sga_demo` se creó solo con `alembic upgrade head`, instalar antes los objetos programables desde `database/01_esquema/02_funciones_y_triggers.sql` y `database/01_esquema/06_vistas_dashboard.sql`: la migración actual **no** los crea (ver `05_auditoria_alembic.md`).
4. Sustituir `<HASH_BCRYPT_DEMO>` por hashes bcrypt generados en el momento de la carga. No se guarda ningún hash en este documento ni en los informes.
5. Ejecutar todo el bloque como una sola transacción; cualquier error debe terminar en `ROLLBACK`.

## 2. Consideraciones sobre triggers

- No hay triggers de `TRUNCATE`: la limpieza con `TRUNCATE ... RESTART IDENTITY CASCADE` no dispara reglas de stock ni genera auditoría. Es el mecanismo elegido para la base demo.
- Sí hay triggers de `INSERT`/`UPDATE`/`DELETE`: la carga genera auditoría automáticamente y ajusta `stock_alquilado`. Por eso no se desactivan triggers y no se inserta `auditoria_sistema` a mano.
- `SET LOCAL app.usuario_actual` debe emitirse antes de cada grupo de escrituras para que `fn_auditar_cambios()` registre el actor correcto.

## 3. Limpieza (solo en `sga_demo`)

```sql
-- Verificar destino antes de continuar.
SELECT current_database(), version();

BEGIN;
SET LOCAL app.usuario_actual = 'DEMO-ADM-01';

TRUNCATE TABLE public.logistica_alquiler_alquiler,
                public.auditoria_sistema,
                public.logistica_alquiler,
                public.detalle_alquiler,
                public.alquiler,
                public.producto,
                public.usuario
    RESTART IDENTITY CASCADE;

-- NO truncar public.alembic_version: se conserva su estado.
-- COMMIT al final de todo el procedimiento; si falla cualquier paso, ROLLBACK.
```

## 4. Carga en orden de dependencias

```sql
-- (1) USUARIOS -------------------------------------------------------
SET LOCAL app.usuario_actual = 'DEMO-ADM-01';

INSERT INTO public.usuario
 (id_usuario, rol_usuario, nombres_usuario, apellidos_usuario, email_usuario,
  telefono_usuario, contrasena_usuario, tipo_documento, estado_registro)
VALUES
 ('DEMO-ADM-01','admin','Ana','Demo Admin','admin.demo@example.invalid','3009000001','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-FAC-01','encargado_facturacion','Luis','Demo Facturacion','fac1.demo@example.invalid','3009000002','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-FAC-02','encargado_facturacion','Marta','Demo Facturacion','fac2.demo@example.invalid','3009000003','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-LOG-01','encargado_logistico','Carlos','Demo Logistica','log1.demo@example.invalid','3009000004','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-LOG-02','encargado_logistico','Sofia','Demo Logistica','log2.demo@example.invalid','3009000005','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-CLI-01','cliente','Cliente','Uno','cli1.demo@example.invalid','3009000006','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-CLI-02','cliente','Cliente','Dos','cli2.demo@example.invalid','3009000007','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-CLI-03','cliente','Cliente','Tres','cli3.demo@example.invalid','3009000008','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-CLI-04','cliente','Cliente','Cuatro','cli4.demo@example.invalid','3009000009','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-CLI-05','cliente','Cliente','Cinco','cli5.demo@example.invalid','3009000010','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-CLI-06','cliente','Cliente','Seis','cli6.demo@example.invalid','3009000011','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-CLI-07','cliente','Cliente','Siete','cli7.demo@example.invalid','3009000012','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-CLI-08','cliente','Cliente','Ocho','cli8.demo@example.invalid','3009000013','<HASH_BCRYPT_DEMO>','CC',true),
 ('DEMO-CLI-09','cliente','Cliente','Nueve','cli9.demo@example.invalid','3009000014','<HASH_BCRYPT_DEMO>','CC',true);

-- (2) PRODUCTOS ------------------------------------------------------
-- stock_alquilado se deja en 0: los triggers lo ajustan al insertar detalles.
INSERT INTO public.producto
 (id_producto, nombre_producto, descripcion_producto, precio_base_producto,
  precio_base_extra, stock_total, stock_alquilado, unidad_minima_alquiler, estado_registro)
VALUES
 (1,'Planchon metalico 2m','Demo planchon',45000.00,5000.00,60,0,'DIA',true),
 (2,'Cruceta galvanizada','Demo cruceta',12000.00,1500.00,120,0,'DIA',true),
 (3,'Escalera de aluminio 4m','Demo escalera',180000.00,20000.00,20,0,'SEMANA',true),
 (4,'Tubo de andamio 1m','Demo tubo',22000.00,2500.00,80,0,'DIA',true),
 (5,'Base niveladora','Demo base',35000.00,4000.00,30,0,'DIA',true),
 (6,'Baranda de seguridad','Demo baranda',68000.00,7000.00,25,0,'SEMANA',true),
 (7,'Tablero de madera','Demo tablero',52000.00,6000.00,15,0,'MES',true),
 (8,'Abrazadera doble','Demo abrazadera',9000.00,1000.00,200,0,'DIA',true),
 (9,'Producto stock bajo','Demo stock critico',30000.00,3000.00,2,0,'DIA',true),
 (10,'Producto dado de baja','Demo baja logica',15000.00,0.00,10,0,'DIA',false);

-- (3) ALQUILERES -----------------------------------------------------
-- fecha_inicio >= CURRENT_DATE: exigencia de fn_validar_fechas_alquiler.
INSERT INTO public.alquiler
 (id_alquiler, id_usuario_creador, id_usuario_cliente, estado_alquiler, barrio, direccion,
  deposito, precio_alquiler, fecha_inicio, tiempo_alquiler_dias, se_lleva, se_recoge, estado_registro)
VALUES
 (1,'DEMO-FAC-01','DEMO-CLI-01','pendiente','Centro','Calle Demo 101',100000.00,350000.00,CURRENT_DATE + 2,5,true,true,true),
 (2,'DEMO-FAC-01','DEMO-CLI-02','pendiente','Norte','Calle Demo 102',120000.00,420000.00,CURRENT_DATE + 3,7,true,true,true),
 (3,'DEMO-FAC-02','DEMO-CLI-03','activo','Sur','Calle Demo 103',90000.00,300000.00,CURRENT_DATE,5,true,true,true),
 (4,'DEMO-FAC-02','DEMO-CLI-04','activo','Este','Calle Demo 104',150000.00,510000.00,CURRENT_DATE,10,true,true,true),
 (5,'DEMO-FAC-01','DEMO-CLI-05','activo','Oeste','Calle Demo 105',80000.00,260000.00,CURRENT_DATE,4,true,true,true),
 (6,'DEMO-FAC-02','DEMO-CLI-06','pendiente','Centro','Calle Demo 106',70000.00,240000.00,CURRENT_DATE + 1,3,true,true,true),
 (7,'DEMO-FAC-01','DEMO-CLI-07','pendiente','Norte','Calle Demo 107',110000.00,380000.00,CURRENT_DATE + 5,6,true,true,true),
 (8,'DEMO-FAC-02','DEMO-CLI-08','pendiente','Sur','Calle Demo 108',95000.00,330000.00,CURRENT_DATE + 4,5,true,true,true);

-- (4) DETALLES -------------------------------------------------------
-- Se insertan con los contratos abiertos; los triggers validan stock y ajustan stock_alquilado.
INSERT INTO public.detalle_alquiler
 (id_alquiler, id_producto, precio_conjunto, cantidad_productos, es_producto_extra, estado_registro)
VALUES
 (1,1,225000.00,5,false,true), (1,2,60000.00,5,false,true), (1,8,9000.00,3,true,true),
 (2,3,360000.00,2,false,true), (2,6,136000.00,2,false,true),
 (3,4,110000.00,5,false,true), (3,5,105000.00,3,false,true), (3,8,36000.00,4,false,true),
 (4,3,360000.00,2,false,true), (4,6,136000.00,2,false,true), (4,7,156000.00,3,false,true),
 (5,1,180000.00,4,false,true), (5,2,48000.00,4,false,true),
 (6,4,88000.00,4,false,true), (6,5,70000.00,2,false,true),
 (7,6,204000.00,3,false,true), (7,7,156000.00,3,false,true),
 (8,8,72000.00,8,false,true), (8,1,135000.00,3,false,true), (8,2,36000.00,3,false,true);

-- (5) MOVIMIENTOS LOGISTICOS ----------------------------------------
INSERT INTO public.logistica_alquiler
 (id_logistica_alquiler, id_usuario_logistico, tipo_movimiento, fecha_gasto,
  descripcion_gasto_logistico, valor_gasto_logistico, observaciones_logistica_alquiler, estado_registro)
VALUES
 (1,'DEMO-LOG-01','ENTREGA',CURRENT_DATE,'Entrega inicial contrato 3',0.00,'Demo',true),
 (2,'DEMO-LOG-01','ENTREGA',CURRENT_DATE,'Entrega inicial contrato 4',0.00,'Demo',true),
 (3,'DEMO-LOG-02','ENTREGA',CURRENT_DATE,'Entrega inicial contrato 5',0.00,'Demo',true),
 (4,'DEMO-LOG-02','ENTREGA',CURRENT_DATE,'Entrega parcial contrato 4',0.00,'Demo',true),
 (5,'DEMO-LOG-01','ENTREGA',CURRENT_DATE,'Entrega inicial contrato 8',0.00,'Demo',true),
 (6,'DEMO-LOG-02','ENTREGA',CURRENT_DATE,'Entrega contrato 7',0.00,'Demo',true),
 (7,'DEMO-LOG-01','ENTREGA',CURRENT_DATE,'Entrega contrato 6',0.00,'Demo',true),
 (8,'DEMO-LOG-02','RECOGIDA',CURRENT_DATE,'Recogida contrato 3',0.00,'Demo',true),
 (9,'DEMO-LOG-01','RECOGIDA',CURRENT_DATE,'Recogida contrato 5',0.00,'Demo',true),
 (10,'DEMO-LOG-02','RECOGIDA',CURRENT_DATE,'Recogida parcial contrato 4',0.00,'Demo',true),
 (11,'DEMO-LOG-01','RECOGIDA',CURRENT_DATE,'Recogida contrato 6',0.00,'Demo',true),
 (12,'DEMO-FAC-01','GASTO',CURRENT_DATE,'Combustible demo',85000.00,'Demo gasto semana 1',true),
 (13,'DEMO-FAC-01','GASTO',CURRENT_DATE - 7,'Transporte demo',120000.00,'Demo gasto semana 2',true),
 (14,'DEMO-FAC-02','GASTO',CURRENT_DATE - 14,'Mantenimiento demo',65000.00,'Demo gasto semana 3',true);

-- (6) PUENTE LOGISTICA <-> ALQUILER ----------------------------------
INSERT INTO public.logistica_alquiler_alquiler (id_logistica_alquiler, id_alquiler) VALUES
 (1,3),(2,4),(3,5),(4,4),(5,8),(6,7),(7,6),(8,3),(9,5),(10,4),(11,6),
 (12,3),(13,4),(14,5);
```

## 5. Transiciones de estado para los escenarios

```sql
-- Vencido: el INSERT exige fecha no pasada; se simula con UPDATE posterior.
SET LOCAL app.usuario_actual = 'DEMO-FAC-01';
UPDATE public.alquiler
   SET estado_alquiler = 'vencido', fecha_inicio = CURRENT_DATE - 12
 WHERE id_alquiler = 5;

-- Los detalles ya existen antes del cierre; el trigger devuelve stock al producto.
SET LOCAL app.usuario_actual = 'DEMO-ADM-01';
UPDATE public.alquiler SET estado_alquiler = 'recogido'   WHERE id_alquiler = 3;
UPDATE public.alquiler SET estado_alquiler = 'terminado' WHERE id_alquiler = 4;
UPDATE public.alquiler SET estado_alquiler = 'cancelado' WHERE id_alquiler = 6;

-- Reapertura controlada de un contrato recogido (nunca UPDATE directo).
-- SELECT public.fn_admin_reabrir_alquiler(3);
```

## 6. Secuencias y contadores

Aunque los IDs principales se indican explícitamente para hacer legible el plan, se sincronizan todas las secuencias al final:

```sql
-- usuario NO tiene secuencia: su PK es VARCHAR natural, no requiere setval.

SELECT setval(pg_get_serial_sequence('public.producto','id_producto'),
              (SELECT max(id_producto) FROM public.producto), true);
SELECT setval(pg_get_serial_sequence('public.alquiler','id_alquiler'),
              (SELECT max(id_alquiler) FROM public.alquiler), true);
SELECT setval(pg_get_serial_sequence('public.detalle_alquiler','id_detalle_alquiler'),
              (SELECT max(id_detalle_alquiler) FROM public.detalle_alquiler), true);
SELECT setval(pg_get_serial_sequence('public.logistica_alquiler','id_logistica_alquiler'),
              (SELECT max(id_logistica_alquiler) FROM public.logistica_alquiler), true);
SELECT setval(pg_get_serial_sequence('public.auditoria_sistema','id_auditoria'),
              (SELECT max(id_auditoria) FROM public.auditoria_sistema), true);
```

Nota: `usuario` no tiene secuencia (PK natural `VARCHAR`); la primera sentencia del bloque es solo ilustrativa y debe omitirse.

## 7. Validación y cierre

```sql
-- Conteos esperados: 14, 10, 8, 20, 14, 14 (más la auditoría generada).
SELECT 'usuario' AS tabla, count(*) FROM public.usuario
UNION ALL SELECT 'producto', count(*) FROM public.producto
UNION ALL SELECT 'alquiler', count(*) FROM public.alquiler
UNION ALL SELECT 'detalle_alquiler', count(*) FROM public.detalle_alquiler
UNION ALL SELECT 'logistica_alquiler', count(*) FROM public.logistica_alquiler
UNION ALL SELECT 'logistica_alquiler_alquiler', count(*) FROM public.logistica_alquiler_alquiler
UNION ALL SELECT 'auditoria_sistema', count(*) FROM public.auditoria_sistema;

-- Sin huérfanos en las 7 FK (mismo criterio de la auditoría).
-- Ver consultas parametrizadas en consultas_auditoria.sql.

-- Stock coherente: debe devolver 0.
SELECT count(*) AS stock_inconsistente
FROM public.producto p
WHERE p.estado_registro = TRUE
  AND p.stock_alquilado <> COALESCE((
        SELECT sum(d.cantidad_productos)
        FROM public.detalle_alquiler d
        JOIN public.alquiler a ON a.id_alquiler = d.id_alquiler
        WHERE d.id_producto = p.id_producto AND d.estado_registro = TRUE
          AND a.estado_alquiler IN ('pendiente','activo','vencido')), 0);

-- Actor de auditoría presente en las escrituras de la carga.
SELECT count(*) FILTER (WHERE id_usuario_accion IS NULL) AS sin_actor
FROM public.auditoria_sistema;

SELECT * FROM public.vw_dashboard_operativo;
```

Cerrar con `COMMIT;` solo si todas las validaciones son correctas; en caso contrario `ROLLBACK;`.

## 8. Recuperación

- Todas las sentencias están dentro de un único `BEGIN`/`COMMIT`; un error temprano puede resolverse con `ROLLBACK` sin dejar datos parciales.
- Antes de reintentar, restaurar `sga_demo` desde el respaldo previo (`09_plan_backup_y_restauracion.md`).
- Si se usó `TRUNCATE ... RESTART IDENTITY`, las secuencias vuelven a 1; el bloque de `setval` debe repetirse tras la recarga.
