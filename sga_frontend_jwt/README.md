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
├── public/              # Archivos estáticos públicos (favicon, etc.)
├── src/
│   ├── api/             # Funciones de llamada a la API REST del backend
│   ├── components/      # Componentes reutilizables (AppShell, Toaster, etc.)
│   ├── context/         # Contextos de React (AuthContext para sesión JWT)
│   ├── interfaces/      # Tipos TypeScript (Alquiler, Usuario, Producto, etc.)
│   ├── pages/           # Páginas de la aplicación por ruta
│   │   ├── Dashboard/   # Panel de control (alquileres pendientes, por vencer, vencidos)
│   │   ├── Alquileres/  # Lista y detalle de alquileres
│   │   ├── CrearAlquiler/
│   │   ├── Usuarios/
│   │   ├── Productos/
│   │   ├── Gastos/
│   │   └── Login/
│   ├── styles/          # Hojas de estilo CSS (tokens, layout, componentes)
│   └── utils/           # Utilidades (permisos de rol, validaciones Zod, etc.)
├── .env                 # Variables de entorno locales (NO subir a Git)
├── .env.example         # Plantilla de variables de entorno
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

## Notas importantes

- **Autenticación:** La aplicación usa JWT. El token se almacena en `localStorage` y se envía automáticamente en el header `Authorization: Bearer <token>` en cada llamada a la API. Al cerrar sesión o si el token expira, se redirige al login.
- **Roles de usuario:** La interfaz adapta los controles visibles según el rol del usuario autenticado (`admin`, `encargado_facturacion`, `encargado_logistico`). Los roles se validan además en el backend.
- **Validaciones:** Los formularios usan [Zod](https://zod.dev/) para validación de esquemas en el cliente antes de enviar datos al servidor.
- **CORS:** Si ves errores de CORS en la consola del navegador, verifica que el backend tenga configurado el origen `http://localhost:5173` en su lista de `allow_origins` (ver `app/main.py`).
