# SGA — Backend (FastAPI + SQLAlchemy + JWT)

API REST del Sistema de Gestión de Alquileres de Andamios. Construida con Python, FastAPI y PostgreSQL.

---

## Requisitos

- Python 3.11 o superior
- PostgreSQL 14 o superior (con la base de datos `sga_db` ya creada y los scripts SQL ejecutados — ver `README.md` raíz)
- `pip` (viene incluido con Python)

---

## Instalación paso a paso

### 1. Ir a la carpeta del backend

```bash
cd sga_backend_jwt
```

### 2. Crear el entorno virtual de Python

Un entorno virtual aísla las dependencias del proyecto para que no choquen con otras instalaciones de Python en tu máquina.

```bash
# En Windows
python -m venv venv

# En macOS / Linux
python3 -m venv venv
```

### 3. Activar el entorno virtual

Debes activarlo **cada vez** que abras una nueva terminal para trabajar con el proyecto.

```bash
# En Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# En Windows (CMD)
.\venv\Scripts\activate.bat

# En macOS / Linux
source venv/bin/activate
```

Sabrás que está activo porque el prompt de la terminal mostrará `(venv)` al inicio.

### 4. Instalar las dependencias

```bash
pip install -r requirements.txt
```

### 5. Configurar las variables de entorno

Copia el archivo de ejemplo y edítalo con tus datos reales:

```bash
# En Windows
copy .env.example .env

# En macOS / Linux
cp .env.example .env
```

Luego abre `.env` con cualquier editor de texto y ajusta los valores:

```env
# Cadena de conexión a PostgreSQL
# Formato: postgresql+psycopg2://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD
DATABASE_URL=postgresql+psycopg2://postgres:TU_CONTRASEÑA@localhost:5432/sga_db

# Clave secreta para firmar los tokens JWT
# Genera una clave segura ejecutando en la terminal:
#   python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=cambia-esto-por-una-clave-secreta-larga-y-aleatoria

# Algoritmo de firma JWT (no cambiar salvo que sepas lo que haces)
JWT_ALGORITHM=HS256

# Tiempo de expiración del token en minutos (480 = 8 horas)
JWT_EXPIRE_MINUTES=480
```

> ⚠️ Nunca subas el archivo `.env` real a GitHub. El `.gitignore` ya lo excluye.

### 6. Sincronizar Alembic (control de migraciones)

Como ya ejecutaste los scripts SQL directamente en el Paso 2 del README principal, la base de datos ya está en su estado más reciente. Solo debes decirle a Alembic que lo reconozca como punto de partida:

```bash
alembic stamp head
```

### 7. Iniciar el servidor

```bash
uvicorn app.main:app --reload
```

El servidor quedará disponible en `http://localhost:8000`.

La documentación interactiva de la API (Swagger UI) estará en: `http://localhost:8000/docs`

---

## Estructura del Proyecto

```
sga_backend_jwt/
├── alembic/                # Configuración y migraciones de Alembic
├── app/
│   ├── config/             # Configuración de base de datos (SQLAlchemy engine, Session)
│   ├── controllers/        # Lógica de negocio (alquiler, usuario, producto, etc.)
│   ├── models/             # Modelos SQLAlchemy (mapeo de tablas)
│   ├── routes/             # Endpoints FastAPI (routers)
│   ├── schemas/            # Esquemas Pydantic (validación de request/response)
│   └── utils/              # Utilidades (JWT, auditoría, tiempo, scheduler, etc.)
├── .env                    # Variables de entorno locales (NO subir a Git)
├── .env.example            # Plantilla de variables de entorno
├── alembic.ini             # Configuración de Alembic
└── requirements.txt        # Dependencias Python
```

---

## Comandos útiles

```bash
# Correr el servidor en modo desarrollo (con recarga automática)
uvicorn app.main:app --reload

# Generar una nueva migración de base de datos tras cambiar modelos
alembic revision --autogenerate -m "descripcion_del_cambio"

# Aplicar migraciones pendientes
alembic upgrade head

# Ver el historial de migraciones
alembic history
```

---

## Notas importantes

- **Vencimientos automáticos:** El sistema usa `APScheduler` para transicionar automáticamente los alquileres de `activo` a `vencido` todos los días a las 00:05. No es necesario configurar nada extra; el job se registra al arrancar la aplicación.
- **Zona horaria:** Toda la lógica de fechas usa la zona horaria `America/Bogota`. Ver `app/utils/tiempo.py`.
- **Auditoría:** Cada INSERT/UPDATE/DELETE en las tablas principales queda registrado automáticamente en la tabla `auditoria_sistema` gracias a triggers de PostgreSQL.
