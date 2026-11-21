// Lógica de negocio pura del módulo móvil sobre alquileres.
// Las imports relativas usan extensión .ts para poder ejecutarse con
// `node --test` (ver tests/). Metro y tsc las aceptan.
import type { Alquiler, EstadoAlquiler } from "../types/models";
import { diferenciaDias } from "./fechas.ts";

// Decisión del propietario: "próximos a vencer" = dos días o menos.
export const DIAS_ALERTA_PROXIMO_VENCER = 2;

// Decisión 3.2: se descargan/consultan todos los alquileres NO cancelados.
export function esVisibleEnMovil(a: Alquiler): boolean {
  return a.estado_alquiler !== "cancelado";
}

// Entrega: únicamente alquileres pendientes. Es completa (sin edición de
// productos ni cantidades).
export function puedeRegistrarEntrega(estado: EstadoAlquiler): boolean {
  return estado === "pendiente";
}

// Recogida: únicamente alquileres activos o vencidos.
export function puedeRegistrarRecogida(estado: EstadoAlquiler): boolean {
  return estado === "activo" || estado === "vencido";
}

export function esProximoAVencer(a: Alquiler, hoy: string): boolean {
  if (a.estado_alquiler !== "activo") return false;
  const dias = diferenciaDias(hoy, a.fecha_vencimiento);
  return dias >= 0 && dias <= DIAS_ALERTA_PROXIMO_VENCER;
}

export interface ResumenInicio {
  vencidos: Alquiler[];
  pendientesEntrega: Alquiler[];
  proximosAVencer: Alquiler[];
}

export function resumenInicio(alquileres: Alquiler[], hoy: string): ResumenInicio {
  const visibles = alquileres.filter(esVisibleEnMovil);
  return {
    vencidos: ordenarPorVencimiento(visibles.filter((a) => a.estado_alquiler === "vencido")),
    pendientesEntrega: ordenarPorVencimiento(
      visibles.filter((a) => puedeRegistrarEntrega(a.estado_alquiler)),
    ),
    proximosAVencer: ordenarPorVencimiento(visibles.filter((a) => esProximoAVencer(a, hoy))),
  };
}

function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Búsqueda por ID, cliente, dirección y barrio.
export function buscar(alquileres: Alquiler[], texto: string): Alquiler[] {
  const q = normalizar(texto);
  if (!q) return alquileres;
  return alquileres.filter((a) => {
    const campos = [
      String(a.id_alquiler),
      `${a.cliente.nombres_cliente} ${a.cliente.apellidos_cliente}`,
      a.direccion,
      a.barrio,
    ];
    return campos.some((c) => normalizar(c).includes(q));
  });
}

export function filtrarPorEstados(alquileres: Alquiler[], estados: EstadoAlquiler[]): Alquiler[] {
  if (estados.length === 0) return alquileres;
  return alquileres.filter((a) => estados.includes(a.estado_alquiler));
}

export function ordenarPorVencimiento(alquileres: Alquiler[], ascendente = true): Alquiler[] {
  const signo = ascendente ? 1 : -1;
  return [...alquileres].sort(
    (a, b) =>
      signo * a.fecha_vencimiento.localeCompare(b.fecha_vencimiento) ||
      a.id_alquiler - b.id_alquiler,
  );
}

export type Tono = "exito" | "alerta" | "peligro" | "neutro";

export function describirVencimiento(a: Alquiler, hoy: string): { texto: string; tono: Tono } {
  const dias = diferenciaDias(hoy, a.fecha_vencimiento);
  if (a.estado_alquiler === "vencido") {
    const atraso = Math.max(0, -dias);
    return { texto: atraso === 0 ? "Vencido hoy" : `Vencido hace ${atraso} día(s)`, tono: "peligro" };
  }
  if (a.estado_alquiler === "activo") {
    if (dias <= DIAS_ALERTA_PROXIMO_VENCER) {
      return { texto: dias <= 0 ? "Vence hoy" : `Vence en ${dias} día(s)`, tono: "alerta" };
    }
    return { texto: `${dias} día(s) restantes`, tono: "exito" };
  }
  return { texto: "", tono: "neutro" };
}

// HU-03 CA-5: duración en días o semanas.
export function duracionLegible(dias: number): string {
  if (dias % 7 === 0) {
    const s = dias / 7;
    return `${s} semana${s === 1 ? "" : "s"} (${dias} días)`;
  }
  return `${dias} día${dias === 1 ? "" : "s"}`;
}

export function modalidadLogistica(a: Pick<Alquiler, "se_lleva" | "se_recoge">): string {
  if (a.se_lleva && a.se_recoge) return "Se lleva y se recoge";
  if (a.se_lleva) return "Se lleva";
  if (a.se_recoge) return "Se recoge";
  return "El cliente retira y devuelve";
}

export const ETIQUETA_ESTADO: Record<EstadoAlquiler, string> = {
  pendiente: "Pendiente de entrega",
  activo: "Activo",
  vencido: "Vencido",
  recogido: "Recogido",
  terminado: "Terminado",
  cancelado: "Cancelado",
};
