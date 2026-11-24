# Referencia de la API REST — SGA Web

- **Proyecto:** Sistema de Gestión de Alquileres de Andamios (SGA) — Fundiplacas Rodríguez
- **Documento:** `DOC-OF-07` (`docs/architecture/api_reference.md`)
- **Tarea origen:** `RM-DOC-011`
- **Versión de la aplicación SGA:** `2.0.0` (FastAPI `0.141.1`)
- **Fecha de verificación:** 2026-11-23
- **Línea base verificada:** rama `dev`, commit `eb382a1cfdc3f9ab22692611d1926648e93efb7d` (con corrección de seguridad de serialización de `Usuario` y correcciones funcionales aprobadas versionadas en este cierre)

---

## 1. Propósito, alcance y fuentes de verdad

Este documento constituye la referencia técnica viva del contrato de la API REST del backend del SGA web (`sga_backend_jwt/`). Describe exclusivamente las rutas, métodos HTTP, esquemas de entrada, formatos de respuesta, códigos de estado, reglas de autorización y comportamientos verificados en el código fuente vigente.

> [!IMPORTANT]
> **Vigencia frente a diagnósticos históricos:**
> El diagnóstico preliminar `DXC-2026-003_api_contrato.md` (elaborado sobre el commit histórico `14726ad`) documentaba 45 endpoints e incluía rutas eliminadas posteriormente (como el router `/inventario` y operaciones `GET` de `/renovaciones`). Dichas rutas **no existen en el código actual** y no forman parte de esta referencia. El inventario vigente verificado contra los decoradores de `sga_backend_jwt/app/routes/` consta exactamente de **7 routers** y **38 operaciones REST bajo `/api/sga`**, más la ruta pública de diagnóstico `GET /` fuera de dicho prefijo.

**Fuentes de verdad inspeccionadas:**
- `sga_backend_jwt/app/main.py` — instancia FastAPI, middleware CORS, manejador de `HTTPException`, prefijo `/api/sga`, registro de los 7 routers y ruta raíz `GET /`.
- `sga_backend_jwt/app/routes/*.py` — 7 módulos de rutas con 38 decoradores `@router.<method>`.
- `sga_backend_jwt/app/controllers/*.py` — 7 controladores con la lógica de negocio y formato de datos retornados.
- `sga_backend_jwt/app/schemas/*.py` — 6 módulos de esquemas Pydantic v2 de entrada y validación.
- `sga_backend_jwt/app/models/*.py` — 7 modelos ORM SQLAlchemy 2.0 (incluida la lista blanca `__campos_publicos__` en `Usuario`).
- `sga_backend_jwt/app/utils/response.py` — sobre estándar `response_success` / `response_error`, `_orm_to_dict` y filtrado centralizado `CAMPOS_SENSIBLES_EXCLUIDOS`.
- `sga_backend_jwt/app/utils/auth_dependency.py`, `roles.py`, `jwt_utils.py`, `db_errors.py`, `tiempo.py`, `unidades.py`.

**Niveles de certeza utilizados:**
- **Verificado en código:** comprobado por inspección estática directa de los archivos del repositorio.
- **Verificado mediante pruebas automatizadas:** comprobado mediante la ejecución de la suite de pruebas en el entorno Python del backend.
- **No verificado en producción:** comportamiento o exposición cuya configuración en el entorno productivo desplegado no ha sido comprobada de forma independiente.
- **En revisión / pendiente de decisión:** aspecto funcional cuyo comportamiento actual se documenta fielmente pero cuya normalización o ajuste de permisos está sujeto a decisión del propietario.

---

## 2. Prefijo de API y resumen de routers

Todos los routers de dominio se registran en `sga_backend_jwt/app/main.py:114-127` bajo el prefijo global:

```text
/api/sga
```

| # | Router (`main.py`) | Archivo en `app/routes/` | Prefijo efectivo | Tag OpenAPI | Operaciones REST |
|---:|---|---|---|---|---:|
| 1 | `auth_router` | `auth_routes.py` | `/api/sga/auth` | `Autenticación` | 1 |
| 2 | `usuario_router` | `usuario_routes.py` | `/api/sga/usuarios` | `Usuarios` | 5 |
| 3 | `cliente_router` | `cliente_routes.py` | `/api/sga/clientes` | `Clientes` | 5 |
| 4 | `producto_router` | `producto_routes.py` | `/api/sga/productos` | `Productos` | 5 |
| 5 | `alquiler_router` | `alquiler_routes.py` | `/api/sga/alquileres` | `Alquileres` | 16 |
| 6 | `detalle_alquiler_router` | `detalle_alquiler_routes.py` | `/api/sga/detalle-alquiler` | `Detalle de Alquiler` | 3 |
| 7 | `gastos_router` | `gastos_routes.py` | `/api/sga/gastos` | `Gastos Logísticos` | 3 |
| | **Total bajo `/api/sga`** | **7 archivos** | | | **38** |

> **Rutas fuera de `/api/sga`:** La ruta de diagnóstico `GET /` (`main.py:134-145`) y las rutas de documentación automática de FastAPI (`/docs`, `/redoc`, `/openapi.json`) se encuentran fuera del prefijo `/api/sga` y se documentan por separado en la sección 14.

---

## 3. Autenticación, autorización y ciclo de vida del JWT

### 3.1 Esquema de autenticación (`HTTPBearer`)

Salvo `POST /api/sga/auth/login` (y la ruta raíz `GET /` fuera de `/api/sga`), todas las operaciones requieren un token JWT enviado en la cabecera HTTP:

```http
Authorization: Bearer <access_token>
```

- **Implementación:** `sga_backend_jwt/app/utils/auth_dependency.py:21-61` define `_bearer_scheme = HTTPBearer(auto_error=False)` y la dependencia `get_current_user()`.
- Los 6 routers protegidos (`usuario_routes.py`, `cliente_routes.py`, `producto_routes.py`, `alquiler_routes.py`, `detalle_alquiler_routes.py`, `gastos_routes.py`) declaran `dependencies=[Depends(get_current_user)]` a nivel de `APIRouter` y, adicionalmente, `Depends(requiere_rol(...))` en cada uno de sus 37 endpoints.

### 3.2 Estructura del token JWT y comportamiento ante cambios de rol

El token se emite en `sga_backend_jwt/app/utils/jwt_utils.py:24-35` con los siguientes claims:

| Claim | Tipo | Contenido |
|---|---|---|
| `sub` | `string` | `id_usuario` (documento de identidad del usuario autenticado) |
| `rol_usuario` | `string` | Rol del usuario en el momento de iniciar sesión (`admin`, `encargado_facturacion` o `encargado_logistico`) |
| `iat` | `timestamp (UTC)` | Fecha/hora de emisión del token |
| `exp` | `timestamp (UTC)` | Fecha/hora de expiración (`iat + JWT_EXPIRE_MINUTES`, por defecto `480` minutos / 8 horas) |

> [!NOTE]
> **Comportamiento actual del JWT frente a cambios de rol o estado:**
> - El rol del usuario está incorporado dentro del payload firmado del JWT (`payload["rol_usuario"]`).
> - En cada solicitud protegida, `get_current_user()` (`auth_dependency.py:37-61`) valida la firma criptográfica (`JWT_SECRET_KEY`, algoritmo `JWT_ALGORITHM`, por defecto `HS256`) y la vigencia temporal (`exp`) del token, e instancia `UsuarioActual(id_usuario=payload["sub"], rol_usuario=payload["rol_usuario"])`.
> - La dependencia de autorización `requiere_rol(*roles_permitidos)` (`roles.py:27-45`) evalúa directamente el `rol_usuario` contenido en el token; el backend **no vuelve a consultar la tabla `usuario` en la base de datos en cada solicitud** para revalidar el rol.
> - Por consiguiente, un token ya emitido no se actualiza automáticamente si el rol de un usuario cambia en la base de datos; el cambio de rol se reflejará en el siguiente inicio de sesión (`POST /api/sga/auth/login`), cuando se emita un nuevo token.

### 3.3 Roles del sistema y grupos de autorización

#### Jerarquía funcional oficial

El sistema define tres roles operativos con acceso a la aplicación, bajo una jerarquía de herencia ascendente (`admin > encargado_facturacion > encargado_logistico`):

| Rol (`rol_usuario`) | Nivel funcional | Capacidades |
|---|---|---|
| `admin` | Administración | Capacidades de administración, facturación y logística |
| `encargado_facturacion` | Facturación | Capacidades de facturación y logística |
| `encargado_logistico` | Logística | Capacidades logísticas |

- **Valor `'cliente'` en base de datos:** La tabla `usuario` almacena también a los clientes de alquiler con `rol_usuario = 'cliente'`. Por regla de negocio explícita (`roles.py:18-19` y `usuario_controller.py:208-209`), el rol `'cliente'` **no tiene acceso al sistema**, no puede obtener un JWT en `POST /api/sga/auth/login` y no forma parte de ningún grupo de permisos.

#### Grupos de roles aplicados en los endpoints (`sga_backend_jwt/app/utils/roles.py:53-59`)

| Grupo constante | Roles permitidos | Cantidad de endpoints que lo usan |
|---|---|---:|
| *(Público bajo `/api/sga`)* | Sin autenticación (`POST /api/sga/auth/login`) | 1 |
| `SOLO_ADMIN` | `admin` | 7 |
| `ADMIN_O_FACTURACION` | `admin`, `encargado_facturacion` | 12 |
| `STAFF_INTERNO` | `admin`, `encargado_facturacion`, `encargado_logistico` | 18 |
| **Total bajo `/api/sga`** | | **38** |

> **Nota sobre `ADMIN_O_LOGISTICO` (`roles.py:57`):** En `sga_backend_jwt/app/utils/roles.py:57` existe la constante `ADMIN_O_LOGISTICO = ("admin", "encargado_logistico")`, la cual constituye una definición residual sin ningún uso en los routers del sistema y no forma parte de la jerarquía oficial de roles.

---

## 4. Sobre estándar de respuesta y manejo de errores

### 4.1 Sobre estándar (`response_success` y `response_error`)

Definido en `sga_backend_jwt/app/utils/response.py:124-162`. Todas las respuestas generadas por los controladores y por el manejador de `HTTPException` devuelven un objeto `JSONResponse` con `status_code=code` y la siguiente estructura uniforme de 5 claves:

#### Respuesta exitosa (`status: true`)

```json
{
  "status": true,
  "mensaje": "Descripción legible de la operación realizada",
  "data": {},
  "error": null,
  "code": 200
}
```

- `status`: siempre `true` en respuestas exitosas (`200` o `201`).
- `mensaje`: cadena descriptiva en español.
- `data`: objeto, lista de objetos o estructura resultante de la operación (convertida mediante `convertir_json()`).
- `error`: siempre `null` en respuestas exitosas.
- `code`: entero que coincide con el código de estado HTTP de la respuesta (`200` o `201`).

#### Respuesta de error (`status: false`)

```json
{
  "status": false,
  "mensaje": "Descripción legible del motivo del error",
  "data": null,
  "error": "CODIGO_DE_ERROR",
  "code": 400
}
```

- `status`: siempre `false` en respuestas de error controladas por la aplicación.
- `mensaje`: descripción del error (mensaje de negocio extraído del controlador/trigger o detalle de autorización).
- `data`: `null` en todas las respuestas de error, con la única excepción de `POST /api/sga/auth/login` cuando las credenciales son inválidas (`401 LOGIN_INVALID`), donde `data` es `{"logueado": false}` (`auth_routes.py:24-30`).
- `error`: identificador simbólico en mayúsculas (o `str(error)` en errores `500` no tipados).
- `code`: entero que coincide con el código de estado HTTP (`400`, `401`, `403`, `404`, `500`, etc.).

### 4.2 Códigos de error del sobre estándar

| Código HTTP (`code`) | Valor de `error` | Origen y condición de disparo |
|---:|---|---|
| `400` | `LOGIN_VALIDATION_ERROR` | `POST /api/sga/auth/login` cuando no se envía ni `telefono_usuario` ni `email_usuario` |
| `400` | `USUARIO_VALIDATION_ERROR` | `POST /api/sga/usuarios` o `PATCH /api/sga/usuarios/{id_usuario}` ante duplicados (`id_usuario`, `telefono_usuario`, `email_usuario`) o error de trigger/BD |
| `400` | `USUARIO_ESTADO_INVALIDO` | `PATCH /api/sga/usuarios/{id_usuario}/estado` cuando un trigger de BD rechaza el cambio (ej. último admin activo) |
| `400` | `CLIENTE_VALIDATION_ERROR` | `POST /api/sga/clientes` o `PATCH /api/sga/clientes/{id_usuario}` ante duplicados o error de BD |
| `400` | `CLIENTE_ESTADO_INVALIDO` | `PATCH /api/sga/clientes/{id_usuario}/estado` ante error de validación de BD |
| `400` | `PRODUCTO_VALIDATION_ERROR` | `POST /api/sga/productos` o `PATCH /api/sga/productos/{id_producto}` (ej. `stock_total < stock_alquilado` rechazado por `trg_validar_modificacion_producto`) |
| `400` | `PRODUCTO_ESTADO_INVALIDO` | `PATCH /api/sga/productos/{id_producto}/estado` cuando el producto tiene `stock_alquilado > 0` en obra |
| `400` | `ALQUILER_VALIDATION_ERROR` | `POST /api/sga/alquileres` o `PATCH /api/sga/alquileres/{id_alquiler}` (incompatibilidad con `unidad_minima_alquiler`, campo no editable en el estado actual, fecha de inicio en el pasado, stock insuficiente, cliente/producto inexistente) |
| `400` | `ALQUILER_ESTADO_INVALIDO` | `PATCH /api/sga/alquileres/{id_alquiler}/estado` cuando la transición no está en `TRANSICIONES_VALIDAS` o el alquiler ya está en ese estado |
| `400` | `ALQUILER_NO_CANCELABLE` | `DELETE /api/sga/alquileres/{id_alquiler}` cuando el estado actual no permite transicionar a `'cancelado'` |
| `400` | `RENOVACION_NO_PERMITIDA` | `POST /api/sga/alquileres/{id_alquiler}/renovaciones` si el alquiler no está en `'activo'` o `'vencido'`, o si `dias` no respeta la `unidad_minima_alquiler` |
| `400` | `ENTREGA_NO_PERMITIDA` | `POST /api/sga/alquileres/{id_alquiler}/entregas` si el alquiler no está en `'pendiente'` o `'activo'` |
| `400` | `RECOGIDA_NO_PERMITIDA` | `POST /api/sga/alquileres/{id_alquiler}/recogidas` si no existe entrega previa activa (`RN-LOG-04`) o si el alquiler no está en `'activo'` o `'vencido'` |
| `400` | `DETALLE_VALIDATION_ERROR` | `POST /api/sga/detalle-alquiler` o `PATCH /api/sga/detalle-alquiler/{id_detalle_alquiler}` (alquiler no existe o no está en `'pendiente'`/`'activo'`, stock insuficiente, producto base duplicado) |
| `400` | `GASTO_VALIDATION_ERROR` | `POST /api/sga/gastos` ante violación de clave foránea (`ids_alquiler` inexistente) o restricción `CHECK` |
| `401` | `LOGIN_INVALID` | `POST /api/sga/auth/login` cuando el usuario no existe, es `'cliente'`, está inactivo o la contraseña no coincide (`data: {"logueado": false}`) |
| `401` | `AUTH_ERROR` | Manejador `manejar_http_exception` (`main.py:83-84`): falta cabecera `Authorization: Bearer <token>`, token expirado o token inválido (`auth_dependency.py:41-56`) |
| `403` | `FORBIDDEN` | Manejador `manejar_http_exception` (`main.py:85-86`): el rol del JWT no pertenece a los roles permitidos por `requiere_rol()`, o un rol no-admin consulta `GET /api/sga/usuarios` sin `?rol_usuario=encargado_logistico` |
| `404` | `USUARIO_NOT_FOUND` | `GET`, `PATCH` o `PATCH /estado` sobre `/api/sga/usuarios/{id_usuario}` cuando el usuario no existe |
| `404` | `CLIENTE_NOT_FOUND` | `GET`, `PATCH` o `PATCH /estado` sobre `/api/sga/clientes/{id_usuario}` cuando el cliente (`rol_usuario='cliente'`) no existe |
| `404` | `PRODUCTO_NOT_FOUND` | `GET`, `PATCH` o `PATCH /estado` sobre `/api/sga/productos/{id_producto}` cuando el producto no existe |
| `404` | `ALQUILER_NOT_FOUND` | Operaciones sobre `/api/sga/alquileres/{id_alquiler}` (`GET`, `PATCH`, `PATCH /estado`, `DELETE`, `GET /historial`, `POST /renovaciones`, `POST /entregas`, `POST /recogidas`) cuando `id_alquiler` no existe |
| `404` | `DETALLE_NOT_FOUND` | `GET` o `PATCH` sobre `/api/sga/detalle-alquiler/{id_detalle_alquiler}` cuando la línea de detalle no existe |
| `404` | `NOT_FOUND` | Manejador `manejar_http_exception` (`main.py:87-88`) cuando se levanta `HTTPException(status_code=404)` |
| `500` | `str(error)` | Bloques `except Exception as error:` en los routers ante errores inesperados no capturados como `ValueError` |

### 4.3 Excepciones al sobre estándar: respuestas predeterminadas de FastAPI / Starlette

No todas las respuestas HTTP posibles del servidor utilizan el sobre `{status, mensaje, data, error, code}`. En la implementación actual de `sga_backend_jwt/app/main.py:78-95`, únicamente se registra un manejador personalizado para `fastapi.exceptions.HTTPException`. Se presentan tres casos especiales del framework:

1. **`422 Unprocessable Entity` (errores de validación de entrada de FastAPI / Pydantic):**
   Cuando un parámetro de ruta, query param o cuerpo JSON incumple las validaciones de tipo o restricciones de Pydantic (`Field(..., gt=0)`, `min_length`, `Literal`, `@field_validator`), FastAPI levanta `fastapi.exceptions.RequestValidationError`. Como esta excepción no hereda de `HTTPException` y no tiene un manejador personalizado registrado en `main.py`, FastAPI responde con su estructura JSON predeterminada (sin el sobre estándar):
   ```json
   {
     "detail": [
       {
         "type": "value_error",
         "loc": ["body", "campo"],
         "msg": "Value error, ...",
         "input": "valor_enviado"
       }
     ]
   }
   ```

2. **`404 Not Found` en rutas no registradas en la aplicación:**
   Cuando un cliente solicita una URL que no coincide con ningún path registrado en FastAPI/Starlette (por ejemplo, `GET /api/sga/ruta-inexistente`), la excepción `404` se origina en el enrutador de Starlette (`starlette.exceptions.HTTPException`) antes de entrar a cualquier controlador de dominio. A diferencia de los `404` de negocio (que devuelven `ALQUILER_NOT_FOUND`, `USUARIO_NOT_FOUND`, etc.), el router de Starlette responde con el formato por defecto `{"detail": "Not Found"}` (o, si se lanza `fastapi.exceptions.HTTPException(status_code=404)`, con `error: "NOT_FOUND"`).

3. **`405 Method Not Allowed` (métodos HTTP no permitidos):**
   Cuando se invoca una ruta existente con un método HTTP no soportado por ella (por ejemplo, `DELETE /api/sga/productos`), el enrutador de Starlette rechaza la solicitud a nivel de protocolo con estado HTTP `405` y cuerpo predeterminado `{"detail": "Method Not Allowed"}` (acompañado de la cabecera HTTP `Allow`), sin pasar por los controladores de la aplicación.

---

## 5. Protección de datos sensibles en la serialización

### 5.1 Exclusión centralizada de `contrasena_usuario` y hashes

La tabla `usuario` almacena en la columna `contrasena_usuario` el hash `bcrypt` de los usuarios de personal interno (o `NULL` en clientes). Para impedir la exposición de contraseñas o hashes en cualquier respuesta HTTP, el backend implementa una protección centralizada en dos niveles:

1. **Lista blanca en el modelo `Usuario` (`sga_backend_jwt/app/models/usuario.py:14-25`):**
   La clase ORM `Usuario` define explícitamente la tupla `__campos_publicos__` con las 10 columnas públicas legítimas:
   - `id_usuario`
   - `rol_usuario`
   - `nombres_usuario`
   - `apellidos_usuario`
   - `email_usuario`
   - `telefono_usuario`
   - `tipo_documento`
   - `estado_registro`
   - `fecha_creacion`
   - `fecha_actualizacion`

2. **Filtrado en `_orm_to_dict()` y `convertir_json()` (`sga_backend_jwt/app/utils/response.py:16-122`):**
   - `_orm_to_dict(obj)` aplica estrictamente `__campos_publicos__` (y el respaldo `CAMPOS_PUBLICOS_POR_TABLA["usuario"]`), excluyendo `contrasena_usuario` y cualquier atributo futuro no incluido en la lista blanca.
   - `convertir_json(data)` filtra recursivamente en todo diccionario (incluyendo respuestas anidadas, relaciones ORM cargadas como `Alquiler.creador` o `Alquiler.cliente` y diccionarios arbitrarios) todas las claves incluidas en `CAMPOS_SENSIBLES_EXCLUIDOS` (`contrasena_usuario`, `contrasena`, `password`, `password_hash`, `hashed_password`).

> **Verificación:** Este comportamiento está verificado mediante pruebas automatizadas en `sga_backend_jwt/tests/test_security_usuario_serialization.py` sobre `GET /api/sga/usuarios`, `GET /api/sga/usuarios/{id_usuario}`, `GET /api/sga/clientes`, `GET /api/sga/clientes/{id_usuario}`, `POST /api/sga/auth/login` y estructuras ORM/diccionarios anidados.

---

## 6. Inventario general de las 38 operaciones REST bajo `/api/sga`

| # | Router | Método | Ruta completa | Roles permitidos | Código éxito |
|---:|---|---|---|---|---:|
| 1 | `auth_router` | `POST` | `/api/sga/auth/login` | Público | `200` |
| 2 | `usuario_router` | `POST` | `/api/sga/usuarios` | `SOLO_ADMIN` | `201` |
| 3 | `usuario_router` | `GET` | `/api/sga/usuarios` | `STAFF_INTERNO` *(con restricción interna)* | `200` |
| 4 | `usuario_router` | `GET` | `/api/sga/usuarios/{id_usuario}` | `SOLO_ADMIN` | `200` |
| 5 | `usuario_router` | `PATCH` | `/api/sga/usuarios/{id_usuario}` | `SOLO_ADMIN` | `200` |
| 6 | `usuario_router` | `PATCH` | `/api/sga/usuarios/{id_usuario}/estado` | `SOLO_ADMIN` | `200` |
| 7 | `cliente_router` | `POST` | `/api/sga/clientes` | `ADMIN_O_FACTURACION` | `201` |
| 8 | `cliente_router` | `GET` | `/api/sga/clientes` | `STAFF_INTERNO` | `200` |
| 9 | `cliente_router` | `GET` | `/api/sga/clientes/{id_usuario}` | `STAFF_INTERNO` | `200` |
| 10 | `cliente_router` | `PATCH` | `/api/sga/clientes/{id_usuario}` | `ADMIN_O_FACTURACION` | `200` |
| 11 | `cliente_router` | `PATCH` | `/api/sga/clientes/{id_usuario}/estado` | `ADMIN_O_FACTURACION` | `200` |
| 12 | `producto_router` | `POST` | `/api/sga/productos` | `SOLO_ADMIN` | `201` |
| 13 | `producto_router` | `GET` | `/api/sga/productos` | `STAFF_INTERNO` | `200` |
| 14 | `producto_router` | `GET` | `/api/sga/productos/{id_producto}` | `STAFF_INTERNO` | `200` |
| 15 | `producto_router` | `PATCH` | `/api/sga/productos/{id_producto}` | `SOLO_ADMIN` | `200` |
| 16 | `producto_router` | `PATCH` | `/api/sga/productos/{id_producto}/estado` | `SOLO_ADMIN` | `200` |
| 17 | `alquiler_router` | `GET` | `/api/sga/alquileres/buscar` | `STAFF_INTERNO` | `200` |
| 18 | `alquiler_router` | `GET` | `/api/sga/alquileres/proximos-vencer` | `STAFF_INTERNO` | `200` |
| 19 | `alquiler_router` | `GET` | `/api/sga/alquileres/pendientes-entrega` | `STAFF_INTERNO` | `200` |
| 20 | `alquiler_router` | `POST` | `/api/sga/alquileres` | `ADMIN_O_FACTURACION` | `201` |
| 21 | `alquiler_router` | `GET` | `/api/sga/alquileres` | `STAFF_INTERNO` | `200` |
| 22 | `alquiler_router` | `GET` | `/api/sga/alquileres/{id_alquiler}` | `STAFF_INTERNO` | `200` |
| 23 | `alquiler_router` | `GET` | `/api/sga/alquileres/{id_alquiler}/detalles` | `STAFF_INTERNO` | `200` |
| 24 | `alquiler_router` | `PATCH` | `/api/sga/alquileres/{id_alquiler}` | `ADMIN_O_FACTURACION` | `200` |
| 25 | `alquiler_router` | `PATCH` | `/api/sga/alquileres/{id_alquiler}/estado` | `ADMIN_O_FACTURACION` | `200` |
| 26 | `alquiler_router` | `DELETE` | `/api/sga/alquileres/{id_alquiler}` | `ADMIN_O_FACTURACION` | `200` |
| 27 | `alquiler_router` | `GET` | `/api/sga/alquileres/{id_alquiler}/historial` | `ADMIN_O_FACTURACION` | `200` |
| 28 | `alquiler_router` | `POST` | `/api/sga/alquileres/{id_alquiler}/renovaciones` | `ADMIN_O_FACTURACION` | `200` |
| 29 | `alquiler_router` | `POST` | `/api/sga/alquileres/{id_alquiler}/entregas` | `STAFF_INTERNO` | `201` |
| 30 | `alquiler_router` | `GET` | `/api/sga/alquileres/{id_alquiler}/entregas` | `STAFF_INTERNO` | `200` |
| 31 | `alquiler_router` | `POST` | `/api/sga/alquileres/{id_alquiler}/recogidas` | `STAFF_INTERNO` | `201` |
| 32 | `alquiler_router` | `GET` | `/api/sga/alquileres/{id_alquiler}/recogidas` | `STAFF_INTERNO` | `200` |
| 33 | `detalle_alquiler_router` | `POST` | `/api/sga/detalle-alquiler` | `ADMIN_O_FACTURACION` | `201` |
| 34 | `detalle_alquiler_router` | `GET` | `/api/sga/detalle-alquiler/{id_detalle_alquiler}` | `STAFF_INTERNO` | `200` |
| 35 | `detalle_alquiler_router` | `PATCH` | `/api/sga/detalle-alquiler/{id_detalle_alquiler}` | `ADMIN_O_FACTURACION` | `200` |
| 36 | `gastos_router` | `POST` | `/api/sga/gastos` | `STAFF_INTERNO` | `201` |
| 37 | `gastos_router` | `GET` | `/api/sga/gastos` | `STAFF_INTERNO` | `200` |
| 38 | `gastos_router` | `GET` | `/api/sga/gastos/resumen-semanal` | `ADMIN_O_FACTURACION` | `200` |

---

## 7. Módulo 1: Autenticación (`/api/sga/auth`)

- **Archivo de ruta:** `sga_backend_jwt/app/routes/auth_routes.py`
- **Controlador:** `sga_backend_jwt/app/controllers/usuario_controller.py` (`login_usuario`, `L178-230`)
- **Esquema:** `sga_backend_jwt/app/schemas/usuario_schema.py` (`LoginRequest`, `L104-110`)

### 7.1 `POST /api/sga/auth/login`

- **Fuente:** `auth_routes.py:13-38`
- **Roles permitidos:** Público (único endpoint bajo `/api/sga` que no requiere token JWT).
- **Parámetros de ruta / query:** ninguno.
- **Esquema de entrada (`LoginRequest`):**
  ```json
  {
    "telefono_usuario": "3000000001",
    "email_usuario": "usuario@ejemplo.com",
    "contrasena_usuario": "clave_en_texto_plano"
  }
  ```
  - `telefono_usuario` (`string`, opcional): teléfono del usuario.
  - `email_usuario` (`string`, opcional): correo electrónico del usuario.
  - `contrasena_usuario` (`string`, obligatorio): contraseña en texto plano.
  - **Regla de identificación:** debe enviarse al menos uno de `telefono_usuario` o `email_usuario`. Si se envían ambos, `login_usuario()` evalúa `if telefono_usuario:` primero (`usuario_controller.py:188`).
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "status": true,
    "mensaje": "Login exitoso",
    "data": {
      "logueado": true,
      "id_usuario": "1001",
      "rol_usuario": "admin",
      "nombres_usuario": "Nombre",
      "apellidos_usuario": "Apellido",
      "access_token": "<jwt_firmado>",
      "token_type": "bearer"
    },
    "error": null,
    "code": 200
  }
  ```
- **Respuestas de error:**
  - `400` (`LOGIN_VALIDATION_ERROR`): cuando no se indica ni `telefono_usuario` ni `email_usuario`.
  - `401` (`LOGIN_INVALID`, con `data: {"logueado": false}`): cuando el usuario no existe, su `rol_usuario` es `'cliente'`, su `estado_registro` es `false` o la contraseña no coincide con el hash `bcrypt`.
  - `422`: payload JSON mal formado o falta `contrasena_usuario` (formato FastAPI predeterminado).
  - `500`: error interno inesperado.

---

## 8. Módulo 2: Usuarios de personal (`/api/sga/usuarios`)

- **Archivo de ruta:** `sga_backend_jwt/app/routes/usuario_routes.py`
- **Controlador:** `sga_backend_jwt/app/controllers/usuario_controller.py`
- **Esquemas:** `sga_backend_jwt/app/schemas/usuario_schema.py` (`UsuarioCreate`, `UsuarioUpdate`, `UsuarioEstadoUpdate`)

### 8.1 `POST /api/sga/usuarios`

- **Fuente:** `usuario_routes.py:38-65`
- **Roles permitidos:** `SOLO_ADMIN` (`admin`).
- **Esquema de entrada (`UsuarioCreate`, `usuario_schema.py:29-73`):**
  | Campo | Tipo | Requerido | Restricciones |
  |---|---|---|---|
  | `id_usuario` | `string` | Sí | `max_length=20` (documento de identidad, PK natural) |
  | `rol_usuario` | `string` | Sí | Debe pertenecer a `ROLES_STAFF`: `'admin'`, `'encargado_facturacion'` o `'encargado_logistico'`. No admite `'cliente'`. |
  | `nombres_usuario` | `string` | Sí | `max_length=100` |
  | `apellidos_usuario` | `string` | Sí | `max_length=100` |
  | `email_usuario` | `string \| null` | No | `max_length=100`, único en BD |
  | `telefono_usuario` | `string` | Sí | `max_length=20`, único en BD |
  | `contrasena_usuario` | `string` | Sí | `min_length=4`; se hashea con `bcrypt` en `crear_usuario()` antes de persistir |
  | `tipo_documento` | `string` | Sí | Uno de `'CC'`, `'CE'`, `'NIT'`, `'PPT'` |
- **Reglas de negocio:**
  - Valida unicidad previa de `id_usuario`, `telefono_usuario` y `email_usuario` (`usuario_controller.py:19-27`).
  - Establece contexto de auditoría `set_audit_context(db, usuario_actual.id_usuario)` (`L30`).
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "status": true,
    "mensaje": "Usuario creado correctamente",
    "data": {
      "id_usuario": "1002",
      "rol_usuario": "encargado_facturacion",
      "nombres_usuario": "Ana",
      "apellidos_usuario": "Gómez"
    },
    "error": null,
    "code": 201
  }
  ```
- **Errores:** `400 USUARIO_VALIDATION_ERROR`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `422`, `500`.

### 8.2 `GET /api/sga/usuarios`

- **Fuente:** `usuario_routes.py:77-99`
- **Roles permitidos:** `STAFF_INTERNO` en el decorador, **con restricción programática interna en el handler (`L84-92`)**:
  - `admin`: puede listar usuarios con o sin el parámetro `rol_usuario`.
  - `encargado_facturacion` y `encargado_logistico`: **solo** pueden consultar este endpoint si envían explícitamente `?rol_usuario=encargado_logistico` (utilizado para poblar selectores de personal logístico). Si omiten el filtro o solicitan otro rol, el endpoint lanza `HTTPException(status_code=403)` (`error: "FORBIDDEN"`).
- **Parámetros query:**
  - `rol_usuario` (`string`, opcional): filtra por rol exacto. Si un `admin` no envía `rol_usuario`, el controlador excluye por defecto los registros con `rol_usuario == "cliente"` (`usuario_controller.py:81`).
- **Respuesta exitosa (`200 OK`):**
  Lista de objetos de usuario serializados mediante la lista blanca `__campos_publicos__` (sin `contrasena_usuario`):
  ```json
  {
    "status": true,
    "mensaje": "Usuarios encontrados",
    "data": [
      {
        "id_usuario": "1001",
        "rol_usuario": "admin",
        "nombres_usuario": "Nombre",
        "apellidos_usuario": "Apellido",
        "email_usuario": "correo@ejemplo.com",
        "telefono_usuario": "3000000001",
        "tipo_documento": "CC",
        "estado_registro": true,
        "fecha_creacion": "2026-11-23T10:00:00",
        "fecha_actualizacion": "2026-11-23T10:00:00"
      }
    ],
    "error": null,
    "code": 200
  }
  ```
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `500`.

### 8.3 `GET /api/sga/usuarios/{id_usuario}`

- **Fuente:** `usuario_routes.py:106-118`
- **Roles permitidos:** `SOLO_ADMIN`.
- **Parámetros de ruta:** `id_usuario` (`string`, documento del usuario).
- **Respuesta exitosa (`200 OK`):** objeto `data` con los 10 campos públicos de `Usuario` (misma estructura de ítem que en `GET /api/sga/usuarios`, excluyendo `contrasena_usuario`).
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 USUARIO_NOT_FOUND` (`"El usuario no existe"`), `500`.

### 8.4 `PATCH /api/sga/usuarios/{id_usuario}`

- **Fuente:** `usuario_routes.py:125-154`
- **Roles permitidos:** `SOLO_ADMIN`.
- **Parámetros de ruta:** `id_usuario` (`string`).
- **Esquema de entrada (`UsuarioUpdate`, `usuario_schema.py:75-97`):** todos los campos son opcionales:
  - `nombres_usuario` (`string`, `max_length=100`)
  - `apellidos_usuario` (`string`, `max_length=100`)
  - `email_usuario` (`string \| null`, `max_length=100`)
  - `telefono_usuario` (`string`, `max_length=20`)
  - `rol_usuario` (`string`, debe pertenecer a `ROLES_STAFF`: `'admin'`, `'encargado_facturacion'`, `'encargado_logistico'`)
  - `contrasena_usuario` (`string`, `min_length=4`; si se envía, se hashea con `bcrypt` antes de actualizar)
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "status": true,
    "mensaje": "Usuario actualizado correctamente",
    "data": {
      "id_usuario": "1002",
      "rol_usuario": "encargado_facturacion",
      "nombres_usuario": "Ana",
      "apellidos_usuario": "Gómez",
      "email_usuario": "ana@ejemplo.com",
      "telefono_usuario": "3000000002"
    },
    "error": null,
    "code": 200
  }
  ```
- **Errores:** `400 USUARIO_VALIDATION_ERROR`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 USUARIO_NOT_FOUND`, `422`, `500`.

### 8.5 `PATCH /api/sga/usuarios/{id_usuario}/estado`

- **Fuente:** `usuario_routes.py:165-191`
- **Roles permitidos:** `SOLO_ADMIN`.
- **Parámetros de ruta:** `id_usuario` (`string`).
- **Esquema de entrada (`UsuarioEstadoUpdate`, `usuario_schema.py:99-101`):**
  ```json
  {
    "estado_registro": false
  }
  ```
- **Reglas de negocio en base de datos:**
  - El trigger `trg_garantizar_minimo_un_admin` (`BEFORE UPDATE OF estado_registro ON usuario`) impide desactivar al último administrador activo.
  - Nota: el trigger `trg_impedir_autodesactivacion_admin` tiene documentada una discrepancia estática de variable de sesión (`app.current_user_id` vs `app.usuario_actual`, ver sección 16.3).
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "status": true,
    "mensaje": "Estado del usuario actualizado",
    "data": {
      "id_usuario": "1002",
      "estado_registro": false
    },
    "error": null,
    "code": 200
  }
  ```
- **Errores:** `400 USUARIO_ESTADO_INVALIDO`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 USUARIO_NOT_FOUND`, `422`, `500`.

---

## 9. Módulo 3: Clientes (`/api/sga/clientes`)

- **Archivo de ruta:** `sga_backend_jwt/app/routes/cliente_routes.py`
- **Controlador:** `sga_backend_jwt/app/controllers/cliente_controller.py`
- **Esquemas:** `sga_backend_jwt/app/schemas/cliente_schema.py` (`ClienteCreate`, `ClienteUpdate`, `ClienteEstadoUpdate`)

> **Diseño del recurso `/clientes`:** Los clientes se persisten en la misma tabla `usuario` con `rol_usuario = 'cliente'` y `contrasena_usuario = NULL`, pero se exponen en un router separado para permitir que `encargado_facturacion` pueda crearlos y editarlos (`ADMIN_O_FACTURACION`) y todo el personal interno pueda consultarlos (`STAFF_INTERNO`).

### 9.1 `POST /api/sga/clientes`

- **Fuente:** `cliente_routes.py:34-60`
- **Roles permitidos:** `ADMIN_O_FACTURACION` (`admin`, `encargado_facturacion`).
- **Esquema de entrada (`ClienteCreate`, `cliente_schema.py:8-38`):**
  | Campo | Tipo | Requerido | Restricciones |
  |---|---|---|---|
  | `id_usuario` | `string` | Sí | `max_length=20` (documento/NIT del cliente) |
  | `nombres_usuario` | `string` | Sí | `max_length=100` |
  | `apellidos_usuario` | `string` | Sí | `max_length=100` |
  | `telefono_usuario` | `string` | Sí | `max_length=20`, único en tabla `usuario` |
  | `email_usuario` | `string \| null` | No | `max_length=100`, único en tabla `usuario` |
  | `tipo_documento` | `string` | Sí | Uno de `'CC'`, `'CE'`, `'NIT'`, `'PPT'` |
- **Reglas de negocio:** `crear_cliente()` fuerza siempre `rol_usuario = "cliente"` y `contrasena_usuario = None` (`cliente_controller.py:35-44`), y establece contexto de auditoría (`L33`).
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "status": true,
    "mensaje": "Cliente creado correctamente",
    "data": {
      "id_usuario": "2001",
      "nombres_usuario": "Carlos",
      "apellidos_usuario": "Ruiz"
    },
    "error": null,
    "code": 201
  }
  ```
- **Errores:** `400 CLIENTE_VALIDATION_ERROR`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `422`, `500`.

### 9.2 `GET /api/sga/clientes`

- **Fuente:** `cliente_routes.py:63-71`
- **Roles permitidos:** `STAFF_INTERNO` (`admin`, `encargado_facturacion`, `encargado_logistico`).
- **Parámetros query:**
  - `busqueda` (`string`, opcional): filtra clientes (`rol_usuario == "cliente"`) por coincidencia parcial (`ILIKE`) en `nombres_usuario`, `apellidos_usuario`, `id_usuario` o `telefono_usuario` (`cliente_controller.py:73-86`).
- **Respuesta exitosa (`200 OK`):** lista de clientes serializados con los 10 campos públicos de `Usuario` (sin `contrasena_usuario`).
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `500`.

### 9.3 `GET /api/sga/clientes/{id_usuario}`

- **Fuente:** `cliente_routes.py:74-86`
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros de ruta:** `id_usuario` (`string`). Solo retorna coincidencia si el registro existe y tiene `rol_usuario == "cliente"` (`cliente_controller.py:61-66`).
- **Respuesta exitosa (`200 OK`):** objeto con los 10 campos públicos del cliente (sin `contrasena_usuario`).
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 CLIENTE_NOT_FOUND` (`"El cliente no existe"`), `500`.

### 9.4 `PATCH /api/sga/clientes/{id_usuario}`

- **Fuente:** `cliente_routes.py:89-117`
- **Roles permitidos:** `ADMIN_O_FACTURACION`.
- **Parámetros de ruta:** `id_usuario` (`string`).
- **Esquema de entrada (`ClienteUpdate`, `cliente_schema.py:40-49`):** todos opcionales:
  - `nombres_usuario` (`string`, `max_length=100`)
  - `apellidos_usuario` (`string`, `max_length=100`)
  - `telefono_usuario` (`string`, `max_length=20`)
  - `email_usuario` (`string \| null`, `max_length=100`)
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "status": true,
    "mensaje": "Cliente actualizado correctamente",
    "data": {
      "id_usuario": "2001",
      "nombres_usuario": "Carlos",
      "apellidos_usuario": "Ruiz",
      "telefono_usuario": "3001112233",
      "email_usuario": "carlos@ejemplo.com"
    },
    "error": null,
    "code": 200
  }
  ```
- **Errores:** `400 CLIENTE_VALIDATION_ERROR`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 CLIENTE_NOT_FOUND`, `422`, `500`.

### 9.5 `PATCH /api/sga/clientes/{id_usuario}/estado`

- **Fuente:** `cliente_routes.py:120-146`
- **Roles permitidos:** `ADMIN_O_FACTURACION`.
- **Parámetros de ruta:** `id_usuario` (`string`).
- **Esquema de entrada (`ClienteEstadoUpdate`, `cliente_schema.py:51-53`):** `{"estado_registro": false}`.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "status": true,
    "mensaje": "Estado del cliente actualizado",
    "data": {
      "id_usuario": "2001",
      "estado_registro": false
    },
    "error": null,
    "code": 200
  }
  ```
- **Errores:** `400 CLIENTE_ESTADO_INVALIDO`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 CLIENTE_NOT_FOUND`, `422`, `500`.

---

## 10. Módulo 4: Productos (`/api/sga/productos`)

- **Archivo de ruta:** `sga_backend_jwt/app/routes/producto_routes.py`
- **Controlador:** `sga_backend_jwt/app/controllers/producto_controller.py`
- **Esquemas:** `sga_backend_jwt/app/schemas/producto_schema.py` (`ProductoCreate`, `ProductoUpdate`, `ProductoEstadoUpdate`)

### 10.1 `POST /api/sga/productos`

- **Fuente:** `producto_routes.py:32-58`
- **Roles permitidos:** `SOLO_ADMIN`.
- **Esquema de entrada (`ProductoCreate`, `producto_schema.py:9-25`):**
  | Campo | Tipo | Requerido | Restricciones / Default |
  |---|---|---|---|
  | `nombre_producto` | `string` | Sí | `max_length=100` |
  | `descripcion_producto` | `string \| null` | No | `max_length=300`, default `null` |
  | `precio_base_producto` | `Decimal (number)` | Sí | `ge=0` (interpretado por `unidad_minima_alquiler`) |
  | `precio_base_extra` | `Decimal \| null` | No | `ge=0`; si se omite (`null`), el controlador lo iguala a `precio_base_producto` (`producto_controller.py:17`) |
  | `stock_total` | `integer` | Sí | `ge=0` |
  | `unidad_minima_alquiler` | `Literal["DIA", "SEMANA", "MES"]` | No | Default `"DIA"` |
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "status": true,
    "mensaje": "Producto creado correctamente",
    "data": {
      "id_producto": 1,
      "nombre_producto": "Marco Estándar",
      "stock_total": 100
    },
    "error": null,
    "code": 201
  }
  ```
- **Errores:** `400 PRODUCTO_VALIDATION_ERROR`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `422`, `500`.

### 10.2 `GET /api/sga/productos`

- **Fuente:** `producto_routes.py:61-69`
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros query:**
  - `solo_activos` (`boolean`, opcional, default `true`): cuando es `true`, filtra `Producto.estado_registro == True`.
- **Respuesta exitosa (`200 OK`):** lista de objetos `Producto` serializados por `_orm_to_dict()`, incluyendo la propiedad calculada `@property stock_disponible` (`stock_total - stock_alquilado`, `models/producto.py:30-33`):
  ```json
  {
    "status": true,
    "mensaje": "Productos encontrados",
    "data": [
      {
        "id_producto": 1,
        "nombre_producto": "Marco Estándar",
        "descripcion_producto": "Marco de 1.50m x 1.50m",
        "precio_base_producto": 15000.0,
        "precio_base_extra": 12000.0,
        "stock_total": 100,
        "stock_alquilado": 20,
        "stock_disponible": 80,
        "unidad_minima_alquiler": "DIA",
        "estado_registro": true,
        "fecha_creacion": "2026-11-23T10:00:00",
        "fecha_actualizacion": "2026-11-23T10:00:00"
      }
    ],
    "error": null,
    "code": 200
  }
  ```
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `422`, `500`.

### 10.3 `GET /api/sga/productos/{id_producto}`

- **Fuente:** `producto_routes.py:72-84`
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros de ruta:** `id_producto` (`integer`).
- **Respuesta exitosa (`200 OK`):** objeto `Producto` completo (incluyendo `stock_disponible`).
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 PRODUCTO_NOT_FOUND` (`"El producto no existe"`), `422`, `500`.

### 10.4 `PATCH /api/sga/productos/{id_producto}`

- **Fuente:** `producto_routes.py:87-109`
- **Roles permitidos:** `SOLO_ADMIN`.
- **Parámetros de ruta:** `id_producto` (`integer`).
- **Esquema de entrada (`ProductoUpdate`, `producto_schema.py:27-43`):** todos opcionales (`nombre_producto`, `descripcion_producto`, `precio_base_producto`, `precio_base_extra`, `stock_total`, `unidad_minima_alquiler`). `stock_alquilado` no es editable manualmente.
- **Regla de negocio (trigger `trg_validar_modificacion_producto`):** la BD rechaza la actualización si el nuevo `stock_total` es menor que el `stock_alquilado` actualmente en obras (`400 PRODUCTO_VALIDATION_ERROR`).
- **Respuesta exitosa (`200 OK`):** objeto `Producto` actualizado completo.
- **Errores:** `400 PRODUCTO_VALIDATION_ERROR`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 PRODUCTO_NOT_FOUND`, `422`, `500`.

### 10.5 `PATCH /api/sga/productos/{id_producto}/estado`

- **Fuente:** `producto_routes.py:112-138`
- **Roles permitidos:** `SOLO_ADMIN`.
- **Parámetros de ruta:** `id_producto` (`integer`).
- **Esquema de entrada (`ProductoEstadoUpdate`):** `{"estado_registro": false}`.
- **Regla de negocio (trigger `trg_validar_modificacion_producto`):** la BD rechaza dar de baja (`estado_registro = false`) un producto que tenga `stock_alquilado > 0` (`400 PRODUCTO_ESTADO_INVALIDO`).
- **Respuesta exitosa (`200 OK`):** objeto `Producto` actualizado completo.
- **Errores:** `400 PRODUCTO_ESTADO_INVALIDO`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 PRODUCTO_NOT_FOUND`, `422`, `500`.

---

## 11. Módulo 5: Alquileres (`/api/sga/alquileres`)

- **Archivo de ruta:** `sga_backend_jwt/app/routes/alquiler_routes.py` (16 operaciones)
- **Controladores:** `sga_backend_jwt/app/controllers/alquiler_controller.py`, `detalle_alquiler_controller.py` y `auditoria_controller.py`
- **Esquemas:** `sga_backend_jwt/app/schemas/alquiler_schema.py` y `logistica_alquiler_schema.py`

### 11.1 Estructura común del objeto `Alquiler` en respuestas

Generada por `_formatear_alquiler()` (`alquiler_controller.py:38-61`) y enriquecida por `enriquecer_temporal()` (`app/utils/tiempo.py:59-112`):

```json
{
  "id_alquiler": 10,
  "estado_alquiler": "activo",
  "barrio": "Chapinero",
  "direccion": "Cra 7 # 45-10",
  "deposito": 200000.0,
  "precio_alquiler": 450000.0,
  "fecha_inicio": "2026-11-23",
  "tiempo_alquiler_dias": 14,
  "fecha_vencimiento": "2026-12-06",
  "se_lleva": true,
  "se_recoge": true,
  "estado_registro": true,
  "fecha_creacion": "2026-11-23T10:00:00",
  "fecha_actualizacion": "2026-11-23T10:00:00",
  "id_usuario_creador": "1001",
  "nombres_creador": "Nombre",
  "apellidos_creador": "Apellido",
  "id_usuario_cliente": "2001",
  "nombres_cliente": "Carlos",
  "apellidos_cliente": "Ruiz",
  "dias_restantes": 13,
  "dias_vencido": null,
  "vence_hoy": false,
  "inicio_pendiente": false,
  "detalles": [
    {
      "id_detalle_alquiler": 1,
      "id_producto": 1,
      "nombre_producto": "Marco Estándar",
      "cantidad_productos": 10,
      "precio_conjunto": 450000.0,
      "es_producto_extra": false,
      "estado_registro": true
    }
  ]
}
```

> **Nota sobre la clave `"detalles"`:**
> - En las operaciones individuales que retornan `obtener_alquiler(db, id_alquiler)` (`POST /alquileres`, `GET /alquileres/{id_alquiler}`, `PATCH /alquileres/{id_alquiler}`, `PATCH /alquileres/{id_alquiler}/estado`, `DELETE /alquileres/{id_alquiler}`, `POST /alquileres/{id_alquiler}/renovaciones`), el objeto incluye la lista `"detalles"` (`alquiler_controller.py:202`).
> - En las operaciones de listado (`GET /alquileres`, `GET /alquileres/buscar`, `GET /alquileres/proximos-vencer`, `GET /alquileres/pendientes-entrega`), cada elemento de la lista es el resultado de `_formatear_alquiler(a)` sin la clave `"detalles"`.

### 11.2 `GET /api/sga/alquileres/buscar`

- **Fuente:** `alquiler_routes.py:58-71` (declarada antes de `/{id_alquiler}`)
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros query (todos opcionales):**
  - `cliente` (`string`): filtra por `ILIKE` sobre `nombres_usuario`, `apellidos_usuario` o `id_usuario` del cliente (`alquiler_controller.py:393-401`).
  - `numero` (`integer`): filtra por coincidencia exacta de `id_alquiler` (`L406-407`).
  - `barrio` (`string`): filtra por `ILIKE` sobre `barrio` (`L403-404`).
- **Respuesta exitosa (`200 OK`):** lista de objetos `Alquiler` ordenados por `fecha_creacion DESC`.
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `422` (si `numero` no es entero), `500`.

### 11.3 `GET /api/sga/alquileres/proximos-vencer`

- **Fuente:** `alquiler_routes.py:74-82`
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros query:**
  - `dias` (`integer`, opcional, default `2`): filtra alquileres con `estado_alquiler == 'activo'` cuya fecha de vencimiento calculada (`fecha_inicio + tiempo_alquiler_dias - 1`) se encuentre entre `CURRENT_DATE` y `CURRENT_DATE + INTERVAL '<dias> days'` (`alquiler_controller.py:418-435`).
- **Respuesta exitosa (`200 OK`):** lista de objetos `Alquiler` ordenados por fecha de vencimiento ascendente.
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `422`, `500`.

### 11.4 `GET /api/sga/alquileres/pendientes-entrega`

- **Fuente:** `alquiler_routes.py:85-93`
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros query:**
  - `solo_transporte` (`boolean`, opcional, default `false`): si es `false`, retorna todos los alquileres en `estado_alquiler == 'pendiente'`; si es `true`, filtra además `se_lleva == True` (`alquiler_controller.py:442-457`).
- **Respuesta exitosa (`200 OK`):** lista de objetos `Alquiler`.
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `422`, `500`.

### 11.5 `POST /api/sga/alquileres`

- **Fuente:** `alquiler_routes.py:100-116`
- **Roles permitidos:** `ADMIN_O_FACTURACION`.
- **Esquema de entrada (`AlquilerCreate`, `alquiler_schema.py:30-56`):**
  | Campo | Tipo | Requerido | Restricciones |
  |---|---|---|---|
  | `id_usuario_cliente` | `string` | Sí | `max_length=20` (FK hacia `usuario.id_usuario`) |
  | `barrio` | `string` | Sí | `max_length=100` |
  | `direccion` | `string` | Sí | `max_length=255` |
  | `deposito` | `Decimal` | Sí | `ge=0` |
  | `precio_alquiler` | `Decimal` | Sí | `gt=0` (controlado explícitamente por el staff; no se autocalcula) |
  | `fecha_inicio` | `date (YYYY-MM-DD)` | Sí | No puede ser anterior a `CURRENT_DATE` (trigger `trg_validar_fecha_inicio`) |
  | `tiempo_alquiler_dias` | `integer` | Sí | `gt=0`; debe ser múltiplo de `7` si algún producto exige `SEMANA` o de `30` si exige `MES` (`unidades.py:41-70`) |
  | `se_lleva` | `boolean` | No | Default `true` |
  | `se_recoge` | `boolean` | No | Default `true` |
  | `detalles` | `List[DetalleAlquilerInline]` | Sí | `min_length=1`. Cada ítem: `id_producto` (`int`), `cantidad_productos` (`int > 0`), `precio_conjunto` (`Decimal >= 0`), `es_producto_extra` (`bool = false`) |
- **Reglas de negocio:**
  - `id_usuario_creador` nunca se recibe en el payload; se inyecta desde el JWT (`usuario_actual.id_usuario`, `alquiler_controller.py:141`).
  - El alquiler nace en `estado_alquiler = 'pendiente'`.
  - Inserta el contrato y todas sus líneas de detalle en una única transacción; los triggers `trg_validar_detalle_alquiler` y `trg_sincronizar_stock_producto` validan y reservan el `stock_alquilado`.
- **Respuesta exitosa (`201 Created`):** objeto `Alquiler` completo con `"detalles"`.
- **Errores:** `400 ALQUILER_VALIDATION_ERROR`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `422`, `500`.

### 11.6 `GET /api/sga/alquileres`

- **Fuente:** `alquiler_routes.py:119-131`
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros query (opcionales):**
  - `estado_alquiler` (`string`): filtra por coincidencia exacta de estado.
  - `id_usuario_cliente` (`string`): filtra por documento del cliente.
- **Respuesta exitosa (`200 OK`):** lista de objetos `Alquiler` ordenados por `fecha_creacion DESC`.
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `500`.

### 11.7 `GET /api/sga/alquileres/{id_alquiler}`

- **Fuente:** `alquiler_routes.py:134-146`
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros de ruta:** `id_alquiler` (`integer`).
- **Respuesta exitosa (`200 OK`):** objeto `Alquiler` completo con `"detalles"`.
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 ALQUILER_NOT_FOUND` (`"El alquiler no existe"`), `422`, `500`.

### 11.8 `GET /api/sga/alquileres/{id_alquiler}/detalles`

- **Fuente:** `alquiler_routes.py:149-168` (`detalle_alquiler_controller.py:84-109`)
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros de ruta:** `id_alquiler` (`integer`).
- **Respuesta exitosa (`200 OK`):** lista de líneas activas (`estado_registro = TRUE`) con join hacia `producto`:
  ```json
  {
    "status": true,
    "mensaje": "Detalles del alquiler encontrados",
    "data": [
      {
        "id_detalle_alquiler": 1,
        "id_alquiler": 10,
        "id_producto": 1,
        "nombre_producto": "Marco Estándar",
        "precio_base_producto": 15000.0,
        "precio_base_extra": 12000.0,
        "unidad_minima_alquiler": "DIA",
        "cantidad_productos": 10,
        "precio_conjunto": 450000.0,
        "es_producto_extra": false,
        "estado_registro": true,
        "fecha_creacion": "2026-11-23T10:00:00",
        "fecha_actualizacion": "2026-11-23T10:00:00"
      }
    ],
    "error": null,
    "code": 200
  }
  ```
- **Comportamiento ante alquiler sin líneas:** si el alquiler existe pero no tiene detalles registrados, devuelve `200 OK` con `data: []`.
- **Comportamiento ante `id_alquiler` inexistente:** el controlador comprueba previamente la existencia del contrato en `alquiler`; si no existe, devuelve `404 ALQUILER_NOT_FOUND` (`"El alquiler no existe"` con `data: null`).
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 ALQUILER_NOT_FOUND`, `422`, `500`.

### 11.9 `PATCH /api/sga/alquileres/{id_alquiler}`

- **Fuente:** `alquiler_routes.py:171-192` (`alquiler_controller.py:243-328`)
- **Roles permitidos:** `ADMIN_O_FACTURACION`.
- **Parámetros de ruta:** `id_alquiler` (`integer`).
- **Esquema de entrada (`AlquilerUpdate`, `alquiler_schema.py:58-80`):** todos opcionales (`barrio`, `direccion`, `deposito`, `precio_alquiler`, `fecha_inicio`, `tiempo_alquiler_dias`, `se_lleva`, `se_recoge`).
- **Reglas de negocio (`CAMPOS_EDITABLES_POR_ESTADO`, `alquiler_controller.py:233-240`):**
  | Estado actual | Campos permitidos en `PATCH /api/sga/alquileres/{id_alquiler}` |
  |---|---|
  | `pendiente` | `direccion`, `barrio`, `precio_alquiler`, `deposito`, `fecha_inicio`, `tiempo_alquiler_dias`, `se_lleva`, `se_recoge` |
  | `activo` | `precio_alquiler`, `tiempo_alquiler_dias`, `se_lleva`, `se_recoge` |
  | `vencido` | `precio_alquiler`, `tiempo_alquiler_dias` |
  | `recogido`, `terminado`, `cancelado` | Ninguno (cualquier campo enviado produce `400 ALQUILER_VALIDATION_ERROR`) |
  - Si se reduce `tiempo_alquiler_dias` en estado `activo` o `vencido`, la nueva fecha de vencimiento no puede quedar en el pasado (`alquiler_controller.py:304-315`). Si se aumenta en `activo` o `vencido`, aplica las mismas reglas que una renovación (`_aplicar_renovacion`).
- **Respuesta exitosa (`200 OK`):** objeto `Alquiler` actualizado con `"detalles"`.
- **Errores:** `400 ALQUILER_VALIDATION_ERROR`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 ALQUILER_NOT_FOUND`, `422`, `500`.

### 11.10 `PATCH /api/sga/alquileres/{id_alquiler}/estado`

- **Fuente:** `alquiler_routes.py:195-216` (`alquiler_controller.py:338-367`)
- **Roles permitidos:** `ADMIN_O_FACTURACION` (`admin`, `encargado_facturacion`).
  - *Restricción de seguridad y negocio:* los usuarios con rol `encargado_logistico` no tienen acceso a este endpoint y son rechazados con `403 FORBIDDEN`. En la interfaz de usuario (`sga_frontend_jwt/src/components/alquilerDetalleComponents/CambiarEstadoSection.tsx`), el selector y el botón para cambio de estado se ocultan si el usuario no tiene permisos de facturación (`puedeGestionarFacturacion`), mostrando un mensaje de restricción.
- **Parámetros de ruta:** `id_alquiler` (`integer`).
- **Esquema de entrada (`AlquilerEstadoUpdate`, `alquiler_schema.py:82-95`):**
  ```json
  {
    "estado_alquiler": "terminado"
  }
  ```
  - `estado_alquiler`: debe ser uno de `'pendiente'`, `'activo'`, `'vencido'`, `'recogido'`, `'terminado'`, `'cancelado'`.
- **Grafo de transiciones válidas (`TRANSICIONES_VALIDAS`, `alquiler_controller.py:26-33`):**
  | Estado origen | Estados destino permitidos | Efecto en stock (trigger `trg_cerrar_alquiler_devolver_stock`) |
  |---|---|---|
  | `pendiente` | `activo`, `cancelado` | Si pasa a `cancelado`, devuelve `stock_alquilado` a bodega |
  | `activo` | `vencido`, `recogido`, `terminado`, `cancelado` | Si pasa a `recogido`, `terminado` o `cancelado`, devuelve `stock_alquilado` |
  | `vencido` | `recogido`, `terminado`, `cancelado` | Devuelve `stock_alquilado` en los tres destinos |
  | `recogido` | `terminado` | El stock ya fue devuelto al entrar en `recogido` |
  | `terminado` | *(ninguno — estado final)* | Trigger `trg_prohibir_reabrir_alquiler` bloquea reapertura directa |
  | `cancelado` | *(ninguno — estado final)* | Trigger `trg_prohibir_reabrir_alquiler` bloquea reapertura |
- **Diferencia frente a los endpoints de logística (`/entregas` y `/recogidas`):**
  Cambiar el estado directamente a `'activo'` o `'recogido'` mediante `PATCH /alquileres/{id_alquiler}/estado` **no crea ningún registro en `logistica_alquiler` ni en `logistica_alquiler_alquiler`**, ni verifica la existencia de una entrega previa (`RN-LOG-04`) que sí exige `POST /alquileres/{id_alquiler}/recogidas`.
- **Respuesta exitosa (`200 OK`):** objeto `Alquiler` actualizado con `"detalles"`.
- **Errores:** `400 ALQUILER_ESTADO_INVALIDO`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 ALQUILER_NOT_FOUND`, `422`, `500`.

### 11.11 `DELETE /api/sga/alquileres/{id_alquiler}`

- **Fuente:** `alquiler_routes.py:219-240` (`alquiler_controller.py:374-375`)
- **Roles permitidos:** `ADMIN_O_FACTURACION`.
- **Parámetros de ruta:** `id_alquiler` (`integer`).
- **Comportamiento:** realiza la cancelación lógica del alquiler delegando en `cambiar_estado_alquiler(db, id_alquiler, "cancelado", usuario_actual)`. Solo es válida desde los estados `'pendiente'`, `'activo'` o `'vencido'`. Al pasar a `'cancelado'`, el trigger `trg_cerrar_alquiler_devolver_stock` devuelve el stock reservado.
- **Respuesta exitosa (`200 OK`):** objeto `Alquiler` en estado `'cancelado'` con `"detalles"`.
- **Errores:** `400 ALQUILER_NO_CANCELABLE`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 ALQUILER_NOT_FOUND`, `422`, `500`.

### 11.12 `GET /api/sga/alquileres/{id_alquiler}/historial`

- **Fuente:** `alquiler_routes.py:247-259` (`auditoria_controller.py:27-62`)
- **Roles permitidos:** `ADMIN_O_FACTURACION`.
- **Parámetros de ruta:** `id_alquiler` (`integer`).
- **Comportamiento:** verifica primero que el alquiler exista (`SELECT 1 FROM alquiler WHERE id_alquiler = :id_alquiler`); si no existe, retorna `None` y la ruta responde `404 ALQUILER_NOT_FOUND`. Si existe, consulta todos los eventos en `auditoria_sistema` con `nombre_tabla = 'alquiler'` e `id_registro_afectado = str(id_alquiler)`, haciendo `LEFT JOIN usuario` para resolver el nombre del usuario ejecutor.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "status": true,
    "mensaje": "Historial del alquiler",
    "data": {
      "id_alquiler": 10,
      "total_eventos": 2,
      "eventos": [
        {
          "id_auditoria": 45,
          "tipo_operacion": "UPDATE",
          "datos_anteriores": {},
          "datos_nuevos": {},
          "id_usuario_accion": "1001",
          "nombres_usuario_accion": "Nombre",
          "apellidos_usuario_accion": "Apellido",
          "fecha_accion": "2026-11-23T10:15:00"
        }
      ]
    },
    "error": null,
    "code": 200
  }
  ```
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 ALQUILER_NOT_FOUND` (`"El alquiler no existe"`), `422`, `500`.

### 11.13 `POST /api/sga/alquileres/{id_alquiler}/renovaciones`

- **Fuente:** `alquiler_routes.py:262-286` (`alquiler_controller.py:500-540`)
- **Roles permitidos:** `ADMIN_O_FACTURACION`.
- **Parámetros de ruta:** `id_alquiler` (`integer`).
- **Esquema de entrada (`RenovacionCreate`, `alquiler_schema.py:97-105`):**
  ```json
  {
    "dias": 7,
    "precio_alquiler": 600000.0
  }
  ```
  - `dias` (`integer`, requerido, `gt=0`): días adicionales que se suman a `tiempo_alquiler_dias`. Debe respetar la unidad mínima más restrictiva de los productos activos del alquiler.
  - `precio_alquiler` (`Decimal`, opcional, `gt=0`): si se envía, reemplaza el `precio_alquiler` total del contrato; si se omite, el precio actual se conserva.
- **Reglas de negocio:**
  - Solo se permite renovar contratos en estado `'activo'` o `'vencido'`.
  - Si el contrato estaba `'vencido'` y la nueva fecha de vencimiento calculada es `>= fecha_actual_bogota()`, el estado vuelve automáticamente a `'activo'` (`_aplicar_renovacion`, `L485-497`).
- **Respuesta exitosa (`200 OK`):** objeto `Alquiler` actualizado con `"detalles"`.
- **Errores:** `400 RENOVACION_NO_PERMITIDA`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 ALQUILER_NOT_FOUND`, `422`, `500`.

### 11.14 `POST /api/sga/alquileres/{id_alquiler}/entregas`

- **Fuente:** `alquiler_routes.py:293-322` (`alquiler_controller.py:551-607`)
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros de ruta:** `id_alquiler` (`integer`).
- **Esquema de entrada (`EntregaCreate`, `logistica_alquiler_schema.py:7-19`):**
  ```json
  {
    "observaciones_logistica_alquiler": "Entregado en portería de obra",
    "valor_gasto_logistico": 35000.0,
    "descripcion_gasto_logistico": "Transporte camión"
  }
  ```
  - Todos los campos tienen valor por defecto (`observaciones_logistica_alquiler = null`, `valor_gasto_logistico = 0.00`, `descripcion_gasto_logistico = null`).
  - `id_usuario_logistico` se toma del JWT (`usuario_actual.id_usuario`).
- **Reglas de negocio:**
  - Solo permitido cuando el alquiler está en `'pendiente'` (primera entrega, que transiciona `estado_alquiler` a `'activo'`) o en `'activo'` (entrega adicional de equipos).
  - Crea una fila en `logistica_alquiler` (`tipo_movimiento = 'ENTREGA'`) y una fila en la tabla puente `logistica_alquiler_alquiler`.
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "status": true,
    "mensaje": "Entrega registrada correctamente. El alquiler pasó a estado 'activo'.",
    "data": {
      "id_logistica_alquiler": 5,
      "id_alquiler": 10,
      "tipo_movimiento": "ENTREGA"
    },
    "error": null,
    "code": 201
  }
  ```
- **Errores:** `400 ENTREGA_NO_PERMITIDA`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 ALQUILER_NOT_FOUND`, `422`, `500`.

### 11.15 `GET /api/sga/alquileres/{id_alquiler}/entregas`

- **Fuente:** `alquiler_routes.py:325-337` (`alquiler_controller.py:610-642`)
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros de ruta:** `id_alquiler` (`integer`).
- **Respuesta exitosa (`200 OK`):** lista de movimientos con `tipo_movimiento = 'ENTREGA'` y `estado_registro = TRUE` asociados al alquiler:
  ```json
  {
    "status": true,
    "mensaje": "Entregas del alquiler",
    "data": [
      {
        "id_logistica_alquiler": 5,
        "id_alquiler": 10,
        "id_usuario_logistico": "1003",
        "nombres_logistico": "Pedro",
        "fecha_gasto": "2026-11-23T10:30:00",
        "descripcion_gasto_logistico": "Transporte camión",
        "valor_gasto_logistico": 35000.0,
        "observaciones_logistica_alquiler": "Entregado en portería de obra"
      }
    ],
    "error": null,
    "code": 200
  }
  ```
- **Comportamiento ante alquiler sin entregas:** si el alquiler existe pero no tiene entregas registradas, devuelve `200 OK` con `data: []`.
- **Comportamiento ante `id_alquiler` inexistente:** el controlador comprueba previamente la existencia del contrato en `alquiler`; si no existe, devuelve `404 ALQUILER_NOT_FOUND` (`"El alquiler no existe"` con `data: null`).
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 ALQUILER_NOT_FOUND`, `422`, `500`.

### 11.16 `POST /api/sga/alquileres/{id_alquiler}/recogidas`

- **Fuente:** `alquiler_routes.py:340-369` (`alquiler_controller.py:649-722`)
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros de ruta:** `id_alquiler` (`integer`).
- **Esquema de entrada (`RecogidaCreate`, `logistica_alquiler_schema.py:21-28`):** mismos campos opcionales que `EntregaCreate` (`observaciones_logistica_alquiler`, `valor_gasto_logistico = 0.00`, `descripcion_gasto_logistico`).
- **Reglas de negocio:**
  - Exige que exista al menos una entrega previa activa (`tipo_movimiento == "ENTREGA"`) asociada al alquiler en `logistica_alquiler_alquiler` (`RN-LOG-04`, `alquiler_controller.py:656-673`).
  - Solo permitido cuando el alquiler está en estado `'activo'` o `'vencido'`.
  - Crea la fila en `logistica_alquiler` (`tipo_movimiento = 'RECOGIDA'`), la fila en `logistica_alquiler_alquiler` y cambia `alquiler.estado_alquiler` a `'recogido'` (lo que dispara `trg_cerrar_alquiler_devolver_stock` en la BD para devolver el stock).
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "status": true,
    "mensaje": "Recogida registrada correctamente. El alquiler pasó a estado 'recogido'.",
    "data": {
      "id_logistica_alquiler": 6,
      "id_alquiler": 10,
      "tipo_movimiento": "RECOGIDA"
    },
    "error": null,
    "code": 201
  }
  ```
- **Errores:** `400 RECOGIDA_NO_PERMITIDA`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 ALQUILER_NOT_FOUND`, `422`, `500`.

### 11.17 `GET /api/sga/alquileres/{id_alquiler}/recogidas`

- **Fuente:** `alquiler_routes.py:372-384` (`alquiler_controller.py:725-757`)
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros de ruta:** `id_alquiler` (`integer`).
- **Respuesta exitosa (`200 OK`):** lista de movimientos con `tipo_movimiento = 'RECOGIDA'` asociados al alquiler (misma estructura de elementos que `GET /api/sga/alquileres/{id_alquiler}/entregas`).
- **Comportamiento ante alquiler sin recogidas:** si el alquiler existe pero no tiene recogidas registradas, devuelve `200 OK` con `data: []`.
- **Comportamiento ante `id_alquiler` inexistente:** el controlador comprueba previamente la existencia del contrato en `alquiler`; si no existe, devuelve `404 ALQUILER_NOT_FOUND` (`"El alquiler no existe"` con `data: null`).
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 ALQUILER_NOT_FOUND`, `422`, `500`.

---

## 12. Módulo 6: Detalle de alquiler (`/api/sga/detalle-alquiler`)

- **Archivo de ruta:** `sga_backend_jwt/app/routes/detalle_alquiler_routes.py`
- **Controlador:** `sga_backend_jwt/app/controllers/detalle_alquiler_controller.py`
- **Esquemas:** `sga_backend_jwt/app/schemas/detalle_alquiler_schema.py` (`DetalleAlquilerCreate`, `DetalleAlquilerUpdate`)

### 12.1 `POST /api/sga/detalle-alquiler`

- **Fuente:** `detalle_alquiler_routes.py:33-50` (`detalle_alquiler_controller.py:116-146`)
- **Roles permitidos:** `ADMIN_O_FACTURACION`.
- **Esquema de entrada (`DetalleAlquilerCreate`, `detalle_alquiler_schema.py:7-17`):**
  | Campo | Tipo | Requerido | Restricciones |
  |---|---|---|---|
  | `id_alquiler` | `integer` | Sí | ID del contrato de alquiler existente en estado `'pendiente'` o `'activo'` |
  | `id_producto` | `integer` | Sí | ID del producto existente con stock disponible suficiente |
  | `cantidad_productos` | `integer` | Sí | `gt=0` |
  | `precio_conjunto` | `Decimal` | Sí | `ge=0` (no recalcula automáticamente `alquiler.precio_alquiler`) |
  | `es_producto_extra` | `boolean` | No | Default `false`. El índice único parcial `idx_unico_producto_alquiler` permite solo una línea con `es_producto_extra = false` por par `(id_alquiler, id_producto)` |
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "status": true,
    "mensaje": "Producto agregado al alquiler correctamente",
    "data": {
      "id_detalle_alquiler": 2,
      "id_alquiler": 10,
      "id_producto": 3,
      "nombre_producto": "Tablón Metálico",
      "cantidad_productos": 4,
      "precio_conjunto": 60000.0,
      "es_producto_extra": true,
      "estado_registro": true,
      "fecha_creacion": "2026-11-23T11:00:00",
      "fecha_actualizacion": "2026-11-23T11:00:00"
    },
    "error": null,
    "code": 201
  }
  ```
- **Comportamiento ante `id_alquiler` inexistente:** `_obtener_alquiler_o_error()` (`detalle_alquiler_controller.py:18-32`) verifica el contrato y lanza `ValueError(f"El alquiler {id_alquiler} no existe")`, respondiendo con `400 Bad Request`, error `DETALLE_VALIDATION_ERROR` y `data: null`. Por decisión técnica aprobada, este endpoint conserva el código de validación `400` y no se normaliza a `404`.
- **Errores:** `400 DETALLE_VALIDATION_ERROR`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `422`, `500`.

### 12.2 `GET /api/sga/detalle-alquiler/{id_detalle_alquiler}`

- **Fuente:** `detalle_alquiler_routes.py:53-65` (`detalle_alquiler_controller.py:153-171`)
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros de ruta:** `id_detalle_alquiler` (`integer`).
- **Respuesta exitosa (`200 OK`):** objeto de línea de detalle con la misma estructura que `data` en `POST /api/sga/detalle-alquiler`.
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 DETALLE_NOT_FOUND` (`"El detalle de alquiler no existe"`), `422`, `500`.

### 12.3 `PATCH /api/sga/detalle-alquiler/{id_detalle_alquiler}`

- **Fuente:** `detalle_alquiler_routes.py:68-90` (`detalle_alquiler_controller.py:178-208`)
- **Roles permitidos:** `ADMIN_O_FACTURACION`.
- **Parámetros de ruta:** `id_detalle_alquiler` (`integer`).
- **Esquema de entrada (`DetalleAlquilerUpdate`, `detalle_alquiler_schema.py:20-30`):**
  - `cantidad_productos` (`integer`, opcional, `gt=0`)
  - `precio_conjunto` (`Decimal`, opcional, `ge=0`)
  - No permite cambiar `id_producto` (restringido tanto por el esquema como por el trigger `trg_validar_detalle_alquiler`).
- **Reglas de negocio:** el alquiler padre debe encontrarse en estado `'pendiente'` o `'activo'`; si `cantidad_productos` aumenta, el trigger valida y descuenta la diferencia del stock disponible.
- **Respuesta exitosa (`200 OK`):** objeto de línea de detalle actualizado.
- **Errores:** `400 DETALLE_VALIDATION_ERROR`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `404 DETALLE_NOT_FOUND`, `422`, `500`.

---

## 13. Módulo 7: Gastos logísticos (`/api/sga/gastos`)

- **Archivo de ruta:** `sga_backend_jwt/app/routes/gastos_routes.py`
- **Controlador:** `sga_backend_jwt/app/controllers/logistica_alquiler_controller.py`
- **Esquema:** `sga_backend_jwt/app/schemas/logistica_alquiler_schema.py` (`GastoCreate`)

### 13.1 `POST /api/sga/gastos`

- **Fuente:** `gastos_routes.py:28-50` (`logistica_alquiler_controller.py:19-53`)
- **Roles permitidos:** `STAFF_INTERNO`.
- **Esquema de entrada (`GastoCreate`, `logistica_alquiler_schema.py:31-43`):**
  | Campo | Tipo | Requerido | Restricciones |
  |---|---|---|---|
  | `ids_alquiler` | `List[int]` | Sí | `min_length=1` (uno o varios alquileres asociados en la tabla puente `logistica_alquiler_alquiler`) |
  | `valor_gasto_logistico` | `Decimal` | Sí | Validado `>= 0` en BD (`chk_logistica_valor_gasto`) |
  | `descripcion_gasto_logistico` | `string \| null` | No | Default `null` |
  | `observaciones_logistica_alquiler` | `string \| null` | No | Default `null` |
- **Reglas de negocio:**
  - `id_usuario_logistico` se toma del JWT (`usuario_actual.id_usuario`).
  - Persiste un registro en `logistica_alquiler` con `tipo_movimiento = 'GASTO'` y una fila en `logistica_alquiler_alquiler` por cada elemento de `ids_alquiler`.
- **Respuesta exitosa (`201 Created`):**
  ```json
  {
    "status": true,
    "mensaje": "Gasto registrado correctamente para 2 alquiler(es)",
    "data": {
      "id_logistica_alquiler": 12,
      "tipo_movimiento": "GASTO",
      "valor_gasto_logistico": 80000.0,
      "ids_alquiler": [10, 11]
    },
    "error": null,
    "code": 201
  }
  ```
- **Errores:** `400 GASTO_VALIDATION_ERROR`, `401 AUTH_ERROR`, `403 FORBIDDEN`, `422`, `500`.

### 13.2 `GET /api/sga/gastos`

- **Fuente:** `gastos_routes.py:53-61` (`logistica_alquiler_controller.py:60-94`)
- **Roles permitidos:** `STAFF_INTERNO`.
- **Parámetros query:**
  - `id_alquiler` (`integer`, opcional): filtra gastos (`tipo_movimiento = 'GASTO'`) vinculados a ese alquiler en `logistica_alquiler_alquiler`.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "status": true,
    "mensaje": "Gastos encontrados",
    "data": [
      {
        "id_logistica_alquiler": 12,
        "id_usuario_logistico": "1003",
        "nombres_logistico": "Pedro",
        "fecha_gasto": "2026-11-23T11:10:00",
        "descripcion_gasto_logistico": "Combustible viaje compartido",
        "valor_gasto_logistico": 80000.0,
        "observaciones_logistica_alquiler": null,
        "tipo_movimiento": "GASTO",
        "ids_alquiler": [10, 11]
      }
    ],
    "error": null,
    "code": 200
  }
  ```
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `422`, `500`.

### 13.3 `GET /api/sga/gastos/resumen-semanal`

- **Fuente:** `gastos_routes.py:64-72` (`logistica_alquiler_controller.py:101-115`)
- **Roles permitidos:** `ADMIN_O_FACTURACION`.
- **Parámetros:** ninguno.
- **Comportamiento técnico de agregación:** la consulta implementada en `logistica_alquiler_controller.py:101-115` realiza un `SUM(valor_gasto_logistico)` agrupando por `date_trunc('week', fecha_gasto)` sobre todas las filas de `logistica_alquiler`, sin filtro por `tipo_movimiento` ni por `estado_registro`, incluyendo `ENTREGA`, `RECOGIDA` y `GASTO`. Por lo tanto, el total semanal consolidado agrega los importes de todos los registros logísticos existentes en la tabla.
- **Respuesta exitosa (`200 OK`):** lista agrupada por inicio de semana (`date_trunc('week', fecha_gasto)::date`) ordenada descendentemente:
  ```json
  {
    "status": true,
    "mensaje": "Resumen semanal de gastos",
    "data": [
      {
        "semana_inicio": "2026-11-23",
        "cantidad_registros": 4,
        "total_gasto": 195000.0
      }
    ],
    "error": null,
    "code": 200
  }
  ```
- **Errores:** `401 AUTH_ERROR`, `403 FORBIDDEN`, `500`.

---

## 14. Rutas auxiliares fuera del prefijo `/api/sga`

Estas rutas pertenecen a la instancia principal `FastAPI` (`sga_backend_jwt/app/main.py`) y **no forman parte de las 38 operaciones REST bajo `/api/sga`**.

### 14.1 Ruta raíz de diagnóstico (`GET /`)

- **Fuente:** `sga_backend_jwt/app/main.py:134-145`
- **Acceso:** Público (sin autenticación).
- **Respuesta (`200 OK`):**
  ```json
  {
    "status": true,
    "mensaje": "API SGA funcionando",
    "data": {
      "version": "2.0.0",
      "api": "/api/sga"
    },
    "error": null,
    "code": 200
  }
  ```

### 14.2 Rutas de documentación automática de FastAPI

En `sga_backend_jwt/app/main.py:31-35`, la aplicación se instancia mediante `FastAPI(title="API SGA", description="...", version="2.0.0")` sin deshabilitar los parámetros por defecto `docs_url`, `redoc_url` ni `openapi_url`. Por tanto, en la configuración actual del código están habilitadas:

| Ruta | Método | Descripción |
|---|---|---|
| `/docs` | `GET` | Interfaz interactiva Swagger UI (utilizada además por el `healthcheck` del contenedor `backend` en `docker-compose.yml:80`) |
| `/redoc` | `GET` | Interfaz de documentación ReDoc |
| `/openapi.json` | `GET` | Esquema OpenAPI 3.x generado dinámicamente por FastAPI |

> [!WARNING]
> **Nota sobre exposición en producción:** La presencia de `/docs`, `/redoc` y `/openapi.json` en la configuración del código fuente demuestra que están habilitadas en el proceso FastAPI local/Docker, pero **no demuestra que estén expuestas de igual forma en producción** (donde su acceso depende de las reglas de enrutamiento y plataforma del despliegue). No se ha verificado de forma independiente la configuración del entorno productivo.

---

## 15. Consideraciones de seguridad

1. **No exposición de contraseñas ni hashes (`I-001` / `DXA-06` corregido en código):**
   El modelo `Usuario` (`sga_backend_jwt/app/models/usuario.py:14-25`) y el serializador central (`sga_backend_jwt/app/utils/response.py:16-122`) aplican una lista blanca de 10 atributos públicos y un filtro recursivo (`CAMPOS_SENSIBLES_EXCLUIDOS`) que impide que `contrasena_usuario` o cualquier hash de contraseña se incluya en respuestas de `/api/sga/usuarios`, `/api/sga/clientes`, `/api/sga/auth/login` o estructuras anidadas.
2. **Inyección de identidad y auditoría desde el JWT:**
   Los campos de autoría operativa (`id_usuario_creador` en `POST /api/sga/alquileres`, `id_usuario_logistico` en `POST /api/sga/alquileres/{id}/entregas`, `/recogidas` y `POST /api/sga/gastos`, así como `app.usuario_actual` mediante `set_audit_context()`) se toman siempre del `UsuarioActual` extraído del JWT, nunca del cuerpo de la petición.
3. **Exposición de mensajes en errores `500` (`I-008` abierto):**
   En los bloques genéricos `except Exception as error:` de los archivos de rutas, el campo `error` del sobre estándar devuelve `str(error)` con código `500`. Este hallazgo (`I-008` en `EVD-2026-003`) permanece registrado como pendiente de una tarea técnica específica.
4. **Ausencia de rate limiting en login (`I-003` abierto):**
   `POST /api/sga/auth/login` no implementa limitación de tasa de intentos en el código actual.

---

## 16. Limitaciones conocidas, comportamientos en revisión y aspectos no verificados

### 16.1 Restricción de permisos en `PATCH /api/sga/alquileres/{id_alquiler}/estado` (implementado y verificado)

- `PATCH /api/sga/alquileres/{id_alquiler}/estado` (`alquiler_routes.py:195-216`) está restringido exclusivamente a `ADMIN_O_FACTURACION` (`admin`, `encargado_facturacion`).
- Los usuarios con rol `encargado_logistico` son rechazados por la dependencia de autorización con `403 FORBIDDEN` (`error: "FORBIDDEN"`).
- En la interfaz web (`sga_frontend_jwt/src/components/alquilerDetalleComponents/CambiarEstadoSection.tsx`), el selector y el botón para cambio manual de estado se ocultan si `puedeGestionarFacturacion` es falso, mostrando un mensaje informativo de restricción.
- Este comportamiento cuenta con cobertura de pruebas automatizadas en `sga_backend_jwt/tests/test_alquiler_subresources_and_permissions.py`.

### 16.2 Normalización de respuestas ante `id_alquiler` inexistente (implementado y verificado)

Se estandarizó el contrato de respuesta cuando se consulta un `id_alquiler` que no existe en la tabla `alquiler`:
- **Operaciones de subrecursos normalizadas a `404 ALQUILER_NOT_FOUND`:**
  - `GET /api/sga/alquileres/{id_alquiler}/detalles`
  - `GET /api/sga/alquileres/{id_alquiler}/entregas`
  - `GET /api/sga/alquileres/{id_alquiler}/recogidas`
  Los controladores (`detalle_alquiler_controller.py:84` y `alquiler_controller.py:610,725`) verifican la existencia previa del contrato padre mediante `SELECT 1 FROM alquiler WHERE id_alquiler = :id_alquiler`. Si el alquiler no existe, retornan `None`, y el endpoint responde `404` con código `ALQUILER_NOT_FOUND`, mensaje `"El alquiler no existe"` y `data: null`. Si el alquiler existe pero no tiene registros asociados, retornan `200 OK` con `data: []`.
- **Operación de creación `POST /api/sga/detalle-alquiler` (conserva `400 DETALLE_VALIDATION_ERROR`):**
  Cuando se envía un `id_alquiler` inexistente en el cuerpo de la petición, `_obtener_alquiler_o_error()` lanza `ValueError`, devolviendo `400 Bad Request` con código `DETALLE_VALIDATION_ERROR` y `data: null`. Este comportamiento se conservó explícitamente por consistencia con las validaciones de carga de datos en creación.
- Todo este comportamiento se encuentra cubierto por pruebas automatizadas de regresión en `sga_backend_jwt/tests/test_alquiler_subresources_and_permissions.py`.

### 16.3 Aspectos dependientes de base de datos y entorno productivo

- **Triggers y funciones PL/pgSQL:** las validaciones de stock, fechas de inicio, mínimo un administrador activo, prohibición de reapertura y registro en `auditoria_sistema` residen en `database/01_esquema/02_funciones_y_triggers.sql`. En producción fueron ejecutados manualmente según declaración del propietario; su incorporación a una revisión integral de Alembic está pendiente de implementación (`DXA-12b` / `I-016`).
- **Reconciliación de vencimientos sin contexto de usuario:** tanto el job diario `_job_actualizar_vencidos()` (`scheduler.py:22-41`) como la función auxiliar `verificar_y_actualizar_vencidos(db)` (`alquiler_controller.py:96-108`, invocada como paso preliminar en seis escrituras de `alquiler_controller.py` antes del `set_audit_context()` de cada operación principal) actualizan alquileres vencidos con `id_usuario_accion = NULL`.
- **Variable de sesión en `fn_impedir_autodesactivacion_admin()`:** lee `app.current_user_id` (`02_funciones_y_triggers.sql:145`), mientras que el backend establece `app.usuario_actual` (`audit_context.py:36`).

---

*Fin de la referencia de la API REST (`DOC-OF-07` — `RM-DOC-011`).*
