import type { MovimientoLogistico, ResumenSemanal } from "../../interfaces/Logistica";

interface ListaGastosProps {
  puedeVerResumen: boolean;
  resumen: ResumenSemanal[];
  gastos: MovimientoLogistico[];
  cargando: boolean;
}

export function ListaGastos({
  puedeVerResumen,
  resumen,
  gastos,
  cargando
}: ListaGastosProps) {
  return (
    <div className="stack gap-8">
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
