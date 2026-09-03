import type { Producto } from "../../interfaces/Producto";

interface ProductoSelectProps {
  productos: Producto[];
  value: number | null;
  onProductoChange: (idProducto: number) => void;
}

// AJUSTADO: usaba producto.id / producto.nombre (interfaz local inventada).
// Ahora usa id_producto / nombre_producto, los nombres reales que devuelve
// GET /api/sga/productos, y renderiza como <select> nativo con la clase
// .input (en vez de un componente de Chakra).
export function ProductoSelect({
  productos,
  value,
  onProductoChange,
}: ProductoSelectProps) {
  return (
    <select
      className="input"
      value={value ?? ""}
      onChange={(e) => onProductoChange(Number(e.target.value))}
    >

      {productos.map((producto) => (
        <option key={producto.id_producto} value={producto.id_producto}>
          {producto.nombre_producto} (disponibles: {producto.stock_disponible})
        </option>
      ))}
    </select>
  );
}
