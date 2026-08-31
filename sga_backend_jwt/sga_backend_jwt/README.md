# API SGA — Sistema de Gestión de Alquileres de Andamios

Backend en FastAPI + SQLAlchemy, construido replicando la arquitectura y el estilo de código del esqueleto de referencia (API Veterinaria), conectado a la base de datos `SGA_db_intento1` (con la corrección de `usuario.rol_usuario` a `VARCHAR(30)` — ver más abajo).

## Requisitos previos

- Python 3.10+
- PostgreSQL con el esquema de `SGA_db_intento1` ya creado. El SQL corregido está incluido en este mismo paquete, en `database/01_esquema/`:

```bash
psql -U tu_usuario -d sga_db -f database/01_esquema/01_tablas.sql
psql -U tu_usuario -d sga_db -f database/01_esquema/02_funciones_y_triggers.sql
```

  (en ese orden — los triggers referencian las tablas). Este backend **no crea el esquema por sí solo**, solo se conecta a una base de datos ya existente. Ver `database/README_base_de_datos.md` para el detalle completo de tablas, triggers y la corrección aplicada.

## Instalación

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Variables de entorno

Copia `.env.example` como `.env` y ajusta la cadena de conexión:

```
DATABASE_URL=postgresql+psycopg2://usuario:password@localhost:5432/sga_db
JWT_SECRET_KEY=cambia-esto-por-una-clave-secreta-larga-y-aleatoria
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480
```

Genera una `JWT_SECRET_KEY` real con:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## 🔴 Variante con JWT — cómo crear el primer usuario (admin)

Con JWT, **todas las rutas de escritura y consulta quedan protegidas**, incluyendo `POST /usuarios` (crear usuario) — **excepto** `POST /usuarios/login`. Esto crea una situación de "huevo y gallina": para crear el primer usuario administrador necesitas un token, pero para obtener un token necesitas iniciar sesión con un usuario que ya exista.

**Solución**: el primer usuario administrador debe crearse directamente en la base de datos (fuera de la API), por ejemplo:

```sql
-- Genera el hash de la contraseña en Python primero:
-- python -c "import bcrypt; print(bcrypt.hashpw(b'tu_clave', bcrypt.gensalt()).decode())"

INSERT INTO usuario (id_usuario, rol_usuario, nombres_usuario, apellidos_usuario, telefono_usuario, contrasena_usuario, tipo_documento)
VALUES ('1000000001', 'admin', 'Nombre', 'Apellido', '3000000000', '<hash_generado>', 'CC');
```

A partir de ahí, ese admin inicia sesión, obtiene su token, y con él puede crear el resto de usuarios (`encargado_facturacion`, `encargado_logistico`, `cliente`) a través de la API normalmente.

## Rutas protegidas vs. públicas

| Ruta | Requiere token |
|---|---|
| `POST /usuarios/login` | **No** (es la única forma de obtener un token) |
| Todo lo demás en `/usuarios`, `/productos`, `/alquileres`, `/detalle-alquiler`, `/gastos` | **Sí** — header `Authorization: Bearer <token>` |

Un token vence a los `JWT_EXPIRE_MINUTES` (480 = 8 horas por defecto). Pasado ese tiempo, cualquier request protegido devuelve `401` con `error: "AUTH_ERROR"` y el usuario debe volver a iniciar sesión.

**Importante — no confundir con RN-USR-02**: este JWT es un *token de sesión* (identifica quién está usando la API en este momento). Es un concepto distinto del "código de acceso" de un solo uso que la regla de negocio RN-USR-02 describe para que un administrador autorice el registro de un nuevo empleado — ese mecanismo sigue sin implementarse en ninguna variante del backend (ver conversación de diseño de la base de datos).

## Levantar el servidor

```bash
uvicorn app.main:app --reload
```

La API queda disponible en `http://localhost:8000`, con el prefijo `/api/sga` en todas las rutas (ej. `http://localhost:8000/api/sga/usuarios`). Documentación interactiva automática en `http://localhost:8000/docs`.

## Estructura del proyecto

```
app/
├── main.py                 <- punto de entrada, registro de routers, CORS
├── config/
│   ├── settings.py         <- lectura de variables de entorno
│   └── database.py         <- engine, SessionLocal, get_db (SQLAlchemy)
├── models/                 <- 1 archivo por tabla (ORM)
├── schemas/                <- validación Pydantic de entrada
├── controllers/             <- lógica de negocio y acceso a datos
├── routes/                  <- definición de endpoints (FastAPI routers)
└── utils/
    ├── response.py          <- envoltorio estándar de respuesta
    ├── security.py          <- NUEVO: hashing de contraseñas con bcrypt
    └── db_errors.py         <- NUEVO: traduce errores de triggers de PostgreSQL a mensajes de negocio
```

## Corrección aplicada sobre el esquema SQL

`usuario.rol_usuario` se amplió de `VARCHAR(20)` a `VARCHAR(30)` en `01_esquema/01_tablas.sql`, por instrucción explícita, porque el valor `'encargado_facturacion'` (21 caracteres) no cabía en el tipo original — ese rol nunca se habría podido registrar antes de esta corrección. Es el único cambio de estructura aplicado; ningún otro campo, constraint, trigger o relación fue modificado. Si tu base de datos ya existe con la columna vieja, aplica manualmente:

```sql
ALTER TABLE usuario ALTER COLUMN rol_usuario TYPE VARCHAR(30);
```

## Decisiones tomadas (confirmadas en el diseño, no inventadas)

- **Contraseñas**: se hashean con `bcrypt` antes de guardarse (el esqueleto de referencia comparaba en texto plano; se decidió explícitamente no replicar eso para SGA).
- **Renovaciones**: no existe tabla `renovaciones`. `POST /alquileres/{id}/renovaciones` es una operación que suma semanas a `alquiler.tiempo_alquiler` y recalcula la fecha de vencimiento (derivada, no almacenada).
- **Historial/trazabilidad**: `GET /alquileres/{id}/historial` devuelve únicamente el estado y la fecha de última actualización, con un aviso explícito de que no hay historial completo disponible (la base de datos no guarda el valor anterior de los cambios).
- **Cancelación**: `DELETE /alquileres/{id}` no borra la fila físicamente — cambia `estado_alquiler` a `'cancelado'` (los triggers de la BD ya restringen el `DELETE` físico en varios estados).
- **Transiciones de estado**: la base de datos solo impide "reabrir" un alquiler cerrado. La secuencia completa `pendiente → activo → vencido → recogido → terminado` (con `cancelado` como alternativa) se valida en `app/controllers/alquiler_controller.py` (`TRANSICIONES_VALIDAS`).
- **Gastos**: `logistica_alquiler` no distingue "gasto puro" de entrega/recogida (`es_recogida` es booleano obligatorio). `POST /gastos` exige indicar explícitamente a cuál de las dos se asocia, para no inventar un tercer estado que no existe en el modelo.
- **RN-ALQ-03 (mínimo 1 producto por alquiler)**: la base de datos de este proyecto no tiene un trigger que lo obligue. Se garantiza en `POST /alquileres`, insertando el encabezado y todas sus líneas de detalle en una misma transacción (si cualquier línea falla, se revierte todo).

## Endpoints disponibles

Todas las rutas llevan el prefijo `/api/sga`.

### Usuarios
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/usuarios` | Crear usuario (contraseña hasheada con bcrypt) |
| GET | `/usuarios` | Listar usuarios (filtro opcional `?rol_usuario=`) |
| GET | `/usuarios/{id_usuario}` | Consultar usuario |
| PATCH | `/usuarios/{id_usuario}/estado` | Activar/desactivar usuario |
| POST | `/usuarios/login` | Iniciar sesión |

### Productos
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/productos` | Crear producto |
| GET | `/productos` | Listar productos |
| GET | `/productos/{id_producto}` | Consultar producto |
| PATCH | `/productos/{id_producto}` | Actualizar producto |

### Alquileres
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/alquileres/buscar` | Buscar por cliente, barrio o número de detalle |
| GET | `/alquileres/proximos-vencer` | Alquileres activos próximos a vencer (`?dias=2`) |
| GET | `/alquileres/pendientes-entrega` | Alquileres en estado `pendiente` |
| POST | `/alquileres` | Crear alquiler (con detalle anidado, mínimo 1 producto) |
| GET | `/alquileres` | Listar alquileres (filtros `?estado_alquiler=`, `?id_usuario_cliente=`) |
| GET | `/alquileres/{id}` | Consultar alquiler con su detalle |
| PATCH | `/alquileres/{id}` | Actualizar campos editables (barrio, dirección, depósito, precio, se_lleva, se_recoge) |
| PATCH | `/alquileres/{id}/estado` | Cambiar estado (valida la secuencia oficial) |
| DELETE | `/alquileres/{id}` | Cancelar (cambia estado a `cancelado`, no borra) |
| GET | `/alquileres/{id}/historial` | Estado actual (sin historial completo, ver nota arriba) |
| POST | `/alquileres/{id}/renovaciones` | Renovar (suma semanas) |
| POST | `/alquileres/{id}/entregas` | Registrar entrega (pasa el alquiler a `activo`) |
| GET | `/alquileres/{id}/entregas` | Consultar entregas |
| POST | `/alquileres/{id}/recogidas` | Registrar recogida (pasa el alquiler a `recogido`, exige entrega previa) |
| GET | `/alquileres/{id}/recogidas` | Consultar recogidas |

### Detalle de alquiler
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/detalle-alquiler` | Agregar producto a un alquiler existente |
| GET | `/detalle-alquiler/{id}` | Consultar detalle |
| PATCH | `/detalle-alquiler/{id}` | Actualizar cantidad/precio |

### Gastos
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/gastos` | Registrar gasto logístico (asociado a entrega o recogida) |
| GET | `/gastos` | Listar gastos (filtro opcional `?id_alquiler=`) |
| GET | `/gastos/resumen-semanal` | Total de gastos agrupado por semana |

## Validado contra PostgreSQL real

Todo el flujo (creación de usuarios, login con bcrypt, creación transaccional de alquiler con detalle, entrega → activo, recogida → recogido con devolución de stock, renovación, bloqueo de transiciones inválidas, búsqueda, cancelación, gastos y resumen semanal) fue probado extremo a extremo con `TestClient` de FastAPI contra una instancia real de PostgreSQL 16, incluyendo casos de error esperados (stock insuficiente, recogida sin entrega previa, transición de estado inválida, reapertura de alquiler cerrado).
