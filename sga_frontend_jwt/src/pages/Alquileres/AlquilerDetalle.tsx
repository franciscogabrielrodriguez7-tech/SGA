import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { Alquiler, EstadoAlquiler } from "../../interfaces/Alquiler";
import { ESTADOS_ALQUILER } from "../../interfaces/Alquiler";
import type { MovimientoLogistico } from "../../interfaces/Logistica";
import { toaster } from "../../components/ui/toaster";

export function AlquilerDetalle() {
  const { id } = useParams<{ id: string }>();
  const idAlquiler = Number(id);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [alquiler, setAlquiler] = useState<Alquiler | null>(null);
  const [entregas, setEntregas] = useState<MovimientoLogistico[]>([]);
  const [recogidas, setRecogidas] = useState<MovimientoLogistico[]>([]);
  const [cargando, setCargando] = useState(true);

  const [nuevoEstado, setNuevoEstado] = useState<EstadoAlquiler | "">("");
  const [semanasRenovacion, setSemanasRenovacion] = useState(1);
  const [observacionesEntrega, setObservacionesEntrega] = useState("");
  const [observacionesRecogida, setObservacionesRecogida] = useState("");

  const cargarTodo = async () => {
    setCargando(true);

    try {
      const [detalle, listaEntregas, listaRecogidas] = await Promise.all([
        alquileresApi.consultar(idAlquiler),
        alquileresApi.listarEntregas(idAlquiler),
        alquileresApi.listarRecogidas(idAlquiler),
      ]);

      setAlquiler(detalle);
      setEntregas(listaEntregas);
      setRecogidas(listaRecogidas);
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "Error al cargar el alquiler";

      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idAlquiler]);

  const manejarCambioEstado = async () => {
    if (!nuevoEstado) return;

    try {
      const actualizado = await alquileresApi.cambiarEstado(idAlquiler, nuevoEstado);
      setAlquiler(actualizado);
      setNuevoEstado("");

      toaster.create({
        title: "Estado actualizado",
        description: `El alquiler ahora está en estado '${actualizado.estado_alquiler}'.`,
        type: "success",
      });
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo cambiar el estado";

      toaster.create({ title: "Transición no permitida", description: mensaje, type: "error" });
    }
  };

  const manejarRenovar = async () => {
    try {
      const actualizado = await alquileresApi.renovar(idAlquiler, semanasRenovacion);
      setAlquiler(actualizado);

      toaster.create({
        title: "Alquiler renovado",
        description: `Nueva fecha de vencimiento: ${actualizado.fecha_vencimiento}`,
        type: "success",
      });
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo renovar el alquiler";

      toaster.create({ title: "Renovación no permitida", description: mensaje, type: "error" });
    }
  };

  const manejarRegistrarEntrega = async () => {
    if (!usuario) return;

    try {
      await alquileresApi.registrarEntrega(idAlquiler, {
        id_usuario_logistico: usuario.id_usuario,
        observaciones_logistica_alquiler: observacionesEntrega || undefined,
      });

      toaster.create({
        title: "Entrega registrada",
        description: "El alquiler pasó a estado 'activo'.",
        type: "success",
      });

      setObservacionesEntrega("");
      cargarTodo();
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo registrar la entrega";

      toaster.create({ title: "Entrega no permitida", description: mensaje, type: "error" });
    }
  };

  const manejarRegistrarRecogida = async () => {
    if (!usuario) return;

    try {
      await alquileresApi.registrarRecogida(idAlquiler, {
        id_usuario_logistico: usuario.id_usuario,
        observaciones_logistica_alquiler: observacionesRecogida || undefined,
      });

      toaster.create({
        title: "Recogida registrada",
        description: "El alquiler pasó a estado 'recogido' y el stock fue devuelto.",
        type: "success",
      });

      setObservacionesRecogida("");
      cargarTodo();
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo registrar la recogida";

      toaster.create({ title: "Recogida no permitida", description: mensaje, type: "error" });
    }
  };

  const manejarCancelar = async () => {
    if (!confirm("¿Cancelar este alquiler? Esta acción no se puede deshacer.")) return;

    try {
      const actualizado = await alquileresApi.cancelar(idAlquiler);
      setAlquiler(actualizado);

      toaster.create({ title: "Alquiler cancelado", type: "success" });
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo cancelar el alquiler";

      toaster.create({ title: "Cancelación no permitida", description: mensaje, type: "error" });
    }
  };

  if (cargando) {
    return <p>Cargando...</p>;
  }

  if (!alquiler) {
    return <p>El alquiler no existe.</p>;
  }

  return (
    <div className="stack gap-8">
      <div className="hstack justify-between">
        <div className="stack gap-1">
          <h1 className="heading-xl">Alquiler #{alquiler.id_alquiler}</h1>
          <div className="hstack gap-2">
            <span className="badge badge-lg">{alquiler.estado_alquiler}</span>
            <span className="text-muted">Vence: {alquiler.fecha_vencimiento}</span>
          </div>
        </div>

        <button type="button" className="btn btn-outline" onClick={() => navigate("/alquileres")}>
          ← Volver
        </button>
      </div>

      {/* Datos generales */}
      <div className="card stack gap-2">
        <p>
          <b>Cliente:</b> {alquiler.nombres_cliente} {alquiler.apellidos_cliente} (
          {alquiler.id_usuario_cliente})
        </p>
        <p>
          <b>Creado por:</b> {alquiler.nombres_creador} {alquiler.apellidos_creador}
        </p>
        <p>
          <b>Dirección:</b> {alquiler.direccion} — {alquiler.barrio}
        </p>
        <p>
          <b>Depósito:</b> ${alquiler.deposito.toLocaleString("es-CO")}
        </p>
        <p>
          <b>Precio del alquiler:</b> ${alquiler.precio_alquiler.toLocaleString("es-CO")}
        </p>
        <p>
          <b>Fecha de inicio:</b> {alquiler.fecha_inicio} — {alquiler.tiempo_alquiler} semana(s)
        </p>
        <p>
          <b>Logística:</b> {alquiler.se_lleva ? "Se lleva" : "No se lleva"} ·{" "}
          {alquiler.se_recoge ? "Se recoge" : "No se recoge"}
        </p>
      </div>

      {/* Detalle de productos */}
      <div>
        <h2 className="heading-md" style={{ marginBottom: 12 }}>
          Productos
        </h2>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio conjunto</th>
                <th>Extra</th>
              </tr>
            </thead>
            <tbody>
              {alquiler.detalles.map((d) => (
                <tr key={d.id_detalle_alquiler}>
                  <td>{d.nombre_producto}</td>
                  <td>{d.cantidad_productos}</td>
                  <td>${d.precio_conjunto.toLocaleString("es-CO")}</td>
                  <td>{d.es_producto_extra ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acciones de estado */}
      <div className="card">
        <h2 className="heading-md" style={{ marginBottom: 16 }}>
          Cambiar estado
        </h2>

        <div className="hstack gap-3">
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

          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={manejarCancelar}
            style={{ marginLeft: "auto" }}
          >
            Cancelar alquiler
          </button>
        </div>

        <p className="text-sm text-muted" style={{ marginTop: 8 }}>
          El backend valida la secuencia oficial (pendiente → activo → vencido → recogido →
          terminado, con cancelado como alternativa) y rechaza transiciones inválidas.
        </p>
      </div>

      {/* Renovación */}
      <div className="card">
        <h2 className="heading-md" style={{ marginBottom: 16 }}>
          Renovar (RN-REN)
        </h2>

        <div className="hstack gap-2">
          <input
            className="input"
            style={{ maxWidth: 140 }}
            type="number"
            min={1}
            value={semanasRenovacion}
            onChange={(e) => setSemanasRenovacion(Number(e.target.value))}
          />
          <span>semanas</span>
          <button type="button" className="btn btn-primary" onClick={manejarRenovar}>
            Renovar
          </button>
        </div>

        <p className="text-sm text-muted" style={{ marginTop: 8 }}>
          Solo disponible cuando el alquiler está 'activo' o 'vencido'.
        </p>
      </div>

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
