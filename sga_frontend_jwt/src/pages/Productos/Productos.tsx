import { useEffect, useState } from "react";

import { productosApi } from "../../api/productos";
import { ApiError } from "../../api/client";
import type { Producto, UnidadMinimaAlquiler } from "../../interfaces/Producto";
import { toaster } from "../../components/ui/toaster";
import { useAuth } from "../../context/AuthContext";
import { SOLO_ADMIN, tienePermiso } from "../../utils/permisos";

import { CrearProductoSection } from "../../components/productosComponents/CrearProductoSection";
import { ListaProductosDesktop } from "../../components/productosComponents/ListaProductosDesktop";
import { ListaProductosMobile } from "../../components/productosComponents/ListaProductosMobile";
import { ModalEditarProducto } from "../../components/productosComponents/ModalEditarProducto";

export function Productos() {
  const { usuario } = useAuth();
  // POST/PATCH /productos son SOLO_ADMIN en el backend
  const puedeGestionar = tienePermiso(usuario?.rol_usuario, SOLO_ADMIN);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

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
    productosApi
      .listar(!mostrarInactivos)
      .then(setProductos)
      .catch((error) => {
        const mensaje = error instanceof ApiError ? error.message : "Error al cargar productos";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      })
      .finally(() => setCargando(false));
  };

  useEffect(cargar, [mostrarInactivos]);

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
        <CrearProductoSection
          nombre={nombre} setNombre={setNombre}
          descripcion={descripcion} setDescripcion={setDescripcion}
          precioBase={precioBase} setPrecioBase={setPrecioBase}
          precioExtra={precioExtra} setPrecioExtra={setPrecioExtra}
          unidadMinima={unidadMinima} setUnidadMinima={setUnidadMinima}
          stockTotal={stockTotal} setStockTotal={setStockTotal}
          creando={creando} manejarCrear={manejarCrear}
        />
      )}

      {puedeGestionar && (
        <label className="checkbox-row" style={{ alignSelf: "flex-end" }}>
          <input 
            type="checkbox" 
            checked={mostrarInactivos} 
            onChange={(e) => setMostrarInactivos(e.target.checked)} 
          />
          <span className="text-sm">Mostrar productos inactivos</span>
        </label>
      )}

      <ListaProductosDesktop
        productos={productos}
        cargando={cargando}
        puedeGestionar={puedeGestionar}
        abrirModalEdicion={abrirModalEdicion}
      />

      <ListaProductosMobile
        productos={productos}
        cargando={cargando}
        puedeGestionar={puedeGestionar}
        abrirModalEdicion={abrirModalEdicion}
      />

      <ModalEditarProducto
        productoEditando={productoEditando}
        editNombre={editNombre} setEditNombre={setEditNombre}
        editDescripcion={editDescripcion} setEditDescripcion={setEditDescripcion}
        editPrecioBase={editPrecioBase} setEditPrecioBase={setEditPrecioBase}
        editPrecioExtra={editPrecioExtra} setEditPrecioExtra={setEditPrecioExtra}
        editUnidadMinima={editUnidadMinima} setEditUnidadMinima={setEditUnidadMinima}
        editStockTotal={editStockTotal} setEditStockTotal={setEditStockTotal}
        guardandoEdicion={guardandoEdicion} cambiandoEstado={cambiandoEstado}
        manejarCambiarEstado={manejarCambiarEstado} manejarGuardarEdicion={manejarGuardarEdicion}
        cerrarModal={cerrarModal}
      />

    </div>
  );
}
