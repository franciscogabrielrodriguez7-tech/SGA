import { useEffect, useMemo, useState } from "react";

import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import type { HistorialAlquiler } from "../../interfaces/Alquiler";
import {
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_FILTRO,
  clasificarEvento,
  coincideConBusqueda,
  coincideConFiltro,
  formatearFechaHora,
  formatearMoneda,
  type CategoriaEvento,
  type EventoClasificado,
  type FiltroHistorial,
} from "../../utils/historialAlquiler";

// GET /alquileres/{id}/historial es ADMIN_O_FACTURACION en el backend:
// AlquilerDetalle solo monta esta sección para esos roles.

interface HistorialSectionProps {
  idAlquiler: number;
  // Cambia cada vez que la pantalla hace una acción que genera un evento
  // de auditoría (renovar, cambiar estado, entrega, etc.) para recargar.
  recargaToken: number;
}

const FILTROS: FiltroHistorial[] = ["todos", "renovacion", "estado", "edicion"];

const CLASE_CATEGORIA: Record<CategoriaEvento, string> = {
  creacion: "badge badge-success",
  renovacion: "badge",
  estado: "badge badge-warning",
  edicion: "badge badge-gray",
  eliminacion: "badge badge-danger",
};

const ICONO_CATEGORIA: Record<CategoriaEvento, string> = {
  creacion: "🟢",
  renovacion: "🔄",
  estado: "🏷️",
  edicion: "✏️",
  eliminacion: "🗑️",
};

export function HistorialSection({ idAlquiler, recargaToken }: HistorialSectionProps) {
  const [historial, setHistorial] = useState<HistorialAlquiler | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtro, setFiltro] = useState<FiltroHistorial>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [masRecientePrimero, setMasRecientePrimero] = useState(true);

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError(null);

    alquileresApi
      .historial(idAlquiler)
      .then((datos) => {
        if (!cancelado) setHistorial(datos);
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err instanceof ApiError ? err.message : "No se pudo cargar el historial");
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [idAlquiler, recargaToken]);

  const clasificados = useMemo<EventoClasificado[]>(
    () => (historial?.eventos ?? []).map(clasificarEvento),
    [historial],
  );

  const conteoPorFiltro = useMemo(() => {
    const conteo = {} as Record<FiltroHistorial, number>;
    FILTROS.forEach((f) => {
      conteo[f] = clasificados.filter((item) => coincideConFiltro(item, f)).length;
    });
    return conteo;
  }, [clasificados]);

  const visibles = useMemo(() => {
    // El backend ya los entrega del más reciente al más antiguo.
    const filtrados = clasificados.filter(
      (item) => coincideConFiltro(item, filtro) && coincideConBusqueda(item, busqueda),
    );
    return masRecientePrimero ? filtrados : [...filtrados].reverse();
  }, [clasificados, filtro, busqueda, masRecientePrimero]);

  return (
    <section className="card" aria-labelledby="historial-alquiler-titulo">
      <div className="hstack justify-between" style={{ marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 id="historial-alquiler-titulo" className="heading-md">
          Historial y trazabilidad
        </h2>
        {historial && (
          <span className="text-sm text-muted">{historial.total_eventos} evento(s) registrados</span>
        )}
      </div>

      <div className="historial-filtros" role="tablist" aria-label="Filtrar historial">
        {FILTROS.map((f) => (
          <button
            key={f}
            id={`historial-filtro-${f}`}
            type="button"
            role="tab"
            aria-selected={filtro === f}
            className={`chip ${filtro === f ? "chip-active" : ""}`}
            onClick={() => setFiltro(f)}
          >
            {ETIQUETAS_FILTRO[f]}
            <span className="chip-count">{conteoPorFiltro[f] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="hstack gap-2" style={{ marginTop: 12, flexWrap: "wrap" }}>
        <input
          id="historial-busqueda"
          className="input"
          style={{ flex: 1, minWidth: 200 }}
          type="search"
          placeholder="Buscar por responsable, estado o campo modificado…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          id="historial-orden"
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setMasRecientePrimero((v) => !v)}
        >
          {masRecientePrimero ? "↓ Más reciente primero" : "↑ Más antiguo primero"}
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        {cargando && <p className="text-sm text-muted">Cargando historial…</p>}

        {!cargando && error && <p className="text-sm text-danger">{error}</p>}

        {!cargando && !error && visibles.length === 0 && (
          <p className="table-empty">
            {clasificados.length === 0
              ? "Este alquiler aún no tiene eventos registrados."
              : "Ningún evento coincide con los filtros seleccionados."}
          </p>
        )}

        {!cargando && !error && visibles.length > 0 && (
          <ol className="timeline">
            {visibles.map((item) => (
              <EventoItem key={item.evento.id_auditoria} item={item} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function EventoItem({ item }: { item: EventoClasificado }) {
  const principal = item.categorias[0] ?? "edicion";

  return (
    <li className={`timeline-item timeline-${principal}`}>
      <div className="timeline-header">
        <div className="hstack gap-2" style={{ flexWrap: "wrap" }}>
          {item.categorias.length === 0 ? (
            <span className="badge badge-gray">Sin cambios visibles</span>
          ) : (
            item.categorias.map((c) => (
              <span key={c} className={CLASE_CATEGORIA[c]}>
                {ICONO_CATEGORIA[c]} {ETIQUETAS_CATEGORIA[c]}
              </span>
            ))
          )}
        </div>
        <span className="text-sm text-muted">
          {formatearFechaHora(item.evento.fecha_accion)} ·{" "}
          <span className={item.esSistema ? "" : "text-bold"}>{item.responsable}</span>
        </span>
      </div>

      <ul className="timeline-body">
        {item.categorias.includes("creacion") && <li>Alquiler registrado en el sistema.</li>}

        {item.categorias.includes("eliminacion") && <li>Registro eliminado.</li>}

        {item.renovacion && (
          <>
            <li>
              Tiempo agregado: <strong>+{item.renovacion.diasAgregados} día(s)</strong> (duración{" "}
              {item.renovacion.duracionAnterior} → {item.renovacion.duracionNueva} días)
            </li>
            {item.renovacion.precioNuevo !== null &&
              item.renovacion.precioAnterior !== null &&
              item.renovacion.precioNuevo !== item.renovacion.precioAnterior && (
                <li>
                  Precio total: {formatearMoneda(item.renovacion.precioAnterior)} →{" "}
                  <strong>{formatearMoneda(item.renovacion.precioNuevo)}</strong> (
                  {item.renovacion.precioNuevo > item.renovacion.precioAnterior ? "+" : ""}
                  {formatearMoneda(item.renovacion.precioNuevo - item.renovacion.precioAnterior)})
                </li>
              )}
          </>
        )}

        {item.estado && (
          <li>
            Estado: <span className="badge badge-gray">{item.estado.antes}</span> ➔{" "}
            <span className="badge">{item.estado.despues}</span>
          </li>
        )}

        {item.ediciones.map((e) => (
          <li key={e.campo}>
            {e.etiqueta}: <span className="text-muted">{e.antes}</span> → <strong>{e.despues}</strong>
          </li>
        ))}
      </ul>
    </li>
  );
}
