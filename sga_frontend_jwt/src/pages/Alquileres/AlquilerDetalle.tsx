import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { Alquiler, EstadoAlquiler } from "../../interfaces/Alquiler";
import { ESTADOS_ALQUILER } from "../../interfaces/Alquiler";
import type { MovimientoLogistico } from "../../interfaces/Logistica";
import { toaster } from "../../components/ui/toaster";
import { ADMIN_O_FACTURACION, tienePermiso } from "../../utils/permisos";
import {
  OPCIONES_UNIDAD_TIEMPO,
  convertirADias,
  unidadMinimaPermiteUnidadTiempo,
  unidadTiempoMasRestrictiva,
  type UnidadTiempo,
} from "../../utils/tiempoUi";
import { calcularPrecioConjunto } from "../../utils/precios";
import type { DetalleAlquilerLinea } from "../../interfaces/Alquiler";
import { calcularEtiquetaVencimiento, claseBadgePorTono } from "../../utils/vencimiento";

export function AlquilerDetalle() {
  const { id } = useParams<{ id: string }>();
  const idAlquiler = Number(id);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [alquiler, setAlquiler] = useState<Alquiler | null>(null);
  const [detallesLinea, setDetallesLinea] = useState<DetalleAlquilerLinea[]>([]);
  const [entregas, setEntregas] = useState<MovimientoLogistico[]>([]);
  const [recogidas, setRecogidas] = useState<MovimientoLogistico[]>([]);
  const [cargando, setCargando] = useState(true);

  const [nuevoEstado, setNuevoEstado] = useState<EstadoAlquiler | "">("");
  const [cantidadRenovacion, setCantidadRenovacion] = useState(1);
  const [unidadRenovacion, setUnidadRenovacion] = useState<UnidadTiempo>("semanas");
  const diasRenovacion = convertirADias(cantidadRenovacion, unidadRenovacion);

  // Misma restricción que en Crear alquiler: la unidad de renovación no
  // puede ser inferior a la unidad mínima de ningún producto YA incluido
  // en este alquiler. Solo UX — el backend (renovar_alquiler) vuelve a
  // validarlo contra la BD.
  const unidadesMinimasEnAlquiler = detallesLinea
    .filter((d) => d.estado_registro)
    .map((d) => d.unidad_minima_alquiler);
  const unidadMinimaRestrictivaRenovacion = unidadTiempoMasRestrictiva(unidadesMinimasEnAlquiler);

  useEffect(() => {
    if (!unidadMinimaPermiteUnidadTiempo(
      ({ dias: "DIA", semanas: "SEMANA", meses: "MES" } as const)[unidadMinimaRestrictivaRenovacion],
      unidadRenovacion,
    )) {
      setUnidadRenovacion(unidadMinimaRestrictivaRenovacion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidadMinimaRestrictivaRenovacion]);

  // RN confirmada: la renovación cobra SOLO productos * tiempo extra
  // (nunca depósito ni transporte), usando la misma fórmula de precios
  // que Crear alquiler (calcularPrecioConjunto, sin fracciones). Se
  // suma al precio_alquiler actual, y el total sigue siendo editable.
  const cargoRenovacionSugerido = detallesLinea
    .filter((d) => d.estado_registro)
    .reduce(
      (total, d) =>
        total +
        calcularPrecioConjunto(
          d.precio_base_producto,
          d.unidad_minima_alquiler,
          d.cantidad_productos,
          diasRenovacion,
        ),
      0,
    );

  const [precioTotalTrasRenovacion, setPrecioTotalTrasRenovacion] = useState<number | null>(null);

  useEffect(() => {
    if (alquiler) {
      setPrecioTotalTrasRenovacion(alquiler.precio_alquiler + cargoRenovacionSugerido);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargoRenovacionSugerido, alquiler?.precio_alquiler]);

  const precioTotalTrasRenovacionFinal =
    precioTotalTrasRenovacion ?? (alquiler ? alquiler.precio_alquiler + cargoRenovacionSugerido : 0);

  const [observacionesEntrega, setObservacionesEntrega] = useState("");
  const [observacionesRecogida, setObservacionesRecogida] = useState("");

  // POST /renovaciones y DELETE (cancelar) son ADMIN_O_FACTURACION en el
  // backend (app/routes/alquiler_routes.py): encargado_logistico recibiría
  // 403, así que esos controles se ocultan para ese rol.
  const puedeGestionarFacturacion = tienePermiso(usuario?.rol_usuario, ADMIN_O_FACTURACION);

  const cargarTodo = async () => {
    setCargando(true);

    try {
      const [detalle, lineas, listaEntregas, listaRecogidas] = await Promise.all([
        alquileresApi.consultar(idAlquiler),
        alquileresApi.detalles(idAlquiler),
        alquileresApi.listarEntregas(idAlquiler),
        alquileresApi.listarRecogidas(idAlquiler),
      ]);

      setAlquiler(detalle);
      setDetallesLinea(lineas);
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
      const actualizado = await alquileresApi.renovar(
        idAlquiler,
        diasRenovacion,
        precioTotalTrasRenovacionFinal,
      );
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
            <span className={`${claseBadgePorTono(calcularEtiquetaVencimiento(alquiler).tono)} badge-lg`}>
              {calcularEtiquetaVencimiento(alquiler).texto}
            </span>
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
          <b>Fecha de inicio:</b> {alquiler.fecha_inicio} — {alquiler.tiempo_alquiler_dias} día(s)
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

          {puedeGestionarFacturacion && (
            <button
              type="button"
              className="btn btn-danger-outline"
              onClick={manejarCancelar}
              style={{ marginLeft: "auto" }}
            >
              Cancelar alquiler
            </button>
          )}
        </div>

        <p className="text-sm text-muted" style={{ marginTop: 8 }}>
          El backend valida la secuencia oficial (pendiente → activo → vencido → recogido →
          terminado, con cancelado como alternativa) y rechaza transiciones inválidas.
        </p>
      </div>

      {/* Renovación — solo admin / encargado_facturacion (backend: ADMIN_O_FACTURACION) */}
      {puedeGestionarFacturacion && (
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
      )}

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
