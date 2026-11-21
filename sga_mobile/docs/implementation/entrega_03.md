# Informe de entrega 3 y cierre funcional del MVP — SGA Móvil

**Proyecto:** Sistema de Gestión de Alquileres (SGA) — Fundiplacas Rodríguez  
**Módulo:** Aplicación móvil logística (`sga_mobile/`)  
**Rama oficial:** `mobile/mvp`  
**Fecha:** 2026-11-21  
**Versión:** Entrega 3 — Cierre de sesión seguro, persistencia de sesión, gastos, resumen semanal, historial, conectividad `NetInfo` y análisis de seguridad

---

## 1. Qué se implementó en la Entrega 3

### 1.1 Cierre de sesión seguro con operaciones pendientes (§3.1)
- Implementación completa en `src/context/AuthContext.tsx` (`solicitarCierre`, `confirmarCierre`) y componente visual global `src/components/BannerEstadoSistema.tsx`.
- **Con conexión:** antes de cerrar sesión intenta sincronizar automáticamente todas las operaciones pendientes (`sincronizarPendientes`). Si se confirman todas, cierra la sesión; si alguna falla, muestra el modal de advertencia.
- **Sin conexión (o con operaciones fallidas):**
  - Muestra cuántas operaciones están pendientes.
  - Informa explícitamente que se cancelarían si se confirma el cierre y que no se conservarán automáticamente para otra sesión.
  - Ofrece tres opciones claras:
    1. **Intentar conectarse y sincronizar ahora.**
    2. **Confirmar expresamente la cancelación de las operaciones pendientes y cerrar sesión** (`cancelarOperacionesPendientesUsuario`).
    3. **Volver y mantener la sesión activa.**
- Al confirmar el cierre, elimina del dispositivo los elementos de autenticación, el estado de sesión y los datos privados locales asociados al usuario (`eliminarSesion`).

### 1.2 Persistencia de sesión y separación de datos (§3.2)
- Rediseño de `src/storage/sesion.ts`, `src/services/mock/authServiceMock.ts` y `src/types/auth.ts`:
  - **La sesión persiste al cerrar y volver a abrir la aplicación mientras el token siga siendo válido** (`restaurarSesionCompleta`).
  - Separación explícita en cuatro categorías:
    1. **Datos no sensibles del perfil** (`PerfilUsuarioNoSensible`: `id_usuario`, `nombres`, `apellidos`, `rol`).
    2. **Elementos de autenticación** (`ElementosAutenticacion`: `token`, `expiraEn`) gestionados mediante la interfaz `SecureStorageAdapter` preparada para `expo-secure-store` (`DEP-INT-02`).
    3. **Estado de sesión** (`MetadatosSesion`: `establecidaEn`, `ultimoAccesoEn`, `biometriaHabilitada`).
    4. **Información privada almacenada localmente** (`DatosPrivadosLocalesUsuario`).
  - **Sin invención de renovación de tokens:** el acceso biométrico en aperturas posteriores (`RNM-02`) únicamente desbloquea una sesión cuyo token sigue vigente. Si el token ya expiró, devuelve `sesion_expirada` y redirige al login con aviso (`P-01` / `P-02`).

### 1.3 Registro completo de gastos (§3.3)
- Implementado en `src/domain/gastos.ts`, `src/services/GastosService.ts`, `src/services/mock/gastosServiceMock.ts` y `src/screens/GastosScreen.tsx`:
  - Valor total estrictamente positivo (`> 0`). El valor es global: **no se multiplica por el número de asociaciones ni se distribuye automáticamente**.
  - Descripción / observaciones obligatorias.
  - Búsqueda de alquileres elegibles (no cancelados) por ID o nombre/documento del cliente.
  - Asociación con uno o varios alquileres indicando el tipo de movimiento por asociación: `entrega` o `recogida` (`RNM-10`).
  - Permite agregar asociaciones, quitar asociaciones y **modificar el tipo de movimiento** de una asociación ya agregada.
  - **Regla de unicidad (`RNM-11`):** permite repetir el mismo alquiler únicamente cuando los tipos de movimiento son diferentes (`entrega` + `recogida`), e impide repetirlo con el mismo tipo de movimiento.
  - Exige al menos un alquiler asociado (`RNM-09`).
  - Modal de **confirmación previa antes de guardar** con resumen completo y advertencia de no edición/eliminación (`RNM-12`).
  - Fecha, hora y usuario automáticos.
  - Soporte offline: si no hay conexión, se encola localmente y se etiqueta como `⏳ Local — Pendiente sync`.

### 1.4 Consulta de gastos propios y resumen semanal de lunes a domingo (§3.4)
- Implementado en `src/screens/GastosScreen.tsx` y `src/domain/gastos.ts`:
  - Listado de gastos propios del encargado logístico autenticado (`id_usuario`), sin botones ni funciones de edición o eliminación (`RNM-12`).
  - Modal de detalle completo del gasto (ID, estado de confirmación, valor total, fecha/hora, responsable, descripción y detalle de cada alquiler asociado con su tipo de movimiento).
  - Filtros combinables por **día** (`YYYY-MM-DD` con chips rápidos), **descripción** y **valor** (mínimo y máximo).
  - **Resumen semanal de lunes a domingo** con navegación a **semanas anteriores** (`◀ Semana ant.`, `Semana actual`, `Semana sig. ▶`).
  - Muestra **total gastado**, desglose entre **gastos confirmados por el servidor** y **gastos pendientes localmente**, y selector interactivo entre **promedio diario** (`total / 7 días`) y **promedio semanal**.
  - Mensaje informativo cuando no existen gastos en la semana o con los filtros seleccionados.

### 1.5 Historial de operaciones propias (§3.5)
- Implementado en `src/domain/historial.ts`, `src/services/HistorialService.ts`, `src/services/mock/historialServiceMock.ts` y `src/screens/HistorialScreen.tsx`:
  - Unifica **entregas**, **recogidas** y **gastos** exclusivamente del encargado logístico autenticado (`RNM-13`).
  - **Orden cronológico descendente** (más reciente primero).
  - Muestra fecha y hora, tipo de operación, alquiler(es) relacionado(s), responsable, valor (cuando corresponde a gasto) y detalle de observaciones/descripción.
  - **Filtros independientes** por tipo de operación (`Todos`, `Entregas`, `Recogidas`, `Gastos`), estado de sincronización (`Todos`, `Confirmados`, `Pendientes locales`, `Con error`) y fecha (`YYYY-MM-DD`).
  - **Búsqueda** por ID (de operación o alquiler), cliente, descripción/observaciones y tipo de operación, acompañada de **sugerencias dinámicas de búsqueda** (`generarSugerenciasHistorial`).
  - Identificación explícita de operaciones locales todavía no confirmadas por el servidor (`RNM-14`).
  - Modal de detalle de operación con acceso directo al detalle del alquiler relacionado.

### 1.6 Conectividad real con `NetInfo` y máquina de estados (§3.6)
- Implementado en `src/hooks/useConectividad.ts`, `src/context/ConectividadContext.tsx` y `src/components/BannerEstadoSistema.tsx`:
  - Integra `@react-native-community/netinfo` diferenciando los 5 estados requeridos:
    1. **Con conexión**
    2. **Sin conexión**
    3. **Recuperación de conexión** (con disparo automático de sincronización de la cola pendiente)
    4. **Sincronización en curso**
    5. **Sincronización con errores**
  - Mantiene la detección real de conectividad separada de la simulación del backend (`estadoSimulado.ts` y `syncServiceMock.ts`), donde al confirmar una entrega el alquiler pasa de `pendiente` a `activo` y al confirmar una recogida pasa de `activo`/`vencido` a `recogido` (`RNM-16`).

---

## 2. Análisis de seguridad — Vulnerabilidades reportadas por `npm audit` (§6)

Se ejecutó `npm.cmd audit` sobre el árbol de paquetes de `sga_mobile/`:

| Campo | Resultado del análisis |
|---|---|
| **Paquete afectado** | `minimatch` (rango `7.0.0 - 11.0.0`) |
| **Aviso de seguridad** | `GHSA-g3hv-75wg-m249` — Potencial denegación de servicio (ReDoS) por amplificación de `globparts` |
| **Severidad** | Moderada (`moderate` — 3 entradas contadas por npm en la cadena `minimatch` → `@expo/fingerprint` → `expo`) |
| **Tipo de dependencia** | **Indirecta (transitiva)** de herramientas de CLI/compilación (`expo` → `@expo/fingerprint` → `minimatch`). **No se incluye en el bundle JS de producción (Hermes) que se ejecuta en el dispositivo móvil.** |
| **Compatibilidad con Expo** | El comando automático `npm audit fix --force` propone instalar `expo@52.0.49` (cambio disruptivo / *breaking change* desde Expo SDK 58 `~58.0.26`), lo cual rompería la compatibilidad con React `19.3.0` y React Native `0.88.1`. |
| **Decisión aplicada** | **No ejecutar `npm audit fix --force`** ni degradar Expo SDK 58, cumpliendo la directriz de no actualizar dependencias indiscriminadamente cuando rompen la aplicación. El riesgo en tiempo de ejecución móvil es nulo porque `minimatch` solo se invoca localmente en la máquina de desarrollo con rutas internas del proyecto. |

---

## 3. Verificaciones ejecutadas y resultados

| Prueba / Verificación | Comando | Resultado |
|---|---|---|
| Tipado estricto TypeScript | `npx.cmd tsc --noEmit` | ✅ **0 errores** |
| Suite de pruebas unitarias e integrales | `node --test tests/*.test.ts` | ✅ **39/39 pruebas aprobadas (0 fallos)** |
| Empaquetado Android (Metro + Hermes) | `npx.cmd expo export --platform android` | ✅ **Compilación exitosa** |
| Ejecución visual en emulador Android | Inspección de `adb` / `emulator` / `%LOCALAPPDATA%\Android\Sdk` | ⚠️ **Bloqueada por entorno:** el equipo Windows no tiene instalado Android SDK (`adb`/`emulator` ausentes). Ver sección 4. |

### Desglose de las 39 pruebas automatizadas
- `tests/alquileres.test.ts`: 9 pruebas (visibilidad sin cancelados, elegibilidad de entrega/recogida, cálculo de vencimientos, próximos a vencer ≤ 2 días, resumen de inicio, búsqueda, filtros y ordenamiento).
- `tests/auth.test.ts`: 12 pruebas (credenciales por usuario y teléfono, usuario deshabilitado, expiración de token, persistencia de sesión tras reinicio de app, separación de las 4 categorías de datos y eliminación al cerrar sesión, desbloqueo biométrico sin inventar renovación de token expirado).
- `tests/cola.test.ts`: 4 pruebas integrales asíncronas (aislamiento por `id_usuario`, prevención de duplicados, 3 intentos automáticos ante fallo de servidor dejando estado `error`, y cancelación expresa al confirmar cierre de sesión sin conexión).
- `tests/gastos.test.ts`: 8 pruebas (valor estrictamente positivo, descripción y mínimo 1 alquiler obligatorios, repetición de alquiler solo con distinto tipo de movimiento `entrega`/`recogida`, modificación y eliminación de asociaciones, búsqueda sin cancelados, aislamiento de gastos propios, filtros por día/descripción/valor, cálculo de semana lunes a domingo y no multiplicación del valor global por asociaciones).
- `tests/historial.test.ts`: 5 pruebas (unificación de entregas, recogidas y gastos propios, orden cronológico descendente, marcado de operaciones locales no confirmadas, filtros independientes y sugerencias dinámicas de búsqueda).
- `tests/flujo_mvp_e2e.test.ts`: 1 prueba integral de extremo a extremo que recorre secuencialmente los 16 criterios del MVP.
