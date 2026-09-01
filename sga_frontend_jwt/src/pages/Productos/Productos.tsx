import { useEffect, useState } from "react";

import { productosApi } from "../../api/productos";
import { ApiError } from "../../api/client";
import type { Producto } from "../../interfaces/Producto";
import { toaster } from "../../components/ui/toaster";
import { InputMoneda } from "../../components/inputs/InputMoneda";

export function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioBase, setPrecioBase] = useState(0);
  const [stockTotal, setStockTotal] = useState(1);
  const [creando, setCreando] = useState(false);

  const cargar = () => {
    setCargando(true);
    productosApi
      .listar()
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
        stock_total: stockTotal,
      });

      toaster.create({ title: "Producto creado", type: "success" });

      setNombre("");
      setDescripcion("");
      setPrecioBase(0);
      setStockTotal(1);

      cargar();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : "No se pudo crear el producto";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="stack gap-8">
      <h1 className="heading-xl">Productos</h1>

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

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio base</th>
              <th>Stock total</th>
              <th>Alquilado</th>
              <th>Disponible</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id_producto}>
                <td>{p.id_producto}</td>
                <td>{p.nombre_producto}</td>
                <td>${p.precio_base_producto.toLocaleString("es-CO")}</td>
                <td>{p.stock_total}</td>
                <td>{p.stock_alquilado}</td>
                <td>{p.stock_disponible}</td>
                <td>
                  <span className={`badge ${p.estado_registro ? "" : "badge-gray"}`}>
                    {p.estado_registro ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!cargando && productos.length === 0 && (
          <p className="table-empty">No hay productos registrados.</p>
        )}
      </div>
    </div>
  );
}
