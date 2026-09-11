"""
audit_context.py
-----------------
NUEVO — pieza necesaria para cumplir la regla de negocio "todos los
atributos de auditoría deben extraerse del JWT e inyectarse de forma
segura, nunca confiar en el payload".

database/01_tablas.sql centraliza la auditoría en `auditoria_sistema`,
con una columna `id_usuario_accion` pensada exactamente para esto.
Pero un trigger de PostgreSQL no puede leer un token JWT — solo puede
leer datos de la propia base de datos o variables de configuración de
sesión (`current_setting`). Por eso `fn_auditar_cambios()` (ver
database/02_funciones_y_triggers.sql) fue ajustada para leer
`current_setting('app.usuario_actual', true)`, y este helper es quien
la puebla desde el backend.

USO OBLIGATORIO: llamar `set_audit_context(db, usuario_actual.id_usuario)`
como la PRIMERA operación de cualquier función de controller que vaya
a hacer INSERT/UPDATE/DELETE sobre una tabla auditada (usuario,
producto, alquiler, detalle_alquiler, logistica_alquiler), ANTES de
cualquier `db.add(...)` / `db.execute(...)` de esa misma transacción.

Se usa `SET LOCAL` (no `SET`): el valor solo vive dentro de la
transacción actual y se descarta automáticamente al hacer COMMIT o
ROLLBACK, así que nunca puede "filtrarse" hacia otra request que
reutilice la misma conexión del pool.
"""

from sqlalchemy import text
from sqlalchemy.orm import Session


def set_audit_context(db: Session, id_usuario: str) -> None:

    db.execute(
        text("SET LOCAL app.usuario_actual = :uid"),
        {"uid": id_usuario}
    )
