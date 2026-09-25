import type { Producto } from "../../interfaces/Producto";

interface ListaProductosMobileProps {
  productos: Producto[];
  cargando: boolean;
  puedeGestionar: boolean;
  abrirModalEdicion: (p: Producto) => void;
}

export function ListaProductosMobile({
  productos,
  cargando,
  puedeGestionar,
  abrirModalEdicion
}: ListaProductosMobileProps) {
  return (
    <div className="show-mobile-cards">
      {productos.map((p) => {
        const opaco = !p.estado_registro;
        const sinStock = p.stock_disponible === 0;

        return (
          <div
            key={p.id_producto}
            onClick={() => abrirModalEdicion(p)}
            className="list-card"
            style={{
              cursor: puedeGestionar ? "pointer" : "default",
              opacity: opaco ? 0.6 : 1,
            }}
          >
            <div className="list-card-header">
              <span className="list-card-title">{p.nombre_producto}</span>
              <span className={`badge ${p.estado_registro ? "" : "badge-gray"}`}>
                {p.estado_registro ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="stack gap-1">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-sm text-muted">Base: ${p.precio_base_producto.toLocaleString("es-CO")}</span>
                <span className="text-sm text-muted">Extra: ${p.precio_base_extra.toLocaleString("es-CO")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-sm text-muted">Und: {{ DIA: "Día", SEMANA: "Semana", MES: "Mes" }[p.unidad_minima_alquiler]}</span>
                <span className="text-sm">
                  Stock: <strong style={{ color: sinStock ? "var(--color-danger)" : "inherit" }}>{p.stock_disponible}</strong> / {p.stock_total}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      {!cargando && productos.length === 0 && (
        <p className="text-muted">No hay productos registrados.</p>
      )}
    </div>
  );
}
