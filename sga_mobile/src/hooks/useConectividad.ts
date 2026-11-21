/**
 * Hook de conectividad con NetInfo — SGA Móvil (§3.6)
 *
 * Distingue explícitamente los 5 estados requeridos:
 * - 'con_conexion': Conectado a red
 * - 'sin_conexion': Sin red (detectado por NetInfo o forzado en pruebas)
 * - 'recuperando': Acaba de recuperar la conexión (dispara auto-sync)
 * - 'sincronizando': Sincronización en curso
 * - 'error_sync': La última sincronización finalizó con errores
 *
 * Mantiene la detección real de red (NetInfo) separada de la simulación del backend.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type EstadoConectividad =
  | 'con_conexion'
  | 'sin_conexion'
  | 'recuperando'
  | 'sincronizando'
  | 'error_sync';

export interface EstadoRed {
  estado: EstadoConectividad;
  /** True si hay conexión efectiva (NetInfo conectado y sin bloqueo manual de pruebas) */
  conectado: boolean;
  /** Estado bruto reportado por @react-native-community/netinfo */
  conectadoNetInfo: boolean;
  /** True si el usuario activó el modo offline simulado en el panel de pruebas */
  offlineSimulado: boolean;
  /** True durante la ventana de transición tras recuperar la conexión */
  acabaDeConectar: boolean;
}

const VENTANA_RECUPERACION_MS = 1800;

export function useConectividad(): EstadoRed & {
  marcarSincronizando: () => void;
  marcarFinSync: (exito: boolean) => void;
  fijarOfflineSimulado: (valor: boolean) => void;
} {
  const [conectadoNetInfo, setConectadoNetInfo] = useState(true);
  const [offlineSimulado, setOfflineSimulado] = useState(false);
  const [estado, setEstado] = useState<EstadoConectividad>('con_conexion');
  const [acabaDeConectar, setAcabaDeConectar] = useState(false);

  const conectadoEfectivo = conectadoNetInfo && !offlineSimulado;
  const anteriorConectadoRef = useRef(true);
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const actualizarTransicionConectividad = useCallback((nuevoConectado: boolean) => {
    const eraConectado = anteriorConectadoRef.current;
    anteriorConectadoRef.current = nuevoConectado;

    if (!nuevoConectado) {
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
      setAcabaDeConectar(false);
      setEstado('sin_conexion');
    } else if (!eraConectado && nuevoConectado) {
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
      setAcabaDeConectar(true);
      setEstado('recuperando');
      temporizadorRef.current = setTimeout(() => {
        setAcabaDeConectar(false);
        setEstado((prev) => (prev === 'recuperando' ? 'con_conexion' : prev));
      }, VENTANA_RECUPERACION_MS);
    } else {
      setEstado((prev) =>
        prev === 'sincronizando' || prev === 'error_sync' ? prev : 'con_conexion'
      );
    }
  }, []);

  useEffect(() => {
    let montado = true;

    NetInfo.fetch()
      .then((state: NetInfoState) => {
        if (!montado) return;
        const hayRed = state.isConnected ?? true;
        setConectadoNetInfo(hayRed);
      })
      .catch(() => {
        // En caso de fallo de lectura inicial, asumir conectado
      });

    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      if (!montado) return;
      const hayRed = state.isConnected ?? true;
      setConectadoNetInfo(hayRed);
    });

    return () => {
      montado = false;
      unsub();
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
    };
  }, []);

  useEffect(() => {
    actualizarTransicionConectividad(conectadoEfectivo);
  }, [conectadoEfectivo, actualizarTransicionConectividad]);

  const marcarSincronizando = useCallback(() => {
    setEstado('sincronizando');
  }, []);

  const marcarFinSync = useCallback(
    (exito: boolean) => {
      if (!conectadoEfectivo) {
        setEstado('sin_conexion');
        return;
      }
      setEstado(exito ? 'con_conexion' : 'error_sync');
    },
    [conectadoEfectivo]
  );

  const fijarOfflineSimulado = useCallback((valor: boolean) => {
    setOfflineSimulado(valor);
  }, []);

  return {
    estado,
    conectado: conectadoEfectivo,
    conectadoNetInfo,
    offlineSimulado,
    acabaDeConectar,
    marcarSincronizando,
    marcarFinSync,
    fijarOfflineSimulado,
  };
}
