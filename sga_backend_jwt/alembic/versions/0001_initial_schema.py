"""initial_schema

Migración inicial limpia para levantar la base de datos desde cero
en cualquier entorno (staging, producción, CI). Contiene SOLO
sentencias op.create_* — no hay ningún op.drop_* que pueda fallar
sobre una base de datos vacía.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-09-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Crea todo el esquema desde cero."""

    # ──────────────────────────────────────────────────────────────────
    # 1. usuario  (tabla raíz — sin FK entrantes de otras tablas aún)
    # ──────────────────────────────────────────────────────────────────
    op.create_table(
        "usuario",
        sa.Column("id_usuario",          sa.String(20),  nullable=False),
        sa.Column("rol_usuario",          sa.String(30),  nullable=False, server_default="cliente"),
        sa.Column("nombres_usuario",      sa.String(100), nullable=False),
        sa.Column("apellidos_usuario",    sa.String(100), nullable=False),
        sa.Column("email_usuario",        sa.String(100), nullable=True),
        sa.Column("telefono_usuario",     sa.String(20),  nullable=False),
        sa.Column("contrasena_usuario",   sa.String(255), nullable=True),
        sa.Column("tipo_documento",       sa.String(20),  nullable=False),
        sa.Column("estado_registro",      sa.Boolean(),   nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion",       sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("fecha_actualizacion",  sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id_usuario"),
        sa.UniqueConstraint("email_usuario"),
        sa.UniqueConstraint("telefono_usuario"),
        sa.CheckConstraint(
            "rol_usuario IN ('admin', 'encargado_facturacion', 'encargado_logistico', 'cliente')",
            name="chk_usuario_rol",
        ),
        sa.CheckConstraint(
            "tipo_documento IN ('CC', 'CE', 'NIT', 'PPT')",
            name="chk_usuario_tipo_documento",
        ),
    )
    op.create_index(
        "idx_usuario_rol", "usuario", ["rol_usuario"],
        postgresql_where=sa.text("estado_registro IS TRUE"),
    )
    op.create_index(
        "idx_usuario_email", "usuario", ["email_usuario"],
        postgresql_where=sa.text("email_usuario IS NOT NULL"),
    )

    # ──────────────────────────────────────────────────────────────────
    # 2. producto  (sin dependencias externas)
    # ──────────────────────────────────────────────────────────────────
    op.create_table(
        "producto",
        sa.Column("id_producto",            sa.Integer(),      nullable=False, autoincrement=True),
        sa.Column("nombre_producto",         sa.String(100),    nullable=False),
        sa.Column("descripcion_producto",    sa.String(300),    nullable=True),
        sa.Column("precio_base_producto",    sa.Numeric(10, 2), nullable=False),
        sa.Column("precio_base_extra",       sa.Numeric(10, 2), nullable=False, server_default=sa.text("0.00")),
        sa.Column("unidad_minima_alquiler",  sa.String(10),     nullable=False, server_default="DIA"),
        sa.Column("stock_total",             sa.Integer(),      nullable=False),
        sa.Column("stock_alquilado",         sa.Integer(),      nullable=False, server_default=sa.text("0")),
        sa.Column("estado_registro",         sa.Boolean(),      nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion",          sa.TIMESTAMP(),    nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("fecha_actualizacion",     sa.TIMESTAMP(),    nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id_producto"),
        sa.CheckConstraint(
            "unidad_minima_alquiler IN ('DIA', 'SEMANA', 'MES')",
            name="chk_producto_unidad_minima_alquiler",
        ),
        sa.CheckConstraint("precio_base_extra >= 0",   name="chk_producto_precio_extra"),
        sa.CheckConstraint("precio_base_producto >= 0", name="chk_producto_precio"),
        sa.CheckConstraint("stock_total >= 0",          name="chk_producto_stock_total"),
        sa.CheckConstraint(
            "stock_alquilado >= 0 AND stock_alquilado <= stock_total",
            name="chk_producto_stock_alquilado",
        ),
    )
    op.create_index(
        "idx_producto_nombre", "producto", ["nombre_producto"],
        postgresql_where=sa.text("estado_registro IS TRUE"),
    )

    # ──────────────────────────────────────────────────────────────────
    # 3. alquiler  (depende de usuario)
    # ──────────────────────────────────────────────────────────────────
    op.create_table(
        "alquiler",
        sa.Column("id_alquiler",          sa.Integer(),      nullable=False, autoincrement=True),
        sa.Column("id_usuario_creador",   sa.String(20),     nullable=False),
        sa.Column("id_usuario_cliente",   sa.String(20),     nullable=False),
        sa.Column("estado_alquiler",      sa.String(30),     nullable=False, server_default="pendiente"),
        sa.Column("barrio",               sa.String(100),    nullable=False),
        sa.Column("direccion",            sa.String(255),    nullable=False),
        sa.Column("deposito",             sa.Numeric(10, 2), nullable=False),
        sa.Column("precio_alquiler",      sa.Numeric(10, 2), nullable=False),
        sa.Column("fecha_inicio",         sa.Date(),         nullable=False),
        sa.Column("tiempo_alquiler_dias", sa.Integer(),      nullable=False),
        sa.Column("se_lleva",             sa.Boolean(),      nullable=False, server_default=sa.text("true")),
        sa.Column("se_recoge",            sa.Boolean(),      nullable=False, server_default=sa.text("true")),
        sa.Column("estado_registro",      sa.Boolean(),      nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion",       sa.TIMESTAMP(),    nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("fecha_actualizacion",  sa.TIMESTAMP(),    nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id_alquiler"),
        sa.ForeignKeyConstraint(
            ["id_usuario_creador"], ["usuario.id_usuario"],
            name="fk_alquiler_usuario_creador", onupdate="CASCADE", ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["id_usuario_cliente"], ["usuario.id_usuario"],
            name="fk_alquiler_usuario_cliente", onupdate="CASCADE", ondelete="RESTRICT",
        ),
        sa.CheckConstraint("deposito >= 0",            name="chk_alquiler_deposito"),
        sa.CheckConstraint("precio_alquiler >= 0",     name="chk_alquiler_precio"),
        sa.CheckConstraint("tiempo_alquiler_dias > 0", name="chk_alquiler_tiempo_dias"),
        sa.CheckConstraint(
            "estado_alquiler IN ('pendiente','activo','vencido','recogido','terminado','cancelado')",
            name="chk_alquiler_estado",
        ),
    )
    op.create_index("idx_alquiler_cliente",      "alquiler", ["id_usuario_cliente"])
    op.create_index("idx_alquiler_creador",      "alquiler", ["id_usuario_creador"])
    op.create_index("idx_alquiler_fecha_inicio", "alquiler", ["fecha_inicio"])
    op.create_index(
        "idx_alquiler_estado", "alquiler", ["estado_alquiler"],
        postgresql_where=sa.text("estado_registro IS TRUE"),
    )
    op.create_index(
        "idx_alquiler_fecha_vencimiento",
        "alquiler",
        [sa.text("(fecha_inicio + tiempo_alquiler_dias - 1)")],
    )

    # ──────────────────────────────────────────────────────────────────
    # 4. detalle_alquiler  (depende de alquiler y producto)
    # ──────────────────────────────────────────────────────────────────
    op.create_table(
        "detalle_alquiler",
        sa.Column("id_detalle_alquiler", sa.Integer(),      nullable=False, autoincrement=True),
        sa.Column("id_alquiler",         sa.Integer(),      nullable=False),
        sa.Column("id_producto",         sa.Integer(),      nullable=False),
        sa.Column("precio_conjunto",     sa.Numeric(10, 2), nullable=False),
        sa.Column("cantidad_productos",  sa.Integer(),      nullable=False),
        sa.Column("es_producto_extra",   sa.Boolean(),      nullable=False, server_default=sa.text("false")),
        sa.Column("estado_registro",     sa.Boolean(),      nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion",      sa.TIMESTAMP(),    nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("fecha_actualizacion", sa.TIMESTAMP(),    nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id_detalle_alquiler"),
        sa.ForeignKeyConstraint(
            ["id_alquiler"], ["alquiler.id_alquiler"],
            name="fk_detalle_alquiler_alquiler", onupdate="CASCADE", ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["id_producto"], ["producto.id_producto"],
            name="fk_detalle_alquiler_producto", onupdate="CASCADE", ondelete="RESTRICT",
        ),
        sa.CheckConstraint("cantidad_productos > 0",  name="chk_detalle_cantidad"),
        sa.CheckConstraint("precio_conjunto >= 0",    name="chk_detalle_precio_conjunto"),
    )
    op.create_index("idx_detalle_alquiler_id",  "detalle_alquiler", ["id_alquiler"])
    op.create_index("idx_detalle_producto_id",  "detalle_alquiler", ["id_producto"])
    op.create_index(
        "idx_unico_producto_alquiler",
        "detalle_alquiler",
        ["id_alquiler", "id_producto"],
        unique=True,
        postgresql_where=sa.text("es_producto_extra = false"),
    )

    # ──────────────────────────────────────────────────────────────────
    # 5. logistica_alquiler  (depende de usuario)
    # ──────────────────────────────────────────────────────────────────
    op.create_table(
        "logistica_alquiler",
        sa.Column("id_logistica_alquiler",              sa.Integer(),      nullable=False, autoincrement=True),
        sa.Column("id_usuario_logistico",               sa.String(20),     nullable=False),
        sa.Column("tipo_movimiento",                    sa.String(10),     nullable=False),
        sa.Column("fecha_gasto",                        sa.TIMESTAMP(),    nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("descripcion_gasto_logistico",        sa.Text(),         nullable=True),
        sa.Column("valor_gasto_logistico",              sa.Numeric(10, 2), nullable=False, server_default=sa.text("0.00")),
        sa.Column("observaciones_logistica_alquiler",   sa.Text(),         nullable=True),
        sa.Column("estado_registro",                    sa.Boolean(),      nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion",                     sa.TIMESTAMP(),    nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("fecha_actualizacion",                sa.TIMESTAMP(),    nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id_logistica_alquiler"),
        sa.ForeignKeyConstraint(
            ["id_usuario_logistico"], ["usuario.id_usuario"],
            name="fk_logistica_usuario", onupdate="CASCADE", ondelete="RESTRICT",
        ),
        sa.CheckConstraint(
            "tipo_movimiento IN ('ENTREGA', 'RECOGIDA', 'GASTO')",
            name="chk_logistica_tipo_movimiento",
        ),
        sa.CheckConstraint(
            "valor_gasto_logistico >= 0",
            name="chk_logistica_valor_gasto",
        ),
    )
    op.create_index("idx_logistica_usuario", "logistica_alquiler", ["id_usuario_logistico"])

    # ──────────────────────────────────────────────────────────────────
    # 6. logistica_alquiler_alquiler  (tabla puente — depende de las dos anteriores)
    # ──────────────────────────────────────────────────────────────────
    op.create_table(
        "logistica_alquiler_alquiler",
        sa.Column("id_logistica_alquiler", sa.Integer(), nullable=False),
        sa.Column("id_alquiler",           sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id_logistica_alquiler", "id_alquiler"),
        sa.ForeignKeyConstraint(
            ["id_logistica_alquiler"], ["logistica_alquiler.id_logistica_alquiler"],
            onupdate="CASCADE", ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_alquiler"], ["alquiler.id_alquiler"],
            onupdate="CASCADE", ondelete="RESTRICT",
        ),
    )
    op.create_index("idx_logalq_alquiler", "logistica_alquiler_alquiler", ["id_alquiler"])

    # ──────────────────────────────────────────────────────────────────
    # 7. auditoria_sistema  (tabla de solo lectura para el backend;
    #    la pueblan los triggers de la BD, no el ORM)
    # ──────────────────────────────────────────────────────────────────
    op.create_table(
        "auditoria_sistema",
        sa.Column("id_auditoria",          sa.Integer(),   nullable=False, autoincrement=True),
        sa.Column("nombre_tabla",          sa.String(50),  nullable=False),
        sa.Column("tipo_operacion",        sa.String(10),  nullable=False),
        sa.Column("id_registro_afectado",  sa.String(50),  nullable=False),
        sa.Column("datos_anteriores",      postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("datos_nuevos",          postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("id_usuario_accion",     sa.String(20),  nullable=True),
        sa.Column("fecha_accion",          sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id_auditoria"),
        sa.CheckConstraint(
            "tipo_operacion IN ('INSERT', 'UPDATE', 'DELETE')",
            name="chk_auditoria_operacion",
        ),
    )
    op.create_index("idx_auditoria_tabla_registro", "auditoria_sistema", ["nombre_tabla", "id_registro_afectado"])
    op.create_index(
        "idx_auditoria_usuario", "auditoria_sistema", ["id_usuario_accion"],
        postgresql_where=sa.text("id_usuario_accion IS NOT NULL"),
    )
    op.create_index("idx_auditoria_fecha", "auditoria_sistema", ["fecha_accion"])


def downgrade() -> None:
    """Elimina todo el esquema en orden inverso (respetando FKs)."""
    # Primero las tablas con dependencias, luego las raíz
    op.drop_table("auditoria_sistema")
    op.drop_table("logistica_alquiler_alquiler")
    op.drop_table("logistica_alquiler")
    op.drop_table("detalle_alquiler")
    op.drop_table("alquiler")
    op.drop_table("producto")
    op.drop_table("usuario")
