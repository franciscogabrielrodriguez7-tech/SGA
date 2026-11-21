// Escenario simulado activo (solo para pruebas con datos mock).
// No tiene equivalente en producción: desaparece al conectar la API real.
export type EscenarioMock = "normal" | "vacio" | "error";

let actual: EscenarioMock = "normal";
const suscriptores = new Set<() => void>();

export function obtenerEscenario(): EscenarioMock {
  return actual;
}

export function fijarEscenario(e: EscenarioMock): void {
  actual = e;
  suscriptores.forEach((f) => f());
}

export function suscribirEscenario(f: () => void): () => void {
  suscriptores.add(f);
  return () => {
    suscriptores.delete(f);
  };
}
