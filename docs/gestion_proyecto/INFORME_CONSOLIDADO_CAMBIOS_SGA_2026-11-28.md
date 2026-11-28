# Informe Consolidado de Cambios del Proyecto SGA (Repositorio, Base Local y Producción)

**Fecha de emisión:** 2026-11-28 (cierre documental de las intervenciones ejecutadas entre el 2026-11-25 y el 2026-11-27)  
**Rama de publicación:** `backup/sga-antes-carga-produccion-2026-11-27`  
**Alcance:** consolidación técnica y documental de las fases de auditoría, respaldo Git, respaldo físico PostgreSQL, limpieza controlada, corrección de `H-DB-08`, poblamiento de datos sintéticos de demostración en `sga_db` (local) y `sga_db_mydd` (producción), y revisión estática independiente `AUD-2026-008`.

> [!IMPORTANT]
> **Convención de trazabilidad de la evidencia en este informe:**
> - **`[VERIFICADO POR AUDITORÍA INDEPENDIENTE — OP]`**: comprobado directamente por OpenCode mediante conexión de solo lectura a `sga_db` local (`docs/auditoria_post_poblamiento/`) o inspección de archivos/hashes locales.
> - **`[VERIFICADO ESTÁTICAMENTE — AUD-2026-008 / OP]`**: comprobado en el código, scripts SQL, migraciones e historial Git del repositorio sin conexión a la base de datos de producción (`docs/gestion_proyecto/01_auditorias/AUD-2026-008_auditoria_estatica_produccion_sin_conexion.md`).
> - **`[DECLARADO POR ANTIGRAVITY — AG]`**: operación o validación ejecutada y reportada por Antigravity sobre `sga_db` o `sga_db_mydd` (o en bases temporales de prueba), no reproducida con conexión directa por la auditoría estática `AUD-2026-008`.
> - **`[PENDIENTE]`**: hallazgo o actividad técnica identificada que permanece abierta para una fase posterior.

---

## 5.1. Cambios en Git

### 1. Ramas creadas y estado de las ramas del repositorio

| Rama | Commit (`HEAD`) | Propósito y estado |
|---|---|---|
| `dev` | `599f96fd28e282725e6a325604e8ddaa0b8850b5` | Rama principal de integración de desarrollo. **Intacta (no modificada).** |
| `main` | `58bf6b97b96708cf246c33671eb9fcdf45fbc722` | Rama principal histórica local. **Intacta (no modificada).** |
| `feat/taller-6-calidad-sqa` | `cd4a48590334675569409f197f446679065974ab` | Rama aislada del Taller 6 (SQA) creada desde `dev`. **Intacta (no modificada durante las fases de BD).** |
| `backup/sga-antes-estabilizacion-2026-11-27` | `d5496b1091df4ea039324d7ed7f2c1abeb026a61` | Primera rama local de respaldo creada desde `feat/taller-6-calidad-sqa` con los documentos de auditoría y poblamiento local. **Intacta.** |
| `backup/sga-antes-carga-produccion-2026-11-27` | `d5496b1` -> `7371be1` -> `cb2ee5e` -> commit final de cierre | Rama de respaldo y cierre documental de la intervención sobre producción, publicada en `origin/backup/sga-antes-carga-produccion-2026-11-27`. |

### 2. Historial de commits relevantes en la cadena de la rama de respaldo

1. **`599f96fd28e282725e6a325604e8ddaa0b8850b5` (`dev`):** `docs: cerrar RM-DOC-011 y publicar referencia de API` — línea base de `dev`.
2. **`cd4a48590334675569409f197f446679065974ab` (`feat/taller-6-calidad-sqa`):** `test(sqa): implementar auditoría de calidad y dossier Taller 6` — incorporó `35` archivos de pruebas unitarias, reportes Flake8/Radon/pytest-cov, `locustfile.py` y ajustes de calidad del Taller 6.
3. **`d5496b1091df4ea039324d7ed7f2c1abeb026a61` (`backup/sga-antes-estabilizacion-2026-11-27`):** `backup: preservar estado SGA antes de estabilización técnica` — incorporó `26` archivos nuevos:
   - `docs/auditoria_base_datos_produccion/` (`11` archivos: `01` a `10` y `consultas_auditoria.sql`).
   - `docs/auditoria_post_poblamiento/` (`9` archivos: `01` a `09`).
   - `docs/implementacion_datos_demo/` (`6` archivos: `01`, `02`, `04` y `scripts/01..03`).
4. **`7371be151a02044423f85c2fee52f68a2f653687` (`backup/sga-antes-carga-produccion-2026-11-27`):** `docs(backup): registrar inspección y planes previos a carga en producción` — incorporó `14` archivos nuevos (`docs/respaldo_rama/01_informe_respaldo_rama.md`, `docs/respaldo_produccion/01..10` y `docs/respaldo_produccion/scripts/01..03`).
5. **`cb2ee5e49e1c572a13074ccaa8484d57d8c7466f` (`backup/sga-antes-carga-produccion-2026-11-27`):** `docs(backup): documentar ejecución final y validación en producción sga_db_mydd` — actualizó `7` documentos de `docs/respaldo_produccion/` tras ejecutar la carga en producción.
6. **Commit de cierre documental y publicación (esta intervención):** incorpora la auditoría estática `AUD-2026-008`, el manual `README_RESTAURACION_BACKUP.md`, este informe consolidado, los `6` documentos completados en `docs/implementacion_datos_demo/` (`03`, `05..09`) y la sanitización de rutas personales/literales en documentos de respaldo, publicando la rama en `origin/backup/sga-antes-carga-produccion-2026-11-27`.

---

## 5.2. Cambios en la base de datos local (`sga_db`)

| Etapa | Descripción y resultado | Evidencia y clasificación |
|---|---|---|
| **1. Auditoría inicial** | Inventario de `sga_db` (`localhost:5432`, PostgreSQL `18.4`, esquema `public`): `8` tablas, `1` vista, `5` secuencias, `12` funciones, `19` triggers, `26` índices, `92` restricciones y revisión `d4f74f3d4896`. Conteos iniciales: `usuario=21, producto=7, alquiler=3, detalle_alquiler=8, logistica_alquiler=5, logistica_alquiler_alquiler=5, auditoria_sistema=78, alembic_version=1`. Detectados `H-DB-01` a `H-DB-09`. | `docs/auditoria_base_datos_produccion/01..10` — **`[VERIFICADO POR AUDITORÍA INDEPENDIENTE — OP]`** |
| **2. Respaldo físico previo** | Generado fuera del repo: `sga_db_previo_20261126_210134.dump` (`59119` bytes, `101` entradas TOC, SHA-256 `90c05df5a9f22000b5b9ac065a755770869cf6ffd811cd6254e7c164226e709c`). | `docs/implementacion_datos_demo/02_respaldo_previo.md` y `docs/auditoria_post_poblamiento/06_verificacion_respaldos.md` — **`[VERIFICADO POR AUDITORÍA INDEPENDIENTE — OP]`** |
| **3. Limpieza controlada** | `TRUNCATE TABLE ... RESTART IDENTITY` sin `CASCADE` sobre las `7` tablas de dominio (excluyendo `alembic_version`), sin desactivar triggers (`scripts/01_limpieza_sga_db.sql`). | Script **`[VERIFICADO ESTÁTICAMENTE — OP]`**; ejecución **`[DECLARADO POR ANTIGRAVITY — AG]`**; preservación estructural **`[VERIFICADO POR AUDITORÍA INDEPENDIENTE — OP]`** |
| **4. Poblamiento de datos ficticios** | Inserción mediante `scripts/02_poblamiento_demo_sga_db.sql` con `SET LOCAL app.usuario_actual` y hashes bcrypt generados en memoria para los `5` empleados internos; `contrasena_usuario = NULL` para los `9` clientes. | Datos finales en `sga_db` **`[VERIFICADO POR AUDITORÍA INDEPENDIENTE — OP]`** (`docs/auditoria_post_poblamiento/03_verificacion_datos.md`) |
| **5. Conteos finales en `sga_db`** | `usuario=14` (`1` admin, `2` facturación, `2` logístico, `9` clientes), `producto=10`, `alquiler=8` (`2` pendiente, `2` activo, `1` vencido, `1` recogido, `1` terminado, `1` cancelado), `detalle_alquiler=20`, `logistica_alquiler=14` (`7` ENTREGA, `2` RECOGIDA, `5` GASTO), `logistica_alquiler_alquiler=14`, `auditoria_sistema=97`, `alembic_version=1` (`d4f74f3d4896`). | **`[VERIFICADO POR AUDITORÍA INDEPENDIENTE — OP]`** (`docs/auditoria_post_poblamiento/03_verificacion_datos.md`) |
| **6. Validaciones técnicas y funcionales** | - **SQL e integridad:** `0` huérfanos en `7` FKs, `10/10` productos con stock conciliado (`68` en obra), `vw_dashboard_operativo = (2, 2, 1, 532, 68, 464)`, `0` actores nulos o inexistentes en auditoría, secuencias con `last_value >= MAX(id)` (`10/10, 9/8, 21/20, 14/14, 103/97`).<br>- **Pruebas de triggers (rollback) y backend (`pytest` `54 passed` + llamadas ASGI):** ejecutadas contra `sga_db`. | Integridad SQL en `sga_db`: **`[VERIFICADO POR AUDITORÍA INDEPENDIENTE — OP]`** (`Dictamen A`).<br>Pruebas de triggers en rollback y pruebas ASGI/pytest: **`[DECLARADO POR ANTIGRAVITY — AG]`** |
| **7. Respaldo físico final** | Generado fuera del repo: `sga_db_final_demo_20261126_210652.dump` (`60161` bytes, `101` entradas TOC, SHA-256 `679913dbc14f55d05091874466159ba280507abe691c96cd475b69ce42270b60`). Restauración de prueba en `sga_verify_tmp`. | Existencia, tamaño, TOC y SHA-256: **`[VERIFICADO POR AUDITORÍA INDEPENDIENTE — OP]`**.<br>Restauración en `sga_verify_tmp`: **`[DECLARADO POR ANTIGRAVITY — AG]`** |

---

## 5.3. Cambios en producción (`sga_db_mydd`)

> [!NOTE]
> Conforme a `AUD-2026-008`, la auditoría posterior sobre producción se realizó por decisión del usuario en **modalidad exclusivamente estática (sin conexión a `sga_db_mydd`)**. Por tanto, todas las operaciones ejecutadas directamente en `sga_db_mydd` se clasifican como **`[DECLARADO POR ANTIGRAVITY — AG]`** en cuanto a su estado vivo en el servidor, mientras que su consistencia aritmética y scripts asociados en el repositorio están **`[VERIFICADOS ESTÁTICAMENTE — AUD-2026-008]`**.

| Etapa | Descripción y resultado | Clasificación de evidencia |
|---|---|---|
| **1. Inspección inicial** | Conexión en solo lectura a `sga_db_mydd` (Render, PostgreSQL `18.6`, esquema `public`, `alembic_version = '0001_initial_schema'`). Estructura idéntica a local (`8` tablas, `73` columnas, `1` vista, `12` funciones, `19` triggers, `26` índices, `92` restricciones). Conteos previos: `usuario=22, producto=7, alquiler=6, detalle_alquiler=6, logistica_alquiler=9, logistica_alquiler_alquiler=9, auditoria_sistema=12, alembic_version=1`. Detectados desfases previos de `stock_alquilado` en productos `id=4` e `id=7` y `1` registro histórico (`id_auditoria=20`) con clave `contrasena_usuario`. | **`[DECLARADO POR ANTIGRAVITY — AG]`** (`docs/respaldo_produccion/02_inspeccion_produccion.md`, `03_comparacion_estructuras.md`) |
| **2. Respaldos físicos previos** | Dos respaldos completos en formato custom fuera del repositorio (`<DIRECTORIO_BACKUPS>`):<br>- `sga_db_mydd_previo_carga_20261127_091347.dump` (`58726` bytes, `102` TOC, SHA-256 `0d5b35e6e5a5d40e8811323cfb73f287ccbc3d9540b0bbc4aa8af571c1d4f3c2`).<br>- `sga_db_mydd_previo_carga_20261127_094023.dump` (`58726` bytes, `102` TOC, SHA-256 `c6bd1db2b8656bad26a44ca8282560e22995bd9ab9db9249b3ccd1fb4157c242`). | **`[DECLARADO POR ANTIGRAVITY — AG]`** (`docs/respaldo_produccion/04_respaldo_fisico.md`) |
| **3. Pruebas de restauración aislada** | Restauración de ambos `.dump` en bases temporales locales (`sga_prod_verify_tmp` y `sga_prod_verify_tmp2`), comprobando paridad de `8` tablas, conteos (`1,6,12,6,9,9,7,22`), `12` funciones, `19` triggers, `1` vista, `0` huérfanos FK y prueba de `H-DB-08` (`INSERT`, `UPDATE`, `DELETE` sin `contrasena_usuario`), eliminando luego las bases temporales. | **`[DECLARADO POR ANTIGRAVITY — AG]`** (`docs/respaldo_produccion/05_prueba_restauracion.md`) |
| **4. Corrección de `H-DB-08` en `fn_auditar_cambios()`** | Dentro de la transacción en `sga_db_mydd`, se ejecutó `CREATE OR REPLACE FUNCTION public.fn_auditar_cambios()` aplicando `to_jsonb(NEW) - 'contrasena_usuario'` y `to_jsonb(OLD) - 'contrasena_usuario'` en `INSERT`, `UPDATE` y `DELETE`. *(No se modificó todavía `database/01_esquema/02_funciones_y_triggers.sql` ni `alembic/` en el repositorio.)* | Aplicación en producción: **`[DECLARADO POR ANTIGRAVITY — AG]`**.<br>Divergencia con SQL versionado: **`[VERIFICADO ESTÁTICAMENTE — AUD-2026-008]`** |
| **5. Limpieza ejecutada** | `TRUNCATE TABLE public.logistica_alquiler_alquiler, public.detalle_alquiler, public.logistica_alquiler, public.alquiler, public.producto, public.usuario RESTART IDENTITY;` sin `CASCADE`, conservando intactas `public.auditoria_sistema` (`12` registros históricos) y `public.alembic_version` (`0001_initial_schema`). | Script **`[VERIFICADO ESTÁTICAMENTE — AUD-2026-008]`**; ejecución en `sga_db_mydd` **`[DECLARADO POR ANTIGRAVITY — AG]`** |
| **6. Poblamiento ejecutado y conteos finales** | Ejecución de `docs/respaldo_produccion/scripts/02_poblamiento_demo_produccion_preparado.sql`. Conteos finales declarados: `usuario=14`, `producto=10`, `alquiler=8`, `detalle_alquiler=20`, `logistica_alquiler=14`, `logistica_alquiler_alquiler=14`, `auditoria_sistema=109` (`12` históricos + `97` nuevos), `alembic_version=1` (`0001_initial_schema`). Secuencias alineadas (`10/10`, `8/8`, `20/20`, `14/14`, `117/117`). | Coherencia aritmética y del SQL (`12 + 97 = 109`): **`[VERIFICADO ESTÁTICAMENTE — AUD-2026-008]`**.<br>Estado en base `sga_db_mydd`: **`[DECLARADO POR ANTIGRAVITY — AG]`** |
| **7. Estado de los registros históricos de auditoría** | Los `12` registros históricos (`id_auditoria IN (1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 20)`) se conservaron sin modificar ni eliminar. El registro `id_auditoria = 20` (`usuario`, `UPDATE`) mantiene la clave histórica `contrasena_usuario`; los `97` eventos nuevos (`id_auditoria 21..117`) tienen `0` apariciones de `contrasena_usuario`. | **`[DECLARADO POR ANTIGRAVITY — AG]`** (`docs/respaldo_produccion/06_plan_limpieza.md`, `08_validaciones.md`) |
| **8. Validaciones SQL y pruebas de backend declaradas** | Validación de las 14 condiciones SQL en transacción y pruebas ASGI de solo lectura del backend contra `sga_db_mydd` (`POST /api/sga/auth/login` -> `200` para `admin`, `facturacion`, `logistico` y `401` para `cliente`; `GET` `200` en `/usuarios`, `/productos`, `/alquileres`, `/proximos-vencer`, `/pendientes-entrega`, `/gastos`, `/gastos/resumen-semanal`, `/alquileres/6/historial`). | **`[DECLARADO POR ANTIGRAVITY — AG]`** (`docs/respaldo_produccion/08_validaciones.md`) |

---

## 5.4. Cambios en código y configuración

### 1. Durante las fases de auditoría, respaldo, limpieza y poblamiento de bases de datos (`d5496b1`, `7371be1`, `cb2ee5e` y cierre actual)

- **No se modificó ningún archivo de código fuente, configuración ni migración del repositorio** (`0` cambios en `sga_backend_jwt/app/`, `sga_backend_jwt/alembic/`, `sga_frontend_jwt/`, `database/01_esquema/`, `docker-compose.yml` y archivos `.env`) **`[VERIFICADO ESTÁTICAMENTE — OP / AUD-2026-008]`**.
- La actualización de `public.fn_auditar_cambios()` para `H-DB-08` se ejecutó **únicamente en la base de datos de producción `sga_db_mydd`** y no ha sido incorporada todavía a `database/01_esquema/02_funciones_y_triggers.sql` ni a una migración en `sga_backend_jwt/alembic/versions/`, respetando la restricción de no modificar código ni crear migraciones improvisadas durante la carga.

### 2. Archivos de código y pruebas modificados en el commit ancestro del Taller 6 (`cd4a48590334675569409f197f446679065974ab`, rama `feat/taller-6-calidad-sqa`)

Para trazabilidad completa respecto a `dev` (`599f96fd28e282725e6a325604e8ddaa0b8850b5`), la rama `backup/sga-antes-carga-produccion-2026-11-27` hereda del commit `cd4a485` (Taller 6 SQA) los siguientes ajustes de calidad, linting Flake8 y pruebas en `sga_backend_jwt/`:
- Código de aplicación (ajustes de formato/linting PEP 8 sin alterar lógica de negocio): `app/main.py`, `app/controllers/alquiler_controller.py`, `app/controllers/cliente_controller.py`, `app/controllers/logistica_alquiler_controller.py`, `app/controllers/producto_controller.py`, `app/controllers/usuario_controller.py`, `app/models/detalle_alquiler.py`, `app/models/producto.py`, `app/schemas/producto_schema.py`.
- Configuración de desarrollo y pruebas agregadas en `cd4a485`: `.flake8`, `pyproject.toml`, `requirements-dev.txt`, `locustfile.py`, `tests/test_alquiler_lifecycle_and_routes.py`, `tests/test_controllers_crud_and_routes.py`, `tests/test_utils_and_schemas.py`.

---

## 5.5. Documentación y evidencias

| Ruta en el repositorio | Tipo | Propósito |
|---|---|---|
| `docs/auditoria_base_datos_produccion/01_resumen_general.md` a `10_hallazgos_y_riesgos.md` y `consultas_auditoria.sql` | Auditoría inicial (`11` archivos) | Línea base técnica de `sga_db` local, catálogo de objetos, hallazgos `H-DB-01..09` y diseño preliminar del poblamiento |
| `docs/implementacion_datos_demo/01_resumen_implementacion.md` a `09_instrucciones_auditoria_opencode.md` | Informes de implementación local (`9` archivos) | Registro del respaldo previo, limpieza, datos demo insertados, validación técnica/funcional, respaldo final y hallazgos en `sga_db` local |
| `docs/implementacion_datos_demo/scripts/01_limpieza_sga_db.sql`, `02_poblamiento_demo_sga_db.sql`, `03_validacion_sga_db.sql` | Scripts SQL locales (`3` archivos) | Scripts sin credenciales utilizados para limpiar, poblar y validar `sga_db` local |
| `docs/auditoria_post_poblamiento/01_resumen_auditoria.md` a `09_dictamen_final.md` | Auditoría independiente local (`9` archivos) | Verificación en solo lectura de `sga_db` local por OpenCode (`Dictamen A. APROBADO PARA PREPARAR LA SIGUIENTE ETAPA`) |
| `docs/respaldo_rama/01_informe_respaldo_rama.md` | Informe Git (`1` archivo) | Evidencia de creación y verificación de `backup/sga-antes-estabilizacion-2026-11-27` (`d5496b1`) |
| `docs/respaldo_produccion/01_respaldo_rama_git.md` a `10_informe_final.md` | Informes de producción (`10` archivos) | Registro completo de inspección, comparación, respaldos físicos, restauración aislada, limpieza, `H-DB-08`, poblamiento, validaciones y recuperación de `sga_db_mydd` |
| `docs/respaldo_produccion/scripts/01_limpieza_produccion_preparado.sql`, `02_poblamiento_demo_produccion_preparado.sql`, `03_validacion_produccion.sql` | Scripts SQL de producción (`3` archivos) | Scripts sin credenciales utilizados para la limpieza, carga demo y validación de `sga_db_mydd` |
| `docs/respaldo_produccion/README_RESTAURACION_BACKUP.md` | Manual operativo (`1` archivo) | Guía paso a paso para verificar y restaurar respaldos `.dump` de PostgreSQL y recuperar código desde Git |
| `docs/gestion_proyecto/01_auditorias/AUD-2026-008_auditoria_estatica_produccion_sin_conexion.md` | Auditoría estática (`1` archivo) | Auditoría independiente sin conexión a producción sobre el informe y scripts de carga en `sga_db_mydd` (`Dictamen C`) |
| `docs/gestion_proyecto/INFORME_CONSOLIDADO_CAMBIOS_SGA_2026-11-28.md` | Informe consolidado (`1` archivo) | Este documento de cierre general de modificaciones, evidencias y pendientes |

---

## 5.6. Hallazgos y pendientes

### 1. Matriz de hallazgos técnicos abiertos

| ID | Severidad | Descripción técnica | Estado actual | Acción pendiente recomendada |
|---|---|---|---|---|
| **`H-DB-01`** | Alta (local) | `sga_db` local registra `alembic_version = 'd4f74f3d4896'`, revisión que no existe en `sga_backend_jwt/alembic/versions/` (`0001_initial_schema.py`). En producción `sga_db_mydd` sí está registrada `0001_initial_schema`. | **`[VERIFICADO POR AUDITORÍA INDEPENDIENTE — OP]`** en local; **`[DECLARADO — AG]`** en producción | Homologar `alembic_version` de `sga_db` local a la cadena versionada oficial cuando se consoliden las migraciones |
| **`H-DB-02`** | Media-Alta | Las `12` funciones PL/pgSQL (`database/01_esquema/02_funciones_y_triggers.sql`), los `19` triggers y la vista `vw_dashboard_operativo` (`06_vistas_dashboard.sql`) están fuera de la migración Alembic `0001_initial_schema.py`. Una creación desde cero solo con `alembic upgrade head` omitiría toda la lógica procedimental. | **`[VERIFICADO ESTÁTICAMENTE — AUD-2026-008 / OP]`** | Crear una migración Alembic versionada que incorpore las `12` funciones, `19` triggers y la vista operativa |
| **`H-DB-03`** | Alta | Inconsistencia de variable de sesión GUC: `fn_impedir_autodesactivacion_admin()` (`database/01_esquema/02_funciones_y_triggers.sql:145`) lee `current_setting('app.current_user_id', true)`, mientras el backend (`sga_backend_jwt/app/utils/audit_context.py:36`) establece `SET LOCAL app.usuario_actual`. Como resultado, el trigger no identifica al administrador autenticado desde el backend. | **`[VERIFICADO ESTÁTICAMENTE — AUD-2026-008 / OP]`** | Actualizar `fn_impedir_autodesactivacion_admin()` en el SQL versionado y en una migración Alembic para leer `app.usuario_actual`, añadiendo prueba de regresión |
| **`H-DB-07`** | Media | Diferencia de versiones de PostgreSQL entre entornos: `docker-compose.yml:21` declara `postgres:16-alpine`, `sga_db` local ejecuta `PostgreSQL 18.4` (`[VERIFICADO — OP]`) y `sga_db_mydd` en Render ejecuta `PostgreSQL 18.6` (`[DECLARADO — AG]`). | **`[VERIFICADO ESTÁTICAMENTE — AUD-2026-008 / OP]`** | Alinear la versión de PostgreSQL en `docker-compose.yml` y en la documentación de despliegue |
| **`H-DB-08`** | Alta | 1) La exclusión `- 'contrasena_usuario'` en `fn_auditar_cambios()` fue aplicada directamente en `sga_db_mydd` (`[DECLARADO — AG]`), pero `database/01_esquema/02_funciones_y_triggers.sql:34,44,55` y `alembic/` aún conservan `to_jsonb(NEW)`/`to_jsonb(OLD)` sin excluir la clave (`[VERIFICADO ESTÁTICAMENTE — AUD-2026-008]`).<br>2) En `sga_db_mydd` se conservó intacto el registro histórico `id_auditoria = 20` con la clave `contrasena_usuario` (`[DECLARADO — AG]`), y en `sga_db` local existen `14` filas `INSERT` de `usuario` con dicha clave (`[VERIFICADO — OP]`). | **Parcialmente mitigado en producción (`[DECLARADO — AG]`); pendiente en SQL versionado y registros históricos** | Versionar la corrección de `fn_auditar_cambios()` en `02_funciones_y_triggers.sql` y Alembic, aplicarla también en `sga_db` local y decidir con autorización expresa si se sanea `id_auditoria = 20` en producción |

### 2. Explicación del Dictamen C de la auditoría `AUD-2026-008`

El informe [AUD-2026-008_auditoria_estatica_produccion_sin_conexion.md](./01_auditorias/AUD-2026-008_auditoria_estatica_produccion_sin_conexion.md) emitió el dictamen **C. NO APROBADO** bajo las siguientes premisas que deben quedar explícitamente registradas:

1. **Fue una auditoría estrictamente estática y sin conexión a producción:** por elección del usuario y ausencia de credenciales en el entorno del auditor, OpenCode no se conectó a `sga_db_mydd`, no ejecutó consultas SQL ni peticiones HTTP.
2. **Coherencia estática y aritmética confirmada:** la auditoría estática verificó que los scripts SQL preparados tienen exactamente los conteos declarados (`14, 10, 8, 20, 14, 14`), que la aritmética de triggers produce exactamente `97` eventos nuevos (`66 INSERT + 20 UPDATE de stock + 4 UPDATE de alquiler + 7 UPDATE de devolución = 97`, que sumados a los `12` históricos dan `109` y secuencia `117/117`), que el stock en obra suma `68` (`532` total, `464` en bodega) y que no se filtraron credenciales ni `.dump` al repositorio.
3. **Motivo del dictamen C:** conforme a las reglas de auditoría, la coherencia documental y aritmética en el repositorio no sustituye la verificación viva del catálogo de producción (`current_database()`, `transaction_read_only = on`, conteos reales en servidor y definición efectiva de `fn_auditar_cambios()`), sumado a que `H-DB-02`, `H-DB-03`, `H-DB-07` persisten en el código versionado y la corrección de `H-DB-08` aún no está incorporada al SQL versionado del repositorio.

---

## 5.7. Estado final del proyecto

| Qué se hizo | Dónde se hizo | Qué evidencia existe | Qué quedó pendiente | Qué no debe repetirse |
|---|---|---|---|---|
| Auditoría inicial y diseño de poblamiento demo | Base local `sga_db` (`localhost:5432`) y `docs/auditoria_base_datos_produccion/` | `11` documentos en el repositorio — **`[VERIFICADO POR AUDITORÍA INDEPENDIENTE — OP]`** | Resolver causas raíz en esquema versionado (`H-DB-01`, `H-DB-02`, `H-DB-03`, `H-DB-07`, `H-DB-08`) | No usar `TRUNCATE ... CASCADE` indiscriminado ni asignar duraciones de alquiler incompatibles con `unidad_minima_alquiler` |
| Respaldos previo y final, limpieza, poblamiento demo y validación de `sga_db` local | Base local `sga_db` y `<DIRECTORIO_BACKUPS>\sga_db_*.dump` | Conteos `14/10/8/20/14/14/97/1`, integridad FK/stock y hashes SHA-256 de `.dump`: **`[VERIFICADO POR AUDITORÍA INDEPENDIENTE — OP]`** (`Dictamen A`).<br>Restauración en `sga_verify_tmp` y pruebas ASGI/`pytest`: **`[DECLARADO POR ANTIGRAVITY — AG]`** | Aplicar en `sga_db` local la exclusión de `contrasena_usuario` en `fn_auditar_cambios()` y sanear los `14` registros de auditoría locales cuando se versione `H-DB-08` | No incluir literales de contraseñas de prueba en nuevos informes ni dejar documentos de implementación pendientes antes de solicitar auditoría |
| Creación de ramas de respaldo Git | Repositorio local y remoto (`backup/sga-antes-estabilizacion-2026-11-27` y `backup/sga-antes-carga-produccion-2026-11-27`) | Commits `d5496b1`, `7371be1`, `cb2ee5e` y commit final de cierre; `dev` (`599f96f`) y `feat/taller-6-calidad-sqa` (`cd4a485`) intactas — **`[VERIFICADO ESTÁTICAMENTE]`** | Mantener la rama de respaldo como referencia segura durante la futura fase de estabilización técnica | No modificar `dev` durante operaciones de respaldo ni subir archivos `.dump` o `.env` a Git |
| Inspección, 2 respaldos físicos, restauración aislada, fix `H-DB-08`, limpieza de 6 tablas operativas, carga demo y validación de producción | Base de producción `sga_db_mydd` (Render) y `<DIRECTORIO_BACKUPS>\sga_db_mydd_previo_carga_*.dump` | Scripts SQL y aritmética `12 + 97 = 109` / stock `68`: **`[VERIFICADO ESTÁTICAMENTE — AUD-2026-008]`**.<br>Ejecución en `sga_db_mydd`, SHA-256 de respaldos de producción, restauración en `sga_prod_verify_tmp2` y pruebas ASGI contra producción: **`[DECLARADO POR ANTIGRAVITY — AG]`** | 1) Ejecutar auditoría independiente de solo lectura con conexión real a `sga_db_mydd` para levantar el `Dictamen C` de `AUD-2026-008`.<br>2) Versionar `H-DB-08` en `02_funciones_y_triggers.sql` y Alembic.<br>3) Decidir sobre el saneamiento del registro histórico `id_auditoria = 20`. | No aplicar cambios a funciones PL/pgSQL en producción sin reflejarlos después en una migración versionada; nunca tocar los `12` registros históricos de auditoría sin autorización expresa |
| Documentación de restauración y consolidación de cierre | `docs/respaldo_produccion/README_RESTAURACION_BACKUP.md` y `docs/gestion_proyecto/INFORME_CONSOLIDADO_CAMBIOS_SGA_2026-11-28.md` | Archivos versionados en `backup/sga-antes-carga-produccion-2026-11-27` y publicados en `origin` — **`[VERIFICADO ESTÁTICAMENTE]`** | Ejecutar las tareas de estabilización de `H-DB-02`, `H-DB-03`, `H-DB-07` y `H-DB-08` en una rama de desarrollo dedicada | No publicar rutas locales con nombres de usuario de Windows ni hostnames internos innecesarios en documentos del repositorio |
