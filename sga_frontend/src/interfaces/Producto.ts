// Debe coincidir EXACTAMENTE con app/controllers/producto_controller.py
// del backend (nombres de columna reales, no los "amigables" que traía
// el esqueleto original en src/interfaces/Producto.ts: id/nombre/precioBase/stock).

export interface Producto {
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  precio_base_producto: number;
  stock_total: number;
  stock_alquilado: number;
  stock_disponible: number;
  estado_registro: boolean;
}

export interface ProductoCreatePayload {
  nombre_producto: string;
  descripcion_producto: string;
  precio_base_producto: number;
  stock_total: number;
}
