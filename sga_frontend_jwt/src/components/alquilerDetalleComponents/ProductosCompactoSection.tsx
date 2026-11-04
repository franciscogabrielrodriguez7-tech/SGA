import type { DetalleAlquilerLinea } from "../../interfaces/Alquiler";

// ============================================================================
// ProductosCompactoSection — tarjeta lateral de alta densidad con el resumen
// de productos activos del alquiler. Vive en el sidebar sticky del detalle.
// Disparador de modal para ver/gestionar la tabla completa (con AgregarProducto).
// ============================================================================

interface ProductosCompactoSectionProps {
  detallesLinea: DetalleAlquilerLinea[];
  puedeGestionar: boolean;
  onAbrirDetalleCompleto: () => void;
}

export function ProductosCompactoSection({
  detallesLinea,
  puedeGestionar,
  onAbrirDetalleCompleto,
}: ProductosCompactoSectionProps) {
  const activos = detallesLinea.filter((d) => d.estado_registro);
  const totalUnidades = activos.reduce((s, d) => s + d.cantidad_productos, 0);
  const totalPrecio = activos.reduce((s, d) => s + d.precio_conjunto, 0);

  return (
    <div className="card stack gap-0">
      {/* Encabezado del bloque */}
      <div className="hstack justify-between" style={{ marginBottom: "var(--space-3)" }}>
        <p className="data-group-title" style={{ margin: 0 }}>
          📦 Productos alquilados
        </p>
        <span className="badge badge-gray" style={{ fontSize: 11 }}>
          {activos.length} ítem{activos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Lista compacta de ítems activos */}
      {activos.length === 0 ? (
        <p className="text-sm text-muted">Sin productos activos.</p>
      ) : (
        <div className="productos-compacto-lista">
          {activos.map((d) => (
            <div key={d.id_detalle_alquiler} className="producto-compacto-item">
              <div className="stack gap-0" style={{ flex: 1, minWidth: 0 }}>
                <span className="producto-compacto-nombre">{d.nombre_producto}</span>
                {d.es_producto_extra && (
                  <span style={{ fontSize: 10, color: "var(--color-warning)", fontWeight: 600 }}>
                    EXTRA
                  </span>
                )}
              </div>
              <div className="hstack gap-2" style={{ flexShrink: 0 }}>
                <span className="producto-compacto-badge">×{d.cantidad_productos}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-fg-muted)" }}>
                  ${d.precio_conjunto.toLocaleString("es-CO")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumen de totales */}
      {activos.length > 0 && (
        <div
          className="hstack justify-between"
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: "var(--space-2)",
            marginTop: "var(--space-2)",
          }}
        >
          <span className="data-label">{totalUnidades} unidad{totalUnidades !== 1 ? "es" : ""}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-brand-fg)" }}>
            ${totalPrecio.toLocaleString("es-CO")}
          </span>
        </div>
      )}

      {/* Acciones */}
      <div className="productos-compacto-footer">
        <button
          type="button"
          className="btn btn-outline"
          style={{ width: "100%", fontSize: 13 }}
          onClick={onAbrirDetalleCompleto}
        >
          {puedeGestionar ? "🔍 Ver tabla · Agregar producto" : "🔍 Ver tabla completa"}
        </button>
      </div>
    </div>
  );
}
