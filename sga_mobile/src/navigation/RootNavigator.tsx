import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import type { AlquileresStackParamList, RootTabParamList } from "./types";
import { useColores } from "../theme/theme";
import { useAuth } from "../context/AuthContext";
import { ConectividadProvider } from "../context/ConectividadContext";
import { BannerEstadoSistema } from "../components/BannerEstadoSistema";

// Pantallas principales
import InicioScreen from "../screens/InicioScreen";
import ListaAlquileresScreen from "../screens/ListaAlquileresScreen";
import DetalleAlquilerScreen from "../screens/DetalleAlquilerScreen";
import EntregaScreen from "../screens/EntregaScreen";
import RecogidaScreen from "../screens/RecogidaScreen";
import MapaScreen from "../screens/MapaScreen";
import GastosScreen from "../screens/GastosScreen";
import HistorialScreen from "../screens/HistorialScreen";
import LoginScreen from "../screens/LoginScreen";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<AlquileresStackParamList>();

function AlquileresStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Lista" component={ListaAlquileresScreen} options={{ title: "Alquileres" }} />
      <Stack.Screen name="Detalle" component={DetalleAlquilerScreen} options={{ title: "Detalle del alquiler" }} />
      <Stack.Screen name="Entrega" component={EntregaScreen} options={{ title: "Registrar entrega" }} />
      <Stack.Screen name="Recogida" component={RecogidaScreen} options={{ title: "Registrar recogida" }} />
      <Stack.Screen name="Mapa" component={MapaScreen} options={{ title: "Ubicación" }} />
    </Stack.Navigator>
  );
}

const icono = (glifo: string) => ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 18 }}>{glifo}</Text>
);

/**
 * Navegador raíz con protección de sesión, estado de conectividad NetInfo
 * y barra de cierre de sesión seguro con operaciones pendientes.
 */
export default function RootNavigator() {
  const c = useColores();
  const { estadoAuth, sesion } = useAuth();

  if (estadoAuth === "verificando") return null;

  return (
    <ConectividadProvider id_usuario={sesion?.id_usuario ?? null}>
      {estadoAuth === "sin_sesion" ||
      estadoAuth === "expirada" ||
      estadoAuth === "bloqueada_biometria" ? (
        <LoginScreen />
      ) : (
        <View style={{ flex: 1, backgroundColor: c.fondo }}>
          <BannerEstadoSistema />
          <View style={{ flex: 1 }}>
            <Tab.Navigator screenOptions={{ tabBarActiveTintColor: c.primario }}>
              <Tab.Screen
                name="Inicio"
                component={InicioScreen}
                options={{ tabBarIcon: icono("⌂") }}
              />
              <Tab.Screen
                name="Alquileres"
                component={AlquileresStack}
                options={{ headerShown: false, tabBarIcon: icono("▤") }}
              />
              <Tab.Screen
                name="Gastos"
                component={GastosScreen}
                options={{ tabBarIcon: icono("💰") }}
              />
              <Tab.Screen
                name="Historial"
                component={HistorialScreen}
                options={{ tabBarIcon: icono("↺") }}
              />
            </Tab.Navigator>
          </View>
        </View>
      )}
    </ConectividadProvider>
  );
}
