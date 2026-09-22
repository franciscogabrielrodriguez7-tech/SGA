import type { Dispatch, SetStateAction } from "react";

import { ProductoSelect } from "../productos/ProductoSelect";

import type { DetalleProducto } from "../../interfaces/DetalleProducto";
import type { Producto } from "../../interfaces/Producto";

import { calcularPrecioConjunto } from "../../utils/precios";

interface ProductosSectionProps {
  productos: Producto[];
  cargandoProductos: boolean;

  detallesProducto: DetalleProducto[];
  setDetallesProducto: Dispatch<SetStateAction<DetalleProducto[]>>;

  tiempoAlquilerDias: number;

  eliminarProducto: (indiceAEliminar: number) => void;
  agregarProducto: () => void;
}

export function ProductosSection({
  productos,
  cargandoProductos,
  detallesProducto,
  setDetallesProducto,
  tiempoAlquilerDias,
  eliminarProducto,
  agregarProducto,
}: ProductosSectionProps) {
  return (
    <>
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Productos
      </h2>

      {cargandoProductos && (
        <p className="text-muted">Cargando productos...</p>
      )}

      <div className="stack gap-4" style={{ marginBottom: 32 }}>
        {detallesProducto.map((detalle, indice) => {
          const productoActual = productos.find(
            (p) => p.id_producto === detalle.productoId,
          );

          const precioConjunto = productoActual
            ? calcularPrecioConjunto(
                detalle.esExtra
                  ? productoActual.precio_base_extra
                  : productoActual.precio_base_producto,
                productoActual.unidad_minima_alquiler,
                detalle.cantidad,
                tiempoAlquilerDias,
              )
            : 0;

          return (
            <div key={indice} className="card">
              <div className="grid grid-cols-1 grid-cols-3-md">
                <div>
                  <label className="field-label">Producto</label>

                  <ProductoSelect
                    productos={productos}
                    value={detalle.productoId}
                    onProductoChange={(idProducto) => {
                      setDetallesProducto((actuales) =>
                        actuales.map((d, i) =>
                          i === indice
                            ? { ...d, productoId: idProducto }
                            : d,
                        ),
                      );
                    }}
                  />

                  {productoActual && (
                    <p className="text-sm text-muted" style={{ marginTop: 4 }}>
                      $
                      {productoActual.precio_base_producto.toLocaleString(
                        "es-CO",
                      )}{" "}
                      /{" "}
                      {
                        {
                          DIA: "día",
                          SEMANA: "semana",
                          MES: "mes",
                        }[productoActual.unidad_minima_alquiler]
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label className="field-label">Cantidad</label>

                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={detalle.cantidad}
                    onChange={(e) => {
                      const cantidad = Number(e.target.value);

                      setDetallesProducto((actuales) =>
                        actuales.map((d, i) =>
                          i === indice ? { ...d, cantidad } : d,
                        ),
                      );
                    }}
                  />
                </div>

                <div>
                  <label className="field-label">Precio conjunto</label>

                  <input
                    className="input"
                    value={`$${precioConjunto.toLocaleString("es-CO")}`}
                    readOnly
                  />
                </div>
              </div>

              <label className="checkbox-row" style={{ marginTop: 16 }}>
                <input
                  type="checkbox"
                  checked={detalle.esExtra}
                  onChange={(e) => {
                    const esExtra = e.target.checked;

                    setDetallesProducto((actuales) =>
                      actuales.map((d, i) =>
                        i === indice ? { ...d, esExtra } : d,
                      ),
                    );
                  }}
                />
                Producto extra (permite repetir el mismo producto en otra
                línea)
              </label>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ marginTop: 16 }}
                onClick={() => eliminarProducto(indice)}
              >
                Eliminar producto
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="btn btn-outline"
          style={{ alignSelf: "flex-start" }}
          onClick={agregarProducto}
        >
          + Agregar producto
        </button>
      </div>
    </>
  );
}