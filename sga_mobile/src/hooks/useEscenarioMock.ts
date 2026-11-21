import { useSyncExternalStore } from "react";
import { obtenerEscenario, suscribirEscenario } from "../data/mock/escenario";

export function useEscenarioMock() {
  return useSyncExternalStore(suscribirEscenario, obtenerEscenario);
}
