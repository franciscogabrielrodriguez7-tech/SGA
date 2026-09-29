"""baseline_schema

Revision ID: d4f74f3d4896
Revises: 
Create Date: 2026-09-15 19:07:20.676535

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd4f74f3d4896'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    Este archivo es un baseline generado sobre una BD local ya existente.
    Al ejecutarse sobre una BD limpia (staging/producción) las tablas y los
    índices enumerados abajo no existen todavía, por lo que cada operación
    DROP se hace condicional para evitar errores en el primer despliegue.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tablas_existentes = set(inspector.get_table_names())

    # ── auditoria_sistema ───────────────────────────────────────────────
    if 'auditoria_sistema' in tablas_existentes:
        indices_auditoria = {
            idx['name'] for idx in inspector.get_indexes('auditoria_sistema')
        }
        if 'idx_auditoria_fecha' in indices_auditoria:
            op.drop_index(op.f('idx_auditoria_fecha'), table_name='auditoria_sistema')
        if 'idx_auditoria_tabla_registro' in indices_auditoria:
            op.drop_index(op.f('idx_auditoria_tabla_registro'), table_name='auditoria_sistema')
        if 'idx_auditoria_usuario' in indices_auditoria:
            op.drop_index(
                op.f('idx_auditoria_usuario'),
                table_name='auditoria_sistema',
                postgresql_where='(id_usuario_accion IS NOT NULL)',
            )
        op.drop_table('auditoria_sistema')

    # ── alquiler ────────────────────────────────────────────────────────
    if 'alquiler' in tablas_existentes:
        indices_alquiler = {
            idx['name'] for idx in inspector.get_indexes('alquiler')
        }
        if 'idx_alquiler_cliente' in indices_alquiler:
            op.drop_index(op.f('idx_alquiler_cliente'), table_name='alquiler')
        if 'idx_alquiler_creador' in indices_alquiler:
            op.drop_index(op.f('idx_alquiler_creador'), table_name='alquiler')
        if 'idx_alquiler_estado' in indices_alquiler:
            op.drop_index(
                op.f('idx_alquiler_estado'),
                table_name='alquiler',
                postgresql_where='(estado_registro IS TRUE)',
            )
        if 'idx_alquiler_fecha_inicio' in indices_alquiler:
            op.drop_index(op.f('idx_alquiler_fecha_inicio'), table_name='alquiler')

        constraints_alquiler = {
            c['name'] for c in inspector.get_foreign_keys('alquiler')
        }
        if 'fk_alquiler_usuario_creador' in constraints_alquiler:
            op.drop_constraint(op.f('fk_alquiler_usuario_creador'), 'alquiler', type_='foreignkey')
        if 'fk_alquiler_usuario_cliente' in constraints_alquiler:
            op.drop_constraint(op.f('fk_alquiler_usuario_cliente'), 'alquiler', type_='foreignkey')
        op.create_foreign_key(None, 'alquiler', 'usuario', ['id_usuario_creador'], ['id_usuario'])
        op.create_foreign_key(None, 'alquiler', 'usuario', ['id_usuario_cliente'], ['id_usuario'])

        checks_alquiler = {
            c['name'] for c in inspector.get_check_constraints('alquiler')
        }
        for nombre in ('chk_alquiler_deposito', 'chk_alquiler_estado',
                       'chk_alquiler_precio', 'chk_alquiler_tiempo_dias'):
            if nombre in checks_alquiler:
                op.drop_constraint(op.f(nombre), 'alquiler', type_='check')

    # ── detalle_alquiler ────────────────────────────────────────────────
    if 'detalle_alquiler' in tablas_existentes:
        indices_detalle = {
            idx['name'] for idx in inspector.get_indexes('detalle_alquiler')
        }
        if 'idx_detalle_alquiler_id' in indices_detalle:
            op.drop_index(op.f('idx_detalle_alquiler_id'), table_name='detalle_alquiler')
        if 'idx_detalle_producto_id' in indices_detalle:
            op.drop_index(op.f('idx_detalle_producto_id'), table_name='detalle_alquiler')
        if 'idx_unico_producto_alquiler' in indices_detalle:
            op.drop_index(
                op.f('idx_unico_producto_alquiler'),
                table_name='detalle_alquiler',
                postgresql_where='(es_producto_extra = false)',
            )

        fks_detalle = {
            c['name'] for c in inspector.get_foreign_keys('detalle_alquiler')
        }
        if 'fk_detalle_alquiler_alquiler' in fks_detalle:
            op.drop_constraint(op.f('fk_detalle_alquiler_alquiler'), 'detalle_alquiler', type_='foreignkey')
        if 'fk_detalle_alquiler_producto' in fks_detalle:
            op.drop_constraint(op.f('fk_detalle_alquiler_producto'), 'detalle_alquiler', type_='foreignkey')
        op.create_foreign_key(None, 'detalle_alquiler', 'producto', ['id_producto'], ['id_producto'])
        op.create_foreign_key(None, 'detalle_alquiler', 'alquiler', ['id_alquiler'], ['id_alquiler'])

        checks_detalle = {
            c['name'] for c in inspector.get_check_constraints('detalle_alquiler')
        }
        for nombre in ('chk_detalle_cantidad', 'chk_detalle_precio_conjunto'):
            if nombre in checks_detalle:
                op.drop_constraint(op.f(nombre), 'detalle_alquiler', type_='check')

    # ── logistica_alquiler ──────────────────────────────────────────────
    if 'logistica_alquiler' in tablas_existentes:
        indices_log = {
            idx['name'] for idx in inspector.get_indexes('logistica_alquiler')
        }
        if 'idx_logistica_usuario' in indices_log:
            op.drop_index(op.f('idx_logistica_usuario'), table_name='logistica_alquiler')

        fks_log = {
            c['name'] for c in inspector.get_foreign_keys('logistica_alquiler')
        }
        if 'fk_logistica_usuario' in fks_log:
            op.drop_constraint(op.f('fk_logistica_usuario'), 'logistica_alquiler', type_='foreignkey')
        op.create_foreign_key(None, 'logistica_alquiler', 'usuario', ['id_usuario_logistico'], ['id_usuario'])

        checks_log = {
            c['name'] for c in inspector.get_check_constraints('logistica_alquiler')
        }
        if 'chk_logistica_valor_gasto' in checks_log:
            op.drop_constraint(op.f('chk_logistica_valor_gasto'), 'logistica_alquiler', type_='check')

    # ── logistica_alquiler_alquiler ─────────────────────────────────────
    if 'logistica_alquiler_alquiler' in tablas_existentes:
        indices_laa = {
            idx['name'] for idx in inspector.get_indexes('logistica_alquiler_alquiler')
        }
        if 'idx_logalq_alquiler' in indices_laa:
            op.drop_index(op.f('idx_logalq_alquiler'), table_name='logistica_alquiler_alquiler')

    # ── producto ────────────────────────────────────────────────────────
    if 'producto' in tablas_existentes:
        indices_prod = {
            idx['name'] for idx in inspector.get_indexes('producto')
        }
        if 'idx_producto_nombre' in indices_prod:
            op.drop_index(
                op.f('idx_producto_nombre'),
                table_name='producto',
                postgresql_where='(estado_registro IS TRUE)',
            )

        checks_prod = {
            c['name'] for c in inspector.get_check_constraints('producto')
        }
        for nombre in ('chk_producto_precio', 'chk_producto_stock_alquilado',
                       'chk_producto_stock_total'):
            if nombre in checks_prod:
                op.drop_constraint(op.f(nombre), 'producto', type_='check')

    # ── usuario ─────────────────────────────────────────────────────────
    if 'usuario' in tablas_existentes:
        indices_usr = {
            idx['name'] for idx in inspector.get_indexes('usuario')
        }
        if 'idx_usuario_email' in indices_usr:
            op.drop_index(
                op.f('idx_usuario_email'),
                table_name='usuario',
                postgresql_where='(email_usuario IS NOT NULL)',
            )
        if 'idx_usuario_rol' in indices_usr:
            op.drop_index(
                op.f('idx_usuario_rol'),
                table_name='usuario',
                postgresql_where='(estado_registro IS TRUE)',
            )

        checks_usr = {
            c['name'] for c in inspector.get_check_constraints('usuario')
        }
        for nombre in ('chk_usuario_rol', 'chk_usuario_tipo_documento'):
            if nombre in checks_usr:
                op.drop_constraint(op.f(nombre), 'usuario', type_='check')



def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_check_constraint(op.f('chk_usuario_tipo_documento'), 'usuario', "tipo_documento::text = ANY (ARRAY['CC'::character varying, 'CE'::character varying, 'NIT'::character varying, 'PPT'::character varying]::text[])")
    op.create_check_constraint(op.f('chk_usuario_rol'), 'usuario', "rol_usuario::text = ANY (ARRAY['admin'::character varying, 'encargado_facturacion'::character varying, 'encargado_logistico'::character varying, 'cliente'::character varying]::text[])")
    op.create_index(op.f('idx_usuario_rol'), 'usuario', ['rol_usuario'], unique=False, postgresql_where='(estado_registro IS TRUE)')
    op.create_index(op.f('idx_usuario_email'), 'usuario', ['email_usuario'], unique=False, postgresql_where='(email_usuario IS NOT NULL)')
    op.create_check_constraint(op.f('chk_producto_stock_total'), 'producto', 'stock_total >= 0')
    op.create_check_constraint(op.f('chk_producto_stock_alquilado'), 'producto', 'stock_alquilado >= 0 AND stock_alquilado <= stock_total')
    op.create_check_constraint(op.f('chk_producto_precio'), 'producto', 'precio_base_producto >= 0::numeric')
    op.create_index(op.f('idx_producto_nombre'), 'producto', ['nombre_producto'], unique=False, postgresql_where='(estado_registro IS TRUE)')
    op.create_index(op.f('idx_logalq_alquiler'), 'logistica_alquiler_alquiler', ['id_alquiler'], unique=False)
    op.create_check_constraint(op.f('chk_logistica_valor_gasto'), 'logistica_alquiler', 'valor_gasto_logistico >= 0::numeric')
    op.drop_constraint(None, 'logistica_alquiler', type_='foreignkey')
    op.create_foreign_key(op.f('fk_logistica_usuario'), 'logistica_alquiler', 'usuario', ['id_usuario_logistico'], ['id_usuario'], onupdate='CASCADE', ondelete='RESTRICT')
    op.create_index(op.f('idx_logistica_usuario'), 'logistica_alquiler', ['id_usuario_logistico'], unique=False)
    op.create_check_constraint(op.f('chk_detalle_precio_conjunto'), 'detalle_alquiler', 'precio_conjunto >= 0::numeric')
    op.create_check_constraint(op.f('chk_detalle_cantidad'), 'detalle_alquiler', 'cantidad_productos > 0')
    op.drop_constraint(None, 'detalle_alquiler', type_='foreignkey')
    op.drop_constraint(None, 'detalle_alquiler', type_='foreignkey')
    op.create_foreign_key(op.f('fk_detalle_alquiler_producto'), 'detalle_alquiler', 'producto', ['id_producto'], ['id_producto'], onupdate='CASCADE', ondelete='RESTRICT')
    op.create_foreign_key(op.f('fk_detalle_alquiler_alquiler'), 'detalle_alquiler', 'alquiler', ['id_alquiler'], ['id_alquiler'], onupdate='CASCADE', ondelete='RESTRICT')
    op.create_index(op.f('idx_unico_producto_alquiler'), 'detalle_alquiler', ['id_alquiler', 'id_producto'], unique=True, postgresql_where='(es_producto_extra = false)')
    op.create_index(op.f('idx_detalle_producto_id'), 'detalle_alquiler', ['id_producto'], unique=False)
    op.create_index(op.f('idx_detalle_alquiler_id'), 'detalle_alquiler', ['id_alquiler'], unique=False)
    op.create_check_constraint(op.f('chk_alquiler_tiempo_dias'), 'alquiler', 'tiempo_alquiler_dias > 0')
    op.create_check_constraint(op.f('chk_alquiler_precio'), 'alquiler', 'precio_alquiler >= 0::numeric')
    op.create_check_constraint(op.f('chk_alquiler_estado'), 'alquiler', "estado_alquiler::text = ANY (ARRAY['pendiente'::character varying, 'activo'::character varying, 'vencido'::character varying, 'recogido'::character varying, 'terminado'::character varying, 'cancelado'::character varying]::text[])")
    op.create_check_constraint(op.f('chk_alquiler_deposito'), 'alquiler', 'deposito >= 0::numeric')
    op.drop_constraint(None, 'alquiler', type_='foreignkey')
    op.drop_constraint(None, 'alquiler', type_='foreignkey')
    op.create_foreign_key(op.f('fk_alquiler_usuario_cliente'), 'alquiler', 'usuario', ['id_usuario_cliente'], ['id_usuario'], onupdate='CASCADE', ondelete='RESTRICT')
    op.create_foreign_key(op.f('fk_alquiler_usuario_creador'), 'alquiler', 'usuario', ['id_usuario_creador'], ['id_usuario'], onupdate='CASCADE', ondelete='RESTRICT')
    op.create_index(op.f('idx_alquiler_fecha_inicio'), 'alquiler', ['fecha_inicio'], unique=False)
    op.create_index(op.f('idx_alquiler_estado'), 'alquiler', ['estado_alquiler'], unique=False, postgresql_where='(estado_registro IS TRUE)')
    op.create_index(op.f('idx_alquiler_creador'), 'alquiler', ['id_usuario_creador'], unique=False)
    op.create_index(op.f('idx_alquiler_cliente'), 'alquiler', ['id_usuario_cliente'], unique=False)
    op.create_table('auditoria_sistema',
    sa.Column('id_auditoria', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('nombre_tabla', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
    sa.Column('tipo_operacion', sa.VARCHAR(length=10), autoincrement=False, nullable=False),
    sa.Column('id_registro_afectado', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
    sa.Column('datos_anteriores', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
    sa.Column('datos_nuevos', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
    sa.Column('id_usuario_accion', sa.VARCHAR(length=20), autoincrement=False, nullable=True),
    sa.Column('fecha_accion', postgresql.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), autoincrement=False, nullable=False),
    sa.CheckConstraint("tipo_operacion::text = ANY (ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying]::text[])", name=op.f('chk_auditoria_operacion')),
    sa.PrimaryKeyConstraint('id_auditoria', name=op.f('auditoria_sistema_pkey'))
    )
    op.create_index(op.f('idx_auditoria_usuario'), 'auditoria_sistema', ['id_usuario_accion'], unique=False, postgresql_where='(id_usuario_accion IS NOT NULL)')
    op.create_index(op.f('idx_auditoria_tabla_registro'), 'auditoria_sistema', ['nombre_tabla', 'id_registro_afectado'], unique=False)
    op.create_index(op.f('idx_auditoria_fecha'), 'auditoria_sistema', ['fecha_accion'], unique=False)
    # ### end Alembic commands ###
