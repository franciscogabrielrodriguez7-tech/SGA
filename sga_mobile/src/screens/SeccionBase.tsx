import { ScrollView, Text, View } from "react-native";
import { BannerOrigen, Tarjeta, Titulo } from "./../components/ui";
import { espacio, useColores } from "../theme/theme";

// Diseño base de sección. NO implementada: se muestra el alcance aprobado
// que se construirá en entregas posteriores.
export default function SeccionBase({ titulo, items }: { titulo: string; items: string[] }) {
  const c = useColores();
  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      <BannerOrigen origen="simulado" />
      <ScrollView contentContainerStyle={{ padding: espacio.lg }}>
        <Tarjeta>
          <Text style={{ color: c.alerta, fontWeight: "700", marginBottom: 4 }}>Sección aún no implementada</Text>
          <Text style={{ color: c.textoSecundario }}>Solo diseño base de navegación. Sin funcionalidad todavía.</Text>
        </Tarjeta>
        <Titulo>{titulo} — alcance previsto del MVP</Titulo>
        {items.map((i) => (
          <Text key={i} style={{ color: c.texto, marginBottom: 6 }}>• {i}</Text>
        ))}
      </ScrollView>
    </View>
  );
}
