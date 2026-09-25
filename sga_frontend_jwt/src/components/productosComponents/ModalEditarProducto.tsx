import { InputMoneda } from "../../components/inputs/InputMoneda";
import type { Producto, UnidadMinimaAlquiler } from "../../interfaces/Producto";

interface ModalEditarProductoProps {
  productoEditando: Producto | null;
  editNombre: string;
  setEditNombre: (v: string) => void;
  editDescripcion: string;
  setEditDescripcion: (v: string) => void;
  editPrecioBase: number;
  setEditPrecioBase: (v: number) => void;
  editPrecioExtra: number;
  setEditPrecioExtra: (v: number) => void;
  editUnidadMinima: UnidadMinimaAlquiler;
  setEditUnidadMinima: (v: UnidadMinimaAlquiler) => void;
  editStockTotal: number;
  setEditStockTotal: (v: number) => void;
  guardandoEdicion: boolean;
  cambiandoEstado: boolean;
  manejarCambiarEstado: () => void;
  manejarGuardarEdicion: () => void;
  cerrarModal: () => void;
}

export function ModalEditarProducto({
  productoEditando,
  editNombre, setEditNombre,
  editDescripcion, setEditDescripcion,
  editPrecioBase, setEditPrecioBase,
  editPrecioExtra, setEditPrecioExtra,
  editUnidadMinima, setEditUnidadMinima,
  editStockTotal, setEditStockTotal,
  guardandoEdicion, cambiandoEstado,
  manejarCambiarEstado, manejarGuardarEdicion, cerrarModal
}: ModalEditarProductoProps) {
  if (!productoEditando) return null;

  return (
    <div className="modal-overlay" onClick={cerrarModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="heading-lg">Editar: {productoEditando.nombre_producto}</h2>
          <button className="btn" onClick={cerrarModal} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        <div className="stack gap-4" style={{ marginBottom: 24 }}>
          
          <div className="grid grid-cols-1 grid-cols-2-md">
            <div>
              <label className="field-label">Nombre</label>
              <input className="input" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Descripción</label>
              <input className="input" value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 grid-cols-2-md">
            <div>
              <label className="field-label">Precio base</label>
              <InputMoneda value={editPrecioBase} onChange={setEditPrecioBase} />
            </div>
            <div>
              <label className="field-label">Precio extra</label>
              <InputMoneda value={editPrecioExtra} onChange={setEditPrecioExtra} />
            </div>
          </div>

          <div className="grid grid-cols-1 grid-cols-2-md">
            <div>
              <label className="field-label">Unidad mínima de alquiler</label>
              <select
                className="input"
                value={editUnidadMinima}
                onChange={(e) => setEditUnidadMinima(e.target.value as UnidadMinimaAlquiler)}
              >
                <option value="DIA">Día</option>
                <option value="SEMANA">Semana</option>
                <option value="MES">Mes</option>
              </select>
            </div>
            <div>
              <label className="field-label">Stock total</label>
              <input
                className="input"
                type="number"
                min={1}
                value={editStockTotal}
                onChange={(e) => setEditStockTotal(Number(e.target.value))}
              />
              <p className="text-sm text-muted" style={{ marginTop: 4 }}>
                Actualmente en alquiler: {productoEditando.stock_alquilado}
              </p>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={manejarCambiarEstado}
            disabled={cambiandoEstado || guardandoEdicion}
            style={{ color: productoEditando.estado_registro ? "var(--color-danger)" : "var(--color-primary)", borderColor: "currentColor" }}
          >
            {cambiandoEstado ? "Procesando..." : (productoEditando.estado_registro ? "Desactivar Producto" : "Activar Producto")}
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-outline" onClick={cerrarModal}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={manejarGuardarEdicion} disabled={guardandoEdicion || cambiandoEstado}>
              {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
