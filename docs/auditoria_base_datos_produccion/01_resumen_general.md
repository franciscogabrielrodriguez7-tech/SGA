# 01 — Resumen general de la auditoría de base de datos

**Fecha de auditoría:** 2026-11-26
**Repositorio:** `SGA_repo/SGA` (raíz verificada en `C:\Users\Acer\Documents\Default Project\SGA_repo\SGA`)
**Rama / commit verificados:** `feat/taller-6-calidad-sqa` @ `cd4a48590334675569409f197f446679065974ab`
**Estado Git inicial y final:** árbol de trabajo limpio (`git status --porcelain=v1 -uall` sin salida).
**Modo:** exclusivamente lectura. No se ejecutaron `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `DROP`, DDL ni migraciones.

## 1. Base de datos auditada (sin secretos)

| Concepto | Resultado observado |
|---|---|
| Base de datos | `sga_db` |
| Motor | PostgreSQL **18.4** (`x86_64-windows`) |
| Ubicación | Instancia **local** (`localhost`/`127.0.0.1`), puerto `5432` |
| Esquema | `public` (único esquema de usuario) |
| Usuario y credenciales | **REDACTADOS** — no se imprimieron ni se copiaron a los informes |
| Origen de la conexión | `sga_backend_jwt/.env`, variable `DATABASE_URL`, cargada por `sga_backend_jwt/app/config/settings.py:3-9` mediante `python-dotenv` |
| Sesión usada | `READ ONLY` + `autocommit` forzados en la conexión de auditoría |

**Advertencia de identidad:** la configuración disponible apunta a una instancia local, no a un servidor remoto de producción. No se consultó ningún remoto ni se hizo suposición sobre un despliegue externo. Toda conclusión se refiere a `sga_db` tal como fue observada.

**Discrepancia de versión:** `docker-compose.yml:20-21` declara `postgres:16-alpine`, mientras la instancia consultada responde `PostgreSQL 18.4`. La versión efectiva de despliegue no queda demostrada por la configuración versionada.

## 2. Inventario ejecutivo de objetos

|Objeto|Cantidad|
|---|---:|
| Tablas base | 8 (7 de dominio + `alembic_version`) |
| Vistas | 1 (`vw_dashboard_operativo`) |
| Vistas materializadas | 0 |
| Funciones PL/pgSQL en `public` | 12 |
| Triggers de usuario | 19 |
| Secuencias | 5 |
| Restricciones | 92 (8 PK, 7 FK, 2 UNIQUE, 16 CHECK, 59 NOT NULL) |
| Índices | 26 |
| Particiones | 0 |
| Tipos/enums definidos por el usuario | 0 (los estados se validan con `CHECK ... = ANY(ARRAY[...])`) |

## 3. Correspondencia con Alembic

- Migración presente en el árbol: `sga_backend_jwt/alembic/versions/0001_initial_schema.py` (`revision = "0001_initial_schema"`, `down_revision = None`).
- Revisión registrada en la base: `d4f74f3d4896` (tabla `public.alembic_version`).
- `d4f74f3d4896` corresponde a `d4f74f3d4896_baseline_schema.py`, **eliminada del árbol actual** en el commit `e4d4411` y presente solo en el historial Git.
- Consecuencia técnica: `alembic upgrade head` no puede resolver la revisión actual de la base. No se ejecutó Alembic para confirmar el mensaje exacto; se infiere del desajuste de identificadores.
- Estructura tabular: **coincide** con `0001_initial_schema` en columnas, restricciones e índices (ver `05_auditoria_alembic.md`).
- Objetos programables: **no están cubiertos** por la migración (12 funciones, 19 triggers y 1 vista existen en la base pero no son creados por Alembic).

## 4. Registros existentes (conteos)

| Tabla | Filas |
|---|---:|
| `alembic_version` | 1 |
| `alquiler` | 3 |
| `auditoria_sistema` | 78 |
| `detalle_alquiler` | 8 |
| `logistica_alquiler` | 5 |
| `logistica_alquiler_alquiler` | 5 |
| `producto` | 7 |
| `usuario` | 21 |

## 5. Hallazgos principales (detalle en `10_hallazgos_y_riesgos.md`)

| ID | Hallazgo | Severidad |
|---|---|---|
| H-DB-01 | La revisión de la base (`d4f74f3d4896`) no existe en el directorio de migraciones actual | Alta |
| H-DB-02 | Funciones, triggers y vista no son creados por Alembic; dependen de scripts SQL manuales | Alta |
| H-DB-03 | `fn_impedir_autodesactivacion_admin()` lee `app.current_user_id`, pero el backend escribe `app.usuario_actual` | Alta |
| H-DB-04 | 1 producto presenta `stock_alquilado` distinto de la suma de detalles activos de alquileres no cerrados | Media |
| H-DB-05 | 1 fila de `auditoria_sistema` referencia un `id_usuario_accion` inexistente en `usuario` | Media |
| H-DB-06 | 33 de 78 filas de auditoría no tienen actor registrado | Media |
| H-DB-07 | Versión de PostgreSQL observada (18.4) difiere de la declarada en Compose (16) | Media |

## 6. Entregables generados

Carpeta: `docs/auditoria_base_datos_produccion/`

1. `01_resumen_general.md`
2. `02_inventario_tablas_y_columnas.md`
3. `03_relaciones_y_restricciones.md`
4. `04_funciones_triggers_y_vistas.md`
5. `05_auditoria_alembic.md`
6. `06_estado_actual_de_datos.md`
7. `07_diseno_datos_demo.md`
8. `08_plan_sql_poblamiento.md`
9. `09_plan_backup_y_restauracion.md`
10. `10_hallazgos_y_riesgos.md`
11. `consultas_auditoria.sql` (consultas de solo lectura utilizadas, sin credenciales)

## 7. Limitaciones

- No se comprobó la existencia ni el estado de una base de datos remota de producción; la única conexión configurada y consultada es local.
- No se ejecutaron pruebas funcionales, de carga ni de concurrencia.
- No se extrajeron nombres, documentos, correos, teléfonos ni hashes de contraseña: solo conteos y distribuciones agregadas.
- El plan de poblamiento y limpieza queda **diseñado pero no ejecutado**, a la espera de revisión y autorización expresa.
- Los datos demo propuestos son sintéticos y no reproducen registros reales.
