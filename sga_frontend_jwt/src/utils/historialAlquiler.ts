import type {
  EventoAuditoriaAlquiler,
  SnapshotAlquilerAuditoria,
} from "../interfaces/Alquiler";

// ============================================================================
// historialAlquiler.ts — clasifica los eventos de auditoria_sistema de un
// alquiler en categorías legibles para la sección "Historial y trazabilidad".
// ----------------------------------------------------------------------------
// No existe tabla "renovacion": el backend solo guarda el diff completo de la
// fila (to_jsonb(OLD) / to_jsonb(NEW)). Aquí se infiere qué pasó comparando
// ambos snapshots. Un mismo evento puede caer en varias categorías (p. ej. una
// renovación que reactiva un alquiler 'vencido' es renovación + cambio de
// estado), por eso `categorias` es un arreglo.
// ============================================================================

export type CategoriaEvento =
  | "creacion"
  | "renovacion"
  | "estado"
  | "edicion"
  | "eliminacion";

export type FiltroHistorial = "todos" | "renovacion" | "estado" | "edicion";

export interface CambioCampo {
  campo: string;
  etiqueta: string;
  antes: string;
  despues: string;
}

export interface EventoClasificado {
  evento: EventoAuditoriaAlquiler;
  categorias: CategoriaEvento[];
  responsable: string;
  esSistema: boolean;
  renovacion?: {
    diasAgregados: number;
    duracionAnterior: number;
    duracionNueva: number;
    precioAnterior: number | null;
    precioNuevo: number | null;
  };
  estado?: { antes: string; despues: string };
  ediciones: CambioCampo[];
}

// Columnas que cambian en cada UPDATE o que no aportan al usuario final.
const CAMPOS_IGNORADOS = new Set([
  "fecha_actualizacion",
  "fecha_creacion",
  "id_alquiler",
]);

const ETIQUETAS_CAMPO: Record<string, string> = {
  barrio: "Barrio",
  direccion: "Dirección",
  deposito: "Depósito",
  precio_alquiler: "Precio del alquiler",
  fecha_inicio: "Fecha de inicio",
  tiempo_alquiler_dias: "Duración (días)",
  se_lleva: "Incluye entrega",
  se_recoge: "Incluye recogida",
  id_usuario_cliente: "Cliente",
  id_usuario_creador: "Creador",
  estado_registro: "Registro activo",
  estado_alquiler: "Estado",
};

const CAMPOS_MONEDA = new Set(["deposito", "precio_alquiler"]);

export const ETIQUETAS_FILTRO: Record<FiltroHistorial, string> = {
  todos: "Todos",
  renovacion: "Renovaciones",
  estado: "Cambios de estado",
  edicion: "Ediciones",
};

export const ETIQUETAS_CATEGORIA: Record<CategoriaEvento, string> = {
  creacion: "Creación",
  renovacion: "Renovación",
  estado: "Cambio de estado",
  edicion: "Edición de datos",
  eliminacion: "Eliminación",
};

export function formatearMoneda(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}

export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;

  return fecha.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function aNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function formatearValor(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";

  if (CAMPOS_MONEDA.has(campo)) {
    const numero = aNumero(valor);
    return numero === null ? String(valor) : formatearMoneda(numero);
  }

  return String(valor);
}

function sonIguales(a: unknown, b: unknown): boolean {
  // jsonb puede devolver NUMERIC como número; se normaliza para no marcar
  // como "editado" un 100 vs 100.0.
  const na = aNumero(a);
  const nb = aNumero(b);
  if (na !== null && nb !== null) return na === nb;

  return JSON.stringify(a) === JSON.stringify(b);
}

function camposModificados(
  antes: SnapshotAlquilerAuditoria,
  despues: SnapshotAlquilerAuditoria,
): string[] {
  const claves = new Set([...Object.keys(antes), ...Object.keys(despues)]);

  return [...claves].filter(
    (campo) => !CAMPOS_IGNORADOS.has(campo) && !sonIguales(antes[campo], despues[campo]),
  );
}

function nombreResponsable(evento: EventoAuditoriaAlquiler): string {
  if (!evento.id_usuario_accion) return "Sistema (automático)";

  const nombre = [evento.nombres_usuario_accion, evento.apellidos_usuario_accion]
    .filter(Boolean)
    .join(" ")
    .trim();

  return nombre || evento.id_usuario_accion;
}

export function clasificarEvento(evento: EventoAuditoriaAlquiler): EventoClasificado {
  const base: EventoClasificado = {
    evento,
    categorias: [],
    responsable: nombreResponsable(evento),
    esSistema: !evento.id_usuario_accion,
    ediciones: [],
  };

  if (evento.tipo_operacion === "INSERT") {
    base.categorias.push("creacion");
    return base;
  }

  if (evento.tipo_operacion === "DELETE") {
    base.categorias.push("eliminacion");
    return base;
  }

  const antes = evento.datos_anteriores ?? {};
  const despues = evento.datos_nuevos ?? {};
  const modificados = camposModificados(antes, despues);

  // Renovación: aumentó la duración de un alquiler que ya estaba en obra
  // ('activo' o 'vencido'). En 'pendiente' los equipos no han salido de
  // bodega, así que ese aumento es un ajuste del pedido (edición), igual
  // que como lo trata actualizar_alquiler en el backend. Si además cambió
  // el precio, se considera parte de la misma renovación.
  const duracionAnterior = aNumero(antes.tiempo_alquiler_dias);
  const duracionNueva = aNumero(despues.tiempo_alquiler_dias);
  const estabaEnObra = ["activo", "vencido"].includes(String(antes.estado_alquiler ?? ""));
  const esRenovacion =
    estabaEnObra &&
    duracionAnterior !== null &&
    duracionNueva !== null &&
    duracionNueva > duracionAnterior;

  if (esRenovacion) {
    base.categorias.push("renovacion");
    base.renovacion = {
      diasAgregados: duracionNueva - duracionAnterior,
      duracionAnterior,
      duracionNueva,
      precioAnterior: aNumero(antes.precio_alquiler),
      precioNuevo: aNumero(despues.precio_alquiler),
    };
  }

  if (modificados.includes("estado_alquiler")) {
    base.categorias.push("estado");
    base.estado = {
      antes: String(antes.estado_alquiler ?? "—"),
      despues: String(despues.estado_alquiler ?? "—"),
    };
  }

  const camposDeRenovacion = esRenovacion
    ? new Set(["tiempo_alquiler_dias", "precio_alquiler"])
    : new Set<string>();

  base.ediciones = modificados
    .filter((campo) => campo !== "estado_alquiler" && !camposDeRenovacion.has(campo))
    .map((campo) => ({
      campo,
      etiqueta: ETIQUETAS_CAMPO[campo] ?? campo,
      antes: formatearValor(campo, antes[campo]),
      despues: formatearValor(campo, despues[campo]),
    }));

  if (base.ediciones.length > 0) {
    base.categorias.push("edicion");
  }

  return base;
}

export function coincideConFiltro(item: EventoClasificado, filtro: FiltroHistorial): boolean {
  return filtro === "todos" || item.categorias.includes(filtro);
}

export function coincideConBusqueda(item: EventoClasificado, texto: string): boolean {
  const termino = texto.trim().toLowerCase();
  if (!termino) return true;

  const contenido = [
    item.responsable,
    item.evento.id_usuario_accion ?? "",
    ...item.categorias.map((c) => ETIQUETAS_CATEGORIA[c]),
    item.estado?.antes ?? "",
    item.estado?.despues ?? "",
    ...item.ediciones.flatMap((e) => [e.etiqueta, e.antes, e.despues]),
  ]
    .join(" ")
    .toLowerCase();

  return contenido.includes(termino);
}
