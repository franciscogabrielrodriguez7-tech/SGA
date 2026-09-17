import { useEffect, useState } from "react";

import { productosApi } from "../../api/productos";
import { ApiError } from "../../api/client";
import type { Producto, UnidadMinimaAlquiler } from "../../interfaces/Producto";
import { toaster } from "../../components/ui/toaster";
import { InputMoneda } from "../../components/inputs/InputMoneda";
import { useAuth } from "../../context/AuthContext";
import { SOLO_ADMIN, tienePermiso } from "../../utils/permisos";

export function Productos() {
  const { usuario } = useAuth();
  // POST/PATCH /productos son SOLO_ADMIN en el backend
  const puedeGestionar = tienePermiso(usuario?.rol_usuario, SOLO_ADMIN);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  // Form states (Crear)
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioBase, setPrecioBase] = useState(0);
  const [precioExtra, setPrecioExtra] = useState<number | null>(null);
  const [stockTotal, setStockTotal] = useState(1);
  const [unidadMinima, setUnidadMinima] = useState<UnidadMinimaAlquiler>("DIA");
  const [creando, setCreando] = useState(false);

  // Modal states (Editar)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editPrecioBase, setEditPrecioBase] = useState(0);
  const [editPrecioExtra, setEditPrecioExtra] = useState(0);
  const [editStockTotal, setEditStockTotal] = useState(1);
  const [editUnidadMinima, setEditUnidadMinima] = useState<UnidadMinimaAlquiler>("DIA");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const cargar = () => {
    setCargando(true);
    // Para el admin cargamos también los inactivos, si se quisiera, 
    // pero por ahora mantenemos el comportamiento por defecto de listar() si no le pasamos arg
    // o pasamos false para traer todos y que el admin pueda reactivar.
    productosApi
      .listar(false) // Traemos todos para poder ver los desactivados
      .then(setProductos)
      .catch((error) => {
        const mensaje = error instanceof ApiError ? error.message : "Error al cargar productos";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      })
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const manejarCrear = async () => {
    if (!nombre || !descripcion || stockTotal < 1) {
      toaster.create({
        title: "Datos incompletos",
        description: "Nombre, descripción y stock total (mayor a 0) son obligatorios.",
        type: "warning",
      });
      return;
    }

    setCreando(true);

    try {
      await productosApi.crear({
        nombre_producto: nombre,
        descripcion_producto: descripcion,
        precio_base_producto: precioBase,
        // null → el backend usa precio_base_producto como fallback
        precio_base_extra: precioExtra ?? undefined,
        stock_total: stockTotal,
        unidad_minima_alquiler: unidadMinima,
      });

      toaster.create({ title: "Producto creado", type: "success" });

      setNombre("");
      setDescripcion("");
      setPrecioBase(0);
      setPrecioExtra(null);
      setStockTotal(1);
      setUnidadMinima("DIA");

      cargar();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : "No se pudo crear el producto";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCreando(false);
    }
  };

  const abrirModalEdicion = (producto: Producto) => {
    if (!puedeGestionar) return;
    setProductoEditando(producto);
    setEditNombre(producto.nombre_producto);
    setEditDescripcion(producto.descripcion_producto || "");
    setEditPrecioBase(producto.precio_base_producto);
    setEditPrecioExtra(producto.precio_base_extra);
    setEditStockTotal(producto.stock_total);
    setEditUnidadMinima(producto.unidad_minima_alquiler);
  };

  const cerrarModal = () => {
    setProductoEditando(null);
  };

  const manejarGuardarEdicion = async () => {
    if (!productoEditando) return;
    if (!editNombre || editStockTotal < 1) {
      toaster.create({ title: "Atención", description: "Nombre y stock total (mayor a 0) son obligatorios.", type: "warning" });
      return;
    }

    setGuardandoEdicion(true);
    try {
      await productosApi.actualizar(productoEditando.id_producto, {
        nombre_producto: editNombre,
        descripcion_producto: editDescripcion,
        precio_base_producto: editPrecioBase,
        precio_base_extra: editPrecioExtra,
        stock_total: editStockTotal,
        unidad_minima_alquiler: editUnidadMinima,
      });
      toaster.create({ title: "Producto actualizado", type: "success" });
      cargar();
      cerrarModal();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : "Error al actualizar producto";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const manejarCambiarEstado = async () => {
    if (!productoEditando) return;
    
    const nuevoEstado = !productoEditando.estado_registro;
    const accion = nuevoEstado ? "Activar" : "Desactivar";

    if (!window.confirm(`¿Estás seguro de ${accion.toLowerCase()} este producto?`)) return;

    setCambiandoEstado(true);
    try {
      await productosApi.cambiarEstado(productoEditando.id_producto, nuevoEstado);
      toaster.create({ title: `Producto ${nuevoEstado ? 'activado' : 'desactivado'} con éxito`, type: "success" });
      cargar();
      cerrarModal();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : `Error al ${accion.toLowerCase()} el producto`;
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCambiandoEstado(false);
    }
  };

  return (
    <div className="stack gap-8">
      <h1 className="heading-xl">Productos</h1>

      {puedeGestionar && (
        <div className="card">
          <h2 className="heading-md" style={{ marginBottom: 16 }}>
            Nuevo producto
          </h2>

          <div className="grid grid-cols-1 grid-cols-2-md" style={{ marginBottom: 16 }}>
            <div>
              <label className="field-label">Nombre</label>
              <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Descripción</label>
              <input className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Precio base</label>
              <InputMoneda value={precioBase} onChange={setPrecioBase} />
            </div>

            <div>
              <label className="field-label">Precio extra</label>
              <InputMoneda
                value={precioExtra ?? precioBase}
                onChange={setPrecioExtra}
              />
              <p className="text-sm text-muted" style={{ marginTop: 4 }}>
                Precio al añadir como extra.
              </p>
            </div>

            <div>
              <label className="field-label">Unidad mínima de alquiler</label>
              <select
                className="input"
                value={unidadMinima}
                onChange={(e) => setUnidadMinima(e.target.value as UnidadMinimaAlquiler)}
              >
                <option value="DIA">Día (precio base es por día)</option>
                <option value="SEMANA">Semana (precio base es por semana)</option>
                <option value="MES">Mes (precio base es por mes)</option>
              </select>
            </div>

            <div>
              <label className="field-label">Stock total</label>
              <input
                className="input"
                type="number"
                min={1}
                value={stockTotal}
                onChange={(e) => setStockTotal(Number(e.target.value))}
              />
            </div>
          </div>

          <button type="button" className="btn btn-primary" disabled={creando} onClick={manejarCrear}>
            {creando ? "Creando..." : "Crear producto"}
          </button>
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio base</th>
              <th>Precio extra</th>
              <th>Unidad</th>
              <th>Alquilado / Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              // Si el producto está inactivo o sin stock, visualmente apagado
              const opaco = !p.estado_registro;
              const sinStock = p.stock_disponible === 0;

              return (
                <tr 
                  key={p.id_producto} 
                  onClick={() => abrirModalEdicion(p)}
                  style={{ 
                    cursor: puedeGestionar ? "pointer" : "default",
                    opacity: opaco ? 0.5 : 1,
                    transition: "opacity 0.2s"
                  }}
                  title={puedeGestionar ? "Haz clic para editar" : ""}
                  className={puedeGestionar ? "row-hover" : ""}
                >
                  <td>{p.id_producto}</td>
                  <td className="text-bold">{p.nombre_producto}</td>
                  <td>${p.precio_base_producto.toLocaleString("es-CO")}</td>
                  <td>${p.precio_base_extra.toLocaleString("es-CO")}</td>
                  <td><span className="badge">{{ DIA: "Día", SEMANA: "Semana", MES: "Mes" }[p.unidad_minima_alquiler]}</span></td>
                  <td>
                    <span style={{ color: sinStock ? "var(--color-danger)" : "inherit", fontWeight: sinStock ? "bold" : "normal" }}>
                      {p.stock_disponible}
                    </span>
                    <span className="text-muted"> / {p.stock_total} disp.</span>
                  </td>
                  <td>
                    <span className={`badge ${p.estado_registro ? "" : "badge-gray"}`}>
                      {p.estado_registro ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!cargando && productos.length === 0 && (
          <p className="table-empty">No hay productos registrados.</p>
        )}
      </div>

      {/* MODAL DE EDICIÓN */}
      {productoEditando && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="heading-lg">Editar: {productoEditando.nombre_producto}</h2>
              <button className="btn" onClick={cerrarModal} style={{ padding: '4px 8px' }}>✕</button>
            </div>

            <div className="stack gap-4" style={{ marginBottom: 24 }}>
              
              <div className="grid grid-cols-1 grid-cols-2-md">
                <div>
                  <label className="field-label">Nombre</label>
                  <input className="input" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Descripción</label>
                  <input className="input" value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 grid-cols-2-md">
                <div>
                  <label className="field-label">Precio base</label>
                  <InputMoneda value={editPrecioBase} onChange={setPrecioBase} />
                </div>
                <div>
                  <label className="field-label">Precio extra</label>
                  <InputMoneda value={editPrecioExtra} onChange={setEditPrecioExtra} />
                </div>
              </div>

              <div className="grid grid-cols-1 grid-cols-2-md">
                <div>
                  <label className="field-label">Unidad mínima de alquiler</label>
                  <select
                    className="input"
                    value={editUnidadMinima}
                    onChange={(e) => setEditUnidadMinima(e.target.value as UnidadMinimaAlquiler)}
                  >
                    <option value="DIA">Día</option>
                    <option value="SEMANA">Semana</option>
                    <option value="MES">Mes</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Stock total</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={editStockTotal}
                    onChange={(e) => setEditStockTotal(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted" style={{ marginTop: 4 }}>
                    Actualmente en alquiler: {productoEditando.stock_alquilado}
                  </p>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={manejarCambiarEstado}
                disabled={cambiandoEstado || guardandoEdicion}
                style={{ color: productoEditando.estado_registro ? "var(--color-danger)" : "var(--color-primary)", borderColor: "currentColor" }}
              >
                {cambiandoEstado ? "Procesando..." : (productoEditando.estado_registro ? "Desactivar Producto" : "Activar Producto")}
              </button>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={manejarGuardarEdicion} disabled={guardandoEdicion || cambiandoEstado}>
                  {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
