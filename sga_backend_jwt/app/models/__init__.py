# Importar todos los modelos aquí garantiza que Alembic los detecte
# automáticamente en env.py sin necesidad de listarlos uno por uno.
# Regla: cada nuevo modelo que se cree DEBE ser importado aquí.
from app.models.usuario import Usuario
from app.models.producto import Producto
from app.models.alquiler import Alquiler
from app.models.detalle_alquiler import DetalleAlquiler
from app.models.logistica_alquiler import LogisticaAlquiler
from app.models.logistica_alquiler_alquiler import LogisticaAlquilerAlquiler
from app.models.auditoria_sistema import AuditoriaSistema

__all__ = [
    "Usuario",
    "Producto",
    "Alquiler",
    "DetalleAlquiler",
    "LogisticaAlquiler",
    "LogisticaAlquilerAlquiler",
    "AuditoriaSistema",
]
