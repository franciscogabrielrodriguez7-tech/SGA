/**
 * Barra superior de estado de conectividad, sincronización y sesión — SGA Móvil (§3.1 y §3.6)
 *
 * Muestra:
 * 1. Los 5 estados de conectividad exigidos en §3.6:
 *    - Con conexión
 *    - Sin conexión
 *    - Recuperación de conexión
 *    - Sincronización en curso
 *    - Sincronización con errores
 * 2. Contador de operaciones locales pendientes y botón de sincronización manual.
 * 3. Usuario autenticado y botón de "Cerrar sesión" con el modal completo de
 *    protección de operaciones pendientes (§3.1):
 *    - Indica cuántas operaciones están pendientes.
 *    - Informa que se cancelarían si se confirma el cierre.
 *    - Permite intentar conectarse y sincronizar.
 *    - Permite confirmar expresamente la cancelación y cerrar sesión.
 *    - Permite volver sin cancelar ni cerrar sesión.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useConectividadCtx } from '../context/ConectividadContext';
import type { EstadoConectividad } from '../hooks/useConectividad';
import { espacio, useColores } from '../theme/theme';

const ETIQUETA_CONECTIVIDAD: Record<
  EstadoConectividad,
  { icono: string; texto: string; tono: 'exito' | 'alerta' | 'peligro' | 'primario' }
> = {
  con_conexion: {
    icono: '●',
    texto: 'Con conexión (NetInfo activo)',
    tono: 'exito',
  },
  sin_conexion: {
    icono: '○',
    texto: 'Sin conexión — modo offline activo',
    tono: 'peligro',
  },
  recuperando: {
    icono: '↻',
    texto: 'Recuperación de conexión detectada…',
    tono: 'alerta',
  },
  sincronizando: {
    icono: '⇅',
    texto: 'Sincronización en curso…',
    tono: 'primario',
  },
  error_sync: {
    icono: '⚠',
    texto: 'Sincronización con errores',
    tono: 'peligro',
  },
};

export function BannerEstadoSistema() {
  const c = useColores();
  const { sesion, solicitarCierre, confirmarCierre } = useAuth();
  const {
    estado,
    conectado,
    pendientesCola,
    erroresCola,
    sincronizarAhora,
    alternarOfflineSimulado,
  } = useConectividadCtx();

  const [procesandoCierre, setProcesandoCierre] = useState(false);
  const [modalPendientesVisible, setModalPendientesVisible] = useState(false);
  const [cantidadEnRiesgo, setCantidadEnRiesgo] = useState(0);
  const [mensajeModal, setMensajeModal] = useState('');
  const [sincronizandoDesdeModal, setSincronizandoDesdeModal] = useState(false);

  if (!sesion) return null;

  const infoRed = ETIQUETA_CONECTIVIDAD[estado];
  const colorIndicador =
    infoRed.tono === 'exito'
      ? c.exito
      : infoRed.tono === 'alerta'
      ? c.alerta
      : infoRed.tono === 'peligro'
      ? c.peligro
      : c.primario;

  async function handleIniciarCierreSesion() {
    setProcesandoCierre(true);
    try {
      const resultado = await solicitarCierre(conectado);
      if (!resultado.listoParaCerrar) {
        setCantidadEnRiesgo(resultado.pendientes);
        setMensajeModal(
          resultado.mensajeAdvertencia ??
            `Existen ${resultado.pendientes} operación(es) pendiente(s) de sincronización. Si confirmas el cierre de sesión, se cancelarán.`
        );
        setModalPendientesVisible(true);
      }
    } finally {
      setProcesandoCierre(false);
    }
  }

  async function handleConectarYSincronizarDesdeModal() {
    setSincronizandoDesdeModal(true);
    try {
      // Si estaba en offline simulado, reconectar para permitir sincronizar
      if (!conectado) {
        alternarOfflineSimulado(false);
      }
      // Ejecutar solicitud de cierre con conexión habilitada (intentará sincronizar y cerrar)
      const resultado = await solicitarCierre(true);
      if (resultado.listoParaCerrar) {
        setModalPendientesVisible(false);
      } else {
        setCantidadEnRiesgo(resultado.pendientes);
        setMensajeModal(
          resultado.mensajeAdvertencia ??
            `Aún quedan ${resultado.pendientes} operación(es) sin poder sincronizarse.`
        );
      }
    } finally {
      setSincronizandoDesdeModal(false);
    }
  }

  async function handleConfirmarCancelacionYCerrar() {
    setSincronizandoDesdeModal(true);
    try {
      await confirmarCierre(true);
      setModalPendientesVisible(false);
    } finally {
      setSincronizandoDesdeModal(false);
    }
  }

  return (
    <View
      style={[
        estilos.contenedor,
        { backgroundColor: c.superficie, borderBottomColor: c.borde },
      ]}
    >
      {/* Fila 1: Usuario + botón cerrar sesión */}
      <View style={estilos.filaSuperior}>
        <Text style={{ color: c.texto, fontSize: 12, fontWeight: '700' }}>
          👤 {sesion.nombres} {sesion.apellidos} · EL
        </Text>
        <Pressable
          onPress={handleIniciarCierreSesion}
          disabled={procesandoCierre}
          style={[
            estilos.botonCerrar,
            { borderColor: c.peligro },
            procesandoCierre && { opacity: 0.5 },
          ]}
        >
          <Text style={{ color: c.peligro, fontSize: 12, fontWeight: '700' }}>
            {procesandoCierre ? 'Verificando…' : 'Cerrar sesión'}
          </Text>
        </Pressable>
      </View>

      {/* Fila 2: Estado de conectividad NetInfo + Cola pendiente */}
      <View style={estilos.filaInferior}>
        <View style={estilos.estadoRed}>
          {estado === 'sincronizando' ? (
            <ActivityIndicator size="small" color={c.primario} />
          ) : (
            <Text style={{ color: colorIndicador, fontSize: 13, fontWeight: '800' }}>
              {infoRed.icono}
            </Text>
          )}
          <Text
            style={{
              color: colorIndicador,
              fontSize: 12,
              fontWeight: '600',
              flexShrink: 1,
            }}
          >
            {infoRed.texto}
          </Text>
        </View>

        {pendientesCola > 0 && (
          <View style={estilos.accionesCola}>
            <Text
              style={{
                color: erroresCola > 0 ? c.peligro : c.alerta,
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              ⏳ {pendientesCola} pend.{erroresCola > 0 ? ` (${erroresCola} err)` : ''}
            </Text>
            <Pressable
              onPress={() => sincronizarAhora()}
              disabled={!conectado || estado === 'sincronizando'}
              style={[
                estilos.botonSync,
                {
                  backgroundColor: conectado ? c.primario : c.borde,
                },
              ]}
            >
              <Text
                style={{
                  color: conectado ? c.primarioTexto : c.textoSecundario,
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                Sincronizar
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Modal obligatorio de advertencia al cerrar sesión con operaciones pendientes (§3.1) */}
      <Modal
        visible={modalPendientesVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalPendientesVisible(false)}
      >
        <View style={estilos.fondoModal}>
          <View
            style={[
              estilos.cajaModal,
              { backgroundColor: c.superficie, borderColor: c.borde },
            ]}
          >
            <Text style={[estilos.tituloModal, { color: c.peligro }]}>
              ⚠️ Operaciones pendientes sin sincronizar ({cantidadEnRiesgo})
            </Text>

            <Text style={[estilos.textoModal, { color: c.texto }]}>
              {mensajeModal}
            </Text>

            <View
              style={[
                estilos.avisoRegla,
                { backgroundColor: c.alerta + '18', borderColor: c.alerta },
              ]}
            >
              <Text style={{ color: c.alerta, fontSize: 12, fontWeight: '600' }}>
                • Si confirmas la cancelación y cierras sesión, las {cantidadEnRiesgo}{' '}
                operación(es) pendientes se cancelarán definitivamente y se eliminarán
                los datos privados de la sesión.{'\n'}
                • No se conservarán automáticamente para otra sesión.
              </Text>
            </View>

            {sincronizandoDesdeModal ? (
              <ActivityIndicator
                color={c.primario}
                style={{ marginVertical: espacio.md }}
              />
            ) : (
              <View style={estilos.botonesModal}>
                <Pressable
                  onPress={handleConectarYSincronizarDesdeModal}
                  style={[
                    estilos.botonModalAccion,
                    { backgroundColor: c.primario },
                  ]}
                >
                  <Text
                    style={{
                      color: c.primarioTexto,
                      fontWeight: '700',
                      fontSize: 14,
                    }}
                  >
                    1. Intentar conectarse y sincronizar ahora
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleConfirmarCancelacionYCerrar}
                  style={[
                    estilos.botonModalAccion,
                    { backgroundColor: c.peligro },
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                    2. Confirmar cancelación de pendientes y cerrar sesión
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setModalPendientesVisible(false)}
                  style={[
                    estilos.botonModalAccion,
                    { borderColor: c.borde, borderWidth: 1 },
                  ]}
                >
                  <Text style={{ color: c.texto, fontWeight: '600', fontSize: 14 }}>
                    Volver y mantener la sesión activa
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    paddingHorizontal: espacio.md,
    paddingVertical: espacio.xs + 2,
    borderBottomWidth: 1,
    gap: 4,
  },
  filaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filaInferior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: espacio.xs,
  },
  estadoRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  accionesCola: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
  },
  botonCerrar: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  botonSync: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    gap: espacio.md,
  },
  tituloModal: {
    fontSize: 17,
    fontWeight: '800',
  },
  textoModal: {
    fontSize: 14,
    lineHeight: 20,
  },
  avisoRegla: {
    borderWidth: 1,
    borderRadius: 8,
    padding: espacio.sm,
  },
  botonesModal: {
    gap: espacio.sm,
  },
  botonModalAccion: {
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: espacio.md,
    alignItems: 'center',
  },
});
