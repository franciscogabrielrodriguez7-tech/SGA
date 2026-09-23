import type { EstadoAlquiler } from "../../interfaces/Alquiler";
import { ESTADOS_ALQUILER } from "../../interfaces/Alquiler";

interface CambiarEstadoSectionProps {
  nuevoEstado: EstadoAlquiler | "";
  setNuevoEstado: (estado: EstadoAlquiler | "") => void;
  manejarCambioEstado: () => void;
  puedeGestionarFacturacion: boolean;
  manejarCancelar: () => void;
}

export function CambiarEstadoSection({
  nuevoEstado,
  setNuevoEstado,
  manejarCambioEstado,
  puedeGestionarFacturacion,
  manejarCancelar
}: CambiarEstadoSectionProps) {
  return (
    <div className="card">
      <h2 className="heading-md" style={{ marginBottom: 16 }}>
        Cambiar estado
      </h2>

      <div className="hstack gap-3 flex-wrap">
        <select
          className="input"
          style={{ width: "auto" }}
          value={nuevoEstado}
          onChange={(e) => setNuevoEstado(e.target.value as EstadoAlquiler)}
        >
          <option value="">Selecciona un estado</option>
          {ESTADOS_ALQUILER.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn-primary"
          onClick={manejarCambioEstado}
          disabled={!nuevoEstado}
        >
          Aplicar
        </button>

        {puedeGestionarFacturacion && (
          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={manejarCancelar}
            style={{ marginLeft: "auto" }}
          >
            Cancelar alquiler
          </button>
        )}
      </div>

      <p className="text-sm text-muted" style={{ marginTop: 8 }}>
        El backend valida la secuencia oficial (pendiente → activo → vencido → recogido →
        terminado, con cancelado como alternativa) y rechaza transiciones inválidas.
      </p>
    </div>
  );
}
