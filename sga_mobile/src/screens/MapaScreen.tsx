/**
 * Pantalla de mapa simulado — SGA Móvil
 *
 * IMPORTANTE: Esta pantalla NO muestra un mapa real ni usa GPS real.
 * Muestra una representación simulada de la ubicación del alquiler.
 * El texto en pantalla debe dejar claro que es un placeholder.
 *
 * DEP-INT-04: Integración pendiente con proveedor de mapas real.
 * Al integrar: reemplazar el placeholder visual por react-native-maps
 * o equivalent, usando las coordenadas del mapServiceMock → real adapter.
 *
 * Accedida desde: DetalleAlquilerScreen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AlquileresStackParamList } from '../navigation/types';
import { useColores, espacio } from '../theme/theme';
import { mapServiceMock } from '../services/mock/mapServiceMock';
import type { Coordenadas } from '../services/MapService';
import { Tarjeta, Titulo } from '../components/ui';

type Props = NativeStackScreenProps<AlquileresStackParamList, 'Mapa'>;

export default function MapaScreen({ route }: Props) {
  const { alquiler } = route.params;
  const colores = useColores();
  const styles = crearEstilos(colores);

  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorMapa, setErrorMapa] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resultado = await mapServiceMock.geocodificar(
        alquiler.direccion_entrega,
        alquiler.barrio ?? ''
      );

      if (resultado.ok) {
        setCoordenadas(resultado.datos);
      } else {
        const mensajes: Record<string, string> = {
          permiso_denegado: 'Permisos de ubicación denegados.',
          gps_no_disponible: 'GPS no disponible en este dispositivo.',
          direccion_no_encontrada: 'No se pudo ubicar la dirección.',
          error_conexion: 'Sin conexión para cargar el mapa.',
        };
        setErrorMapa(mensajes[resultado.error] ?? 'Error al cargar el mapa.');
      }

      setCargando(false);
    })();
  }, [alquiler]);

  return (
    <ScrollView
      style={[styles.contenedor, { backgroundColor: colores.fondo }]}
      contentContainerStyle={styles.scroll}
    >
      <Titulo texto="Ubicación" />

      {/* Aviso de simulación — OBLIGATORIO */}
      <View style={[styles.avisoSimulacion, { backgroundColor: colores.advertencia + '22', borderColor: colores.advertencia }]}>
        <Text style={[styles.textoAviso, { color: colores.advertencia }]}>
          ⚠️ Mapa simulado — Los datos de ubicación son ficticios y no representan la dirección real.
        </Text>
      </View>

      {/* Información de dirección */}
      <Tarjeta style={styles.seccion}>
        <Text style={[styles.etiqueta, { color: colores.textoSecundario }]}>Dirección</Text>
        <Text style={[styles.valor, { color: colores.texto }]}>{alquiler.direccion_entrega}</Text>

        {alquiler.barrio && (
          <>
            <Text style={[styles.etiqueta, { color: colores.textoSecundario }]}>Barrio</Text>
            <Text style={[styles.valor, { color: colores.texto }]}>{alquiler.barrio}</Text>
          </>
        )}
      </Tarjeta>

      {/* Área del mapa */}
      {cargando ? (
        <ActivityIndicator color={colores.primario} style={{ marginTop: espacio.lg }} />
      ) : errorMapa ? (
        <Tarjeta style={[styles.areaMapaPlaceholder, { borderColor: colores.error }]}>
          <Text style={[styles.iconoMapa, { color: colores.error }]}>⚠️</Text>
          <Text style={[styles.textoError, { color: colores.error }]}>{errorMapa}</Text>
        </Tarjeta>
      ) : coordenadas ? (
        <Tarjeta style={[styles.areaMapaPlaceholder, { borderColor: colores.borde }]}>
          {/* Placeholder visual — reemplazar por <MapView> en integración real */}
          <Text style={[styles.iconoMapa, { color: colores.textoSecundario }]}>🗺️</Text>
          <Text style={[styles.textoPlaceholder, { color: colores.textoSecundario }]}>
            [Mapa simulado — DEP-INT-04]
          </Text>
          <Text style={[styles.coordenadas, { color: colores.textoSecundario }]}>
            Lat: {coordenadas.latitud.toFixed(5)} · Lon: {coordenadas.longitud.toFixed(5)}
          </Text>
          <Text style={[styles.notaIntegracion, { color: colores.textoSecundario }]}>
            En la versión con integración real se mostrará el mapa del proveedor seleccionado.
          </Text>
        </Tarjeta>
      ) : null}
    </ScrollView>
  );
}

function crearEstilos(colores: ReturnType<typeof useColores>) {
  return StyleSheet.create({
    contenedor: { flex: 1 },
    scroll: { padding: espacio.md, gap: espacio.md },
    avisoSimulacion: {
      borderWidth: 1,
      borderRadius: 8,
      padding: espacio.md,
    },
    textoAviso: { fontSize: 13, textAlign: 'center' },
    seccion: { gap: espacio.sm },
    etiqueta: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase' },
    valor: { fontSize: 15, marginBottom: espacio.sm },
    areaMapaPlaceholder: {
      minHeight: 240,
      alignItems: 'center',
      justifyContent: 'center',
      gap: espacio.sm,
      borderWidth: 1,
    },
    iconoMapa: { fontSize: 48 },
    textoPlaceholder: { fontSize: 16, fontWeight: '600' },
    coordenadas: { fontSize: 12 },
    notaIntegracion: { fontSize: 12, textAlign: 'center', fontStyle: 'italic', marginTop: espacio.sm },
    textoError: { fontSize: 14, textAlign: 'center' },
  });
}
