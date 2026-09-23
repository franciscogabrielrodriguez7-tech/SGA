import type { DetalleAlquilerLinea } from "../../interfaces/Alquiler";

interface DetalleProductosSectionProps {
  detallesLinea: DetalleAlquilerLinea[];
}

export function DetalleProductosSection({ detallesLinea }: DetalleProductosSectionProps) {
  return (
    <div>
      <h2 className="heading-md" style={{ marginBottom: 12 }}>
        Productos
      </h2>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio conjunto</th>
              <th>Extra</th>
            </tr>
          </thead>
          <tbody>
            {detallesLinea.map((d) => (
              <tr key={d.id_detalle_alquiler}>
                <td>{d.nombre_producto}</td>
                <td>{d.cantidad_productos}</td>
                <td>${d.precio_conjunto.toLocaleString("es-CO")}</td>
                <td>
                  {d.es_producto_extra
                    ? `Sí ($${d.precio_base_extra.toLocaleString("es-CO")} c/u)`
                    : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
