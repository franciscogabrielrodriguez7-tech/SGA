# 01 — Resumen de auditoría independiente post-poblamiento

> **Fecha de auditoría:** 2026-11-26  
> **Repositorio (fuente de verdad):** `SGA_repo/SGA`, raíz que contiene `AGENTS.md`  
> **Rama / commit:** `feat/taller-6-calidad-sqa` @ `cd4a48590334675569409f197f446679065974ab`  
> **Commit padre:** `599f96fd28e282725e6a325604e8ddaa0b8850b5`  
> **Ámbito:** exclusivamente `sga_db` local, `localhost`/`127.0.0.1:5432`, esquema `public`  
> **Modo:** estrictamente solo lectura; `sga_db_mydd` no fue conectada ni consultada  
> **Origen de resultados:** `OP` = verificado personalmente por OpenCode; `AG` = declarado por Antigravity  
> **Estados permitidos:** `aprobado` · `observado` · `fallido` · `no verificable`

---

## 1. Objetivo

Comprobar de forma independiente que la limpieza, el poblamiento sintético, la validación y los respaldos reportados por Antigravity sobre `sga_db` son reales, que no existen inconsistencias relevantes y que la base local puede considerarse para preparar —solo preparar— un posterior procedimiento de replicación controlada.

**No se autorizó ni ejecutó** transferencia a producción, restauración de respaldos, migración, DDL ni escritura de datos. Tampoco se modificaron código, configuración, migraciones ni documentación preexistente.

---

## 2. Confirmación de identidad (control de parada)

| Verificado | Consulta / procedimiento | Resultado obtenido | Resultado esperado | Origen | Estado |
|---|---|---|---|---|---|
| Base, dirección, puerto, motor y modo de sesión | `SELECT current_database(), inet_server_addr()::text, inet_server_port(), version(), current_setting('transaction_read_only')` sobre conexión derivada de `DATABASE_URL` | `sga_db`; `::1`; `5432`; PostgreSQL `18.4`; `transaction_read_only = on` | `sga_db` local, puerto `5432`, sesión de solo lectura | OP | **aprobado** |

La configuración se leyó sin imprimir credenciales. El valor de `DATABASE_URL` se validó antes de conectar: host `localhost`/`127.0.0.1`, puerto `5432`, base `sga_db`. Al superarse este control se continuó la auditoría.

---

## 3. Resumen ejecutivo por área

| Área | Resultado verificado personalmente (`OP`) | Declaración de Antigravity (`AG`) | Estado |
|---|---|---|---|
| Estructura | 8 tablas, 1 vista, 5 secuencias, 12 funciones PL/pgSQL, 19 triggers activos, 26 índices, 92 restricciones, revisión `d4f74f3d4896` | Coincide con lo reportado | **aprobado** |
| Datos | Conteos 14/10/8/20/14/14/97/1; roles 1/2/2/9; 9 clientes sin contraseña; 5 internos con formato bcrypt | Coincide con lo reportado | **aprobado** |
| Integridad | 7 FK sin huérfanos; stock conciliado en 10/10 productos; 0 alquileres sin detalle; 0 movimientos logísticos inconsistentes; 0 duplicados | Coincide con lo reportado | **aprobado** |
| Secuencias | `last_value >= MAX(id)` en 5/5; 3 secuencias quedaron por delante del máximo | Declaró «reiniciadas y consistentes (`last_value >= MAX(id)`)» | **observado** |
| Auditoría del sistema | 97 eventos; distribución por tabla/operación y actores idéntica a la declaración; 0 actores NULL e inexistentes; 14 filas con clave `contrasena_usuario` en `datos_nuevos` | Coincide, incluidos 14 eventos sensibles | **aprobado** (trazabilidad) / **fallido** (exposición sensible) |
| Respaldos | Ambos archivos existen; tamaño y SHA-256 coinciden; `pg_restore -l` exitoso con 101 entradas TOC cada uno | Coincide; la restauración de prueba queda como declaración no reproducida | **aprobado** |
| Repositorio | Sin diffs de código/migraciones, sin `.dump`, sin credenciales nuevas; documentación de implementación incompleta (3 de 9 archivos) | Declaró documentación completa | **aprobado** (cambios) / **fallido** (completitud documental) |
| Hallazgos críticos | H-DB-01, H-DB-02, H-DB-03, H-DB-07 y H-DB-08 persisten; H-DB-04/05/06 están corregidos **en los datos** | Coincide en lo esencial | ver detalle en `08_hallazgos_y_recomendaciones.md` |

---

## 4. Conclusión técnica

La base local `sga_db` está **internamente consistente**: conteos, relaciones, stock, estados, actores de auditoría y respaldos coinciden con la evidencia independiente. Los problemas abiertos son de naturaleza estructural, de despliegue, de seguridad de auditoría y de trazabilidad documental; no se detectaron inconsistencias de datos que invaliden el estado actual de la base.

La corrección de H-DB-04, H-DB-05 y H-DB-06 se confirma **solo en el estado de los datos**. Las causas de raíz no fueron modificadas: no se cambiaron funciones, triggers, migraciones ni código.

---

## 5. Limitaciones de la auditoría

1. Solo estaban presentes `01`, `02` y `04` de los nueve documentos de `docs/implementacion_datos_demo/`; faltan `03`, `05`, `06`, `07`, `08` y `09`. Por ello, varias afirmaciones de esos documentos no pudieron cotejarse textualmente.
2. Las pruebas funcionales declaradas (`31/31 OK` backend, `7/7 OK` frontend), la restauración de prueba en `sga_verify_tmp` y la ejecución real de los scripts de limpieza/poblamiento son **resultados declarados por Antigravity**, no ejecuciones reproducidas por esta auditoría.
3. No se ejecutó Alembic; la conclusión sobre H-DB-01 es estática (revisión ausente del árbol actual), no un mensaje de error observado.
4. No se verificó que los hashes internos correspondan a una contraseña concreta: solo se comprobó el formato, sin extraer ni mostrar valores.
5. No se realizaron pruebas funcionales, de concurrencia, de carga ni de restauración.

---

## 6. Declaración de operaciones

**Realizado:** conexiones de solo lectura; consultas de catálogo y datos; lectura de documentos y scripts SQL sin ejecutarlos; verificación de hashes/tamaños de respaldos; `pg_restore -l` (solo lectura del archivo); inspección Git de solo lectura; creación de los nueve documentos de esta carpeta, expresamente autorizada.

**No realizado:** `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, DDL, migraciones, restauraciones, creación/desactivación de bases, cambios de configuración, correcciones de hallazgos, commits, cambios de rama, `push`, `fetch` ni acceso a `sga_db_mydd`.

El dictamen final se encuentra en `09_dictamen_final.md`.
