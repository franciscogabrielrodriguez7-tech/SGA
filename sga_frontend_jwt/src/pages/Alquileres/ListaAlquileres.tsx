import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import type { Alquiler, EstadoAlquiler } from "../../interfaces/Alquiler";
import { ESTADOS_ALQUILER } from "../../interfaces/Alquiler";
import { toaster } from "../../components/ui/toaster";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_O_FACTURACION, tienePermiso } from "../../utils/permisos";
import { calcularEtiquetaVencimiento, claseBadgePorTono } from "../../utils/vencimiento";

export function ListaAlquileres() {
  const { usuario } = useAuth();
  // POST /alquileres es ADMIN_O_FACTURACION en el backend: encargado_logistico
  // vería el botón pero recibiría 403 al usarlo, así que se oculta.
  const puedeCrear = tienePermiso(usuario?.rol_usuario, ADMIN_O_FACTURACION);

  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [cargando, setCargando] = useState(true);

  const [filtroEstado, setFiltroEstado] = useState<EstadoAlquiler | "">("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaBarrio, setBusquedaBarrio] = useState("");

  const cargarLista = async () => {
    setCargando(true);

    try {
      const resultado =
        busquedaCliente || busquedaBarrio
          ? await alquileresApi.buscar({
              cliente: busquedaCliente || undefined,
              barrio: busquedaBarrio || undefined,
            })
          : await alquileresApi.listar({
              estado_alquiler: filtroEstado || undefined,
            });

      setAlquileres(resultado);
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "Error al consultar alquileres";

      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado]);

  return (
    <div className="stack gap-6">
      <div className="hstack justify-between">
        <h1 className="heading-xl">Alquileres</h1>
        {puedeCrear && (
          <RouterLink to="/alquileres/nuevo" className="btn btn-primary">
            + Crear alquiler
          </RouterLink>
        )}
      </div>

      <div className="hstack gap-3 flex-wrap">
        <select
          className="input"
          style={{ width: "auto" }}
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as EstadoAlquiler | "")}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_ALQUILER.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>

        <input
          className="input"
          style={{ maxWidth: 220 }}
          placeholder="Buscar por cliente"
          value={busquedaCliente}
          onChange={(e) => setBusquedaCliente(e.target.value)}
        />

        <input
          className="input"
          style={{ maxWidth: 220 }}
          placeholder="Buscar por barrio"
          value={busquedaBarrio}
          onChange={(e) => setBusquedaBarrio(e.target.value)}
        />

        <button type="button" className="btn btn-outline" onClick={cargarLista}>
          Buscar
        </button>
      </div>

      <div className="hide-on-mobile table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Barrio</th>
              <th>Estado</th>
              <th>Vencimiento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {alquileres.map((alquiler) => {
              const etiqueta = calcularEtiquetaVencimiento(alquiler);

              return (
                <tr key={alquiler.id_alquiler}>
                  <td>{alquiler.id_alquiler}</td>
                  <td>
                    {alquiler.nombres_cliente} {alquiler.apellidos_cliente}
                  </td>
                  <td>{alquiler.barrio}</td>
                  <td>
                    <span className={claseBadgePorTono(etiqueta.tono)}>{etiqueta.texto}</span>
                  </td>
                  <td>{alquiler.fecha_vencimiento}</td>
                  <td>
                    <RouterLink
                      to={`/alquileres/${alquiler.id_alquiler}`}
                      className="btn btn-outline btn-sm"
                    >
                      Ver
                    </RouterLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!cargando && alquileres.length === 0 && (
          <p className="table-empty">No se encontraron alquileres.</p>
        )}
      </div>

      {/* Mismos datos que la tabla de arriba, en formato de card para
          pantallas pequeñas (más fácil de leer que filas de tabla
          apretadas). Se oculta en escritorio vía CSS. */}
      <div className="show-mobile-cards">
        {alquileres.map((alquiler) => {
          const etiqueta = calcularEtiquetaVencimiento(alquiler);

          return (
            <RouterLink
              key={alquiler.id_alquiler}
              to={`/alquileres/${alquiler.id_alquiler}`}
              className="list-card"
            >
              <div className="list-card-header">
                <span className="list-card-title">
                  #{alquiler.id_alquiler} — {alquiler.nombres_cliente} {alquiler.apellidos_cliente}
                </span>
                <span className={claseBadgePorTono(etiqueta.tono)}>{etiqueta.texto}</span>
              </div>
              <p className="list-card-meta">{alquiler.barrio}</p>
              <p className="list-card-meta">Vence: {alquiler.fecha_vencimiento}</p>
            </RouterLink>
          );
        })}

        {!cargando && alquileres.length === 0 && (
          <p className="table-empty">No se encontraron alquileres.</p>
        )}
      </div>
    </div>
  );
}
