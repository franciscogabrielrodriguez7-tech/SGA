/**
 * Pantalla de registro de entrega — SGA Móvil
 *
 * Solo disponible para alquileres en estado 'pendiente' (RNM-05).
 * No permite entregas parciales ni modificar productos o cantidades.
 * Si no hay conexión, encola la operación localmente y muestra estado pendiente.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Boton, Tarjeta, Titulo } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useConectividadCtx } from '../context/ConectividadContext';
import type { AlquileresStackParamList } from '../navigation/types';
import { sincronizarPendientes } from '../services/mock/syncServiceMock';
import { encolar } from '../storage/cola';
import { espacio, useColores } from '../theme/theme';
import type { PayloadEntrega } from '../types/queue';

type Props = NativeStackScreenProps<AlquileresStackParamList, 'Entrega'>;

export default function EntregaScreen({ route, navigation }: Props) {
  const { alquiler } = route.params;
  const { sesion } = useAuth();
  const { conectado, actualizarConteoCola } = useConectividadCtx();
  const colores = useColores();
  const styles = crearEstilos(colores);

  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(false);
  const [encolada, setEncolada] = useState(false);

  async function handleRegistrar() {
    if (!sesion) return;

    setCargando(true);

    const payload: PayloadEntrega = {
      id_alquiler: alquiler.id,
      observaciones: observaciones.trim() || undefined,
      responsable_nombre: `${sesion.nombres} ${sesion.apellidos}`,
    };

    try {
      await encolar<PayloadEntrega>(sesion.id_usuario, {
        tipo: 'entrega',
        id_alquiler: alquiler.id,
        payload,
      });

      if (conectado) {
        const resumen = await sincronizarPendientes(sesion.id_usuario);
        await actualizarConteoCola();

        if (resumen.confirmadas > 0 && resumen.errores === 0) {
          Alert.alert(
            'Entrega registrada y confirmada',
            `La entrega completa del alquiler #${alquiler.id} fue confirmada (estado actualizado a Activo).`,
            [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
          );
          return;
        }
      }

      await actualizarConteoCola();
      setEncolada(true);
    } catch {
      setEncolada(true);
    } finally {
      setCargando(false);
    }
  }

  if (encolada) {
    return (
      <View style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
        <Tarjeta style={styles.bannerCola}>
          <Text style={[styles.badgeCola, { color: colores.advertencia }]}>
            ⏳ Pendiente de sincronización (operación local)
          </Text>
          <Text style={[styles.textoCola, { color: colores.texto }]}>
            La entrega del alquiler #{alquiler.id} quedó guardada localmente en la cola
            del usuario {sesion?.nombres}. No se considera confirmada hasta recibir
            respuesta del servidor (RNM-14).
          </Text>
          <Boton
            etiqueta="Volver al detalle"
            onPress={() => navigation.goBack()}
            variante="secundario"
          />
        </Tarjeta>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.contenedor, { backgroundColor: colores.fondo }]}
      contentContainerStyle={styles.scroll}
    >
      <Titulo texto={`Entrega completa — Alquiler #${alquiler.id}`} />

      <Tarjeta style={styles.seccion}>
        <Text style={[styles.etiqueta, { color: colores.textoSecundario }]}>
          Cliente
        </Text>
        <Text style={[styles.valor, { color: colores.texto }]}>
          {alquiler.cliente_nombre}
        </Text>

        <Text style={[styles.etiqueta, { color: colores.textoSecundario }]}>
          Dirección de entrega
        </Text>
        <Text style={[styles.valor, { color: colores.texto }]}>
          {alquiler.direccion_entrega}
        </Text>

        {alquiler.barrio && (
          <>
            <Text style={[styles.etiqueta, { color: colores.textoSecundario }]}>
              Barrio
            </Text>
            <Text style={[styles.valor, { color: colores.texto }]}>
              {alquiler.barrio}
            </Text>
          </>
        )}
      </Tarjeta>

      <Tarjeta style={styles.seccion}>
        <Text style={[styles.subtitulo, { color: colores.texto }]}>
          Productos y cantidades a entregar (solo lectura — entrega completa RNM-05)
        </Text>
        <Text style={[styles.nota, { color: colores.textoSecundario }]}>
          No se permiten entregas parciales ni modificar productos o cantidades.
        </Text>
        {alquiler.productos && alquiler.productos.length > 0 ? (
          alquiler.productos.map((p, i) => (
            <View key={i} style={styles.filaProducto}>
              <Text style={[styles.nombreProducto, { color: colores.texto }]}>
                {p.nombre}
              </Text>
              <Text
                style={[
                  styles.cantidadProducto,
                  { color: colores.textoSecundario },
                ]}
              >
                × {p.cantidad}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.nota, { color: colores.textoSecundario }]}>
            Sin productos registrados en el detalle.
          </Text>
        )}
      </Tarjeta>

      <Tarjeta style={styles.seccion}>
        <Text style={[styles.etiqueta, { color: colores.textoSecundario }]}>
          Observaciones (opcional)
        </Text>
        <TextInput
          style={[
            styles.campoTexto,
            {
              color: colores.texto,
              borderColor: colores.borde,
              backgroundColor: colores.superficie,
            },
          ]}
          value={observaciones}
          onChangeText={setObservaciones}
          placeholder="Novedades de acceso o entrega en obra…"
          placeholderTextColor={colores.textoSecundario}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!cargando}
        />
      </Tarjeta>

      {cargando ? (
        <ActivityIndicator
          color={colores.primario}
          style={{ marginTop: espacio.lg }}
        />
      ) : (
        <Boton
          etiqueta="Confirmar entrega completa"
          onPress={handleRegistrar}
          variante="primario"
          style={{ marginTop: espacio.md }}
        />
      )}
    </ScrollView>
  );
}

function crearEstilos(colores: ReturnType<typeof useColores>) {
  return StyleSheet.create({
    contenedor: { flex: 1 },
    scroll: { padding: espacio.md, gap: espacio.md },
    seccion: { gap: espacio.sm },
    etiqueta: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 2,
      textTransform: 'uppercase',
    },
    valor: { fontSize: 15, marginBottom: espacio.sm },
    subtitulo: { fontSize: 15, fontWeight: '600', marginBottom: espacio.xs },
    nota: { fontSize: 13, fontStyle: 'italic', marginBottom: espacio.sm },
    filaProducto: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colores.borde,
    },
    nombreProducto: { fontSize: 14, flex: 1 },
    cantidadProducto: { fontSize: 14, fontWeight: '700' },
    campoTexto: {
      borderWidth: 1,
      borderRadius: 8,
      padding: espacio.sm,
      fontSize: 15,
      minHeight: 100,
    },
    bannerCola: { margin: espacio.lg, gap: espacio.md, alignItems: 'center' },
    badgeCola: { fontSize: 16, fontWeight: '700' },
    textoCola: { fontSize: 14, textAlign: 'center' },
  });
}
