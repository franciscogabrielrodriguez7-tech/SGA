# Frontend SGA (Sistema de Gestión de Alquileres de Andamios)

**Variante: CON JWT** — requiere el backend `sga_backend_jwt` (no el original sin JWT). Ver `RECOMENDACION_JWT.md` en el paquete comparativo para la explicación completa.

Stack: React 19 + TypeScript + Vite + **CSS puro** (sin librerías de UI) + React Router.

## 1. Requisitos previos

- Node.js 18+
- El backend **`sga_backend_jwt`** corriendo (no el backend sin JWT — los payloads de login son distintos). Ver el README de ese backend para cómo crear el primer usuario admin.

## 2. Instalación

```bash
npm install
```

## 3. Variables de entorno

```bash
cp .env.example .env
```

```
VITE_API_URL=http://localhost:8000/api/sga
```

## 4. Ejecutar en desarrollo

```bash
npm run dev
```

## 5. Compilar para producción

```bash
npm run build
npm run preview
```

## Sin Chakra UI — sistema de diseño en CSS puro

Este proyecto **no usa ninguna librería de componentes UI** (se eliminaron `@chakra-ui/react`, `@emotion/react` y `next-themes`). Todo el sistema de diseño vive en `src/styles/`:

- `tokens.css` — variables CSS con la paleta cian/verde/azul que definiste (incluye modo claro y oscuro vía `[data-theme="dark"]`).
- `base.css` — reset mínimo y tipografía base.
- `layout.css` — utilidades de layout (`.stack`, `.hstack`, `.grid`, etc.).
- `components.css` — componentes reutilizables: `.btn`, `.input`, `.card`, `.badge`, `.table`, `.toast`.

El toggle de tema y el sistema de alertas (`toaster.create(...)`) se reimplementaron sin dependencias externas. El bundle de producción bajó de 598 KB a ~276 KB al eliminar Chakra/Emotion.

## Cómo funciona la sesión (IMPORTANTE — distinto a la variante sin JWT)

`POST /usuarios/login` del backend `sga_backend_jwt` devuelve un `access_token` además de los datos del usuario. Esta variante:

- Guarda el usuario **y el token** en `localStorage` (`src/context/AuthContext.tsx`).
- `src/api/client.ts` adjunta automáticamente `Authorization: Bearer <token>` en **cada** petición.
- Si el backend responde `401` (token vencido o inválido) en cualquier petición que no sea el propio login, el cliente dispara un evento global `sesionExpirada`; `AuthContext` lo escucha, cierra la sesión y `ProtectedRoute` redirige a `/login` automáticamente, con un toast avisando al usuario.
- El token vence según `JWT_EXPIRE_MINUTES` configurado en el backend (8 horas por defecto).

## Trigger agregado en el backend: usuario creador debe estar activo

El backend ahora rechaza la creación de un alquiler si `id_usuario_creador` no existe o está desactivado (`estado_usuario = FALSE`), vía `trg_validar_creador_activo`. Si ves el error "Operación denegada: El usuario creador no se encuentra activo en el sistema." al crear un alquiler, el usuario con el que iniciaste sesión fue desactivado.

## Diferencias de código respecto a la variante sin JWT

Solo 3 archivos cambian (todo lo demás — páginas, componentes, CSS — es idéntico):

| Archivo | Cambio |
|---|---|
| `src/interfaces/Usuario.ts` | `LoginResponse` incluye ahora `access_token` y `token_type` |
| `src/context/AuthContext.tsx` | Guarda el token, expone `token`, escucha el evento `sesionExpirada` para cerrar sesión automáticamente |
| `src/api/client.ts` | Adjunta `Authorization: Bearer <token>` en cada petición; dispara `sesionExpirada` en un 401 |

## Validado

- `npx tsc -b` sin errores.
- `npm run build` sin errores (48 módulos, ~276 KB).
- **Prueba end-to-end real**: `uvicorn` (backend real) + `vite dev` (frontend real) corriendo simultáneamente, verificado por HTTP con `curl`, y confirmado que el CSS compilado contiene la paleta de colores exacta (`#2be6e1`, `#2ce6a0`, `#2c76e6`, etc.) y el bundle JS no contiene ninguna referencia a Chakra.
- Backend JWT probado: login emite token, rutas protegidas rechazan peticiones sin token (401) y las aceptan con token válido, trigger de usuario activo probado (usuario activo permite crear alquiler, inactivo lo bloquea con mensaje claro).
