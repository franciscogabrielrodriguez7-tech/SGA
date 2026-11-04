import type { Alquiler, AlquilerUpdatePayload, EstadoAlquiler } from "../../interfaces/Alquiler";
import type { UnidadTiempo } from "../../utils/tiempoUi";
import { CambiarEstadoSection } from "./CambiarEstadoSection";
import { EditarAlquilerSection } from "./EditarAlquilerSection";
import { RenovarSection } from "./RenovarSection";

// ============================================================================
// GestionSection — contenedor de todas las acciones administrativas del
// contrato. En el nuevo layout ocupa la pestaña "Gestión" de la columna
// central, aprovechando el ancho completo para formularios más cómodos.
// Props: espejo exacto de las props que AlquilerDetalle pasaba al sidebar.
// ============================================================================

interface GestionSectionProps {
  alquiler: Alquiler;

  // Cambiar estado
  nuevoEstado: EstadoAlquiler | "";
  setNuevoEstado: (estado: EstadoAlquiler | "") => void;
  manejarCambioEstado: () => Promise<void>;
  manejarCancelar: () => Promise<void>;
  puedeGestionarFacturacion: boolean;

  // Editar alquiler
  unidadMinimaRestrictivaRenovacion: UnidadTiempo;
  onGuardarEdicion: (payload: AlquilerUpdatePayload) => Promise<void>;

  // Renovar
  cantidadRenovacion: number;
  setCantidadRenovacion: (v: number) => void;
  unidadRenovacion: UnidadTiempo;
  setUnidadRenovacion: (v: UnidadTiempo) => void;
  diasRenovacion: number;
  cargoRenovacionSugerido: number;
  precioTotalTrasRenovacionFinal: number;
  setPrecioTotalTrasRenovacion: (v: number | null) => void;
  manejarRenovar: () => Promise<void>;
}

export function GestionSection({
  alquiler,
  nuevoEstado,
  setNuevoEstado,
  manejarCambioEstado,
  manejarCancelar,
  puedeGestionarFacturacion,
  unidadMinimaRestrictivaRenovacion,
  onGuardarEdicion,
  cantidadRenovacion,
  setCantidadRenovacion,
  unidadRenovacion,
  setUnidadRenovacion,
  diasRenovacion,
  cargoRenovacionSugerido,
  precioTotalTrasRenovacionFinal,
  setPrecioTotalTrasRenovacion,
  manejarRenovar,
}: GestionSectionProps) {
  return (
    <div className="stack gap-5">
      {/* ── Cambiar Estado ─────────────────────────────────────────────────── */}
      <CambiarEstadoSection
        nuevoEstado={nuevoEstado}
        setNuevoEstado={setNuevoEstado}
        manejarCambioEstado={manejarCambioEstado}
        puedeGestionarFacturacion={puedeGestionarFacturacion}
        manejarCancelar={manejarCancelar}
      />

      {/* ── Editar Alquiler y Renovar (solo para admin/facturación) ────────── */}
      {puedeGestionarFacturacion && (
        <>
          <EditarAlquilerSection
            alquiler={alquiler}
            unidadMinimaRestrictiva={unidadMinimaRestrictivaRenovacion}
            onGuardar={onGuardarEdicion}
          />
          <RenovarSection
            cantidadRenovacion={cantidadRenovacion}
            setCantidadRenovacion={setCantidadRenovacion}
            unidadRenovacion={unidadRenovacion}
            setUnidadRenovacion={setUnidadRenovacion}
            unidadMinimaRestrictivaRenovacion={unidadMinimaRestrictivaRenovacion}
            diasRenovacion={diasRenovacion}
            cargoRenovacionSugerido={cargoRenovacionSugerido}
            precioTotalTrasRenovacionFinal={precioTotalTrasRenovacionFinal}
            setPrecioTotalTrasRenovacion={setPrecioTotalTrasRenovacion}
            manejarRenovar={manejarRenovar}
          />
        </>
      )}
    </div>
  );
}
