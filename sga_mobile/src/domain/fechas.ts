// Utilidades de fecha puras (sin dependencias de React Native) para poder
// probarlas con el test runner de Node.
// Nota: usan la zona horaria del dispositivo. La zona del negocio es
// America/Bogota (RN-AUD-01 del SGA); su tratamiento queda pendiente.

const MS_DIA = 86_400_000;

export function aISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function hoyISO(ahora: Date = new Date()): string {
  return aISO(ahora);
}

export function sumarDias(iso: string, dias: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + dias);
  return aISO(d);
}

export function diferenciaDias(desdeISO: string, hastaISO: string): number {
  return Math.round((parseISO(hastaISO).getTime() - parseISO(desdeISO).getTime()) / MS_DIA);
}

// RN-AUD-01 del SGA: fecha_vencimiento = fecha_inicio + (dias - 1)
export function calcularVencimiento(inicioISO: string, dias: number): string {
  return sumarDias(inicioISO, dias - 1);
}

export function formatearFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
