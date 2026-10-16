import { useEffect, useState } from "react";

import type { Alquiler, AlquilerUpdatePayload } from "../../interfaces/Alquiler";
import { InputMoneda } from "../inputs/InputMoneda";
import {
  CAMPOS_EDITABLES_POR_ESTADO,
  puedeEditarAlquiler,
  type CampoEditableAlquiler,
} from "../../utils/reglasAlquiler";
import {
  convertirADias,
  OPCIONES_UNIDAD_TIEMPO,
  unidadMinimaPermiteUnidadTiempo,
  type UnidadTiempo,
} from "../../utils/tiempoUi";
import type { UnidadMinimaAlquiler } from "../../interfaces/Producto";
import { descomponerDias } from "../../utils/reglasAlquiler";

// ============================================================================
// EditarAlquilerSection — formulario inline que muestra SOLO los campos
// que el backend permite modificar según el estado actual del alquiler
// (espejo de CAMPOS_EDITABLES_POR_ESTADO en alquiler_controller.py).
// ============================================================================

interface EditarAlquilerSectionProps {
  alquiler: Alquiler;
  unidadMinimaRestrictiva: UnidadTiempo;
  onGuardar: (payload: AlquilerUpdatePayload) => Promise<void>;
}

// Etiquetas legibles para cada campo editable.
const ETIQUETA: Record<CampoEditableAlquiler, string> = {
  direccion: "Dirección",
  barrio: "Barrio",
  precio_alquiler: "Precio del alquiler",
  deposito: "Depósito",
  fecha_inicio: "Fecha de inicio",
  tiempo_alquiler_dias: "Tiempo de alquiler",
  se_lleva: "Se lleva",
  se_recoge: "Se recoge",
};

export function EditarAlquilerSection({
  alquiler,
  unidadMinimaRestrictiva,
  onGuardar,
}: EditarAlquilerSectionProps) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estado local de cada campo editable — se inicializa desde el alquiler.
  const [direccion, setDireccion] = useState(alquiler.direccion);
  const [barrio, setBarrio] = useState(alquiler.barrio);
  const [precioAlquiler, setPrecioAlquiler] = useState(alquiler.precio_alquiler);
  const [deposito, setDeposito] = useState(alquiler.deposito);
  const [fechaInicio, setFechaInicio] = useState(alquiler.fecha_inicio);
  const [seLleva, setSeLleva] = useState(alquiler.se_lleva);
  const [seRecoge, setSeRecoge] = useState(alquiler.se_recoge);

  // Tiempo: descomponemos los días en la unidad más grande posible.
  const descompuesto = descomponerDias(alquiler.tiempo_alquiler_dias, unidadMinimaRestrictiva);
  const [cantidadTiempo, setCantidadTiempo] = useState(descompuesto.cantidad);
  const [unidadTiempo, setUnidadTiempo] = useState<UnidadTiempo>(descompuesto.unidad);
  const tiempoAlquilerDias = convertirADias(cantidadTiempo, unidadTiempo);

  // Re-sincronizar cuando el alquiler cambia externamente (p. ej. tras
  // renovación o cambio de estado que refrescan los datos).
  useEffect(() => {
    setDireccion(alquiler.direccion);
    setBarrio(alquiler.barrio);
    setPrecioAlquiler(alquiler.precio_alquiler);
    setDeposito(alquiler.deposito);
    setFechaInicio(alquiler.fecha_inicio);
    setSeLleva(alquiler.se_lleva);
    setSeRecoge(alquiler.se_recoge);

    const d = descomponerDias(alquiler.tiempo_alquiler_dias, unidadMinimaRestrictiva);
    setCantidadTiempo(d.cantidad);
    setUnidadTiempo(d.unidad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alquiler]);

  if (!puedeEditarAlquiler(alquiler.estado_alquiler)) return null;

  const camposPermitidos = new Set(CAMPOS_EDITABLES_POR_ESTADO[alquiler.estado_alquiler]);
  const puede = (campo: CampoEditableAlquiler) => camposPermitidos.has(campo);

  // Construye el payload solo con los campos que realmente cambiaron.
  const construirPayload = (): AlquilerUpdatePayload | null => {
    const payload: AlquilerUpdatePayload = {};
    let hayCambios = false;

    if (puede("direccion") && direccion !== alquiler.direccion) {
      payload.direccion = direccion;
      hayCambios = true;
    }
    if (puede("barrio") && barrio !== alquiler.barrio) {
      payload.barrio = barrio;
      hayCambios = true;
    }
    if (puede("precio_alquiler") && precioAlquiler !== alquiler.precio_alquiler) {
      payload.precio_alquiler = precioAlquiler;
      hayCambios = true;
    }
    if (puede("deposito") && deposito !== alquiler.deposito) {
      payload.deposito = deposito;
      hayCambios = true;
    }
    if (puede("fecha_inicio") && fechaInicio !== alquiler.fecha_inicio) {
      payload.fecha_inicio = fechaInicio;
      hayCambios = true;
    }
    if (puede("tiempo_alquiler_dias") && tiempoAlquilerDias !== alquiler.tiempo_alquiler_dias) {
      payload.tiempo_alquiler_dias = tiempoAlquilerDias;
      hayCambios = true;
    }
    if (puede("se_lleva") && seLleva !== alquiler.se_lleva) {
      payload.se_lleva = seLleva;
      hayCambios = true;
    }
    if (puede("se_recoge") && seRecoge !== alquiler.se_recoge) {
      payload.se_recoge = seRecoge;
      hayCambios = true;
    }

    return hayCambios ? payload : null;
  };

  const manejarGuardar = async () => {
    const payload = construirPayload();
    if (!payload) return;

    setGuardando(true);
    try {
      await onGuardar(payload);
      setAbierto(false);
    } finally {
      setGuardando(false);
    }
  };

  const manejarCancelar = () => {
    // Restaurar todos los valores al alquiler original.
    setDireccion(alquiler.direccion);
    setBarrio(alquiler.barrio);
    setPrecioAlquiler(alquiler.precio_alquiler);
    setDeposito(alquiler.deposito);
    setFechaInicio(alquiler.fecha_inicio);
    setSeLleva(alquiler.se_lleva);
    setSeRecoge(alquiler.se_recoge);

    const d = descomponerDias(alquiler.tiempo_alquiler_dias, unidadMinimaRestrictiva);
    setCantidadTiempo(d.cantidad);
    setUnidadTiempo(d.unidad);

    setAbierto(false);
  };

  // Mapa backend -> frontend para la unidadMinimaPermiteUnidadTiempo.
  const unidadMinimaBackend = (
    { dias: "DIA", semanas: "SEMANA", meses: "MES" } as const
  )[unidadMinimaRestrictiva] as UnidadMinimaAlquiler;

  if (!abierto) {
    return (
      <div className="hstack justify-between" style={{ marginBottom: 4 }}>
        <button
          id="btn-editar-alquiler"
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setAbierto(true)}
        >
          ✏️ Editar datos del alquiler
        </button>
        <span className="text-sm text-muted">
          {camposPermitidos.size} campo(s) editable(s) en estado '{alquiler.estado_alquiler}'
        </span>
      </div>
    );
  }

  return (
    <div className="card" id="editar-alquiler-section">
      <div className="hstack justify-between" style={{ marginBottom: 16 }}>
        <h2 className="heading-md">Editar alquiler</h2>
        <span className="badge badge-gray">
          Estado: {alquiler.estado_alquiler}
        </span>
      </div>

      <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
        Solo se muestran los campos editables para el estado actual. Los campos
        deshabilitados requieren un estado diferente del alquiler.
      </p>

      <div className="stack gap-4">
        {/* Dirección + Barrio */}
        {(puede("direccion") || puede("barrio")) && (
          <div className="grid grid-cols-1 grid-cols-2-md" style={{ gap: 16 }}>
            {puede("direccion") && (
              <div>
                <label className="field-label">{ETIQUETA.direccion}</label>
                <input
                  className="input"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>
            )}
            {puede("barrio") && (
              <div>
                <label className="field-label">{ETIQUETA.barrio}</label>
                <input
                  className="input"
                  value={barrio}
                  onChange={(e) => setBarrio(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Fecha de inicio */}
        {puede("fecha_inicio") && (
          <div>
            <label className="field-label">{ETIQUETA.fecha_inicio}</label>
            <input
              className="input"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={{ maxWidth: 220 }}
            />
          </div>
        )}

        {/* Tiempo de alquiler */}
        {puede("tiempo_alquiler_dias") && (
          <div>
            <label className="field-label">{ETIQUETA.tiempo_alquiler_dias}</label>
            <div className="hstack gap-2">
              <input
                className="input"
                type="number"
                min={1}
                style={{ maxWidth: 100 }}
                value={cantidadTiempo}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCantidadTiempo(parseInt(e.target.value) || 1)}
              />
              <select
                className="input"
                style={{ maxWidth: 130 }}
                value={unidadTiempo}
                onChange={(e) => setUnidadTiempo(e.target.value as UnidadTiempo)}
              >
                {OPCIONES_UNIDAD_TIEMPO.map((opcion) => {
                  const deshabilitada = !unidadMinimaPermiteUnidadTiempo(
                    unidadMinimaBackend,
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
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>
              Equivale a {tiempoAlquilerDias} día(s).
              {alquiler.estado_alquiler !== "pendiente" &&
                tiempoAlquilerDias > alquiler.tiempo_alquiler_dias &&
                " ⚠️ Este aumento se registrará como renovación."}
              {tiempoAlquilerDias < alquiler.tiempo_alquiler_dias &&
                " ⚠️ Reducción: la nueva fecha de vencimiento debe quedar en el futuro."}
            </p>
          </div>
        )}

        {/* Precio + Depósito */}
        {(puede("precio_alquiler") || puede("deposito")) && (
          <div className="grid grid-cols-1 grid-cols-2-md" style={{ gap: 16 }}>
            {puede("precio_alquiler") && (
              <div>
                <label className="field-label">{ETIQUETA.precio_alquiler}</label>
                <InputMoneda value={precioAlquiler} onChange={setPrecioAlquiler} />
              </div>
            )}
            {puede("deposito") && (
              <div>
                <label className="field-label">{ETIQUETA.deposito}</label>
                <InputMoneda value={deposito} onChange={setDeposito} />
              </div>
            )}
          </div>
        )}

        {/* Logística (checkboxes) */}
        {(puede("se_lleva") || puede("se_recoge")) && (
          <div className="hstack gap-8">
            {puede("se_lleva") && (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={seLleva}
                  onChange={(e) => setSeLleva(e.target.checked)}
                />
                {ETIQUETA.se_lleva}
              </label>
            )}
            {puede("se_recoge") && (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={seRecoge}
                  onChange={(e) => setSeRecoge(e.target.checked)}
                />
                {ETIQUETA.se_recoge}
              </label>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="hstack gap-3 justify-end" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={manejarCancelar}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            id="btn-guardar-edicion"
            type="button"
            className="btn btn-primary"
            onClick={manejarGuardar}
            disabled={guardando || !construirPayload()}
          >
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
