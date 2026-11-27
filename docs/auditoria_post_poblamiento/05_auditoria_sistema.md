# 05 — Verificación de auditoría del sistema

> **Fecha:** 2026-11-26 · **Base:** `sga_db` local · **Esquema:** `public` · **Sesión:** `READ ONLY`  
> **Origen:** `OP` = verificado personalmente por OpenCode · `AG` = declarado por Antigravity

---

## 1. Eventos por tabla y operación

Procedimiento (`OP`):

```sql
SELECT nombre_tabla, tipo_operacion, count(*)
FROM public.auditoria_sistema
GROUP BY 1,2 ORDER BY 1,2;
```

| Tabla | Operación | Resultado obtenido | Declarado por Antigravity | Estado |
|---|---|---:|---:|---|
| `alquiler` | `INSERT` | 8 | 8 | **aprobado** |
| `alquiler` | `UPDATE` | 4 | 4 | **aprobado** |
| `detalle_alquiler` | `INSERT` | 20 | 20 | **aprobado** |
| `logistica_alquiler` | `INSERT` | 14 | 14 | **aprobado** |
| `producto` | `INSERT` | 10 | 10 | **aprobado** |
| `producto` | `UPDATE` | 27 | 27 | **aprobado** |
| `usuario` | `INSERT` | 14 | 14 | **aprobado** |
| **Total** |  | **97** | **97** | **aprobado** |

La distribución confirma que los eventos fueron generados por los triggers de auditoría sobre las cinco tablas instrumentadas. No hay eventos `DELETE`, coherente con el script de limpieza (que trunca sin triggers) y con el poblamiento declarado.

---

## 2. Actores

| Verificado | Consulta / procedimiento | Resultado obtenido | Esperado | Origen | Estado |
|---|---|---|---|---|---|
| Actores registrados | `SELECT id_usuario_accion, count(*) FROM auditoria_sistema GROUP BY 1` | `DEMO-ADM-01` 27; `DEMO-FAC-01` 9; `DEMO-FAC-02` 44; `DEMO-LOG-01` 14; `DEMO-LOG-02` 3 | Igual a la declaración | OP | **aprobado** |
| Actor NULL | `count(*) FILTER (WHERE id_usuario_accion IS NULL)` | 0 | 0 | OP | **aprobado** |
| Actor inexistente | `NOT EXISTS (SELECT 1 FROM usuario u WHERE u.id_usuario=au.id_usuario_accion)` | 0 | 0 | OP | **aprobado** |
| Origen declarado del actor | `SET LOCAL app.usuario_actual` en el script de poblamiento; `fn_auditar_cambios()` lee `current_setting('app.usuario_actual', true)` | Mecanismo coherente con `app/utils/audit_context.py:33-38` | Igual | OP | **aprobado** |

La ejecución real de los bloques del script de poblamiento es un resultado **declarado por Antigravity**, no reproducido por esta auditoría; lo que sí se verifica es que el estado final de la tabla es exactamente el esperado por ese mecanismo.

---

## 3. Claves sensibles en los datos de auditoría

Procedimiento (`OP`), sin extraer valores:

```sql
SELECT count(*) AS total,
       count(*) FILTER (WHERE datos_nuevos ? 'contrasena_usuario') AS en_nuevos,
       count(*) FILTER (WHERE datos_anteriores ? 'contrasena_usuario') AS en_anteriores
FROM public.auditoria_sistema;
```

| Verificado | Resultado obtenido | Esperado / declarado | Origen | Estado |
|---|---:|---:|---|---|
| Total de eventos | 97 | 97 | OP | **aprobado** |
| Clave `contrasena_usuario` en `datos_nuevos` | **14** | 14 (`AG`) | OP | **fallido** (riesgo de exposición) |
| Clave `contrasena_usuario` en `datos_anteriores` | 0 | 0 | OP | **aprobado** |
| Tablas afectadas | Solo `usuario` (14) | Solo `usuario` | OP | **aprobado** |
| Valores de hash mostrados | 0 | 0 | OP | **aprobado** |

### Análisis de la función

| Verificado | Consulta / procedimiento | Resultado obtenido | Resultado esperado | Origen | Estado |
|---|---|---|---|---|---|
| Serialización de `NEW` | `pg_get_functiondef('public.fn_auditar_cambios'::regproc)` y búsqueda de `to_jsonb(NEW)` | Presente | Debería excluir/enmascarar el campo sensible | OP | **fallido** |
| Referencia a `contrasena_usuario` en el cuerpo | Ídem | No aparece literal de enmascaramiento | Debería existir una exclusión explícita | OP | **fallido** |
| Lectura del actor | Ídem | `app.usuario_actual` presente | `app.usuario_actual` | OP | **aprobado** |

**Conclusión:** `fn_auditar_cambios()` continúa serializando la fila completa con `to_jsonb(NEW)`. No incluye una instrucción de exclusión o enmascaramiento; la presencia efectiva de la clave en 14 filas de `datos_nuevos` confirma el riesgo H-DB-08. Antigravity declaró los mismos 14 eventos; confirmado personalmente.

---

## 4. Evaluación de riesgo y tratamiento recomendado (no ejecutado)

- **Riesgo:** `auditoria_sistema.datos_nuevos` persiste hashes bcrypt de las cinco cuentas internas. Cualquier lector con acceso a la tabla de auditoría puede obtenerlos sin consultar `usuario`. Es un riesgo de exposición de credenciales, no de integridad de datos.
- **Corrección propuesta para eventos futuros:** en `fn_auditar_cambios()`, construir el JSON excluyendo o reemplazando la clave sensible antes del `INSERT` en `auditoria_sistema`, por ejemplo usando `to_jsonb(NEW) - 'contrasena_usuario'` (o una máscara equivalente) también en `datos_anteriores` cuando corresponda. Debe revisarse y probarse en entorno aislado antes de aplicarse.
- **Tratamiento de registros existentes:** no borrar ni editar sin autorización. Diseñar un saneamiento controlado con respaldo previo, criterio de retención y registro de la decisión. Hasta entonces, restringir privilegios de lectura sobre `auditoria_sistema`.
- **No implementado:** esta auditoría no modificó la función ni los registros.

---

## 5. Resultado global

La trazabilidad de los 97 eventos es correcta y coincide con la declaración. El único aspecto `fallido` es la exposición de la clave sensible, heredada de H-DB-08 y reducida de 21 eventos en la auditoría inicial a 14 en el estado actual.
