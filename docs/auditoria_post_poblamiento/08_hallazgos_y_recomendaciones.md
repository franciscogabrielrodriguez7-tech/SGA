# 08 — Hallazgos y recomendaciones

> **Fecha:** 2026-11-26 · **Estado:** todos los hallazgos están documentados; **ninguno fue corregido ni implementado** por esta auditoría.  
> **Clasificación:** `verificado` = evidencia comprobada personalmente; `declarado` = afirmación de Antigravity no reproducida; `recomendado` = propuesta no aprobada.

---

## 1. Hallazgos heredados reevaluados

| ID | Estado actual | Evidencia (`OP`) | Riesgo | Recomendación (no ejecutada) | Estado |
|---|---|---|---|---|---|
| H-DB-01 | Persiste. BD en `d4f74f3d4896`; árbol solo con `0001_initial_schema`; baseline eliminado en `e4d4411` | `alembic_version`; listado de versiones; `git log --all` | Una reconstrucción limpia no reproducible desde el estado actual de la BD | Definir línea base oficial y alinear `alembic_version` con procedimiento con respaldo previo; validar en entorno aislado | **fallido** |
| H-DB-02 | Persiste. 12 funciones, 19 triggers y 1 vista existen en BD; la migración solo crea 7 tablas y 16 índices | `pg_proc`, `pg_trigger`, `pg_views` vs `0001_initial_schema.py` | Despliegue dependiente de scripts manuales; riesgo de omisión | Incorporar objetos programables a Alembic o formalizarlos como paso obligatorio con verificación de reconstrucción | **fallido** |
| H-DB-03 | Persiste. La función lee `app.current_user_id`; el backend escribe `app.usuario_actual` | `pg_get_functiondef(...)`; `audit_context.py:33-38` | La autodesactivación de un administrador no sería bloqueada por ese trigger | Unificar la variable de sesión y añadir prueba de regresión; la prueba empírica de Antigravity sigue siendo **declarada** | **fallido** |
| H-DB-04 | Corregido **en los datos**: 0 discrepancias de stock en 10/10 productos (antes 1) | Reconciliación por producto | Bajo, mientras no se alteren los datos | Mantener verificación de reconciliación; investigar causas de desincronización pasada | **aprobado** (datos) |
| H-DB-05 | Corregido **en los datos**: 0 actores inexistentes (antes 1) | `NOT EXISTS` sobre `usuario` | Bajo | Conservar control en futuras cargas | **aprobado** (datos) |
| H-DB-06 | Corregido **en los datos**: 0 eventos sin actor (antes 33) | `id_usuario_accion IS NULL` | Medio: la causa de raíz sigue abierta; escrituras internas sin contexto pueden recrear el problema | Asegurar `set_audit_context()` en todas las escrituras, incluidas internas, con actor de sistema explícito | **aprobado** (datos), **observado** (mecanismo) |
| H-DB-07 | Persiste. Local `PostgreSQL 18.4`; Compose declara `postgres:16-alpine` | `version()` vs `docker-compose.yml:21` | Comportamiento distinto entre entornos | Fijar versión real y alinear Compose, documentación y pipeline | **fallido** |
| H-DB-08 | Persiste. 14 eventos con `contrasena_usuario` en `datos_nuevos` (antes 21) | Conteo de clave JSONB y `pg_get_functiondef()` | Alto: exposición de hashes en tabla de auditoría | Enmascarar/excluir el campo en `fn_auditar_cambios()`; restringir lectura; planificar saneamiento con respaldo y autorización | **fallido** |
| H-DB-09 | Sin cambios: 9 clientes con rol no admisible en los grupos RBAC del backend | Distribución de roles vs `roles.py` | Bajo: no deben usarse para login | Documentar si son solo datos de negocio o si deben autenticar | **observado** |

---

## 2. Hallazgos nuevos de esta auditoría

| ID | Hallazgo | Evidencia | Impacto | Recomendación (no ejecutada) | Estado |
|---|---|---|---|---|---|
| AUD-POB-01 | Faltan 6 de los 9 documentos declarados en `docs/implementacion_datos_demo/` (`03`, `05`, `06`, `07`, `08`, `09`) | Listado directo del directorio | Trazabilidad incompleta; no se pudo cotejar textualmente la validación técnica, funcional, hallazgos e instrucciones declaradas | Completar y versionar la documentación antes de cualquier replicación | **fallido** |
| AUD-POB-02 | La documentación generada incluye un literal de contraseña demo | Escaneo sin impresión de valores; 2 coincidencias en `01` y `04` | Bajo (sintético), pero contraviene la regla de no incluir credenciales en informes | Sustituir por referencia genérica `<credencial de prueba>` | **observado** |
| AUD-POB-03 | Tres secuencias quedaron por delante de `MAX(id)` (`+1`, `+6`, `+1`) | `pg_sequences` vs `MAX(id)` | Bajo: huecos no reutilizados; no hay colisión | Registrar los huecos y verificar tras cualquier prueba revertida; no requiere corrección de datos | **observado** |
| AUD-POB-04 | Existen hashes bcrypt en archivos versionados preexistentes de `database/01_esquema/` | Escaneo de 249 archivos no ignorados | Medio: exposición histórica, no introducida por esta intervención | Tratar en plan de saneamiento de secretos separado, con autorización propia | **observado** |
| AUD-POB-05 | La vista operativa excluye el producto inactivo y por eso muestra 532 en lugar de 542 | `pg_get_viewdef` | Ninguno: comportamiento deliberado | Documentar el filtro para evitar interpretarlo como pérdida de stock | **aprobado** |

---

## 3. Resultados positivos verificados

- Estructura idéntica a la auditoría inicial: 8/1/5/12/19/26/92 y revisión `d4f74f3d4896`.
- Todos los conteos finales coinciden con la declaración.
- Roles, nulidad de contraseñas de clientes y formato de hash interno correctos.
- 7 FK sin huérfanos; stock, estados, detalles y logística coherentes.
- 97 eventos de auditoría con actores válidos y distribución exacta.
- Respaldos íntegros, con hashes y tamaños coincidentes y TOC legible.
- Repositorio sin cambios de código, migraciones ni configuración; sin dumps.

---

## 4. Condiciones para la siguiente etapa (recomendaciones, no decisiones aprobadas)

1. Completar la documentación ausente de `docs/implementacion_datos_demo/`.
2. Resolver H-DB-01 y H-DB-02 antes de cualquier reconstrucción o replicación.
3. Unificar la variable de sesión de H-DB-03 y añadir prueba de regresión.
4. Enmascarar `contrasena_usuario` en `fn_auditar_cambios()` y decidir el tratamiento de los 14 registros existentes.
5. Alinear la versión de PostgreSQL entre Compose y el entorno real.
6. Ejecutar la replicación controlada solo con autorización independiente y tras verificar los puntos anteriores.

**Ninguna de estas acciones fue implementada ni autorizada por esta auditoría.**
