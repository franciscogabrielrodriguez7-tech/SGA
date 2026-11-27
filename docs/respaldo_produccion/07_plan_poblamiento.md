# 07 — Plan de Poblamiento Controlado de Datos Demo en Producción (`sga_db_mydd`)

**Estado de la actividad:** **Preparada / Pendiente de autorización expresa** (NO ejecutada).  
**Script preparado:** [02_poblamiento_demo_produccion_preparado.sql](file:///C:/Users/Acer/Documents/Default%20Project/SGA_repo/SGA/docs/respaldo_produccion/scripts/02_poblamiento_demo_produccion_preparado.sql)

---

## 1. Fuente de verdad y alcance de datos a replicar

Los registros de negocio provienen exactamente del conjunto validado en `sga_db` local (verificado en Fase 4):

| Entidad | Filas a insertar | Distribución / Cobertura |
|---|---:|---|
| `usuario` | 14 | `1` admin (`DEMO-ADM-01`), `2` facturación (`DEMO-FAC-01..02`), `2` logísticos (`DEMO-LOG-01..02`), `9` clientes (`DEMO-CLI-01..09`, `DEMO-CLI-09` con `NIT`) |
| `producto` | 10 | `id 1..10`: unidades `DIA`, `SEMANA`, `MES`; incluye `id=9` con stock bajo (`2`) e `id=10` inactivo (`estado_registro = FALSE`, `stock_total = 10`) |
| `alquiler` | 8 | `id 1..8`: `2` `pendiente`, `2` `activo`, `1` `vencido`, `1` `recogido`, `1` `terminado`, `1` `cancelado` |
| `detalle_alquiler` | 20 | `id 1..20`: compatibles con `unidad_minima_alquiler` de cada producto |
| `logistica_alquiler` | 14 | `id 1..14`: `7 ENTREGA`, `2 RECOGIDA`, `5 GASTO` en 3 semanas ISO distintas |
| `logistica_alquiler_alquiler` | 14 | Asociación logística <-> contratos entregados/cerrados/con gasto |
| `auditoria_sistema` | ~97 generados por carga (+ `12` históricos conservados) | **No se copia el historial de auditoría de `sga_db` local.** Los eventos de carga serán generados automáticamente en producción por `trg_auditoria_*` con `app.usuario_actual` |

---

## 2. Manejo de contraseñas y cumplimiento de `H-DB-08`

- Los `9` clientes (`DEMO-CLI-01..09`) se insertan con `contrasena_usuario = NULL`.
- Los `5` empleados internos (`DEMO-ADM-01`, `DEMO-FAC-01..02`, `DEMO-LOG-01..02`) reciben en memoria un hash bcrypt generado mediante `app.utils.security.hashear_contrasena()` (sustituyendo `<HASH_BCRYPT_EMPLEADOS>` al momento de ejecutar, sin guardar hashes ni contraseñas en archivos ni commits).
- **Decisión obligatoria previa sobre `H-DB-08` (exposición en `auditoria_sistema`):**
  - En producción, `fn_auditar_cambios()` actualmente serializa `to_jsonb(NEW)` completo sin excluir `contrasena_usuario`.
  - Si se autoriza ejecutar sin ajustar `fn_auditar_cambios()` (**Opción B**), los `14` `INSERT` de `usuario` registrarán la clave `"contrasena_usuario"` en `auditoria_sistema.datos_nuevos` (`5` con el hash bcrypt sintético y `9` en `null`), lo que entra en tensión con el requisito *"Ausencia de contraseñas en auditoría"*.
  - Si el usuario autoriza aplicar primero un ajuste puntual a `fn_auditar_cambios()` para excluir `- 'contrasena_usuario'` (**Opción A recomendada**), la carga cumplirá íntegramente el requisito sin guardar credenciales en auditoría.

---

## 3. Orden de ejecución y compatibilidad de triggers

1. Dentro de una única transacción (`BEGIN ... COMMIT`), ejecutar primero la limpieza autorizada (`01_limpieza_produccion_preparado.sql`) e inmediatamente `02_poblamiento_demo_produccion_preparado.sql` en el orden: `usuario` -> `producto` -> `alquiler` -> `detalle_alquiler` -> `logistica_alquiler` -> `logistica_alquiler_alquiler` -> `UPDATE` de estados cerrados/vencido (`5, 6, 7, 8`).
2. Usar fechas relativas `CURRENT_DATE` / `CURRENT_TIMESTAMP` en el `INSERT` de `alquiler` y `logistica_alquiler` para cumplir `trg_validar_fecha_inicio` (`fecha_inicio >= CURRENT_DATE`) en la fecha real de ejecución.
3. Verificar secuencias tras la carga (`producto=10`, `alquiler=8`, `detalle_alquiler=20`, `logistica_alquiler=14`, `auditoria_sistema >= 109`).
