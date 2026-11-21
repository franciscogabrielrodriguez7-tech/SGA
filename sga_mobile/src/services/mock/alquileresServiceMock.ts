import { obtenerEscenario } from "../../data/mock/escenario.ts";
import { esVisibleEnMovil } from "../../domain/alquileres.ts";
import type { AlquileresService } from "../AlquileresService.ts";
import {
  obtenerAlquilerSimuladoPorId,
  obtenerAlquileresSimulados,
} from "./estadoSimulado.ts";

const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Adaptador SIMULADO. No hay API real detrás: origen = "simulado".
export const alquileresServiceMock: AlquileresService = {
  async listar() {
    await espera(250);
    const escenario = obtenerEscenario();
    if (escenario === "error") throw new Error("Error de conexión simulado");
    const base = escenario === "vacio" ? [] : obtenerAlquileresSimulados();
    return {
      datos: base.filter(esVisibleEnMovil),
      origen: "simulado",
      actualizadoEn: new Date().toISOString(),
    };
  },
  async obtener(id) {
    await espera(200);
    if (obtenerEscenario() === "error") throw new Error("Error de conexión simulado");
    const encontrado = obtenerAlquilerSimuladoPorId(id);
    const a = encontrado && esVisibleEnMovil(encontrado) ? encontrado : null;
    return { datos: a, origen: "simulado", actualizadoEn: new Date().toISOString() };
  },
};
