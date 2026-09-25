import { InputMoneda } from "../../components/inputs/InputMoneda";
import type { UnidadMinimaAlquiler } from "../../interfaces/Producto";

interface CrearProductoSectionProps {
  nombre: string;
  setNombre: (v: string) => void;
  descripcion: string;
  setDescripcion: (v: string) => void;
  precioBase: number;
  setPrecioBase: (v: number) => void;
  precioExtra: number | null;
  setPrecioExtra: (v: number | null) => void;
  unidadMinima: UnidadMinimaAlquiler;
  setUnidadMinima: (v: UnidadMinimaAlquiler) => void;
  stockTotal: number;
  setStockTotal: (v: number) => void;
  creando: boolean;
  manejarCrear: () => void;
}

export function CrearProductoSection({
  nombre, setNombre,
  descripcion, setDescripcion,
  precioBase, setPrecioBase,
  precioExtra, setPrecioExtra,
  unidadMinima, setUnidadMinima,
  stockTotal, setStockTotal,
  creando,
  manejarCrear
}: CrearProductoSectionProps) {
  return (
    <div className="card">
      <h2 className="heading-md" style={{ marginBottom: 16 }}>
        Nuevo producto
      </h2>

      <div className="grid grid-cols-1 grid-cols-2-md" style={{ marginBottom: 16 }}>
        <div>
          <label className="field-label">Nombre</label>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div>
          <label className="field-label">Descripción</label>
          <input className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>

        <div>
          <label className="field-label">Precio base</label>
          <InputMoneda value={precioBase} onChange={setPrecioBase} />
        </div>

        <div>
          <label className="field-label">Precio extra</label>
          <InputMoneda
            value={precioExtra ?? precioBase}
            onChange={setPrecioExtra}
          />
          <p className="text-sm text-muted" style={{ marginTop: 4 }}>
            Precio al añadir como extra.
          </p>
        </div>

        <div>
          <label className="field-label">Unidad mínima de alquiler</label>
          <select
            className="input"
            value={unidadMinima}
            onChange={(e) => setUnidadMinima(e.target.value as UnidadMinimaAlquiler)}
          >
            <option value="DIA">Día (precio base es por día)</option>
            <option value="SEMANA">Semana (precio base es por semana)</option>
            <option value="MES">Mes (precio base es por mes)</option>
          </select>
        </div>

        <div>
          <label className="field-label">Stock total</label>
          <input
            className="input"
            type="number"
            min={1}
            value={stockTotal}
            onChange={(e) => setStockTotal(Number(e.target.value))}
          />
        </div>
      </div>

      <button type="button" className="btn btn-primary" disabled={creando} onClick={manejarCrear}>
        {creando ? "Creando..." : "Crear producto"}
      </button>
    </div>
  );
}
