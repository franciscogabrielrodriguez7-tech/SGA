# SGA — Sistema de Gestión de Alquileres de Andamios

SGA es una plataforma integral para controlar el inventario y los alquileres de equipos de andamiaje y construcción (planchones, crucetas, escaleras, etc.). Gestiona el ciclo de vida completo de un alquiler: desde la cotización hasta la recogida final, con control de stock en tiempo real, auditoría automática de cambios y roles de usuario diferenciados.

## Estructura del Repositorio

```
SGA/
├── database/          # Scripts SQL de PostgreSQL (esquema, funciones, seed)
├── sga_backend_jwt/   # API REST — Python + FastAPI + SQLAlchemy
├── sga_frontend_jwt/  # Interfaz web — React + TypeScript + Vite
└── docs/              # Documentación adicional (diagramas, decisiones, etc.)
```

## Stack Tecnológico

<div align="center">

**Frontend**

[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![React Router](https://img.shields.io/badge/React_Router-7.18.3-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![Zod](https://img.shields.io/badge/Zod-4.6.5-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)

**Backend**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0.52-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Alembic](https://img.shields.io/badge/Alembic-1.13.3-6BA81E?style=for-the-badge)](https://alembic.sqlalchemy.org/)
[![Pydantic](https://img.shields.io/badge/Pydantic-2.13.4-E92063?style=for-the-badge&logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![Uvicorn](https://img.shields.io/badge/Uvicorn-0.52.3-499848?style=for-the-badge)](https://www.uvicorn.org/)
[![PyJWT](https://img.shields.io/badge/PyJWT-2.10.1-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://pyjwt.readthedocs.io/)
[![APScheduler](https://img.shields.io/badge/APScheduler-3.11.3-4B8BBE?style=for-the-badge)](https://apscheduler.readthedocs.io/)

**Base de datos**

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**Despliegue**

[![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-Backend_y_PostgreSQL-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com/)
[![Docker](https://img.shields.io/badge/Docker-config._existente-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-1.27-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)

</div>

---

## Requisitos Previos (en la máquina donde vayas a correrlo)

Antes de clonar el repositorio, asegúrate de tener instalado:

- [Git](https://git-scm.com/)
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 20+ y npm](https://nodejs.org/)
- [PostgreSQL 16+](https://www.postgresql.org/download/) y opcionalmente [pgAdmin](https://www.pgadmin.org/) *(la configuración Docker Compose del repositorio declara `postgres:16-alpine`; la versión efectiva en Render no ha sido verificada independientemente)*

---

## Guía de Instalación Completa

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/franciscogabrielrodriguez7-tech/SGA.git
cd SGA
```

### Paso 2 — Crear la base de datos

1. Abre **pgAdmin** (o `psql`) y conéctate a tu servidor PostgreSQL local.
2. Crea una nueva base de datos vacía:
   ```sql
   CREATE DATABASE sga_db;
   ```

> El esquema de la base de datos es gestionado por Alembic: al arrancar el backend, `entrypoint.sh` ejecuta `alembic upgrade head` y aplica las migraciones definidas en `sga_backend_jwt/alembic/versions/`. Los scripts de `database/01_esquema/` están disponibles como referencia en el repositorio.

### Paso 3 — Configurar y arrancar el Backend

Instrucciones detalladas en [`sga_backend_jwt/README.md`](./sga_backend_jwt/README.md).

### Paso 4 — Configurar y arrancar el Frontend

Instrucciones detalladas en [`sga_frontend_jwt/README.md`](./sga_frontend_jwt/README.md).

---

## Acceso Inicial

### 1. Entorno de desarrollo local

Una vez que ambos servidores (backend y frontend) estén ejecutándose localmente conforme a las instrucciones previas:

1. Abre tu navegador en `http://localhost:5173`.
2. Para acceder al sistema, se requiere un usuario registrado en la base de datos local.
3. Inicia sesión ingresando el correo electrónico (`email_usuario`) o teléfono (`telefono_usuario`) y la contraseña configurada.

> ℹ️ **Nota sobre datos de desarrollo:** El repositorio incluye el archivo `database/01_esquema/03_seed_data.sql`, el cual contiene exclusivamente registros ficticios de prueba para el desarrollo local. Para consultar los datos de prueba disponibles en dicho entorno, remítase al encabezado de dicho archivo. Este script no se ejecuta en producción, no debe utilizarse en dicho entorno, ni la documentación expone información, credenciales o contenidos de la base de datos desplegada.

### 2. Entorno de producción

El procedimiento actualmente confirmado para la inicialización y el acceso inicial en producción comprende:

1. **Inicialización de la base de datos:** Conectarse directamente a la base de datos PostgreSQL de producción mediante **pgAdmin 4** (herramienta exclusiva confirmada para este procedimiento).
2. **Comprobación de usuarios:** Verificar que no existan usuarios previamente registrados en la tabla `usuario`.
3. **Creación del primer administrador y datos iniciales:** Crear manualmente el primer usuario con rol de administrador (`rol_usuario = 'admin'`), junto con los datos semilla necesarios para la inicialización del sistema.
   - *Limitación documental:* No está documentado en el repositorio con suficiente detalle cuáles son específicamente estos datos semilla requeridos para producción ni cuál es su procedencia exacta.
4. **Inicio de sesión en producción:** El acceso debe realizarse a través de la interfaz web desplegada en Vercel, utilizando las credenciales del usuario administrador creado.
   - *Limitación documental:* La URL pública definitiva del despliegue en Vercel no se encuentra versionada en los archivos del repositorio (su configuración se gestiona en la plataforma Vercel) y queda pendiente de confirmación formal.

---

## Estrategia de Despliegue

> El propietario del proyecto confirma que el frontend está operativo en Vercel y que el backend junto con la base de datos están alojados en Render.

| Componente | Configuración en el repositorio | Estado |
|---|---|---|
| Frontend | **Vercel** es el destino principal del frontend, confirmado por el propietario. [`sga_frontend_jwt/vercel.json`](./sga_frontend_jwt/vercel.json) define una regla de reescritura para la SPA (`/(.*)` → `/index.html`). | Confirmado por el propietario; operativo en Vercel |
| Stack en contenedores | [`docker-compose.yml`](./docker-compose.yml) define tres servicios (`postgres`, `backend`, `frontend`). Backend y frontend tienen sus respectivos `Dockerfile`; PostgreSQL utiliza directamente la imagen `postgres:16-alpine` declarada en Docker Compose. La plantilla de variables es [`.env.docker.example`](./.env.docker.example). El frontend se sirve con Nginx. Esta configuración es una alternativa en contenedores, no la arquitectura principal de despliegue confirmada por el propietario. | Configuración técnica existente; no es el destino principal del frontend; uso en producción no verificado |
| Backend y base de datos | **Render** es la plataforma de producción del backend y de PostgreSQL, confirmado por el propietario. El repositorio no contiene archivos de configuración de Render (`render.yaml`, `Procfile`). | Confirmado por el propietario; operativo en Render |

- Los comandos de arranque del stack en contenedores figuran en los comentarios de cabecera de `docker-compose.yml`; este README no los repite.
- Para ejecutar el proyecto en local sin contenedores, siga la guía de instalación de este README.
- Los detalles específicos del frontend (Vercel, `vercel.json`, variables de entorno, CORS y Docker/Nginx) están en [`sga_frontend_jwt/README.md`](./sga_frontend_jwt/README.md).

---

## Ramas del Repositorio

| Rama | Propósito |
|---|---|
| `main` | Estado de referencia estable inicial |
| `dev` | Rama de desarrollo activa — todos los cambios van aquí primero |
| `deployment` | Rama de despliegue / producción |

> **Regla crítica:** nunca hacer push directo a `main`. Los cambios van de `dev` → `deployment` mediante Pull Request.