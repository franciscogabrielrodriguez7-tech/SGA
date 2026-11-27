# 07 — Poblamiento Controlado de Datos Demo en Producción (`sga_db_mydd`)

**Estado de la actividad:** **Ejecutada** dentro de la misma transacción atómica junto con la Fase 4 y Fase 5.  
**Fecha:** 2026-11-27  
**Script ejecutado:** [02_poblamiento_demo_produccion_preparado.sql](file:///C:/Users/Acer/Documents/Default%20Project/SGA_repo/SGA/docs/respaldo_produccion/scripts/02_poblamiento_demo_produccion_preparado.sql)

---

## 1. Resumen de registros insertados en `sga_db_mydd`

| Tabla | Filas antes | Filas finales | Detalle de carga |
|---|---:|---:|---|
| `usuario` | 22 | **14** | `1` admin (`DEMO-ADM-01`), `2` facturación (`DEMO-FAC-01..02`), `2` logísticos (`DEMO-LOG-01..02`) con hash bcrypt generado en memoria por `app.utils.security.hashear_contrasena()`; `9` clientes (`DEMO-CLI-01..09`) con `contrasena_usuario = NULL` |
| `producto` | 7 | **10** | `id 1..10`: unidades `DIA`, `SEMANA`, `MES`; `id=9` con stock bajo (`2`); `id=10` inactivo (`estado_registro = FALSE`, `stock_total = 10`) |
| `alquiler` | 6 | **8** | `id 1..8`: `2` `pendiente`, `2` `activo`, `1` `vencido`, `1` `recogido`, `1` `terminado`, `1` `cancelado` |
| `detalle_alquiler` | 6 | **20** | `id 1..20`: stock reservado y devuelto automáticamente por triggers |
| `logistica_alquiler` | 9 | **14** | `id 1..14`: `7` `ENTREGA`, `2` `RECOGIDA`, `5` `GASTO` en 3 semanas ISO |
| `logistica_alquiler_alquiler` | 9 | **14** | Relaciones puente `logistica <-> alquiler` |
| `auditoria_sistema` | 12 | **109** | `12` registros históricos conservados (`id_auditoria <= 20`) + `97` eventos nuevos generados por triggers (`id_auditoria 21..117`, con `0` ocurrencias de `contrasena_usuario`) |
| `alembic_version` | 1 | **1** | `'0001_initial_schema'` intacta |
