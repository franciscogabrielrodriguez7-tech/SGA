import type { MovimientoLogistico } from "../../interfaces/Logistica";

interface LogisticaSectionProps {
  entregas: MovimientoLogistico[];
  recogidas: MovimientoLogistico[];
  observacionesEntrega: string;
  setObservacionesEntrega: (v: string) => void;
  manejarRegistrarEntrega: () => void;
  observacionesRecogida: string;
  setObservacionesRecogida: (v: string) => void;
  manejarRegistrarRecogida: () => void;
}

export function LogisticaSection({
  entregas, recogidas,
  observacionesEntrega, setObservacionesEntrega, manejarRegistrarEntrega,
  observacionesRecogida, setObservacionesRecogida, manejarRegistrarRecogida
}: LogisticaSectionProps) {
  return (
    <div className="stack gap-8">
      {/* Entregas */}
      <div className="card">
        <h2 className="heading-md" style={{ marginBottom: 16 }}>
          Entregas
        </h2>

        <div className="stack gap-2" style={{ marginBottom: 16 }}>
          {entregas.length === 0 && (
            <p className="text-muted text-sm">Aún no hay entregas registradas.</p>
          )}
          {entregas.map((e) => (
            <div key={e.id_logistica_alquiler} className="card text-sm">
              <p>
                {e.fecha_gasto} — {e.nombres_logistico}
              </p>
              {e.observaciones_logistica_alquiler && (
                <p className="text-muted">{e.observaciones_logistica_alquiler}</p>
              )}
            </div>
          ))}
        </div>

        <div className="stack gap-2">
          <input
            className="input"
            placeholder="Observaciones de la entrega (opcional)"
            value={observacionesEntrega}
            onChange={(e) => setObservacionesEntrega(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ alignSelf: "flex-start" }}
            onClick={manejarRegistrarEntrega}
          >
            Registrar entrega
          </button>
        </div>
      </div>

      {/* Recogidas */}
      <div className="card">
        <h2 className="heading-md" style={{ marginBottom: 16 }}>
          Recogidas
        </h2>

        <div className="stack gap-2" style={{ marginBottom: 16 }}>
          {recogidas.length === 0 && (
            <p className="text-muted text-sm">Aún no hay recogidas registradas.</p>
          )}
          {recogidas.map((r) => (
            <div key={r.id_logistica_alquiler} className="card text-sm">
              <p>
                {r.fecha_gasto} — {r.nombres_logistico}
              </p>
              {r.observaciones_logistica_alquiler && (
                <p className="text-muted">{r.observaciones_logistica_alquiler}</p>
              )}
            </div>
          ))}
        </div>

        <div className="stack gap-2">
          <input
            className="input"
            placeholder="Observaciones de la recogida (opcional)"
            value={observacionesRecogida}
            onChange={(e) => setObservacionesRecogida(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ alignSelf: "flex-start" }}
            onClick={manejarRegistrarRecogida}
          >
            Registrar recogida
          </button>
        </div>

        <p className="text-sm text-muted" style={{ marginTop: 8 }}>
          RN-LOG-04: no se permite registrar una recogida sin una entrega previa.
        </p>
      </div>
    </div>
  );
}
