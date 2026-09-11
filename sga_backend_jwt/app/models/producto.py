from sqlalchemy import Column, Integer, String, Numeric, Boolean, TIMESTAMP, CheckConstraint, text

from app.config.database import Base


class Producto(Base):

    __tablename__ = "producto"

    id_producto = Column(Integer, primary_key=True)

    nombre_producto = Column(String(100), nullable=False)

    descripcion_producto = Column(String(300), nullable=True)

    precio_base_producto = Column(Numeric(10, 2), nullable=False)

    stock_total = Column(Integer, nullable=False)

    # stock_alquilado NUNCA se modifica manualmente desde el backend:
    # lo mantienen sincronizado los triggers de detalle_alquiler
    # (fn_sincronizar_stock_producto). El backend solo lo lee.
    stock_alquilado = Column(Integer, nullable=False, server_default="0")

    # Unidad mínima con la que puede alquilarse el producto. Ver
    # chk_producto_unidad_minima_alquiler en 01_tablas.sql y
    # app/utils/unidades.py para la jerarquía DIA < SEMANA < MES.
    # precio_base_producto se interpreta siempre "por" esta unidad.
    unidad_minima_alquiler = Column(
        String(10),
        nullable=False,
        server_default="DIA",
    )

    estado_registro = Column(Boolean, nullable=False, server_default="true")

    fecha_creacion = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    fecha_actualizacion = Column(
        TIMESTAMP, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )

    __table_args__ = (
        CheckConstraint(
            "unidad_minima_alquiler IN ('DIA', 'SEMANA', 'MES')",
            name="chk_producto_unidad_minima_alquiler",
        ),
    )

