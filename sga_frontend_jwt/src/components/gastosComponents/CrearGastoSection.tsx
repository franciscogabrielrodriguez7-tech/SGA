import { InputMoneda } from "../../components/inputs/InputMoneda";
import type { Alquiler } from "../../interfaces/Alquiler";

interface CrearGastoSectionProps {
  busquedaAlquiler: string;
  setBusquedaAlquiler: (v: string) => void;
  alquileresFiltrados: Alquiler[];
  idsAlquilerSeleccionados: number[];
  alternarAlquiler: (id: number) => void;
  valor: number;
  setValor: (v: number) => void;
  descripcion: string;
  setDescripcion: (v: string) => void;
  esRecogida: boolean;
  setEsRecogida: (v: boolean) => void;
  creando: boolean;
  manejarCrear: () => void;
}

export function CrearGastoSection({
  busquedaAlquiler, setBusquedaAlquiler,
  alquileresFiltrados, idsAlquilerSeleccionados, alternarAlquiler,
  valor, setValor, descripcion, setDescripcion,
  esRecogida, setEsRecogida,
  creando, manejarCrear
}: CrearGastoSectionProps) {
  return (
    <div className="card">
      <h2 className="heading-md" style={{ marginBottom: 8 }}>
        Registrar gasto
      </h2>

      <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
        logistica_alquiler no distingue "gasto puro" de entrega/recogida: hay que indicar a
        cuál de las dos se asocia (según el backend). Puedes seleccionar varios alquileres si
        el mismo gasto (ej. un viaje) los cubre a todos.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label className="field-label">Alquileres asociados a este gasto</label>
        <input
          className="input"
          placeholder="Buscar por # de alquiler o cliente..."
          value={busquedaAlquiler}
          onChange={(e) => setBusquedaAlquiler(e.target.value)}
          style={{ marginBottom: 8 }}
        />

        <div
          className="stack gap-1"
          style={{
            maxHeight: 180,
            overflowY: "auto",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: 8,
          }}
        >
          {alquileresFiltrados.map((a) => (
            <label key={a.id_alquiler} className="checkbox-row">
              <input
                type="checkbox"
                checked={idsAlquilerSeleccionados.includes(a.id_alquiler)}
                onChange={() => alternarAlquiler(a.id_alquiler)}
              />
              #{a.id_alquiler} — {a.nombres_cliente} {a.apellidos_cliente} (
              {a.estado_alquiler})
            </label>
          ))}

          {alquileresFiltrados.length === 0 && (
            <p className="text-sm text-muted">Sin resultados.</p>
          )}
        </div>

        {idsAlquilerSeleccionados.length > 0 && (
          <p className="text-sm text-muted" style={{ marginTop: 4 }}>
            Seleccionados: {idsAlquilerSeleccionados.map((id) => `#${id}`).join(", ")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 grid-cols-2-md" style={{ marginBottom: 16 }}>
        <div>
          <label className="field-label">Valor del gasto</label>
          <InputMoneda value={valor} onChange={setValor} />
        </div>

        <div>
          <label className="field-label">Descripción (opcional)</label>
          <input className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
      </div>

      <label className="checkbox-row" style={{ marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={esRecogida}
          onChange={(e) => setEsRecogida(e.target.checked)}
        />
        Asociado a una recogida (si no, se asocia a una entrega)
      </label>

      <div>
        <button type="button" className="btn btn-primary" disabled={creando} onClick={manejarCrear}>
          {creando ? "Registrando..." : "Registrar gasto"}
        </button>
      </div>
    </div>
  );
}
