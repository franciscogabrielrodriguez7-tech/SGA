/**
 * Pantalla de Historial de Operaciones — SGA Móvil (§3.5 / HU-11)
 *
 * Incluye:
 * - Entregas, recogidas y gastos del encargado logístico autenticado (RNM-13).
 * - Orden cronológico descendente.
 * - Fecha, tipo de operación, alquiler(es) relacionado(s), responsable,
 *   valor cuando corresponde (en gastos) y detalle de observaciones/descripción.
 * - Filtros independientes: por tipo de operación, por estado de sincronización y por fecha.
 * - Búsqueda por ID (de operación o alquiler), cliente, descripción y tipo de operación.
 * - Sugerencias dinámicas de búsqueda.
 * - Identificación explícita de operaciones locales todavía no confirmadas (RNM-14).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { formatearFecha } from '../domain/fechas';
import {
  ETIQUETA_TIPO_OPERACION,
  filtrarHistorial,
  generarSugerenciasHistorial,
} from '../domain/historial';
import { useEscenarioMock } from '../hooks/useEscenarioMock';
import type { RootTabParamList } from '../navigation/types';
import { historialService } from '../services';
import { suscribirEstadoSimulado } from '../services/mock/estadoSimulado';
import { suscribirCola } from '../storage/cola';
import { espacio, useColores } from '../theme/theme';
import type {
  RegistroHistorial,
  TipoOperacionHistorial,
} from '../types/historial';

type Props = BottomTabScreenProps<RootTabParamList, 'Historial'>;

const moneda = (n: number) => `$ ${n.toLocaleString('es-CO')}`;

function formatearFechaHora(iso: string): string {
  const fecha = formatearFecha(iso.slice(0, 10));
  const hora = iso.length >= 16 ? iso.slice(11, 16) : '';
  return hora ? `${fecha} · ${hora}` : fecha;
}

const TIPOS_FILTRO: Array<{
  valor: 'todos' | TipoOperacionHistorial;
  etiqueta: string;
}> = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'entrega', etiqueta: 'Entregas' },
  { valor: 'recogida', etiqueta: 'Recogidas' },
  { valor: 'gasto', etiqueta: 'Gastos' },
];

const ESTADOS_FILTRO: Array<{
  valor: 'todos' | 'confirmados' | 'pendientes' | 'error';
  etiqueta: string;
}> = [
  { valor: 'todos', etiqueta: 'Todos los estados' },
  { valor: 'confirmados', etiqueta: 'Confirmados' },
  { valor: 'pendientes', etiqueta: 'Pendientes locales' },
  { valor: 'error', etiqueta: 'Con error' },
];

export default function HistorialScreen({ navigation }: Props) {
  const c = useColores();
  const { sesion } = useAuth();
  const escenario = useEscenarioMock();

  const [registros, setRegistros] = useState<RegistroHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [actualizadoEn, setActualizadoEn] = useState<string>(new Date().toISOString());

  // Filtros independientes (§3.5)
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | TipoOperacionHistorial>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<
    'todos' | 'confirmados' | 'pendientes' | 'error'
  >('todos');
  const [diaFiltro, setDiaFiltro] = useState('');
  const [registroSeleccionado, setRegistroSeleccionado] =
    useState<RegistroHistorial | null>(null);

  const idUsuario = sesion?.id_usuario ?? 'usr-001';
  const nombreResponsable = sesion
    ? `${sesion.nombres} ${sesion.apellidos}`
    : 'Carlos Mendoza';

  const cargarHistorial = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const res = await historialService.listarPropio(idUsuario, nombreResponsable);
      setRegistros(res.datos);
      setActualizadoEn(res.actualizadoEn);
    } catch (e) {
      setErrorCarga(e instanceof Error ? e.message : 'Error al cargar historial');
    } finally {
      setCargando(false);
    }
  }, [idUsuario, nombreResponsable, escenario]);

  useEffect(() => {
    cargarHistorial();
    const unsubCola = suscribirCola(() => {
      cargarHistorial();
    });
    const unsubEstado = suscribirEstadoSimulado(() => {
      cargarHistorial();
    });
    return () => {
      unsubCola();
      unsubEstado();
    };
  }, [cargarHistorial]);

  const registrosFiltrados = useMemo(
    () =>
      filtrarHistorial(registros, {
        busqueda,
        tipo: tipoFiltro,
        estado: estadoFiltro,
        dia: diaFiltro,
      }),
    [registros, busqueda, tipoFiltro, estadoFiltro, diaFiltro]
  );

  const sugerencias = useMemo(
    () => generarSugerenciasHistorial(registros, busqueda, 6),
    [registros, busqueda]
  );

  const hayNoConfirmados = registros.some((r) => r.es_local_no_confirmado);

  if (cargando && registros.length === 0) return <Cargando />;
  if (errorCarga) {
    return <ErrorCarga mensaje={errorCarga} onReintentar={cargarHistorial} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      <BannerOrigen
        origen={hayNoConfirmados ? 'local' : 'simulado'}
        actualizadoEn={actualizadoEn}
      />

      <ScrollView
        contentContainerStyle={{ padding: espacio.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Titulo>
          Historial propio de {nombreResponsable} ({registrosFiltrados.length})
        </Titulo>

        {/* Buscador con sugerencias (§3.5) */}
        <Tarjeta>
          <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 4 }}>
            Búsqueda por ID, cliente, descripción o tipo de operación
          </Text>
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Ej: #103, Roble, Entrega, peaje…"
            placeholderTextColor={c.textoSecundario}
            style={[
              estilos.input,
              {
                color: c.texto,
                borderColor: c.borde,
                backgroundColor: c.fondo,
              },
            ]}
          />

          {/* Sugerencias de búsqueda */}
          {sugerencias.length > 0 && (
            <View style={{ marginBottom: espacio.sm }}>
              <Text style={{ color: c.textoSecundario, fontSize: 11, marginBottom: 4 }}>
                Sugerencias rápidas:
              </Text>
              <View style={estilos.filaChips}>
                {sugerencias.map((sug) => (
                  <Pressable
                    key={sug}
                    onPress={() => setBusqueda(busqueda === sug ? '' : sug)}
                    style={[
                      estilos.chip,
                      {
                        borderColor: c.primario,
                        backgroundColor:
                          busqueda === sug ? c.primario : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: busqueda === sug ? c.primarioTexto : c.primario,
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      🔍 {sug}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Filtro 1: Tipo de operación */}
          <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 4 }}>
            Filtro por tipo de operación:
          </Text>
          <View style={estilos.filaChips}>
            {TIPOS_FILTRO.map((t) => (
              <Pressable
                key={t.valor}
                onPress={() => setTipoFiltro(t.valor)}
                style={[
                  estilos.chip,
                  {
                    borderColor: c.primario,
                    backgroundColor:
                      tipoFiltro === t.valor ? c.primario : 'transparent',
                  },
                ]}
              >
                <Text
                  style={{
                    color: tipoFiltro === t.valor ? c.primarioTexto : c.primario,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {t.etiqueta}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Filtro 2: Estado de sincronización */}
          <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 4 }}>
            Filtro por estado de confirmación:
          </Text>
          <View style={estilos.filaChips}>
            {ESTADOS_FILTRO.map((est) => (
              <Pressable
                key={est.valor}
                onPress={() => setEstadoFiltro(est.valor)}
                style={[
                  estilos.chip,
                  {
                    borderColor: c.borde,
                    backgroundColor:
                      estadoFiltro === est.valor ? c.simuladoFondo : 'transparent',
                  },
                ]}
              >
                <Text
                  style={{
                    color: estadoFiltro === est.valor ? c.simulado : c.textoSecundario,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {est.etiqueta}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Filtro 3: Fecha */}
          <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 4 }}>
            Filtro por fecha (YYYY-MM-DD):
          </Text>
          <TextInput
            value={diaFiltro}
            onChangeText={setDiaFiltro}
            placeholder="Ej: 2026-11-20"
            placeholderTextColor={c.textoSecundario}
            style={[
              estilos.input,
              {
                color: c.texto,
                borderColor: c.borde,
                backgroundColor: c.fondo,
              },
            ]}
          />

          {(busqueda ||
            tipoFiltro !== 'todos' ||
            estadoFiltro !== 'todos' ||
            diaFiltro) && (
            <Boton
              titulo="Restablecer filtros"
              secundario
              onPress={() => {
                setBusqueda('');
                setTipoFiltro('todos');
                setEstadoFiltro('todos');
                setDiaFiltro('');
              }}
            />
          )}
        </Tarjeta>

        {/* Listado en orden cronológico descendente (§3.5) */}
        {registrosFiltrados.length === 0 ? (
          <Tarjeta>
            <Vacio
              titulo="Sin registros en el historial"
              detalle="No hay operaciones propias que coincidan con la búsqueda o los filtros activos."
            />
          </Tarjeta>
        ) : (
          registrosFiltrados.map((item) => {
            const tonoEstado =
              item.estado_sincronizacion === 'confirmada'
                ? 'exito'
                : item.estado_sincronizacion === 'error'
                ? 'peligro'
                : 'alerta';

            const textoEstado =
              item.estado_sincronizacion === 'confirmada'
                ? '✓ Confirmada'
                : item.estado_sincronizacion === 'error'
                ? '⚠ LOCAL — Error de sincronización'
                : '⏳ LOCAL — Pendiente de sincronización';

            const resumenAlquileres = item.alquileres_relacionados
              .map(
                (rel) =>
                  `#${rel.id_alquiler} (${rel.cliente_nombre}${
                    item.tipo === 'gasto' && rel.tipo_movimiento
                      ? ` · ${rel.tipo_movimiento}`
                      : ''
                  })`
              )
              .join(', ');

            return (
              <Tarjeta
                key={`${item.tipo}-${item.id}`}
                onPress={() => setRegistroSeleccionado(item)}
              >
                <View style={estilos.encabezadoTarjeta}>
                  <Text style={{ color: c.texto, fontWeight: '800', fontSize: 15 }}>
                    {item.tipo === 'entrega'
                      ? '🚚 Entrega'
                      : item.tipo === 'recogida'
                      ? '📦 Recogida'
                      : '💰 Gasto logístico'}
                  </Text>
                  <Etiqueta texto={textoEstado} tono={tonoEstado} />
                </View>

                <Fila etiqueta="Fecha y hora" valor={formatearFechaHora(item.fecha)} />
                <Fila
                  etiqueta="Alquiler(es) relacionado(s)"
                  valor={resumenAlquileres || `#${item.id_alquiler_principal}`}
                />
                <Fila etiqueta="Responsable" valor={item.responsable_nombre} />
                {item.valor !== undefined && (
                  <Fila etiqueta="Valor total" valor={moneda(item.valor)} />
                )}

                <Text
                  style={{
                    color: c.textoSecundario,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {item.tipo === 'gasto' ? 'Descripción: ' : 'Observaciones: '}
                  <Text style={{ color: c.texto }}>{item.detalle_texto}</Text>
                </Text>

                {item.es_local_no_confirmado && (
                  <Text
                    style={{
                      color:
                        item.estado_sincronizacion === 'error' ? c.peligro : c.alerta,
                      fontSize: 11,
                      fontWeight: '700',
                      marginTop: 6,
                    }}
                  >
                    Operación local no confirmada aún por el servidor (RNM-14).
                    {item.ultimoError ? ` Detalle: ${item.ultimoError}` : ''}
                  </Text>
                )}
              </Tarjeta>
            );
          })
        )}
      </ScrollView>

      {/* Modal de detalle completo de la operación */}
      <Modal
        visible={registroSeleccionado !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRegistroSeleccionado(null)}
      >
        <View style={estilos.fondoModal}>
          <View
            style={[
              estilos.cajaModal,
              { backgroundColor: c.superficie, borderColor: c.borde },
            ]}
          >
            {registroSeleccionado && (
              <>
                <Text style={{ color: c.texto, fontSize: 18, fontWeight: '800' }}>
                  {ETIQUETA_TIPO_OPERACION[registroSeleccionado.tipo]} ·{' '}
                  {registroSeleccionado.id}
                </Text>

                <Etiqueta
                  texto={
                    registroSeleccionado.es_local_no_confirmado
                      ? `Registro local (${registroSeleccionado.estado_sincronizacion}) — aún no confirmado por el servidor`
                      : 'Operación confirmada (servidor simulado)'
                  }
                  tono={
                    registroSeleccionado.estado_sincronizacion === 'confirmada'
                      ? 'exito'
                      : registroSeleccionado.estado_sincronizacion === 'error'
                      ? 'peligro'
                      : 'alerta'
                  }
                />

                <Fila
                  etiqueta="Fecha y hora"
                  valor={formatearFechaHora(registroSeleccionado.fecha)}
                />
                <Fila
                  etiqueta="Tipo de operación"
                  valor={ETIQUETA_TIPO_OPERACION[registroSeleccionado.tipo]}
                />
                <Fila
                  etiqueta="Responsable"
                  valor={`${registroSeleccionado.responsable_nombre} (${registroSeleccionado.id_usuario})`}
                />
                {registroSeleccionado.valor !== undefined && (
                  <Fila
                    etiqueta="Valor total"
                    valor={moneda(registroSeleccionado.valor)}
                  />
                )}

                <Text style={{ color: c.texto, fontWeight: '700', fontSize: 13 }}>
                  {registroSeleccionado.tipo === 'gasto'
                    ? 'Descripción del gasto:'
                    : 'Observaciones registradas:'}
                </Text>
                <Text style={{ color: c.textoSecundario, fontSize: 13 }}>
                  {registroSeleccionado.detalle_texto}
                </Text>

                <Text style={{ color: c.texto, fontWeight: '700', fontSize: 13 }}>
                  Alquiler(es) relacionado(s):
                </Text>
                {registroSeleccionado.alquileres_relacionados.map((rel, idx) => (
                  <View
                    key={`${rel.id_alquiler}-${idx}`}
                    style={[
                      estilos.itemRelacionado,
                      { borderColor: c.borde },
                    ]}
                  >
                    <Text style={{ color: c.texto, fontWeight: '700', fontSize: 13 }}>
                      Alquiler #{rel.id_alquiler} — {rel.cliente_nombre}
                      {rel.tipo_movimiento
                        ? ` (${rel.tipo_movimiento.toUpperCase()})`
                        : ''}
                    </Text>
                    <Text style={{ color: c.textoSecundario, fontSize: 12 }}>
                      {rel.direccion} · Barrio: {rel.barrio}
                    </Text>
                  </View>
                ))}

                <View style={{ gap: espacio.sm, marginTop: espacio.xs }}>
                  {registroSeleccionado.id_alquiler_principal > 0 && (
                    <Boton
                      titulo={`Ver detalle del alquiler #${registroSeleccionado.id_alquiler_principal}`}
                      onPress={() => {
                        const idDestino = registroSeleccionado.id_alquiler_principal;
                        setRegistroSeleccionado(null);
                        navigation.navigate('Alquileres', {
                          screen: 'Detalle',
                          params: { id: idDestino },
                        });
                      }}
                    />
                  )}
                  <Boton
                    titulo="Cerrar"
                    secundario
                    onPress={() => setRegistroSeleccionado(null)}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: espacio.md,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: espacio.sm,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: espacio.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: espacio.lg,
  },
  cajaModal: {
    borderRadius: 12,
    borderWidth: 1,
    padding: espacio.lg,
    gap: espacio.sm,
    maxHeight: '88%',
  },
  itemRelacionado: {
    borderWidth: 1,
    borderRadius: 8,
    padding: espacio.sm,
  },
});
