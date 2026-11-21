import { Text, View } from "react-native";
import { Etiqueta, Tarjeta } from "./ui";
import { describirVencimiento, ETIQUETA_ESTADO } from "../domain/alquileres";
import type { Tono } from "../domain/alquileres";
import type { Alquiler } from "../types/models";
import { formatearFecha, hoyISO } from "../domain/fechas";
import { useColores } from "../theme/theme";

const TONO_ESTADO: Record<Alquiler["estado_alquiler"], Tono> = {
  pendiente: "alerta",
  activo: "exito",
  vencido: "peligro",
  recogido: "neutro",
  terminado: "neutro",
  cancelado: "neutro",
};

export function AlquilerCard({ alquiler, onPress }: { alquiler: Alquiler; onPress: () => void }) {
  const c = useColores();
  const venc = describirVencimiento(alquiler, hoyISO());
  return (
    <Tarjeta onPress={onPress}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Text style={{ color: c.texto, fontWeight: "700", fontSize: 16 }}>Alquiler #{alquiler.id_alquiler}</Text>
        <Etiqueta texto={ETIQUETA_ESTADO[alquiler.estado_alquiler]} tono={TONO_ESTADO[alquiler.estado_alquiler]} />
      </View>
      <Text style={{ color: c.texto }}>
        {alquiler.cliente.nombres_cliente} {alquiler.cliente.apellidos_cliente}
      </Text>
      <Text style={{ color: c.textoSecundario }}>
        {alquiler.direccion} · {alquiler.barrio}
      </Text>
      <Text style={{ color: c.textoSecundario, marginTop: 4 }}>
        Vence: {formatearFecha(alquiler.fecha_vencimiento)}
        {venc.texto ? ` · ${venc.texto}` : ""}
      </Text>
    </Tarjeta>
  );
}
