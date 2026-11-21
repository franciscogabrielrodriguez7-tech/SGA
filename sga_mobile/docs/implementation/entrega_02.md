# Informe de entrega 2 — MVP SGA Móvil

**Proyecto:** SGA Móvil — Fundiplacas Rodríguez  
**Fecha:** 2026-11-21  
**Rama:** `mobile/mvp`  
**Versión:** Entrega 2 — Autenticación, Cola offline y Flujos de operación

---

## 1. Situación de partida

| Ítem | Estado al inicio |
|---|---|
| Rama `dev/mobile` | ❌ Imposible (conflicto Git: `dev` existe como rama) |
| Rama `mobile/mvp` | ✅ Creada desde `dev` (autorizada por propietario) |
| Entrega 1 | ✅ Aprobada como base de desarrollo |
| `docs/architecture/architecture_map.md` | Modificado antes del MVP (conservado íntegramente) |
| `sga_mobile/` (entrega 1) | 40+ archivos sin seguimiento en `dev` → trasladados a `mobile/mvp` |

---

## 2. Archivos creados en la entrega 2

### Tipos
| Archivo | Contenido |
|---|---|
| `src/types/auth.ts` | `SesionUsuario`, `EstadoAuth`, `CredencialesLogin`, `ErrorAuth`, `ResultadoLogin` |
| `src/types/queue.ts` | `OperacionPendiente<T>`, `TipoOperacion`, `EstadoOperacion`, `PayloadEntrega/Recogida/Gasto` |

### Datos mock
| Archivo | Contenido |
|---|---|
| `src/data/mock/auth.ts` | Credenciales simuladas, `verificarCredenciales`, `estaExpirada`, `renovarSesion`, `fijarOffsetExpiracion` |

### Servicios
| Archivo | Contenido |
|---|---|
| `src/services/AuthService.ts` | Interfaz `AuthService` (login, cerrarSesion, obtenerSesionActual, renovarBiometrico) |
| `src/services/MapService.ts` | Interfaz `MapService` (geocodificar, obtenerRuta, obtenerUbicacionActual) |
| `src/services/mock/authServiceMock.ts` | Adaptador mock: login, biométrico, sin conexión, usuario deshabilitado |
| `src/services/mock/syncServiceMock.ts` | Sincronización simulada: 3 reintentos (RNM-17), anti-duplicados, escenarios configurables |
| `src/services/mock/mapServiceMock.ts` | Mapa y coordenadas simuladas (Bogotá), escenarios de error configurables |

### Storage
| Archivo | Contenido |
|---|---|
| `src/storage/sesion.ts` | Sesión en memoria + AsyncStorage (sin token en disco) |
| `src/storage/cola.ts` | Cola offline por usuario: `encolar`, `obtenerPendientes`, `actualizarOperacion`, `limpiarConfirmadas`, `yaConfirmada` |

### Contexto
| Archivo | Contenido |
|---|---|
| `src/context/AuthContext.tsx` | `AuthProvider`, `useAuth`, estados de sesión, `solicitarCierre`, `confirmarCierre` |

### Pantallas nuevas
| Archivo | Contenido |
|---|---|
| `src/screens/LoginScreen.tsx` | Formulario login/biométrico, estados de error, aviso de sesión expirada, nota mock |
| `src/screens/EntregaScreen.tsx` | Registro de entrega (solo `pendiente`), cola offline, badge de pendiente |
| `src/screens/RecogidaScreen.tsx` | Registro de recogida (solo `activo`/`vencido`), cola offline |
| `src/screens/MapaScreen.tsx` | Mapa simulado con aviso obligatorio DEP-INT-04 |

### Tests
| Archivo | Tests |
|---|---|
| `tests/auth.test.ts` | 11 tests: credenciales, expiración, renovación |
| `tests/cola.test.ts` | 10 tests: tipos, aislamiento de usuario, IDs, payloads |

---

## 3. Archivos modificados en la entrega 2

| Archivo | Cambio |
|---|---|
| `App.tsx` | Envuelto con `AuthProvider` |
| `src/navigation/types.ts` | Añadidas rutas `Entrega`, `Recogida`, `Mapa`; tipo `AlquilerParaOperacion` |
| `src/navigation/RootNavigator.tsx` | Protección de sesión; nuevas pantallas en stack; redirección a `LoginScreen` |
| `src/screens/DetalleAlquilerScreen.tsx` | Botones Entrega/Recogida habilitados; navegación a `Mapa` |
| `src/services/index.ts` | Exporta también `authService` |
| `src/components/ui.tsx` | `Tarjeta` acepta `style`; `Boton` acepta `etiqueta`/`variante`; `Titulo` acepta `texto` |
| `src/theme/theme.ts` | Añadidos campos `error` y `advertencia` como aliases de `peligro`/`alerta` |

---

## 4. Reglas de negocio aplicadas

| Regla | Aplicación |
|---|---|
| RNM-02 | Biométrico disponible solo si existe sesión previa (flag `tieneSesionPrevia`) |
| RNM-05 | Entrega: solo alquileres `pendiente` |
| RNM-06 | Recogida: solo alquileres `activo` o `vencido` |
| RNM-09 | Validación de valor positivo en `PayloadGasto` (tipo + test) |
| RNM-10/11 | `PayloadGasto` requiere al menos una asociación con tipo_movimiento |
| RNM-15 (revisado) | Cola atada a `id_usuario`; otro usuario no ve ni sincroniza ops ajenas |
| RNM-17 | 3 reintentos automáticos en `syncServiceMock` antes de marcar error |
| Logout con ops pendientes | `solicitarCierre()` retorna conteo de pendientes; UI debe advertir y ofrecer dos opciones (no implementada pantalla de alerta en esta entrega — pendiente en Entrega 3) |

---

## 5. Dependencias integradas pendientes

| Código | Descripción |
|---|---|
| DEP-INT-01 | Backend: `/auth/login` real aún no validado para móvil |
| DEP-INT-02 | `expo-secure-store` para token en producción (hoy: memoria volátil) |
| DEP-INT-03 | Endpoints de entrega/recogida/gasto del backend no validados para móvil |
| DEP-INT-04 | Proveedor de mapas/GPS real no seleccionado |
| DEP-INT-05 | `NetInfo` para detectar conectividad real (hoy: siempre `puedeConectar: true`) |

---

## 6. Verificaciones

| Verificación | Resultado |
|---|---|
| `tsc --noEmit` | ✅ 0 errores |
| `node --test` (29 tests) | ✅ 29/29 PASS |
| `expo export --platform android` | Ver sección 7 |
| Validación visual en dispositivo/emulador | ❌ No realizada (requiere bypass de sandbox para `expo start`) |

---

## 7. Estado Git

```
Rama activa: mobile/mvp
 M docs/architecture/architecture_map.md   ← preexistente, no del MVP
?? sga_mobile/                             ← todo el trabajo sin rastrear
Sin commits realizados
```

> [!IMPORTANT]
> No se ha hecho ningún commit ni push. La autorización de commit queda pendiente del propietario.

---

## 8. Pendiente para Entrega 3

- Pantalla de logout con advertencia de operaciones pendientes (el flujo de `solicitarCierre` ya existe; falta la UI de alerta)
- `GastosScreen.tsx`: formulario completo de registro de gastos (asociaciones, tipo_movimiento, valor positivo)
- `HistorialScreen.tsx`: historial de operaciones propias del EL
- Integración de `NetInfo` para detectar conectividad real (DEP-INT-05)
- Validación visual en dispositivo/emulador Android

---

## 9. Contradicciones documentales abiertas (sin cambios)

Las contradicciones identificadas en la sesión anterior siguen abiertas y no resueltas:

- Numeración RN-MOV-xx vs RNM-xx (mis docs vs matriz)
- RNM-02 ausente en HU-01 y RN-MOV
- RNM-09/10/11 ausentes en HU-08
- RNM-16 y RNM-17 ausentes en mis docs de arquitectura
- Estado de Fase 2 ("cerrada/aprobada" vs "borrador pendiente de aprobación")

Estas contradicciones requieren revisión documental por el propietario antes de cerrar la Fase 2.
