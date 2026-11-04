# 06 — Despliegue y Configuración

> **Entornos:** desarrollo local (Windows/macOS/Linux) · producción (Render + Vercel + PostgreSQL)
> **Fuentes:** `README.md` raíz, `sga_backend_jwt/README.md`, `sga_frontend_jwt/README.md`, `sga_backend_jwt/.env.example`, `sga_frontend_jwt/.env.example`, `sga_backend_jwt/requirements.txt`, `sga_frontend_jwt/package.json`, `sga_frontend_jwt/vercel.json`, `sga_backend_jwt/alembic.ini`, `sga_frontend_jwt/vite.config.ts`

> ⚠️ **Documento generado el 2026-10-19 sobre la rama local `dev` @ `14726ad`
> (anterior al commit `12760d4`).** Contenido **obsoleto**: describe despliegue en Render+Vercel+`vercel.json`
> (retirado, R-09); el stack real actual es Docker Compose. **La tabla de credenciales de prueba ha sido
> excluida de esta copia** (saneamiento obligatorio, §8 del plan — ver hallazgo R-08).
> Contrasta con [AUD-2026-002](../01_auditorias/AUD-2026-002_auditoria_dev_remota_12760d4.md) para el estado vigente.
---

## 1. Requisitos previos

| Componente | Versión mínima | Verificación |
|---|---|---|
| Git | cualquiera | `git --version` |
| Python | 3.11+ | `python --version` |
| Node.js | 20+ (con npm) | `node --version` / `npm --version` |
| PostgreSQL | 14+ (validado contra 16) | `psql --version` |
| pgAdmin (opcional) | 4+ | Interfaz gráfica para administration de la BD |

---

## 2. Estructura del repositorio y flujo de trabajo

```
SGA/
├── database/          # Esquema PostgreSQL (DDL + triggers + semilla)
├── sga_backend_jwt/   # API REST (FastAPI)
├── sga_frontend_jwt/  # SPA (React + Vite)
└── docs/              # Documentación técnica
```

### 2.1 Ramas

| Rama | Propósito |
|---|---|
| `main` | Estado de referencia estable inicial |
| `dev` | Rama de desarrollo activa (rama actual del repositorio) |
| `deployment` | Rama de despliegue / producción |

> **Regla del proyecto:** nunca hacer push directo a `main`. Los cambios fluyen `dev` → `deployment` mediante Pull Request.

---

## 3. Puesta en marcha del entorno local

### 3.1 Clonar el repositorio

```bash
git clone https://github.com/franciscogabrielrodriguez7-tech/SGA.git
cd SGA
```

### 3.2 Crear la base de datos

**Opción A — pgAdmin**

1. Abrir pgAdmin y conectarse al servidor PostgreSQL local.
2. Crear una base de datos vacía: `CREATE DATABASE sga_db;`
3. Conectarse a `sga_db` y ejecutar los scripts **en este orden exacto**.

**Opción B — psql (línea de comandos)**

```bash
createdb sga_db

psql -d sga_db -f database/01_esquema/01_tablas.sql
psql -d sga_db -f database/01_esquema/02_funciones_y_triggers.sql
psql -d sga_db -f database/01_esquema/03_seed_data.sql        # opcional: datos de prueba
psql -d sga_db -f database/01_esquema/04_plantillas.sql       # opcional: bajo demanda
psql -d sga_db -f database/01_esquema/06_vistas_dashboard.sql
```

> ⚠️ **No ejecutar `05_consultas.sql`**: es una colección de consultas de solo lectura, no modifica el esquema.
>
> ⚠️ **`04_plantillas.sql` está desalineado del esquema vigente** (ver [`DXC-2026-001_arquitectura.md`](../04_diagnostico/DXC-2026-001_arquitectura.md) H-03): ejecútelo solo tras revisarlo y adaptarlo.

**Verificación del esquema (opcional pero recomendada)**

```sql
\d auditoria_sistema            -- debe existir
SELECT tgname FROM pg_trigger WHERE NOT tgisinternal;  -- 19 triggers
SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND proname LIKE 'fn_%';       -- 11 funciones + 1 procedimiento
```

### 3.3 Backend (`sga_backend_jwt`)

**Paso 1 — Entrar al directorio y crear el entorno virtual**

```bash
cd sga_backend_jwt

# Windows
python -m venv venv
# macOS / Linux
python3 -m venv venv
```

**Paso 2 — Activar el entorno** (en cada terminal nueva)

```bash
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# Windows (CMD)
.\venv\Scripts\activate.bat
# macOS / Linux
source venv/bin/activate
```

> Si PowerShell bloquea la ejecución: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

**Paso 3 — Instalar dependencias**

```bash
pip install -r requirements.txt
```

**Paso 4 — Configurar las variables de entorno**

```bash
# Windows
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

Contenido de `sga_backend_jwt/.env`:

```env
# Cadena de conexión a PostgreSQL
# Formato: postgresql+psycopg2://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD
DATABASE_URL=postgresql+psycopg2://postgres:TU_CONTRASEÑA@localhost:5432/sga_db

# Clave secreta para firmar los tokens JWT
# Generar con: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=cambia-esto-por-una-clave-secreta-larga-y-aleatoria

# Algoritmo de firma JWT (no cambiar sin saber lo que se hace)
JWT_ALGORITHM=HS256

# Expiración del token en minutos (480 = 8 horas)
JWT_EXPIRE_MINUTES=480
```

> 🔐 **El archivo `.env` nunca debe subirse a Git.** El `.gitignore` raíz ya excluye `.env` y `venv/`.
>
> `app/config/settings.py` **falla en el arranque** si falta `DATABASE_URL` o `JWT_SECRET_KEY` (lanza `ValueError`), lo que evita arrancar con una configuración insegura por omisión.

**Paso 5 — Sincronizar Alembic (control de migraciones)**

> ⚠️ `alembic` **no está declarado en `requirements.txt`** (H-13). En una instalación limpia hay que instalarlo explícitamente: `pip install alembic` (o añadirlo a `requirements.txt`, que es lo recomendado).

Como el esquema se creó ejecutando los `.sql` directamente, la base ya está en su estado más reciente. Solo hay que "estampar" la revisión para que Alembic la reconozca:

```bash
alembic stamp head
```

> ⚠️ **No usar `alembic upgrade head` sobre una base creada con los `.sql`**: la revisión `d4f74f3d4896_baseline_schema` ejecuta `DROP TABLE auditoria_sistema`, `DROP INDEX` y `DROP CONSTRAINT`, y destruiría el esquema (ver [`DXC-2026-001_arquitectura.md`](../04_diagnostico/DXC-2026-001_arquitectura.md) H-08 y [`DXC-2026-002_base_de_datos.md`](../04_diagnostico/DXC-2026-002_base_de_datos.md) §8).

**Paso 6 — Arrancar el servidor**

```bash
uvicorn app.main:app --reload
```

- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- OpenAPI: `http://localhost:8000/openapi.json`
- Health check: `http://localhost:8000/`

En la consola aparecerá `Conexion exitosa a PostgreSQL` (mensaje de `app/main.py`).

**Comandos adicionales**

```bash
uvicorn app.main:app --reload --port 8000   # puerto alternativo
alembic revision --autogenerate -m "descripcion"  # nueva migración tras cambiar modelos
alembic upgrade head                      # aplicar migraciones (ver advertencia)
alembic history                            # historial de revisiones
alembic current                           # revisión aplicada
```

### 3.4 Frontend (`sga_frontend_jwt`)

**Paso 1 — Entrar al directorio e instalar dependencias**

```bash
cd sga_frontend_jwt
npm install
```

**Paso 2 — Configurar la URL del backend**

```bash
# Windows
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

Contenido de `sga_frontend_jwt/.env`:

```env
# URL base de la API del backend (debe incluir el prefijo /api/sga)
VITE_API_URL=http://localhost:8000/api/sga
```

> `VITE_API_URL` se incrusta en el bundle en tiempo de build (no es runtime). Cambiarla exige **reconstruir** la aplicación.

**Paso 3 — Arrancar el servidor de desarrollo**

```bash
npm run dev
```

- Aplicación: `http://localhost:5173`
- HMR activo: los cambios se reflejan sin recargar manualmente.

**Scripts disponibles**

| Script | Comando | Función |
|---|---|---|
| `npm run dev` | `vite` | Servidor de desarrollo con HMR |
| `npm run build` | `tsc -b && vite build` | Verificación de tipos + build de producción en `dist/` |
| `npm run preview` | `vite preview` | Sirve el build de producción localmente |
| `npm run lint` | `oxlint` | Análisis estático (formato `oxlint`) |

### 3.5 Verificación end-to-end

1. `GET http://localhost:8000/` → `status: true`.
2. `POST http://localhost:8000/api/sga/auth/login` con un usuario de la semilla → `access_token`.
3. `GET http://localhost:8000/docs` → la pestaña **Authorize** permite pegar el token y probar los endpoints protegidos.
4. `http://localhost:5173` → login con el mismo usuario.

> 🔒 **Credenciales de prueba excluidas (saneamiento §8 del plan, hallazgo R-08).**
> Las credenciales de prueba del seed están documentadas en `database/README_base_de_datos.md`; ver hallazgo R-08.
> La discrepancia con el `README.md` raíz está registrada como H-05 en [DXC-2026-001_arquitectura.md](../04_diagnostico/DXC-2026-001_arquitectura.md).
>
> Los 10 clientes de la semilla (`80123456`, `52431289`, ...) **no tienen contraseña** y no pueden iniciar sesión (RN-AUTH-01).

### 3.6 Problemas frecuentes en el entorno local

| Síntoma | Causa | Solución |
|---|---|---|
| `ValueError: Falta la variable DATABASE_URL` | `.env` no existe o no está en `sga_backend_jwt/` | Copiar `.env.example` a `.env` en el directorio del backend. |
| `ValueError: Falta la variable JWT_SECRET_KEY` | Misma causa | Igual; generar con `secrets.token_hex(32)`. |
| `connection refused` hacia PostgreSQL | El servicio no está corriendo o el puerto no es 5432 | Verificar el servicio y el `DATABASE_URL`. |
| `column "estado_usuario" does not exist` | Se ejecutó un script de la versión anterior del esquema | Recargar el esquema con `01_tablas.sql` y `02_funciones_y_triggers.sql` actuales. |
| `stock_alquilado` descuadrado | Se escribió manualmente en `producto` | No escribir nunca ese campo; se sincroniza por trigger. Reconstruir el stock con los scripts. |
| Error de CORS en el navegador | Origen no permitido | `app/main.py` ya permite `http://localhost:5173` y `http://127.0.0.1:5173`; si cambia el puerto, añadirlo. |
| `405 Method Not Allowed` al hacer login | Se está invocando `POST /usuarios/login` (no existe) | Usar `POST /api/sga/auth/login`. |
| El frontend no encuentra la API | `VITE_API_URL` mal definido o sin prefijo | Debe terminar en `/api/sga` y reiniciar `npm run dev`. |
| `npm run build` falla por tipos | Cambios sin tipar | `tsc -b` falla con el mensaje del compilador; corregir antes de desplegar. |

---

## 4. Configuración de la aplicación

### 4.1 Backend — `app/config/settings.py`

| Variable | Obligatoria | Default | Efecto |
|---|---|---|---|
| `DATABASE_URL` | **Sí** | — | Cadena de conexión SQLAlchemy. Si falta, la app no arranca. |
| `JWT_SECRET_KEY` | **Sí** | — | Clave de firma HS256. Si falta, la app no arranca. |
| `JWT_ALGORITHM` | No | `HS256` | Algoritmo de firma. |
| `JWT_EXPIRE_MINUTES` | No | `480` (8 h) | Vigencia del token de acceso. |

### 4.2 Backend — `app/config/database.py`

| Parámetro | Valor | Motivo |
|---|---|---|
| `pool_pre_ping` | `True` | Verifica la conexión antes de usarla (evita `OperationalError` tras un cierre del pool por parte del proveedor). |
| `pool_recycle` | `3600` (1 h) | Recicla conexiones más antiguas que 1 hora, incompatible con algunos proxies y firewalls de BD. |
| `SessionLocal` | `autocommit=False`, `autoflush=False` | Control transaccional explícito: cada operación de escritura hace `commit` o `rollback` explícitamente. |
| `get_db()` | Generador con `finally: db.close()` | Garantiza el cierre de la sesión incluso si la ruta lanza excepción. |

### 4.3 Frontend — `src/api/client.ts`

| Variable | Default | Efecto |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api/sga` | Base de todas las peticiones. Se normaliza eliminando `/` finales. |
| `localStorage["sga_sesion_usuario"]` | — | Sesión + token persistidos. Clave compartida por `AuthContext` y `client.ts`. |
| `localStorage["sga_tema"]` | — | Preferencia de tema claro/oscuro. |

### 4.4 CORS

Configurado en `app/main.py` con `CORSMiddleware`:

```python
allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

> ⚠️ **Acción obligatoria antes de producción:** eliminar el comodín `"*"` de `allow_origins` y dejar únicamente el dominio de Vercel (p. ej. `https://sga-<proyecto>.vercel.app`) y, si se usa dominio propio, añadirlo. La combinación `"*"` con `allow_credentials=True` es una configuración insegura e inconsistente (H-01).

---

## 5. Despliegue en producción

### 5.1 Topología objetivo

```
  Navegador
      │  HTTPS
      ▼
  Vercel  ── Sirve el build estático de Vite (dist/)
      │  HTTPS + Authorization: Bearer
      ▼
  Render Web Service  ──  Uvicorn/Gunicorn  →  app.main:app
      │  PostgreSQL (5432)
      ▼
  PostgreSQL gestionado
```

### 5.2 PostgreSQL

1. Crear la instancia de PostgreSQL (Render ofrece PostgreSQL integrado; alternativamente un proveedor gestionado externo).
2. Crear la base de datos vacía (p. ej. `sga_db`).
3. Ejecutar `01_tablas.sql`, `02_funciones_y_triggers.sql` y `03_seed_data.sql` **desde la consola del proveedor** (psql web o `psql` remoto). Es imprescindible que el segundo script se ejecute: los triggers son la base de la integridad del stock.
4. **No** ejecutar `alembic upgrade head` (ver §3.3, paso 5). Si se desea, usar `alembic stamp head` desde un shell con acceso a la BD.

> **Nota operativa:** en un entorno gestionado sin `psql` local, se puede conectar desde Python:
> ```python
> # script_adhoc.py
> from sqlalchemy import create_engine, text
> engine = create_engine("postgresql+psycopg2://...")
> with engine.begin() as conn:
>     for f in ["01_tablas.sql", "02_funciones_y_triggers.sql", "03_seed_data.sql"]:
>         conn.execute(text(open(f"database/01_esquema/{f}", encoding="utf-8").read()))
> ```

### 5.3 Backend en Render

**Configuración del Web Service**

| Campo | Valor |
|---|---|
| Root Directory | `sga_backend_jwt` |
| Runtime | Python 3.11 (o el que detecte Render) |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app.main:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
| Health Check Path | `/` |

> `gunicorn` (23.0.0) ya está declarado en `requirements.txt`, lo que confirma la intención de usarlo como servidor de producción. Uvicorn queda para desarrollo. El puerto **debe** ser `$PORT` (Render lo asigna dinámicamente).

**Variables de entorno (panel de Render → Environment)**

| Variable | Valor | Nota |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg2://USER:PASS@HOST:PORT/sga_db` | **Usar el prefijo `postgresql+psycopg2://`** (psycopg2), no `postgresql://`. Render entrega URLs con prefijo `postgresql://`; hay que reemplazarlo. |
| `JWT_SECRET_KEY` | `python -c "import secrets; print(secrets.token_hex(32))"` | Valor estable y único por entorno. **No** cambiar sin un plan de invalidación de tokens (ver [`DXC-2026-005_reglas_negocio_rbac.md`](../04_diagnostico/DXC-2026-005_reglas_negocio_rbac.md) P-02). |
| `JWT_ALGORITHM` | `HS256` | Default. |
| `JWT_EXPIRE_MINUTES` | `480` | 8 horas. |

**Consideraciones**

- **Instancias múltiples:** `APScheduler` corre en proceso. Con más de una instancia, cada una ejecutaría el job de las 00:05 (idempotente, pero genera tráfico innecesario). Con 1 worker de Uvicorn o con Gunicorn se debe usar **1 worker** o migrar el job a un cron externo (pg_cron, GitHub Actions, etc.). El comando propuesto usa `--workers 2`: revisar esta decisión.
- **Propiedad `PORT`:** Render inyecta `PORT`; el `--bind 0.0.0.0:$PORT` es obligatorio.
- **Sleep en plan gratuito:** el plan gratuito de Render hiberna el servicio tras inactividad; la primera petición tras el despertar puede tardar ~50 s.

### 5.4 Frontend en Vercel

**Configuración del proyecto**

| Campo | Valor |
|---|---|
| Framework Preset | Vite |
| Root Directory | `sga_frontend_jwt` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` (o `npm ci` si se usa `package-lock.json`) |

**Routing SPA** — `sga_frontend_jwt/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Sin este rewrite, una recarga directa de `/alquileres/12` devolvería 404.

**Variable de entorno**

| Variable | Valor | Nota |
|---|---|---|
| `VITE_API_URL` | `https://<api-render>.onrender.com/api/sga` | **Debe incluir el prefijo `/api/sga`.** Se incrusta en el bundle en tiempo de build: cambiarla exige redesplegar. |

**Dominio personalizado** (opcional): en Vercel → Project → Settings → Domains. Una vez configurado, añadir ese origen a `allow_origins` del backend.

### 5.5 Checklist de despliegue

**Antes del primer despliegue**

- [ ] Base de datos creada y los tres scripts SQL ejecutados (en orden).
- [ ] Verificado que existen los 19 triggers y 12 funciones/procedimientos.
- [ ] `JWT_SECRET_KEY` generado con `secrets.token_hex(32)` y guardado en el gestor de secretos de Render.
- [ ] `DATABASE_URL` con el prefijo `postgresql+psycopg2://` correcto.
- [ ] Contraseñas de la semilla **cambiadas** (o eliminadas los usuarios de prueba) antes de exponer el sistema.
- [ ] `allow_origins` de CORS ajustado al dominio real de Vercel (sin `"*"`).
- [ ] `VITE_API_URL` de Vercel apuntando a la URL final de Render con `/api/sga`.

**Despliegue del backend**

- [ ] `gunicorn app.main:app --bind 0.0.0.0:$PORT` como Start Command.
- [ ] `GET /` responde 200 en la URL pública de Render.
- [ ] `GET /docs` carga y el botón **Authorize** funciona.
- [ ] `POST /api/sga/auth/login` devuelve `access_token` contra la BD de producción.
- [ ] `GET /api/sga/productos` con token devuelve datos (confirma que la BD tiene la semilla y los triggers).
- [ ] Verificar el job de las 00:05 Bogotá en los logs de Render.

**Despliegue del frontend**

- [ ] `npm run build` completa sin errores de tipos en CI local.
- [ ] La URL de Vercel carga y muestra la pantalla de login.
- [ ] El login funciona contra la API de producción (verifica CORS).
- [ ] Navegar a una ruta interna y recargar: debe funcionar el rewrite SPA.
- [ ] El token se adjunta en las peticiones (verificar en las Network del navegador).

**Verificación funcional en producción**

- [ ] Crear un cliente → crear un alquiler con detalle → verificar que `stock_alquilado` del producto sube.
- [ ] Registrar entrega (estado `pendiente` → `activo`) y recogida (`activo` → `recogido`).
- [ ] Verificar que al cerrar el alquiler el stock vuelve a `stock_alquilado = 0`.
- [ ] Consultar `GET /alquileres/{id}/historial` y comprobar que `id_usuario_accion` viene poblado.
- [ ] Probar el control de acceso: iniciar sesión con `encargado_logistico` y confirmar que `POST /alquileres` devuelve 403.

---

## 6. Observaciones y riesgos de la configuración

| # | Hallazgo | Impacto | Acción recomendada |
|---|---|---|---|
| C-01 | No existe `render.yaml` (blueprint) | El servicio se configura a mano en el panel; no es reproducible ni versionado | Añadir un `render.yaml` con el blueprint del Web Service y del PostgreSQL |
| C-02 | No existe `Procfile` ni `Dockerfile` | El comando de arranque depende de la configuración manual | Añadir `Procfile` (`web: gunicorn app.main:app --bind 0.0.0.0:$PORT`) |
| C-03 | La migración baseline de Alembic es destructiva | `alembic upgrade head` puede destruir el esquema | Usar siempre `alembic stamp head`; a mediano plazo, versionar los `.sql` como migraciones |
| C-04 | `alembic.ini` contiene una URL de ejemplo (`driver://user:pass@localhost/dbname`) | Inofensivo: `alembic/env.py` la sobrescribe con `config.set_main_option("sqlalchemy.url", str(DATABASE_URL))` (línea 36) | Ninguna acción; no editar la URL del `.ini` |
| C-15 | `alembic/env.py` **no importa el modelo `AuditoriaSistema`** | `target_metadata` no conoce la tabla `auditoria_sistema`: un `alembic revision --autogenerate` generaría un `DROP TABLE auditoria_sistema` | Importar `from app.models.auditoria_sistema import AuditoriaSistema` en `alembic/env.py` antes de cualquier autogenerate |
| C-05 | CORS con `"*"` y `allow_credentials=True` | Inseguro en producción | Fijar la lista de orígenes |
| C-06 | El scheduler corre en proceso y por worker | Con N workers, N ejecuciones del job de las 00:05 | Limitar a 1 worker o externalizar el job |
| C-07 | `VITE_API_URL` se fija en build time | Cambiar la URL de la API exige redespliegue del frontend | Documentarlo; o usar una variable de runtime |
| C-08 | Sin `health check` dedicado | Render usa `/` por defecto; un fallo de BD no se distingue de un proceso vivo | Añadir `GET /health` que ejecute `SELECT 1` |
| C-09 | Sin `.github/workflows` | No hay CI: lint, build y pruebas no se validan automáticamente | Añadir un workflow con `oxlint`, `npm run build` y `pytest` |
| C-10 | `package.json` usa rangos `^` en las dependencias | La instalación no es reproducible en el tiempo | Usar `npm ci` con el `package-lock.json` existente |
| C-11 | `tsconfig.app.json` no activa `"strict": true` | El chequeo de tipos es más débil de lo habitual; además define el alias `@/*` que **no** está configurado en `vite.config.ts` (hoy nadie lo usa, pero rompería en cuanto se usara) | Activar `strict` y configurar el alias en Vite, o eliminarlo del tsconfig |
| C-12 | Sin política de rotación de credenciales | La `JWT_SECRET_KEY` y las contraseñas de la semilla son permanentes | Definir la rotación (ver [`DXC-2026-005_reglas_negocio_rbac.md`](../04_diagnostico/DXC-2026-005_reglas_negocio_rbac.md) P-01, P-02) |
| C-13 | El plan gratuito de Render hiberna el servicio | Latencia de ~50 s en la primera petición tras inactividad | Considerar el plan pago o un cron de "warming" |
| C-14 | `python-dotenv` carga `.env` sin filtrar el entorno | En producción, si se cuela un `.env` en la imagen, sobrescribe variables del panel | En despliegue, asegurar que `.env` no exista en el artefacto |

---

## 7. Checklist de mantenimiento del despliegue

| Frecuencia | Tarea |
|---|---|
| Por despliegue | Revisar logs de Render, verificar `/` y `/docs`, ejecutar el checklist funcional de §5.5 |
| Mensual | Revisar accesos de usuarios activos; rotar credenciales de prueba; verificar tamaño de `auditoria_sistema` |
| Trimestral | Actualizar dependencias (`pip list --outdated`, `npm outdated`); revisar el parche de PostgreSQL; validar de nuevo el ciclo de stock con los triggers |
| Semestral | Revisar la matriz RBAC contra las reglas de negocio vigentes (P-05, P-06, P-07); revisar la política de contraseñas y la rotación de `JWT_SECRET_KEY` |

---

## 8. Referencias cruzadas

- Arquitectura y flujo entre capas: [`DXC-2026-001_arquitectura.md`](../04_diagnostico/DXC-2026-001_arquitectura.md)
- Esquema, índices y triggers: [`DXC-2026-002_base_de_datos.md`](../04_diagnostico/DXC-2026-002_base_de_datos.md)
- Catálogo de endpoints y códigos de respuesta: [`DXC-2026-003_api_contrato.md`](../04_diagnostico/DXC-2026-003_api_contrato.md)
- Estructura del frontend y sistema de estilos: [`DXC-2026-004_frontend_componentes.md`](../04_diagnostico/DXC-2026-004_frontend_componentes.md)
- Reglas de negocio, matriz RBAC y pendientes por definir: [`DXC-2026-005_reglas_negocio_rbac.md`](../04_diagnostico/DXC-2026-005_reglas_negocio_rbac.md)
