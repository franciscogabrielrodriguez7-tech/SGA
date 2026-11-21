import { useColorScheme } from "react-native";
import type { Tono } from "../domain/alquileres";

export interface Colores {
  fondo: string;
  superficie: string;
  texto: string;
  textoSecundario: string;
  borde: string;
  primario: string;
  primarioTexto: string;
  exito: string;
  alerta: string;
  peligro: string;
  neutro: string;
  simulado: string;
  simuladoFondo: string;
  /** Alias de 'peligro' para consistencia con nombres en inglés */
  error: string;
  /** Alias de 'alerta' para textos de advertencia */
  advertencia: string;
}

const claro: Colores = {
  fondo: "#F3F5F7",
  superficie: "#FFFFFF",
  texto: "#14202B",
  textoSecundario: "#566573",
  borde: "#D5DCE3",
  primario: "#0B5FA5",
  primarioTexto: "#FFFFFF",
  exito: "#1E7B46",
  alerta: "#B26A00",
  peligro: "#B3261E",
  neutro: "#566573",
  simulado: "#6B3FC4",
  simuladoFondo: "#EFE9FB",
  error: "#B3261E",
  advertencia: "#B26A00",
};

const oscuro: Colores = {
  fondo: "#10161C",
  superficie: "#1A232C",
  texto: "#EAF0F5",
  textoSecundario: "#A3B1BE",
  borde: "#2C3A47",
  primario: "#5AA9F0",
  primarioTexto: "#0A1620",
  exito: "#5BD08A",
  alerta: "#F0B34A",
  peligro: "#FF8A80",
  neutro: "#A3B1BE",
  simulado: "#C3A6FF",
  simuladoFondo: "#2A2140",
  error: "#FF8A80",
  advertencia: "#F0B34A",
};

export function useColores(): Colores {
  return useColorScheme() === "dark" ? oscuro : claro;
}

export function colorDeTono(c: Colores, tono: Tono): string {
  return tono === "exito" ? c.exito : tono === "alerta" ? c.alerta : tono === "peligro" ? c.peligro : c.neutro;
}

export const espacio = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
