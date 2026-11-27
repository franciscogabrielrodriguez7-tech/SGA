# 10 — Hallazgos y riesgos

Clasificación: **Verificado** = respaldado por consulta de catálogo o dato observado; **Probable/inferido** = conclusión técnica sin ejecución; **Recomendado** = propuesta no aprobada.

## 1. Hallazgos positivos verificados

- Los 7 modelos ORM se corresponden con las 7 tablas de dominio; no hay tablas huérfanas del modelo.
- Las columnas, restricciones CHECK/UNIQUE y los 16 índices de la migración `0001_initial_schema` coinciden exactamente con la BD observada.
- Las 7 foreign keys no tienen filas huérfanas.
- Las 5 secuencias están alineadas con el `max(id)` de sus columnas.
- Existen reglas de negocio en base de datos para stock, fechas, estados de usuario, cierre de contratos y auditoría.

## 2. Registro de riesgos

| ID | Componente | Hallazgo | Evidencia | Prob. | Impacto | Prioridad | Estado |
|---|---|---|---|---|---|---|---|
| H-DB-01 | Alembic | La BD está marcada con `d4f74f3d4896`, revisión eliminada del árbol; solo existe `0001_initial_schema` | `public.alembic_version`; `git log --all -- sga_backend_jwt/alembic`; `e4d4411` | Alta | Alto | **Crítica** | Verificado / impacto inferido |
| H-DB-02 | Despliegue | 12 funciones, 19 triggers y 1 vista existen en la BD pero no son creados por Alembic | `05_auditoria_alembic.md` §4; `0001_initial_schema.py` solo tiene `op.create_table`/`op.create_index` | Alta | Alto | **Crítica** | Verificado |
| H-DB-03 | Auditoría / seguridad | `fn_impedir_autodesactivacion_admin()` lee `app.current_user_id`, pero `app/utils/audit_context.py` escribe `app.usuario_actual`: la protección contra autodesactivación no se activa | `pg_get_functiondef` de la función; `audit_context.py:33-38` | Alta | Medio-alto | **Alta** | Verificado en BD; efecto en runtime no ejecutado |
| H-DB-04 | Inventario | 1 producto tiene `stock_alquilado` distinto de la suma de líneas activas de alquileres abiertos | Consulta de agregado en `06_estado_actual_de_datos.md` §4 | Media | Medio | **Media** | Verificado |
| H-DB-05 | Auditoría | 1 fila de `auditoria_sistema` tiene `id_usuario_accion` que no existe en `usuario` | Agregado con `NOT EXISTS` sobre `usuario` | Media | Bajo-medio | **Media** | Verificado |
| H-DB-06 | Auditoría | 33 de 78 filas no registran actor (`id_usuario_accion IS NULL`) | Agregado sobre `auditoria_sistema` | Alta | Medio | **Media** | Verificado |
| H-DB-07 | Infraestructura | PostgreSQL observado es 18.4; `docker-compose.yml:21` declara `postgres:16-alpine` | `SELECT version()` vs archivo Compose | Alta | Medio | **Media** | Verificado |
| H-DB-08 | Seguridad | Las 21 filas de auditoría de `usuario` contienen la clave `contrasena_usuario` en `datos_nuevos`: los hashes quedan persistidos en `auditoria_sistema` | `count(*) FILTER (WHERE datos_nuevos ? 'contrasena_usuario') = 21`; valores **no extraídos** | Alta | Alto | **Crítica** | Verificado (solo presencia de la clave) |
| H-DB-09 | Datos / RBAC | Hay 10 usuarios con rol `cliente`, pero la regla RBAC del backend no admite ese rol en ningún grupo de acceso | Distribución de `rol_usuario`; `app/utils/roles.py:10-19` | Media | Bajo | **Baja** | Verificado |

## 3. Mitigaciones recomendadas (ninguna ejecutada)

| ID | Mitigación |
|---|---|
| H-DB-01 | Definir una línea base oficial y alinear `alembic_version` de cada entorno con un procedimiento con respaldo previo; verificar con `alembic history` en entorno aislado. |
| H-DB-02 | Incorporar a Alembic (o a un paso obligatorio de despliegue documentado) la creación de funciones, triggers y vista; añadir prueba de reconstrucción limpia. |
| H-DB-03 | Unificar la variable de sesión: hacer que el backend escriba `app.current_user_id` o que el trigger lea `app.usuario_actual`, y añadir prueba que intente la autodesactivación. |
| H-DB-04 | Conciliar el stock del producto afectado mediante el flujo de negocio, no con UPDATE directo; investigar si hubo carga manual o borrado lógico sin trigger. |
| H-DB-05 | Localizar el registro de auditoría y decidir si se anonimiza o se documenta como dato histórico; no borrar sin autorización. |
| H-DB-06 | Asegurar `set_audit_context()` en todas las escrituras, incluidas las internas (scheduler y reconciliación), con contexto de sistema explícito. |
| H-DB-07 | Fijar la versión de PostgreSQL del despliegue real y alinear Compose, documentación y entorno. |
| H-DB-08 | En `fn_auditar_cambios()`, excluir o enmascarar `contrasena_usuario` antes de `to_jsonb`; restringir privilegios de lectura sobre `auditoria_sistema`; planificar saneamiento controlado de los valores ya almacenados. |
| H-DB-09 | Definir si los clientes son solo datos de negocio o deben autenticar; documentar la decisión para evitar pruebas de login con roles no admitidos. |

## 4. Riesgos descartados por evidencia

- No hay evidencia de tablas duplicadas, índices inválidos, FK huérfanas ni desfase de secuencias.
- No se encontraron vistas materializadas, particiones ni tipos `ENUM` que hubieran sido omitidos del inventario.
- No se observaron registros en `GASTO`, por lo que el resumen semanal no puede validarse con los datos actuales; es una limitación de cobertura de datos, no una inconsistencia.

## 5. Pendiente de autorización

El plan de limpieza y poblamiento (`08_plan_sql_poblamiento.md`) y cualquier corrección de los hallazgos quedan **sin ejecutar**. Se requiere revisión y autorización expresa antes de escribir en cualquier base de datos.
