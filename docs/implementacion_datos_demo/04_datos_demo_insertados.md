# 04 — Datos Ficticios de Demostración Insertados (`sga_db`)

## 1. Script y mecanismo de carga

La población se ejecutó con los triggers habilitados mediante [02_poblamiento_demo_sga_db.sql](file:///C:/Users/Acer/Documents/Default%20Project/SGA_repo/SGA/docs/implementacion_datos_demo/scripts/02_poblamiento_demo_sga_db.sql), estableciendo `SET LOCAL app.usuario_actual = '<ACTOR_DEMO>'` en cada bloque para garantizar trazabilidad completa en `auditoria_sistema`.

El marcador `<HASH_BCRYPT_EMPLEADOS>` del script versionado fue sustituido en memoria al ejecutar el poblamiento utilizando `app.utils.security.hashear_contrasena()` del propio backend. Ningún hash bcrypt ni contraseña real o secreta fue escrita en el archivo SQL ni en los documentos del repositorio.

---

## 2. Reglas de negocio y ajustes respecto al borrador preliminar

1. **Separación de credenciales por rol (`cliente` vs personal interno):**
   - Según `cliente_controller.py`, `roles.py` y `usuario_controller.py`, los clientes se registran con `contrasena_usuario = NULL` y el login rechaza cuentas con rol `'cliente'`. Por ello, los `9` clientes demo (`DEMO-CLI-01`..`DEMO-CLI-09`) se insertaron con `contrasena_usuario = NULL`.
   - Solo los `5` usuarios internos (`DEMO-ADM-01`, `DEMO-FAC-01`, `DEMO-FAC-02`, `DEMO-LOG-01`, `DEMO-LOG-02`) recibieron hash bcrypt válido (contraseña de prueba local `Sga2026*`) y correos sintéticos `.invalid`.
2. **Coherencia de `unidad_minima_alquiler`:** Todos los contratos en `alquiler` usan duraciones compatibles con las unidades de sus productos en `detalle_alquiler` (`DIA`, `SEMANA` múltiplo de `7`, `MES` múltiplo de `30`).
3. **Coherencia de movimientos logísticos:** Solo contratos ya despachados/cerrados (`3, 4, 5, 6, 7`) tienen registros `ENTREGA`, y solo contratos recogidos/terminados (`6, 7`) tienen registros `RECOGIDA`. Los contratos `pendiente` (`1, 2`) y `cancelado` (`8`) no tienen entregas ni recogidas asignadas.

---

## 3. Catálogo de usuarios insertados (`14` filas)

| `id_usuario` | `tipo_documento` | Nombre completo | `rol_usuario` | `estado_registro` | `contrasena_usuario` |
|---|---|---|---|---|---|
| `DEMO-ADM-01` | `CC` | Ana Lucía Vargas Demo | `admin` | `TRUE` | Hash bcrypt (en memoria) |
| `DEMO-FAC-01` | `CC` | Luis Eduardo Mendoza Demo | `encargado_facturacion` | `TRUE` | Hash bcrypt (en memoria) |
| `DEMO-FAC-02` | `CC` | Marta Isabel Salazar Demo | `encargado_facturacion` | `TRUE` | Hash bcrypt (en memoria) |
| `DEMO-LOG-01` | `CC` | Carlos Andrés Ríos Demo | `encargado_logistico` | `TRUE` | Hash bcrypt (en memoria) |
| `DEMO-LOG-02` | `CC` | Sofía Alejandra Pardo Demo | `encargado_logistico` | `TRUE` | Hash bcrypt (en memoria) |
| `DEMO-CLI-01` | `CC` | Mateo Cárdenas Demo | `cliente` | `TRUE` | `NULL` |
| `DEMO-CLI-02` | `CC` | Valentina Osorio Demo | `cliente` | `TRUE` | `NULL` |
| `DEMO-CLI-03` | `CC` | Julián Benítez Demo | `cliente` | `TRUE` | `NULL` |
| `DEMO-CLI-04` | `CC` | Camila Navarro Demo | `cliente` | `TRUE` | `NULL` |
| `DEMO-CLI-05` | `CC` | Santiago Quintero Demo | `cliente` | `TRUE` | `NULL` |
| `DEMO-CLI-06` | `CC` | Paula Escobar Demo | `cliente` | `TRUE` | `NULL` |
| `DEMO-CLI-07` | `CC` | Daniel Cabrera Demo | `cliente` | `TRUE` | `NULL` |
| `DEMO-CLI-08` | `CC` | Laura Peñaloza Demo | `cliente` | `TRUE` | `NULL` |
| `DEMO-CLI-09` | `NIT` | Constructora Demo Norte SAS | `cliente` | `TRUE` | `NULL` |

*(Los correos electrónicos sintéticos siguen el patrón `<rol>.demo@example.invalid`, p. ej. `admin.demo@example.invalid`, `fac1.demo@example.invalid`, `log1.demo@example.invalid`, `cli1.demo@example.invalid`..`cli9.demo@example.invalid`.)*

---

## 4. Catálogo de productos insertados (`10` filas)

| `id_producto` | `nombre_producto` | Unidad mínima | `stock_total` | `stock_alquilado` (final) | `estado_registro` |
|---:|---|---|---:|---:|---|
| 1 | Planchón metálico 2.00m | `DIA` | 60 | 18 | `TRUE` |
| 2 | Cruceta galvanizada estándar | `DIA` | 120 | 12 | `TRUE` |
| 3 | Sección andamio tubular ancha | `SEMANA` | 40 | 7 | `TRUE` |
| 4 | Sección andamio tubular angosta | `SEMANA` | 30 | 5 | `TRUE` |
| 5 | Escalera de extensión aluminio | `DIA` | 25 | 2 | `TRUE` |
| 6 | Baranda de seguridad lateral | `SEMANA` | 35 | 4 | `TRUE` |
| 7 | Tablero estructural de madera | `MES` | 20 | 4 | `TRUE` |
| 8 | Abrazadera doble giratoria | `DIA` | 200 | 16 | `TRUE` |
| 9 | Rana compactadora (stock bajo) | `DIA` | 2 | 0 | `TRUE` |
| 10 | Andamio colgante descontinuado | `DIA` | 10 | 0 | `FALSE` |

---

## 5. Contratos de alquiler (`8` filas) y detalles (`20` filas)

| `id_alquiler` | Cliente | Creador | Estado final | `fecha_inicio` | Días | `precio_alquiler` | `deposito` | Ítems (`detalle_alquiler`) |
|---:|---|---|---|---|---:|---:|---:|---:|
| 1 | `DEMO-CLI-01` | `DEMO-FAC-01` | `pendiente` | `2026-11-28` | 7 | 280000.00 | 80000.00 | 3 |
| 2 | `DEMO-CLI-02` | `DEMO-FAC-01` | `pendiente` | `2026-11-30` | 14 | 390000.00 | 120000.00 | 2 |
| 3 | `DEMO-CLI-03` | `DEMO-FAC-02` | `activo` | `2026-11-26` | 2 | 210000.00 | 60000.00 | 3 |
| 4 | `DEMO-CLI-04` | `DEMO-FAC-02` | `activo` | `2026-11-26` | 30 | 620000.00 | 150000.00 | 3 |
| 5 | `DEMO-CLI-05` | `DEMO-FAC-01` | `vencido` | `2026-11-16` | 7 | 310000.00 | 90000.00 | 2 |
| 6 | `DEMO-CLI-06` | `DEMO-FAC-02` | `recogido` | `2026-11-26` | 7 | 340000.00 | 100000.00 | 2 |
| 7 | `DEMO-CLI-07` | `DEMO-FAC-01` | `terminado` | `2026-11-26` | 30 | 540000.00 | 140000.00 | 3 |
| 8 | `DEMO-CLI-08` | `DEMO-FAC-02` | `cancelado` | `2026-11-27` | 7 | 175000.00 | 50000.00 | 2 |

Los contratos `6`, `7` y `8` se insertaron inicialmente abiertos para reservar inventario al crear sus detalles y luego se transicionaron por `UPDATE` controlado a `recogido`, `terminado` y `cancelado`, activando `trg_cerrar_alquiler_devolver_stock` para devolver sus unidades a bodega. El contrato `5` se insertó con `CURRENT_DATE` y luego se actualizó a `vencido` con `fecha_inicio = CURRENT_DATE - 10` (`2026-11-16`).

---

## 6. Movimientos logísticos (`14` filas) y tabla puente (`14` filas)

| `id_logistica_alquiler` | Tipo | Encargado | Fecha | Valor | Alquiler asociado |
|---:|---|---|---|---:|---|
| 1 | `ENTREGA` | `DEMO-LOG-01` | `2026-11-26` | 0.00 | `[3]` |
| 2 | `ENTREGA` | `DEMO-LOG-02` | `2026-11-26` | 0.00 | `[3]` |
| 3 | `ENTREGA` | `DEMO-LOG-01` | `2026-11-26` | 0.00 | `[4]` |
| 4 | `ENTREGA` | `DEMO-LOG-02` | `2026-11-26` | 0.00 | `[4]` |
| 5 | `ENTREGA` | `DEMO-LOG-01` | `2026-11-26` | 0.00 | `[5]` |
| 6 | `ENTREGA` | `DEMO-LOG-02` | `2026-11-26` | 0.00 | `[6]` |
| 7 | `ENTREGA` | `DEMO-LOG-01` | `2026-11-26` | 0.00 | `[7]` |
| 8 | `RECOGIDA` | `DEMO-LOG-02` | `2026-11-26` | 0.00 | `[6]` |
| 9 | `RECOGIDA` | `DEMO-LOG-01` | `2026-11-26` | 0.00 | `[7]` |
| 10 | `GASTO` | `DEMO-LOG-01` | `2026-11-26` | 85000.00 | `[3]` |
| 11 | `GASTO` | `DEMO-LOG-02` | `2026-11-23` | 45000.00 | `[7]` |
| 12 | `GASTO` | `DEMO-LOG-01` | `2026-11-19` | 120000.00 | `[4]` |
| 13 | `GASTO` | `DEMO-LOG-02` | `2026-11-16` | 60000.00 | `[5]` |
| 14 | `GASTO` | `DEMO-LOG-01` | `2026-11-12` | 75000.00 | `[6]` |

---

## 7. Auditoría generada (`97` filas)

Distribución automática generada por `trg_auditar_*` en `auditoria_sistema`:

- `alquiler`: `8 INSERT`, `4 UPDATE` (`id 5, 6, 7, 8`)
- `detalle_alquiler`: `20 INSERT`
- `logistica_alquiler`: `14 INSERT`
- `producto`: `10 INSERT`, `27 UPDATE` (descuentos de stock y devoluciones por cierre)
- `usuario`: `14 INSERT`

Actores registrados: `DEMO-ADM-01` (`27`), `DEMO-FAC-01` (`9`), `DEMO-FAC-02` (`44`), `DEMO-LOG-01` (`14`), `DEMO-LOG-02` (`3`). Total: `97` eventos (`0` NULL, `0` inexistentes).
