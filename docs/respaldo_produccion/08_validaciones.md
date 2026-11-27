# 08 — Resultados de Validaciones en Producción (`sga_db_mydd`)

**Estado de la actividad:** **Ejecutada y aprobada al 100%**  
**Fecha:** 2026-11-27

---

## 1. Conteos finales verificados vs esperados

| Tabla | Cantidad esperada | Cantidad observada | Estado |
|---|---:|---:|---|
| `usuario` | 14 | 14 | Cumplido |
| `producto` | 10 | 10 | Cumplido |
| `alquiler` | 8 | 8 | Cumplido |
| `detalle_alquiler` | 20 | 20 | Cumplido |
| `logistica_alquiler` | 14 | 14 | Cumplido |
| `logistica_alquiler_alquiler` | 14 | 14 | Cumplido |
| `auditoria_sistema` | 109 | 109 (`12` históricos + `97` nuevos) | Cumplido |
| `alembic_version` | 1 | 1 (`0001_initial_schema`) | Cumplido |

---

## 2. Verificación de las 14 condiciones obligatorias (Fase 7)

| # | Condición verificada | Resultado observado | Estado |
|---:|---|---|---|
| 1 | Ausencia de claves foráneas huérfanas (`7` FKs) | `0` huérfanos en las `7` relaciones FK | Cumplida |
| 2 | Ausencia de alquileres sin detalles | `0` alquileres sin `detalle_alquiler` | Cumplida |
| 3 | `stock_alquilado` coincide con contratos abiertos (`pendiente`, `activo`, `vencido`) | `0` diferencias en los `10` productos (`stock_en_obra = 68`) | Cumplida |
| 4 | Ausencia de inconsistencias logísticas | `0` movimientos sin contrato; `0` entregas en `pendiente`/`cancelado`; `0` recogidas fuera de `recogido`/`terminado` | Cumplida |
| 5 | Ausencia de usuarios duplicados (`id_usuario`, `email_usuario`) | `0` duplicados | Cumplida |
| 6 | Los 5 empleados tienen hashes bcrypt válidos (`verificar_contrasena`) | `5/5` verificados (`True`) | Cumplida |
| 7 | Los 9 clientes no tienen contraseña asignada (`contrasena_usuario IS NULL`) | `0` clientes con contraseña | Cumplida |
| 8 | Ausencia de hashes/`contrasena_usuario` en nuevos eventos de auditoría (`id_auditoria > 20`) | `new_pwd_rows = 0` sobre `97` eventos nuevos (además de prueba `INSERT/UPDATE/DELETE` en `sga_prod_verify_tmp2` = `False`) | Cumplida |
| 9 | Permanencia de los 12 eventos históricos (`id_auditoria <= 20`) | `hist = 12` intactos | Cumplida |
| 10 | Los 19 triggers continúan activos | `19` triggers activos verificados | Cumplida |
| 11 | Las 12 funciones siguen disponibles | `12` funciones verificadas en `public` | Cumplida |
| 12 | La vista operativa `vw_dashboard_operativo` funciona | `(2, 2, 1, 532, 68, 464)` | Cumplida |
| 13 | Las 5 secuencias están alineadas con `MAX(id)` (`is_called = True`) | `producto=10/10`, `alquiler=8/8`, `detalle_alquiler=20/20`, `logistica_alquiler=14/14`, `auditoria_sistema=117/117` | Cumplida |
| 14 | El backend FastAPI se conecta, autentica y consulta `sga_db_mydd` | Ver sección 3 | Cumplida |

---

## 3. Pruebas reales del backend FastAPI contra `sga_db_mydd`

Ejecutadas vía ASGI con `get_db` conectado a `sga_db_mydd` (sin modificar `.env` ni escribir datos):

- `POST /api/sga/auth/login` (`admin`, `facturacion`, `logistico`): HTTP `200`, `logueado=True`, sin campo `contrasena_usuario`.
- `POST /api/sga/auth/login` (`cliente`): HTTP `401` (`LOGIN_INVALID`).
- `GET /api/sga/usuarios` (`admin`): HTTP `200`, `items=5`.
- `GET /api/sga/productos` (`logistico`): HTTP `200`, `items=9`.
- `GET /api/sga/alquileres` (`facturacion`): HTTP `200`, `items=8`.
- `GET /api/sga/alquileres/proximos-vencer` (`logistico`): HTTP `200`, `items=1`.
- `GET /api/sga/alquileres/pendientes-entrega` (`logistico`): HTTP `200`, `items=2`.
- `GET /api/sga/gastos` (`logistico`): HTTP `200`, `items=5`.
- `GET /api/sga/gastos/resumen-semanal` (`facturacion`): HTTP `200`, `items=3`.
- `GET /api/sga/alquileres/6/historial` (`facturacion`): HTTP `200`, `items=5` (incluye los `2` eventos del contrato `6` demo más `3` eventos históricos preservados en `auditoria_sistema` con `id_registro_afectado = '6'`).

*(Nota sobre pruebas no ejecutadas en producción: no se ejecutaron endpoints HTTP de escritura `POST/PATCH/DELETE` posteriores a la carga sobre `sga_db_mydd` para no alterar los conteos finales `14, 10, 8, 20, 14, 14, 109, 1` ni las secuencias alineadas.)*
