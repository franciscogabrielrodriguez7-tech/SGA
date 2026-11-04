import { useState } from "react";

import type { Producto } from "../../interfaces/Producto";
import type { DetalleAlquilerLinea } from "../../interfaces/Alquiler";
import { ProductoSelect } from "../productos/ProductoSelect";
import { productosApi } from "../../api/productos";
import { detalleAlquilerApi } from "../../api/detalleAlquiler";
import type { DetalleAlquilerCreatePayload } from "../../api/detalleAlquiler";
import { ApiError } from "../../api/client";
import { toaster } from "../ui/toaster";
import { calcularPrecioConjunto } from "../../utils/precios";
import { puedeAgregarProductos } from "../../utils/reglasAlquiler";
import type { EstadoAlquiler } from "../../interfaces/Alquiler";

// ============================================================================
// AgregarProductoSection — permite agregar un nuevo producto a un alquiler
// existente vía POST /detalle-alquiler. Solo visible en estados 'pendiente'
// y 'activo' (espejo de ESTADOS_DETALLE_EDITABLE en el backend).
// ============================================================================

interface AgregarProductoSectionProps {
  idAlquiler: number;
  estadoAlquiler: EstadoAlquiler;
  tiempoAlquilerDias: number;
  detallesActuales: DetalleAlquilerLinea[];
  onProductoAgregado: () => void; // recargar todo tras éxito
}

export function AgregarProductoSection({
  idAlquiler,
  estadoAlquiler,
  tiempoAlquilerDias,
  detallesActuales,
  onProductoAgregado,
}: AgregarProductoSectionProps) {
  const [abierto, setAbierto] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Formulario del nuevo producto
  const [productoId, setProductoId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [esExtra, setEsExtra] = useState(false);

  if (!puedeAgregarProductos(estadoAlquiler)) return null;

  // Cargar productos cuando se abre el panel
  const abrirPanel = async () => {
    setAbierto(true);
    setCargando(true);
    try {
      const lista = await productosApi.listar(true);
      setProductos(lista);
      if (lista.length > 0 && productoId === null) {
        setProductoId(lista[0].id_producto);
      }
    } catch {
      toaster.create({ title: "Error al cargar productos", type: "error" });
    } finally {
      setCargando(false);
    }
  };

  const productoSeleccionado = productos.find((p) => p.id_producto === productoId);

  // Determinar si el producto ya está en el alquiler (sin ser extra)
  const yaExisteComoNormal = productoSeleccionado
    ? detallesActuales.some(
        (d) =>
          d.id_producto === productoSeleccionado.id_producto &&
          !d.es_producto_extra &&
          d.estado_registro,
      )
    : false;

  // Calcular precio conjunto automáticamente
  const precioConjunto = productoSeleccionado
    ? calcularPrecioConjunto(
        esExtra
          ? productoSeleccionado.precio_base_extra
          : productoSeleccionado.precio_base_producto,
        productoSeleccionado.unidad_minima_alquiler,
        cantidad,
        tiempoAlquilerDias,
      )
    : 0;

  const manejarAgregar = async () => {
    if (!productoSeleccionado) return;

    const payload: DetalleAlquilerCreatePayload = {
      id_alquiler: idAlquiler,
      id_producto: productoSeleccionado.id_producto,
      cantidad_productos: cantidad,
      precio_conjunto: precioConjunto,
      es_producto_extra: esExtra,
    };

    setGuardando(true);
    try {
      await detalleAlquilerApi.crear(payload);
      toaster.create({
        title: "Producto agregado",
        description: `${productoSeleccionado.nombre_producto} × ${cantidad} añadido al alquiler.`,
        type: "success",
      });

      // Resetear formulario
      setCantidad(1);
      setEsExtra(false);
      setAbierto(false);
      onProductoAgregado();
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo agregar el producto";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) {
    return (
      <button
        id="btn-agregar-producto"
        type="button"
        className="btn btn-outline btn-sm"
        style={{ alignSelf: "flex-start", marginTop: 8 }}
        onClick={abrirPanel}
      >
        + Agregar producto
      </button>
    );
  }

  return (
    <div className="card" id="agregar-producto-section" style={{ marginTop: 8 }}>
      <h3 className="heading-sm" style={{ marginBottom: 12 }}>
        Nuevo producto
      </h3>

      {cargando ? (
        <p className="text-sm text-muted">Cargando productos disponibles…</p>
      ) : (
        <div className="stack gap-4">
          <div className="grid grid-cols-1 grid-cols-3-md" style={{ gap: 16 }}>
            {/* Selector de producto */}
            <div>
              <label className="field-label">Producto</label>
              <ProductoSelect
                productos={productos}
                value={productoId}
                onProductoChange={(id) => {
                  setProductoId(id);
                  setEsExtra(false);
                }}
              />
              {productoSeleccionado && (
                <p className="text-sm text-muted" style={{ marginTop: 4 }}>
                  $
                  {productoSeleccionado.precio_base_producto.toLocaleString("es-CO")}{" "}
                  /{" "}
                  {
                    { DIA: "día", SEMANA: "semana", MES: "mes" }[
                      productoSeleccionado.unidad_minima_alquiler
                    ]
                  }
                </p>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <label className="field-label">Cantidad</label>
              <input
                className="input"
                type="number"
                min={1}
                max={productoSeleccionado?.stock_disponible ?? 99}
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
              />
              {productoSeleccionado && (
                <p className="text-sm text-muted" style={{ marginTop: 4 }}>
                  Disponible: {productoSeleccionado.stock_disponible}
                </p>
              )}
            </div>

            {/* Precio conjunto (calculado) */}
            <div>
              <label className="field-label">Precio conjunto</label>
              <input
                className="input"
                value={`$${precioConjunto.toLocaleString("es-CO")}`}
                readOnly
              />
            </div>
          </div>

          {/* Producto extra */}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={esExtra}
              onChange={(e) => setEsExtra(e.target.checked)}
            />
            Producto extra (permite repetir el mismo producto en otra línea)
          </label>

          {/* Advertencia si ya existe como normal */}
          {yaExisteComoNormal && !esExtra && (
            <p className="text-sm text-warning">
              ⚠️ Este producto ya está en el alquiler. Marca "Producto extra" o cambia la
              cantidad en la línea existente.
            </p>
          )}

          {/* Acciones */}
          <div className="hstack gap-3" style={{ marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                guardando ||
                !productoSeleccionado ||
                cantidad < 1 ||
                (yaExisteComoNormal && !esExtra)
              }
              onClick={manejarAgregar}
            >
              {guardando ? "Agregando…" : "Agregar al alquiler"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
