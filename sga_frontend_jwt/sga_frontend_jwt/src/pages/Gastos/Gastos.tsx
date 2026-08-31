import { useEffect, useState } from "react";

import { gastosApi } from "../../api/gastos";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { MovimientoLogistico, ResumenSemanal } from "../../interfaces/Logistica";
import { toaster } from "../../components/ui/toaster";
import { InputMoneda } from "../../components/inputs/InputMoneda";

export function Gastos() {
  const { usuario } = useAuth();

  const [gastos, setGastos] = useState<MovimientoLogistico[]>([]);
  const [resumen, setResumen] = useState<ResumenSemanal[]>([]);
  const [cargando, setCargando] = useState(true);

  const [idAlquiler, setIdAlquiler] = useState<number>(0);
  const [esRecogida, setEsRecogida] = useState(false);
  const [valor, setValor] = useState(0);
  const [descripcion, setDescripcion] = useState("");
  const [creando, setCreando] = useState(false);

  const cargar = () => {
    setCargando(true);
    Promise.all([gastosApi.listar(), gastosApi.resumenSemanal()])
      .then(([listaGastos, listaResumen]) => {
        setGastos(listaGastos);
        setResumen(listaResumen);
      })
      .catch((error) => {
        const mensaje = error instanceof ApiError ? error.message : "Error al cargar gastos";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      })
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const manejarCrear = async () => {
    if (!usuario) return;

    if (!idAlquiler || valor <= 0) {
      toaster.create({
        title: "Datos incompletos",
        description: "Debes indicar el id de alquiler y un valor mayor a 0.",
        type: "warning",
      });
      return;
    }

    setCreando(true);

    try {
      await gastosApi.crear({
        id_alquiler: idAlquiler,
        id_usuario_logistico: usuario.id_usuario,
        es_recogida: esRecogida,
        valor_gasto_logistico: valor,
        descripcion_gasto_logistico: descripcion || undefined,
      });

      toaster.create({ title: "Gasto registrado", type: "success" });

      setIdAlquiler(0);
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
          cuál de las dos se asocia (según el backend).
        </p>

        <div className="grid grid-cols-1 grid-cols-3-md" style={{ marginBottom: 16 }}>
          <div>
            <label className="field-label">ID de alquiler</label>
            <input
              className="input"
              type="number"
              value={idAlquiler || ""}
              onChange={(e) => setIdAlquiler(Number(e.target.value))}
            />
          </div>

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
