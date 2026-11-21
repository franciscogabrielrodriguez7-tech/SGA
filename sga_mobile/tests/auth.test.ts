/**
 * Tests — Autenticación, Persistencia de Sesión y Almacenamiento Seguro — SGA Móvil (§3.2)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  estaExpirada,
  fijarOffsetExpiracion,
  renovarSesion,
  verificarCredenciales,
} from '../src/data/mock/auth.ts';
import { authServiceMock, simularSinConexion } from '../src/services/mock/authServiceMock.ts';
import {
  eliminarSesion,
  guardarSesion,
  obtenerDatosPrivadosUsuario,
  obtenerMetadatosSesion,
  restaurarSesionCompleta,
  simularReinicioAppMemoria,
} from '../src/storage/sesion.ts';

function esSesion(
  r: unknown
): r is { id_usuario: string; rol: string; token: string; expiraEn: string } {
  return r !== null && typeof r === 'object';
}

describe('verificarCredenciales', () => {
  it('retorna SesionUsuario con credenciales correctas (usuario)', () => {
    const r = verificarCredenciales('logistico1', 'demo123');
    assert.ok(esSesion(r), 'Debe retornar sesión');
    assert.equal(r.id_usuario, 'usr-001');
    assert.equal(r.rol, 'ENCARGADO_LOGISTICO');
    assert.ok(r.token.startsWith('mock-token-'), 'Token debe tener prefijo mock');
    assert.ok(r.expiraEn.length > 0, 'expiraEn debe estar definido');
  });

  it('retorna SesionUsuario con credenciales correctas (teléfono)', () => {
    const r = verificarCredenciales('3001234567', 'demo123');
    assert.ok(esSesion(r), 'Debe retornar sesión por teléfono');
    assert.equal(r.id_usuario, 'usr-001');
  });

  it('retorna null con contraseña incorrecta', () => {
    const r = verificarCredenciales('logistico1', 'wrongpass');
    assert.equal(r, null);
  });

  it('retorna null con usuario inexistente', () => {
    const r = verificarCredenciales('usuario_fantasma', 'demo123');
    assert.equal(r, null);
  });

  it("retorna 'deshabilitado' para usuario bloqueado", () => {
    const r = verificarCredenciales('logistico_bloqueado', 'demo456');
    assert.equal(r, 'deshabilitado');
  });

  it('ignora espacios en el identificador', () => {
    const r = verificarCredenciales('  logistico1  ', 'demo123');
    assert.ok(esSesion(r));
  });
});

describe('estaExpirada y renovarSesion', () => {
  it('retorna false para sesión vigente y true para sesión expirada', () => {
    fijarOffsetExpiracion(-1);
    const r = verificarCredenciales('logistico1', 'demo123');
    assert.ok(esSesion(r));
    // @ts-ignore
    assert.equal(estaExpirada(r), false);

    const sesionExpirada = {
      id_usuario: 'test',
      nombres: 'Test',
      apellidos: 'User',
      rol: 'ENCARGADO_LOGISTICO' as const,
      token: 'mock-token-test-123',
      expiraEn: new Date(Date.now() - 1000).toISOString(),
    };
    assert.equal(estaExpirada(sesionExpirada), true);
  });

  it('retorna true cuando se usa fijarOffsetExpiracion para anticipar expiración', () => {
    fijarOffsetExpiracion(30 * 60 * 1000 + 1000);
    const r = verificarCredenciales('logistico1', 'demo123');
    assert.ok(esSesion(r));
    // @ts-ignore
    assert.equal(estaExpirada(r), true);
    fijarOffsetExpiracion(-1);
  });

  it('renovarSesion mantiene el usuario y rol', () => {
    fijarOffsetExpiracion(-1);
    const r = verificarCredenciales('logistico1', 'demo123');
    assert.ok(esSesion(r));
    // @ts-ignore
    const renovada = renovarSesion(r);
    assert.equal(renovada.id_usuario, r.id_usuario);
  });
});

describe('Persistencia de sesión, separación de datos y no invención de renovación (§3.2)', () => {
  it('conserva la sesión activa al cerrar y reabrir la aplicación mientras el token sea válido', async () => {
    simularSinConexion(false);
    fijarOffsetExpiracion(-1);

    const loginRes = await authServiceMock.login('logistico1', 'demo123');
    assert.equal(loginRes.ok, true);
    if (!loginRes.ok) return;

    // Simular cierre y reapertura de la aplicación (borra memoria RAM)
    simularReinicioAppMemoria();

    // Restaurar sesión desde almacenamiento persistente
    const restaurada = await authServiceMock.obtenerSesionActual();
    assert.ok(restaurada !== null, 'La sesión debe persistir tras reiniciar la app');
    assert.equal(restaurada.id_usuario, 'usr-001');
    assert.equal(restaurada.token, loginRes.sesion.token);
    assert.equal(estaExpirada(restaurada), false);
  });

  it('separa datos no sensibles, metadatos de sesión y datos privados, y los elimina al cerrar sesión', async () => {
    const metaAntes = await obtenerMetadatosSesion();
    const privadosAntes = await obtenerDatosPrivadosUsuario('usr-001');
    assert.ok(metaAntes !== null);
    assert.ok(privadosAntes !== null);

    await eliminarSesion('usr-001');

    const sesionDespues = await restaurarSesionCompleta();
    const metaDespues = await obtenerMetadatosSesion();
    const privadosDespues = await obtenerDatosPrivadosUsuario('usr-001');

    assert.equal(sesionDespues, null);
    assert.equal(metaDespues, null);
    assert.equal(privadosDespues, null);
  });

  it('el acceso biométrico funciona con sesión vigente pero NO inventa renovación si el token expiró (P-02)', async () => {
    // 1. Con sesión vigente -> OK
    await guardarSesion({
      id_usuario: 'usr-001',
      nombres: 'Carlos',
      apellidos: 'Mendoza',
      rol: 'ENCARGADO_LOGISTICO',
      token: 'mock-token-vigente',
      expiraEn: new Date(Date.now() + 600_000).toISOString(),
    });
    const bioOk = await authServiceMock.renovarBiometrico();
    assert.equal(bioOk.ok, true);

    // 2. Con token expirado -> rechaza con 'sesion_expirada' (no renueva el token)
    await guardarSesion({
      id_usuario: 'usr-001',
      nombres: 'Carlos',
      apellidos: 'Mendoza',
      rol: 'ENCARGADO_LOGISTICO',
      token: 'mock-token-vencido',
      expiraEn: new Date(Date.now() - 10_000).toISOString(),
    });
    const bioExpirado = await authServiceMock.renovarBiometrico();
    assert.equal(bioExpirado.ok, false);
    if (!bioExpirado.ok) {
      assert.equal(bioExpirado.error, 'sesion_expirada');
    }
  });
});
