# Seguimiento del MVP — Módulo Logístico Móvil del SGA

**Proyecto:** Sistema de Gestión de Alquileres (SGA) — Fundiplacas Rodríguez  
**Módulo:** Aplicación móvil logística (`sga_mobile/`)  
**Rama oficial de desarrollo:** `mobile/mvp`  
**Fecha de actualización:** 2026-11-21  
**Estado general:** MVP funcionalmente completado con datos simulados (Entregas 1, 2 y 3 implementadas y verificadas con 39/39 pruebas automatizadas; pendiente validación visual en dispositivo/emulador físico)

---

> [!IMPORTANT]
> Este documento registra el seguimiento oficial del MVP móvil, el reconocimiento del repositorio, las entregas realizadas, las dependencias de integración y la comparación documental de trazabilidad. Las contradicciones documentales detectadas **no se resuelven unilateralmente**: se documentan con una propuesta de correspondencia para decisión del propietario.

## Convención de estados utilizada en este documento

| Etiqueta | Significado |
|---|---|
| **Aprobado** | Decisión o requisito ratificado expresamente por el propietario. |
| **Implementado** | Funcionalidad construida en código dentro de `sga_mobile/` con datos simulados y verificada con pruebas automatizadas / compilación. |
| **Pendiente de validación** | Elemento implementado o documentado que requiere validación visual en emulador/dispositivo o confirmación técnica frente al backend. |
| **Pendiente de decisión** | Aspecto funcional, documental o arquitectónico que presenta contradicción o vacío y requiere decisión expresa del propietario. |
| **Fuera del alcance del MVP** | Funcionalidad excluida de la primera versión móvil o perteneciente a la Fase 6 (integración real con API). |

---

## 1. Autorización y decisiones de Git

| ID | Aspecto | Detalle | Estado |
|---|---|---|---|
| GIT-01 | Rama oficial del MVP | `mobile/mvp` creada a partir de `dev` (`HEAD` base `cefb92df`). | **Aprobado** |
| GIT-02 | Descarte de `dev/mobile` | Git almacena las ramas como archivos bajo `.git/refs/heads/`. Como ya existe la rama `dev` (`.git/refs/heads/dev`), Git impide crear `.git/refs/heads/dev/mobile` por conflicto jerárquico archivo/directorio. | **Aprobado** |
| GIT-03 | Integridad de `dev` | La rama `dev` permanece intacta sin commits adicionales del MVP. | **Aprobado** |
| GIT-04 | Política de commits y push | No se ejecutan `git commit` ni `git push` sin autorización expresa e independiente del propietario. | **Aprobado** |
| GIT-05 | Conservación de cambios preexistentes | `docs/architecture/architecture_map.md` presentaba modificaciones locales previas al inicio del trabajo móvil (711 líneas correspondientes a `RM-DOC-010`). Se conserva íntegramente sin alterarlo ni atribuirlo al MVP. | **Aprobado** |

---

## 2. Reconocimiento inicial del repositorio

Antes de iniciar la construcción del MVP se inspeccionó la estructura completa del repositorio SGA:

| Componente | Ruta | Tecnologías y versiones verificadas | Estado respecto al MVP móvil |
|---|---|---|---|
| **Backend central** | `sga_backend_jwt/` | Python, FastAPI, SQLAlchemy, Pydantic, Alembic (`0001_initial_schema.py`), autenticación JWT (`POST /api/sga/auth/login`), RBAC en `app/utils/roles.py`. | **Fuera del alcance del MVP** (no se modifica). |
| **Frontend web** | `sga_frontend_jwt/` | React `^19.2.8`, Vite `^8.2.0`, TypeScript `~6.0.2`, React Router DOM `^7.18.3`, Zod `^4.6.5`, `@hookform/resolvers` `^5.9.1`, Oxlint `^1.75.0`. | **Fuera del alcance del MVP** (cliente independiente; no se modifica ni comparte código). |
| **Base de datos** | `database/` | PostgreSQL (`01_tablas.sql`, `02_funciones_y_triggers.sql`, `03_seed_data.sql`, `06_vistas_dashboard.sql`). Incluye triggers de stock, auditoría y RBAC (`chk_usuario_rol`). | **Fuera del alcance del MVP** (no se modifica). |
| **Documentación general** | `docs/` | `architecture/architecture_map.md` (modificado localmente antes del MVP), `gestion_proyecto/` (auditorías `AUD-2026-001..007`, diagnósticos `DXC-2026-001..006`, roadmap `MAT-2026-001`, `CHK-2026-001`, evidencias `EVD-2026-001..003`). | Consultada como fuente de verdad del sistema existente. |
| **Gobernanza OpenCode** | `AGENTS.md` | Instrucciones operativas exclusivas para OpenCode (modo solo lectura por defecto). Incluye cláusula explícita de que no restringe las implementaciones autorizadas a Antigravity por el usuario. | Respetado. |
| **Módulo móvil** | `sga_mobile/` | No existía código móvil previo al inicio del MVP; únicamente la carpeta documental `sga_mobile/docs/` creada en la fase de consolidación. Se inicializó con Expo SDK 58 (`~58.0.26`), React Native `0.88.1`, React `19.3.0`, TypeScript `~6.0.3`, React Navigation v7. | **Implementado** (en progreso — Entrega 3). |

---

## 3. Resumen de entregas del MVP

### 3.1 Entrega 1 — Base estructural, navegación y consulta de alquileres

- **Estado:** **Aprobado** como base de desarrollo / **Implementado** (pendiente validación visual).
- **Alcance cubierto:**
  - Configuración de Expo SDK 58 + React Native 0.88 + TypeScript estricto (`tsc --noEmit`).
  - Navegación principal por pestañas (`Inicio`, `Alquileres`, `Gastos`, `Historial`) y stack interno de `Alquileres` (`Lista`, `Detalle`). Entregas y recogidas se mantienen como operaciones internas del detalle de alquiler, no como secciones del menú.
  - Modelo de datos alineado con los contratos del SGA web (`Alquiler`, `DetalleAlquiler`, `ClienteResumen`, `EstadoAlquiler`), omitiendo deliberadamente el empleado creador del alquiler (HU-03 CA-9).
  - Reglas de dominio puras en `src/domain/alquileres.ts` y `src/domain/fechas.ts`: exclusión de alquileres `cancelado`, cálculo de vencimiento `fecha_inicio + (tiempo_alquiler_dias - 1)`, alerta de próximos a vencer (`0 <= dias <= 2` en estado `activo`), elegibilidad de entrega (solo `pendiente`) y recogida (`activo` o `vencido`).
  - Capa de datos simulados con 13 alquileres (IDs 101–113, incluyendo 2 cancelados que se filtran) y control de escenarios (`normal`, `vacio`, `error`).
  - Pantallas funcionales: `InicioScreen` (vencidos, pendientes de entrega, próximos a vencer), `ListaAlquileresScreen` (búsqueda sin tildes/mayúsculas por ID, cliente, dirección y barrio; filtros por estado; orden por vencimiento), `DetalleAlquilerScreen`.
  - `BannerOrigen` permanente para distinguir datos `simulado`, `local` y `servidor`.
  - Documentado en `sga_mobile/docs/implementation/entrega_01.md`.

### 3.2 Entrega 2 — Autenticación simulada, cola offline, entregas, recogidas y mapa simulado

- **Estado:** **Implementado** (con ajustes requeridos en Entrega 3 para persistencia de token, flujo UI de cierre de sesión con pendientes y unificación con historial/gastos).
- **Alcance cubierto:**
  - Tipos y servicio de autenticación (`src/types/auth.ts`, `src/services/AuthService.ts`, `src/services/mock/authServiceMock.ts`) con soporte de login por usuario o teléfono + contraseña, usuario deshabilitado, error de credenciales y fallo por falta de conexión.
  - Protección de navegación en `RootNavigator.tsx` mediante `AuthContext.tsx` y `LoginScreen.tsx`.
  - Cola local de operaciones pendientes aislada por `id_usuario` (`src/types/queue.ts`, `src/storage/cola.ts`).
  - Servicio simulado de sincronización (`src/services/mock/syncServiceMock.ts`) con hasta 3 intentos automáticos (RNM-17) y verificación anti-duplicados (`yaConfirmada`).
  - Pantallas operativas `EntregaScreen.tsx` (solo alquileres `pendiente`, productos de solo lectura, observaciones opcionales) y `RecogidaScreen.tsx` (solo `activo` o `vencido`, productos de solo lectura, observaciones para daños/faltantes/incidentes).
  - Interfaz desacoplada de mapas (`src/services/MapService.ts`, `src/services/mock/mapServiceMock.ts`) y pantalla `MapaScreen.tsx` con aviso explícito de ubicación simulada (`DEP-INT-04`).
  - Documentado en `sga_mobile/docs/implementation/entrega_02.md`.

### 3.3 Entrega 3 — Cierre de sesión seguro, persistencia de sesión, gastos, resumen semanal, historial y conectividad NetInfo

- **Estado:** **Implementado** (pendiente validación visual en dispositivo/emulador físico).
- **Alcance completado:**
  1. UI y flujo de cierre de sesión con operaciones pendientes (`AuthContext.tsx` y `BannerEstadoSistema.tsx`): con conexión intenta sincronizar antes de cerrar; sin conexión (o si falla la sincronización) advierte cantidad pendiente, informa cancelación si se confirma, ofrece intentar conectar/sincronizar o confirmar cancelación expresa eliminando los datos privados y operaciones de la sesión.
  2. Persistencia de sesión en `src/storage/sesion.ts` y `AuthContext.tsx`: la sesión persiste al cerrar y reabrir la aplicación mientras el token siga vigente, separando datos no sensibles, elementos de autenticación (con interfaz `SecureStorageAdapter` preparada para `expo-secure-store`), estado de sesión e información privada local, sin inventar renovación de tokens.
  3. `GastosScreen` completa (`src/screens/GastosScreen.tsx`, `src/domain/gastos.ts`): registro de gastos con valor total positivo, descripción, asociación con uno o varios alquileres (búsqueda por ID o cliente), selección y modificación de tipo de movimiento (`entrega` o `recogida`), regla de unicidad `(id_alquiler, tipo_movimiento)` permitiendo repetir alquiler con tipo distinto, confirmación previa, fecha/hora/usuario automáticos, sin edición ni eliminación.
  4. Consulta de gastos propios (listado, detalle, filtros por día, descripción y valor) y resumen semanal de lunes a domingo con consulta de semanas anteriores, total gastado, promedio diario o semanal seleccionable y distinción entre gastos pendientes locales y confirmados.
  5. `HistorialScreen` completa (`src/screens/HistorialScreen.tsx`, `src/domain/historial.ts`): entregas, recogidas y gastos del encargado logístico autenticado en orden cronológico descendente, con fecha, tipo, alquiler relacionado, responsable, valor (en gastos), detalle de observaciones/descripción, filtros independientes, búsqueda con sugerencias e identificación de operaciones locales no confirmadas.
  6. Integración de `@react-native-community/netinfo` (`src/hooks/useConectividad.ts`, `src/context/ConectividadContext.tsx`) diferenciando: con conexión, sin conexión, recuperación de conexión, sincronización en curso y sincronización con errores.
  7. Análisis de las 3 vulnerabilidades moderadas reportadas por `npm audit` (`minimatch` 7.0.0–11.0.0 vía `@expo/fingerprint` → `expo`; dependencia transitiva de CLI que no forma parte del bundle Hermes y cuyo `audit fix --force` degradaría Expo 58 a Expo 52). Documentado en `sga_mobile/docs/implementation/entrega_03.md`.

---

## 4. Estado detallado de funcionalidades y criterios del MVP

| # | Criterio / Funcionalidad del MVP (§8) | Entrega | Estado actual |
|---|---|---|---|
| 1 | Inicio de sesión (usuario/teléfono + contraseña, validaciones, estados de error) | E2 / E3 | **Implementado** |
| 2 | Consulta de alquileres (listado, búsqueda, filtros, orden por vencimiento, exclusión de cancelados) | E1 | **Implementado** |
| 3 | Consulta de detalles de alquiler (cliente, fechas, productos, modalidad, sin empleado creador) | E1 / E2 | **Implementado** |
| 4 | Visualización simulada del mapa y estados de error de ubicación/GPS | E2 | **Implementado** |
| 5 | Registro de entregas (solo `pendiente`, entrega completa, observaciones) | E2 / E3 | **Implementado** |
| 6 | Registro de recogidas (solo `activo`/`vencido`, recogida completa, observaciones de daños/faltantes) | E2 / E3 | **Implementado** |
| 7 | Registro de gastos (valor global positivo, descripción, asociaciones `entrega`/`recogida`, confirmación) | E3 | **Implementado** |
| 8 | Consulta de gastos propios (listado, detalle, filtros por día/descripción/valor, sin editar/eliminar) | E3 | **Implementado** |
| 9 | Resumen semanal de gastos (lunes a domingo, semanas anteriores, total, promedio diario/semanal) | E3 | **Implementado** |
| 10 | Historial de operaciones propias (entregas, recogidas, gastos, orden descendente, filtros, sugerencias) | E3 | **Implementado** |
| 11 | Funcionamiento sin conexión (`NetInfo` + simulación de desconexión) | E2 / E3 | **Implementado** |
| 12 | Persistencia local (sesión vigente tras reinicio, cola local, gastos e historial locales) | E2 / E3 | **Implementado** |
| 13 | Cola de operaciones pendientes aislada por usuario | E2 / E3 | **Implementado** |
| 14 | Sincronización simulada (automática al reconectar y manual, hasta 3 intentos automáticos) | E2 / E3 | **Implementado** |
| 15 | Manejo de errores y prevención de duplicados | E2 / E3 | **Implementado** |
| 16 | Cierre de sesión seguro con operaciones pendientes (advertencia, opción de sincronizar o cancelar) | E3 | **Implementado** |
| — | Validación visual en emulador Android o dispositivo físico | E1–E3 | **Pendiente de validación** (el host Windows no cuenta con Android SDK / `adb` / `emulator` instalados) |
| — | Integración con endpoints reales de la API FastAPI (`/api/sga/*`) | Fase 6 | **Fuera del alcance del MVP** |

---

## 5. Pruebas ejecutadas y resultados (Entregas 1 a 3)

| Verificación | Comando | Resultado | Estado |
|---|---|---|---|
| Verificación de tipos TypeScript | `npx.cmd tsc --noEmit` | 0 errores | **Implementado** |
| Pruebas unitarias de alquileres y fechas | `node --test tests/alquileres.test.ts` | 9/9 PASS | **Implementado** |
| Pruebas unitarias de autenticación y persistencia | `node --test tests/auth.test.ts` | 12/12 PASS | **Implementado** |
| Pruebas de cola offline, reintentos y cancelación | `node --test tests/cola.test.ts` | 4/4 PASS | **Implementado** |
| Pruebas de gastos y resumen semanal | `node --test tests/gastos.test.ts` | 8/8 PASS | **Implementado** |
| Pruebas de historial, filtros y sugerencias | `node --test tests/historial.test.ts` | 5/5 PASS | **Implementado** |
| Prueba integral E2E de los 16 criterios del MVP | `node --test tests/flujo_mvp_e2e.test.ts` | 1/1 PASS | **Implementado** |
| **Total suite automatizada** | `npm.cmd test` | **39/39 PASS (0 fallos)** | **Implementado** |
| Empaquetado Android (Metro/Hermes) | `npx.cmd expo export --platform android` | Bundle generado (904 módulos, 2.2 MB) | **Implementado** |
| Auditoría de vulnerabilidades npm | `npm.cmd audit` | Analizadas 3 moderadas (`minimatch` vía `@expo/fingerprint`) | **Implementado** |
| Ejecución visual interactiva | Emulador Android / Expo Go | Bloqueada en este equipo por ausencia de Android SDK (`adb`/`emulator` no instalados en `%LOCALAPPDATA%\Android\Sdk`) | **Pendiente de validación** |

---

## 6. Dependencias de integración pendientes (Fase 6 / Backend)

Ninguna de estas dependencias se oculta ni se resuelve inventando contratos del backend. Todas se manejan en el MVP mediante adaptadores simulados claramente etiquetados:

| Código | Descripción de la dependencia | Evidencia en repositorio | Estado |
|---|---|---|---|
| **DEP-INT-01** | `GET /api/sga/alquileres` no incluye teléfono ni tipo de documento del cliente en su respuesta; requiere cruzar con `/clientes` o ampliar el esquema de respuesta. | `sga_frontend_jwt/src/interfaces/` y `sga_backend_jwt/app/schemas/` | **Pendiente de validación** |
| **DEP-INT-02** | Integración de paquete nativo `expo-secure-store` (Keychain/Keystore) para el token JWT en compilación nativa. En el MVP se prepara la interfaz `SecureStorageAdapter`. | `sga_mobile/src/storage/sesion.ts` | **Pendiente de validación** |
| **DEP-INT-03** | El modelo de base de datos actual define `CHECK (valor_gasto_logistico >= 0)` permitiendo `0`, mientras que la regla móvil RNM-09 exige valor estrictamente positivo (`> 0`). La app valida `> 0`. | `database/01_esquema/01_tablas.sql` | **Pendiente de decisión** |
| **DEP-INT-04** | La tabla intermedia `logistica_alquiler_alquiler` en el backend relaciona gastos con alquileres (`N:N`), pero no almacena actualmente la columna `tipo_movimiento` (`entrega` \| `recogida`) exigida por RNM-10 y RNM-11. | `database/01_esquema/01_tablas.sql` y `sga_backend_jwt/app/models/` | **Pendiente de decisión** |
| **DEP-INT-05 / DEP-MOV-01** | El endpoint `GET /api/sga/gastos/resumen-semanal` está restringido en el backend a `ADMIN_O_FACTURACION`. Para que el encargado logístico consulte su propio resumen semanal (HU-10), se requiere autorizar el rol filtrando por `id_usuario` del JWT o crear un endpoint específico. | `sga_backend_jwt/app/routes/` y `DXC-2026-005` | **Pendiente de decisión** |
| **DEP-INT-06 / DEP-MOV-02** | No existe un endpoint unificado en el backend que devuelva el historial consolidado (entregas + recogidas + gastos) filtrado exclusivamente por el encargado logístico autenticado (HU-11). | `sga_backend_jwt/app/routes/` | **Pendiente de validación** |
| **DEP-INT-07** | El backend permite `registrar_entrega` también cuando el alquiler está `activo`, mientras que la regla aprobada del móvil (RNM-05) restringe el registro de entrega en la app únicamente a alquileres en estado `pendiente`. | `DXC-2026-005` §6.2 | **Aprobado** (la app aplica la restricción más estricta `pendiente`). |
| **DEP-INT-08 / P-02** | El backend emite tokens JWT con expiración de 480 minutos y **no dispone de endpoint de renovación (refresh token)**. | `sga_backend_jwt/app/utils/` | **Pendiente de decisión** |
| **DEP-INT-09 / DEP-MOV-03 / P-08** | El backend no implementa aún claves de idempotencia (`idempotency_key`) para evitar duplicados si una petición de sincronización se procesa pero la respuesta se pierde por caída de red. La app evita reenvíos locales duplicados. | `sga_mobile/src/storage/cola.ts` | **Pendiente de validación** |
| **DEP-INT-10** | Selección e integración del proveedor definitivo de cartografía y geocodificación (Google Maps / Mapbox / OpenStreetMap) y permisos nativos de GPS (`expo-location`). | `sga_mobile/src/services/MapService.ts` | **Pendiente de decisión** |

---

## 7. Comparación documental y contradicciones detectadas (Sin resolución unilateral)

> [!WARNING]
> Conforme a la instrucción §2, **no se cambian identificadores ni se declaran aprobados documentos pendientes de revisión**. A continuación se presenta el análisis comparativo entre los documentos consolidados inicialmente en `sga_mobile/docs/requirements/` y la **Matriz de Trazabilidad (Borrador 1.0)** proporcionada por el propietario, junto con una propuesta de correspondencia.

### 7.1 Contradicciones principales identificadas

1. **Estado de aprobación de la Fase 2:**
   - Los archivos `historias_usuario.md`, `reglas_negocio.md`, `requisitos_no_funcionales.md` y `00_indice.md` indican *"Fase 2 cerrada / Aprobada"*.
   - Sin embargo, la Matriz de Trazabilidad oficial entregada por el propietario tiene estado **"Borrador 1.0 — Pendiente de revisión y aprobación"**, y el documento fuente con el texto individual de los **50 requisitos funcionales (RF-01 a RF-50)** aún no ha sido localizado ni incorporado.
   - **Estado:** **Pendiente de decisión** (no se declara cerrada la Fase 2 hasta contar con el catálogo RF-01..RF-50 y la aprobación formal de la matriz).

2. **Doble sistema de identificadores de reglas de negocio (`RN-MOV-01..38` vs `RNM-01..18`):**
   - `sga_mobile/docs/requirements/reglas_negocio.md` utiliza la numeración `RN-MOV-01` a `RN-MOV-38` (creada durante la consolidación inicial a partir del texto narrativo de la primera instrucción).
   - La Matriz de Trazabilidad utiliza `RNM-01` a `RNM-18` (aclarando que son identificadores de trabajo para la matriz y no sustituyen al documento general de reglas de negocio).
   - **Estado:** **Pendiente de decisión** (mantener ambos con tabla de correspondencia sin renumerar unilateralmente).

3. **Ausencia de `RNM-02` (biometría en accesos posteriores con sesión vigente) en `HU-01` y `RN-MOV-01/02`:**
   - La matriz define en `RNM-02`: *"El acceso requiere usuario o teléfono y contraseña; la biometría se permite en accesos posteriores con sesión vigente."*
   - Ni `HU-01` en `historias_usuario.md` ni `RN-MOV-01`/`RN-MOV-02` en `reglas_negocio.md` mencionan el acceso biométrico.
   - **Comportamiento en el MVP:** Implementado acceso biométrico simulado únicamente cuando existe una sesión vigente previamente iniciada en el dispositivo (sin inventar renovación si el token ya expiró).
   - **Estado:** **Pendiente de validación** documental para incorporar explícitamente el criterio en `HU-01` y `reglas_negocio.md`.

4. **Ausencia de `RNM-09`, `RNM-10` y `RNM-11` en `HU-08` y `reglas_negocio.md`:**
   - La matriz exige en `RNM-09` valor global positivo, descripción y al menos un alquiler asociado; en `RNM-10` asociación con uno o varios alquileres identificando `entrega` o `recogida`; en `RNM-11` posibilidad de repetir el mismo alquiler cuando el tipo de movimiento sea diferente.
   - En `historias_usuario.md` (`HU-08`) y `reglas_negocio.md` (`RN-MOV-22..26`) solo se mencionaba descripción y valor, sin detallar la obligatoriedad de valor positivo, la asociación a alquileres ni el tipo de movimiento `entrega`/`recogida`.
   - **Comportamiento en el MVP:** Se implementan íntegramente `RNM-09`, `RNM-10` y `RNM-11` en `GastosScreen` conforme a la autorización del MVP (§3.3).
   - **Estado:** **Aprobado** funcionalmente para el MVP; **Pendiente de decisión** para actualizar el texto de `HU-08` y `reglas_negocio.md`.

5. **Ausencia de `RNM-16` (servidor como autoridad) y `RNM-17` (3 intentos automáticos y luego manual) en `arquitectura_modulo_logistico_movil.md` y `reglas_negocio.md`:**
   - `reglas_negocio.md` (`RN-MOV-35..37`) y `arquitectura_modulo_logistico_movil.md` (`ADR-012`, `ADR-013`) describen sincronización automática y reintento manual, pero omiten que el servidor es la autoridad de validación de estados (`RNM-16`) y el límite exacto de **3 intentos automáticos** (`RNM-17`).
   - **Comportamiento en el MVP:** Implementados los 3 intentos automáticos antes de pasar a estado `error` para reintento manual, y validación simulada de estado en el servidor.
   - **Estado:** **Aprobado** funcionalmente para el MVP; **Pendiente de decisión** para actualizar los documentos de arquitectura y reglas.

6. **Política de cierre de sesión con operaciones pendientes (`RNM-15` / `RNF-11` / `RN-MOV-03`):**
   - En la revisión de la matriz se analizó una variante donde las operaciones pendientes se conservaban tras cerrar sesión vinculadas al usuario, frente a la redacción literal de `RNM-15` (*"Las operaciones pendientes deben conservarse hasta su sincronización o hasta que el usuario confirme su cancelación al cerrar sesión sin conexión"*) y la instrucción actual §3.1 (*"Cuando existan operaciones pendientes sin conexión: Mostrar cuántas operaciones están pendientes. Informar que se cancelarían si se confirma el cierre. Permitir intentar conectarse y sincronizar. Permitir confirmar expresamente la cancelación y cerrar sesión. No cancelar operaciones sin confirmación. No conservarlas automáticamente para otra sesión"*).
   - **Comportamiento en el MVP:** Se implementa exactamente el flujo ordenado en §3.1 de la presente instrucción (sincronizar antes de cerrar si hay conexión; si no hay conexión, advertir cantidad pendiente, ofrecer conectar/sincronizar o confirmar cancelación expresa eliminando los datos privados y operaciones de la sesión al confirmar, además de mantener aislamiento por `id_usuario` mientras la sesión está activa).
   - **Estado:** **Aprobado** para el comportamiento del MVP (§3.1); **Pendiente de decisión** para armonizar la redacción definitiva en `reglas_negocio.md` y `matriz_trazabilidad.md`.

---

### 7.2 Propuesta de correspondencia: Reglas de Negocio (`RNM-01..18` ↔ `RN-MOV-01..38`)

Esta tabla propone la equivalencia entre los códigos de la Matriz de Trazabilidad (`RNM-xx`) y los códigos del documento consolidado (`RN-MOV-xx`), sin modificar ninguno de los dos archivos hasta aprobación del propietario:

| Código Matriz | Regla en Matriz (Borrador 1.0) | Código(s) en `reglas_negocio.md` | Análisis de correspondencia y propuesta |
|---|---|---|---|
| **RNM-01** | Primera versión destinada al encargado logístico. | `RN-MOV-06` | **Equivalente directo.** Conservar relación `RNM-01 ↔ RN-MOV-06`. |
| **RNM-02** | Acceso con usuario/teléfono y contraseña; biometría en accesos posteriores con sesión vigente. | `RN-MOV-01`, `RN-MOV-02` | **Correspondencia parcial.** `RN-MOV-01/02` cubren credenciales y vigencia del JWT, pero omiten biometría. *Propuesta:* añadir cláusula de biometría a `RN-MOV-02` y `HU-01`. |
| **RNM-03** | El EL no crea alquileres ni modifica renovaciones. | `RN-MOV-07`, `RN-MOV-09` (y `RN-MOV-08`, `RN-MOV-11`) | **Equivalente con desglose.** `RN-MOV` separa alquileres (`07`), clientes (`08`), renovaciones (`09`) y auditoría (`11`). |
| **RNM-04** | Los alquileres cancelados no se incluyen en consulta móvil ni en descarga offline. | *(Sin código en `RN-MOV`)* | **Omisión en `reglas_negocio.md`.** Implementado en `src/domain/alquileres.ts` (`esVisibleEnMovil`). *Propuesta:* incorporar en `reglas_negocio.md`. |
| **RNM-05** | Entregas solo para alquileres pendientes y deben ser completas. | `RN-MOV-13`, `RN-MOV-16` | **Equivalente desglosado** (`13` = completa, `16` = estado `pendiente`). |
| **RNM-06** | Recogidas solo para alquileres activos o vencidos y deben ser completas. | `RN-MOV-17` | **Correspondencia parcial.** `RN-MOV-17` indica estados `activo` o `vencido`; falta explicitar "completa". |
| **RNM-07** | Observaciones de recogida permiten describir daños, faltantes e incidentes. | `RN-MOV-19` | **Equivalente directo.** |
| **RNM-08** | Recogida permitida sin autorización explícita registrada de facturación. | `RN-MOV-18` | **Equivalente directo.** |
| **RNM-09** | Valor de gasto global y positivo; requiere descripción y al menos un alquiler asociado. | `RN-MOV-22` (parcial) | **Omisión crítica en `RN-MOV` y `HU-08`.** *Propuesta:* actualizar `RN-MOV-22` y `HU-08` para exigir valor `> 0`, descripción y mínimo 1 alquiler. |
| **RNM-10** | Un gasto puede relacionarse con varios alquileres y cada asociación identifica entrega o recogida. | *(Sin código en `RN-MOV`; cita `RN-AUD-20`)* | **Omisión en `RN-MOV` y `HU-08`.** *Propuesta:* incorporar regla específica con tipo de movimiento `entrega` \| `recogida`. |
| **RNM-11** | Un mismo alquiler puede repetirse en un gasto cuando las asociaciones tienen tipos de movimiento diferentes. | *(Sin código en `RN-MOV`)* | **Omisión en `RN-MOV` y `HU-08`.** *Propuesta:* incorporar regla de unicidad por par `(id_alquiler, tipo_movimiento)`. |
| **RNM-12** | El EL no puede editar ni eliminar gastos desde la app móvil. | `RN-MOV-10`, `RN-MOV-26` | **Equivalente directo** (duplicado en `RN-MOV-10` y `RN-MOV-26`). |
| **RNM-13** | El historial móvil muestra únicamente las operaciones del EL autenticado. | `RN-MOV-12` | **Equivalente directo.** |
| **RNM-14** | Las operaciones locales pendientes no se consideran confirmadas hasta respuesta del servidor. | `RN-MOV-38` (parcial) | **Correspondencia parcial.** *Propuesta:* precisar en `RN-MOV-38` que ninguna operación local se presenta como confirmada antes de respuesta del servidor. |
| **RNM-15** | Conservación de operaciones pendientes hasta sincronización o confirmación expresa de cancelación al cerrar sesión sin conexión. | `RN-MOV-03`, `RN-MOV-34` | **En conciliación.** Armonizar redacción según flujo aprobado en §3.1. |
| **RNM-16** | El servidor es la autoridad para validar el estado del alquiler y confirmar entregas y recogidas. | *(Sin código en `RN-MOV`)* | **Omisión en `RN-MOV` y arquitectura.** *Propuesta:* añadir a sección 8 de `reglas_negocio.md` y `ADR-014`. |
| **RNM-17** | Hasta 3 intentos automáticos de sincronización; después reintento manual. | `RN-MOV-35`, `RN-MOV-37` (parcial) | **Correspondencia parcial.** Falta especificar el número de **3 intentos automáticos** en `RN-MOV-35/37` y `ADR-012/013`. |
| **RNM-18** | Evitar duplicar operaciones cuando se sincronizan registros pendientes. | `DEP-MOV-03` / `ADR-014` | **Correspondencia en arquitectura.** *Propuesta:* elevar a regla de negocio en sección 8 de `reglas_negocio.md`. |

*(Nota: Las reglas `RN-MOV-14`, `15`, `20`, `21`, `23`, `24`, `25`, `27`, `28`, `29..33` y `36` provienen de los supuestos y flujos de la Fase 1/4 y complementan la matriz sin contradecir `RNM-01..18`).*

---

### 7.3 Propuesta de correspondencia: Requisitos No Funcionales (`RNF-01..12` Matriz ↔ `RNF-01..18` Documento)

| Código Matriz | Criterio en Matriz (Borrador 1.0) | Código(s) en `requisitos_no_funcionales.md` | Análisis de correspondencia y propuesta |
|---|---|---|---|
| **RNF-01 (M)** | Compatibilidad con Android y iOS. | `RNF-01 (D)` | **Equivalente exacto.** |
| **RNF-02 (M)** | Funcionamiento en dispositivos de gama media y baja. | `RNF-02 (D)` | **Equivalente exacto.** |
| **RNF-03 (M)** | Trabajar durante periodos prolongados sin conexión. | `RNF-04 (D)` | **Equivalente** (distinta numeración). |
| **RNF-04 (M)** | Respuesta rápida en consultas y acciones habituales. | `RNF-08 (D)` | **Equivalente** (distinta numeración). |
| **RNF-05 (M)** | Protección de credenciales y datos privados almacenados localmente. | `RNF-11 (D)`, `RNF-12 (D)` | **Equivalente desglosado** (`11` = credenciales/JWT, `12` = información local). |
| **RNF-06 (M)** | Persistencia de sesión mientras el token conserve su vigencia. | `RNF-14 (D)` | **Equivalente** (distinta numeración). |
| **RNF-07 (M)** | Interfaz sencilla, legible y utilizable en pantallas pequeñas. | `RNF-16 (D)`, `RNF-17 (D)` | **Equivalente con desglose** (`17` añade contexto de campo/exteriores). |
| **RNF-08 (M)** | Funcionamiento del resto de la app cuando se deniega el permiso de ubicación. | `RNF-15 (D)` | **Equivalente** (distinta numeración). |
| **RNF-09 (M)** | Consumo moderado de batería, memoria y datos. | `RNF-09 (D)`, `RNF-10 (D)` | **Equivalente desglosado.** |
| **RNF-10 (M)** | Orientación principalmente vertical. | `RNF-03 (D)` | **Equivalente** (distinta numeración). |
| **RNF-11 (M)** | Eliminación de datos privados locales asociados a la sesión al cerrar sesión, según el flujo definido. | `RNF-13 (D)` | **Equivalente condicionado al flujo §3.1** (la matriz incluye *"según el flujo definido"*, lo que permite la advertencia previa si hay operaciones pendientes). |
| **RNF-12 (M)** | Sincronización automática y actualización manual de información. | `RNF-06 (D)`, `RNF-07 (D)` | **Correspondencia parcial.** `RNF-06 (D)` menciona sincronización manual de operaciones; la matriz incluye también actualización manual de información consultada. |
| *(Sin código M)* | Persistencia de operaciones pendientes al cerrar/reabrir la app; modo claro y oscuro. | `RNF-05 (D)`, `RNF-18 (D)` | En la matriz `RNF-05 (D)` está cubierto como regla de negocio (`RNM-15`) y `RNF-18 (D)` proviene de la referencia visual de `HU-03`. |

---

## 8. Resumen de decisiones aprobadas y decisiones pendientes

### 8.1 Decisiones aprobadas
1. **Rama oficial:** `mobile/mvp` partiendo de `dev`, conservando `docs/architecture/architecture_map.md` sin commits ni push. (**Aprobado**)
2. **Tecnología y arquitectura:** React Native + Expo en `sga_mobile/`, independiente del frontend web y sin modificar backend ni base de datos. (**Aprobado**)
3. **Actor único del MVP:** Encargado logístico (`ENCARGADO_LOGISTICO`). (**Aprobado**)
4. **Secciones del menú:** 4 pestañas (`Inicio`, `Alquileres`, `Gastos`, `Historial`); entregas y recogidas dentro del detalle de alquiler. (**Aprobado**)
5. **Reglas operativas del MVP:** Exclusión de alquileres cancelados; próximos a vencer ≤ 2 días; entregas completas solo en `pendiente`; recogidas completas solo en `activo`/`vencido` sin exigir autorización previa de facturación; gastos con valor global positivo, descripción y asociaciones a alquileres con tipo `entrega` o `recogida` (repetible solo con distinto tipo de movimiento), sin edición ni eliminación; cierre de sesión con advertencia y confirmación expresa cuando hay operaciones pendientes sin conexión. (**Aprobado**)

### 8.2 Decisiones pendientes del propietario
1. **P-01 / P-02:** Política definitiva cuando el token JWT expira mientras el dispositivo está sin conexión y existen operaciones pendientes en cola, y evaluación de si el backend incorporará renovación de token. (**Pendiente de decisión**)
2. **Conciliación documental de Fase 2:** Aprobación de la propuesta de correspondencia de las tablas 7.2 y 7.3, entrega del documento original con el detalle de `RF-01` a `RF-50` y autorización para actualizar `matriz_trazabilidad.md`, `reglas_negocio.md`, `requisitos_no_funcionales.md` e `historias_usuario.md`. (**Pendiente de decisión**)
3. **DEP-INT-03 / 04 / 05 / 06:** Ajustes futuros en el backend para Fase 6 (restricción `> 0` en gasto, columna `tipo_movimiento` en asociación gasto-alquiler, permiso RBAC para resumen semanal propio del EL y endpoint/filtro de historial propio). (**Pendiente de decisión**)
4. **DEP-INT-10:** Selección del proveedor de mapas/GPS para la Fase 6. (**Pendiente de decisión**)
