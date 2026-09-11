import { useEffect, useState } from "react";

import { gastosApi } from "../../api/gastos";
import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { MovimientoLogistico, ResumenSemanal } from "../../interfaces/Logistica";
import type { Alquiler } from "../../interfaces/Alquiler";
import { toaster } from "../../components/ui/toaster";
import { InputMoneda } from "../../components/inputs/InputMoneda";
import { ADMIN_O_FACTURACION, tienePermiso } from "../../utils/permisos";

export function Gastos() {
  const { usuario } = useAuth();
  // GET /gastos/resumen-semanal es ADMIN_O_FACTURACION en el backend
  // (app/routes/gastos_routes.py); registrar/listar gastos es
  // STAFF_INTERNO (los 3 roles). El resumen se pide aparte para que un
  // 403 ahí no tumbe la lista de gastos, que sí puede ver logística.
  const puedeVerResumen = tienePermiso(usuario?.rol_usuario, ADMIN_O_FACTURACION);

  const [gastos, setGastos] = useState<MovimientoLogistico[]>([]);
  const [resumen, setResumen] = useState<ResumenSemanal[]>([]);
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [cargando, setCargando] = useState(true);

  // Un mismo gasto (mismo viaje/valor/fecha) puede corresponder a
  // varios alquileres a la vez (ej. una entrega que despachó
  // productos de 2 alquileres en el mismo viaje): por eso es una
  // selección múltiple, no un solo ID. El backend registra una fila
  // de logistica_alquiler por cada alquiler elegido, todas con los
  // mismos datos del gasto — la tabla y su relación 1 fila = 1
  // alquiler no cambian.
  const [idsAlquilerSeleccionados, setIdsAlquilerSeleccionados] = useState<number[]>([]);
  const [busquedaAlquiler, setBusquedaAlquiler] = useState("");
  const [esRecogida, setEsRecogida] = useState(false);
  const [valor, setValor] = useState(0);
  const [descripcion, setDescripcion] = useState("");
  const [creando, setCreando] = useState(false);

  const cargar = () => {
    setCargando(true);

    gastosApi
      .listar()
      .then(setGastos)
      .catch((error) => {
        const mensaje = error instanceof ApiError ? error.message : "Error al cargar gastos";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      })
      .finally(() => setCargando(false));

    alquileresApi.listar().then(setAlquileres).catch(() => {
      // Silencioso: si falla, el selector de alquileres queda vacío
      // pero el resto de la pantalla (lista de gastos) sigue usable.
    });

    if (puedeVerResumen) {
      gastosApi
        .resumenSemanal()
        .then(setResumen)
        .catch((error) => {
          const mensaje =
            error instanceof ApiError ? error.message : "Error al cargar el resumen semanal";
          toaster.create({ title: "Error", description: mensaje, type: "error" });
        });
    }
  };

  useEffect(cargar, []);

  const alquileresFiltrados = alquileres.filter((a) => {
    if (!busquedaAlquiler) return true;
    const termino = busquedaAlquiler.toLowerCase();
    return (
      String(a.id_alquiler).includes(termino) ||
      a.nombres_cliente?.toLowerCase().includes(termino) ||
      a.apellidos_cliente?.toLowerCase().includes(termino)
    );
  });

  const alternarAlquiler = (id: number) => {
    setIdsAlquilerSeleccionados((actuales) =>
      actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id],
    );
  };

  const manejarCrear = async () => {
    if (idsAlquilerSeleccionados.length === 0 || valor <= 0) {
      toaster.create({
        title: "Datos incompletos",
        description: "Selecciona al menos un alquiler e indica un valor mayor a 0.",
        type: "warning",
      });
      return;
    }

    setCreando(true);

    try {
      await gastosApi.crear({
        ids_alquiler: idsAlquilerSeleccionados,
        es_recogida: esRecogida,
        valor_gasto_logistico: valor,
        descripcion_gasto_logistico: descripcion || undefined,
      });

      toaster.create({
        title: "Gasto registrado",
        description: `Registrado en ${idsAlquilerSeleccionados.length} alquiler(es).`,
        type: "success",
      });

      setIdsAlquilerSeleccionados([]);
      setValor(0);
      setDescripcion("");

      cargar();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : "No se pudo registrar el gasto";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="stack gap-8">
      <h1 className="heading-xl">Gastos logísticos</h1>

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

      {puedeVerResumen && (
        <div>
          <h2 className="heading-md" style={{ marginBottom: 12 }}>
            Resumen semanal (RN-GAS-07)
          </h2>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>Registros</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {resumen.map((r) => (
                  <tr key={r.semana_inicio}>
                    <td>{r.semana_inicio}</td>
                    <td>{r.cantidad_registros}</td>
                    <td>${r.total_gasto.toLocaleString("es-CO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!cargando && resumen.length === 0 && <p className="table-empty">Sin datos.</p>}
          </div>
        </div>
      )}

      <div>
        <h2 className="heading-md" style={{ marginBottom: 12 }}>
          Todos los gastos
        </h2>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Alquiler</th>
                <th>Responsable</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id_logistica_alquiler}>
                  <td>#{g.id_alquiler}</td>
                  <td>{g.nombres_logistico}</td>
                  <td>{g.fecha_gasto}</td>
                  <td>{g.es_recogida ? "Recogida" : "Entrega"}</td>
                  <td>${g.valor_gasto_logistico.toLocaleString("es-CO")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!cargando && gastos.length === 0 && <p className="table-empty">No hay gastos registrados.</p>}
        </div>
      </div>
    </div>
  );
}
