# Mapa de Arquitectura — SGA Web

- **Proyecto:** Sistema de Gestión de Alquileres de Andamios (SGA) — Fundiplacas Rodríguez
- **Versión de la aplicación SGA:** 2.0.0
- **Fecha del documento:** 2026-11-23
- **Tarea origen:** RM-DOC-010
- **HEAD de referencia:** `cefb92df3e4f15f98568131d3a91711665bbf64b` (rama `dev`)

---

> **Fuentes de verdad utilizadas para este documento:**
> - `sga_backend_jwt/app/main.py`
> - `sga_backend_jwt/app/routes/*.py` — 7 archivos de rutas
> - `sga_backend_jwt/app/controllers/*.py` — 7 controladores
> - `sga_backend_jwt/app/models/*.py` — 7 modelos SQLAlchemy
> - `sga_backend_jwt/app/schemas/*.py` — 6 esquemas Pydantic
> - `sga_backend_jwt/app/utils/*.py` — 10 utilidades
> - `sga_backend_jwt/app/config/database.py` y `sga_backend_jwt/app/config/settings.py`
> - `sga_backend_jwt/app/utils/audit_context.py`
> - `sga_backend_jwt/app/utils/roles.py`
> - `sga_backend_jwt/app/utils/scheduler.py`
> - `sga_backend_jwt/entrypoint.sh`
> - `sga_backend_jwt/alembic/versions/0001_initial_schema.py`
> - `sga_backend_jwt/requirements.txt`
> - `sga_frontend_jwt/package.json`
> - `sga_frontend_jwt/vite.config.ts`
> - `sga_frontend_jwt/src/App.tsx`, `src/main.tsx`
> - `sga_frontend_jwt/nginx.conf`
> - `database/01_esquema/01_tablas.sql`
> - `database/01_esquema/02_funciones_y_triggers.sql`
> - `database/01_esquema/06_vistas_dashboard.sql`
> - `docker-compose.yml`
> - Auditorías e inventarios previos: `AUD-2026-007`, `EVD-2026-003`

> **Convenciones de certeza usadas en este documento:**
> - **Verificado en código (evidencia estática):** afirmación respaldada directamente por la inspección del código fuente o archivos versionados en el repositorio.
> - **Declarado por el propietario:** información operativa o de diseño comunicada por el propietario del proyecto; no equivale a una comprobación independiente en ejecución o en la base de datos desplegada.
> - **Inferido:** deducción técnica derivada de la lectura combinada de artefactos del repositorio, sin prueba en runtime.
> - **No verificado en ejecución o producción:** el objeto, comportamiento o configuración existe en el repositorio (o fue declarado), pero no se comprobó mediante pruebas dinámicas ni inspección directa del entorno productivo.
> - **Pendiente de implementación:** objetivo arquitectónico o corrección aprobada hacia futuro que no está implementada en el HEAD actual.

---

## 1. Panorama general del sistema

El SGA web es una aplicación de gestión de alquileres de andamios para Fundiplacas Rodríguez. Permite registrar contratos de alquiler, gestionar inventario de productos, administrar usuarios con control de acceso basado en roles (RBAC) y registrar movimientos logísticos y gastos operativos. Incluye un mecanismo de auditoría en base de datos que registra operaciones de escritura sobre las cinco tablas configuradas con triggers de auditoría hacia `auditoria_sistema`, con las excepciones y limitaciones descritas en la sección 7.

### 1.1 Stack tecnológico (verificado en código)

| Capa | Tecnología | Versión verificada | Fuente |
|---|---|---|---|
| Aplicación SGA | — | **2.0.0** | `sga_backend_jwt/app/main.py:34,141` (`version`) |
| Backend framework | FastAPI | **0.141.1** | `sga_backend_jwt/requirements.txt:10` |
| Servidor ASGI | Uvicorn | 0.52.3 | `sga_backend_jwt/requirements.txt:23` |
| ORM | SQLAlchemy | 2.0.52 | `sga_backend_jwt/requirements.txt:19` |
| Validación backend | Pydantic | 2.13.4 | `sga_backend_jwt/requirements.txt:16` |
| Migraciones | Alembic | 1.13.3 | `sga_backend_jwt/requirements.txt:1` |
| Autenticación | PyJWT | 2.10.1 | `sga_backend_jwt/requirements.txt:15` |
| Hash de contraseñas | bcrypt | 4.2.1 | `sga_backend_jwt/requirements.txt:8` |
| Tarea programada | APScheduler | 3.11.3 | `sga_backend_jwt/requirements.txt:7` |
| Base de datos (Docker) | PostgreSQL | **16-alpine** (imagen Docker) | `docker-compose.yml:21` |
| Base de datos (producción) | PostgreSQL | No verificada en ejecución | — |
| Frontend framework | React | ^19.2.8 | `sga_frontend_jwt/package.json:14-15` |
| Lenguaje frontend | TypeScript | ~6.0.2 | `sga_frontend_jwt/package.json:25` |
| Bundler | Vite | ^8.2.0 | `sga_frontend_jwt/package.json:26` |
| Enrutamiento frontend | React Router | ^7.18.3 | `sga_frontend_jwt/package.json:16` |
| Validación de formularios | @hookform/resolvers | ^5.9.1 | `sga_frontend_jwt/package.json:13` |
| Validación de esquemas | Zod | **^4.6.5** | `sga_frontend_jwt/package.json:17` |
| Servidor estático / proxy | Nginx | — | `sga_frontend_jwt/nginx.conf`, `docker-compose.yml:88-108` |
| Orquestación local | Docker Compose | — | `docker-compose.yml` |

> **Nota sobre versiones de PostgreSQL:** La imagen Docker configurada en el repositorio es `postgres:16-alpine` (`docker-compose.yml:21`). La versión exacta de PostgreSQL desplegada en producción no ha sido verificada de forma independiente. No deben equipararse ambos valores.

### 1.2 Capas del sistema

```
┌──────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN                                    │
│  React 19 + TypeScript + Vite                            │
│  (build estático servido por Nginx en Docker Compose)    │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTP  /api/*  (reverse proxy Nginx en Docker)
                            │ HTTP  VITE_API_URL  (en desarrollo local sin Docker)
┌───────────────────────────▼──────────────────────────────┐
│  CAPA DE APLICACIÓN                                      │
│  FastAPI 0.141.1 + Uvicorn (2 workers en Docker)         │
│  7 routers — 38 operaciones REST bajo /api/sga           │
│  Ruta raíz pública GET / (diagnóstico fuera de /api/sga) │
│  RBAC vía requiere_rol()                                 │
│  APScheduler (tarea diaria de vencimientos)              │
└───────────────────────────┬──────────────────────────────┘
                            │ SQLAlchemy 2.0.52 / psycopg2
┌───────────────────────────▼──────────────────────────────┐
│  CAPA DE DATOS                                           │
│  PostgreSQL 16 (Docker) / Render (declarado)             │
│  7 tablas + 16 índices (creados por Alembic actual)      │
│  12 funciones + 19 triggers + 1 vista                    │
│  (definidos en scripts SQL — ver §5.2, §5.3 y §6)        │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Arquitectura del frontend

### 2.1 Modo de entrada y comunicación con el backend

| Modo | URL de acceso | Comunicación con la API |
|---|---|---|
| **Desarrollo local** | `http://localhost:5173` | El frontend usa `VITE_API_URL` como base URL del cliente HTTP (ej. `http://localhost:8000/api/sga`). **`sga_frontend_jwt/vite.config.ts` no configura ningún proxy hacia el backend**: solo registra el plugin `@vitejs/plugin-react` (`plugins: [react()]`). El cliente HTTP del frontend apunta directamente a la URL configurada en `VITE_API_URL`. |
| **Docker Compose** | `http://localhost:80` | El build estático de React se sirve con Nginx. `VITE_API_URL` se fija por defecto en `/api/sga` durante el `docker build` (`docker-compose.yml:96`). Nginx actúa como reverse proxy (`sga_frontend_jwt/nginx.conf:44-57`): las peticiones a `/api/` se reenvían internamente a `http://backend:8000`. El navegador no cruza de origen; CORS no aplica en este flujo. |
| **Despliegue declarado** | Vercel (declarado por propietario) | Según declaración del propietario, el frontend se despliega en Vercel. `sga_frontend_jwt/vercel.json` configura una regla `rewrites` para el routing de la SPA, pero no define un proxy hacia el backend. La comunicación con el backend en producción depende de la `VITE_API_URL` grabada en el bundle durante el build de despliegue. No verificado en ejecución. |

> **Nota sobre `vite.config.ts` (`sga_frontend_jwt/vite.config.ts:1-7`):** El archivo únicamente contiene `plugins: [react()]`. No existe configuración de proxy en Vite. El flujo de comunicación en desarrollo local depende exclusivamente de que `VITE_API_URL` apunte directamente al backend y de que `CORS_ORIGINS` en el backend autorice el origen del frontend.

### 2.2 Estructura de directorios `src/`

| Directorio | Contenido verificado |
|---|---|
| `src/api/` | Cliente HTTP para comunicación con la API REST |
| `src/assets/` | Recursos estáticos (imágenes, íconos) |
| `src/components/alquilerComponents/` | Componentes del módulo de alquileres |
| `src/components/alquilerDetalleComponents/` | Componentes del detalle de alquiler |
| `src/components/gastosComponents/` | Componentes del módulo de gastos |
| `src/components/inputs/` | Componentes de entrada de datos genéricos |
| `src/components/layout/` | `AppShell`, `ProtectedRoute` y estructura base |
| `src/components/productos/` | Componentes del módulo de productos (directorio adicional verificado) |
| `src/components/productosComponents/` | Componentes adicionales del módulo de productos |
| `src/components/usuariosComponents/` | Componentes del módulo de usuarios |
| `src/components/ui/` | Componentes de interfaz genéricos (toaster, etc.) |
| `src/context/` | `AuthContext` — gestión de sesión y usuario autenticado |
| `src/interfaces/` | Tipos TypeScript (contratos de datos con la API) |
| `src/pages/Alquileres/` | Páginas del módulo de alquileres (`ListaAlquileres`, `AlquilerDetalle`) |
| `src/pages/CrearAlquiler/` | Página de creación de alquiler (`CrearAlquiler`) |
| `src/pages/Dashboard/` | Página principal del dashboard (`Dashboard`) |
| `src/pages/Gastos/` | Página del módulo de gastos (`Gastos`) |
| `src/pages/Login/` | Página de inicio de sesión (`Login`) |
| `src/pages/Productos/` | Página del módulo de productos (`Productos`) |
| `src/pages/Usuarios/` | Página del módulo de usuarios (`Usuarios`) |
| `src/styles/` | Estilos globales |
| `src/utils/` | Utilidades (permisos, constantes, decodificación de JWT para UX) |

### 2.3 Rutas de la aplicación (verificado en `sga_frontend_jwt/src/App.tsx:16-51`)

| Ruta frontend | Componente | Acceso |
|---|---|---|
| `/login` | `Login` | Público |
| `/` | `Dashboard` | Autenticado |
| `/alquileres` | `ListaAlquileres` | Autenticado |
| `/alquileres/nuevo` | `CrearAlquiler` | `ADMIN_O_FACTURACION` (guardia frontend) |
| `/alquileres/:id` | `AlquilerDetalle` | Autenticado |
| `/productos` | `Productos` | Autenticado |
| `/usuarios` | `Usuarios` | Autenticado |
| `/gastos` | `Gastos` | Autenticado |

> **Nota:** Los guardias de rol del frontend son una capa de UX. La restricción definitiva de acceso la aplica el backend mediante `requiere_rol()`. Un usuario con rol insuficiente que invoque directamente un endpoint protegido recibirá un HTTP 403 del backend.

### 2.4 Autenticación frontend

- El token JWT se almacena en `localStorage` tras el login.
- `AuthContext` provee el estado de sesión a toda la aplicación (`sga_frontend_jwt/src/main.tsx:12-18`).
- `ProtectedRoute` redirige a `/login` si no hay sesión activa; opcionalmente verifica roles (`rolesPermitidos`).

### 2.5 Gestión de paquetes

El proyecto frontend utiliza **npm** como gestor de paquetes y dispone de `sga_frontend_jwt/package-lock.json`.

---

## 3. Arquitectura del backend

### 3.1 Punto de entrada y configuración (`sga_backend_jwt/app/main.py`)

- **Prueba de conexión inicial:** al importarse `main.py` (`L10-16`), ejecuta `SELECT 1` contra el `engine` de SQLAlchemy y después imprime un mensaje fijo de conexión exitosa (`"Conexion exitosa a PostgreSQL"`) o el error correspondiente (`f"Error de conexion: {error}"`).
- **Instancia FastAPI:** `title="API SGA"`, `version="2.0.0"` (`main.py:31-35`; `2.0.0` es la versión de la aplicación SGA, mientras que la versión de FastAPI es `0.141.1` según `requirements.txt:10`).
- **Prefijo global de API para routers de dominio:** `API_PREFIX = "/api/sga"` (`main.py:114`).
- **Ruta pública de aplicación fuera del prefijo `/api/sga`:** `GET /` (`def inicio()`, `main.py:134-145`) está registrada directamente sobre la instancia `app`, fuera del prefijo `/api/sga`. Es un endpoint público de diagnóstico que devuelve el estado de la API, la versión (`"2.0.0"`) y el prefijo configurado (`"/api/sga"`). **No forma parte de los 7 routers de dominio ni se contabiliza dentro de las 38 operaciones REST bajo `/api/sga`.**
- **CORS:** configurado mediante `CORSMiddleware` (`main.py:60-66`) consumiendo `CORS_ORIGINS` desde `app/config/settings.py`, con `allow_credentials=True`, `allow_methods=["*"]` y `allow_headers=["*"]`.
- **Manejador de excepciones HTTP personalizado (`main.py:78-95`):** intercepta `HTTPException` y unifica la respuesta de error para códigos 401 (`AUTH_ERROR`), 403 (`FORBIDDEN`), 404 (`NOT_FOUND`) y otros (`HTTP_ERROR`) utilizando el sobre estándar `{status, mensaje, data, error, code}` generado por `response_error()`.
- **Scheduler:** registra `iniciar_scheduler()` en el evento `startup` y `detener_scheduler()` en `shutdown` (`main.py:46-53`).

### 3.2 Capas internas del backend

El código del backend se organiza en las siguientes capas bajo `sga_backend_jwt/app/`:

| Capa | Directorio | Responsabilidad verificada |
|---|---|---|
| Configuración | `config/` | `database.py` (`L1-33`): crea el `engine` SQLAlchemy con `DATABASE_URL` (`pool_pre_ping=True`, `pool_recycle=3600`), define `SessionLocal`, `Base` y el generador `get_db()` para inyección de sesión; `settings.py`: carga variables de entorno |
| Rutas | `routes/` | Declaran los 7 routers y sus 38 operaciones bajo `/api/sga`, aplican autenticación (`get_current_user`) y autorización (`requiere_rol()`) vía `Depends()`, delegan la operación a los controladores y envuelven el retorno con `response_success()` / `response_error()` |
| Controladores | `controllers/` | Implementan la lógica de negocio y consultas ORM o SQL textual (`text()`); invocan `set_audit_context()` en operaciones de escritura autenticadas (con las excepciones documentadas en §7.3) y traducen errores de BD mediante `extraer_mensaje_negocio()` |
| Modelos | `models/` | 7 clases SQLAlchemy que mapean las 7 tablas físicas del esquema relacional |
| Esquemas | `schemas/` | 6 módulos con modelos Pydantic v2 que validan payloads de entrada (creación, actualización, cambio de estado) |
| Utilidades | `utils/` | 10 módulos transversales de autenticación, autorización, contexto de auditoría, formato de respuesta, tiempo, unidades y tareas programadas |

**Relación de dependencia entre capas (verificada en imports):**
`main.py` → `routes/` → (`schemas/`, `utils/auth_dependency.py`, `utils/roles.py`, `utils/response.py`, `config/database.py`, `controllers/`) → (`models/`, `utils/audit_context.py`, `utils/db_errors.py`, `utils/tiempo.py`, `utils/unidades.py`, `utils/security.py`, `utils/jwt_utils.py`).

**Utilidades disponibles en `utils/`:**

| Archivo | Propósito verificado |
|---|---|
| `audit_context.py` | `set_audit_context(db, id_usuario)` (`L33-38`) — ejecuta `SET LOCAL app.usuario_actual = :uid` en la transacción actual |
| `auth_dependency.py` | `UsuarioActual` y `get_current_user()` (`L24-61`) — extrae y valida el token JWT del header `Authorization: Bearer` |
| `db_errors.py` | `extraer_mensaje_negocio()` — extrae mensajes legibles de excepciones `DBAPIError` (ej. `RAISE EXCEPTION` de triggers PL/pgSQL) |
| `jwt_utils.py` | Creación y decodificación de tokens JWT (`HS256`), manejo de `TokenExpirado` y `TokenInvalido` |
| `response.py` | `response_success()` y `response_error()` — construyen el sobre JSON estándar de la API |
| `roles.py` | `requiere_rol(*roles_permitidos)` (`L27-45`) y tuplas de agrupación de roles |
| `scheduler.py` | `BackgroundScheduler` (`APScheduler`) con el job `_job_actualizar_vencidos()` (`L22-41`) |
| `security.py` | `hashear_contrasena()` y `verificar_contrasena()` con `bcrypt` |
| `tiempo.py` | Cálculo de fechas de vencimiento en zona `America/Bogota` y expresión SQL `FECHA_VENCIMIENTO_SQL` |
| `unidades.py` | `validar_tiempo_alquiler_para_productos()` — jerarquía de unidades mínimas (`DIA < SEMANA < MES`) |

**Archivos de modelos (`models/`):**
`alquiler.py`, `auditoria_sistema.py`, `detalle_alquiler.py`, `logistica_alquiler.py`, `logistica_alquiler_alquiler.py`, `producto.py`, `usuario.py`

**Archivos de esquemas (`schemas/`):**
`alquiler_schema.py`, `cliente_schema.py`, `detalle_alquiler_schema.py`, `logistica_alquiler_schema.py`, `producto_schema.py`, `usuario_schema.py`

**Archivos de controladores (`controllers/`):**
`alquiler_controller.py`, `auditoria_controller.py`, `cliente_controller.py`, `detalle_alquiler_controller.py`, `logistica_alquiler_controller.py`, `producto_controller.py`, `usuario_controller.py`

### 3.3 Routers registrados bajo `/api/sga` (verificado en `main.py:101-127` y `routes/*.py`)

| Router | Archivo | Prefijo efectivo | Operaciones REST | Notas |
|---|---|---|---:|---|
| `auth_router` | `auth_routes.py` | `/api/sga/auth` | 1 | `POST /login` — única operación pública bajo `/api/sga` |
| `usuario_router` | `usuario_routes.py` | `/api/sga/usuarios` | 5 | Incluye restricción interna por rol en `GET /usuarios` (ver §4.2) |
| `cliente_router` | `cliente_routes.py` | `/api/sga/clientes` | 5 | Gestión de registros con `rol_usuario = 'cliente'` |
| `producto_router` | `producto_routes.py` | `/api/sga/productos` | 5 | Escritura restringida a `SOLO_ADMIN` |
| `alquiler_router` | `alquiler_routes.py` | `/api/sga/alquileres` | 16 | Contratos, búsquedas, historial, renovaciones, entregas y recogidas |
| `detalle_alquiler_router` | `detalle_alquiler_routes.py` | `/api/sga/detalle-alquiler` | 3 | Creación, consulta y edición de líneas de producto |
| `gastos_router` | `gastos_routes.py` | `/api/sga/gastos` | 3 | Creación, listado y resumen semanal de gastos logísticos |
| **Total bajo `/api/sga`** | **7 routers** | | **38** | Excluye `GET /` (definido en `main.py:134` fuera de `/api/sga`) |

### 3.4 Seguridad, jerarquía oficial de roles y RBAC

#### Jerarquía oficial de roles del sistema (confirmada por el propietario)

El sistema contempla únicamente **tres roles operativos oficiales** con acceso a la aplicación, organizados bajo una jerarquía de herencia ascendente:

| Rol | Capacidades |
|---|---|
| `admin` | Capacidades de administración, facturación y logística |
| `encargado_facturacion` | Capacidades de facturación y logística |
| `encargado_logistico` | Capacidades logísticas |

- **Herencia ascendente:** `admin` puede acceder a las capacidades de facturación y logística; `encargado_facturacion` puede acceder a las capacidades logísticas (`admin > encargado_facturacion > encargado_logistico`).
- **Valor `cliente` en base de datos:** Aunque la restricción `chk_usuario_rol` de la tabla `usuario` (`database/01_esquema/01_tablas.sql:40-48`) admite el valor `'cliente'` para almacenar compradores en la misma tabla, `'cliente'` no es un rol con acceso al sistema: `login_usuario()` (`sga_backend_jwt/app/controllers/usuario_controller.py:208-209`) rechaza el inicio de sesión cuando `rol_usuario == "cliente"`, y `sga_backend_jwt/app/utils/roles.py:18-19` documenta explícitamente que nunca forma parte de ningún grupo de permisos.
- **Alcance de verificación de la jerarquía:** La tabla anterior representa la jerarquía funcional oficial definida por el propietario. Aunque los comentarios de `sga_backend_jwt/app/utils/roles.py:10-19` describen esta misma regla de herencia ascendente, **no debe asumirse que los 38 endpoints respetan efectivamente dicha herencia en todos sus casos** hasta que se realice una auditoría completa de autorización endpoint por endpoint (pendiente de verificación).

#### Agrupaciones de roles utilizadas en los endpoints (`sga_backend_jwt/app/utils/roles.py:53-59`)

| Constante activa | Roles incluidos | Coherencia con la jerarquía oficial |
|---|---|---|
| `SOLO_ADMIN` | `("admin",)` | Nivel 1: exclusivo de administración |
| `ADMIN_O_FACTURACION` | `("admin", "encargado_facturacion")` | Niveles 1 y 2: administración y facturación |
| `STAFF_INTERNO` | `("admin", "encargado_facturacion", "encargado_logistico")` | Niveles 1, 2 y 3: todo el personal interno |

> **Definición residual `ADMIN_O_LOGISTICO` en código (`sga_backend_jwt/app/utils/roles.py:57`):**
> En `roles.py:57` existe actualmente la constante `ADMIN_O_LOGISTICO = ("admin", "encargado_logistico")`. La auditoría estática del repositorio comprobó que esta constante tiene **cero usos** y ningún endpoint ni router depende de ella. Además, contradice el comentario del propio archivo (`roles.py:15-18`, que establece que nunca existe un grupo que incluya a `encargado_logistico` sin incluir también a `encargado_facturacion`) y **no forma parte de la jerarquía oficial de roles confirmada por el propietario**. Se documenta únicamente como una definición residual en el código actual; su retiro de `roles.py` corresponde a una tarea de corrección de código posterior y no a esta intervención documental.

#### Cobertura de protección de endpoints y JWT

- **Operaciones bajo `/api/sga` (38 en total):**
  - **37 operaciones protegidas** mediante `Depends(requiere_rol(...))` (además de `Depends(get_current_user)` declarado a nivel de `APIRouter` en los 6 routers protegidos).
  - **1 operación pública bajo `/api/sga`:** `POST /api/sga/auth/login` (`sga_backend_jwt/app/routes/auth_routes.py:13`).
- **Ruta fuera de `/api/sga`:**
  - `GET /` (`sga_backend_jwt/app/main.py:134-145`) es una ruta pública de diagnóstico de la aplicación fuera del prefijo `/api/sga` y fuera del conteo de las 38 operaciones REST.
- **JWT:** algoritmo configurable vía `JWT_ALGORITHM` (por defecto `HS256`), tiempo de expiración configurable vía `JWT_EXPIRE_MINUTES` (por defecto `480` minutos) y clave secreta en `JWT_SECRET_KEY` (`sga_backend_jwt/app/config/settings.py`).

### 3.5 Tarea programada (APScheduler) y reconciliación de vencimientos

Archivo: `sga_backend_jwt/app/utils/scheduler.py`

- **Función del job:** `_job_actualizar_vencidos()` (`scheduler.py:22-41`) ejecuta un `UPDATE` directo sobre la tabla `alquiler` para cambiar `estado_alquiler` de `'activo'` a `'vencido'` cuando la fecha de vencimiento calculada (`fecha_inicio + tiempo_alquiler_dias - 1`) es anterior a `CURRENT_DATE`.
- **Frecuencia:** diaria a las 00:05, zona horaria `America/Bogota`, configurada explícitamente tanto en `BackgroundScheduler(timezone="America/Bogota")` (`L19`) como en `CronTrigger(hour=0, minute=5, timezone="America/Bogota")` (`L55`).
- **Mecanismo complementario en controlador (`verificar_y_actualizar_vencidos`):** la función `verificar_y_actualizar_vencidos(db)` (`sga_backend_jwt/app/controllers/alquiler_controller.py:96-108`) ejecuta la misma transición `activo → vencido` y realiza `db.commit()` (`L106`). Aunque los comentarios de `scheduler.py:6-8` y `alquiler_controller.py:90-93` mencionan su uso en consultas de lectura, en el código actual fue removida de las funciones de lectura (`alquiler_controller.py:192,212,383,419,443`) y se invoca al inicio de **seis funciones de escritura** de `alquiler_controller.py`: `crear_alquiler` (`L117`), `actualizar_alquiler` (`L245`), `cambiar_estado_alquiler` (`L340`, invocada también por `cancelar_alquiler` en `L375`), `renovar_alquiler` (`L502`), `registrar_entrega` (`L559`) y `registrar_recogida` (`L647`).
- **Ausencia de contexto de auditoría en la reconciliación:** ni `_job_actualizar_vencidos()` (`scheduler.py:22-41`) ni `verificar_y_actualizar_vencidos(db)` (`alquiler_controller.py:96-108`) invocan `set_audit_context()`. Por ello, cualquier transición `activo → vencido` ejecutada por cualquiera de estas dos vías genera registros en `auditoria_sistema` con `id_usuario_accion = NULL`, mientras que las escrituras principales posteriores de los seis controladores sí establecen el contexto de auditoría (ver §7.3.a).

---

## 4. API REST — Inventario de endpoints

> **Alcance del conteo:** Las tablas siguientes inventarían las **38 operaciones REST registradas bajo el prefijo `/api/sga`** a través de los 7 routers de dominio (37 operaciones protegidas por rol y 1 operación pública: `POST /api/sga/auth/login`).
> Fuera del prefijo `/api/sga`, la aplicación define únicamente la ruta pública de diagnóstico `GET /` en `sga_backend_jwt/app/main.py:134-145`, la cual no forma parte de los routers ni se incluye en el conteo de las 38 operaciones REST.

### 4.1 Auth (`/api/sga/auth` — `sga_backend_jwt/app/routes/auth_routes.py`)

| Método | Ruta relativa al prefijo `/api/sga` | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Público (sin `requiere_rol`) | Autenticación por teléfono o email; devuelve JWT (`L13`) |

### 4.2 Usuarios (`/api/sga/usuarios` — `sga_backend_jwt/app/routes/usuario_routes.py`)

| Método | Ruta relativa al prefijo `/api/sga` | Acceso | Descripción |
|---|---|---|---|
| POST | `/usuarios` | `SOLO_ADMIN` | Crear usuario de personal interno (`L38`) |
| GET | `/usuarios` | `STAFF_INTERNO` (con restricción interna) | Listar usuarios (`L77`) |
| GET | `/usuarios/{id_usuario}` | `SOLO_ADMIN` | Obtener usuario por ID (`L106`) |
| PATCH | `/usuarios/{id_usuario}` | `SOLO_ADMIN` | Actualizar datos de usuario (`L125`) |
| PATCH | `/usuarios/{id_usuario}/estado` | `SOLO_ADMIN` | Activar o desactivar usuario (`L165`) |

> **Restricción interna en `GET /api/sga/usuarios` (verificado en `sga_backend_jwt/app/routes/usuario_routes.py:77-92`):** Aunque la dependencia de la ruta declara `requiere_rol(*STAFF_INTERNO)`, el cuerpo del handler `listar_usuarios` aplica una validación adicional (`L84`):
> `if usuario_actual.rol_usuario != "admin" and rol_usuario != "encargado_logistico": raise HTTPException(status_code=403, ...)`
> En consecuencia, `admin` puede listar usuarios con o sin filtro `rol_usuario`, mientras que `encargado_facturacion` y `encargado_logistico` solo pueden invocar este endpoint cuando pasan explícitamente el query param `?rol_usuario=encargado_logistico`.

### 4.3 Clientes (`/api/sga/clientes` — `sga_backend_jwt/app/routes/cliente_routes.py`)

| Método | Ruta relativa al prefijo `/api/sga` | Acceso | Descripción |
|---|---|---|---|
| POST | `/clientes` | `ADMIN_O_FACTURACION` | Crear cliente (`rol_usuario='cliente'` forzado en controlador) |
| GET | `/clientes` | `STAFF_INTERNO` | Listar clientes (con búsqueda opcional) |
| GET | `/clientes/{id_usuario}` | `STAFF_INTERNO` | Obtener cliente por ID |
| PATCH | `/clientes/{id_usuario}` | `ADMIN_O_FACTURACION` | Editar cliente |
| PATCH | `/clientes/{id_usuario}/estado` | `ADMIN_O_FACTURACION` | Cambiar estado (`estado_registro`) del cliente |

### 4.4 Productos (`/api/sga/productos` — `sga_backend_jwt/app/routes/producto_routes.py`)

| Método | Ruta relativa al prefijo `/api/sga` | Acceso | Descripción |
|---|---|---|---|
| POST | `/productos` | `SOLO_ADMIN` | Crear producto |
| GET | `/productos` | `STAFF_INTERNO` | Listar productos |
| GET | `/productos/{id_producto}` | `STAFF_INTERNO` | Obtener producto por ID |
| PATCH | `/productos/{id_producto}` | `SOLO_ADMIN` | Editar producto |
| PATCH | `/productos/{id_producto}/estado` | `SOLO_ADMIN` | Cambiar estado (`estado_registro`) del producto |

### 4.5 Alquileres (`/api/sga/alquileres` — `sga_backend_jwt/app/routes/alquiler_routes.py`)

| Método | Ruta relativa al prefijo `/api/sga` | Acceso | Descripción |
|---|---|---|---|
| GET | `/alquileres/buscar` | `STAFF_INTERNO` | Buscar alquileres por cliente, barrio o número |
| GET | `/alquileres/proximos-vencer` | `STAFF_INTERNO` | Alquileres activos próximos a vencer |
| GET | `/alquileres/pendientes-entrega` | `STAFF_INTERNO` | Alquileres en estado `pendiente` |
| POST | `/alquileres` | `ADMIN_O_FACTURACION` | Crear contrato de alquiler con detalles anidados |
| GET | `/alquileres` | `STAFF_INTERNO` | Listar alquileres (filtros opcionales de estado y cliente) |
| GET | `/alquileres/{id_alquiler}` | `STAFF_INTERNO` | Obtener alquiler por ID con sus detalles |
| GET | `/alquileres/{id_alquiler}/detalles` | `STAFF_INTERNO` | Listar líneas de detalle del alquiler |
| PATCH | `/alquileres/{id_alquiler}` | `ADMIN_O_FACTURACION` | Editar campos permitidos según estado del alquiler |
| PATCH | `/alquileres/{id_alquiler}/estado` | `STAFF_INTERNO` | Cambiar estado del alquiler según grafo de transiciones |
| DELETE | `/alquileres/{id_alquiler}` | `ADMIN_O_FACTURACION` | Cancelar alquiler (transiciona `estado_alquiler` a `'cancelado'`) |
| GET | `/alquileres/{id_alquiler}/historial` | `ADMIN_O_FACTURACION` | Consultar historial de auditoría del alquiler en `auditoria_sistema` |
| POST | `/alquileres/{id_alquiler}/renovaciones` | `ADMIN_O_FACTURACION` | Registrar renovación (suma días a `tiempo_alquiler_dias`) |
| POST | `/alquileres/{id_alquiler}/entregas` | `STAFF_INTERNO` | Registrar entrega en `logistica_alquiler` y tabla puente |
| GET | `/alquileres/{id_alquiler}/entregas` | `STAFF_INTERNO` | Consultar entregas asociadas al alquiler |
| POST | `/alquileres/{id_alquiler}/recogidas` | `STAFF_INTERNO` | Registrar recogida en `logistica_alquiler` y tabla puente |
| GET | `/alquileres/{id_alquiler}/recogidas` | `STAFF_INTERNO` | Consultar recogidas asociadas al alquiler |

### 4.6 Detalle de alquiler (`/api/sga/detalle-alquiler` — `sga_backend_jwt/app/routes/detalle_alquiler_routes.py`)

| Método | Ruta relativa al prefijo `/api/sga` | Acceso | Descripción |
|---|---|---|---|
| POST | `/detalle-alquiler` | `ADMIN_O_FACTURACION` | Agregar línea de detalle a un alquiler en estado editable |
| GET | `/detalle-alquiler/{id_detalle_alquiler}` | `STAFF_INTERNO` | Obtener línea de detalle por ID |
| PATCH | `/detalle-alquiler/{id_detalle_alquiler}` | `ADMIN_O_FACTURACION` | Editar línea de detalle existente |

### 4.7 Gastos (`/api/sga/gastos` — `sga_backend_jwt/app/routes/gastos_routes.py`)

| Método | Ruta relativa al prefijo `/api/sga` | Acceso | Descripción |
|---|---|---|---|
| POST | `/gastos` | `STAFF_INTERNO` | Registrar gasto logístico (`tipo_movimiento='GASTO'`) |
| GET | `/gastos` | `STAFF_INTERNO` | Listar gastos logísticos (con filtro opcional por alquiler) |
| GET | `/gastos/resumen-semanal` | `ADMIN_O_FACTURACION` | Resumen semanal agrupado de gastos |

### 4.8 Formato de respuesta estándar

Todas las respuestas del backend utilizan el sobre definido en `sga_backend_jwt/app/utils/response.py`:

```json
{
  "status": true,
  "mensaje": "Descripción de la operación",
  "data": { "..." : "..." },
  "error": null,
  "code": 200
}
```

---

## 5. Persistencia y estructura de datos

### 5.1 Tablas físicas (verificado en `database/01_esquema/01_tablas.sql` y `sga_backend_jwt/alembic/versions/0001_initial_schema.py`)

| Tabla | Clave primaria (PK) | Descripción y estructura verificada |
|---|---|---|
| `usuario` | `id_usuario` `VARCHAR(20)` — PK natural (documento de identidad) | Usuarios y clientes (`01_tablas.sql:21-58`, `0001_initial_schema.py:32-56`); `CHECK` sobre `rol_usuario` y `tipo_documento` |
| `producto` | `id_producto` `SERIAL` (autoincremental) | Inventario de andamios y piezas (`01_tablas.sql:65-101`, `0001_initial_schema.py:69-94`); control de `stock_total`, `stock_alquilado` y `unidad_minima_alquiler` |
| `alquiler` | `id_alquiler` `SERIAL` (autoincremental) | Contratos de alquiler (`01_tablas.sql:108-154`, `0001_initial_schema.py:103-136`); FKs hacia `usuario` (creador y cliente) |
| `detalle_alquiler` | `id_detalle_alquiler` `SERIAL` (autoincremental) | Líneas de producto por alquiler (`01_tablas.sql:161-197`, `0001_initial_schema.py:153-175`); FKs hacia `alquiler` y `producto` |
| `logistica_alquiler` | `id_logistica_alquiler` `SERIAL` (autoincremental) | Movimientos logísticos `ENTREGA`, `RECOGIDA` y `GASTO` (`01_tablas.sql:212-238`, `0001_initial_schema.py:189-214`); FK hacia `usuario` |
| `logistica_alquiler_alquiler` | **`PRIMARY KEY (id_logistica_alquiler, id_alquiler)` — PK compuesta** | Tabla puente de asociación entre `logistica_alquiler` y `alquiler` (`01_tablas.sql:248-265`, `0001_initial_schema.py:220-233`, `models/logistica_alquiler_alquiler.py:17-34`) |
| `auditoria_sistema` | `id_auditoria` `SERIAL` (autoincremental) | Registro centralizado de eventos `INSERT`, `UPDATE` y `DELETE` poblado por triggers (`01_tablas.sql:274-287`, `0001_initial_schema.py:240-255`) |

**Total tablas físicas: 7**

> **Estructura específica de la tabla puente `logistica_alquiler_alquiler` (verificado en `database/01_esquema/01_tablas.sql:248-267`, `sga_backend_jwt/alembic/versions/0001_initial_schema.py:220-234` y `sga_backend_jwt/app/models/logistica_alquiler_alquiler.py:17-34`):**
> A diferencia de las demás tablas del esquema, `logistica_alquiler_alquiler` no posee una columna surrogate `SERIAL` ni columnas de control operativo (`estado_registro`, `fecha_creacion`, `fecha_actualizacion`). Está compuesta exclusivamente por dos columnas enteras no nulas que conforman su **clave primaria compuesta**:
> - `id_logistica_alquiler` (`INTEGER NOT NULL`, `primary_key=True`), con clave foránea hacia `logistica_alquiler(id_logistica_alquiler)` configurada con `ON UPDATE CASCADE ON DELETE CASCADE`.
> - `id_alquiler` (`INTEGER NOT NULL`, `primary_key=True`), con clave foránea hacia `alquiler(id_alquiler)` configurada con `ON UPDATE CASCADE ON DELETE RESTRICT`.
> - Define además el índice `idx_logalq_alquiler` sobre la columna `id_alquiler` para optimizar los `JOIN` al filtrar movimientos logísticos por contrato de alquiler.

### 5.2 Lo que crea la revisión actual de Alembic

> [!IMPORTANT]
> Esta distinción es indispensable para comprender qué objetos existen cuando una base de datos se inicializa únicamente mediante `alembic upgrade head` (como ocurre en el arranque automático de `sga_backend_jwt/entrypoint.sh:44`).

La revisión actual `0001_initial_schema` (único archivo en `sga_backend_jwt/alembic/versions/0001_initial_schema.py`) ejecuta exclusivamente sentencias `op.create_table` y `op.create_index`:

| Tipo de objeto | Cantidad | Creado por `alembic upgrade head` (`0001_initial_schema.py`) | Fuente en repositorio |
|---|---:|---|---|
| Tablas físicas | 7 | **Sí** | `0001_initial_schema.py:32-255` y `01_tablas.sql` |
| Restricciones de clave primaria (PK) | 7 (6 simples + 1 compuesta) | **Sí** | `0001_initial_schema.py` (`sa.PrimaryKeyConstraint`) |
| Claves foráneas (FK) | 7 | **Sí** | `0001_initial_schema.py` (`sa.ForeignKeyConstraint`) |
| Restricciones `UNIQUE` y `CHECK` de tabla | 2 `UniqueConstraint` + 16 `CheckConstraint` | **Sí** | `0001_initial_schema.py` (`sa.UniqueConstraint` en `L46-47`; `sa.CheckConstraint`) |
| Índices (`op.create_index`) | **16** (15 índices estándar + 1 índice único parcial) | **Sí** | `0001_initial_schema.py:57-261` y `01_tablas.sql:267-398` |
| Funciones PL/pgSQL | 12 | **No** | `database/01_esquema/02_funciones_y_triggers.sql` |
| Triggers | 19 | **No** | `database/01_esquema/02_funciones_y_triggers.sql` |
| Vista (`vw_dashboard_operativo`) | 1 | **No** | `database/01_esquema/06_vistas_dashboard.sql` |

> **Aclaración sobre restricciones de unicidad e índices únicos (`0001_initial_schema.py` y `01_tablas.sql`):**
> - Existen **dos restricciones `UniqueConstraint` de tabla**, ambas definidas sobre la tabla `usuario`: `email_usuario` y `telefono_usuario` (`0001_initial_schema.py:46-47`, `01_tablas.sql:29-30`).
> - Adicionalmente, existe el **índice único parcial `idx_unico_producto_alquiler`** sobre `detalle_alquiler (id_alquiler, id_producto) WHERE es_producto_extra = false` (`0001_initial_schema.py:178-184`, `01_tablas.sql:316-318`), el cual se implementa mediante `op.create_index(..., unique=True, postgresql_where=...)` y **queda contabilizado dentro de los 16 índices** creados por la revisión actual de Alembic.

Los archivos SQL de `database/01_esquema/` **no forman parte del contexto de construcción Docker** del servicio `backend` (`./sga_backend_jwt`) ni están montados como volúmenes en el servicio `postgres` (`docker-compose.yml:20-48`), y **no son ejecutados por `sga_backend_jwt/entrypoint.sh`**.

### 5.3 Estado en el entorno desplegado (declarado por el propietario) y objetivo arquitectónico futuro

Respecto a la base de datos desplegada en producción, el propietario ha realizado las siguientes declaraciones y decisiones operativas:

1. **`alembic upgrade head`:** ejecutado manualmente en la base de datos de producción (creando las 7 tablas, restricciones y 16 índices definidos en `0001_initial_schema.py`).
2. **`database/01_esquema/02_funciones_y_triggers.sql`:** ejecutado manualmente en la base de datos de producción (instalando las 12 funciones PL/pgSQL y los 19 triggers).
3. **`database/01_esquema/06_vistas_dashboard.sql`:** ejecutado manualmente en la base de datos de producción con posterioridad a la auditoría inicial.
4. **Decisión del propietario sobre reconstrucción de la base de datos de producción:** el propietario confirmó expresamente que la base de datos de producción puede eliminarse y reconstruirse desde cero, sin que se conserven los datos existentes. Esta afirmación registra una **declaración y decisión del propietario** sobre la política de despliegue, y no una prueba técnica de reconstrucción ya ejecutada ni verificada mediante acceso a producción.

> Según declaración del propietario, el script `06_vistas_dashboard.sql` fue ejecutado manualmente en la base de datos de producción. Esta información corresponde a una declaración operativa del propietario y no a una comprobación independiente del estado actual de la base de datos.

**Distinción obligatoria de niveles de evidencia sobre la base de datos:**
- **Definición en el repositorio (verificado en código):** las 7 tablas, 16 índices, 12 funciones PL/pgSQL, 19 triggers y 1 vista están definidos en los archivos versionados de `sga_backend_jwt/alembic/versions/0001_initial_schema.py` y `database/01_esquema/`.
- **Ejecución manual y decisión de reconstrucción en producción (declarado por el propietario):** la aplicación manual de `alembic upgrade head`, `02_funciones_y_triggers.sql` y `06_vistas_dashboard.sql` en el entorno productivo, así como la autorización para reconstruir la base de datos de producción desde cero sin conservar datos, constan por declaración del propietario (sin que se asuma la ejecución manual de `01_tablas.sql`).
- **Verificación independiente en producción (no realizada):** no se ha efectuado una inspección ni conexión directa a la base de datos desplegada para comprobar en runtime los objetos instalados ni se ha ejecutado aún una prueba técnica de reconstrucción.

> **Objetivo arquitectónico futuro (pendiente de implementación):**
> La ejecución manual de scripts SQL externos es una medida operativa transitoria y no constituye la solución arquitectónica definitiva. El objetivo confirmado por el propietario es incorporar todos los objetos de base de datos necesarios (tablas, restricciones, índices, funciones PL/pgSQL, triggers y vistas) dentro de una estrategia versionada de migraciones Alembic, de modo que una instalación limpia pueda reconstruir integralmente la base de datos desde cero mediante `alembic upgrade head` sin depender de ejecuciones manuales de scripts SQL. Esta nueva revisión integral de Alembic está **pendiente de implementación** y se ejecutará en una tarea posterior tras una auditoría específica de OpenCode.

> **Alerta sobre `alembic stamp head` (`DXA-41`):**
> El comando `alembic stamp head` (mencionado en `sga_backend_jwt/README.md:96`) únicamente escribe el identificador de revisión en la tabla `alembic_version` sin ejecutar ninguna sentencia DDL. No debe utilizarse en una base de datos vacía ni como sustituto para crear tablas u objetos SQL faltantes (ver §12).

---

## 6. Funciones PL/pgSQL, triggers y vista

> Todos los objetos descritos en esta sección están definidos en `database/01_esquema/02_funciones_y_triggers.sql` y `database/01_esquema/06_vistas_dashboard.sql`.
> Actualmente **no son creados por `alembic upgrade head`** (`0001_initial_schema.py`); su instalación en una base de datos depende de la ejecución de dichos scripts SQL hasta que se implemente la futura migración integral de Alembic (ver §5.2 y §5.3).

### 6.1 Funciones PL/pgSQL (12 en total — `database/01_esquema/02_funciones_y_triggers.sql`)

| Función | Líneas | Propósito implementado en código |
|---|---|---|
| `fn_auditar_cambios()` | `L14-77` | Función trigger de auditoría centralizada: registra `INSERT`, `UPDATE` y `DELETE` en `auditoria_sistema` leyendo `NULLIF(current_setting('app.usuario_actual', true), '')` (`L31`) |
| `fn_actualizar_timestamp()` | `L105-111` | Actualiza `NEW.fecha_actualizacion = CURRENT_TIMESTAMP` en cada `BEFORE UPDATE` |
| `fn_impedir_autodesactivacion_admin()` | `L139-154` | Intenta impedir que un `admin` cambie su propio `estado_registro` a `FALSE`; **consulta `current_setting('app.current_user_id', true)` en `L145` en lugar de `app.usuario_actual`** (ver discrepancia en §7.3.b) |
| `fn_garantizar_minimo_un_admin()` | `L160-180` | Verifica que quede al menos un `admin` con `estado_registro = TRUE`; aunque su código incluye `TG_OP = 'DELETE' OR NEW.estado_registro = FALSE` (`L166`), **su trigger solo se activa en `BEFORE UPDATE OF estado_registro`** (ver nota en §6.2) |
| `fn_validar_modificacion_producto()` | `L192-213` | Impide dar de baja (`DELETE` o `estado_registro = FALSE`) productos con `stock_alquilado > 0`, e impide que `stock_total < stock_alquilado` |
| `fn_validar_detalle_alquiler()` | `L219-258` | Bloquea cambios de ítems en alquileres cerrados (`terminado`, `recogido`, `cancelado`), impide cambiar `id_producto` en `UPDATE` y valida stock disponible |
| `fn_sincronizar_stock_producto()` | `L264-302` | Incrementa, ajusta o descuenta `producto.stock_alquilado` al insertar, actualizar o eliminar filas en `detalle_alquiler` |
| `fn_verificar_usuario_activo()` | `L314-331` | Verifica que `NEW.id_usuario_creador` tenga `estado_registro = TRUE` en `usuario` antes de insertar o actualizar un `alquiler` |
| `fn_validar_fechas_alquiler()` | `L337-346` | Impide insertar un alquiler con `NEW.fecha_inicio < CURRENT_DATE` |
| `fn_cerrar_alquiler_devolver_stock()` | `L352-368` | Cuando `estado_alquiler` pasa a `'terminado'`, `'recogido'` o `'cancelado'`, descuenta de `producto.stock_alquilado` las cantidades activas de `detalle_alquiler` |
| `fn_prohibir_reabrir_alquiler()` | `L374-391` | Impide cambiar `estado_alquiler` desde `'terminado'`, `'recogido'` o `'cancelado'` hacia otro estado salvo que `current_setting('app.permitir_reapertura', true) = 'true'` |
| `fn_admin_reabrir_alquiler(p_id_alquiler)` | `L402-455` | Función administrativa (no trigger) para reabrir un alquiler `'terminado'` o `'recogido'` a `'activo'` validando stock, activando `app.permitir_reapertura = 'true'` y re-descontando stock |

> **Nota sobre `fn_admin_reabrir_alquiler(p_id_alquiler)` (`02_funciones_y_triggers.sql:402-455`):**
> Esta función está definida en el script SQL, pero la inspección estática de todo el código Python bajo `sga_backend_jwt/app/` confirmó que **no existe ningún endpoint, ruta ni controlador que la invoque**. Su uso desde la aplicación no está implementado actualmente.

### 6.2 Triggers (19 en total — `database/01_esquema/02_funciones_y_triggers.sql`)

| Trigger | Líneas | Tabla | Evento exacto declarado | Función invocada |
|---|---|---|---|---|
| `trg_auditoria_usuario` | `L79-81` | `usuario` | `AFTER INSERT OR UPDATE OR DELETE` | `fn_auditar_cambios()` |
| `trg_auditoria_producto` | `L83-85` | `producto` | `AFTER INSERT OR UPDATE OR DELETE` | `fn_auditar_cambios()` |
| `trg_auditoria_alquiler` | `L87-89` | `alquiler` | `AFTER INSERT OR UPDATE OR DELETE` | `fn_auditar_cambios()` |
| `trg_auditoria_detalle` | `L91-93` | `detalle_alquiler` | `AFTER INSERT OR UPDATE OR DELETE` | `fn_auditar_cambios()` |
| `trg_auditoria_logistica` | `L95-97` | `logistica_alquiler` | `AFTER INSERT OR UPDATE OR DELETE` | `fn_auditar_cambios()` |
| `trg_timestamp_usuario` | `L113-115` | `usuario` | `BEFORE UPDATE` | `fn_actualizar_timestamp()` |
| `trg_timestamp_producto` | `L117-119` | `producto` | `BEFORE UPDATE` | `fn_actualizar_timestamp()` |
| `trg_timestamp_alquiler` | `L121-123` | `alquiler` | `BEFORE UPDATE` | `fn_actualizar_timestamp()` |
| `trg_timestamp_detalle` | `L125-127` | `detalle_alquiler` | `BEFORE UPDATE` | `fn_actualizar_timestamp()` |
| `trg_timestamp_logistica` | `L129-131` | `logistica_alquiler` | `BEFORE UPDATE` | `fn_actualizar_timestamp()` |
| `trg_impedir_autodesactivacion_admin` | `L156-158` | `usuario` | `BEFORE UPDATE OF estado_registro` | `fn_impedir_autodesactivacion_admin()` |
| `trg_garantizar_minimo_un_admin` | `L182-184` | `usuario` | `BEFORE UPDATE OF estado_registro` | `fn_garantizar_minimo_un_admin()` |
| `trg_validar_modificacion_producto` | `L215-217` | `producto` | `BEFORE UPDATE OR DELETE` | `fn_validar_modificacion_producto()` |
| `trg_validar_detalle_alquiler` | `L260-262` | `detalle_alquiler` | `BEFORE INSERT OR UPDATE` | `fn_validar_detalle_alquiler()` |
| `trg_sincronizar_stock_producto` | `L304-306` | `detalle_alquiler` | `AFTER INSERT OR UPDATE OR DELETE` | `fn_sincronizar_stock_producto()` |
| `trg_verificar_usuario_activo_alquiler` | `L333-335` | `alquiler` | `BEFORE INSERT OR UPDATE` | `fn_verificar_usuario_activo()` |
| `trg_validar_fecha_inicio` | `L348-350` | `alquiler` | `BEFORE INSERT` | `fn_validar_fechas_alquiler()` |
| `trg_cerrar_alquiler_devolver_stock` | `L370-372` | `alquiler` | `AFTER UPDATE` | `fn_cerrar_alquiler_devolver_stock()` |
| `trg_prohibir_reabrir_alquiler` | `L393-395` | `alquiler` | `BEFORE UPDATE OF estado_alquiler` | `fn_prohibir_reabrir_alquiler()` |

> **Alcance implementado del trigger `trg_garantizar_minimo_un_admin` (`database/01_esquema/02_funciones_y_triggers.sql:160-184`):**
> El trigger `trg_garantizar_minimo_un_admin` (`L182-184`) está definido exclusivamente con la cláusula `BEFORE UPDATE OF estado_registro ON usuario`. Aunque la función asociada `fn_garantizar_minimo_un_admin()` (`L160-180`) incluye en la línea 166 la condición `IF OLD.rol_usuario = 'admin' AND (TG_OP = 'DELETE' OR NEW.estado_registro = FALSE) THEN`, **su rama de protección para operaciones `DELETE` no se ejecuta**, dado que el trigger no está registrado para el evento `DELETE`. Debe distinguirse este comportamiento implementado (que actúa únicamente ante la desactivación lógica mediante `UPDATE` de `estado_registro`) de cualquier protección frente a borrado físico (`DELETE`) que pudiera esperarse funcionalmente.

### 6.3 Vista operativa (1 — `database/01_esquema/06_vistas_dashboard.sql`)

| Vista | Archivo y líneas | Propósito verificado en SQL |
|---|---|---|
| `vw_dashboard_operativo` | `database/01_esquema/06_vistas_dashboard.sql:12-38` | Calcula métricas agregadas sobre registros con `estado_registro = TRUE`: `contratos_activos`, `contratos_pendientes`, `contratos_vencidos`, `stock_total_inventario`, `stock_en_obra` y `stock_bodega` |

**Estado de la vista según nivel de evidencia:**
- **Definición en el repositorio (verificado en código):** la vista `vw_dashboard_operativo` está definida en `database/01_esquema/06_vistas_dashboard.sql:12-38` y no está incluida en la migración `0001_initial_schema.py`.
- **Estado en la base de datos de producción (declarado por el propietario):** Según declaración del propietario, el script `06_vistas_dashboard.sql` fue ejecutado manualmente en la base de datos de producción. Esta información corresponde a una declaración operativa del propietario y no a una comprobación independiente del estado actual de la base de datos.

---

## 7. Flujo de auditoría y sus limitaciones

### 7.1 Mecanismo — `audit_context.py` y `fn_auditar_cambios()`

#### Capa de backend: `set_audit_context()`

Archivo: `sga_backend_jwt/app/utils/audit_context.py:33-38`

```python
def set_audit_context(db: Session, id_usuario: str) -> None:

    db.execute(
        text("SET LOCAL app.usuario_actual = :uid"),
        {"uid": id_usuario}
    )
```

- Ejecuta `SET LOCAL app.usuario_actual = :uid` sobre la sesión SQLAlchemy antes de las escrituras que la invocan.
- Por la semántica de `SET LOCAL` en PostgreSQL, el valor solo persiste durante la transacción activa y se descarta automáticamente al ejecutar `COMMIT` o `ROLLBACK`, evitando que la identidad de un usuario se filtre hacia otra petición que reutilice la conexión del pool.

#### Capa de base de datos: `fn_auditar_cambios()`

Archivo: `database/01_esquema/02_funciones_y_triggers.sql:14-77`

- Invocada por los 5 triggers `trg_auditoria_*` (`L79-97`) en eventos `AFTER INSERT OR UPDATE OR DELETE` sobre las tablas `usuario`, `producto`, `alquiler`, `detalle_alquiler` y `logistica_alquiler`.
- En la línea 31 obtiene el usuario mediante `v_usuario_accion := NULLIF(current_setting('app.usuario_actual', true), '');`.
- Inserta una fila en `auditoria_sistema` (`L59-73`) con `nombre_tabla` (`TG_TABLE_NAME`), `tipo_operacion` (`TG_OP`), `id_registro_afectado`, `datos_anteriores` (`to_jsonb(OLD)`), `datos_nuevos` (`to_jsonb(NEW)`) e `id_usuario_accion` (`v_usuario_accion`).

### 7.2 Operaciones de controlador que invocan `set_audit_context()` (verificado en código)

La inspección estática de `sga_backend_jwt/app/controllers/*.py` confirma las siguientes 18 llamadas a `set_audit_context(db, usuario_actual.id_usuario)`:

| Controlador | Funciones y líneas exactas donde se invoca `set_audit_context()` |
|---|---|
| `alquiler_controller.py` | `crear_alquiler` (`L136`), `actualizar_alquiler` (`L321`), `cambiar_estado_alquiler` (`L360`; invocada también por `cancelar_alquiler` en `L375`), `renovar_alquiler` (`L530`), `registrar_entrega` (`L573`), `registrar_recogida` (`L682`) |
| `cliente_controller.py` | `crear_cliente` (`L33`), `actualizar_cliente` (`L117`), `cambiar_estado_cliente` (`L147`) |
| `detalle_alquiler_controller.py` | `crear_detalle_alquiler` (`L111`), `actualizar_detalle_alquiler` (`L180`) |
| `logistica_alquiler_controller.py` | `crear_gasto` (`L22`) |
| `producto_controller.py` | `crear_producto` (`L13`), `actualizar_producto` (`L67`), `cambiar_estado_producto` (`L99`) |
| `usuario_controller.py` | `crear_usuario` (`L30`), `actualizar_usuario` (`L128`), `cambiar_estado_usuario` (`L161`) |

### 7.3 Limitaciones y discrepancias verificadas del sistema de auditoría

> [!WARNING]
> **No todas las escrituras del sistema establecen contexto de auditoría ni todas las tablas poseen trigger de auditoría.** Asimismo, el análisis estático identificó una discrepancia en el nombre de la variable de sesión utilizada por el trigger de protección de autodesactivación de administrador.

#### a) Escrituras que no establecen contexto de auditoría (`verificar_y_actualizar_vencidos` y `_job_actualizar_vencidos`)

1. **`verificar_y_actualizar_vencidos(db: Session) -> int` (`sga_backend_jwt/app/controllers/alquiler_controller.py:96-108`):**
   Ejecuta `UPDATE alquiler SET estado_alquiler = 'vencido' WHERE estado_alquiler = 'activo' AND (fecha_inicio + tiempo_alquiler_dias - 1) < CURRENT_DATE` (`L98-105`) y confirma su propia transacción mediante `db.commit()` (`L106`) **sin invocar `set_audit_context()`**.
   Esta función auxiliar es llamada al inicio de seis operaciones de escritura en `sga_backend_jwt/app/controllers/alquiler_controller.py`, **antes** de la llamada a `set_audit_context()` de cada operación principal:
   - `crear_alquiler` (`L117`, antes de `set_audit_context` en `L136`)
   - `actualizar_alquiler` (`L245`, antes de `set_audit_context` en `L321`)
   - `cambiar_estado_alquiler` (`L340`, antes de `set_audit_context` en `L360`; también alcanzada desde `cancelar_alquiler` en `L375`)
   - `renovar_alquiler` (`L502`, antes de `set_audit_context` en `L530`)
   - `registrar_entrega` (`L559`, antes de `set_audit_context` en `L573`)
   - `registrar_recogida` (`L647`, antes de `set_audit_context` en `L682`)

   **Aclaración sobre el alcance de esta limitación (análisis estático, no probado en producción):**
   - La función auxiliar `verificar_y_actualizar_vencidos(db)` ejecuta su propia actualización de reconciliación y confirma la transacción (`db.commit()` en `L106`) antes de que el controlador establezca el contexto de auditoría.
   - Únicamente esa actualización preliminar de reconciliación (sobre alquileres cuyo vencimiento ya pasó) puede quedar registrada en `auditoria_sistema` con `id_usuario_accion = NULL`.
   - Las escrituras principales posteriores de los seis controladores (`crear_alquiler`, `actualizar_alquiler`, `cambiar_estado_alquiler`, `renovar_alquiler`, `registrar_entrega` y `registrar_recogida`) **sí establecen el contexto de auditoría** mediante `set_audit_context(db, usuario_actual.id_usuario)` antes de ejecutar y confirmar su propia transacción de negocio (ver tabla en §7.2).

2. **Job programado `_job_actualizar_vencidos()` (`sga_backend_jwt/app/utils/scheduler.py:22-41`):**
   Abre una sesión propia con `SessionLocal()`, ejecuta el `UPDATE` de transición `activo → vencido` (`L27-33`) y hace `db.commit()` (`L34`) sin establecer `set_audit_context()`. Todo cambio de estado disparado por el scheduler diario queda registrado en `auditoria_sistema` con `id_usuario_accion = NULL`.

3. **Función auxiliar deprecada `_recalcular_precio_alquiler(db, id_alquiler)` (`sga_backend_jwt/app/controllers/detalle_alquiler_controller.py:43-71`):**
   Contiene un `UPDATE alquiler SET precio_alquiler = :precio ...` sin `set_audit_context()`, aunque actualmente no es invocada desde ninguna ruta ni controlador activo.

#### b) Discrepancia entre variables de sesión: `app.usuario_actual` vs `app.current_user_id`

- El backend establece exclusivamente la variable de configuración `app.usuario_actual` mediante `set_audit_context()` en `sga_backend_jwt/app/utils/audit_context.py:33-38` (`SET LOCAL app.usuario_actual = :uid` en `L36`), la cual coincide con la variable leída por `fn_auditar_cambios()` en `database/01_esquema/02_funciones_y_triggers.sql:31`.
- Sin embargo, la función `fn_impedir_autodesactivacion_admin()` (`database/01_esquema/02_funciones_y_triggers.sql:139-154`), ejecutada por el trigger `trg_impedir_autodesactivacion_admin` (`L156-158`) en `BEFORE UPDATE OF estado_registro ON usuario`, consulta una variable con nombre distinto en la línea 145:
  ```sql
  v_usuario_actual := current_setting('app.current_user_id', true);
  ```
- La búsqueda estática en todo el repositorio confirma que ningún módulo del backend establece `app.current_user_id`. Según el análisis estático, al no poblarse `app.current_user_id`, `v_usuario_actual` resulta `NULL` (o cadena vacía) y la comparación `OLD.id_usuario = v_usuario_actual` (`02_funciones_y_triggers.sql:148`) no se cumple, lo que **puede dejar inoperante la protección que impide que un administrador desactive su propia cuenta**.
- **Alcance de la evidencia:** esta discrepancia está verificada por inspección estática del código; **no se ha ejecutado ni probado su comportamiento en la base de datos de producción**.

#### c) Tabla puente `logistica_alquiler_alquiler` sin trigger de auditoría

- En `database/01_esquema/02_funciones_y_triggers.sql:79-97` solo se crean triggers de auditoría (`trg_auditoria_*`) para cinco tablas (`usuario`, `producto`, `alquiler`, `detalle_alquiler` y `logistica_alquiler`), y la sentencia `CASE TG_TABLE_NAME` dentro de `fn_auditar_cambios()` (`L35-52`) solo contempla esas cinco tablas.
- La tabla puente `logistica_alquiler_alquiler` no posee trigger de auditoría, por lo que las inserciones o eliminaciones sobre dicha tabla no generan filas propias en `auditoria_sistema`.

#### d) Dependencia de la instalación de `02_funciones_y_triggers.sql`

- Dado que `0001_initial_schema.py` crea la tabla `auditoria_sistema` pero no crea `fn_auditar_cambios()` ni los 5 triggers `trg_auditoria_*`, en cualquier entorno inicializado únicamente con `alembic upgrade head` (sin ejecutar `02_funciones_y_triggers.sql`) las operaciones de escritura no insertan registros en `auditoria_sistema` (ver §5.2 y §5.3).

### 7.4 Tabla `auditoria_sistema` (`database/01_esquema/01_tablas.sql:274-287`)

| Columna | Tipo | Descripción |
|---|---|---|
| `id_auditoria` | `SERIAL PRIMARY KEY` | Identificador autoincremental del evento de auditoría |
| `nombre_tabla` | `VARCHAR(50) NOT NULL` | Nombre de la tabla auditada (`TG_TABLE_NAME`) |
| `tipo_operacion` | `VARCHAR(10) NOT NULL` | `'INSERT'`, `'UPDATE'` o `'DELETE'` (`chk_auditoria_operacion`) |
| `id_registro_afectado` | `VARCHAR(50) NOT NULL` | Clave primaria del registro afectado convertida a texto |
| `datos_anteriores` | `JSONB` | Estado previo del registro (`NULL` en `INSERT`) |
| `datos_nuevos` | `JSONB` | Estado posterior del registro (`NULL` en `DELETE`) |
| `id_usuario_accion` | `VARCHAR(20)` | Valor de `app.usuario_actual`; `NULL` cuando la escritura no estableció contexto de auditoría |
| `fecha_accion` | `TIMESTAMP NOT NULL` | Marca temporal del evento (`DEFAULT CURRENT_TIMESTAMP`) |

---

## 8. Servicios de Docker Compose

> Verificado en `docker-compose.yml`.

### 8.1 Servicios

| Servicio | Contenedor | Imagen / Build | Puerto expuesto (host:contenedor) | Rol |
|---|---|---|---|---|
| `postgres` | `sga_postgres` | `postgres:16-alpine` | `5432:5432` | Base de datos PostgreSQL 16 con volumen persistente |
| `backend` | `sga_backend` | Build desde `./sga_backend_jwt/Dockerfile` | `8000:8000` | API FastAPI + Uvicorn (`entrypoint.sh`: `alembic upgrade head` + `uvicorn --workers 2`) |
| `frontend` | `sga_frontend` | Build desde `./sga_frontend_jwt/Dockerfile` | `80:80` | Build estático de React servido por Nginx con reverse proxy `/api/` |

> **Separación entre topología Docker Compose y despliegue declarado (Vercel + Render):**
> - **En Docker Compose (verificado en repositorio):** interviene Nginx dentro del contenedor `sga_frontend` (`sga_frontend_jwt/nginx.conf`). Nginx sirve los archivos estáticos de React en el puerto 80 y redirige internamente cualquier petición a `/api/` hacia `http://backend:8000` (`nginx.conf:44-57`).
> - **En el despliegue declarado por el propietario (Vercel + Render — no verificado en producción):** el frontend se aloja en Vercel (`sga_frontend_jwt/vercel.json`) y el backend junto con PostgreSQL en Render. En esa topología **no se ha verificado que Nginx intervenga**: Vercel sirve el build estático de la SPA y el navegador realiza peticiones HTTP directas al backend según la URL configurada en `VITE_API_URL`.

### 8.2 Red, volúmenes y healthchecks (`docker-compose.yml`)

- **Red interna:** `sga_network` (`driver: bridge`, `L118-121`).
- **Volumen persistente:** `postgres_data` (nombre externo `sga_postgres_data`, montado en `/var/lib/postgresql/data`, `L30-32,112-114`).
- **Orden de arranque y dependencias:**
  - `backend` depende de `postgres` con `condition: service_healthy` (`L67-69`). Además, `sga_backend_jwt/entrypoint.sh:15-38` ejecuta un bucle de espera activa con `psycopg2.connect()` antes de correr `alembic upgrade head`.
  - `frontend` depende de `backend` con `condition: service_healthy` (`L100-102`).
- **Healthchecks:**
  - `postgres` (`L38-43`): `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}`
  - `backend` (`L79-84`): `curl -f http://localhost:8000/docs || exit 1`

### 8.3 Variables de entorno en Docker Compose (`docker-compose.yml:24-96`)

| Variable | Servicio que la consume | Propósito verificado |
|---|---|---|
| `POSTGRES_DB` | `postgres` | Nombre de la base de datos que inicializa el contenedor PostgreSQL |
| `POSTGRES_USER` | `postgres` | Usuario de la base de datos en el contenedor PostgreSQL |
| `POSTGRES_PASSWORD` | `postgres` | Contraseña del usuario en el contenedor PostgreSQL |
| `DATABASE_URL` | `backend` | Cadena completa de conexión SQLAlchemy (`sga_backend_jwt/app/config/database.py:5,8`) y espera activa en `entrypoint.sh:19`. **El backend consume `DATABASE_URL`; no consume directamente las variables `POSTGRES_*` del servicio `postgres`.** |
| `JWT_SECRET_KEY` | `backend` | Clave secreta para firma y verificación de tokens JWT |
| `JWT_ALGORITHM` | `backend` | Algoritmo de firma JWT (default en Compose: `HS256`) |
| `JWT_EXPIRE_MINUTES` | `backend` | Tiempo de vida del token en minutos (default en Compose: `480`) |
| `CORS_ORIGINS` | `backend` | Orígenes permitidos por `CORSMiddleware` |
| `VITE_API_URL` | `frontend` (build arg) | URL base de la API inyectada en tiempo de build estático (default en Compose: `/api/sga`) |

---

## 9. Modo de desarrollo local (sin Docker)

> Las instrucciones de esta sección reflejan los archivos de dependencias y configuración reales del repositorio (`requirements.txt`, `package.json`, `package-lock.json`, `vite.config.ts`).

### 9.1 Requisitos previos

- Python 3.11+ con entorno virtual (`venv`)
- Node.js y **npm** (el frontend utiliza `package-lock.json`)
- Instancia de PostgreSQL accesible

### 9.2 Backend (`sga_backend_jwt/`)

```sh
# Dentro de sga_backend_jwt/
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt

# Configurar archivo .env local (sin exponer secretos en control de versiones) con:
# DATABASE_URL, JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_MINUTES, CORS_ORIGINS

# Aplicar la migración actual de Alembic:
alembic upgrade head
```

> [!IMPORTANT]
> En el estado actual del repositorio, `alembic upgrade head` ejecuta `0001_initial_schema.py`, que crea únicamente las **7 tablas, sus restricciones (PK, FK, UNIQUE, CHECK) y los 16 índices**.
> No crea las **12 funciones PL/pgSQL**, los **19 triggers** (`database/01_esquema/02_funciones_y_triggers.sql`) ni la **vista `vw_dashboard_operativo`** (`database/01_esquema/06_vistas_dashboard.sql`). Hasta que se implemente la futura revisión integral de Alembic (ver §5.3), un entorno local que requiera dichos objetos necesita que los scripts SQL se apliquen por separado. No debe utilizarse `alembic stamp head` como sustituto.

```sh
# Iniciar el servidor de desarrollo FastAPI:
uvicorn app.main:app --reload --port 8000
```

### 9.3 Frontend (`sga_frontend_jwt/`)

```sh
# Dentro de sga_frontend_jwt/
npm install

# Configurar archivo .env local con la URL directa del backend, por ejemplo:
# VITE_API_URL=http://localhost:8000/api/sga
# (vite.config.ts solo registra el plugin de React y NO define proxy de desarrollo)

npm run dev
# Levanta el servidor de desarrollo Vite en http://localhost:5173
```

---

## 10. Configuración de despliegue identificada

### 10.1 Frontend — `sga_frontend_jwt/vercel.json`

El archivo `sga_frontend_jwt/vercel.json` existe en el repositorio y define una regla `rewrites` (`"source": "/(.*)", "destination": "/index.html"`) para que Vercel resuelva las rutas de React Router del lado del cliente. No configura proxy hacia el backend.

- **Existencia de `vercel.json`:** verificada en código.
- **Despliegue operativo en Vercel:** **declarado por el propietario** — no verificado de forma independiente en ejecución.

### 10.2 Backend y base de datos — Render

Según declaración del propietario, el backend FastAPI y la base de datos PostgreSQL se despliegan en **Render**. No existe en el repositorio un archivo `render.yaml` ni manifiesto equivalente de Render.

- **Despliegue en Render:** **declarado por el propietario** — no verificado de forma independiente en ejecución.
- **Inicialización de la base de datos desplegada:** según declaración del propietario, se ejecutaron manualmente `alembic upgrade head`, `02_funciones_y_triggers.sql` y `06_vistas_dashboard.sql` sobre la base de datos de producción (ver detalle y niveles de evidencia en §5.3).

### 10.3 URL de producción

No se documenta ninguna URL de producción en este mapa, dado que no existe en el repositorio una URL productiva verificada formalmente.

---

## 11. Diagramas históricos en `docs/architecture/`

> [!WARNING]
> Los archivos listados a continuación son **artefactos históricos** generados en una etapa previa de diseño del proyecto. **No representan el estado actual verificado del sistema** y se conservan únicamente como referencia histórica.

| Archivo | Tamaño exacto | Naturaleza |
|---|---:|---|
| `Diagrama_clases_SGA.png` | 97.189 bytes | Diagrama de clases — histórico |
| `Diagrama_dominio_SGA.drawio.png` | 84.038 bytes | Diagrama de dominio — histórico |
| `MER_SGA.drawio.png` | 204.674 bytes | Modelo entidad-relación — histórico |
| `Diccionario_Datos_SGA.docx` | 30.555 bytes | Diccionario de datos — histórico |

Para consultar la estructura de datos vigente y verificada en el repositorio, deben utilizarse como fuente `database/01_esquema/01_tablas.sql`, `sga_backend_jwt/alembic/versions/0001_initial_schema.py` y los modelos de `sga_backend_jwt/app/models/`.

Asimismo, el documento `docs/gestion_proyecto/04_diagnostico/DXC-2026-001_arquitectura.md` corresponde a un diagnóstico preliminar elaborado sobre una línea base anterior del repositorio; sus afirmaciones no deben presentarse como estado actual sin contrastarlas contra el código fuente vigente.

---

## 12. Hallazgos arquitectónicos y aspectos pendientes

### DXA-06 / I-001 — Exposición potencial del hash de contraseña en respuestas de API

- **Identificadores oficiales:** `I-001` (`EVD-2026-003:127`), `DXA-06` (`AUD-2026-007:31,43`).
- **Descripción:** En `sga_backend_jwt/app/routes/usuario_routes.py:96,115` las rutas `GET /api/sga/usuarios` y `GET /api/sga/usuarios/{id_usuario}` pasan instancias ORM de `Usuario` (`sga_backend_jwt/app/models/usuario.py`) a `response_success()`, cuyo serializador genérico `_orm_to_dict` (`sga_backend_jwt/app/utils/response.py:14-29`) vuelca las columnas del modelo sin lista blanca ni `response_model` que excluya `contrasena_usuario` (hash bcrypt).
- **Nivel de evidencia:** Verificado por análisis estático en `EVD-2026-003` (`I-001`, prioridad P0) y registrado como probable en `AUD-2026-007` (`DXA-06`); pendiente de confirmación mediante prueba en runtime.
- **Estado:** Abierto.

---

### I-004 — Puertos de PostgreSQL y backend publicados en `0.0.0.0` en Docker Compose

- **Identificador oficial:** `I-004` (`EVD-2026-003:130`, originado en `R-04`).
- **Descripción:** En `docker-compose.yml:47-48` (`"5432:5432"`) y `docker-compose.yml:76-77` (`"8000:8000"`), los puertos del contenedor de PostgreSQL y del backend FastAPI se publican sin prefijo `127.0.0.1:`, quedando expuestos en todas las interfaces de red del host (`0.0.0.0`), en contradicción con los comentarios de las líneas 45-46 y 74-75 que indican exposición solo local.
- **Nivel de evidencia:** Verificado por inspección estática de `docker-compose.yml`.
- **Estado:** Abierto (P0 en `EVD-2026-003`).

---

### DXA-12b — Inicialización incompleta de funciones, triggers y vista en el flujo automático de Alembic / Docker

- **Identificadores oficiales:** `DXA-12b` (`AUD-2026-007:32,58`), relacionado con `I-016` (`EVD-2026-003:297`).
- **Descripción verificada en repositorio:** `sga_backend_jwt/entrypoint.sh:44` ejecuta `alembic upgrade head`, que aplica `0001_initial_schema.py` (creando las 7 tablas, restricciones y 16 índices), pero no instala las 12 funciones PL/pgSQL, los 19 triggers (`database/01_esquema/02_funciones_y_triggers.sql`) ni la vista `vw_dashboard_operativo` (`database/01_esquema/06_vistas_dashboard.sql`).
- **Estado en la base de datos de producción (declarado por el propietario):** El propietario declaró haber ejecutado manualmente en la base de datos de producción `alembic upgrade head`, `02_funciones_y_triggers.sql` y, con posterioridad a la auditoría, `06_vistas_dashboard.sql`, y confirmó como decisión del propietario que la base de datos de producción puede reconstruirse desde cero sin conservar datos existentes. Esta información corresponde a declaraciones y decisiones operativas del propietario y no a una verificación independiente de la base de datos desplegada.
- **Objetivo arquitectónico futuro (pendiente de implementación):** Unificar en una estrategia versionada de Alembic la creación integral de tablas, restricciones, índices, funciones PL/pgSQL, triggers y vistas para permitir reconstruir la base de datos desde cero sin ejecuciones manuales de scripts SQL.
- **Estado:** Abierto en el repositorio hasta que se audite e implemente la migración integral de Alembic.

---

### DXA-41 — Contradicción documental entre `alembic stamp head` y `alembic upgrade head`

- **Identificador oficial:** `DXA-41` (`AUD-2026-007:33,77`), relacionado con `I-016` y `RM-DOC-009`.
- **Descripción:** `sga_backend_jwt/README.md:96` indica ejecutar `alembic stamp head` (que solo marca la versión sin crear tablas), mientras que `sga_backend_jwt/entrypoint.sh:44` ejecuta `alembic upgrade head` (que aplica la migración `0001_initial_schema.py`).
- **Nivel de evidencia:** Verificado por inspección estática.
- **Estado:** Abierto (pendiente de resolución dentro de la tarea `RM-DOC-009`).

---

### Aspectos adicionales identificados por análisis estático pendientes de verificación o corrección posterior

1. **Discrepancia de variable de sesión en `fn_impedir_autodesactivacion_admin()`:** `sga_backend_jwt/app/utils/audit_context.py:36` establece `app.usuario_actual`, mientras que `database/01_esquema/02_funciones_y_triggers.sql:145` lee `app.current_user_id` (ver §7.3.b). Pendiente de corrección técnica en código/SQL.
2. **Alcance del trigger `trg_garantizar_minimo_un_admin`:** declarado únicamente como `BEFORE UPDATE OF estado_registro ON usuario` (`02_funciones_y_triggers.sql:182-184`), por lo que la rama `TG_OP = 'DELETE'` de `fn_garantizar_minimo_un_admin()` (`L166`) no se ejecuta ante borrados físicos (ver §6.2).
3. **Escrituras de reconciliación sin `set_audit_context()`:** `verificar_y_actualizar_vencidos(db)` (`alquiler_controller.py:96-108`, invocada como paso preliminar en `L117,245,340,502,559,647` antes del `set_audit_context()` de cada escritura principal) y `_job_actualizar_vencidos()` (`scheduler.py:22-41`) actualizan alquileres vencidos sin poblar `app.usuario_actual` (ver §7.3.a).
4. **Constante residual `ADMIN_O_LOGISTICO`:** definida en `sga_backend_jwt/app/utils/roles.py:57` sin usos en el repositorio y fuera de la jerarquía oficial de tres roles (`admin > encargado_facturacion > encargado_logistico`). Su retiro corresponde a una intervención de código posterior (ver §3.4).
5. **Auditoría completa de autorización por endpoint:** pendiente contrastar cada una de las 38 operaciones REST bajo `/api/sga` frente a la jerarquía funcional oficial confirmada por el propietario.

---

*Fin del documento. Para actualizar este mapa, contrastar con el código fuente del repositorio en la rama `dev`. Los hallazgos abiertos deben gestionarse a través de los procesos documentales establecidos en `MAT-2026-001` y `CHK-2026-001`.*
