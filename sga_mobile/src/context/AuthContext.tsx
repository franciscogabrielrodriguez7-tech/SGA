/**
 * Contexto de autenticación y gestión segura de sesión — SGA Móvil (§3.1 y §3.2)
 *
 * Responsabilidades:
 * 1. Restaurar la sesión al iniciar o reabrir la app si el token sigue siendo válido.
 * 2. Detectar si el token ha expirado y exigir reautenticación (sin inventar
 *    renovación de tokens — P-01 / P-02).
 * 3. Permitir desbloqueo biométrico en accesos posteriores cuando la sesión sigue
 *    vigente (RNM-02).
 * 4. Ejecutar el flujo de cierre de sesión seguro (§3.1):
 *    - Con conexión: intenta sincronizar las operaciones pendientes antes de cerrar.
 *    - Sin conexión (o si quedan pendientes tras intentar sincronizar): informa
 *      cuántas operaciones están pendientes, advierte que se cancelarían si se
 *      confirma el cierre, y permite elegir entre conectarse/sincronizar o
 *      confirmar expresamente la cancelación y cerrar sesión.
 *    - Al confirmar el cierre: elimina datos privados y elementos de sesión.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { estaExpirada } from '../data/mock/auth';
import { authService } from '../services';
import { estaSimulandoSinConexionAuth } from '../services/mock/authServiceMock';
import {
  obtenerEscenarioSync,
  sincronizarPendientes,
} from '../services/mock/syncServiceMock';
import {
  cancelarOperacionesPendientesUsuario,
  obtenerNoConfirmadas,
} from '../storage/cola';
import {
  actualizarSesionPersistida,
  simularReinicioAppMemoria,
} from '../storage/sesion';
import type {
  EstadoAuth,
  ResultadoLogin,
  ResultadoSolicitudCierre,
  SesionUsuario,
} from '../types/auth';

interface AuthContextValue {
  sesion: SesionUsuario | null;
  estadoAuth: EstadoAuth;
  tieneSesionPrevia: boolean;
  iniciarSesion(identificador: string, contrasena: string): Promise<ResultadoLogin>;
  /**
   * Evalúa si se puede cerrar sesión inmediatamente o si existen operaciones
   * pendientes que requieren sincronización / confirmación expresa (§3.1).
   */
  solicitarCierre(conectadoRed?: boolean): Promise<ResultadoSolicitudCierre>;
  /**
   * Ejecuta el cierre definitivo de la sesión.
   * Si `cancelarPendientes` es true, cancela expresamente las operaciones pendientes
   * del usuario antes de eliminar los datos privados y elementos de sesión.
   */
  confirmarCierre(cancelarPendientes?: boolean): Promise<void>;
  /**
   * Acceso biométrico para desbloquear una sesión cuyo token sigue vigente (RNM-02).
   */
  renovarBiometrico(): Promise<ResultadoLogin>;
  /**
   * Bloquea la pantalla conservando la sesión vigente en almacenamiento seguro
   * para poder probar el acceso posterior con biometría (RNM-02).
   */
  bloquearParaAccesoBiometrico(): void;
  /**
   * Simula cerrar y volver a abrir la aplicación (limpia RAM y revalida desde storage).
   */
  simularReinicioAplicacion(): Promise<void>;
  /**
   * Fuerza la expiración inmediata del token actual para probar el escenario de
   * sesión expirada (P-01 / P-02).
   */
  simularExpiracionTokenActual(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<SesionUsuario | null>(null);
  const [estadoAuth, setEstadoAuth] = useState<EstadoAuth>('verificando');
  const [tieneSesionPrevia, setTieneSesionPrevia] = useState(false);

  const verificarSesionAlmacenada = useCallback(async () => {
    setEstadoAuth('verificando');
    try {
      const actual = await authService.obtenerSesionActual();
      if (!actual) {
        setSesion(null);
        setTieneSesionPrevia(false);
        setEstadoAuth('sin_sesion');
        return;
      }

      setTieneSesionPrevia(true);

      if (!actual.token || estaExpirada(actual)) {
        setSesion(actual);
        setEstadoAuth('expirada');
      } else {
        setSesion(actual);
        setEstadoAuth('con_sesion');
      }
    } catch {
      setSesion(null);
      setEstadoAuth('sin_sesion');
    }
  }, []);

  useEffect(() => {
    verificarSesionAlmacenada();
  }, [verificarSesionAlmacenada]);

  const iniciarSesion = useCallback(
    async (identificador: string, contrasena: string): Promise<ResultadoLogin> => {
      const resultado = await authService.login(identificador, contrasena);
      if (resultado.ok) {
        setSesion(resultado.sesion);
        setTieneSesionPrevia(true);
        setEstadoAuth('con_sesion');
      }
      return resultado;
    },
    []
  );

  const confirmarCierre = useCallback(
    async (cancelarPendientes = false): Promise<void> => {
      const uid = sesion?.id_usuario;
      if (uid && cancelarPendientes) {
        await cancelarOperacionesPendientesUsuario(uid);
      }
      await authService.cerrarSesion(uid);
      setSesion(null);
      setTieneSesionPrevia(false);
      setEstadoAuth('sin_sesion');
    },
    [sesion]
  );

  const solicitarCierre = useCallback(
    async (conectadoRed = true): Promise<ResultadoSolicitudCierre> => {
      if (!sesion) {
        await confirmarCierre(false);
        return {
          listoParaCerrar: true,
          pendientes: 0,
          conectado: conectadoRed,
          sincronizadasAntesDeCerrar: 0,
          erroresSincronizacion: 0,
        };
      }

      const hayConexionEfectiva =
        conectadoRed &&
        !estaSimulandoSinConexionAuth() &&
        obtenerEscenarioSync() !== 'sin_conexion';

      const noConfirmadasAntes = await obtenerNoConfirmadas(sesion.id_usuario);

      // Si no hay operaciones pendientes, cerrar sesión directamente
      if (noConfirmadasAntes.length === 0) {
        await confirmarCierre(false);
        return {
          listoParaCerrar: true,
          pendientes: 0,
          conectado: hayConexionEfectiva,
          sincronizadasAntesDeCerrar: 0,
          erroresSincronizacion: 0,
        };
      }

      // Si hay conexión, intentar sincronizar antes de cerrar sesión (§3.1)
      if (hayConexionEfectiva) {
        const resumenSync = await sincronizarPendientes(sesion.id_usuario);
        const restantes = await obtenerNoConfirmadas(sesion.id_usuario);

        if (restantes.length === 0) {
          await confirmarCierre(false);
          return {
            listoParaCerrar: true,
            pendientes: 0,
            conectado: true,
            sincronizadasAntesDeCerrar: resumenSync.confirmadas,
            erroresSincronizacion: 0,
          };
        }

        return {
          listoParaCerrar: false,
          pendientes: restantes.length,
          conectado: true,
          sincronizadasAntesDeCerrar: resumenSync.confirmadas,
          erroresSincronizacion: resumenSync.errores,
          mensajeAdvertencia: `Se intentó sincronizar antes de cerrar sesión, pero ${restantes.length} operación(es) siguen pendientes por error de sincronización. Si confirmas el cierre de sesión, dichas operaciones se cancelarán.`,
        };
      }

      // Sin conexión y con operaciones pendientes (§3.1)
      return {
        listoParaCerrar: false,
        pendientes: noConfirmadasAntes.length,
        conectado: false,
        sincronizadasAntesDeCerrar: 0,
        erroresSincronizacion: 0,
        mensajeAdvertencia: `Tienes ${noConfirmadasAntes.length} operación(es) pendiente(s) de sincronización y el dispositivo está sin conexión. Si confirmas el cierre de sesión, estas operaciones se cancelarán y no se conservarán para otra sesión.`,
      };
    },
    [sesion, confirmarCierre]
  );

  const renovarBiometrico = useCallback(async (): Promise<ResultadoLogin> => {
    const resultado = await authService.renovarBiometrico();
    if (resultado.ok) {
      setSesion(resultado.sesion);
      setTieneSesionPrevia(true);
      setEstadoAuth('con_sesion');
    } else if (resultado.error === 'sesion_expirada') {
      setEstadoAuth('expirada');
    }
    return resultado;
  }, []);

  const bloquearParaAccesoBiometrico = useCallback(() => {
    if (sesion && !estaExpirada(sesion)) {
      setTieneSesionPrevia(true);
      setEstadoAuth('bloqueada_biometria');
    }
  }, [sesion]);

  const simularReinicioAplicacion = useCallback(async () => {
    simularReinicioAppMemoria();
    await verificarSesionAlmacenada();
  }, [verificarSesionAlmacenada]);

  const simularExpiracionTokenActual = useCallback(async () => {
    if (!sesion) return;
    const expirada: SesionUsuario = {
      ...sesion,
      expiraEn: new Date(Date.now() - 5000).toISOString(),
    };
    await actualizarSesionPersistida(expirada);
    setSesion(expirada);
    setEstadoAuth('expirada');
  }, [sesion]);

  return (
    <AuthContext.Provider
      value={{
        sesion,
        estadoAuth,
        tieneSesionPrevia,
        iniciarSesion,
        solicitarCierre,
        confirmarCierre,
        renovarBiometrico,
        bloquearParaAccesoBiometrico,
        simularReinicioAplicacion,
        simularExpiracionTokenActual,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
