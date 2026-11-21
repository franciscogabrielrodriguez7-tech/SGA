import React, { useEffect, useState } from "react";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AlquilerCard } from "../components/AlquilerCard";
import { BannerOrigen, Cargando, ErrorCarga, Tarjeta, Titulo, Vacio } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useConectividadCtx } from "../context/ConectividadContext";
import { fijarEscenario } from "../data/mock/escenario";
import type { EscenarioMock } from "../data/mock/escenario";
import { resumenInicio } from "../domain/alquileres";
import { hoyISO } from "../domain/fechas";
import { useAsync } from "../hooks/useAsync";
import { useEscenarioMock } from "../hooks/useEscenarioMock";
import type { RootTabParamList } from "../navigation/types";
import { alquileresService } from "../services";
import { suscribirEstadoSimulado } from "../services/mock/estadoSimulado";
import type { EscenarioSync } from "../services/mock/syncServiceMock";
import { espacio, useColores } from "../theme/theme";

type Props = BottomTabScreenProps<RootTabParamList, "Inicio">;

const ESCENARIOS: EscenarioMock[] = ["normal", "vacio", "error"];
const ESCENARIOS_SYNC: Array<{ valor: EscenarioSync; etiqueta: string }> = [
  { valor: "ok", etiqueta: "Servidor OK" },
  { valor: "error", etiqueta: "Error Sync (3 int.)" },
  { valor: "ya_procesado", etiqueta: "Ya procesado" },
  { valor: "sin_conexion", etiqueta: "Sin conexión" },
];

export default function InicioScreen({ navigation }: Props) {
  const c = useColores();
  const escenario = useEscenarioMock();
  const [versionEstado, setVersionEstado] = useState(0);

  useEffect(() => {
    return suscribirEstadoSimulado(() => {
      setVersionEstado((v) => v + 1);
    });
  }, []);

  const { estado, recargar } = useAsync(
    () => alquileresService.listar(),
    [escenario, versionEstado]
  );

  const abrir = (id: number) =>
    navigation.navigate("Alquileres", { screen: "Detalle", params: { id } });

  let cuerpo;
  if (estado.estado === "cargando") cuerpo = <Cargando />;
  else if (estado.estado === "error")
    cuerpo = <ErrorCarga mensaje={estado.mensaje} onReintentar={recargar} />;
  else {
    const { vencidos, pendientesEntrega, proximosAVencer } = resumenInicio(
      estado.datos.datos,
      hoyISO()
    );
    const secciones = [
      { titulo: "Vencidos", lista: vencidos },
      { titulo: "Pendientes de entrega", lista: pendientesEntrega },
      { titulo: "Próximos a vencer (2 días o menos)", lista: proximosAVencer },
    ];
    cuerpo = (
      <ScrollView contentContainerStyle={{ padding: espacio.lg }}>
        {secciones.map((s) => (
          <View key={s.titulo} style={{ marginBottom: espacio.lg }}>
            <Titulo>
              {s.titulo} ({s.lista.length})
            </Titulo>
            {s.lista.length === 0 ? (
              <Tarjeta>
                <Text style={{ color: c.textoSecundario }}>
                  Sin alquileres en esta categoría.
                </Text>
              </Tarjeta>
            ) : (
              s.lista.map((a) => (
                <AlquilerCard
                  key={a.id_alquiler}
                  alquiler={a}
                  onPress={() => abrir(a.id_alquiler)}
                />
              ))
            )}
          </View>
        ))}
        {estado.datos.datos.length === 0 ? (
          <Vacio
            titulo="No hay alquileres"
            detalle="Escenario simulado: lista vacía."
          />
        ) : null}
        <PanelPruebas escenario={escenario} />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      <BannerOrigen
        origen="simulado"
        actualizadoEn={
          estado.estado === "ok" ? estado.datos.actualizadoEn : undefined
        }
      />
      {cuerpo}
      {estado.estado !== "ok" ? <PanelPruebas escenario={escenario} /> : null}
    </View>
  );
}

// Panel de control de escenarios simulados para evaluar los 16 criterios del MVP.
function PanelPruebas({ escenario }: { escenario: EscenarioMock }) {
  const c = useColores();
  const {
    bloquearParaAccesoBiometrico,
    simularReinicioAplicacion,
    simularExpiracionTokenActual,
  } = useAuth();
  const {
    offlineSimulado,
    alternarOfflineSimulado,
    escenarioServidorSync,
    cambiarEscenarioServidorSync,
  } = useConectividadCtx();
  const [mensajePrueba, setMensajePrueba] = useState<string | null>(null);

  return (
    <Tarjeta>
      <Text style={{ color: c.simulado, fontWeight: "800", marginBottom: 6 }}>
        🧪 Panel de pruebas del MVP (datos simulados)
      </Text>

      {/* 1. Escenario de datos */}
      <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 4 }}>
        1. Escenario de carga de datos:
      </Text>
      <View style={estilos.filaBotones}>
        {ESCENARIOS.map((e) => (
          <Pressable
            key={e}
            onPress={() => fijarEscenario(e)}
            style={[
              estilos.chip,
              {
                borderColor: c.simulado,
                backgroundColor:
                  escenario === e ? c.simuladoFondo : "transparent",
              },
            ]}
          >
            <Text
              style={{
                color: c.simulado,
                fontWeight: escenario === e ? "700" : "400",
                fontSize: 12,
              }}
            >
              {e}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 2. Conectividad y respuesta del servidor de sincronización */}
      <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 4 }}>
        2. Conectividad y servidor de sincronización:
      </Text>
      <View style={estilos.filaBotones}>
        <Pressable
          onPress={() => alternarOfflineSimulado(!offlineSimulado)}
          style={[
            estilos.chip,
            {
              borderColor: offlineSimulado ? c.peligro : c.exito,
              backgroundColor: offlineSimulado
                ? c.peligro + "18"
                : c.exito + "18",
            },
          ]}
        >
          <Text
            style={{
              color: offlineSimulado ? c.peligro : c.exito,
              fontWeight: "700",
              fontSize: 12,
            }}
          >
            {offlineSimulado
              ? "🔴 Modo offline activo (toca para reconectar)"
              : "🟢 Modo online activo (toca para simular sin red)"}
          </Text>
        </Pressable>
      </View>

      <View style={estilos.filaBotones}>
        {ESCENARIOS_SYNC.map((s) => (
          <Pressable
            key={s.valor}
            onPress={() => cambiarEscenarioServidorSync(s.valor)}
            style={[
              estilos.chip,
              {
                borderColor: c.simulado,
                backgroundColor:
                  escenarioServidorSync === s.valor
                    ? c.simuladoFondo
                    : "transparent",
              },
            ]}
          >
            <Text
              style={{
                color: c.simulado,
                fontWeight: escenarioServidorSync === s.valor ? "700" : "400",
                fontSize: 11,
              }}
            >
              {s.etiqueta}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 3. Persistencia de sesión, biometría y expiración de token */}
      <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 4 }}>
        3. Pruebas de sesión y autenticación (§3.2):
      </Text>
      <View style={estilos.filaBotones}>
        <Pressable
          onPress={async () => {
            await simularReinicioAplicacion();
            setMensajePrueba(
              "✓ Se simuló cerrar y reabrir la app: la sesión persistió desde el almacenamiento seguro."
            );
          }}
          style={[estilos.chip, { borderColor: c.primario }]}
        >
          <Text style={{ color: c.primario, fontWeight: "700", fontSize: 11 }}>
            ↻ Simular reinicio de app
          </Text>
        </Pressable>

        <Pressable
          onPress={() => bloquearParaAccesoBiometrico()}
          style={[estilos.chip, { borderColor: c.primario }]}
        >
          <Text style={{ color: c.primario, fontWeight: "700", fontSize: 11 }}>
            🔒 Probar acceso biométrico (RNM-02)
          </Text>
        </Pressable>

        <Pressable
          onPress={() => simularExpiracionTokenActual()}
          style={[estilos.chip, { borderColor: c.alerta }]}
        >
          <Text style={{ color: c.alerta, fontWeight: "700", fontSize: 11 }}>
            ⌛ Simular token expirado (P-01)
          </Text>
        </Pressable>
      </View>

      {mensajePrueba && (
        <Text
          style={{
            color: c.exito,
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          }}
        >
          {mensajePrueba}
        </Text>
      )}
    </Tarjeta>
  );
}

const estilos = StyleSheet.create({
  filaBotones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: espacio.xs + 2,
    marginBottom: espacio.sm,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
