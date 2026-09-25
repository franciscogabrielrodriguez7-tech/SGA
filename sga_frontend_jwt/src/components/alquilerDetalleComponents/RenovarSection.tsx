import {
  OPCIONES_UNIDAD_TIEMPO,
  unidadMinimaPermiteUnidadTiempo,
  type UnidadTiempo,
} from "../../utils/tiempoUi";

interface RenovarSectionProps {
  cantidadRenovacion: number;
  setCantidadRenovacion: (v: number) => void;
  unidadRenovacion: UnidadTiempo;
  setUnidadRenovacion: (v: UnidadTiempo) => void;
  unidadMinimaRestrictivaRenovacion: "dias" | "semanas" | "meses";
  diasRenovacion: number;
  cargoRenovacionSugerido: number;
  precioTotalTrasRenovacionFinal: number;
  setPrecioTotalTrasRenovacion: (v: number | null) => void;
  manejarRenovar: () => void;
}

export function RenovarSection({
  cantidadRenovacion, setCantidadRenovacion,
  unidadRenovacion, setUnidadRenovacion,
  unidadMinimaRestrictivaRenovacion,
  diasRenovacion,
  cargoRenovacionSugerido,
  precioTotalTrasRenovacionFinal,
  setPrecioTotalTrasRenovacion,
  manejarRenovar
}: RenovarSectionProps) {
  return (
    <div className="card">
      <h2 className="heading-md" style={{ marginBottom: 16 }}>
        Renovar (RN-REN)
      </h2>

      <div className="hstack gap-2">
        <input
          className="input"
          style={{ maxWidth: 100 }}
          type="number"
          min={1}
          value={cantidadRenovacion}
          onChange={(e) => setCantidadRenovacion(Number(e.target.value))}
        />
        <select
          className="input"
          style={{ maxWidth: 130 }}
          value={unidadRenovacion}
          onChange={(e) => setUnidadRenovacion(e.target.value as UnidadTiempo)}
        >
          {OPCIONES_UNIDAD_TIEMPO.map((opcion) => {
            const deshabilitada = !unidadMinimaPermiteUnidadTiempo(
              ({ dias: "DIA", semanas: "SEMANA", meses: "MES" } as const)[
                unidadMinimaRestrictivaRenovacion
              ],
              opcion.valor,
            );

            return (
              <option key={opcion.valor} value={opcion.valor} disabled={deshabilitada}>
                {opcion.etiqueta}
                {deshabilitada ? " (no disponible)" : ""}
              </option>
            );
          })}
        </select>
      </div>

      <p className="text-sm text-muted" style={{ marginTop: 8 }}>
        Equivale a {diasRenovacion} día(s). Solo disponible cuando el alquiler está
        'activo' o 'vencido'.
      </p>

      {unidadMinimaRestrictivaRenovacion !== "dias" && (
        <p className="text-sm text-warning">
          Uno o más productos de este alquiler solo pueden renovarse por{" "}
          {unidadMinimaRestrictivaRenovacion === "semanas" ? "semana o mes" : "mes"}.
        </p>
      )}

      <div className="stack gap-2" style={{ marginTop: 12 }}>
        <div className="hstack justify-between text-sm">
          <span>Cargo de renovación (solo productos × tiempo, sin depósito ni transporte)</span>
          <span>${cargoRenovacionSugerido.toLocaleString("es-CO")}</span>
        </div>

        <label className="field-label">Nuevo precio total del alquiler</label>
        <input
          className="input"
          type="number"
          min={0}
          value={precioTotalTrasRenovacionFinal}
          onChange={(e) => setPrecioTotalTrasRenovacion(Number(e.target.value))}
        />

        <button
          type="button"
          className="btn btn-primary"
          style={{ alignSelf: "flex-start" }}
          onClick={manejarRenovar}
        >
          Renovar
        </button>
      </div>
    </div>
  );
}
