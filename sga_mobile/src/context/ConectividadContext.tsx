/**
 * Contexto de conectividad y sincronización — SGA Móvil (§3.6)
 *
 * Integra:
 * - Detección real de red con `@react-native-community/netinfo`.
 * - Sincronización automática al recuperar la conexión (RN-MOV-35).
 * - Sincronización manual bajo demanda (RN-MOV-36).
 * - Monitoreo en tiempo real de la cola de operaciones pendientes del usuario activo.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useConectividad, type EstadoRed } from '../hooks/useConectividad';
import { simularSinConexion } from '../services/mock/authServiceMock';
import {
  fijarEscenarioSync,
  obtenerEscenarioSync,
  sincronizarPendientes,
  type EscenarioSync,
} from '../services/mock/syncServiceMock';
import { obtenerNoConfirmadas, suscribirCola } from '../storage/cola';

interface ConectividadContextValue extends EstadoRed {
  /** Total de operaciones no confirmadas en la cola del usuario actual */
  pendientesCola: number;
  /** Total de operaciones en estado 'error' en la cola del usuario actual */
  erroresCola: number;
  /** Escenario de respuesta del servidor simulado ('ok' | 'error' | 'ya_procesado' | 'sin_conexion') */
  escenarioServidorSync: EscenarioSync;
  marcarSincronizando: () => void;
  marcarFinSync: (exito: boolean) => void;
  /** Activa/desactiva la desconexión simulada para pruebas de campo sin cortar el Wi-Fi físico */
  alternarOfflineSimulado: (valor: boolean) => void;
  /** Cambia el comportamiento del servidor simulado durante la sincronización */
  cambiarEscenarioServidorSync: (escenario: EscenarioSync) => void;
  /** Dispara la sincronización manual de las operaciones pendientes */
  sincronizarAhora: () => Promise<{
    confirmadas: number;
    errores: number;
    pendientesRestantes: number;
  }>;
  /** Recarga el conteo de la cola del usuario */
  actualizarConteoCola: () => Promise<void>;
}

const ConectividadContext = createContext<ConectividadContextValue | null>(null);

export function ConectividadProvider({
  children,
  id_usuario,
}: {
  children: React.ReactNode;
  id_usuario: string | null;
}) {
  const red = useConectividad();
  const [pendientesCola, setPendientesCola] = useState(0);
  const [erroresCola, setErroresCola] = useState(0);
  const [escenarioServidorSync, setEscenarioServidorSync] = useState<EscenarioSync>(
    obtenerEscenarioSync()
  );

  const actualizarConteoCola = useCallback(async () => {
    if (!id_usuario) {
      setPendientesCola(0);
      setErroresCola(0);
      return;
    }
    const items = await obtenerNoConfirmadas(id_usuario);
    setPendientesCola(items.length);
    setErroresCola(items.filter((i) => i.estado === 'error').length);
  }, [id_usuario]);

  useEffect(() => {
    actualizarConteoCola();
    const unsub = suscribirCola(() => {
      actualizarConteoCola();
    });
    return unsub;
  }, [actualizarConteoCola]);

  const alternarOfflineSimulado = useCallback(
    (valor: boolean) => {
      simularSinConexion(valor);
      if (valor) {
        fijarEscenarioSync('sin_conexion');
        setEscenarioServidorSync('sin_conexion');
      } else if (obtenerEscenarioSync() === 'sin_conexion') {
        fijarEscenarioSync('ok');
        setEscenarioServidorSync('ok');
      }
      red.fijarOfflineSimulado(valor);
    },
    [red]
  );

  const cambiarEscenarioServidorSync = useCallback(
    (nuevo: EscenarioSync) => {
      fijarEscenarioSync(nuevo);
      setEscenarioServidorSync(nuevo);
      if (nuevo === 'sin_conexion') {
        simularSinConexion(true);
        red.fijarOfflineSimulado(true);
      } else if (red.offlineSimulado) {
        simularSinConexion(false);
        red.fijarOfflineSimulado(false);
      }
    },
    [red]
  );

  const sincronizarAhora = useCallback(async () => {
    if (!id_usuario) {
      return { confirmadas: 0, errores: 0, pendientesRestantes: 0 };
    }
    if (!red.conectado) {
      red.marcarFinSync(false);
      return { confirmadas: 0, errores: 0, pendientesRestantes: pendientesCola };
    }

    red.marcarSincronizando();
    try {
      const r = await sincronizarPendientes(id_usuario);
      await actualizarConteoCola();
      red.marcarFinSync(r.errores === 0);
      return r;
    } catch {
      await actualizarConteoCola();
      red.marcarFinSync(false);
      return { confirmadas: 0, errores: 1, pendientesRestantes: pendientesCola };
    }
  }, [id_usuario, red, pendientesCola, actualizarConteoCola]);

  // Auto-sincronización al recuperar conexión (§3.6 / RN-MOV-35)
  useEffect(() => {
    if (red.acabaDeConectar && red.conectado && id_usuario && pendientesCola > 0) {
      sincronizarAhora();
    }
  }, [red.acabaDeConectar, red.conectado, id_usuario, pendientesCola, sincronizarAhora]);

  return (
    <ConectividadContext.Provider
      value={{
        ...red,
        pendientesCola,
        erroresCola,
        escenarioServidorSync,
        alternarOfflineSimulado,
        cambiarEscenarioServidorSync,
        sincronizarAhora,
        actualizarConteoCola,
      }}
    >
      {children}
    </ConectividadContext.Provider>
  );
}

export function useConectividadCtx(): ConectividadContextValue {
  const ctx = useContext(ConectividadContext);
  if (!ctx) {
    throw new Error('useConectividadCtx debe usarse dentro de ConectividadProvider');
  }
  return ctx;
}
