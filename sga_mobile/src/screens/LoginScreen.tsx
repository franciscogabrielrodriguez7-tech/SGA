/**
 * Pantalla de inicio de sesión — SGA Móvil (§3.2)
 *
 * Permite acceder con usuario o teléfono + contraseña.
 * Soporta desbloqueo biométrico en accesos posteriores únicamente cuando existe
 * una sesión previa cuyo token sigue vigente (RNM-02).
 * No inventa renovación de tokens: si el token expiró, exige login con credenciales.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useConectividadCtx } from '../context/ConectividadContext';
import { espacio, useColores } from '../theme/theme';
import type { ErrorAuth } from '../types/auth';

const MENSAJES_ERROR: Record<ErrorAuth, string> = {
  credenciales_invalidas: 'Usuario o contraseña incorrectos.',
  usuario_deshabilitado:
    'Tu cuenta está deshabilitada en el sistema. Contacta al administrador.',
  sin_conexion:
    'Sin conexión a internet. El inicio de sesión inicial requiere conexión.',
  sesion_expirada:
    'El token de la sesión ha expirado. No existe renovación automática de token (P-02); inicia sesión con tu contraseña.',
  sin_sesion_previa:
    'No hay una sesión vigente almacenada para acceso biométrico.',
  error_desconocido: 'Ocurrió un error inesperado. Intenta de nuevo.',
};

export default function LoginScreen() {
  const colores = useColores();
  const {
    iniciarSesion,
    renovarBiometrico,
    estadoAuth,
    tieneSesionPrevia,
    sesion,
  } = useAuth();
  const { conectado, offlineSimulado, alternarOfflineSimulado } =
    useConectividadCtx();

  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargandoBiometrico, setCargandoBiometrico] = useState(false);

  const styles = crearEstilos(colores);

  async function handleLogin() {
    if (!identificador.trim() || !contrasena) {
      setError('Completa el usuario o teléfono y la contraseña.');
      return;
    }

    if (!conectado) {
      setError(MENSAJES_ERROR.sin_conexion);
      return;
    }

    setCargando(true);
    setError(null);

    const resultado = await iniciarSesion(identificador.trim(), contrasena);

    setCargando(false);

    if (!resultado.ok) {
      setError(
        MENSAJES_ERROR[resultado.error] ?? MENSAJES_ERROR.error_desconocido
      );
    }
  }

  async function handleBiometrico() {
    setCargandoBiometrico(true);
    setError(null);

    const resultado = await renovarBiometrico();

    setCargandoBiometrico(false);

    if (!resultado.ok) {
      setError(
        MENSAJES_ERROR[resultado.error] ??
          'No se pudo validar el acceso biométrico. Inicia sesión con tu contraseña.'
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.contenedor, { backgroundColor: colores.fondo }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.encabezado}>
          <Text style={[styles.titulo, { color: colores.texto }]}>
            SGA Logístico
          </Text>
          <Text style={[styles.subtitulo, { color: colores.textoSecundario }]}>
            Fundiplacas Rodríguez · Módulo Móvil (MVP Simulado)
          </Text>
        </View>

        {/* Estado de conectividad en Login */}
        <View
          style={[
            styles.barraRed,
            {
              backgroundColor: conectado
                ? colores.exito + '18'
                : colores.peligro + '18',
              borderColor: conectado ? colores.exito : colores.peligro,
            },
          ]}
        >
          <Text
            style={{
              color: conectado ? colores.exito : colores.peligro,
              fontSize: 12,
              fontWeight: '700',
            }}
          >
            {conectado
              ? '● Con conexión (listo para autenticar)'
              : '○ Sin conexión (login con credenciales bloqueado offline)'}
          </Text>
          <Pressable
            onPress={() => alternarOfflineSimulado(!offlineSimulado)}
            style={[styles.botonToggleRed, { borderColor: colores.simulado }]}
          >
            <Text
              style={{
                color: colores.simulado,
                fontSize: 11,
                fontWeight: '700',
              }}
            >
              {offlineSimulado ? 'Reconectar red (prueba)' : 'Simular sin red'}
            </Text>
          </Pressable>
        </View>

        {/* Aviso de sesión expirada */}
        {estadoAuth === 'expirada' && (
          <View
            style={[
              styles.avisoExpiracion,
              {
                backgroundColor: colores.advertencia + '22',
                borderColor: colores.advertencia,
              },
            ]}
          >
            <Text style={[styles.avisoTexto, { color: colores.advertencia }]}>
              ⚠️ Tu sesión anterior expiró. La política de expiración sin conexión
              y renovación de tokens está documentada como pendiente (P-01 / P-02).
              Inicia sesión nuevamente con tus credenciales.
            </Text>
          </View>
        )}

        {/* Aviso de acceso posterior con sesión vigente bloqueada (RNM-02) */}
        {estadoAuth === 'bloqueada_biometria' && sesion && (
          <View
            style={[
              styles.avisoExpiracion,
              {
                backgroundColor: colores.primario + '18',
                borderColor: colores.primario,
              },
            ]}
          >
            <Text style={[styles.avisoTexto, { color: colores.primario }]}>
              🔒 Sesión vigente de {sesion.nombres} {sesion.apellidos}. Puedes
              desbloquear con biometría (RNM-02) o ingresar con contraseña.
            </Text>
          </View>
        )}

        {/* Formulario */}
        <View style={styles.formulario}>
          <Text style={[styles.etiqueta, { color: colores.textoSecundario }]}>
            Usuario o teléfono
          </Text>
          <TextInput
            style={[
              styles.campo,
              {
                color: colores.texto,
                borderColor: colores.borde,
                backgroundColor: colores.superficie,
              },
            ]}
            value={identificador}
            onChangeText={setIdentificador}
            placeholder="logistico1 ó 3001234567"
            placeholderTextColor={colores.textoSecundario}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!cargando}
          />

          <Text style={[styles.etiqueta, { color: colores.textoSecundario }]}>
            Contraseña
          </Text>
          <TextInput
            style={[
              styles.campo,
              {
                color: colores.texto,
                borderColor: colores.borde,
                backgroundColor: colores.superficie,
              },
            ]}
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="••••••••"
            placeholderTextColor={colores.textoSecundario}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            editable={!cargando}
          />

          {error && (
            <View
              style={[
                styles.mensajeError,
                {
                  backgroundColor: colores.error + '18',
                  borderColor: colores.error,
                },
              ]}
            >
              <Text style={[styles.textoError, { color: colores.error }]}>
                {error}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.botonPrincipal,
              { backgroundColor: colores.primario },
              (cargando || cargandoBiometrico) && styles.botonDeshabilitado,
            ]}
            onPress={handleLogin}
            disabled={cargando || cargandoBiometrico}
            activeOpacity={0.8}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.textoBotonPrincipal}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          {tieneSesionPrevia && (
            <TouchableOpacity
              style={[
                styles.botonSecundario,
                { borderColor: colores.primario },
                (cargando || cargandoBiometrico) && styles.botonDeshabilitado,
              ]}
              onPress={handleBiometrico}
              disabled={cargando || cargandoBiometrico}
              activeOpacity={0.8}
            >
              {cargandoBiometrico ? (
                <ActivityIndicator color={colores.primario} />
              ) : (
                <Text
                  style={[
                    styles.textoBotonSecundario,
                    { color: colores.primario },
                  ]}
                >
                  🔒 Acceso biométrico (sesión vigente)
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Credenciales rápidas de prueba para evaluación del MVP */}
        <View
          style={[
            styles.cajaDemo,
            {
              backgroundColor: colores.simuladoFondo,
              borderColor: colores.simulado,
            },
          ]}
        >
          <Text
            style={{
              color: colores.simulado,
              fontWeight: '700',
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            Credenciales simuladas de prueba (toca para autocompletar):
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Pressable
              onPress={() => {
                setIdentificador('logistico1');
                setContrasena('demo123');
                setError(null);
              }}
              style={[styles.chipDemo, { borderColor: colores.simulado }]}
            >
              <Text style={{ color: colores.simulado, fontSize: 11, fontWeight: '700' }}>
                ✓ EL activo (logistico1 / demo123)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setIdentificador('3001234567');
                setContrasena('demo123');
                setError(null);
              }}
              style={[styles.chipDemo, { borderColor: colores.simulado }]}
            >
              <Text style={{ color: colores.simulado, fontSize: 11, fontWeight: '700' }}>
                📱 Por teléfono (3001234567)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setIdentificador('logistico_bloqueado');
                setContrasena('demo456');
                setError(null);
              }}
              style={[styles.chipDemo, { borderColor: colores.simulado }]}
            >
              <Text style={{ color: colores.simulado, fontSize: 11, fontWeight: '700' }}>
                🚫 Usuario deshabilitado
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function crearEstilos(colores: ReturnType<typeof useColores>) {
  return StyleSheet.create({
    contenedor: { flex: 1 },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: espacio.lg,
    },
    encabezado: {
      alignItems: 'center',
      marginBottom: espacio.lg,
    },
    titulo: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: espacio.xs,
    },
    subtitulo: {
      fontSize: 14,
      textAlign: 'center',
    },
    barraRed: {
      borderWidth: 1,
      borderRadius: 8,
      padding: espacio.sm,
      marginBottom: espacio.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    botonToggleRed: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    avisoExpiracion: {
      borderWidth: 1,
      borderRadius: 8,
      padding: espacio.md,
      marginBottom: espacio.md,
    },
    avisoTexto: {
      fontSize: 13,
      textAlign: 'center',
      fontWeight: '600',
    },
    formulario: {
      gap: espacio.sm,
    },
    etiqueta: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 2,
    },
    campo: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: espacio.md,
      paddingVertical: espacio.sm + 2,
      fontSize: 16,
      marginBottom: espacio.sm,
    },
    mensajeError: {
      borderWidth: 1,
      borderRadius: 8,
      padding: espacio.md,
      marginBottom: espacio.sm,
    },
    textoError: {
      fontSize: 13,
      fontWeight: '600',
    },
    botonPrincipal: {
      borderRadius: 8,
      paddingVertical: espacio.md,
      alignItems: 'center',
      marginTop: espacio.xs,
    },
    textoBotonPrincipal: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    botonSecundario: {
      borderWidth: 1.5,
      borderRadius: 8,
      paddingVertical: espacio.md,
      alignItems: 'center',
      marginTop: espacio.xs,
    },
    textoBotonSecundario: {
      fontWeight: '700',
      fontSize: 15,
    },
    botonDeshabilitado: {
      opacity: 0.6,
    },
    cajaDemo: {
      marginTop: espacio.lg,
      borderWidth: 1,
      borderRadius: 10,
      padding: espacio.md,
    },
    chipDemo: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
  });
}
