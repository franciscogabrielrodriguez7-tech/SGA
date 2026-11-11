# SGA — Frontend (React + TypeScript + Vite)

Interfaz web del Sistema de Gestión de Alquileres de Andamios. Construida con React 19, TypeScript y Vite.

---

## Requisitos

- [Node.js 20+](https://nodejs.org/) (incluye `npm`)
- El backend de SGA corriendo en `http://localhost:8000` (ver `sga_backend_jwt/README.md`)

Para verificar tu versión de Node:
```bash
node --version
npm --version
```

---

## Instalación paso a paso

### 1. Ir a la carpeta del frontend

```bash
cd sga_frontend_jwt
```

### 2. Instalar las dependencias

```bash
npm install
```

Esto descargará todos los paquetes definidos en `package.json` (React, React Router, Zod, etc.) dentro de la carpeta `node_modules/`.

### 3. Configurar la URL del backend

Copia el archivo de ejemplo de variables de entorno:

```bash
# En Windows
copy .env.example .env

# En macOS / Linux
cp .env.example .env
```

El archivo `.env` resultante contiene:

```env
# URL base de la API del backend
# Si tu backend corre en otro puerto o host, cámbiala aquí
VITE_API_URL=http://localhost:8000/api/sga
```

> En la mayoría de casos no necesitas cambiar nada si seguiste la guía del backend.

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación quedará disponible en `http://localhost:5173`.

El servidor tiene **recarga en caliente (HMR)**: cualquier cambio que guardes en el código se reflejará automáticamente en el navegador sin necesidad de recargar.

---

## Estructura del Proyecto

```
sga_frontend_jwt/
├── public/              # Archivos estáticos (favicon.svg, icons.svg, sga_favicon.jpeg)
├── src/
│   ├── api/             # Clientes HTTP para cada recurso (8 módulos: alquileres, auth,
│   │                    #   client, clientes, detalleAlquiler, gastos, productos, usuarios)
│   ├── assets/          # Recursos estáticos de Vite (vite.svg)
│   ├── components/      # Componentes reutilizables organizados por dominio
│   │   ├── alquilerComponents/        # 5 componentes: secciones del formulario de alquiler
│   │   │                              #   (AlquilerSection, ClienteSection, LogisticaSection,
│   │   │                              #    ProductosSection, ResumenAlquiler)
│   │   ├── alquilerDetalleComponents/ # 10 componentes: secciones del detalle de alquiler
│   │   │                              #   (AgregarProducto, CambiarEstado, DatosGenerales,
│   │   │                              #    DetalleProductos, EditarAlquiler, Gestion,
│   │   │                              #    Historial, Logistica, ProductosCompacto, Renovar)
│   │   ├── gastosComponents/          # 2 componentes (CrearGastoSection, ListaGastos)
│   │   ├── inputs/                    # 2 componentes de entrada (InputMoneda, inputFecha)
│   │   ├── layout/                    # AppShell (shell principal), ProtectedRoute
│   │   ├── productos/                 # ProductoSelect (selector reutilizable)
│   │   ├── productosComponents/       # 4 componentes: listados desktop/mobile y modal
│   │   ├── ui/                        # ThemeToggle, toaster
│   │   └── usuariosComponents/        # 4 componentes: listados desktop/mobile y modal
│   ├── context/         # AuthContext (gestión de sesión JWT)
│   ├── interfaces/      # 8 tipos TypeScript (Alquiler, Cliente, DetalleProducto,
│   │                    #   InputMonedaProps, Logistica, PrecioFinal, Producto, Usuario)
│   ├── pages/           # Páginas por ruta
│   │   ├── Alquileres/  # Lista y detalle de alquileres
│   │   ├── CrearAlquiler/
│   │   ├── Dashboard/
│   │   ├── Gastos/
│   │   ├── Login/       # Login.tsx + Login.css
│   │   ├── Productos/
│   │   └── Usuarios/
│   ├── styles/          # CSS global: tokens.css, layout.css, components.css, base.css
│   └── utils/           # 9 utilidades: historialAlquiler, jwt, permisos, precios,
│                        #   reglasAlquiler, tiempoUi, validacionesAlquiler, validations,
│                        #   vencimiento
├── .env.example         # Plantilla de variables de entorno
├── Dockerfile           # Imagen multi-etapa (build con Node 20-alpine + Nginx 1.27-alpine)
├── nginx.conf           # Configuración de Nginx (config. existente)
├── vercel.json          # Reescritura SPA para el despliegue en Vercel
├── package.json         # Dependencias y scripts npm
└── vite.config.ts       # Configuración de Vite
```

---

## Comandos disponibles

```bash
# Iniciar servidor de desarrollo con HMR
npm run dev

# Verificar el código con el linter (oxlint)
npm run lint

# Compilar para producción (genera la carpeta dist/)
npm run build

# Vista previa del build de producción localmente
npm run preview
```

---

## Despliegue

> El propietario del proyecto confirma que el despliegue del frontend en Vercel está operativo.

### Destino principal: Vercel

Por decisión del propietario, Vercel es el destino principal del frontend. El archivo [`vercel.json`](./vercel.json) de esta carpeta contiene:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- **Propósito:** reescritura para aplicación de una sola página (SPA). Cualquier ruta se sirve con `index.html` y React Router (`src/App.tsx`) resuelve rutas como `/login` o `/alquileres/:id` al recargar la página o entrar directamente por URL.
- **Lo que no define:** no contiene `redirects` ni un proxy hacia el backend. La redirección de `/` a `/login` para usuarios sin sesión la realiza el cliente (`ProtectedRoute`).
- **Build:** el script `npm run build` ejecuta `tsc -b && vite build` (`package.json`).
- **No verificado:** la configuración del proyecto en Vercel (proyecto enlazado, rama conectada, directorio raíz, comando de build y variables) se define en la plataforma y no está versionada en el repositorio.

### Variables de entorno

| Variable | Uso | Valores en el repositorio |
|---|---|---|
| `VITE_API_URL` | URL base de la API (`src/api/client.ts`). Si no está definida se usa `http://localhost:8000/api/sga`; las barras finales se eliminan. Vite la incorpora al código durante el build. | `.env.example`: `http://localhost:8000/api/sga`. Docker: `/api/sga` (argumento de build en `Dockerfile` y `docker-compose.yml`; también en `.env.docker.example`). |

No hay otras variables `VITE_*` usadas por el frontend en `src/api/client.ts`. El valor de `VITE_API_URL` para un entorno desplegado en Vercel no está definido en el repositorio.

> **Deducción de la configuración actual (no verificada en ejecución):** como `vercel.json` no define un proxy hacia el backend, un valor relativo como `/api/sga` no alcanzaría al backend en Vercel; `VITE_API_URL` tendría que apuntar a una URL del backend accesible desde el navegador.

### Relación con el backend y CORS

- El frontend llama a la API REST del backend a partir de `VITE_API_URL` y envía el token JWT en el encabezado `Authorization: Bearer <token>`.
- El backend aplica CORS con `CORSMiddleware` en `sga_backend_jwt/app/main.py`, con `allow_origins` tomado de `CORS_ORIGINS` (`sga_backend_jwt/app/config/settings.py`). `CORS_ORIGINS` es una variable de entorno con orígenes separados por coma; su valor por defecto es `http://localhost:5173,http://127.0.0.1:5173`.
- En desarrollo local (`npm run dev`, puerto 5173) el valor por defecto es suficiente.
- **Deducción (no verificada en ejecución):** para un frontend servido desde otro origen, como un dominio de Vercel, ese origen tendría que estar incluido en `CORS_ORIGINS` del backend. El repositorio no contiene valores de producción.

### Alternativa técnica existente: Docker y Nginx

Esta configuración existe en el repositorio y no es el destino principal del frontend:

- [`Dockerfile`](./Dockerfile): build multi-etapa; una etapa con `node:20-alpine` ejecuta `npm ci` y `npm run build`, y otra con `nginx:1.27-alpine` sirve el contenido de `dist/` (puerto 80).
- [`nginx.conf`](./nginx.conf): sirve la SPA con la regla `try_files $uri $uri/ /index.html` y redirige las peticiones `/api/` a `http://backend:8000` (reverse proxy), por lo que el navegador no cambia de origen.
- `docker-compose.yml` y `.env.docker.example` (en la raíz del repositorio) orquestan `postgres`, `backend` y `frontend`.
- Esta actualización documental no ejecutó ni validó el arranque del stack en contenedores.

---

## Notas importantes

- **Autenticación:** La aplicación usa JWT. El token se almacena en `localStorage` y se envía automáticamente en el header `Authorization: Bearer <token>` en cada llamada a la API. Al cerrar sesión o si el token expira, se redirige al login.
- **Roles de usuario:** La interfaz adapta los controles visibles según el rol del usuario autenticado (`admin`, `encargado_facturacion`, `encargado_logistico`). Los roles se validan además en el backend.
- **Validaciones:** Los formularios usan [Zod](https://zod.dev/) para validación de esquemas en el cliente antes de enviar datos al servidor.
- **CORS:** Si ves errores de CORS en la consola del navegador, verifica que el origen desde el que abres el frontend (por defecto `http://localhost:5173`) esté incluido en la variable de entorno `CORS_ORIGINS` del backend (se lee en `app/config/settings.py` y se aplica en `app/main.py`).
