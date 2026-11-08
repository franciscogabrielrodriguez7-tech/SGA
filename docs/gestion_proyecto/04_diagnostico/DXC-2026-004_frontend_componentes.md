# 04 — Frontend: Componentes, Vistas y Estilos

> **Aplicación:** `sga_frontend_jwt` — SPA de React 19 + TypeScript + Vite
> **Estilos:** CSS puro con variables CSS nativas (sin Chakra UI, sin Emotion, sin Tailwind, sin librería de UI de terceros)
> **Linter:** `oxlint` · **TypeScript:** `~6.0.2` (modo estricto según `tsconfig.app.json`)

> ⚠️ **Documento generado el 2026-10-19 sobre la rama local `dev` @ `14726ad`
> (anterior al commit `12760d4`).** Contenido parcialmente desactualizado:
> no incluye los 25 componentes nuevos incorporados en commits 2026-09-22 → 2026-10-15.
> Contrasta con [AUD-2026-002](../01_auditorias/AUD-2026-002_auditoria_dev_remota_12760d4.md) para el estado vigente.
---

## 1. Estructura de directorios

```
sga_frontend_jwt/
├── index.html                 # Entry HTML de Vite
├── vite.config.ts             # Solo plugin react (sin proxy ni alias configurados)
├── vercel.json                # Rewrite SPA: /(.*) → /index.html
├── package.json               # Dependencias y scripts
├── tsconfig.json / .app.json / .node.json
├── .oxlintrc.json
├── .env.example               # VITE_API_URL=http://localhost:8000/api/sga
├── public/                    # favicon.svg, favicon.jpeg, icons.svg
└── src/
    ├── main.tsx               # Punto de montaje: AuthProvider > BrowserRouter > App + <Toaster/>
    ├── App.tsx                # Tabla de rutas
    ├── index.css              # Solo @import de las 4 hojas de src/styles/
    ├── api/                   # Capa de servicios (7 módulos + client.ts)
    │   ├── client.ts          # Cliente HTTP base (fetch + sobre + Bearer)
    │   ├── auth.ts            # POST /auth/login
    │   ├── usuarios.ts        # CRUD /usuarios
    │   ├── clientes.ts        # CRUD /clientes
    │   ├── productos.ts       # CRUD /productos
    │   ├── alquileres.ts      # CRUD /alquileres + entregas/recogidas/renovaciones
    │   ├── detalleAlquiler.ts # CRUD /detalle-alquiler
    │   └── gastos.ts          # /gastos + resumen semanal
    ├── context/
    │   └── AuthContext.tsx    # Sesión JWT + persistencia en localStorage
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx   # Sidebar + topbar + área de contenido
    │   │   ├── AppShell.css   # Estilos del shell (scope propio)
    │   │   └── ProtectedRoute.tsx
    │   ├── ui/
    │   │   ├── toaster.tsx     # Bus de eventos + <Toaster/> (sustituye a Chakra)
    │   │   └── ThemeToggle.tsx# Alterna data-theme en <html>
    │   ├── inputs/
    │   │   ├── InputMoneda.tsx# <input> nativo con formato COP
    │   │   └── inputFecha.tsx # Helper de fecha actual (YYYY-MM-DD)
    │   └── productos/
    │       └── ProductoSelect.tsx  # <select> nativo con stock disponible
    ├── interfaces/            # Tipos TypeScript del dominio (8 archivos)
    ├── pages/                 # 7 vistas
    │   ├── Login/             # Login.tsx + Login.css
    │   ├── Dashboard/         # Dashboard.tsx
    │   ├── Alquileres/        # ListaAlquileres.tsx, AlquilerDetalle.tsx
    │   ├── CrearAlquiler/     # CrearAlquiler.tsx
    │   ├── Productos/         # Productos.tsx
    │   ├── Usuarios/          # Usuarios.tsx
    │   └── Gastos/            # Gastos.tsx
    ├── styles/                # Sistema de diseño CSS puro
    │   ├── tokens.css         # Variables CSS (paleta, semánticos, tema oscuro)
    │   ├── base.css           # Reset + tipografía
    │   ├── layout.css         # Utilidades de layout (stack, grid, gap…)
    │   └── components.css     # Componentes (btn, input, card, badge, table, modal, toast…)
    └── utils/
        ├── permisos.ts        # Espejo de app/utils/roles.py del backend
        ├── tiempoUi.ts        # Conversión días/semanas/meses y jerarquía de unidades
        ├── precios.ts         # Cálculo de precio de conjunto
        ├── validacionesAlquiler.ts  # Validación del formulario de creación
        ├── validations.ts     # Schema Zod (telefono)
        └── vencimiento.ts     # Etiqueta y tono del badge de vencimiento
```

**Convención de carpetas:** cada carpeta de `pages/` y `components/` contiene su(s) archivo(s) `.tsx` y, cuando necesita estilos propios, un `.css` contiguo importado desde el propio componente (`import "./AppShell.css"`).

---

## 2. Capa de servicios (`src/api/`)

### 2.1 `client.ts` — cliente HTTP base

Es el único punto de salida hacia la red. Responsabilidades:

| Responsabilidad | Implementación |
|---|---|
| URL base | `import.meta.env.VITE_API_URL` con fallback `http://localhost:8000/api/sga`; se normaliza eliminando `/` finales. |
| Token | Lee `localStorage["sga_sesion_usuario"]`, extrae `access_token` y adjunta `Authorization: Bearer <token>`. |
| Query string | `construirQueryString` filtra `undefined`, `null` y `""` antes de serializar. |
| Parseo | `await respuesta.json()` → si falla, lanza `ApiError` con `errorCode = "INVALID_RESPONSE"`. |
| Errores de red | `fetch` fallido → `ApiError("No se pudo conectar con el servidor…", 0, "NETWORK_ERROR")`. |
| Sesión expirada | Si la respuesta es `401` y la ruta **no** es `/login`, dispara el evento global `window.dispatchEvent(new Event("sesionExpirada"))`. |
| Envelope | Verifica `sobre.status`; si es `false`, lanza `ApiError(mensaje, code, error)`. Si es `true`, devuelve `sobre.data`. |

**Tipos exportados**

```ts
interface ApiEnvelope<T> { status: boolean; mensaje: string; data: T | null; error: string | null; code: number; }
class ApiError extends Error { code: number; errorCode: string | null; }
```

**Contrato de la API asumido por el cliente**

```ts
{ status: boolean, mensaje: string, data: T | null, error: string | null, code: number }
```

> Coincide exactamente con `app/utils/response.py` del backend. Si el sobre cambia, debe cambiar `client.ts` en el mismo commit.

**Decisión de diseño:** el cliente HTTP **no conoce** React ni el contexto de autenticación. La comunicación se hace por evento global (`sesionExpirada`), que `AuthContext` escucha. Esto evita acoplar la capa de red con la capa de UI.

### 2.2 Módulos de dominio

| Módulo | Objeto exportado | Endpoints consumidos |
|---|---|---|
| `api/auth.ts` | `authApi` | `POST /auth/login` |
| `api/usuarios.ts` | `usuariosApi` | `POST /usuarios`, `GET /usuarios`, `GET /usuarios/{id}`, `PATCH /usuarios/{id}`, `PATCH /usuarios/{id}/estado` |
| `api/clientes.ts` | `clientesApi` | `GET /clientes`, `GET /clientes/{id}`, `POST /clientes`, `PATCH /clientes/{id}`, `PATCH /clientes/{id}/estado` |
| `api/productos.ts` | `productosApi` | `GET /productos`, `GET /productos/{id}`, `POST /productos`, `PATCH /productos/{id}`, `PATCH /productos/{id}/estado` |
| `api/alquileres.ts` | `alquileresApi` | `POST /alquileres`, `GET /alquileres`, `GET /alquileres/{id}`, `PATCH /alquileres/{id}`, `PATCH /alquileres/{id}/estado`, `DELETE /alquileres/{id}`, `GET /alquileres/buscar`, `GET /alquileres/proximos-vencer`, `GET /alquileres/pendientes-entrega`, `GET /alquileres/{id}/historial`, `GET /alquileres/{id}/detalles`, `POST /alquileres/{id}/renovaciones`, `POST/GET /alquileres/{id}/entregas`, `POST/GET /alquileres/{id}/recogidas` |
| `api/detalleAlquiler.ts` | `detalleAlquilerApi` | `POST /detalle-alquiler`, `GET /detalle-alquiler/{id}`, `PATCH /detalle-alquiler/{id}` |
| `api/gastos.ts` | `gastosApi` | `POST /gastos`, `GET /gastos`, `GET /gastos/resumen-semanal` |

**Endpoints del backend NO consumidos por el frontend** (disponibles para el usuario vía Swagger):

- `GET /api/sga/inventario` y `GET /api/sga/inventario/productos/{id}` — el frontend calcula la disponibilidad a partir de `GET /productos` (que ya trae `stock_disponible`).
- `GET /api/sga/renovaciones/{id_auditoria}` — el frontend no muestra el detalle del evento de renovación.
- `GET /api/sga/detalle-alquiler/{id}` — no se consulta una línea individual; se listan por alquiler.

**Observaciones de consistencia (ver [`DXC-2026-001_arquitectura.md`](../04_diagnostico/DXC-2026-001_arquitectura.md) H-06/H-07):**
- `alquileresApi.registrarEntrega` / `registrarRecogida` y `gastosApi.crear` declaran `es_recogida: boolean` en su tipo de retorno: campo que **ya no existe** en el modelo de datos (sustituido por `tipo_movimiento`).
- `alquileresApi.buscar` declara el parámetro `id_detalle?: number`, pero el endpoint real espera `numero`. La búsqueda por número no es alcanzable desde la UI.
- La interfaz `HistorialAlquiler` (`src/interfaces/Alquiler.ts`) no refleja la forma real `{ id_alquiler, total_eventos, eventos[] }`.

---

## 3. Autenticación y autorización en el cliente

### 3.1 `context/AuthContext.tsx`

| Aspecto | Implementación |
|---|---|
| Estado | `{ usuario, token, estaAutenticado, iniciarSesion, cerrarSesion }` |
| Persistencia | `localStorage["sga_sesion_usuario"]` — objeto JSON completo (incluye `access_token`). Se restaura en el arranque con un `useState` inicializador perezoso. |
| Expiración | Escucha el evento `sesionExpirada`; al recibirse, limpia la sesión y muestra un toast de advertencia "Sesión expirada". |
| Hook | `useAuth()` lanza error si se usa fuera de `<AuthProvider>`. |

> **Consideración de seguridad:** el token se guarda en `localStorage`, accesible a cualquier script de la página (XSS). Es la decisión habitual en SPAs sin cookies `httpOnly`, pero debe documentarse como riesgo asumido (ver [`DXC-2026-005_reglas_negocio_rbac.md`](../04_diagnostico/DXC-2026-005_reglas_negocio_rbac.md) §8).

### 3.2 `utils/permisos.ts` — espejo del backend

```ts
SOLO_ADMIN            = ["admin"]
ADMIN_O_FACTURACION   = ["admin", "encargado_facturacion"]
STAFF_INTERNO         = ["admin", "encargado_facturacion", "encargado_logistico"]

function tienePermiso(rol, rolesPermitidos): boolean
```

El archivo declara explícitamente que es un **espejo exacto** de `app/utils/roles.py`: el frontend solo oculta o deshabilita controles que el backend rechazaría con `403`; la autoridad real es `requiere_rol(...)` en cada endpoint.

> **Regla de mantenimiento:** cualquier cambio en `app/utils/roles.py` debe replicarse en `src/utils/permisos.ts` en el mismo commit.

### 3.3 `components/layout/ProtectedRoute.tsx`

| Situación | Comportamiento |
|---|---|
| Sin sesión | `<Navigate to="/login" replace />` |
| Rol insuficiente (cuando se pasan `rolesPermitidos`) | `<Navigate to="/" replace />` |
| Autorizado | Renderiza los hijos |

### 3.4 `components/layout/AppShell.tsx`

Estructura: `sidebar` (logo + navegación) + `main` (`topbar` + `content`).

**Items de navegación** con su filtro de rol:

| Etiqueta | Ruta | Roles |
|---|---|---|
| Inicio | `/` | todos |
| Alquileres | `/alquileres` | todos |
| Crear alquiler | `/alquileres/nuevo` | `ADMIN_O_FACTURACION` |
| Productos | `/productos` | todos |
| Usuarios | `/usuarios` | todos (la vista deshabilita la gestión si no es admin) |
| Gastos | `/gastos` | todos |

**Responsive:** menú lateral colapsable en móvil con botón `☰` (`.appshell-menu-btn`), overlay (`.appshell-overlay`) y clase `.appshell-sidebar-open`. El título "SGA" de la topbar se oculta en móvil (`.hide-on-mobile`).

---

## 4. Sistema de estilos (CSS puro)

### 4.1 Carga

`src/index.css` es exclusivamente un índice de imports:

```css
@import "./styles/tokens.css";
@import "./styles/base.css";
@import "./styles/layout.css";
@import "./styles/components.css";
```

`main.tsx` importa `./index.css` una sola vez. `AppShell.css` y `Login.css` se importan desde sus componentes (estilos con alcance propio).

### 4.2 `styles/tokens.css` — sistema de diseño

Define el vocabulary visual completo en variables CSS nativas:

| Grupo | Variables | Valores |
|---|---|---|
| Escala `brand` (cian) | `--brand-50` … `--brand-950` | Acento principal `--brand-500: #2BE6E1` |
| Escalas secundarias | `--mint-400/500`, `--green-400/500`, `--sky-400/500`, `--azure-400/500` | |
| Neutros fríos `ink` | `--ink-50` … `--ink-950` | Fondo de app y superficies |
| Tipografía | `--font-sans` | Stack de sistema (sin webfonts) |
| Radios | `--radius-sm/md/lg/xl` | 8 / 12 / 16 / 20 px |
| Sombras | `--shadow-sm/md/lg` | Siempre difuminadas |
| Espaciado | `--space-1` … `--space-8` | Escala de 4 px |

**Tokens semánticos** (capa estable para el resto del CSS):

- Marca: `--color-brand-solid`, `--color-brand-contrast`, `--color-brand-fg`, `--color-brand-muted`, `--color-brand-subtle`, `--color-brand-emphasized`.
- Estado: `--color-success`, `--color-info`, `--color-danger`, `--color-warning`.
- Superficie: `--color-bg-app`, `--color-bg-surface`, `--color-border`, `--color-fg-default`, `--color-fg-muted`, `--color-overlay`.

**Modo oscuro:** el bloque `[data-theme="dark"]` redefine **solo** los tokens semánticos (no las escalas), de modo que el tema oscuro no requiere duplicar reglas de componente.

### 4.3 `styles/base.css` (47 líneas)

Reset ligero y tipografía base: normalización de `box-sizing`, eliminación de márgenes por defecto, estilos de `body`, `h1..h4`, `a`, y elementos de formulario.

### 4.4 `styles/layout.css` (57 líneas) — utilidades

| Familia | Clases |
|---|---|
| Flex | `.stack`, `.hstack`, `.gap-1..8`, `.justify-between/end/center`, `.items-center/start`, `.flex-wrap`, `.flex-1`, `.ml-auto` |
| Grid | `.grid`, `.grid-cols-1`, `.grid-cols-2-sm`, `.grid-cols-2-md`, `.grid-cols-3-md`, `.grid-cols-3-lg`, `.col-span-2-md` |
| Contenedor | `.container-narrow` |

La nomenclatura sigue el patrón de utilidades compactas (`gap-4`, `grid-cols-3-lg`), donde el sufijo indica el *breakpoint* a partir del cual se aplica.

### 4.5 `styles/components.css` (383 líneas) — componentes

| Grupo | Clases |
|---|---|
| Tipografía | `.heading-2xl`, `.heading-xl`, `.heading-lg`, `.heading-md` |
| Texto | `.text-muted`, `.text-sm`, `.text-bold`, `.text-brand`, `.text-success`, `.text-danger`, `.text-warning` |
| Botones | `.btn`, `.btn-primary`, `.btn-outline`, `.btn-danger-outline`, `.btn-sm` |
| Formularios | `.input`, `.field-label`, `.checkbox-row` |
| Contenedores | `.card`, `.card-clickable` |
| Distintivos | `.badge`, `.badge-lg`, `.badge-gray`, `.badge-success`, `.badge-warning`, `.badge-danger` |
| Responsive | `.show-mobile-cards`, `.hide-on-mobile` |
| Listado móvil | `.list-card`, `.list-card-header`, `.list-card-title`, `.list-card-meta` |
| Tablas | `.table-wrap`, `.table`, `.table-empty`, `.row-hover` |
| Notificaciones | `.toaster`, `.toast`, `.toast-success/error/warning`, `.toast-title`, `.toast-description` |
| Modales | `.modal-overlay`, `.modal-content` |

**Estrategia responsive de las tablas:** en escritorio se muestran como `.table`; en móvil, la misma información se re-renderiza como tarjetas `.list-card`. Los componentes de tabla incluyen ambas estructuras y las ocultan/show con `.show-mobile-cards` / `.hide-on-mobile` según el breakpoint.

### 4.6 `components/layout/AppShell.css` (142 líneas)

Clases con prefijo `appshell-` (`.appshell`, `.appshell-sidebar`, `.appshell-logo`, `.appshell-navlink`, `.appshell-navlink-active`, `.appshell-main`, `.appshell-topbar`, `.appshell-content`, `.appshell-menu-btn`, `.appshell-overlay`, `.appshell-sidebar-open`) más `.theme-toggle-btn`.

### 4.7 `pages/Login/Login.css` (16 líneas)

`.login-page` (centrado vertical) y `.login-card` (superficie elevada con sombra).

---

## 5. Componentes propios

### 5.1 `components/ui/toaster.tsx`

Sustituye el `createToaster` de Chakra manteniendo **la misma API** (`toaster.create({ title, description, type })`), para no modificar las páginas que ya lo usaban.

Implementación: un `EventTarget` global (`bus`) emite `CustomEvent("toast")`; el componente `<Toaster/>` (montado en `main.tsx`, fuera del router) escucha, acumula y renderiza la pila. Duración por toast: **5000 ms** (auto-descarte). Tipos: `info | success | warning | error`.

### 5.2 `components/ui/ThemeToggle.tsx`

Alterna `data-theme="light|dark"` en `<html>`, que `tokens.css` usa para redefinir los tokens semánticos. Persiste la preferencia en `localStorage["sga_tema"]`. En la primera visita (sin preferencia guardada) usa `prefers-color-scheme` del sistema.

### 5.3 `components/inputs/InputMoneda.tsx`

`<input>` nativo (`type="text"`, `inputMode="numeric"`) con la clase `.input`. Muestra el valor con formato `es-CO` (`$1.250.000`) y parsea solo dígitos. Envuelve con `forwardRef` para poder enlazarlo a `useRef` en los formularios.

### 5.4 `components/inputs/inputFecha.tsx`

Helper `obtenerFechaActual()` que devuelve la fecha de hoy en formato `YYYY-MM-DD` (valor por defecto de `<input type="date">`).

### 5.5 `components/productos/ProductoSelect.tsx`

`<select>` nativo con la clase `.input`. Muestra `nombre_producto (disponibles: N)` usando `stock_disponible`, de modo que el usuario ve la disponibilidad real en el momento de elegir.

---

## 6. Vistas (`src/pages/`)

| Vista | Archivo | Líneas | Endpoints consumidos | Control de rol en la UI |
|---|---|---|---|---|
| Login | `Login/Login.tsx` | 136 | `POST /auth/login` | Público. Valida el teléfono con Zod (`phoneValidation`). |
| Panel de control | `Dashboard/Dashboard.tsx` | 122 | `GET /alquileres/proximos-vencer`, `GET /alquileres/pendientes-entrega`, `GET /alquileres?estado_alquiler=vencido` | Solo `STAFF_INTERNO` (por router). |
| Lista de alquileres | `Alquileres/ListaAlquileres.tsx` | 180 | `GET /alquileres`, `GET /alquileres/buscar` | `puedeCrear = tienePermiso(rol, ADMIN_O_FACTURACION)` → muestra el botón "Crear alquiler". |
| Detalle de alquiler | `Alquileres/AlquilerDetalle.tsx` | 529 | `GET /alquileres/{id}`, `GET /alquileres/{id}/detalles`, `PATCH /alquileres/{id}/estado`, `POST /alquileres/{id}/renovaciones`, `DELETE /alquileres/{id}`, entregas y recogidas | `puedeGestionarFacturacion = tienePermiso(rol, ADMIN_O_FACTURACION)` → habilita renovación y cancelación. |
| Crear alquiler | `CrearAlquiler/CrearAlquiler.tsx` | 874 | `GET /productos`, `GET /clientes`, `POST /alquileres` | Ruta envuelta en `<ProtectedRoute rolesPermitidos={ADMIN_O_FACTURACION}>`. |
| Productos | `Productos/Productos.tsx` | 427 | `GET /productos`, `POST /productos`, `PATCH /productos/{id}`, `PATCH /productos/{id}/estado` | `puedeGestionar = tienePermiso(rol, SOLO_ADMIN)` → oculta alta/edición/baja. |
| Usuarios | `Usuarios/Usuarios.tsx` | 443 | `GET /usuarios`, `POST /usuarios`, `PATCH /usuarios/{id}`, `PATCH /usuarios/{id}/estado` | `puedeGestionar = tienePermiso(rol, SOLO_ADMIN)`; la vista usa modal de edición (refactor reciente). |
| Gastos | `Gastos/Gastos.tsx` | 278 | `GET /gastos`, `POST /gastos`, `GET /gastos/resumen-semanal` | `puedeVerResumen = tienePermiso(rol, ADMIN_O_FACTURACION)` → el resumen semanal se pide solo si el rol lo permite. |

### 6.1 Tabla de rutas (`App.tsx`)

```
/login                         → Login (público)
/                              → Dashboard
/alquileres                    → ListaAlquileres
/alquileres/nuevo              → CrearAlquiler   (ADMIN_O_FACTURACION)
/alquileres/:id                → AlquilerDetalle
/productos                     → Productos
/usuarios                      → Usuarios
/gastos                        → Gastos
```

Todo lo que cuelga de `/*` se envuelve en `<ProtectedRoute>` (sesión activa) y dentro en `<AppShell>`.

### 6.2 Vista "Crear alquiler" (componente más complejo)

Estado y flujo principales:

1. Carga el catálogo con `GET /productos`.
2. Búsqueda/alta de cliente contra `GET /clientes` (RN-CLI-01: se usa `/clientes`, no `/usuarios`, porque `/usuarios` es `SOLO_ADMIN`).
3. Carrito de productos con `cantidad`, marca de extra y precio de conjunto calculado con `calcularPrecioConjunto` (`src/utils/precios.ts`).
4. Duración del alquiler en días/semanas/meses, convertida con `convertirADias` y **restringida** por la unidad mínima más restrictiva del carrito (`unidadTiempoMasRestrictiva`).
5. Depósito, y costo de entrega/recogida (`TARIFA_ENTREGA_RECOGIDA = 15000` por cada servicio contratado) → **precio sugerido**; el usuario puede sobrescribirlo (`precioAlquiler`).
6. Validación previa con `validarAlquiler` (`src/utils/validacionesAlquiler.ts`), que incluye el espejo de `idx_unico_producto_alquiler` (un producto no puede repetirse como línea no extra).
7. `POST /alquileres` con `detalles` embebidos y navegación a la vista de detalle.

### 6.3 Utilidades de presentación

| Archivo | Responsabilidad |
|---|---|
| `utils/tiempoUi.ts` | Conversión `días/semanas/meses → días` (factores 1 / 7 / 30) y comparación de jerarquías `DIA < SEMANA < MES`. Espeja `app/utils/unidades.py`. |
| `utils/precios.ts` | `precio_base_producto × cantidad × unidades_completas` (sin prorrateo fraccionario). |
| `utils/vencimiento.ts` | Traduce `fecha_vencimiento` a etiqueta y tono (`success`/`warning`/`danger`/`neutral`). Umbral de "por vencer": 2 días (mismo valor que el backend). |
| `utils/validacionesAlquiler.ts` | Validación del formulario de creación (cliente, tiempo, depósito, productos, duplicados no extra). |
| `utils/validations.ts` | Schema Zod de teléfono (`phoneValidation`). |
| `utils/permisos.ts` | Grupos de roles y `tienePermiso`. |

> Las constantes críticas están duplicadas de forma deliberada entre backend y frontend (umbrales, factores de conversión, jerarquía de unidades). Cada copia lo declara en un comentario de cabecera. Esto es una fuente de riesgo de desincronización que se mitiga con la regla: *la validación del frontend es UX; la del backend es la autoridad*.

---

## 7. Tipos del dominio (`src/interfaces/`)

| Archivo | Contenido principal |
|---|---|
| `Alquiler.ts` | `EstadoAlquiler`, `ESTADOS_ALQUILER`, `Alquiler`, `DetalleAlquilerBackend`, `DetalleAlquilerLinea`, `AlquilerCreatePayload`, `AlquilerUpdatePayload`, `HistorialAlquiler` (desalineado — H-06). |
| `Usuario.ts` | `RolUsuario`, `TipoDocumento`, `Usuario`, `UsuarioCreatePayload`, `UsuarioUpdatePayload`, `LoginPayload`, `LoginResponse`. |
| `Cliente.ts` | `Cliente`, `ClienteCreatePayload`, `ClienteUpdatePayload`. |
| `Producto.ts` | `UnidadMinimaAlquiler`, `Producto`, `ProductoCreatePayload`. |
| `Logistica.ts` | `EntregaCreatePayload`, `RecogidaCreatePayload`, `MovimientoLogistico`, `GastoCreatePayload`, `ResumenSemanal`. |
| `DetalleProducto.ts` | Línea del carrito en la vista de creación. |
| `PrecioFinal.ts`, `InputMonedaProps.ts` | Tipos auxiliares. |

> Convención: los archivos de `interfaces/` abren con un comentario que declara que deben coincidir **exactamente** con el schema Pydantic / el controller del backend.

---

## 8. Guías de estilo para nuevos componentes

1. **Nada de librerías de UI.** Todo control es HTML nativo + clases de `src/styles/components.css`.
2. **Consumir tokens semánticos**, nunca colores literales: `var(--color-danger)`, `var(--color-bg-surface)`, etc. Así el modo oscuro funciona sin CSS adicional.
3. **Notificar con `toaster.create(...)`**, nunca con `alert()`.
4. **Todas las llamadas HTTP pasan por `src/api/`**, nunca `fetch` directo desde un componente.
5. **Manejo de errores uniforme**: capturar `ApiError` y usar `error.message` (ya viene en español y listo para el toast).
6. **Toda vista destructiva o de escritura debe pedir confirmación** (patrón ya presente en `Usuarios.tsx` con modal).
7. **Espejar los permisos del backend** en `src/utils/permisos.ts` antes de usar un control restringido.
8. **Tabelas responsivas**: incluir la versión `.table` y la versión `.list-card`.
9. **Accesibilidad mínima**: `aria-label` en botones de solo icono, `aria-expanded` en el menú móvil, `autoFocus` en el campo principal del login.
10. **Nombres de clase**: `kebab-case` y, en componentes con CSS propio, prefijo por componente (`.appshell-*`, `.login-*`).

---

## 9. Configuración de build y despliegue del frontend

| Aspecto | Configuración |
|---|---|
| Script de desarrollo | `npm run dev` → Vite en `http://localhost:5173` |
| Build de producción | `npm run build` → `tsc -b && vite build` → carpeta `dist/` |
| Vista previa local | `npm run preview` |
| Lint | `npm run lint` (oxlint) |
| Salida de Vite | `dist/` (por defecto) |
| Hosting | Vercel, como proyecto con preset "Vite" |
| Routing en Vercel | `vercel.json`: `rewrites` de `/(.*)` a `/index.html` (SPA fallback) |
| Variable de entorno | `VITE_API_URL` (debe incluir `/api/sga`) |

> `vite.config.ts` no define `server.proxy`: en desarrollo, el frontend llama directamente a `http://localhost:8000/api/sga` y la comunicación funciona por CORS (configurado en `app/main.py`).
