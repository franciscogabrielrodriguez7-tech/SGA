import type { Producto } from "../../interfaces/Producto";

interface ListaProductosDesktopProps {
  productos: Producto[];
  cargando: boolean;
  puedeGestionar: boolean;
  abrirModalEdicion: (p: Producto) => void;
}

export function ListaProductosDesktop({
  productos,
  cargando,
  puedeGestionar,
  abrirModalEdicion
}: ListaProductosDesktopProps) {
  return (
    <div className="table-wrap hide-on-mobile">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Precio base</th>
            <th>Precio extra</th>
            <th>Unidad</th>
            <th>Alquilado / Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => {
            const opaco = !p.estado_registro;
            const sinStock = p.stock_disponible === 0;

            return (
              <tr 
                key={p.id_producto} 
                onClick={() => abrirModalEdicion(p)}
                style={{ 
                  cursor: puedeGestionar ? "pointer" : "default",
                  opacity: opaco ? 0.5 : 1,
                  transition: "opacity 0.2s"
                }}
                title={puedeGestionar ? "Haz clic para editar" : ""}
                className={puedeGestionar ? "row-hover" : ""}
              >
                <td>{p.id_producto}</td>
                <td className="text-bold">{p.nombre_producto}</td>
                <td>${p.precio_base_producto.toLocaleString("es-CO")}</td>
                <td>${p.precio_base_extra.toLocaleString("es-CO")}</td>
                <td><span className="badge">{{ DIA: "Día", SEMANA: "Semana", MES: "Mes" }[p.unidad_minima_alquiler]}</span></td>
                <td>
                  <span style={{ color: sinStock ? "var(--color-danger)" : "inherit", fontWeight: sinStock ? "bold" : "normal" }}>
                    {p.stock_disponible}
                  </span>
                  <span className="text-muted"> / {p.stock_total} disp.</span>
                </td>
                <td>
                  <span className={`badge ${p.estado_registro ? "" : "badge-gray"}`}>
                    {p.estado_registro ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!cargando && productos.length === 0 && (
        <p className="table-empty">No hay productos registrados.</p>
      )}
    </div>
  );
}
