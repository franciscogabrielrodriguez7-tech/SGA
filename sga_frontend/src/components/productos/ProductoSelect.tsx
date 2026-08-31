import type { Producto } from "../../interfaces/Producto";

interface ProductoSelectProps {
  productos: Producto[];
  value: number | null;
  onProductoChange: (idProducto: number) => void;
}

// AJUSTADO: usaba producto.id / producto.nombre (interfaz local inventada).
// Ahora usa id_producto / nombre_producto, los nombres reales que devuelve
// GET /api/sga/productos. También se agregó "value" (controlado) y se
// muestra el stock disponible en cada opción, para que el usuario no
// intente seleccionar más cantidad de la que hay.
export function ProductoSelect({
  productos,
  value,
  onProductoChange,
}: ProductoSelectProps) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onProductoChange(Number(e.target.value))}
    >
      <option value="">Selecciona un producto</option>

      {productos.map((producto) => (
        <option key={producto.id_producto} value={producto.id_producto}>
          {producto.nombre_producto} (disponibles: {producto.stock_disponible})
        </option>
      ))}
    </select>
  );
}
