/**
 * Pantalla de detalle de alquiler — SGA Móvil
 *
 * Muestra toda la información relevante del alquiler.
 * Los botones de entrega, recogida y mapa están habilitados en Entrega 2.
 *
 * Reglas de disponibilidad de operaciones:
 * - Registrar entrega: solo alquileres 'pendiente' (RNM-05)
 * - Registrar recogida: solo alquileres 'activo' o 'vencido' (RNM-06)
 * - Ver mapa: siempre disponible (placeholder simulado)
 *
 * No se muestra el empleado creador (HU-03 CA-9).
 */

import React, { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, Text, View } from "react-native";
import {
  BannerOrigen,
  Boton,
  Cargando,
  ErrorCarga,
  Etiqueta,
  Fila,
  Tarjeta,
  Titulo,
  Vacio,
} from "../components/ui";
import {
  describirVencimiento,
  duracionLegible,
  ETIQUETA_ESTADO,
  modalidadLogistica,
  puedeRegistrarEntrega,
  puedeRegistrarRecogida,
} from "../domain/alquileres";
import { formatearFecha, hoyISO } from "../domain/fechas";
import { useAsync } from "../hooks/useAsync";
import type { AlquileresStackParamList, AlquilerParaOperacion } from "../navigation/types";
import { alquileresService } from "../services";
import { suscribirEstadoSimulado } from "../services/mock/estadoSimulado";
import { espacio, useColores } from "../theme/theme";
import type { Alquiler } from "../types/models";

type Props = NativeStackScreenProps<AlquileresStackParamList, "Detalle">;

const moneda = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

/** Convierte Alquiler al formato requerido por las pantallas de operación */
function aAlquilerParaOperacion(a: Alquiler): AlquilerParaOperacion {
  return {
    id: a.id_alquiler,
    cliente_nombre: `${a.cliente.nombres_cliente} ${a.cliente.apellidos_cliente}`,
    direccion_entrega: a.direccion,
    barrio: a.barrio,
    estado: a.estado_alquiler,
    productos: a.detalles.map((d) => ({
      nombre: d.nombre_producto,
      cantidad: d.cantidad_productos,
    })),
  };
}

export default function DetalleAlquilerScreen({ route, navigation }: Props) {
  const c = useColores();
  const { id } = route.params;
  const [versionEstado, setVersionEstado] = useState(0);

  useEffect(() => {
    return suscribirEstadoSimulado(() => {
      setVersionEstado((v) => v + 1);
    });
  }, []);

  const { estado, recargar } = useAsync(() => alquileresService.obtener(id), [id, versionEstado]);

  if (estado.estado === "cargando") return <Cargando />;
  if (estado.estado === "error") return <ErrorCarga mensaje={estado.mensaje} onReintentar={recargar} />;
  const a = estado.datos.datos;
  if (!a) return <Vacio titulo="Alquiler no disponible" detalle="No existe o fue cancelado." />;

  const venc = describirVencimiento(a, hoyISO());
  const puedeEntrega = puedeRegistrarEntrega(a.estado_alquiler);
  const puedeRecogida = puedeRegistrarRecogida(a.estado_alquiler);
  const alquilerOp = aAlquilerParaOperacion(a);

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      <BannerOrigen origen={estado.datos.origen} actualizadoEn={estado.datos.actualizadoEn} />
      <ScrollView contentContainerStyle={{ padding: espacio.lg }}>

        {/* Tarjeta principal */}
        <Tarjeta>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: c.texto, fontSize: 20, fontWeight: "800" }}>#{a.id_alquiler}</Text>
            <Etiqueta texto={ETIQUETA_ESTADO[a.estado_alquiler]} tono={venc.tono} />
          </View>
          <Fila etiqueta="Precio del alquiler" valor={moneda(a.precio_alquiler)} />
          <Fila etiqueta="Depósito" valor={moneda(a.deposito)} />
        </Tarjeta>

        <Titulo>Cliente</Titulo>
        <Tarjeta>
          <Fila etiqueta="Nombre" valor={`${a.cliente.nombres_cliente} ${a.cliente.apellidos_cliente}`} />
          <Fila etiqueta="Teléfono" valor={a.cliente.telefono_usuario} />
          <Fila etiqueta={`Documento (${a.cliente.tipo_documento})`} valor={a.cliente.id_usuario_cliente} />
        </Tarjeta>

        <Titulo>Alquiler</Titulo>
        <Tarjeta>
          <Fila etiqueta="Inicio" valor={formatearFecha(a.fecha_inicio)} />
          <Fila etiqueta="Vencimiento" valor={formatearFecha(a.fecha_vencimiento)} />
          <Fila etiqueta="Duración" valor={duracionLegible(a.tiempo_alquiler_dias)} />
          <Fila etiqueta="Dirección" valor={a.direccion} />
          <Fila etiqueta="Barrio" valor={a.barrio} />
          <Fila etiqueta="Modalidad logística" valor={modalidadLogistica(a)} />
        </Tarjeta>

        <Titulo>Productos</Titulo>
        {a.detalles.map((d) => (
          <Tarjeta key={d.id_detalle_alquiler}>
            <Text style={{ color: c.texto, fontWeight: "700" }}>
              {d.nombre_producto}
              {d.es_producto_extra ? " (extra)" : ""}
            </Text>
            <Fila etiqueta="Cantidad" valor={String(d.cantidad_productos)} />
            <Fila etiqueta={`Precio por ${d.unidad_minima_alquiler.toLowerCase()}`} valor={moneda(d.precio_base_producto)} />
            <Fila etiqueta="Precio conjunto" valor={moneda(d.precio_conjunto)} />
          </Tarjeta>
        ))}

        {/* Ubicación — botón activo con mapa simulado (DEP-INT-04) */}
        <Titulo>Ubicación</Titulo>
        <View style={{ flexDirection: "row", gap: espacio.sm, marginBottom: espacio.lg }}>
          <View style={{ flex: 1 }}>
            <Boton
              titulo="Ver en mapa"
              secundario
              onPress={() => navigation.navigate("Mapa", { alquiler: alquilerOp })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Boton titulo="Consultar ruta" secundario deshabilitado />
          </View>
        </View>
        <Text style={{ color: c.textoSecundario, marginBottom: espacio.lg, fontSize: 12 }}>
          DEP-INT-04: mapa simulado. Ruta pendiente de integración con proveedor GPS.
        </Text>

        {/* Operaciones */}
        <Titulo>Operaciones</Titulo>
        <View style={{ flexDirection: "row", gap: espacio.sm }}>
          <View style={{ flex: 1 }}>
            <Boton
              titulo="Registrar entrega"
              onPress={puedeEntrega
                ? () => navigation.navigate("Entrega", { alquiler: alquilerOp })
                : undefined}
              deshabilitado={!puedeEntrega}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Boton
              titulo="Registrar recogida"
              onPress={puedeRecogida
                ? () => navigation.navigate("Recogida", { alquiler: alquilerOp })
                : undefined}
              deshabilitado={!puedeRecogida}
            />
          </View>
        </View>
        <Text style={{ color: c.textoSecundario, marginTop: espacio.sm, fontSize: 12 }}>
          Entrega: {puedeEntrega ? "disponible (pendiente)" : "no disponible en este estado"}.{" "}
          Recogida: {puedeRecogida ? "disponible (activo/vencido)" : "no disponible en este estado"}.
        </Text>
      </ScrollView>
    </View>
  );
}
