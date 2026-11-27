# 06 — Limpieza Controlada y Corrección de `H-DB-08` en Producción (`sga_db_mydd`)

**Estado de la actividad:** **Ejecutada** dentro de transacción atómica (`BEGIN ... COMMIT`).  
**Fecha:** 2026-11-27  
**Script de referencia:** [01_limpieza_produccion_preparado.sql](file:///C:/Users/Acer/Documents/Default%20Project/SGA_repo/SGA/docs/respaldo_produccion/scripts/01_limpieza_produccion_preparado.sql)

---

## 1. Verificación previa de claves foráneas y `ON DELETE` (Fase 3)

Se inspeccionaron las `7` llaves foráneas del esquema `public` en `sga_db_mydd`:

1. `fk_alquiler_usuario_cliente`: `alquiler(id_usuario_cliente) -> usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT`
2. `fk_alquiler_usuario_creador`: `alquiler(id_usuario_creador) -> usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT`
3. `fk_detalle_alquiler_alquiler`: `detalle_alquiler(id_alquiler) -> alquiler(id_alquiler) ON UPDATE CASCADE ON DELETE RESTRICT`
4. `fk_detalle_alquiler_producto`: `detalle_alquiler(id_producto) -> producto(id_producto) ON UPDATE CASCADE ON DELETE RESTRICT`
5. `fk_logistica_usuario`: `logistica_alquiler(id_usuario_logistico) -> usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT`
6. `logistica_alquiler_alquiler_id_alquiler_fkey`: `logistica_alquiler_alquiler(id_alquiler) -> alquiler(id_alquiler) ON UPDATE CASCADE ON DELETE RESTRICT`
7. `logistica_alquiler_alquiler_id_logistica_alquiler_fkey`: `logistica_alquiler_alquiler(id_logistica_alquiler) -> logistica_alquiler(id_logistica_alquiler) ON UPDATE CASCADE ON DELETE CASCADE`

**Conclusión de integridad:** ni `public.auditoria_sistema` ni `public.alembic_version` mantienen llaves foráneas hacia las `6` tablas operativas. Por tanto, truncar conjuntamente las `6` tablas operativas con `RESTART IDENTITY` **sin `CASCADE`** no afecta ninguna tabla conservada, preserva intactos los `12` registros históricos de `auditoria_sistema` (`id_auditoria` entre `1` y `20`) y reinicia limpiamente las `4` secuencias operativas a `1`.

---

## 2. Corrección de `H-DB-08` en `fn_auditar_cambios()` (Fase 4)

Dentro de la transacción en `sga_db_mydd`, antes de poblar datos, se actualizó `public.fn_auditar_cambios()` para excluir la clave `'contrasena_usuario'` mediante el operador JSONB `- 'contrasena_usuario'` en:

- `TG_OP = 'DELETE'`: `v_datos_viejos := to_jsonb(OLD) - 'contrasena_usuario';`
- `TG_OP = 'INSERT'` / `'UPDATE'`: `v_datos_nuevos := to_jsonb(NEW) - 'contrasena_usuario';`
- `TG_OP = 'UPDATE'`: `v_datos_viejos := to_jsonb(OLD) - 'contrasena_usuario';`

### Tratamiento del registro histórico con clave sensible

- Los `12` registros históricos previos (`id_auditoria IN (1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 20)`) se conservaron sin modificar ni eliminar.
- Se documenta que el registro histórico `id_auditoria = 20` (`nombre_tabla = 'usuario'`, `tipo_operacion = 'UPDATE'`) conserva la clave `contrasena_usuario` en `datos_anteriores` y `datos_nuevos`.
- **Propuesta de saneamiento futuro (NO ejecutada):** si se autoriza en una intervención posterior, puede ejecutarse puntualmente:
  ```sql
  UPDATE public.auditoria_sistema
  SET datos_anteriores = datos_anteriores - 'contrasena_usuario',
      datos_nuevos     = datos_nuevos - 'contrasena_usuario'
  WHERE id_auditoria = 20;
  ```

---

## 3. Ejecución de la limpieza (Fase 5)

- Con `CONCURRENT_ACTIVE_QUERIES = 0` y tras verificar `AUDIT_PRE = (12, 1, 20)`, se ejecutó `TRUNCATE TABLE public.logistica_alquiler_alquiler, public.detalle_alquiler, public.logistica_alquiler, public.alquiler, public.producto, public.usuario RESTART IDENTITY;` sin desactivar triggers y conservando los `12` registros históricos en `auditoria_sistema`.
