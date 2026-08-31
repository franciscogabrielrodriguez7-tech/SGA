# Frontend SGA (Sistema de Gestión de Alquileres de Andamios)

**Variante: CON JWT** — requiere el backend `sga_backend_jwt` (no el original). Ver `RECOMENDACION_JWT.md` en el paquete comparativo para la explicación completa.

Stack: React 19 + TypeScript + Vite + Chakra UI v3 + React Router.

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

## Cómo funciona la sesión (IMPORTANTE — distinto a la variante sin JWT)

`POST /usuarios/login` del backend `sga_backend_jwt` devuelve un `access_token` además de los datos del usuario. Esta variante:

- Guarda el usuario **y el token** en `localStorage` (`src/context/AuthContext.tsx`).
- `src/api/client.ts` adjunta automáticamente `Authorization: Bearer <token>` en **cada** petición.
- Si el backend responde `401` (token vencido o inválido) en cualquier petición que no sea el propio login, el cliente dispara un evento global `sesionExpirada`; `AuthContext` lo escucha, cierra la sesión y `ProtectedRoute` redirige a `/login` automáticamente, con un toast avisando al usuario.
- El token vence según `JWT_EXPIRE_MINUTES` configurado en el backend (8 horas por defecto) — pasado ese tiempo, la próxima petición fuerza el cierre de sesión descrito arriba.

Esta variante sí protege realmente los endpoints: sin un token válido, el backend rechaza la petición con `401` antes de tocar la base de datos.

## Diferencias de código respecto a la variante sin JWT

Solo 3 archivos cambian (todo lo demás — páginas, componentes, otros servicios — es idéntico):

| Archivo | Cambio |
|---|---|
| `src/interfaces/Usuario.ts` | `LoginResponse` incluye ahora `access_token` y `token_type` |
| `src/context/AuthContext.tsx` | Guarda el token, expone `token`, escucha el evento `sesionExpirada` para cerrar sesión automáticamente |
| `src/api/client.ts` | Adjunta `Authorization: Bearer <token>` en cada petición; dispara `sesionExpirada` en un 401 |

## Validado

- `npx tsc -b` sin errores.
- `npm run build` genera el bundle de producción sin errores.
- Probado contra `sga_backend_jwt` real: login emite token, rutas protegidas rechazan peticiones sin token (401) y las aceptan con token válido.
