# 06 — Plan de Limpieza Controlada de Producción (`sga_db_mydd`)

**Estado de la actividad:** **Preparada / Pendiente de autorización expresa** (NO ejecutada).  
**Script preparado:** [01_limpieza_produccion_preparado.sql](file:///C:/Users/Acer/Documents/Default%20Project/SGA_repo/SGA/docs/respaldo_produccion/scripts/01_limpieza_produccion_preparado.sql)

---

## 1. Datos actuales que se propone reemplazar

| Tabla | Filas actuales | Propuesta |
|---|---:|---|
| `logistica_alquiler_alquiler` | 9 | Vaciar dentro de transacción controlada |
| `detalle_alquiler` | 6 | Vaciar dentro de transacción controlada |
| `logistica_alquiler` | 9 | Vaciar dentro de transacción controlada |
| `alquiler` | 6 | Vaciar dentro de transacción controlada |
| `producto` | 7 | Vaciar dentro de transacción controlada |
| `usuario` | 22 | Vaciar dentro de transacción controlada e insertar inmediatamente los 14 usuarios demo (incluyendo `DEMO-ADM-01`) en la misma secuencia transaccional |
| `auditoria_sistema` | 12 | **CONSERVAR intactas** (no se eliminan registros históricos ni se reinicia `auditoria_sistema_id_auditoria_seq`) |
| `alembic_version` | 1 (`0001_initial_schema`) | **CONSERVAR intacta** (no se modifica ni reinicializa Alembic) |

---

## 2. Análisis técnico del orden y método de limpieza

1. **Tablas estructurales y objetos programables preservados:** `alembic_version`, las `8` tablas, `1` vista (`vw_dashboard_operativo`), `12` funciones, `19` triggers, `26` índices y `92` restricciones permanecen intactos.
2. **Por qué `TRUNCATE TABLE ... RESTART IDENTITY` sin `CASCADE` sobre las 6 tablas de negocio (en lugar de `DELETE` masivo):**
   - Al inspeccionar los triggers reales de `sga_db_mydd` en Fase 2 se comprobó que `DELETE` masivo dispararía tres bloqueos o efectos secundarios reales:
     1. `trg_validar_modificacion_producto` ejecuta `RETURN NEW;`, lo que en un `BEFORE DELETE` (donde `NEW` es `NULL`) cancela silenciosamente la eliminación de filas en `producto`.
     2. `trg_sincronizar_stock_producto` (`AFTER DELETE` en `detalle_alquiler`) intentaría restar cantidades desde `stock_alquilado = 0` (por el desfase previo detectado en producción), provocando un fallo `CHECK (stock_alquilado >= 0)`.
     3. `trg_garantizar_minimo_un_admin` impide eliminar al último administrador antes de insertar el nuevo administrador, y `DELETE` dejaría las secuencias (`id_producto`, `id_alquiler`, `id_detalle_alquiler`, `id_logistica_alquiler`) desplazadas respecto a `1..N` de `sga_db` local.
   - Ejecutar `TRUNCATE TABLE public.logistica_alquiler_alquiler, public.detalle_alquiler, public.logistica_alquiler, public.alquiler, public.producto, public.usuario RESTART IDENTITY;` **sin `CASCADE`** en una sola sentencia lista explícitamente las 6 tablas con relaciones FK entre sí, respeta todas las FK, **no toca `auditoria_sistema` (`12` filas históricas preservadas) ni `alembic_version`**, mantiene activos los `19` triggers para la fase de inserción y reinicia las `4` secuencias operativas a `1`.
3. **Protección de la cuenta administrativa:** la limpieza y la inserción de `DEMO-ADM-01` (y del resto del dataset) deben ejecutarse bajo control transaccional único (`BEGIN ... COMMIT`), de manera que si ocurre cualquier fallo en Fase 7.3 se ejecuta `ROLLBACK` automático y producción nunca queda sin cuenta `admin` activa ni con datos a medias. *(Si además el usuario prefiere conservar intacta la cuenta administrativa previa de producción en lugar de sustituirla por `DEMO-ADM-01`, se ajustará el plan antes de autorizar Fase 7.)*
4. **Registro en auditoría y recuperación:** la carga posterior mantiene activos los triggers `trg_auditoria_*` (con `SET LOCAL app.usuario_actual`), agregando la trazabilidad de la carga sobre los `12` eventos históricos previos. Ante cualquier falla no recuperable por `ROLLBACK`, se dispone del respaldo verificado `C:\RespaldosSGA\sga_db_mydd_previo_carga_20261127_091347.dump`.
