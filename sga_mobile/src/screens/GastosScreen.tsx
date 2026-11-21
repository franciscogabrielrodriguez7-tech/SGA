/**
 * Pantalla completa de Gastos Logísticos — SGA Móvil (§3.3 y §3.4)
 *
 * Incluye:
 * 1. Registro de gastos (§3.3):
 *    - Valor total positivo (no se multiplica ni distribuye entre asociaciones).
 *    - Descripción / observaciones obligatorias.
 *    - Uno o varios alquileres relacionados con búsqueda por ID o cliente.
 *    - Selección y modificación del tipo de movimiento por asociación: 'entrega' o 'recogida'.
 *    - Permite repetir el mismo alquiler únicamente con diferente tipo de movimiento (RNM-11).
 *    - Impide repetir el mismo alquiler con el mismo tipo de movimiento.
 *    - Exige al menos un alquiler relacionado.
 *    - Confirmación previa antes de guardar.
 *    - Fecha, hora y usuario automáticos.
 *    - Soporte offline con encolado local y estado "Pendiente de sincronización".
 *    - Sin edición ni eliminación de gastos (RNM-12).
 *
 * 2. Consulta de gastos propios y Resumen Semanal (§3.4):
 *    - Resumen semanal de lunes a domingo con navegación a semanas anteriores.
 *    - Total gastado y selector de promedio diario o promedio semanal.
 *    - Distinción clara entre gastos pendientes localmente y gastos confirmados.
 *    - Listado de gastos propios con filtros por día, descripción y valor.
 *    - Vista de detalle completo de cada gasto (solo lectura).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useConectividadCtx } from '../context/ConectividadContext';
import {
  agregarAsociacionGasto,
  buscarAlquileresPorIdOCliente,
  calcularResumenSemanalGastos,
  filtrarGastosPropios,
  modificarTipoMovimientoAsociacion,
  parsearValorPositivo,
  quitarAsociacionGasto,
  validarRegistroGasto,
} from '../domain/gastos';
import { formatearFecha, hoyISO } from '../domain/fechas';
import { useEscenarioMock } from '../hooks/useEscenarioMock';
import { alquileresService, gastosService } from '../services';
import { suscribirEstadoSimulado } from '../services/mock/estadoSimulado';
import { suscribirCola } from '../storage/cola';
import { espacio, useColores } from '../theme/theme';
import type {
  AsociacionGasto,
  GastoLogistico,
  ModoPromedioGasto,
  TipoMovimientoAsociacion,
} from '../types/gastos';
import type { Alquiler } from '../types/models';

const moneda = (n: number) => `$ ${n.toLocaleString('es-CO')}`;

function formatearFechaHora(iso: string): string {
  const fecha = formatearFecha(iso.slice(0, 10));
  const hora = iso.length >= 16 ? iso.slice(11, 16) : '';
  return hora ? `${fecha} · ${hora}` : fecha;
}

export default function GastosScreen() {
  const c = useColores();
  const { sesion } = useAuth();
  const { conectado } = useConectividadCtx();
  const escenario = useEscenarioMock();

  const [pestana, setPestana] = useState<'consulta' | 'registro'>('consulta');

  // Estado de carga de alquileres y gastos propios
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [gastosPropios, setGastosPropios] = useState<GastoLogistico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [actualizadoEn, setActualizadoEn] = useState<string>(new Date().toISOString());

  // Estado del formulario de registro (§3.3)
  const [valorTexto, setValorTexto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [busquedaAlquiler, setBusquedaAlquiler] = useState('');
  const [asociaciones, setAsociaciones] = useState<AsociacionGasto[]>([]);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [modalConfirmarVisible, setModalConfirmarVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estado de resumen semanal y filtros de consulta (§3.4)
  const [desplazamientoSemana, setDesplazamientoSemana] = useState(0);
  const [modoPromedio, setModoPromedio] = useState<ModoPromedioGasto>('diario');
  const [filtroDia, setFiltroDia] = useState('');
  const [filtroDescripcion, setFiltroDescripcion] = useState('');
  const [filtroValorMin, setFiltroValorMin] = useState('');
  const [filtroValorMax, setFiltroValorMax] = useState('');
  const [gastoSeleccionado, setGastoSeleccionado] = useState<GastoLogistico | null>(null);

  const idUsuario = sesion?.id_usuario ?? 'usr-001';
  const nombreResponsable = sesion
    ? `${sesion.nombres} ${sesion.apellidos}`
    : 'Carlos Mendoza';

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const [resAlq, resGas] = await Promise.all([
        alquileresService.listar(),
        gastosService.listarPropios(idUsuario),
      ]);
      setAlquileres(resAlq.datos);
      setGastosPropios(resGas.datos);
      setActualizadoEn(resGas.actualizadoEn);
    } catch (e) {
      setErrorCarga(e instanceof Error ? e.message : 'Error al cargar gastos');
    } finally {
      setCargando(false);
    }
  }, [idUsuario, escenario]);

  useEffect(() => {
    cargarDatos();
    const unsubCola = suscribirCola(() => {
      cargarDatos();
    });
    const unsubEstado = suscribirEstadoSimulado(() => {
      cargarDatos();
    });
    return () => {
      unsubCola();
      unsubEstado();
    };
  }, [cargarDatos]);

  const mapaAlquileres = useMemo(() => {
    const m = new Map<number, Alquiler>();
    for (const a of alquileres) m.set(a.id_alquiler, a);
    return m;
  }, [alquileres]);

  const alquileresFiltradosBusqueda = useMemo(
    () => buscarAlquileresPorIdOCliente(alquileres, busquedaAlquiler),
    [alquileres, busquedaAlquiler]
  );

  const resumenSemanal = useMemo(
    () =>
      calcularResumenSemanalGastos(
        gastosPropios,
        idUsuario,
        hoyISO(),
        desplazamientoSemana
      ),
    [gastosPropios, idUsuario, desplazamientoSemana]
  );

  const gastosFiltrados = useMemo(() => {
    const min = parsearValorPositivo(filtroValorMin) ?? undefined;
    const max = parsearValorPositivo(filtroValorMax) ?? undefined;
    return filtrarGastosPropios(gastosPropios, idUsuario, {
      dia: filtroDia,
      descripcion: filtroDescripcion,
      valorMin: min,
      valorMax: max,
    });
  }, [gastosPropios, idUsuario, filtroDia, filtroDescripcion, filtroValorMin, filtroValorMax]);

  const diasDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const g of gastosPropios) {
      set.add(g.fecha.slice(0, 10));
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [gastosPropios]);

  function handleAgregarAsociacion(
    id_alquiler: number,
    tipo_movimiento: TipoMovimientoAsociacion
  ) {
    setErrorFormulario(null);
    const res = agregarAsociacionGasto(asociaciones, { id_alquiler, tipo_movimiento });
    if (!res.ok) {
      setErrorFormulario(res.error);
      return;
    }
    setAsociaciones(res.asociaciones);
  }

  function handleCambiarTipoAsociacion(
    indice: number,
    nuevoTipo: TipoMovimientoAsociacion
  ) {
    setErrorFormulario(null);
    const res = modificarTipoMovimientoAsociacion(asociaciones, indice, nuevoTipo);
    if (!res.ok) {
      setErrorFormulario(res.error);
      return;
    }
    setAsociaciones(res.asociaciones);
  }

  function handleQuitarAsociacion(indice: number) {
    setErrorFormulario(null);
    setAsociaciones(quitarAsociacionGasto(asociaciones, indice));
  }

  function handleSolicitarConfirmacion() {
    setErrorFormulario(null);
    setMensajeExito(null);
    const validacion = validarRegistroGasto({
      valorTexto,
      descripcion,
      asociaciones,
    });
    if (!validacion.ok) {
      setErrorFormulario(validacion.error);
      return;
    }
    setModalConfirmarVisible(true);
  }

  async function handleConfirmarYGuardar() {
    const validacion = validarRegistroGasto({
      valorTexto,
      descripcion,
      asociaciones,
    });
    if (!validacion.ok) {
      setModalConfirmarVisible(false);
      setErrorFormulario(validacion.error);
      return;
    }

    setGuardando(true);
    try {
      const resultado = await gastosService.registrar({
        id_usuario: idUsuario,
        responsable_nombre: nombreResponsable,
        valor: validacion.valor,
        descripcion: validacion.descripcion,
        asociaciones: validacion.asociaciones,
        conectado,
      });

      setModalConfirmarVisible(false);
      setValorTexto('');
      setDescripcion('');
      setAsociaciones([]);
      setBusquedaAlquiler('');

      if (resultado.sincronizadoInmediatamente) {
        setMensajeExito(
          `✓ Gasto por ${moneda(validacion.valor)} registrado y confirmado (simulado).`
        );
      } else {
        setMensajeExito(
          `⏳ Gasto por ${moneda(validacion.valor)} guardado localmente como PENDIENTE DE SINCRONIZACIÓN.`
        );
      }

      await cargarDatos();
      setPestana('consulta');
    } catch (e) {
      setErrorFormulario(
        e instanceof Error ? e.message : 'No se pudo registrar el gasto.'
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando && gastosPropios.length === 0) return <Cargando />;
  if (errorCarga) return <ErrorCarga mensaje={errorCarga} onReintentar={cargarDatos} />;

  const tienePendientes = gastosPropios.some((g) => g.estado !== 'confirmada');

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      <BannerOrigen
        origen={tienePendientes ? 'local' : 'simulado'}
        actualizadoEn={actualizadoEn}
      />

      {/* Selector superior de vista: Consulta y Resumen vs Nuevo Gasto */}
      <View
        style={[
          estilos.selectorPestanas,
          { backgroundColor: c.superficie, borderBottomColor: c.borde },
        ]}
      >
        <Pressable
          onPress={() => setPestana('consulta')}
          style={[
            estilos.botonPestana,
            pestana === 'consulta' && {
              backgroundColor: c.primario,
            },
          ]}
        >
          <Text
            style={{
              color: pestana === 'consulta' ? c.primarioTexto : c.texto,
              fontWeight: '700',
              fontSize: 13,
            }}
          >
            Mis gastos y resumen ({gastosPropios.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setMensajeExito(null);
            setPestana('registro');
          }}
          style={[
            estilos.botonPestana,
            pestana === 'registro' && {
              backgroundColor: c.primario,
            },
          ]}
        >
          <Text
            style={{
              color: pestana === 'registro' ? c.primarioTexto : c.texto,
              fontWeight: '700',
              fontSize: 13,
            }}
          >
            + Registrar gasto
          </Text>
        </Pressable>
      </View>

      {mensajeExito && (
        <View
          style={[
            estilos.bannerFeedback,
            { backgroundColor: c.exito + '18', borderColor: c.exito },
          ]}
        >
          <Text style={{ color: c.exito, fontWeight: '700', fontSize: 13 }}>
            {mensajeExito}
          </Text>
        </View>
      )}

      {pestana === 'registro' ? (
        <ScrollView
          contentContainerStyle={{ padding: espacio.lg }}
          keyboardShouldPersistTaps="handled"
        >
          <Titulo>Registrar nuevo gasto logístico</Titulo>

          {/* Metadatos automáticos */}
          <Tarjeta>
            <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 4 }}>
              DATOS AUTOMÁTICOS DEL REGISTRO (RN-MOV-25)
            </Text>
            <Fila etiqueta="Responsable" valor={`${nombreResponsable} (${idUsuario})`} />
            <Fila etiqueta="Fecha y hora" valor="Automática al confirmar" />
            <Fila
              etiqueta="Política móvil"
              valor="Solo registro (sin edición ni eliminación)"
            />
          </Tarjeta>

          {/* Valor y descripción */}
          <Tarjeta>
            <Text style={[estilos.etiquetaCampo, { color: c.texto }]}>
              Valor total del gasto (COP — obligatorio, mayor a 0)
            </Text>
            <TextInput
              value={valorTexto}
              onChangeText={setValorTexto}
              placeholder="Ej: 85000"
              placeholderTextColor={c.textoSecundario}
              keyboardType="numeric"
              style={[
                estilos.input,
                {
                  color: c.texto,
                  borderColor: c.borde,
                  backgroundColor: c.fondo,
                },
              ]}
            />
            <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: espacio.sm }}>
              El valor corresponde al gasto total: no se multiplica por el número de
              asociaciones ni se distribuye automáticamente.
            </Text>

            <Text style={[estilos.etiquetaCampo, { color: c.texto }]}>
              Descripción / observaciones (obligatoria)
            </Text>
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Describe el concepto del gasto (flete, peaje, combustible, cargue…)"
              placeholderTextColor={c.textoSecundario}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[
                estilos.input,
                {
                  color: c.texto,
                  borderColor: c.borde,
                  backgroundColor: c.fondo,
                  minHeight: 76,
                },
              ]}
            />
          </Tarjeta>

          {/* Asociaciones seleccionadas */}
          <Titulo>Alquileres asociados ({asociaciones.length})</Titulo>
          <Tarjeta>
            {asociaciones.length === 0 ? (
              <Text style={{ color: c.alerta, fontSize: 13, fontWeight: '600' }}>
                ⚠️ Debes asociar al menos un alquiler e indicar si el movimiento fue de
                entrega o recogida (RNM-09 / RNM-10).
              </Text>
            ) : (
              asociaciones.map((asoc, idx) => {
                const alq = mapaAlquileres.get(asoc.id_alquiler);
                const otroTipo: TipoMovimientoAsociacion =
                  asoc.tipo_movimiento === 'entrega' ? 'recogida' : 'entrega';
                return (
                  <View
                    key={`${asoc.id_alquiler}-${asoc.tipo_movimiento}`}
                    style={[
                      estilos.itemAsociacion,
                      { borderBottomColor: c.borde },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.texto, fontWeight: '700', fontSize: 14 }}>
                        Alquiler #{asoc.id_alquiler} ·{' '}
                        {asoc.tipo_movimiento === 'entrega' ? '🚚 ENTREGA' : '📦 RECOGIDA'}
                      </Text>
                      {alq && (
                        <Text style={{ color: c.textoSecundario, fontSize: 12 }}>
                          {alq.cliente.nombres_cliente} {alq.cliente.apellidos_cliente} ·{' '}
                          {alq.barrio}
                        </Text>
                      )}
                    </View>

                    <View style={estilos.accionesAsociacion}>
                      <Pressable
                        onPress={() => handleCambiarTipoAsociacion(idx, otroTipo)}
                        style={[
                          estilos.botonChico,
                          { borderColor: c.primario },
                        ]}
                      >
                        <Text style={{ color: c.primario, fontSize: 11, fontWeight: '700' }}>
                          Cambiar a {otroTipo}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleQuitarAsociacion(idx)}
                        style={[
                          estilos.botonChico,
                          { borderColor: c.peligro },
                        ]}
                      >
                        <Text style={{ color: c.peligro, fontSize: 11, fontWeight: '700' }}>
                          Quitar
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </Tarjeta>

          {/* Buscador de alquileres para asociar */}
          <Titulo>Buscar alquiler para asociar (por ID o cliente)</Titulo>
          <Tarjeta>
            <TextInput
              value={busquedaAlquiler}
              onChangeText={setBusquedaAlquiler}
              placeholder="Buscar por #ID (ej. 101) o nombre del cliente…"
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
            <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: espacio.sm }}>
              Puedes asociar el mismo alquiler hasta dos veces únicamente si una asociación
              es de Entrega y la otra de Recogida (RNM-11).
            </Text>

            {alquileresFiltradosBusqueda.length === 0 ? (
              <Text style={{ color: c.textoSecundario, fontSize: 13 }}>
                No se encontraron alquileres con ese criterio.
              </Text>
            ) : (
              alquileresFiltradosBusqueda.slice(0, 6).map((alq) => {
                const tieneEntrega = asociaciones.some(
                  (a) =>
                    a.id_alquiler === alq.id_alquiler && a.tipo_movimiento === 'entrega'
                );
                const tieneRecogida = asociaciones.some(
                  (a) =>
                    a.id_alquiler === alq.id_alquiler && a.tipo_movimiento === 'recogida'
                );

                return (
                  <View
                    key={alq.id_alquiler}
                    style={[
                      estilos.filaCandidato,
                      { borderTopColor: c.borde },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.texto, fontWeight: '700', fontSize: 14 }}>
                        #{alq.id_alquiler} — {alq.cliente.nombres_cliente}{' '}
                        {alq.cliente.apellidos_cliente}
                      </Text>
                      <Text style={{ color: c.textoSecundario, fontSize: 12 }}>
                        {alq.direccion} ({alq.barrio}) · Estado: {alq.estado_alquiler}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Pressable
                        onPress={() => handleAgregarAsociacion(alq.id_alquiler, 'entrega')}
                        style={[
                          estilos.botonAsociar,
                          {
                            backgroundColor: tieneEntrega ? c.borde : c.primario,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: tieneEntrega ? c.textoSecundario : c.primarioTexto,
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          {tieneEntrega ? '✓ Entrega' : '+ Entrega'}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleAgregarAsociacion(alq.id_alquiler, 'recogida')}
                        style={[
                          estilos.botonAsociar,
                          {
                            backgroundColor: tieneRecogida ? c.borde : c.exito,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: tieneRecogida ? c.textoSecundario : '#FFFFFF',
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          {tieneRecogida ? '✓ Recogida' : '+ Recogida'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </Tarjeta>

          {errorFormulario && (
            <View
              style={[
                estilos.bannerFeedback,
                { backgroundColor: c.peligro + '18', borderColor: c.peligro },
              ]}
            >
              <Text style={{ color: c.peligro, fontWeight: '700', fontSize: 13 }}>
                {errorFormulario}
              </Text>
            </View>
          )}

          <Boton
            titulo="Revisar y confirmar gasto"
            onPress={handleSolicitarConfirmacion}
            style={{ marginTop: espacio.sm, marginBottom: espacio.xl }}
          />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: espacio.lg }}>
          {/* SECCIÓN 1: RESUMEN SEMANAL DE LUNES A DOMINGO (§3.4) */}
          <Titulo>Resumen semanal (lunes a domingo)</Titulo>
          <Tarjeta>
            <View style={estilos.navegadorSemana}>
              <Pressable
                onPress={() => setDesplazamientoSemana((d) => d - 1)}
                style={[estilos.botonSemana, { borderColor: c.primario }]}
              >
                <Text style={{ color: c.primario, fontWeight: '700', fontSize: 12 }}>
                  ◀ Semana ant.
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setDesplazamientoSemana(0)}
                style={[
                  estilos.botonSemana,
                  {
                    borderColor: c.borde,
                    backgroundColor:
                      desplazamientoSemana === 0 ? c.simuladoFondo : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: c.texto, fontWeight: '700', fontSize: 12 }}>
                  {desplazamientoSemana === 0
                    ? 'Semana actual'
                    : `Hace ${Math.abs(desplazamientoSemana)} sem.`}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setDesplazamientoSemana((d) => Math.min(0, d + 1))}
                disabled={desplazamientoSemana >= 0}
                style={[
                  estilos.botonSemana,
                  { borderColor: c.primario },
                  desplazamientoSemana >= 0 && { opacity: 0.35 },
                ]}
              >
                <Text style={{ color: c.primario, fontWeight: '700', fontSize: 12 }}>
                  Semana sig. ▶
                </Text>
              </Pressable>
            </View>

            <Text
              style={{
                color: c.texto,
                fontWeight: '700',
                fontSize: 14,
                textAlign: 'center',
                marginVertical: 6,
              }}
            >
              Lun {formatearFecha(resumenSemanal.semana_inicio)} – Dom{' '}
              {formatearFecha(resumenSemanal.semana_fin)}
            </Text>

            <Fila
              etiqueta="Total gastado en la semana"
              valor={moneda(resumenSemanal.total)}
            />
            <Fila
              etiqueta={`Confirmados servidor (${resumenSemanal.cantidad_confirmados})`}
              valor={moneda(resumenSemanal.total_confirmado)}
            />
            <Fila
              etiqueta={`Pendientes locales (${resumenSemanal.cantidad_pendientes_locales})`}
              valor={moneda(resumenSemanal.total_pendiente_local)}
            />

            {/* Selector de promedio diario o semanal (§3.4) */}
            <View style={estilos.selectorPromedio}>
              <Text style={{ color: c.textoSecundario, fontSize: 12, fontWeight: '600' }}>
                Visualizar promedio:
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pressable
                  onPress={() => setModoPromedio('diario')}
                  style={[
                    estilos.chipOpcion,
                    {
                      borderColor: c.primario,
                      backgroundColor:
                        modoPromedio === 'diario' ? c.primario : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: modoPromedio === 'diario' ? c.primarioTexto : c.primario,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    Promedio diario
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setModoPromedio('semanal')}
                  style={[
                    estilos.chipOpcion,
                    {
                      borderColor: c.primario,
                      backgroundColor:
                        modoPromedio === 'semanal' ? c.primario : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: modoPromedio === 'semanal' ? c.primarioTexto : c.primario,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    Promedio semanal
                  </Text>
                </Pressable>
              </View>
            </View>

            {modoPromedio === 'diario' ? (
              <Fila
                etiqueta="Promedio diario (total semana / 7 días)"
                valor={`${moneda(resumenSemanal.promedio_diario)} / día`}
              />
            ) : (
              <Fila
                etiqueta="Promedio semanal (histórico de semanas activas)"
                valor={`${moneda(resumenSemanal.promedio_semanal)} / semana`}
              />
            )}

            {resumenSemanal.cantidad_gastos === 0 && (
              <Text
                style={{
                  color: c.textoSecundario,
                  fontSize: 12,
                  fontStyle: 'italic',
                  marginTop: 6,
                }}
              >
                No existen gastos registrados en esta semana (lunes a domingo).
              </Text>
            )}

            <Text style={{ color: c.simulado, fontSize: 11, marginTop: 6 }}>
              Nota DEP-MOV-01: resumen calculado con datos simulados/locales del EL. En el
              backend actual GET /gastos/resumen-semanal requiere validación de rol.
            </Text>
          </Tarjeta>

          {/* SECCIÓN 2: FILTROS DE CONSULTA (§3.4) */}
          <Titulo>Filtrar mis gastos</Titulo>
          <Tarjeta>
            <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 4 }}>
              Por descripción o #alquiler
            </Text>
            <TextInput
              value={filtroDescripcion}
              onChangeText={setFiltroDescripcion}
              placeholder="Buscar por descripción, concepto o #alquiler…"
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

            <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 4 }}>
              Por día (YYYY-MM-DD)
            </Text>
            <TextInput
              value={filtroDia}
              onChangeText={setFiltroDia}
              placeholder="Ej: 2026-11-21"
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

            {diasDisponibles.length > 0 && (
              <View style={estilos.filaChips}>
                {diasDisponibles.slice(0, 4).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setFiltroDia(filtroDia === d ? '' : d)}
                    style={[
                      estilos.chipOpcion,
                      {
                        borderColor: c.borde,
                        backgroundColor: filtroDia === d ? c.primario : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: filtroDia === d ? c.primarioTexto : c.textoSecundario,
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: espacio.sm, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 2 }}>
                  Valor mínimo
                </Text>
                <TextInput
                  value={filtroValorMin}
                  onChangeText={setFiltroValorMin}
                  placeholder="Min COP"
                  placeholderTextColor={c.textoSecundario}
                  keyboardType="numeric"
                  style={[
                    estilos.input,
                    {
                      color: c.texto,
                      borderColor: c.borde,
                      backgroundColor: c.fondo,
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textoSecundario, fontSize: 12, marginBottom: 2 }}>
                  Valor máximo
                </Text>
                <TextInput
                  value={filtroValorMax}
                  onChangeText={setFiltroValorMax}
                  placeholder="Max COP"
                  placeholderTextColor={c.textoSecundario}
                  keyboardType="numeric"
                  style={[
                    estilos.input,
                    {
                      color: c.texto,
                      borderColor: c.borde,
                      backgroundColor: c.fondo,
                    },
                  ]}
                />
              </View>
            </View>

            {(filtroDia || filtroDescripcion || filtroValorMin || filtroValorMax) && (
              <Boton
                titulo="Limpiar filtros"
                secundario
                onPress={() => {
                  setFiltroDia('');
                  setFiltroDescripcion('');
                  setFiltroValorMin('');
                  setFiltroValorMax('');
                }}
              />
            )}
          </Tarjeta>

          {/* SECCIÓN 3: LISTADO DE GASTOS PROPIOS (§3.4) */}
          <Titulo>Gastos propios ({gastosFiltrados.length})</Titulo>
          {gastosFiltrados.length === 0 ? (
            <Tarjeta>
              <Vacio
                titulo="No existen gastos para mostrar"
                detalle={
                  gastosPropios.length === 0
                    ? 'Aún no has registrado gastos logísticos.'
                    : 'Ningún gasto coincide con los filtros de día, descripción o valor seleccionados.'
                }
              />
            </Tarjeta>
          ) : (
            gastosFiltrados.map((g) => {
              const esConfirmado = g.estado === 'confirmada';
              const esError = g.estado === 'error';
              return (
                <Tarjeta
                  key={g.id}
                  onPress={() => setGastoSeleccionado(g)}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ color: c.texto, fontSize: 17, fontWeight: '800' }}>
                      {moneda(g.valor)}
                    </Text>
                    <Etiqueta
                      texto={
                        esConfirmado
                          ? '✓ Confirmado (servidor simulado)'
                          : esError
                          ? '⚠ Local — Error sync'
                          : '⏳ Local — Pendiente sync'
                      }
                      tono={esConfirmado ? 'exito' : esError ? 'peligro' : 'alerta'}
                    />
                  </View>

                  <Text style={{ color: c.texto, fontSize: 14, fontWeight: '600' }}>
                    {g.descripcion}
                  </Text>

                  <Text style={{ color: c.textoSecundario, fontSize: 12, marginTop: 4 }}>
                    📅 {formatearFechaHora(g.fecha)} · 👤 {g.responsable_nombre}
                  </Text>

                  <Text style={{ color: c.primario, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                    Asociaciones ({g.asociaciones.length}):{' '}
                    {g.asociaciones
                      .map((a) => `#${a.id_alquiler} (${a.tipo_movimiento})`)
                      .join(', ')}
                  </Text>
                </Tarjeta>
              );
            })
          )}
        </ScrollView>
      )}

      {/* MODAL DE CONFIRMACIÓN ANTES DE GUARDAR (§3.3) */}
      <Modal
        visible={modalConfirmarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalConfirmarVisible(false)}
      >
        <View style={estilos.fondoModal}>
          <View
            style={[
              estilos.cajaModal,
              { backgroundColor: c.superficie, borderColor: c.borde },
            ]}
          >
            <Text style={{ color: c.texto, fontSize: 17, fontWeight: '800' }}>
              Confirmar registro de gasto
            </Text>

            <Fila
              etiqueta="Valor total (global)"
              valor={moneda(parsearValorPositivo(valorTexto) ?? 0)}
            />
            <Fila etiqueta="Descripción" valor={descripcion.trim()} />
            <Fila etiqueta="Responsable" valor={nombreResponsable} />
            <Fila
              etiqueta="Conectividad actual"
              valor={
                conectado
                  ? 'Con conexión (se sincronizará)'
                  : 'Sin conexión (se guardará en cola local)'
              }
            />

            <Text style={{ color: c.texto, fontWeight: '700', fontSize: 13 }}>
              Alquileres asociados ({asociaciones.length}):
            </Text>
            {asociaciones.map((a) => (
              <Text
                key={`${a.id_alquiler}-${a.tipo_movimiento}`}
                style={{ color: c.textoSecundario, fontSize: 13 }}
              >
                • Alquiler #{a.id_alquiler} — Movimiento de{' '}
                <Text style={{ fontWeight: '700', color: c.texto }}>
                  {a.tipo_movimiento.toUpperCase()}
                </Text>
              </Text>
            ))}

            <View
              style={[
                estilos.bannerFeedback,
                { backgroundColor: c.alerta + '18', borderColor: c.alerta },
              ]}
            >
              <Text style={{ color: c.alerta, fontSize: 12, fontWeight: '600' }}>
                ⚠️ Verifica los datos antes de guardar. El encargado logístico no puede
                editar ni eliminar gastos después de registrarlos (RNM-12).
              </Text>
            </View>

            {guardando ? (
              <ActivityIndicator color={c.primario} />
            ) : (
              <View style={{ gap: espacio.sm }}>
                <Boton
                  titulo="Confirmar y guardar gasto"
                  onPress={handleConfirmarYGuardar}
                />
                <Boton
                  titulo="Volver y corregir"
                  secundario
                  onPress={() => setModalConfirmarVisible(false)}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DE DETALLE DEL GASTO (§3.4) */}
      <Modal
        visible={gastoSeleccionado !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setGastoSeleccionado(null)}
      >
        <View style={estilos.fondoModal}>
          <View
            style={[
              estilos.cajaModal,
              { backgroundColor: c.superficie, borderColor: c.borde },
            ]}
          >
            {gastoSeleccionado && (
              <>
                <Text style={{ color: c.texto, fontSize: 18, fontWeight: '800' }}>
                  Detalle del gasto · {moneda(gastoSeleccionado.valor)}
                </Text>
                <Etiqueta
                  texto={
                    gastoSeleccionado.estado === 'confirmada'
                      ? 'Confirmado por el servidor (simulado)'
                      : gastoSeleccionado.estado === 'error'
                      ? 'Operación local con error de sincronización'
                      : 'Operación local pendiente de sincronización'
                  }
                  tono={
                    gastoSeleccionado.estado === 'confirmada'
                      ? 'exito'
                      : gastoSeleccionado.estado === 'error'
                      ? 'peligro'
                      : 'alerta'
                  }
                />

                <Fila etiqueta="ID registro" valor={gastoSeleccionado.id} />
                <Fila
                  etiqueta="Valor total (no distribuido)"
                  valor={moneda(gastoSeleccionado.valor)}
                />
                <Fila
                  etiqueta="Fecha y hora"
                  valor={formatearFechaHora(gastoSeleccionado.fecha)}
                />
                <Fila
                  etiqueta="Responsable"
                  valor={gastoSeleccionado.responsable_nombre}
                />
                <Fila etiqueta="Descripción" valor={gastoSeleccionado.descripcion} />

                <Text style={{ color: c.texto, fontWeight: '700', fontSize: 13 }}>
                  Alquileres relacionados ({gastoSeleccionado.asociaciones.length}):
                </Text>
                {gastoSeleccionado.asociaciones.map((asoc) => {
                  const alq = mapaAlquileres.get(asoc.id_alquiler);
                  return (
                    <View
                      key={`${asoc.id_alquiler}-${asoc.tipo_movimiento}`}
                      style={[
                        estilos.itemDetalleAsoc,
                        { borderColor: c.borde },
                      ]}
                    >
                      <Text style={{ color: c.texto, fontWeight: '700', fontSize: 13 }}>
                        Alquiler #{asoc.id_alquiler} · Movimiento:{' '}
                        {asoc.tipo_movimiento.toUpperCase()}
                      </Text>
                      {alq && (
                        <Text style={{ color: c.textoSecundario, fontSize: 12 }}>
                          Cliente: {alq.cliente.nombres_cliente}{' '}
                          {alq.cliente.apellidos_cliente} · {alq.direccion} ({alq.barrio})
                        </Text>
                      )}
                    </View>
                  );
                })}

                <Text style={{ color: c.textoSecundario, fontSize: 12, fontStyle: 'italic' }}>
                  Solo lectura: no se permite editar ni eliminar gastos desde la aplicación
                  móvil (RNM-12).
                </Text>

                <Boton
                  titulo="Cerrar detalle"
                  secundario
                  onPress={() => setGastoSeleccionado(null)}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  selectorPestanas: {
    flexDirection: 'row',
    padding: espacio.sm,
    gap: espacio.sm,
    borderBottomWidth: 1,
  },
  botonPestana: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  etiquetaCampo: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: espacio.md,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: espacio.sm,
  },
  itemAsociacion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: espacio.sm,
  },
  accionesAsociacion: {
    flexDirection: 'row',
    gap: 6,
  },
  botonChico: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  filaCandidato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: espacio.sm,
  },
  botonAsociar: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  bannerFeedback: {
    borderWidth: 1,
    borderRadius: 8,
    padding: espacio.sm,
    marginHorizontal: espacio.lg,
    marginTop: espacio.sm,
  },
  navegadorSemana: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  botonSemana: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  selectorPromedio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  chipOpcion: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: espacio.sm,
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
  itemDetalleAsoc: {
    borderWidth: 1,
    borderRadius: 8,
    padding: espacio.sm,
  },
});
