// DATOS SIMULADOS — ficticios. No provienen del backend del SGA.
// Fechas relativas a "hoy" para que los escenarios (vencido, próximo a vencer,
// etc.) sean siempre válidos al probar. Incluye alquileres CANCELADOS que no
// deben aparecer en la app (decisión 3.2).
import type { Alquiler, ClienteResumen, DetalleAlquiler, EstadoAlquiler } from "../../types/models";
import { calcularVencimiento, hoyISO, sumarDias } from "../../domain/fechas.ts";

const HOY = hoyISO();

const CLIENTES: Record<string, ClienteResumen> = {
  c1: { id_usuario_cliente: "1000000001", tipo_documento: "CC", nombres_cliente: "Marta Lucía", apellidos_cliente: "Quintero Ruiz", telefono_usuario: "3000000001" },
  c2: { id_usuario_cliente: "1000000002", tipo_documento: "CC", nombres_cliente: "Jorge Andrés", apellidos_cliente: "Peña Salcedo", telefono_usuario: "3000000002" },
  c3: { id_usuario_cliente: "900000003", tipo_documento: "NIT", nombres_cliente: "Constructora", apellidos_cliente: "Horizonte S.A.S.", telefono_usuario: "3000000003" },
  c4: { id_usuario_cliente: "1000000004", tipo_documento: "CC", nombres_cliente: "Camila", apellidos_cliente: "Ortiz Beltrán", telefono_usuario: "3000000004" },
  c5: { id_usuario_cliente: "1000000005", tipo_documento: "CE", nombres_cliente: "Luis Fernando", apellidos_cliente: "Cárdenas Mora", telefono_usuario: "3000000005" },
};

let idDetalle = 1;
function linea(
  id_producto: number,
  nombre_producto: string,
  cantidad_productos: number,
  precio_base_producto: number,
  unidad: DetalleAlquiler["unidad_minima_alquiler"],
  precio_conjunto: number,
  extra = false,
): DetalleAlquiler {
  return {
    id_detalle_alquiler: idDetalle++,
    id_producto,
    nombre_producto,
    cantidad_productos,
    precio_base_producto,
    unidad_minima_alquiler: unidad,
    precio_conjunto,
    es_producto_extra: extra,
  };
}

interface Def {
  id: number;
  estado: EstadoAlquiler;
  inicioOffset: number; // días respecto a hoy
  dias: number;
  cliente: string;
  direccion: string;
  barrio: string;
  deposito: number;
  precio: number;
  seLleva: boolean;
  seRecoge: boolean;
  detalles: DetalleAlquiler[];
}

function crear(d: Def): Alquiler {
  const inicio = sumarDias(HOY, d.inicioOffset);
  return {
    id_alquiler: d.id,
    estado_alquiler: d.estado,
    barrio: d.barrio,
    direccion: d.direccion,
    deposito: d.deposito,
    precio_alquiler: d.precio,
    fecha_inicio: inicio,
    tiempo_alquiler_dias: d.dias,
    fecha_vencimiento: calcularVencimiento(inicio, d.dias),
    se_lleva: d.seLleva,
    se_recoge: d.seRecoge,
    cliente: CLIENTES[d.cliente],
    detalles: d.detalles,
  };
}

export const ALQUILERES_MOCK: Alquiler[] = [
  // Pendientes de entrega
  crear({ id: 101, estado: "pendiente", inicioOffset: 1, dias: 14, cliente: "c1", direccion: "Calle 45 # 12-30", barrio: "Chapinero", deposito: 200000, precio: 480000, seLleva: true, seRecoge: true,
    detalles: [linea(1, "Andamio multidireccional 2 m", 6, 8000, "SEMANA", 96000), linea(2, "Tablón metálico 2.5 m", 12, 3000, "SEMANA", 72000)] }),
  crear({ id: 102, estado: "pendiente", inicioOffset: 0, dias: 7, cliente: "c3", direccion: "Carrera 80 # 6-15 Torre B", barrio: "Kennedy", deposito: 350000, precio: 910000, seLleva: true, seRecoge: false,
    detalles: [linea(1, "Andamio multidireccional 2 m", 20, 8000, "SEMANA", 160000), linea(3, "Rueda con freno", 8, 2500, "SEMANA", 20000), linea(4, "Escalera de acceso", 2, 5000, "SEMANA", 10000, true)] }),
  // Activos
  crear({ id: 103, estado: "activo", inicioOffset: -6, dias: 7, cliente: "c2", direccion: "Calle 127 # 15-40", barrio: "Usaquén", deposito: 150000, precio: 320000, seLleva: true, seRecoge: true,
    detalles: [linea(1, "Andamio multidireccional 2 m", 4, 8000, "SEMANA", 32000)] }), // vence hoy
  crear({ id: 104, estado: "activo", inicioOffset: -12, dias: 14, cliente: "c4", direccion: "Transversal 93 # 53-32", barrio: "Engativá", deposito: 180000, precio: 540000, seLleva: false, seRecoge: true,
    detalles: [linea(2, "Tablón metálico 2.5 m", 10, 3000, "SEMANA", 60000), linea(3, "Rueda con freno", 4, 2500, "SEMANA", 20000)] }), // vence en 1 día
  crear({ id: 105, estado: "activo", inicioOffset: -5, dias: 7, cliente: "c5", direccion: "Avenida Boyacá # 65-20", barrio: "Suba", deposito: 100000, precio: 275000, seLleva: true, seRecoge: true,
    detalles: [linea(1, "Andamio multidireccional 2 m", 3, 8000, "SEMANA", 24000)] }), // vence en 1... (inicio -5, 7 días => +1)
  crear({ id: 106, estado: "activo", inicioOffset: -3, dias: 30, cliente: "c1", direccion: "Calle 19 # 4-50", barrio: "La Candelaria", deposito: 400000, precio: 1250000, seLleva: true, seRecoge: true,
    detalles: [linea(1, "Andamio multidireccional 2 m", 15, 8000, "SEMANA", 480000), linea(2, "Tablón metálico 2.5 m", 30, 3000, "SEMANA", 360000)] }), // largo plazo
  crear({ id: 107, estado: "activo", inicioOffset: -2, dias: 5, cliente: "c3", direccion: "Calle 170 # 54-10", barrio: "Suba", deposito: 120000, precio: 300000, seLleva: true, seRecoge: true,
    detalles: [linea(3, "Rueda con freno", 12, 2500, "DIA", 30000)] }), // vence en 2 días
  // Vencidos
  crear({ id: 108, estado: "vencido", inicioOffset: -20, dias: 14, cliente: "c2", direccion: "Carrera 7 # 72-41", barrio: "Chapinero", deposito: 220000, precio: 600000, seLleva: true, seRecoge: true,
    detalles: [linea(1, "Andamio multidireccional 2 m", 8, 8000, "SEMANA", 128000), linea(2, "Tablón metálico 2.5 m", 8, 3000, "SEMANA", 48000)] }),
  crear({ id: 109, estado: "vencido", inicioOffset: -9, dias: 7, cliente: "c4", direccion: "Diagonal 40 Sur # 25-18", barrio: "Restrepo", deposito: 90000, precio: 210000, seLleva: false, seRecoge: true,
    detalles: [linea(1, "Andamio multidireccional 2 m", 2, 8000, "SEMANA", 16000)] }),
  // Ya recogido / terminado (no cancelados: se descargan, decisión 3.2)
  crear({ id: 110, estado: "recogido", inicioOffset: -25, dias: 14, cliente: "c5", direccion: "Calle 100 # 8A-55", barrio: "Chicó", deposito: 160000, precio: 420000, seLleva: true, seRecoge: true,
    detalles: [linea(1, "Andamio multidireccional 2 m", 5, 8000, "SEMANA", 40000)] }),
  crear({ id: 111, estado: "terminado", inicioOffset: -40, dias: 21, cliente: "c1", direccion: "Carrera 50 # 20-12", barrio: "Teusaquillo", deposito: 130000, precio: 380000, seLleva: true, seRecoge: true,
    detalles: [linea(2, "Tablón metálico 2.5 m", 6, 3000, "SEMANA", 18000)] }),
  // CANCELADOS — no deben aparecer en la app
  crear({ id: 112, estado: "cancelado", inicioOffset: 3, dias: 7, cliente: "c3", direccion: "Calle 13 # 68-90", barrio: "Puente Aranda", deposito: 100000, precio: 250000, seLleva: true, seRecoge: true,
    detalles: [linea(1, "Andamio multidireccional 2 m", 3, 8000, "SEMANA", 24000)] }),
  crear({ id: 113, estado: "cancelado", inicioOffset: -15, dias: 14, cliente: "c4", direccion: "Carrera 30 # 45-03", barrio: "Teusaquillo", deposito: 100000, precio: 300000, seLleva: false, seRecoge: false,
    detalles: [linea(3, "Rueda con freno", 6, 2500, "SEMANA", 15000)] }),
];
