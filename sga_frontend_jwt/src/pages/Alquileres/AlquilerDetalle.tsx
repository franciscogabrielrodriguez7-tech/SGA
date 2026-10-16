import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { Alquiler, AlquilerUpdatePayload, EstadoAlquiler } from "../../interfaces/Alquiler";
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
import { ProductosCompactoSection } from "../../components/alquilerDetalleComponents/ProductosCompactoSection";
import { GestionSection } from "../../components/alquilerDetalleComponents/GestionSection";
import { LogisticaSection } from "../../components/alquilerDetalleComponents/LogisticaSection";
import { HistorialSection } from "../../components/alquilerDetalleComponents/HistorialSection";

// ─── Tipos de pestaña ────────────────────────────────────────────────────────

// Desktop: pestaña activa en la columna central (Logística por defecto).
type TabCentral = "logistica" | "gestion" | "historial";

// Móvil: pestañas de la barra vertical (productos incluido).
type TabMovil = "productos" | "logistica" | "gestion" | "historial";

// ─────────────────────────────────────────────────────────────────────────────

export function AlquilerDetalle() {
  const { id } = useParams<{ id: string }>();
  const idAlquiler = Number(id);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // ── Estado del servidor ─────────────────────────────────────────────────────
  const [alquiler, setAlquiler] = useState<Alquiler | null>(null);
  const [detallesLinea, setDetallesLinea] = useState<DetalleAlquilerLinea[]>([]);
  const [entregas, setEntregas] = useState<MovimientoLogistico[]>([]);
  const [recogidas, setRecogidas] = useState<MovimientoLogistico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recargaHistorial, setRecargaHistorial] = useState(0);
  const refrescarHistorial = () => setRecargaHistorial((n) => n + 1);

  // ── Navegación por pestañas ─────────────────────────────────────────────────
  const [tabCentral, setTabCentral] = useState<TabCentral>("logistica");
  const [tabMovil, setTabMovil] = useState<TabMovil>("productos");

  // ── Modal de detalle completo de productos ──────────────────────────────────
  const [modalProductosAbierto, setModalProductosAbierto] = useState(false);

  // ── Estado de acciones ──────────────────────────────────────────────────────
  const [nuevoEstado, setNuevoEstado] = useState<EstadoAlquiler | "">("");
  const [cantidadRenovacion, setCantidadRenovacion] = useState(1);
  const [unidadRenovacion, setUnidadRenovacion] = useState<UnidadTiempo>("semanas");
  const diasRenovacion = convertirADias(cantidadRenovacion, unidadRenovacion);

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

  const puedeGestionarFacturacion = tienePermiso(usuario?.rol_usuario, ADMIN_O_FACTURACION);

  // ── Carga de datos ──────────────────────────────────────────────────────────
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

  // ── Manejadores de acciones ─────────────────────────────────────────────────
  const manejarCambioEstado = async () => {
    if (!nuevoEstado) return;
    try {
      const actualizado = await alquileresApi.cambiarEstado(idAlquiler, nuevoEstado);
      setAlquiler(actualizado);
      setNuevoEstado("");
      refrescarHistorial();
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
      refrescarHistorial();
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
      refrescarHistorial();
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
      refrescarHistorial();
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
      refrescarHistorial();
      toaster.create({ title: "Alquiler cancelado", type: "success" });
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo cancelar el alquiler";
      toaster.create({ title: "Cancelación no permitida", description: mensaje, type: "error" });
    }
  };

  const manejarEditar = async (payload: AlquilerUpdatePayload) => {
    try {
      const actualizado = await alquileresApi.actualizar(idAlquiler, payload);
      setAlquiler(actualizado);
      refrescarHistorial();
      toaster.create({
        title: "Alquiler actualizado",
        description: "Los cambios se guardaron correctamente.",
        type: "success",
      });
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo actualizar el alquiler";
      toaster.create({ title: "Error al editar", description: mensaje, type: "error" });
      throw error; // Re-lanzar para que el formulario no se cierre
    }
  };

  // ── Estados de carga / error ────────────────────────────────────────────────
  if (cargando) {
    return <p>Cargando...</p>;
  }

  if (!alquiler) {
    return <p>El alquiler no existe.</p>;
  }

  // ─── Datos derivados para contadores ────────────────────────────────────────
  const productosActivos = detallesLinea.filter((d) => d.estado_registro);
  const etiquetaVencimiento = calcularEtiquetaVencimiento(alquiler);

  // ─── Definición de pestañas ──────────────────────────────────────────────────
  const tabsCentrales: { id: TabCentral; label: string; count?: number }[] = [
    { id: "logistica", label: "🚚 Logística", count: entregas.length + recogidas.length },
    ...(puedeGestionarFacturacion ? [{ id: "historial" as TabCentral, label: "📋 Historial" }] : []),
    { id: "gestion", label: "⚡ Gestión" },
  ];

  const tabsMovil: { id: TabMovil; label: string; count?: number }[] = [
    { id: "productos", label: "📦 Productos", count: productosActivos.length },
    { id: "logistica", label: "🚚 Logística", count: entregas.length + recogidas.length },
    { id: "gestion", label: "⚡ Gestión" },
    ...(puedeGestionarFacturacion ? [{ id: "historial" as TabMovil, label: "📋 Historial" }] : []),
  ];

  // ─── Bloques de contenido reutilizados ──────────────────────────────────────

  const bloqueLogistica = (
    <LogisticaSection
      entregas={entregas} recogidas={recogidas}
      observacionesEntrega={observacionesEntrega} setObservacionesEntrega={setObservacionesEntrega}
      manejarRegistrarEntrega={manejarRegistrarEntrega}
      observacionesRecogida={observacionesRecogida} setObservacionesRecogida={setObservacionesRecogida}
      manejarRegistrarRecogida={manejarRegistrarRecogida}
    />
  );

  const bloqueGestion = (
    <GestionSection
      alquiler={alquiler}
      nuevoEstado={nuevoEstado}
      setNuevoEstado={setNuevoEstado}
      manejarCambioEstado={manejarCambioEstado}
      manejarCancelar={manejarCancelar}
      puedeGestionarFacturacion={puedeGestionarFacturacion}
      unidadMinimaRestrictivaRenovacion={unidadMinimaRestrictivaRenovacion}
      onGuardarEdicion={manejarEditar}
      cantidadRenovacion={cantidadRenovacion}
      setCantidadRenovacion={setCantidadRenovacion}
      unidadRenovacion={unidadRenovacion}
      setUnidadRenovacion={setUnidadRenovacion}
      diasRenovacion={diasRenovacion}
      cargoRenovacionSugerido={cargoRenovacionSugerido}
      precioTotalTrasRenovacionFinal={precioTotalTrasRenovacionFinal}
      setPrecioTotalTrasRenovacion={setPrecioTotalTrasRenovacion}
      manejarRenovar={manejarRenovar}
    />
  );

  const bloqueHistorial = puedeGestionarFacturacion
    ? <HistorialSection idAlquiler={idAlquiler} recargaToken={recargaHistorial} />
    : null;

  const bloqueProductosMovil = (
    <DetalleProductosSection
      detallesLinea={detallesLinea}
      idAlquiler={idAlquiler}
      estadoAlquiler={alquiler.estado_alquiler}
      tiempoAlquilerDias={alquiler.tiempo_alquiler_dias}
      puedeGestionar={puedeGestionarFacturacion}
      onProductoAgregado={() => { cargarTodo(); refrescarHistorial(); }}
    />
  );

  // ─── Sidebar de contexto fijo (columna derecha desktop) ──────────────────────
  const bloqueSidebar = (
    <div className="sidebar-sticky">
      {/* Bloque 1: Datos generales del cliente y contrato */}
      <DatosGeneralesSection alquiler={alquiler} />

      {/* Bloque 2: Resumen compacto de productos */}
      <ProductosCompactoSection
        detallesLinea={detallesLinea}
        puedeGestionar={puedeGestionarFacturacion}
        onAbrirDetalleCompleto={() => setModalProductosAbierto(true)}
      />
    </div>
  );

  return (
    <div className="stack gap-6">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="hstack justify-between">
        <div className="stack gap-1">
          <h1 className="heading-xl">Alquiler #{alquiler.id_alquiler}</h1>
          <div className="hstack gap-2">
            <span className="badge badge-lg">{alquiler.estado_alquiler}</span>
            <span className={`${claseBadgePorTono(etiquetaVencimiento.tono)} badge-lg`}>
              {etiquetaVencimiento.texto}
            </span>
          </div>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => navigate("/alquileres")}>
          ← Volver
        </button>
      </div>

      {/* ── BARRA TÁCTIL MÓVIL (< 900px): chips apilados en columna ─────────── */}
      <div className="tabs-nav hide-on-desktop">
        {tabsMovil.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`chip${tabMovil === tab.id ? " chip-active" : ""}`}
            onClick={() => setTabMovil(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="chip-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── LAYOUT DESKTOP (≥ 900px): columna central con tabs + sidebar sticky */}
      <div className="detalle-grid hide-on-mobile">
        {/* Columna central */}
        <div className="stack gap-0">
          {/* Barra de pestañas horizontal tipo tab-bar */}
          <div className="tabs-central-nav">
            {tabsCentrales.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tab-central-btn${tabCentral === tab.id ? " tab-active" : ""}`}
                onClick={() => setTabCentral(tab.id)}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="chip-count">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Contenido de la pestaña activa */}
          {tabCentral === "logistica" && bloqueLogistica}
          {tabCentral === "gestion" && bloqueGestion}
          {tabCentral === "historial" && bloqueHistorial}
        </div>

        {/* Sidebar de contexto sticky */}
        {bloqueSidebar}
      </div>

      {/* ── LAYOUT MÓVIL: pestaña activa ─────────────────────────────────────── */}
      <div className="show-mobile-cards">
        {tabMovil === "productos" && bloqueProductosMovil}
        {tabMovil === "logistica" && bloqueLogistica}
        {tabMovil === "gestion" && (
          <div className="stack gap-5">
            {bloqueSidebar}
            {bloqueGestion}
          </div>
        )}
        {tabMovil === "historial" && bloqueHistorial}
      </div>

      {/* ── MODAL: tabla completa de productos + agregar (disparado desde sidebar) */}
      {modalProductosAbierto && (
        <div
          className="modal-overlay"
          onClick={() => setModalProductosAbierto(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: 860 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="hstack justify-between"
              style={{ marginBottom: "var(--space-4)" }}
            >
              <h2 className="heading-lg">Inventario del Alquiler</h2>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "6px 12px" }}
                onClick={() => setModalProductosAbierto(false)}
              >
                ✕
              </button>
            </div>
            <DetalleProductosSection
              detallesLinea={detallesLinea}
              idAlquiler={idAlquiler}
              estadoAlquiler={alquiler.estado_alquiler}
              tiempoAlquilerDias={alquiler.tiempo_alquiler_dias}
              puedeGestionar={puedeGestionarFacturacion}
              onProductoAgregado={() => {
                cargarTodo();
                refrescarHistorial();
                setModalProductosAbierto(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
