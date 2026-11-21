import type { Alquiler, Resultado } from "../types/models";

// Contrato de acceso a datos de alquileres. Las pantallas dependen SOLO de
// esta interfaz. Hoy la implementa un adaptador simulado; después, un
// servicio conectado a la API (ver services/index.ts).
export interface AlquileresService {
  // Todos los alquileres NO cancelados (decisión 3.2).
  listar(): Promise<Resultado<Alquiler[]>>;
  obtener(id: number): Promise<Resultado<Alquiler | null>>;
}
