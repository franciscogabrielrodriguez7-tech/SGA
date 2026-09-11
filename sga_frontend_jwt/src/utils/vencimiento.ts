import type { Alquiler } from "../interfaces/Alquiler";

// Umbral de "por vencer" en amarillo — mismo valor por defecto que usa
// el backend para /alquileres/proximos-vencer (ver
// alquileres_proximos_a_vencer(dias=2) en alquiler_controller.py), así
// el badge de esta pantalla y esa alerta cuentan la misma historia.
const DIAS_ALERTA_PROXIMO_VENCIMIENTO = 2;

export type TonoVencimiento = "success" | "warning" | "danger" | "neutral";

export interface EtiquetaVencimiento {
  texto: string;
  tono: TonoVencimiento;
}

function diferenciaEnDias(fechaIso: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fecha = new Date(fechaIso + "T00:00:00");

  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.round((fecha.getTime() - hoy.getTime()) / msPorDia);
}

// Calcula la etiqueta de estado + días para mostrar en listas y en el
// detalle del alquiler. Es puramente informativo (UX): el estado real
// y sus transiciones las sigue determinando el backend
// (verificar_y_actualizar_vencidos), esto solo traduce
// fecha_vencimiento a algo legible.
export function calcularEtiquetaVencimiento(alquiler: Alquiler): EtiquetaVencimiento {
  if (alquiler.estado_alquiler === "vencido") {
    const diasVencido = Math.max(0, -diferenciaEnDias(alquiler.fecha_vencimiento));
    return {
      texto: diasVencido === 0 ? "Vencido hoy" : `Vencido hace ${diasVencido} día(s)`,
      tono: "danger",
    };
  }

  if (alquiler.estado_alquiler === "activo") {
    const diasRestantes = diferenciaEnDias(alquiler.fecha_vencimiento);

    if (diasRestantes <= DIAS_ALERTA_PROXIMO_VENCIMIENTO) {
      return {
        texto: diasRestantes <= 0 ? "Vence hoy" : `Vence en ${diasRestantes} día(s)`,
        tono: "warning",
      };
    }

    return { texto: `Activo: ${diasRestantes} día(s) restantes`, tono: "success" };
  }

  const etiquetas: Record<string, string> = {
    pendiente: "Pendiente",
    recogido: "Recogido",
    terminado: "Terminado",
    cancelado: "Cancelado",
  };

  return { texto: etiquetas[alquiler.estado_alquiler] ?? alquiler.estado_alquiler, tono: "neutral" };
}

export function claseBadgePorTono(tono: TonoVencimiento): string {
  if (tono === "neutral") return "badge";
  return `badge badge-${tono}`;
}
