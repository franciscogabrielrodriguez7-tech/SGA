# 03 — Comparación Estructural: Producción (`sga_db_mydd`) vs Local (`sga_db`)

**Estado de la actividad:** **Ejecutada** (consultas de solo lectura).  
**Fecha:** 2026-11-27

---

## 1. Resumen comparativo de objetos

| Aspecto comparado | Producción (`sga_db_mydd`) | Local (`sga_db`) | Coincidencia |
|---|---|---|---|
| Motor PostgreSQL | `18.6` (Debian x86_64) | `18.4` (Windows x86_64) | Compatible (`18.x`) vs `16` en `docker-compose.yml` |
| Tablas (`public`) | 8 | 8 | Exacta (`True`) |
| Columnas (`information_schema.columns`) | 73 | 73 | Mismos nombres, tipos y nulabilidad; difiere solo formato textual del default nulo en `usuario.contrasena_usuario` y `usuario.email_usuario` (`None` vs `NULL::character varying`) |
| Vistas (`vw_dashboard_operativo`) | 1 | 1 | Nombre y definición SQL idénticas (`True`) |
| Funciones PL/pgSQL | 12 | 12 | Nombres exactos (`True`); `11/12` idénticas y `fn_impedir_autodesactivacion_admin` solo difiere en 2 comentarios `--` |
| Triggers de usuario | 19 | 19 | Exacta (`True`) |
| Índices | 26 | 26 | Exacta (`True`) |
| Restricciones totales | 92 (`33` no-NN) | 92 (`33` no-NN) | Definiciones idénticas (`Diff defs: []`); en `logistica_alquiler_alquiler` difieren solo los nombres de 2 FKs (`logistica_alquiler_alquiler_id_*_fkey` en prod vs `fk_logalq_*` en local) |
| Revisión `alembic_version` | `0001_initial_schema` | `d4f74f3d4896` | Diferente (`0001_initial_schema` existe en `sga_backend_jwt/alembic/versions/`) |

---

## 2. Evaluación de los hallazgos técnicos (Fase 2.2)

| Hallazgo | Presente en `sga_db_mydd` | Evidencia observada | ¿Impide una carga segura? |
|---|---|---|---|
| `H-DB-01` (revisión Alembic) | **No en producción** | Producción registra `0001_initial_schema` (presente en el repo); local registra `d4f74f3d4896` | No; conservar `0001_initial_schema` sin ejecutar migraciones |
| `H-DB-02` (funciones/triggers/vista fuera de migraciones) | **Sí** | `12` funciones, `19` triggers y `vw_dashboard_operativo` existen en producción fuera de `0001_initial_schema` | No, si la carga respeta todas las reglas de negocio de los triggers |
| `H-DB-03` (`app.current_user_id` vs `app.usuario_actual`) | **Sí** | `fn_impedir_autodesactivacion_admin()` lee `current_setting('app.current_user_id', true)` | No impide la carga; queda abierto como riesgo funcional |
| `H-DB-07` (diferencia de versiones PostgreSQL) | **Sí** | `18.6` (Render) vs `18.4` (local) vs `16` (`docker-compose.yml`) | No; `pg_dump` / `pg_restore` v18.4 probado con éxito |
| `H-DB-08` (exposición de `contrasena_usuario` en auditoría) | **Sí** | `fn_auditar_cambios()` serializa `to_jsonb(NEW)` completo (`strips contrasena_usuario = False`); `1` evento previo afectado | **Requiere decisión previa (Fase 6):** si no se corrige `fn_auditar_cambios()` antes de insertar empleados demo, los triggers registrarán la clave `"contrasena_usuario"` (hash bcrypt sintético) en `auditoria_sistema.datos_nuevos` |

---

## 3. Hallazgos críticos adicionales detectados en triggers durante la preparación

1. **`fn_garantizar_minimo_un_admin` (`trg_garantizar_minimo_un_admin`):** bloquea eliminar (`DELETE`) o desactivar al último administrador activo.
2. **`fn_validar_modificacion_producto` (`trg_validar_modificacion_producto`):** en su rama final ejecuta `RETURN NEW;`, lo que en un `BEFORE DELETE` (donde `NEW` es `NULL`) anula silenciosamente el borrado por fila en `producto`, además de bloquear bajas si `stock_alquilado > 0`.
3. **`fn_sincronizar_stock_producto` + desfase previo:** como `sga_db_mydd` tiene `stock_alquilado = 0` pero `detalle_alquiler` activo (`2` y `12` uds), un `DELETE FROM detalle_alquiler` restaría cantidades desde `0` y violaría el `CHECK (stock_alquilado >= 0)`.
4. **Validación de `fecha_inicio >= CURRENT_DATE` (`trg_validar_fecha_inicio`):** hoy es `2026-11-27`, por lo que `INSERT` en `alquiler` debe usar `CURRENT_DATE` (o fechas futuras) y nunca fechas literales del `2026-11-26`.
