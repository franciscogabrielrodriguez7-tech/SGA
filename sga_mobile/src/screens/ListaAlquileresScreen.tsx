import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { AlquilerCard } from "../components/AlquilerCard";
import { BannerOrigen, Cargando, ErrorCarga, Vacio } from "../components/ui";
import { buscar, ETIQUETA_ESTADO, filtrarPorEstados, ordenarPorVencimiento } from "../domain/alquileres";
import { useAsync } from "../hooks/useAsync";
import { useEscenarioMock } from "../hooks/useEscenarioMock";
import type { AlquileresStackParamList } from "../navigation/types";
import { alquileresService } from "../services";
import { suscribirEstadoSimulado } from "../services/mock/estadoSimulado";
import { espacio, useColores } from "../theme/theme";
import type { EstadoAlquiler } from "../types/models";

type Props = NativeStackScreenProps<AlquileresStackParamList, "Lista">;

// Cancelado no se ofrece: esos alquileres nunca llegan a la app.
const ESTADOS_FILTRO: EstadoAlquiler[] = ["pendiente", "activo", "vencido", "recogido", "terminado"];

export default function ListaAlquileresScreen({ navigation }: Props) {
  const c = useColores();
  const escenario = useEscenarioMock();
  const [versionEstado, setVersionEstado] = useState(0);

  useEffect(() => {
    return suscribirEstadoSimulado(() => {
      setVersionEstado((v) => v + 1);
    });
  }, []);

  const { estado, recargar } = useAsync(() => alquileresService.listar(), [escenario, versionEstado]);
  const [texto, setTexto] = useState("");
  const [estados, setEstados] = useState<EstadoAlquiler[]>([]);
  const [ascendente, setAscendente] = useState(true);

  const alternar = (e: EstadoAlquiler) =>
    setEstados((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));

  const visibles = useMemo(() => {
    if (estado.estado !== "ok") return [];
    return ordenarPorVencimiento(filtrarPorEstados(buscar(estado.datos.datos, texto), estados), ascendente);
  }, [estado, texto, estados, ascendente]);

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      <BannerOrigen origen="simulado" actualizadoEn={estado.estado === "ok" ? estado.datos.actualizadoEn : undefined} />
      <View style={{ padding: espacio.lg, paddingBottom: espacio.sm }}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Buscar por ID, cliente, dirección o barrio"
          placeholderTextColor={c.textoSecundario}
          style={{ borderWidth: 1, borderColor: c.borde, backgroundColor: c.superficie, color: c.texto, borderRadius: 10, padding: 10 }}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: espacio.sm, marginTop: espacio.sm }}>
          {ESTADOS_FILTRO.map((e) => {
            const on = estados.includes(e);
            return (
              <Pressable
                key={e}
                onPress={() => alternar(e)}
                style={{ borderWidth: 1, borderColor: c.primario, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: on ? c.primario : "transparent" }}
              >
                <Text style={{ color: on ? c.primarioTexto : c.primario, fontSize: 13 }}>{ETIQUETA_ESTADO[e]}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => setAscendente((a) => !a)} style={{ marginTop: espacio.sm }}>
          <Text style={{ color: c.primario, fontWeight: "600" }}>
            Orden por vencimiento: {ascendente ? "más próximo primero ↑" : "más lejano primero ↓"}
          </Text>
        </Pressable>
      </View>

      {estado.estado === "cargando" ? (
        <Cargando />
      ) : estado.estado === "error" ? (
        <ErrorCarga mensaje={estado.mensaje} onReintentar={recargar} />
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(a) => String(a.id_alquiler)}
          contentContainerStyle={{ padding: espacio.lg, paddingTop: espacio.sm, flexGrow: 1 }}
          ListEmptyComponent={
            <Vacio
              titulo={estado.datos.datos.length === 0 ? "No hay alquileres" : "Sin resultados"}
              detalle={estado.datos.datos.length === 0 ? "No hay alquileres descargados." : "Prueba con otra búsqueda o filtro."}
            />
          }
          renderItem={({ item }) => (
            <AlquilerCard alquiler={item} onPress={() => navigation.navigate("Detalle", { id: item.id_alquiler })} />
          )}
        />
      )}
    </View>
  );
}
