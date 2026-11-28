# AUD-2026-008 — Auditoría estática de `sga_db_mydd` sin conexión a producción

> **Fecha:** 2026-11-27  
> **Objeto auditado:** informe final de respaldo, limpieza, corrección `H-DB-08` y poblamiento de `sga_db_mydd`, y su coherencia con el repositorio.  
> **Repositorio:** `SGA_repo/SGA` · rama `backup/sga-antes-carga-produccion-2026-11-27` · `HEAD cb2ee5e49e1c572a13074ccaa8484d57d8c7466f`.  
> **Modalidad elegida por el usuario:** **solo revisión estática**. No se conectó a producción, no se ejecutaron consultas SQL, no se realizaron operaciones HTTP y no se modificaron datos, código, configuración ni el índice documental.  
> **Autorización documental:** limitada exclusivamente a la creación de este informe.  
> **Convención de estado:** `VERIFICADO ESTÁTICAMENTE` = comprobado en archivos del repositorio; `DECLARADO` = afirmación de Antigravity no reproducida; `NO VERIFICADO` = sin evidencia de base de datos. No se reproducen credenciales, secretos, valores de hashes ni URLs completas.

---

## 1. Identidad, modo de conexión y control previo

| Elemento | Evidencia | Estado |
|---|---|---|
| Identidad declarada por Antigravity | Base `sga_db_mydd`, esquema `public`, usuario `sga_db_mydd_user`, puerto `5432`, PostgreSQL `18.6`; host Render omitido deliberadamente. `docs/respaldo_produccion/02_inspeccion_produccion.md:12-18`; `docs/respaldo_produccion/10_informe_final.md:21`. | **DECLARADO** |
| Verificación de `current_database()` / `current_schema()` / `current_user` | No se ejecutó ninguna consulta. No había credenciales disponibles y el usuario eligió revisión estática. | **NO VERIFICADO** |
| Verificación de `transaction_read_only = on` antes de consultar | No se estableció ninguna sesión; por tanto no se comprobó. | **NO VERIFICADO** |
| Búsqueda de DSN/credenciales | Se revisaron variables de entorno, repositorio, documentación, historial local y registros temporales; no se encontró acceso utilizable a producción. Sólo aparecieron parámetros sanitizados ya citados. | **VERIFICADO ESTÁTICAMENTE** |
| Medidas de confidencialidad | No se copiaron secretos, contraseñas, tokens, hashes completos ni URLs completas a este documento ni al repositorio. | **VERIFICADO ESTÁTICAMENTE** |

**Resultado de la sección:** la identidad exacta y el aislamiento de solo lectura exigidos como compuerta previa no pudieron comprobarse. Todo resultado dependiente de la base queda condicionado a esa limitación.

---

## 2. Conteos finales y distribución de datos

| Tabla | Conteo declarado | Cotejo estático | Estado en base |
|---|---:|---|---|
| `usuario` | 14 | Coincide con 14 filas del `INSERT` en `scripts/02_poblamiento_demo_produccion_preparado.sql:10-30` y con `07_plan_poblamiento.md:13`. | **NO VERIFICADO** |
| `producto` | 10 | Coincide con `scripts/02...sql:32-48` y `07_plan_poblamiento.md:14`. | **NO VERIFICADO** |
| `alquiler` | 8 | Coincide con `scripts/02...sql:50-64` y `07_plan_poblamiento.md:15`. | **NO VERIFICADO** |
| `detalle_alquiler` | 20 | Coincide con `scripts/02...sql:66-91` y `07_plan_poblamiento.md:16`. | **NO VERIFICADO** |
| `logistica_alquiler` | 14 | Coincide con `scripts/02...sql:93-113` y `07_plan_poblamiento.md:17`. | **NO VERIFICADO** |
| `logistica_alquiler_alquiler` | 14 | Coincide con `scripts/02...sql:115-121` y `07_plan_poblamiento.md:18`. | **NO VERIFICADO** |
| `auditoria_sistema` | 109 | `12` históricos + `97` nuevos; aritmética analizada en la sección 4. `08_validaciones.md:18`; `07_plan_poblamiento.md:19`. | **NO VERIFICADO** |
| `alembic_version` | 1 | Declarado como `0001_initial_schema` en `10_informe_final.md:48` y `08_validaciones.md:19`; coincide con la única revisión versionada. | **NO VERIFICADO** |

** estados finales de alquiler (cotejo estático):** el script inserta `3` `pendiente` y `5` `activo` (`scripts/02...sql:57-64`) y luego aplica cuatro transiciones (`scripts/02...sql:125-134`), quedando `2` `pendiente`, `2` `activo`, `1` `vencido`, `1` `recogido`, `1` `terminado` y `1` `cancelado`. Es coherente con `07_plan_poblamiento.md:15`; la realidad de la base es **NO VERIFICADA**.

**Inventario declarado:** `stock_en_obra = 68` y vista `(2, 2, 1, 532, 68, 464)` (`10_informe_final.md:56`; `08_validaciones.md:29,38`). El cotejo estático es consistente: los contratos abiertos (`pendiente`, `activo`, `vencido`) suman `68` unidades en los detalles (`scripts/02...sql:72-85`), y la vista filtra productos activos (`database/01_esquema/06_vistas_dashboard.sql:12-38`), de donde	resultan `532` totales, `68` en obra y `464` en bodega. Estado en base: **NO VERIFICADO**.

---

## 3. Integridad referencial y consistencia operativa

| Verificación declarada | Fuente | Cotejo estático | Estado final |
|---|---|---|---|
| `7` foreign keys sin huérfanos | `08_validaciones.md:27` | El script de poblamiento usa identificadores ya insertados en las tablas raíz; no se observan referencias evidentemente inválidas en `scripts/02...sql:13-121`. | **NO VERIFICADO** |
| `0` alquileres sin detalle | `08_validaciones.md:28` | Cada uno de los `8` alquileres aparece en los detalles (`scripts/02...sql:72-91`). | **NO VERIFICADO** |
| `0` diferencias de stock en `10` productos | `08_validaciones.md:29` | Las reglas de stock y devolución están definidas en `database/01_esquema/02_funciones_y_triggers.sql:264-372`; el resultado aritmético es coherente con la sección 2. | **NO VERIFICADO** |
| Logística coherente | `08_validaciones.md:30` | Los tipos y vínculos del script son internamente consistentes (`scripts/02...sql:96-121`). | **NO VERIFICADO** |
| `0` usuarios duplicados | `08_validaciones.md:31` | Los identificadores y correos del dataset demo son distintos entre sí (`scripts/02...sql:17-30`). | **NO VERIFICADO** |
| `5` empleados con hash bcrypt válido y `9` clientes sin contraseña | `08_validaciones.md:32-33` | El script usa un marcador sustituido en memoria y `NULL` para clientes (`scripts/02...sql:6-7,17-30`); no se reprodujo la verificación criptográfica. | **NO VERIFICADO** |

**Resultado de la sección:** no se detectó incoherencia estática en el dataset preparado, pero ninguna condición de integridad fue ejecutada contra `sga_db_mydd`.

---

## 4. Auditoría del sistema y generación de eventos

Antigravity declara `109` eventos totales, `97` nuevos (`id_auditoria 21..117`), `0` actores nulos y `0` apariciones de `contrasena_usuario` en eventos nuevos (`10_informe_final.md:47,55`; `08_validaciones.md:34-35`).

**Cotejo estático de la aritmética de eventos** (VERIFICADO ESTÁTICAMENTE):

| Origen | Eventos | Evidencia |
|---|---:|---|
| `INSERT` en las `5` tablas con trigger de auditoría (`usuario`, `producto`, `alquiler`, `detalle_alquiler`, `logistica_alquiler`) | 66 | `14+10+8+20+14`; `scripts/02...sql:13,35,53,69,96`; triggers en `database/01_esquema/02_funciones_y_triggers.sql:79-97`. La tabla puente no tiene trigger de auditoría. |
| `UPDATE` automáticos de `producto` por cada inserción de detalle | 20 | `fn_sincronizar_stock_producto()` actualiza `producto` por cada detalle insertado; `database/01_esquema/02_funciones_y_triggers.sql:264-306`. |
| `UPDATE` directos de estado en `alquiler` | 4 | `scripts/02...sql:125,128,131,134`. |
| `UPDATE` automáticos de `producto` al cerrar contratos `6`, `7` y `8` | 7 | `fn_cerrar_alquiler_devolver_stock()`; `database/01_esquema/02_funciones_y_triggers.sql:352-372`. Detalles: `2+3+2` filas en `scripts/02...sql:85-91`. |
| **Total derivado** | **97** | Coincide con `12 + 97 = 109` y con la secuencia final declarada `117/117`. |

**Registro histórico sensible:** el plan declara que los `12` eventos previos se conservaron sin modificar y que `id_auditoria = 20` contiene la clave `contrasena_usuario` en `datos_anteriores` y `datos_nuevos` (`06_plan_limpieza.md:33-36`). No se reprodujo su contenido y no se propone aquí saneamiento alguno; cualquier tratamiento futuro requeriría autorización expresa separada.

**Resultado de la sección:** la generación de `97` eventos es aritméticamente coherente con el SQL versionado. La ausencia real de claves en los eventos nuevos, los actores y el estado de la secuencia son **NO VERIFICADOS**.

---

## 5. Corrección `H-DB-08`

| Aspecto | Evidencia | Estado |
|---|---|---|
| Antigravity declara que actualizó `fn_auditar_cambios()` en producción para excluir `contrasena_usuario` en `INSERT`, `UPDATE` y `DELETE` | `10_informe_final.md:35`; `06_plan_limpieza.md:25-31` | **DECLARADO** |
| Prueba previa declarada en base temporal y validación `new_pwd_rows = 0` | `08_validaciones.md:34`; `10_informe_final.md:35` | **DECLARADO** |
| El SQL versionado conserva `to_jsonb(OLD)` / `to_jsonb(NEW)` sin excluir la clave | `database/01_esquema/02_funciones_y_triggers.sql:34,44,55` | **VERIFICADO ESTÁTICAMENTE** |
| La única migración Alembic no define la función ni la corrección | `sga_backend_jwt/alembic/versions/0001_initial_schema.py` (sin `op.execute`, `CREATE FUNCTION` ni `CREATE TRIGGER`) | **VERIFICADO ESTÁTICAMENTE** |
| Definición efectiva de la función en producción | Sin conexión a base | **NO VERIFICADO** |

**Impacto:** la corrección declarada no es reproducible desde el repositorio. Si la base fue corregida directamente, existe divergencia entre producción y la fuente de verdad versionada; si no lo fue, el riesgo de exposición de credenciales en la auditoría permanece. En ambos casos, el registro histórico `id_auditoria = 20` sigue documentado como conservado y no debe ser alterado sin autorización.

**Recomendación (no ejecutada):** incorporar la exclusión de la clave a una migración versionada con respaldo previo y validación en entorno aislado, manteniendo la preservación del registro histórico salvo decisión expresa.

---

## 6. Estructura, funciones, triggers y vista

| Elemento | Declarado en producción | Cotejo estático | Estado en base |
|---|---:|---|---|
| Tablas base | 8 | Coincide con la migración inicial y el inventario documentado. | **NO VERIFICADO** |
| Funciones en `public` | 12 | `database/01_esquema/02_funciones_y_triggers.sql` contiene exactamente `12` sentencias `CREATE OR REPLACE FUNCTION`. | **NO VERIFICADO** |
| Triggers activos | 19 | El mismo archivo contiene exactamente `19` sentencias `CREATE TRIGGER`. | **NO VERIFICADO** |
| Vista | 1 (`vw_dashboard_operativo`) | Definida en `database/01_esquema/06_vistas_dashboard.sql:12-38`; el SQL de la vista es coherente con los conteos de la sección 2. | **NO VERIFICADO** |
| Índices / restricciones | 26 / 92 | No comprobados en base; fuera del alcance del cotejo ejecutado. | **NO VERIFICADO** |

Fuente declarada: `10_informe_final.md:54`; `08_validaciones.md:36-38`. La correspondencia numérica estática no sustituye la inspección de catálogo (`pg_proc`, `pg_trigger`, `pg_views`) en producción.

---

## 7. Secuencias

| Secuencia | Declarada (`last_value / max`) | Cotejo estático | Estado |
|---|---|---|---|
| `producto` | `10 / 10` | Coincide con `10` filas insertadas. | **NO VERIFICADO** |
| `alquiler` | `8 / 8` | Coincide con `8` filas insertadas. | **NO VERIFICADO** |
| `detalle_alquiler` | `20 / 20` | Coincide con `20` filas insertadas. | **NO VERIFICADO** |
| `logistica_alquiler` | `14 / 14` | Coincide con `14` filas insertadas. | **NO VERIFICADO** |
| `auditoria_sistema` | `117 / 117` | Coincide con `12` históricos + `97` eventos derivados en la sección 4. | **NO VERIFICADO** |

Fuente declarada: `10_informe_final.md:39-48`; `08_validaciones.md:39`. El atributo `is_called = True` y los valores reales de `last_value` no fueron consultados.

---

## 8. Backend, roles, autenticación y contexto de auditoría

| Aspecto | Evidencia | Estado |
|---|---|---|
| Conexión y autenticación declaradas contra `sga_db_mydd` (`200`/`401`, listados de usuarios, productos, alquileres, gastos e historial); `31/31` y `7/7` pruebas declaradas | `08_validaciones.md:44-59`; `10_informe_final.md` | **DECLARADO** |
| Reproducción de pruebas HTTP o ASGI | No se ejecutó ninguna petición. | **NO VERIFICADO** |
| Configuración exige `DATABASE_URL` y `JWT_SECRET_KEY` sin exponer valores | `sga_backend_jwt/app/config/settings.py:9-22`; `sga_backend_jwt/app/config/database.py:8-12` | **VERIFICADO ESTÁTICAMENTE** |
| Jerarquía RBAC y exclusión de `cliente` en grupos internos | `sga_backend_jwt/app/utils/roles.py:10-19`; `sga_backend_jwt/app/schemas/usuario_schema.py:6-19` | **VERIFICADO ESTÁTICAMENTE** |
| Hashing bcrypt y verificación sin texto plano | `sga_backend_jwt/app/utils/security.py:11-42`; `sga_backend_jwt/app/controllers/usuario_controller.py:39,124-125,214` | **VERIFICADO ESTÁTICAMENTE** |
| Respuestas HTTP excluyen campos sensibles | `sga_backend_jwt/app/utils/response.py:14-39`; `sga_backend_jwt/app/routes/auth_routes.py:14-32` | **VERIFICADO ESTÁTICAMENTE** |
| El backend escribe `app.usuario_actual` | `sga_backend_jwt/app/utils/audit_context.py:14-15,36` y llamadas en controladores | **VERIFICADO ESTÁTICAMENTE** |
| La función de auditoría lee `app.usuario_actual` | `database/01_esquema/02_funciones_y_triggers.sql:31` | **VERIFICADO ESTÁTICAMENTE** |
| La función de autodesactivación admin lee `app.current_user_id` | `database/01_esquema/02_funciones_y_triggers.sql:145` | **VERIFICADO ESTÁTICAMENTE** |

El desajuste en el último par constituye el hallazgo `H-DB-03`: la barrera que impide a un administrador desactivar su propia cuenta consulta una variable que el backend nunca establece, por lo que la comparación no puede reconocer al usuario actual.

---

## 9. Hallazgos `H-DB-03`, `H-DB-07`, `H-DB-08` y `H-DB-02`

| ID | Severidad | Impacto | Evidencia | Estado | Recomendación (no ejecutada) |
|---|---|---|---|---|---|
| `H-DB-03` | Alta | La regla de negocio que impide la autodesactivación de un administrador puede no aplicarse; el valor leído queda vacío porque el backend usa otra clave de sesión. | `database/01_esquema/02_funciones_y_triggers.sql:139-158` frente a `sga_backend_jwt/app/utils/audit_context.py:14-15,36`. | **VERIFICADO ESTÁTICAMENTE**; efecto en producción **NO VERIFICADO**. | Unificar la clave de contexto (`app.usuario_actual`) o establecer ambas de forma consistente, y añadir prueba de regresión. |
| `H-DB-07` | Media | Divergencia de motor entre despliegue declarado y configuración local; puede alterar comportamiento, funciones disponibles y resultados de validación. | `docker-compose.yml:21` declara `postgres:16-alpine`; documentos declaran producción `18.6` y local `18.4` (`02_inspeccion_produccion.md:17`). | **VERIFICADO ESTÁTICAMENTE** en la configuración; motor real en producción **NO VERIFICADO**. | Alinear la imagen declarada con el motor soportado y documentar la versión oficial por entorno. |
| `H-DB-08` | Alta | Exposición de clave sensible en registro histórico de auditoría y ausencia de la corrección en la fuente versionada. | `06_plan_limpieza.md:33-36`; `database/01_esquema/02_funciones_y_triggers.sql:34,44,55`; migración sin función. | Divergencia **VERIFICADO ESTÁTICAMENTE**; estado real de la función **NO VERIFICADO**. | Versionar la corrección con control de cambios; no tocar el registro histórico sin autorización expresa. |
| `H-DB-02` | Media-Alta | Una reconstrucción desde Alembic omite `12` funciones, `19` triggers y `1` vista; la operación depende de SQL manual no gobernado. | `sga_backend_jwt/alembic/versions/0001_initial_schema.py` (sin objetos procedimentales); `database/01_esquema/02_funciones_y_triggers.sql:14-455`; `database/01_esquema/06_vistas_dashboard.sql:12-38`. | **VERIFICADO ESTÁTICAMENTE**; inventario real en producción **NO VERIFICADO**. | Incorporar los objetos a migraciones versionadas y validar reconstrucción en entorno aislado. |

Ninguno de estos hallazgos fue modificado, corregido ni cerrado por esta auditoría.

---

## 10. Diferencias frente al informe de Antigravity

| Tema | Antigravity declara | Revisión estática independiente | Clasificación final |
|---|---|---|---|
| Identidad y sesión de solo lectura | Verificadas en `sga_db_mydd` | Sin conexión; no se comprobó identidad ni `transaction_read_only` | **NO VERIFICADO** |
| Conteos `14/10/8/20/14/14/109/1` | Verificados en base | Coherentes con el SQL preparado y la documentación | Coherencia **VERIFICADA ESTÁTICAMENTE**; base **NO VERIFICADA** |
| Integridad y stock | `0` huérfanos, `0` diferencias, `68` en obra | Dataset internamente coherente; validaciones no ejecutadas | **NO VERIFICADO** |
| Eventos nuevos de auditoría | `97`, sin clave sensible | `97` derivado de inserts y triggers; sin clave no comprobado en base | Aritmética **VERIFICADA ESTÁTICAMENTE**; contenido **NO VERIFICADO** |
| Corrección `H-DB-08` | Aplicada directamente en producción | El repositorio conserva `to_jsonb` sin exclusión; migración sin la corrección | Divergencia **VERIFICADA ESTÁTICAMENTE**; producción **NO VERIFICADA** |
| Estructura `12` funciones / `19` triggers / `1` vista | Verificada en catálogo | El SQL versionado contiene exactamente esas cantidades | Conteo estático **VERIFICADO**; catálogo **NO VERIFICADO** |
| Secuencias alineadas | `10/10`, `8/8`, `20/20`, `14/14`, `117/117` | Coherentes con los inserts y los `97` eventos derivados | **NO VERIFICADO** |
| Pruebas del backend y endpoints | Ejecutadas con resultados `200`/`401` e ítems declarados | No se reprodujo ninguna petición | **DECLARADO** / **NO VERIFICADO** |
| `H-DB-03` | No consta corrección | Persiste en el código versionado | **VERIFICADO ESTÁTICAMENTE** |
| `H-DB-07` | No consta corrección | Persiste en `docker-compose.yml` | **VERIFICADO ESTÁTICAMENTE** |
| `H-DB-02` | No consta corrección | Persiste: objetos procedimentales fuera de Alembic | **VERIFICADO ESTÁTICAMENTE** |

El informe de Antigravity no contradice aritméticamente los conteos declarados, pero sus verificaciones de base, integridad, seguridad y ejecución de backend no son reproducibles en esta revisión y no pueden aceptarse como comprobadas.

---

## 11. Dictamen final

**C. NO APROBADO**

**Fundamento:** la modalidad elegida impidió verificar la identidad exacta, la condición `transaction_read_only = on`, los conteos, la integridad, la vista, las secuencias, las pruebas de backend y el estado real de `fn_auditar_cambios()`. Además, persisten estáticamente `H-DB-03`, `H-DB-07` y `H-DB-02`, y la corrección `H-DB-08` declarada en producción no está reflejada en el SQL versionado ni en la migración. La coherencia documental y aritmética constatada no equivale a verificación de producción.

**No autorización:** este dictamen no autoriza transferencia a producción, correcciones, migraciones, ejecución de SQL de escritura ni saneamiento del registro histórico `id_auditoria = 20`.

**Pendiente para una nueva evaluación:** acceso de solo lectura debidamente autorizado; compuerta de identidad y modo de sesión; ejecución de las validaciones de base; corrección versionada de `H-DB-08`; y cierre de `H-DB-03`, `H-DB-07` y `H-DB-02` con evidencia reproducible.

**Archivos examinados (principalmente):** `docs/respaldo_produccion/02_inspeccion_produccion.md`, `06_plan_limpieza.md`, `07_plan_poblamiento.md`, `08_validaciones.md`, `10_informe_final.md`, `docs/respaldo_produccion/scripts/01_limpieza_produccion_preparado.sql`, `02_poblamiento_demo_produccion_preparado.sql`, `03_validacion_produccion.sql`, `database/01_esquema/02_funciones_y_triggers.sql`, `database/01_esquema/06_vistas_dashboard.sql`, `sga_backend_jwt/alembic/versions/0001_initial_schema.py`, `sga_backend_jwt/app/config/settings.py`, `sga_backend_jwt/app/config/database.py`, `sga_backend_jwt/app/utils/audit_context.py`, `sga_backend_jwt/app/utils/roles.py`, `sga_backend_jwt/app/utils/security.py`, `sga_backend_jwt/app/utils/response.py`, `sga_backend_jwt/app/schemas/usuario_schema.py`, `sga_backend_jwt/app/controllers/usuario_controller.py`, `sga_backend_jwt/app/routes/auth_routes.py` y `docker-compose.yml`.

**Estado Git final:** rama `backup/sga-antes-carga-produccion-2026-11-27`, `HEAD cb2ee5e49e1c572a13074ccaa8484d57d8c7466f`; único archivo nuevo: `docs/gestion_proyecto/01_auditorias/AUD-2026-008_auditoria_estatica_produccion_sin_conexion.md`; sin `commit`, sin `stage` y sin modificación del índice documental.
