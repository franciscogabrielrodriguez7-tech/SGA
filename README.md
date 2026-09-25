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

| Capa | Tecnología |
|---|---|
| Base de datos | PostgreSQL 14+ |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2, Alembic |
| Autenticación | JWT (PyJWT + bcrypt) |
| Frontend | React 19, TypeScript, Vite, React Router, Zod |
| Tareas programadas | APScheduler |

---

## Requisitos Previos (en la máquina donde vayas a correrlo)

Antes de clonar el repositorio, asegúrate de tener instalado:

- [Git](https://git-scm.com/)
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 20+ y npm](https://nodejs.org/)
- [PostgreSQL 14+](https://www.postgresql.org/download/) y opcionalmente [pgAdmin](https://www.pgadmin.org/)

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
3. Conéctate a `sga_db` y ejecuta los scripts **en este orden exacto**:

   | Orden | Archivo |
   |---|---|
   | 1 | `database/01_esquema/01_tablas.sql` |
   | 2 | `database/01_esquema/02_funciones_y_triggers.sql` |
   | 3 | `database/01_esquema/03_seed_data.sql` |
   | 4 | `database/01_esquema/04_plantillas.sql` *(opcional — datos de prueba)* |
   | 5 | `database/01_esquema/06_vistas_dashboard.sql` |

   > ⚠️ No ejecutes `05_consultas.sql` — es solo de referencia, no modifica el esquema.

### Paso 3 — Configurar y arrancar el Backend

Instrucciones detalladas en [`sga_backend_jwt/README.md`](./sga_backend_jwt/README.md).

### Paso 4 — Configurar y arrancar el Frontend

Instrucciones detalladas en [`sga_frontend_jwt/README.md`](./sga_frontend_jwt/README.md).

---

## Acceso Inicial

Una vez que ambos servidores estén corriendo, abre tu navegador en `http://localhost:5173`.

El `03_seed_data.sql` crea los siguientes usuarios de prueba:

| Documento | Contraseña | Rol |
|---|---|---|
| `100000001` | `admin123` | Administrador |
| `100000002` | `encargado123` | Encargado de Facturación |
| `100000003` | `logistico123` | Encargado Logístico |

> 🔐 Cambia estas contraseñas inmediatamente en un entorno de producción.

---

## Ramas del Repositorio

| Rama | Propósito |
|---|---|
| `main` | Estado de referencia estable inicial |
| `dev` | Rama de desarrollo activa — todos los cambios van aquí primero |
| `deployment` | Rama de despliegue / producción |

> **Regla crítica:** nunca hacer push directo a `main`. Los cambios van de `dev` → `deployment` mediante Pull Request.