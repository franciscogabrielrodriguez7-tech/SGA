import { apiRequest } from "./client";
import type { Producto, ProductoCreatePayload } from "../interfaces/Producto";

export const productosApi = {
  listar(soloActivos = true) {
    return apiRequest<Producto[]>("/productos", {
      params: { solo_activos: soloActivos },
    });
  },

  consultar(idProducto: number) {
    return apiRequest<Producto>(`/productos/${idProducto}`);
  },

  crear(payload: ProductoCreatePayload) {
    return apiRequest<Pick<Producto, "id_producto" | "nombre_producto" | "stock_total">>(
      "/productos",
      {
        method: "POST",
        body: payload,
      },
    );
  },

  actualizar(idProducto: number, payload: Partial<ProductoCreatePayload>) {
    return apiRequest<Pick<Producto, "id_producto" | "stock_total" | "stock_alquilado">>(
      `/productos/${idProducto}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
  },
};
