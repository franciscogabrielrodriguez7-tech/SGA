# 05 — Auditoría de Alembic

**Estado:** inspección estática del repositorio + lectura de `public.alembic_version`. No se ejecutó `alembic upgrade`, `downgrade`, `stamp` ni `revision`.

## 1. Configuración observada

- `sga_backend_jwt/alembic.ini`: `script_location = %(here)s/alembic`; no hay `version_locations` activo (la línea está comentada); `prepend_sys_path = .`.
- Directorio de versiones: un único archivo, `sga_backend_jwt/alembic/versions/0001_initial_schema.py` (17 178 bytes).
- `0001_initial_schema.py`: `revision = "0001_initial_schema"`, `down_revision = None`, fecha declarada 2026-09-29. Su `upgrade()` contiene 7 `op.create_table` y 16 `op.create_index`; su `downgrade()` contiene `op.drop_table`. No contiene `op.execute`, `CREATE FUNCTION`, `CREATE TRIGGER` ni `CREATE VIEW`.

## 2. Historial de migraciones en el repositorio

Según `git log --all -- sga_backend_jwt/alembic`:

| Commit | Descripción |
|---|---|
| `9c1af42` | auditoría maestra: incorpora Alembic al proyecto |
| `0ceaed8` | agrega Alembic a `requirements.txt` y centraliza importación de modelos ORM |
| `8f64042` | hace condicional `op.drop_index` para despliegue sobre BD limpia |
| `e4d4411` | **reemplaza el baseline** por la migración inicial limpia sin `op.drop_*` |

Archivos de migración que han existido en el historial:

- `sga_backend_jwt/alembic/versions/d4f74f3d4896_baseline_schema.py` — eliminado del árbol actual.
- `sga_backend_jwt/alembic/versions/0001_initial_schema.py` — presente.

La migración eliminada (`git show e4d4411^:...`) declara `revision = 'd4f74f3d4896'`, `down_revision = None` y un `upgrade()` con borrados condicionales guiados por `sa.inspect(bind)`.

## 3. Revisión registrada en la base

```sql
SELECT version_num FROM public.alembic_version;
-- resultado observado: d4f74f3d4896
```

| Concepto | Valor |
|---|---|
| Revisión en la base | `d4f74f3d4896` |
| Revisión(es) en el árbol | `0001_initial_schema` |
| Coincidencia | **No** |
| Impacto inferido | Alembic no puede localizar la revisión actual; cualquier `upgrade` desde el estado actual es indeterminable hasta corregir el linaje |

No se ejecutó Alembic, por lo que el mensaje de error exacto no fue verificado: se trata de una inferencia técnica basada en la ausencia del identificador en el directorio de versiones.

## 4. Comparación estructura de la BD frente a `0001_initial_schema`

| Elemento | Migración | BD observada | Resultado |
|---|---:|---:|---|
| Tablas de dominio | 7 | 7 | Coinciden |
| Columnas por tabla | 11, 11, 15, 9, 10, 2, 8 | idénticas | Coinciden (0 faltantes, 0 extra) |
| Restricciones CHECK / UNIQUE declaradas en la migración | 16 / 2 | 16 / 2 | Coinciden |
| Índices declarados en la migración | 16 | 16 presentes | Coinciden (0 ausentes) |
| Funciones PL/pgSQL | 0 | 12 | **No cubierto** |
| Triggers | 0 | 19 | **No cubierto** |
| Vista `vw_dashboard_operativo` | 0 | 1 | **No cubierto** |

Detalle por tabla (columnas migración vs BD): `usuario` 11/11, `producto` 11/11, `alquiler` 15/15, `detalle_alquiler` 9/9, `logistica_alquiler` 10/10, `logistica_alquiler_alquiler` 2/2, `auditoria_sistema` 8/8.

## 5. Modelos ORM frente a la BD

Los 7 modelos de `sga_backend_jwt/app/models/` (`usuario`, `producto`, `alquiler`, `detalle_alquiler`, `logistica_alquiler`, `logistica_alquiler_alquiler`, `auditoria_sistema`) se corresponden uno a uno con las 7 tablas de dominio. No se encontró modelo para `alembic_version`, lo cual es esperado.

## 6. Migraciones pendientes

No es posible determinar un número fiable de migraciones pendientes mientras la revisión de la base no sea resoluble. En el árbol solo existe una revisión (`0001_initial_schema`, sin `down_revision`), por lo que Alembic vería un único `head`; la base, en cambio, está marcada con una revisión huérfana.

## 7. Recomendaciones (no ejecutadas)

1. Decidir y documentar cuál debe ser la línea base oficial: conservar `0001_initial_schema` como única revisión o reincorporar el baseline histórico.
2. Alinear la tabla `alembic_version` de cada entorno con la revisión elegida, mediante un procedimiento revisado y con respaldo previo. **No ejecutar sobre producción sin autorización expresa.**
3. Crear una revisión Alembic que instale las 12 funciones, los 19 triggers y la vista, o documentar formalmente los scripts `database/01_esquema/02_funciones_y_triggers.sql` y `database/01_esquema/06_vistas_dashboard.sql` como paso obligatorio de despliegue.
4. Añadir una comprobación de reconstrucción limpia que verifique que la BD resultante contiene los mismos objetos que la auditada.
