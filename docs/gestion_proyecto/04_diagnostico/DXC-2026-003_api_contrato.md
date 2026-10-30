# 03 — Contrato de la API

> **Base URL:** `/api/sga`
> **Especificación viva:** Swagger UI en `/docs` · OpenAPI en `/openapi.json` (generada por FastAPI)
> **Routers registrados en `app/main.py`:** `auth`, `usuarios`, `clientes`, `productos`, `inventario`, `alquileres`, `detalle-alquiler`, `renovaciones`, `gastos`
> **Versión declarada de la API:** `2.0.0`

> ⚠️ **Documento generado el 2026-10-19 sobre la rama local `dev` @ `14726ad`
> (anterior al commit `12760d4`).** Contenido parcialmente desactualizado:
> documenta 45 endpoints y routers `inventario`/`renovaciones` GET (**hoy 38 endpoints**, R-07).
> Contrasta con [AUD-2026-002](../01_auditorias/AUD-2026-002_auditoria_dev_remota_12760d4.md) para el estado vigente.
---

## 1. Sobre de respuesta estándar

Toda respuesta de la API (éxito o error) usa la misma estructura, definida en `app/utils/response.py`:

```json
{
  "status": true,
  "mensaje": "Alquiler creado correctamente",
  "data": { },
  "error": null,
  "code": 201
}
```

| Campo | Tipo | Significado |
|---|---|---|
| `status` | `boolean` | `true` en éxito, `false` en error. |
| `mensaje` | `string` | Mensaje legible en español, apto para mostrar en un toast. |
| `data` | `object \| array \| null` | Payload. En errores, suele ser `null` o un objeto mínimo. |
| `error` | `string \| null` | Código de error estable (ej. `ALQUILER_NOT_FOUND`). |
| `code` | `number` | Réplica del status HTTP. |

**Normalización de tipos** (`convertir_json`): `datetime`/`date`/`time` → ISO 8601; `Decimal` → `float`; diccionarios y listas se recorren recursivamente.

### 1.1 Manejo global de `HTTPException`

`app/main.py` registra un handler que **reescribe** la respuesta por defecto de FastAPI (`{"detail": "..."}`) al sobre estándar, con el código de error derivado del status HTTP:

| HTTP status | `error` |
|---|---|
| 401 | `AUTH_ERROR` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| Otro | `HTTP_ERROR` |

Esto garantiza que el cliente nunca tenga que tratar dos formatos de error distintos.

### 1.2 Códigos de error emitidos por los controladores

| Código | HTTP | Significado |
|---|---|---|
| `LOGIN_INVALID` | 401 | Credenciales incorrectas. |
| `LOGIN_VALIDATION_ERROR` | 400 | Faltan teléfono o email en el login. |
| `ALQUILER_VALIDATION_ERROR` | 400 | Regla de negocio de alquiler incumplida. |
| `ALQUILER_ESTADO_INVALIDO` | 400 | Transición de estado no permitida. |
| `ALQUILER_NO_CANCELABLE` | 400 | El alquiler no admite cancelación. |
| `ALQUILER_NOT_FOUND` | 404 | Alquiler inexistente. |
| `RENOVACION_NO_PERMITIDA` | 400 | Estado del alquiler incompatible con renovar. |
| `RENOVACION_NOT_FOUND` | 404 | No existe el evento de auditoría indicado. |
| `ENTREGA_NO_PERMITIDA` | 400 | Estado incompatible con registrar entrega. |
| `RECOGIDA_NO_PERMITIDA` | 400 | Sin entrega previa o estado incompatible. |
| `DETALLE_VALIDATION_ERROR` | 400 | Detalle inválido o stock insuficiente. |
| `DETALLE_NOT_FOUND` | 404 | Línea de detalle inexistente. |
| `USUARIO_VALIDATION_ERROR` / `USUARIO_ESTADO_INVALIDO` / `USUARIO_NOT_FOUND` | 400/400/404 | Módulo de usuarios. |
| `CLIENTE_VALIDATION_ERROR` / `CLIENTE_ESTADO_INVALIDO` / `CLIENTE_NOT_FOUND` | 400/400/404 | Módulo de clientes. |
| `PRODUCTO_VALIDATION_ERROR` / `PRODUCTO_ESTADO_INVALIDO` / `PRODUCTO_NOT_FOUND` | 400/400/404 | Módulo de productos. |
| `GASTO_VALIDATION_ERROR` | 400 | Gasto logístico inválido. |
| `AUTH_ERROR` / `FORBIDDEN` / `NOT_FOUND` / `HTTP_ERROR` | 401/403/404/var. | Emitidos por el handler global de `HTTPException`. |

> **Regla general de códigos de respuesta:** `200` para lecturas y mutaciones idempotentes, `201` para creaciones (`POST` de alquiler, entrega, recogida, gasto, usuario, cliente, producto, detalle), `400` para errores de negocio y de validación, `401` para token ausente/inválido/vencido, `403` para rol insuficiente, `404` para recurso inexistente, `422` para violation del schema Pydantic (formato estándar de FastAPI, no reescrito por el handler), `500` para errores no previstos.

---

## 2. Autenticación

Todas las rutas salvo `POST /api/sga/auth/login` y `GET /` exigen:

```
Authorization: Bearer <access_token>
```

El token se valida en `app/utils/auth_dependency.py` (`HTTPBearer(auto_error=False)`); los errores concretos (`TokenExpirado`, `TokenInvalido`) se convierten en `401` con mensaje en español.

**Payload del JWT:** `{ sub: <id_usuario>, rol_usuario: <rol>, iat, exp }` firmado con HS256. Caducidad por defecto: 480 minutos (8 h), configurable con `JWT_EXPIRE_MINUTES`.

### 2.1 Grupos de roles (`app/utils/roles.py`)

| Grupo | Roles incluidos |
|---|---|
| `SOLO_ADMIN` | `admin` |
| `ADMIN_O_FACTURACION` | `admin`, `encargado_facturacion` |
| `ADMIN_O_LOGISTICO` | `admin`, `encargado_logistico` |
| `STAFF_INTERNO` | `admin`, `encargado_facturacion`, `encargado_logistico` |

`cliente` **no aparece en ningún grupo**: no tiene acceso al sistema.

---

## 3. Módulos de la API

### 3.0 Health check

#### `GET /` — Público
Sin autenticación. Verifica que el proceso responde.

**Respuesta 200**
```json
{
  "status": true,
  "mensaje": "API SGA funcionando",
  "data": { "version": "2.0.0", "api": "/api/sga" },
  "error": null,
  "code": 200
}
```

---

### 3.1 Autenticación — `/api/sga/auth`

#### `POST /api/sga/auth/login` — Público

**Request body** (`LoginRequest`)

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `telefono_usuario` | `string` | Condicional | Identificador de login (preferente). |
| `email_usuario` | `string` | Condicional | Alternativa a `telefono_usuario`. |
| `contrasena_usuario` | `string` | **Sí** | Texto plano; se compara contra el hash bcrypt. |

Al menos uno de `telefono_usuario` / `email_usuario` es obligatorio (si no, `400 LOGIN_VALIDATION_ERROR`).

**Respuesta 200**
```json
{
  "status": true,
  "mensaje": "Login exitoso",
  "data": {
    "logueado": true,
    "id_usuario": "1001234567",
    "rol_usuario": "admin",
    "nombres_usuario": "Francisco Gabriel",
    "apellidos_usuario": "Rodriguez Sanabria",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
  },
  "error": null,
  "code": 200
}
```

**Errores:** `400 LOGIN_VALIDATION_ERROR` · `401 LOGIN_INVALID` (credenciales incorrectas) · `500`.

---

### 3.2 Usuarios (personal interno) — `/api/sga/usuarios`

> Gestiona **únicamente personal** (`admin`, `encargado_facturacion`, `encargado_logistico`). Los clientes se gestionan en `/api/sga/clientes`.

#### `POST /api/sga/usuarios` — `SOLO_ADMIN`

**Request body** (`UsuarioCreate`)

| Campo | Tipo | Requerido | Restricciones |
|---|---|---|---|
| `id_usuario` | `string` | **Sí** | máx. 20 chars (documento). Debe ser único. |
| `rol_usuario` | `string` | **Sí** | Uno de `admin`, `encargado_facturacion`, `encargado_logistico`. |
| `nombres_usuario` | `string` | **Sí** | máx. 100 |
| `apellidos_usuario` | `string` | **Sí** | máx. 100 |
| `email_usuario` | `string \| null` | No | máx. 100, único. |
| `telefono_usuario` | `string` | **Sí** | máx. 20, único. |
| `contrasena_usuario` | `string` | **Sí** | mín. 4 chars; se hashea con bcrypt. |
| `tipo_documento` | `string` | **Sí** | `CC` \| `CE` \| `NIT` \| `PPT`. |

**Respuesta 201** — `data`: `{ id_usuario, rol_usuario, nombres_usuario, apellidos_usuario }`.
**Errores:** `400 USUARIO_VALIDATION_ERROR` (duplicados de id/teléfono/email) · `500`.

#### `GET /api/sga/usuarios` — `STAFF_INTERNO`

**Query params**

| Param | Tipo | Default | Notas |
|---|---|---|---|
| `rol_usuario` | `string` | — | Filtro exacto por rol. |

**Restricción adicional (fuera del decorador):** si el rol del solicitante **no es `admin`**, el único valor admitido en `rol_usuario` es `encargado_logistico`; cualquier otro valor (o su ausencia) devuelve `403 FORBIDDEN`. Para `admin`, sin filtro, la lista **excluye** los clientes (`rol_usuario <> 'cliente'`).

**Respuesta 200** — `data`: array de
`{ id_usuario, rol_usuario, nombres_usuario, apellidos_usuario, email_usuario, telefono_usuario, tipo_documento, estado_registro, fecha_creacion, fecha_actualizacion }`, ordenado por `nombres_usuario, apellidos_usuario`.

**Errores:** `403 FORBIDDEN` · `500`.

#### `GET /api/sga/usuarios/{id_usuario}` — `SOLO_ADMIN`

**Path param:** `id_usuario` (string, documento).

**Respuesta 200** — `data`: objeto `usuario` completo.
**Errores:** `404 USUARIO_NOT_FOUND` · `500`.

#### `PATCH|PUT /api/sga/usuarios/{id_usuario}` — `SOLO_ADMIN`

**Request body** (`UsuarioUpdate`, todos opcionales) — solo se aplican los campos presentes (`exclude_unset`).

| Campo | Tipo | Notas |
|---|---|---|
| `nombres_usuario` | `string` | máx. 100 |
| `apellidos_usuario` | `string` | máx. 100 |
| `email_usuario` | `string \| null` | máx. 100, único |
| `telefono_usuario` | `string` | máx. 20, único |
| `rol_usuario` | `string` | Solo roles de personal (no `cliente`). |
| `contrasena_usuario` | `string` | mín. 4; se re-hashea con bcrypt. |

**Respuesta 200** — `data`: `{ id_usuario, rol_usuario, nombres_usuario, apellidos_usuario, email_usuario, telefono_usuario }`.
**Errores:** `400 USUARIO_VALIDATION_ERROR` · `404 USUARIO_NOT_FOUND` · `500`.

#### `PATCH /api/sga/usuarios/{id_usuario}/estado` — `SOLO_ADMIN`

**Request body** (`UsuarioEstadoUpdate`): `{ "estado_registro": true | false }` — borrado lógico/activación.

**Respuesta 200** — `data`: `{ id_usuario, estado_registro }`.

> La BD puede rechazar la operación si se desactivaría al único admin activo o si un admin intenta desactivarse a sí mismo (`trg_garantizar_minimo_un_admin` / `trg_impedir_autodesactivacion_admin`); el mensaje de la BD se traduce a `400`.

**Errores:** `400 USUARIO_ESTADO_INVALIDO` · `404 USUARIO_NOT_FOUND` · `500`.

---

### 3.3 Clientes — `/api/sga/clientes`

> Operan sobre la misma tabla `usuario` con `rol_usuario = 'cliente'`. El rol se fuerza en el controller; el schema no lo expone.

#### `POST /api/sga/clientes` — `ADMIN_O_FACTURACION`

**Request body** (`ClienteCreate`)

| Campo | Tipo | Requerido | Restricciones |
|---|---|---|---|
| `id_usuario` | `string` | **Sí** | máx. 20 (documento). |
| `nombres_usuario` | `string` | **Sí** | máx. 100 |
| `apellidos_usuario` | `string` | **Sí** | máx. 100 |
| `telefono_usuario` | `string` | **Sí** | máx. 20, único. |
| `email_usuario` | `string \| null` | No | máx. 100. |
| `tipo_documento` | `string` | **Sí** | `CC` \| `CE` \| `NIT` \| `PPT`. |

> No se acepta `contrasena_usuario`: el cliente se registra en punto de venta y no inicia sesión (RN-CLI-01).

**Respuesta 201** — `data`: `{ id_usuario, nombres_usuario, apellidos_usuario }`.
**Errores:** `400 CLIENTE_VALIDATION_ERROR` · `500`.

#### `GET /api/sga/clientes` — `STAFF_INTERNO`

**Query params:** `busqueda` (string, opcional) — filtro por nombre/apellido/documento/teléfono.

**Respuesta 200** — `data`: array de objetos `cliente` con datos personales y de contacto (sin credenciales).
**Errores:** `500`.

#### `GET /api/sga/clientes/{id_usuario}` — `STAFF_INTERNO`

**Respuesta 200** — `data`: objeto `cliente`.
**Errores:** `404 CLIENTE_NOT_FOUND` · `500`.

#### `PATCH|PUT /api/sga/clientes/{id_usuario}` — `ADMIN_O_FACTURACION`

**Request body** (`ClienteUpdate`, todo opcional): `nombres_usuario`, `apellidos_usuario`, `telefono_usuario`, `email_usuario`.

**Respuesta 200** — `data`: `{ id_usuario, nombres_usuario, apellidos_usuario, telefono_usuario, email_usuario }`.
**Errores:** `400 CLIENTE_VALIDATION_ERROR` · `404 CLIENTE_NOT_FOUND` · `500`.

#### `PATCH /api/sga/clientes/{id_usuario}/estado` — `ADMIN_O_FACTURACION`

**Request body** (`ClienteEstadoUpdate`): `{ "estado_registro": boolean }`.

**Respuesta 200** — `data`: `{ id_usuario, estado_registro }`.
**Errores:** `400 CLIENTE_ESTADO_INVALIDO` · `404 CLIENTE_NOT_FOUND` · `500`.

---

### 3.4 Productos — `/api/sga/productos`

#### `POST /api/sga/productos` — `SOLO_ADMIN`

**Request body** (`ProductoCreate`)

| Campo | Tipo | Requerido | Restricciones |
|---|---|---|---|
| `nombre_producto` | `string` | **Sí** | máx. 100 |
| `descripcion_producto` | `string \| null` | No | máx. 300 |
| `precio_base_producto` | `number (Decimal)` | **Sí** | `>= 0`. Precio **por** `unidad_minima_alquiler`. |
| `precio_base_extra` | `number \| null` | No | `>= 0`. Si se omite, el controller lo iguala a `precio_base_producto`. |
| `stock_total` | `integer` | **Sí** | `>= 0` |
| `unidad_minima_alquiler` | `"DIA" \| "SEMANA" \| "MES"` | No | Default `DIA`. |

**Respuesta 201** — `data`: `{ id_producto, nombre_producto, stock_total }`.
**Errores:** `400 PRODUCTO_VALIDATION_ERROR` · `500`.

#### `GET /api/sga/productos` — `STAFF_INTERNO`

**Query params:** `solo_activos` (boolean, default `true`).

**Respuesta 200** — `data`: array de
`{ id_producto, nombre_producto, descripcion_producto, precio_base_producto, precio_base_extra, unidad_minima_alquiler, stock_total, stock_alquilado, stock_disponible, estado_registro, fecha_creacion, fecha_actualizacion }`.

> `stock_disponible` es un campo **calculado por la consulta** (`stock_total - stock_alquilado`), no una columna.

**Errores:** `500`.

#### `GET /api/sga/productos/{id_producto}` — `STAFF_INTERNO`

**Respuesta 200** — `data`: objeto `producto` (misma forma que un elemento de la lista).
**Errores:** `404 PRODUCTO_NOT_FOUND` · `500`.

#### `PATCH|PUT /api/sga/productos/{id_producto}` — `SOLO_ADMIN`

**Request body** (`ProductoUpdate`, todo opcional): `nombre_producto`, `descripcion_producto`, `precio_base_producto`, `precio_base_extra`, `stock_total`, `unidad_minima_alquiler`.

> `stock_alquilado` **no** es editable por API (lo sincronizan los triggers).

**Respuesta 200** — `data`: objeto `producto` completo.
**Errores:** `400 PRODUCTO_VALIDATION_ERROR` (incluye el ajuste de `stock_total` por debajo del stock alquilado, validado por la BD) · `404 PRODUCTO_NOT_FOUND` · `500`.

#### `PATCH /api/sga/productos/{id_producto}/estado` — `SOLO_ADMIN`

**Request body** (`ProductoEstadoUpdate`): `{ "estado_registro": boolean }`.

**Respuesta 200** — `data`: objeto `producto` completo.
**Errores:** `400 PRODUCTO_ESTADO_INVALIDO` (producto con unidades en obra) · `404 PRODUCTO_NOT_FOUND` · `500`.

---

### 3.5 Inventario — `/api/sga/inventario`

#### `GET /api/sga/inventario` — `STAFF_INTERNO`

**Respuesta 200**
```json
{
  "status": true,
  "mensaje": "Inventario consultado correctamente",
  "data": {
    "productos": [ /* objetos producto, solo estado_registro = TRUE */ ],
    "totales": {
      "stock_total": 915,
      "stock_alquilado": 0,
      "stock_disponible": 915
    }
  },
  "error": null,
  "code": 200
}
```

**Errores:** `500`.

#### `GET /api/sga/inventario/productos/{id_producto}` — `ADMIN_O_FACTURACION`

**Respuesta 200** — `data`: objeto `producto` con `stock_disponible`.
**Errores:** `404 PRODUCTO_NOT_FOUND` · `500`.

---

### 3.6 Alquileres — `/api/sga/alquileres`

> Todos los endpoints exigen `STAFF_INTERNO` como mínimo (el router completo requiere `get_current_user`).

#### `GET /api/sga/alquileres/buscar` — `STAFF_INTERNO`

> Ruta declarada **antes** de `/{id_alquiler}` para que FastAPI no la interprete como un id.

**Query params** (todos opcionales): `cliente` (string), `numero` (int → `id_alquiler`), `barrio` (string).

**Búsqueda:** `cliente` con `ILIKE` sobre `nombres_usuario`, `apellidos_usuario` e `id_usuario`; `barrio` con `ILIKE`; `numero` por igualdad exacta de `id_alquiler`.

**Respuesta 200** — `data`: array de `alquiler` (formato descrito en §3.6.1).
**Errores:** `500`.

#### `GET /api/sga/alquileres/proximos-vencer` — `STAFF_INTERNO`

**Query params:** `dias` (int, default `2`).

**Semántica:** alquileres en estado `activo` cuyo vencimiento (`fecha_inicio + tiempo_alquiler_dias - 1`) cae entre hoy y hoy + `dias` días. Orden ascendente por fecha de vencimiento.

**Respuesta 200** — `data`: array de `alquiler`.
**Errores:** `500`.

#### `GET /api/sga/alquileres/pendientes-entrega` — `STAFF_INTERNO`

**Query params:** `solo_transporte` (boolean, default `false`).
- `false` → todos los alquileres en estado `pendiente`.
- `true` → solo los `pendiente` con `se_lleva = TRUE`.

**Respuesta 200** — `data`: array de `alquiler`.
**Errores:** `500`.

#### `POST /api/sga/alquileres` — `ADMIN_O_FACTURACION`

**Request body** (`AlquilerCreate`)

| Campo | Tipo | Requerido | Restricciones / Notas |
|---|---|---|---|
| `id_usuario_cliente` | `string` | **Sí** | máx. 20. Debe existir como usuario con rol `cliente`. |
| `barrio` | `string` | **Sí** | máx. 100 |
| `direccion` | `string` | **Sí** | máx. 255 |
| `deposito` | `number (Decimal)` | **Sí** | `>= 0` |
| `precio_alquiler` | `number (Decimal)` | **Sí** | `> 0`. Se persiste tal cual (no se recalcula). |
| `fecha_inicio` | `date` (ISO) | **Sí** | No puede ser anterior a hoy (trigger `trg_validar_fecha_inicio`). |
| `tiempo_alquiler_dias` | `integer` | **Sí** | `> 0`. Debe ser compatible con la `unidad_minima_alquiler` de todos los productos. |
| `se_lleva` | `boolean` | No | Default `true` |
| `se_recoge` | `boolean` | No | Default `true` |
| `detalles` | `array` | **Sí** | `min_length = 1`. Ver `DetalleAlquilerInline`. |

`DetalleAlquilerInline`:

| Campo | Tipo | Requerido | Restricciones |
|---|---|---|---|
| `id_producto` | `integer` | **Sí** | Debe existir y estar activo. |
| `cantidad_productos` | `integer` | **Sí** | `> 0` |
| `precio_conjunto` | `number (Decimal)` | **Sí** | `>= 0` |
| `es_producto_extra` | `boolean` | No | Default `false` |

> **El payload NO puede atribuir el alquiler a otro usuario:** `id_usuario_creador` se toma siempre del JWT.

**Respuesta 201** — `data`: objeto `alquiler` completo (incluye `detalles`).
**Errores:** `400 ALQUILER_VALIDATION_ERROR` (incluye mensajes de trigger: stock insuficiente, fecha inválida, unidad mínima incompatible) · `500`.

#### `GET /api/sga/alquileres` — `STAFF_INTERNO`

**Query params** (opcionales): `estado_alquiler` (string), `id_usuario_cliente` (string).

Orden: `fecha_creacion DESC`.

**Respuesta 200** — `data`: array de `alquiler`.
**Errores:** `500`.

#### `GET /api/sga/alquileres/{id_alquiler}` — `STAFF_INTERNO`

**Respuesta 200** — `data`: objeto `alquiler` (con `detalles` anidados).
**Errores:** `404 ALQUILER_NOT_FOUND` · `500`.

#### `GET /api/sga/alquileres/{id_alquiler}/detalles` — `STAFF_INTERNO`

**Respuesta 200** — `data`: array de
`{ id_detalle_alquiler, id_alquiler, id_producto, nombre_producto, precio_base_producto, unidad_minima_alquiler, cantidad_productos, precio_conjunto, es_producto_extra, estado_registro, fecha_creacion, fecha_actualizacion }`.

Incluye datos del producto por `JOIN` para evitar consultas N+1 desde el cliente.
**Errores:** `500`.

#### `PATCH|PUT /api/sga/alquileres/{id_alquiler}` — `ADMIN_O_FACTURACION`

**Request body** (`AlquilerUpdate`, todos opcionales): `barrio`, `direccion`, `deposito`, `precio_alquiler`, `fecha_inicio`, `tiempo_alquiler_dias`, `se_lleva`, `se_recoge`.

**Matriz de campos editables por estado** (aplicada en `alquiler_controller.CAMPOS_EDITABLES_POR_ESTADO`):

| Estado | Campos permitidos |
|---|---|
| `pendiente` | `direccion`, `barrio`, `precio_alquiler`, `deposito`, `fecha_inicio`, `tiempo_alquiler_dias`, `se_lleva`, `se_recoge` |
| `activo` | `precio_alquiler`, `tiempo_alquiler_dias`, `se_lleva`, `se_recoge` |
| `vencido` | `precio_alquiler`, `tiempo_alquiler_dias` |
| `recogido` / `terminado` / `cancelado` | *(ninguno)* |

Intentar modificar un campo no permitido devuelve `400` indicando el estado y los campos rechazados.

**Tratamiento de `tiempo_alquiler_dias`:**
- **Aumento** → se trata como **renovación** (se aplican las mismas reglas: días compatibles con la unidad mínima de los productos; si el alquiler estaba `vencido` y la nueva fecha de vencimiento es ≥ hoy, vuelve a `activo`).
- **Disminución** → corrección administrativa; se rechaza si la nueva fecha de vencimiento quedaría en el pasado.

**Respuesta 200** — `data`: objeto `alquiler` completo.
**Errores:** `400 ALQUILER_VALIDATION_ERROR` · `404 ALQUILER_NOT_FOUND` · `500`.

#### `PATCH /api/sga/alquileres/{id_alquiler}/estado` — `STAFF_INTERNO`

**Request body** (`AlquilerEstadoUpdate`): `{ "estado_alquiler": string }` con valor en `pendiente|activo|vencido|recogido|terminado|cancelado` (validado por `field_validator`).

**Grafo de transiciones permitidas**

| Estado actual | Estados destino |
|---|---|
| `pendiente` | `activo`, `cancelado` |
| `activo` | `vencido`, `recogido`, `terminado`, `cancelado` |
| `vencido` | `recogido`, `terminado`, `cancelado` |
| `recogido` | `terminado` |
| `terminado` | — |
| `cancelado` | — |

Una transición no permitida devuelve `400 ALQUILER_ESTADO_INVALIDO`; cambiar al mismo estado también.

**Respuesta 200** — `data`: objeto `alquiler` completo.
**Errores:** `400 ALQUILER_ESTADO_INVALIDO` · `404 ALQUILER_NOT_FOUND` · `500`.

#### `DELETE /api/sga/alquileres/{id_alquiler}` — `ADMIN_O_FACTURACION`

**Semántica:** *no* es un borrado físico. Ejecuta la transición a `cancelado` (borrado lógico del ciclo de vida).

**Respuesta 200** — `data`: objeto `alquiler` con `estado_alquiler = "cancelado"`.
**Errores:** `400 ALQUILER_NO_CANCELABLE` · `404 ALQUILER_NOT_FOUND` · `500`.

#### `GET /api/sga/alquileres/{id_alquiler}/historial` — `ADMIN_O_FACTURACION`

**Respuesta 200**
```json
{
  "status": true,
  "mensaje": "Historial del alquiler",
  "data": {
    "id_alquiler": 12,
    "total_eventos": 5,
    "eventos": [
      {
        "id_auditoria": 88,
        "tipo_operacion": "UPDATE",
        "datos_anteriores": { },
        "datos_nuevos": { },
        "id_usuario_accion": "1001234567",
        "nombres_usuario_accion": "Francisco Gabriel",
        "apellidos_usuario_accion": "Rodriguez Sanabria",
        "fecha_accion": "2026-10-19T08:15:31.204"
      }
    ]
  },
  "error": null,
  "code": 200
}
```

Orden: más reciente → más antiguo. Los eventos provienen de `auditoria_sistema` (`nombre_tabla = 'alquiler'`).
**Errores:** `404 ALQUILER_NOT_FOUND` (si el alquiler no existe) · `500`.

#### `POST /api/sga/alquileres/{id_alquiler}/renovaciones` — `ADMIN_O_FACTURACION`

**Request body** (`RenovacionCreate`)

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `dias` | `integer` | **Sí** | `> 0`. Se **suman** al período existente. Debe cumplir la unidad mínima de los productos ya incluidos. |
| `precio_alquiler` | `number \| null` | No | `> 0`. Si se envía, reemplaza el precio total; si se omite, el precio no cambia. |

**Reglas:**
- Solo se renueva un alquiler en estado `activo` o `vencido`; en otro caso, `400 RENOVACION_NO_PERMITIDA`.
- Si el alquiler estaba `vencido` y la nueva fecha de vencimiento es ≥ hoy, vuelve automáticamente a `activo`.

**Respuesta 200** — `data`: objeto `alquiler` completo **más** el campo `id_auditoria_renovacion` (id del evento de auditoría generado), que permite consultar el detalle vía `GET /api/sga/renovaciones/{id_auditoria}`.

**Errores:** `400 RENOVACION_NO_PERMITIDA` · `404 ALQUILER_NOT_FOUND` · `500`.

---

### 3.7 Entregas y recogidas — `/api/sga/alquileres/{id_alquiler}/...`

#### `POST /api/sga/alquileres/{id_alquiler}/entregas` — `STAFF_INTERNO`

**Request body** (`EntregaCreate`)

| Campo | Tipo | Requerido | Default |
|---|---|---|---|
| `observaciones_logistica_alquiler` | `string \| null` | No | `null` |
| `valor_gasto_logistico` | `number (Decimal)` | No | `0.00` |
| `descripcion_gasto_logistico` | `string \| null` | No | `null` |

**Efectos:** inserta una fila en `logistica_alquiler` con `tipo_movimiento = 'ENTREGA'` y `id_usuario_logistico` tomado del JWT; crea la fila puente; **transiciona el alquiler de `pendiente` a `activo`**.

**Restricción:** el alquiler debe estar en `pendiente`; en otro caso, `400 ENTREGA_NO_PERMITIDA`.

**Respuesta 201** — `data`: `{ id_logistica_alquiler, id_alquiler, tipo_movimiento }`.
**Errores:** `400 ENTREGA_NO_PERMITIDA` · `404 ALQUILER_NOT_FOUND` · `500`.

#### `GET /api/sga/alquileres/{id_alquiler}/entregas` — `STAFF_INTERNO`

**Respuesta 200** — `data`: array de
`{ id_logistica_alquiler, id_alquiler, id_usuario_logistico, nombres_logistico, fecha_gasto, descripcion_gasto_logistico, valor_gasto_logistico, observaciones_logistica_alquiler }` (solo `tipo_movimiento = 'ENTREGA'` y `estado_registro = TRUE`).

**Errores:** `500`.

#### `POST /api/sga/alquileres/{id_alquiler}/recogidas` — `STAFF_INTERNO`

**Request body** (`RecogidaCreate`): misma forma que `EntregaCreate`.

**Efectos:** inserta `logistica_alquiler` con `tipo_movimiento = 'RECOGIDA'`; crea la fila puente; **transiciona el alquiler a `recogido`**.

**Restricciones (RN-LOG-04):**
- Debe existir una **entrega previa** para ese alquiler; si no, `400 RECOGIDA_NO_PERMITIDA`.
- El alquiler debe estar en `activo` o `vencido`.

**Respuesta 201** — `data`: `{ id_logistica_alquiler, id_alquiler, tipo_movimiento }`.
**Errores:** `400 RECOGIDA_NO_PERMITIDA` · `404 ALQUILER_NOT_FOUND` · `500`.

#### `GET /api/sga/alquileres/{id_alquiler}/recogidas` — `STAFF_INTERNO`

**Respuesta 200** — `data`: array con la misma forma que el listado de entregas, filtrado por `tipo_movimiento = 'RECOGIDA'`.
**Errores:** `500`.

---

### 3.8 Detalle de alquiler — `/api/sga/detalle-alquiler`

#### `POST /api/sga/detalle-alquiler` — `ADMIN_O_FACTURACION`

**Request body** (`DetalleAlquilerCreate`)

| Campo | Tipo | Requerido | Restricciones |
|---|---|---|---|
| `id_alquiler` | `integer` | **Sí** | El alquiler debe estar en `pendiente` o `activo`. |
| `id_producto` | `integer` | **Sí** | Debe existir. |
| `cantidad_productos` | `integer` | **Sí** | `> 0` |
| `precio_conjunto` | `number (Decimal)` | **Sí** | `>= 0` |
| `es_producto_extra` | `boolean` | No | Default `false` |

**Efecto colateral:** el trigger de stock descuenta automáticamente la cantidad del `stock_alquilado` del producto.

**Respuesta 201** — `data`: objeto `detalle` con datos del producto por JOIN.
**Errores:** `400 DETALLE_VALIDATION_ERROR` (incluye "Stock insuficiente" y "Los productos de un alquiler solo pueden modificarse en estado 'pendiente' o 'activo'") · `500`.

#### `GET /api/sga/detalle-alquiler/{id_detalle_alquiler}` — `STAFF_INTERNO`

**Respuesta 200** — `data`: `{ id_detalle_alquiler, id_alquiler, id_producto, nombre_producto, cantidad_productos, precio_conjunto, es_producto_extra, estado_registro, fecha_creacion, fecha_actualizacion }`.
**Errores:** `404 DETALLE_NOT_FOUND` · `500`.

#### `PATCH /api/sga/detalle-alquiler/{id_detalle_alquiler}` — `ADMIN_O_FACTURACION`

**Request body** (`DetalleAlquilerUpdate`, todo opcional): `cantidad_productos` (`> 0`), `precio_conjunto` (`>= 0`).

> `id_producto` no es modificable: el trigger `fn_validar_detalle_alquiler` lo rechaza explícitamente.

**Respuesta 200** — `data`: objeto `detalle` actualizado.
**Errores:** `400 DETALLE_VALIDATION_ERROR` · `404 DETALLE_NOT_FOUND` · `500`.

---

### 3.9 Renovaciones (consulta) — `/api/sga/renovaciones`

#### `GET /api/sga/renovaciones/{id_auditoria}` — `ADMIN_O_FACTURACION`

**Path param:** `id_auditoria` (integer) — el valor devuelto en `id_auditoria_renovacion` por el `POST .../renovaciones`.

**Semántica:** no existe tabla `renovaciones`; una renovación es un evento `UPDATE` sobre `alquiler` registrado en `auditoria_sistema`. Este endpoint valida que el registro exista, que `nombre_tabla = 'alquiler'` y que `tipo_operacion = 'UPDATE'`.

**Respuesta 200** — `data`:
```json
{
  "id_auditoria": 88,
  "nombre_tabla": "alquiler",
  "tipo_operacion": "UPDATE",
  "id_registro_afectado": "12",
  "datos_anteriores": { },
  "datos_nuevos": { },
  "id_usuario_accion": "1001234567",
  "nombres_usuario_accion": "Francisco Gabriel",
  "apellidos_usuario_accion": "Rodriguez Sanabria",
  "fecha_accion": "2026-10-19T08:15:31.204"
}
```

**Errores:** `404 RENOVACION_NOT_FOUND` · `500`.

---

### 3.10 Gastos logísticos — `/api/sga/gastos`

#### `POST /api/sga/gastos` — `STAFF_INTERNO`

**Request body** (`GastoCreate`)

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `ids_alquiler` | `array<integer>` | **Sí** | `min_length = 1`. Un mismo gasto puede servir a varios alquileres. |
| `valor_gasto_logistico` | `number (Decimal)` | **Sí** | `>= 0` (validado por `CHECK` en BD). |
| `descripcion_gasto_logistico` | `string \| null` | No | |
| `observaciones_logistica_alquiler` | `string \| null` | No | |

**Efectos:** inserta `logistica_alquiler` con `tipo_movimiento = 'GASTO'` y el usuario del JWT; crea **una fila puente por cada** `ids_alquiler`. No produce transición de estado en ningún alquiler.

**Respuesta 201** — `data`: `{ id_logistica_alquiler, tipo_movimiento, valor_gasto_logistico, ids_alquiler }`.
**Errores:** `400 GASTO_VALIDATION_ERROR` · `500`.

#### `GET /api/sga/gastos` — `STAFF_INTERNO`

**Query params:** `id_alquiler` (integer, opcional) — filtra los gastos asociados a un alquiler.

**Respuesta 200** — `data`: array de
`{ id_logistica_alquiler, id_usuario_logistico, nombres_logistico, fecha_gasto, descripcion_gasto_logistico, valor_gasto_logistico, observaciones_logistica_alquiler, tipo_movimiento, ids_alquiler: number[] }`.

Solo devuelve `tipo_movimiento = 'GASTO'`. Orden: `fecha_gasto DESC`.
**Errores:** `500`.

#### `GET /api/sga/gastos/resumen-semanal` — `ADMIN_O_FACTURACION`

**Respuesta 200** — `data`: array de
`{ semana_inicio: "2026-10-12", cantidad_registros: 7, total_gasto: 245000.0 }`.

Agrupa **todos** los movimientos de `logistica_alquiler` (sin filtrar por `tipo_movimiento`) por semana ISO (`date_trunc('week', ...)`), orden descendente.
**Errores:** `500`.

---

## 3.6.1 Formato del objeto `alquiler` (respuesta de lectura)

```json
{
  "id_alquiler": 12,
  "estado_alquiler": "activo",
  "barrio": "Chapinero",
  "direccion": "Calle 45 # 12-30",
  "deposito": 500000.0,
  "precio_alquiler": 1250000.0,
  "fecha_inicio": "2026-10-01",
  "tiempo_alquiler_dias": 15,
  "fecha_vencimiento": "2026-10-15",
  "se_lleva": true,
  "se_recoge": true,
  "estado_registro": true,
  "fecha_creacion": "2026-09-30T14:02:11.882",
  "fecha_actualizacion": "2026-10-01T09:10:44.130",
  "id_usuario_creador": "1001234567",
  "nombres_creador": "Francisco Gabriel",
  "apellidos_creador": "Rodriguez Sanabria",
  "id_usuario_cliente": "80123456",
  "nombres_cliente": "Juan David",
  "apellidos_cliente": "Martínez",
  "detalles": [
    {
      "id_detalle_alquiler": 33,
      "id_producto": 1,
      "nombre_producto": "Sección de andamio ancha",
      "cantidad_productos": 10,
      "precio_conjunto": 300000.0,
      "es_producto_extra": false,
      "estado_registro": true
    }
  ],
  "dias_restantes": 0,
  "dias_vencido": null,
  "vence_hoy": true,
  "inicio_pendiente": false
}
```

**Campos derivados** (`app/utils/tiempo.py:enriquecer_temporal`):

| Campo | Tipo | Significado |
|---|---|---|
| `fecha_vencimiento` | `date` | `fecha_inicio + (tiempo_alquiler_dias − 1)` |
| `dias_restantes` | `int \| null` | Solo en `activo`: días hasta el vencimiento. `0` si vence hoy. |
| `dias_vencido` | `int \| null` | Días transcurridos desde el vencimiento (en `activo` vencido o en `vencido`). |
| `vence_hoy` | `boolean` | `true` si hoy es la fecha de vencimiento y el alquiler está `activo`. |
| `inicio_pendiente` | `boolean` | `true` si el alquiler está `activo` pero aún no ha iniciado. |

> `detalles` solo se incluye en la respuesta de `GET /alquileres/{id}`; en los listados (`GET /alquileres`, `/buscar`, `/proximos-vencer`, `/pendientes-entrega`) no viene anidado.

---

## 4. Resumen consolidado de endpoints

| # | Método | Ruta | Rol mínimo | Éxito |
|---|---|---|---|---|
| 1 | `GET` | `/` | Público | 200 |
| 2 | `POST` | `/api/sga/auth/login` | Público | 200 |
| 3 | `POST` | `/api/sga/usuarios` | `admin` | 201 |
| 4 | `GET` | `/api/sga/usuarios` | `STAFF_INTERNO` (restringido) | 200 |
| 5 | `GET` | `/api/sga/usuarios/{id_usuario}` | `admin` | 200 |
| 6 | `PATCH`/`PUT` | `/api/sga/usuarios/{id_usuario}` | `admin` | 200 |
| 7 | `PATCH` | `/api/sga/usuarios/{id_usuario}/estado` | `admin` | 200 |
| 8 | `POST` | `/api/sga/clientes` | `ADMIN_O_FACTURACION` | 201 |
| 9 | `GET` | `/api/sga/clientes` | `STAFF_INTERNO` | 200 |
| 10 | `GET` | `/api/sga/clientes/{id_usuario}` | `STAFF_INTERNO` | 200 |
| 11 | `PATCH`/`PUT` | `/api/sga/clientes/{id_usuario}` | `ADMIN_O_FACTURACION` | 200 |
| 12 | `PATCH` | `/api/sga/clientes/{id_usuario}/estado` | `ADMIN_O_FACTURACION` | 200 |
| 13 | `POST` | `/api/sga/productos` | `admin` | 201 |
| 14 | `GET` | `/api/sga/productos` | `STAFF_INTERNO` | 200 |
| 15 | `GET` | `/api/sga/productos/{id_producto}` | `STAFF_INTERNO` | 200 |
| 16 | `PATCH`/`PUT` | `/api/sga/productos/{id_producto}` | `admin` | 200 |
| 17 | `PATCH` | `/api/sga/productos/{id_producto}/estado` | `admin` | 200 |
| 18 | `GET` | `/api/sga/inventario` | `STAFF_INTERNO` | 200 |
| 19 | `GET` | `/api/sga/inventario/productos/{id_producto}` | `ADMIN_O_FACTURACION` | 200 |
| 20 | `GET` | `/api/sga/alquileres/buscar` | `STAFF_INTERNO` | 200 |
| 21 | `GET` | `/api/sga/alquileres/proximos-vencer` | `STAFF_INTERNO` | 200 |
| 22 | `GET` | `/api/sga/alquileres/pendientes-entrega` | `STAFF_INTERNO` | 200 |
| 23 | `POST` | `/api/sga/alquileres` | `ADMIN_O_FACTURACION` | 201 |
| 24 | `GET` | `/api/sga/alquileres` | `STAFF_INTERNO` | 200 |
| 25 | `GET` | `/api/sga/alquileres/{id_alquiler}` | `STAFF_INTERNO` | 200 |
| 26 | `GET` | `/api/sga/alquileres/{id_alquiler}/detalles` | `STAFF_INTERNO` | 200 |
| 27 | `PATCH`/`PUT` | `/api/sga/alquileres/{id_alquiler}` | `ADMIN_O_FACTURACION` | 200 |
| 28 | `PATCH` | `/api/sga/alquileres/{id_alquiler}/estado` | `STAFF_INTERNO` | 200 |
| 29 | `DELETE` | `/api/sga/alquileres/{id_alquiler}` | `ADMIN_O_FACTURACION` | 200 |
| 30 | `GET` | `/api/sga/alquileres/{id_alquiler}/historial` | `ADMIN_O_FACTURACION` | 200 |
| 31 | `POST` | `/api/sga/alquileres/{id_alquiler}/renovaciones` | `ADMIN_O_FACTURACION` | 200 |
| 32 | `POST` | `/api/sga/alquileres/{id_alquiler}/entregas` | `STAFF_INTERNO` | 201 |
| 33 | `GET` | `/api/sga/alquileres/{id_alquiler}/entregas` | `STAFF_INTERNO` | 200 |
| 34 | `POST` | `/api/sga/alquileres/{id_alquiler}/recogidas` | `STAFF_INTERNO` | 201 |
| 35 | `GET` | `/api/sga/alquileres/{id_alquiler}/recogidas` | `STAFF_INTERNO` | 200 |
| 36 | `POST` | `/api/sga/detalle-alquiler` | `ADMIN_O_FACTURACION` | 201 |
| 37 | `GET` | `/api/sga/detalle-alquiler/{id_detalle_alquiler}` | `STAFF_INTERNO` | 200 |
| 38 | `PATCH` | `/api/sga/detalle-alquiler/{id_detalle_alquiler}` | `ADMIN_O_FACTURACION` | 200 |
| 39 | `GET` | `/api/sga/renovaciones/{id_auditoria}` | `ADMIN_O_FACTURACION` | 200 |
| 40 | `POST` | `/api/sga/gastos` | `STAFF_INTERNO` | 201 |
| 41 | `GET` | `/api/sga/gastos` | `STAFF_INTERNO` | 200 |
| 42 | `GET` | `/api/sga/gastos/resumen-semanal` | `ADMIN_O_FACTURACION` | 200 |

**Total: 42 operaciones** (41 rutas distintas, 3 de ellas con doble verbo `PATCH`+`PUT`).

---

## 5. Observaciones de auditoría sobre el contrato

1. **Ausencia de paginación** en todos los listados (`GET /alquileres`, `/clientes`, `/productos`, `/gastos`, `/usuarios`). Con volumen alto, la respuesta crece sin límite.
2. **Sin endpoint de "reabrir alquiler"**: la función `fn_admin_reabrir_alquiler` existe en la BD pero no está expuesta por HTTP.
3. **`GET /alquileres/{id}/historial` es `ADMIN_O_FACTURACION`**, mientras que el resto de la consulta de alquileres es `STAFF_INTERNO`: el logístico puede ver el alquiler pero no su trazabilidad.
4. **`GET /gastos/resumen-semanal` no filtra por `tipo_movimiento`**: el resumen semanal incluye entregas y recogidas, no solo gastos.
5. **`PATCH /alquileres/{id}/estado` es `STAFF_INTERNO`**: el logístico puede mover el contrato a `vencido` o `cancelado` sin ser `ADMIN_O_FACTURACION`.
6. **Contrato de tipos desalineado en el frontend**: `src/api/alquileres.ts` y `src/api/gastos.ts` declaran el campo `es_recogida`, que ya no existe en el modelo de datos (fue sustituido por `tipo_movimiento`).
7. **Contrato del historial desalineado**: la interfaz `HistorialAlquiler` del frontend no refleja la forma real `{ id_alquiler, total_eventos, eventos[] }`.
8. **Sin endpoint de health check para probes** (`/health`, `/ping`): el único endpoint público es `GET /`.
9. **El error 422 de FastAPI no usa el sobre estándar**: el handler global solo intercepta `HTTPException`, no `RequestValidationError`. El cliente debe manejar ambos formatos.
