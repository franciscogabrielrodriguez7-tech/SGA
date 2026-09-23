import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { Alquiler, EstadoAlquiler } from "../../interfaces/Alquiler";
import type { MovimientoLogistico } from "../../interfaces/Logistica";
import { toaster } from "../../components/ui/toaster";
import { ADMIN_O_FACTURACION, tienePermiso } from "../../utils/permisos";
import {
  convertirADias,
  unidadMinimaPermiteUnidadTiempo,
  unidadTiempoMasRestrictiva,
  type UnidadTiempo,
} from "../../utils/tiempoUi";
import { calcularPrecioConjunto } from "../../utils/precios";
import type { DetalleAlquilerLinea } from "../../interfaces/Alquiler";
import { calcularEtiquetaVencimiento, claseBadgePorTono } from "../../utils/vencimiento";

import { DatosGeneralesSection } from "../../components/alquilerDetalleComponents/DatosGeneralesSection";
import { DetalleProductosSection } from "../../components/alquilerDetalleComponents/DetalleProductosSection";
import { CambiarEstadoSection } from "../../components/alquilerDetalleComponents/CambiarEstadoSection";
import { RenovarSection } from "../../components/alquilerDetalleComponents/RenovarSection";
import { LogisticaSection } from "../../components/alquilerDetalleComponents/LogisticaSection";

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
          d.es_producto_extra ? d.precio_base_extra : d.precio_base_producto,
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

      <DatosGeneralesSection alquiler={alquiler} />

      <DetalleProductosSection detallesLinea={detallesLinea} />

      <CambiarEstadoSection
        nuevoEstado={nuevoEstado} setNuevoEstado={setNuevoEstado}
        manejarCambioEstado={manejarCambioEstado}
        puedeGestionarFacturacion={puedeGestionarFacturacion}
        manejarCancelar={manejarCancelar}
      />

      {puedeGestionarFacturacion && (
        <RenovarSection
          cantidadRenovacion={cantidadRenovacion} setCantidadRenovacion={setCantidadRenovacion}
          unidadRenovacion={unidadRenovacion} setUnidadRenovacion={setUnidadRenovacion}
          unidadMinimaRestrictivaRenovacion={unidadMinimaRestrictivaRenovacion}
          diasRenovacion={diasRenovacion}
          cargoRenovacionSugerido={cargoRenovacionSugerido}
          precioTotalTrasRenovacionFinal={precioTotalTrasRenovacionFinal}
          setPrecioTotalTrasRenovacion={setPrecioTotalTrasRenovacion}
          manejarRenovar={manejarRenovar}
        />
      )}

      <LogisticaSection
        entregas={entregas} recogidas={recogidas}
        observacionesEntrega={observacionesEntrega} setObservacionesEntrega={setObservacionesEntrega}
        manejarRegistrarEntrega={manejarRegistrarEntrega}
        observacionesRecogida={observacionesRecogida} setObservacionesRecogida={setObservacionesRecogida}
        manejarRegistrarRecogida={manejarRegistrarRecogida}
      />
    </div>
  );
}
