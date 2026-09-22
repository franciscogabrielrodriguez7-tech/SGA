import type { Dispatch, SetStateAction } from "react";

import { InputMoneda } from "../inputs/InputMoneda";

import {
  OPCIONES_UNIDAD_TIEMPO,
  type UnidadTiempo,
} from "../../utils/tiempoUi";

import type { DetalleProducto } from "../../interfaces/DetalleProducto";
import type { Producto } from "../../interfaces/Producto";

import { calcularPrecioConjunto } from "../../utils/precios";

interface ResumenAlquilerProps {
  cantidadTiempo: number;
  unidadTiempo: UnidadTiempo;

  detallesProducto: DetalleProducto[];
  productos: Producto[];

  tiempoAlquilerDias: number;

  totalProductos: number;
  costoEntrega: number;
  costoRecogida: number;
  deposito: number;

  precioSugerido: number;
  precioAlquilerFinal: number;
  setPrecioAlquiler: Dispatch<SetStateAction<number | null>>;
}

export function ResumenAlquiler({
  cantidadTiempo,
  unidadTiempo,
  detallesProducto,
  productos,
  tiempoAlquilerDias,
  totalProductos,
  costoEntrega,
  costoRecogida,
  deposito,
  precioSugerido,
  precioAlquilerFinal,
  setPrecioAlquiler,
}: ResumenAlquilerProps) {
  return (
    <>
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Resumen del alquiler
      </h2>

      <div className="card stack gap-3" style={{ marginBottom: 32 }}>
        <div className="hstack justify-between">
          <span>Tiempo de alquiler</span>
          <span>
            {cantidadTiempo}{" "}
            {OPCIONES_UNIDAD_TIEMPO.find(
              (op) => op.valor === unidadTiempo,
            )?.etiqueta.toLowerCase()}
          </span>
        </div>

        <div className="hstack justify-between">
          <span>Productos</span>
          <span>${totalProductos.toLocaleString("es-CO")}</span>
        </div>

        <ul
          className="stack gap-1"
          style={{
            marginTop: -4,
            marginBottom: 4,
            paddingLeft: 20,
          }}
        >
          {detallesProducto.map((detalle, indice) => {
            const productoActual = productos.find(
              (p) => p.id_producto === detalle.productoId,
            );

            if (!productoActual) return null;

            const precioUsar = detalle.esExtra
              ? productoActual.precio_base_extra
              : productoActual.precio_base_producto;

            const precioConjunto = calcularPrecioConjunto(
              precioUsar,
              productoActual.unidad_minima_alquiler,
              detalle.cantidad,
              tiempoAlquilerDias,
            );

            return (
              <li
                key={indice}
                className="hstack justify-between text-sm text-muted"
              >
                <span>
                  {detalle.esExtra ? "Extra: " : ""}
                  {productoActual.nombre_producto} ({detalle.cantidad})
                </span>
                <span>${precioConjunto.toLocaleString("es-CO")}</span>
              </li>
            );
          })}
        </ul>

        <div className="hstack justify-between">
          <span>Entrega</span>
          <span>${costoEntrega.toLocaleString("es-CO")}</span>
        </div>

        <div className="hstack justify-between">
          <span>Recogida</span>
          <span>${costoRecogida.toLocaleString("es-CO")}</span>
        </div>

        <div className="hstack justify-between">
          <span>Depósito</span>
          <span>${deposito.toLocaleString("es-CO")}</span>
        </div>

        <div className="hstack justify-between text-bold">
          <span>Precio calculado</span>
          <span>${precioSugerido.toLocaleString("es-CO")}</span>
        </div>

        <div style={{ paddingTop: 12 }}>
          <label className="field-label">Precio final del alquiler</label>

          <InputMoneda
            value={precioAlquilerFinal}
            onChange={(nuevoPrecio) => setPrecioAlquiler(nuevoPrecio)}
          />
        </div>
      </div>
    </>
  );
}