import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import type { Tono } from "../domain/alquileres";
import type { OrigenDatos } from "../types/models";
import { colorDeTono, espacio, useColores } from "../theme/theme";

export function Tarjeta({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
}) {
  const c = useColores();
  const estilo = [estilos.tarjeta, { backgroundColor: c.superficie, borderColor: c.borde }, ...(Array.isArray(style) ? style : style ? [style] : [])];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...estilo, pressed && { opacity: 0.7 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={estilo}>{children}</View>;
}

export function Etiqueta({ texto, tono }: { texto: string; tono: Tono }) {
  const c = useColores();
  const color = colorDeTono(c, tono);
  return (
    <View style={[estilos.etiqueta, { borderColor: color }]}>
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{texto}</Text>
    </View>
  );
}

const TEXTO_ORIGEN: Record<OrigenDatos, string> = {
  simulado: "Datos SIMULADOS (mock) — no provienen del servidor",
  local: "Datos locales — pueden estar desactualizados",
  servidor: "Datos confirmados por el servidor",
};

// Diferencia datos simulados / locales / confirmados por el servidor.
export function BannerOrigen({ origen, actualizadoEn }: { origen: OrigenDatos; actualizadoEn?: string }) {
  const c = useColores();
  const hora = actualizadoEn ? new Date(actualizadoEn).toLocaleTimeString() : undefined;
  return (
    <View style={[estilos.banner, { backgroundColor: c.simuladoFondo }]}>
      <Text style={{ color: c.simulado, fontSize: 12, fontWeight: "600" }}>
        {TEXTO_ORIGEN[origen]}
        {hora ? ` · actualizado ${hora}` : ""}
      </Text>
    </View>
  );
}

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  const c = useColores();
  return (
    <View style={estilos.centro}>
      <ActivityIndicator color={c.primario} />
      <Text style={{ color: c.textoSecundario, marginTop: espacio.sm }}>{texto}</Text>
    </View>
  );
}

export function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  const c = useColores();
  return (
    <View style={estilos.centro}>
      <Text style={{ color: c.peligro, fontWeight: "700", marginBottom: espacio.xs }}>No se pudo cargar</Text>
      <Text style={{ color: c.textoSecundario, textAlign: "center", marginBottom: espacio.md }}>{mensaje}</Text>
      <Boton titulo="Reintentar" onPress={onReintentar} />
    </View>
  );
}

export function Vacio({ titulo, detalle }: { titulo: string; detalle?: string }) {
  const c = useColores();
  return (
    <View style={estilos.centro}>
      <Text style={{ color: c.texto, fontWeight: "700" }}>{titulo}</Text>
      {detalle ? <Text style={{ color: c.textoSecundario, textAlign: "center", marginTop: 4 }}>{detalle}</Text> : null}
    </View>
  );
}

export function Boton({
  titulo,
  etiqueta,
  onPress,
  deshabilitado,
  secundario,
  variante,
  style,
}: {
  /** Texto del botón — usar 'etiqueta' o 'titulo' (compatibilidad) */
  titulo?: string;
  etiqueta?: string;
  onPress?: () => void;
  deshabilitado?: boolean;
  /** Alias de 'secundario' para nueva API */
  variante?: "primario" | "secundario";
  secundario?: boolean;
  style?: object;
}) {
  const c = useColores();
  const esSecundario = secundario || variante === "secundario";
  const texto = etiqueta ?? titulo ?? "";
  return (
    <Pressable
      disabled={deshabilitado}
      onPress={onPress}
      style={[
        estilos.boton,
        esSecundario
          ? { borderColor: c.primario, borderWidth: 1 }
          : { backgroundColor: c.primario },
        deshabilitado && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={{ color: esSecundario ? c.primario : c.primarioTexto, fontWeight: "700" }}>{texto}</Text>
    </Pressable>
  );
}

export function Titulo({ children, texto }: { children?: ReactNode; texto?: string }) {
  const c = useColores();
  return (
    <Text style={{ color: c.texto, fontSize: 16, fontWeight: "700", marginBottom: espacio.sm }}>
      {texto ?? children}
    </Text>
  );
}

export function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const c = useColores();
  return (
    <View style={estilos.fila}>
      <Text style={{ color: c.textoSecundario, flex: 1 }}>{etiqueta}</Text>
      <Text style={{ color: c.texto, flex: 1.4, textAlign: "right", fontWeight: "600" }}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 12, padding: espacio.md, marginBottom: espacio.sm },
  etiqueta: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  banner: { paddingHorizontal: espacio.lg, paddingVertical: espacio.xs },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: espacio.xl },
  boton: { paddingVertical: 12, paddingHorizontal: espacio.lg, borderRadius: 10, alignItems: "center" },
  fila: { flexDirection: "row", paddingVertical: 4, gap: espacio.md },
});
