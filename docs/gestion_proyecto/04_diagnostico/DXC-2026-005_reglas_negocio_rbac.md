# 05 — Reglas de Negocio y Matriz RBAC

> **Fuentes de la auditoría:** código del backend (`app/utils/roles.py`, `app/utils/auth_dependency.py`, `app/controllers/*`, `app/schemas/*`), triggers de PostgreSQL (`database/01_esquema/02_funciones_y_triggers.sql`), espejo de permisos del frontend (`src/utils/permisos.ts`) y documentación previa del repositorio (`README.md` raíz, `database/README_base_de_datos.md`, `database/03_documentacion/INDICE.md`, READMEs de backend y frontend).
>
> **Reglas de codificación usadas en este documento:** las reglas ya identificables en el código con un identificador `RN-XXX-NN` se conservan con ese identificador. Las reglas derivadas de la auditoría que **no** tienen identificador en el código se numeran con el prefijo `RN-AUD-*` para que puedan integrarse formalmente al catálogo.

> ⚠️ **Documento generado el 2026-10-19 sobre la rama local `dev` @ `14726ad`
> (anterior al commit `12760d4`).** Contenido mayormente vigente (RBAC intacto, S-10),
> pero debe contrastarse con [AUD-2026-002](../01_auditorias/AUD-2026-002_auditoria_dev_remota_12760d4.md) para confirmar el estado actual.
---

## 1. Roles del sistema

El rol se almacena en `usuario.rol_usuario` y está restringido por `CHECK chk_usuario_rol` en la BD a exactamente cuatro valores:

| Rol | Naturaleza | ¿Accede al sistema? |
|---|---|---|
| `admin` | Personal interno — administrador | Sí |
| `encargado_facturacion` | Personal interno — facturación y contractual | Sí |
| `encargado_logistico` | Personal interno — operación en obra (entregas, recogidas, gastos) | Sí |
| `cliente` | Cliente del sistema de alquiler | **No** |

### 1.1 Jerarquía de permisos (regla explícita del proyecto)

```
admin  >  encargado_facturacion  >  encargado_logistico  >  cliente
```

> `encargado_facturacion` puede hacer **todo** lo que hace `encargado_logistico`, pero no al revés. Por eso cualquier grupo de roles que incluya `encargado_logistico` incluye siempre también a `encargado_facturacion` y `admin`. `cliente` **nunca** aparece en un grupo de acceso: no es un actor de la aplicación web.

Esta jerarquía se materializa en tres artefactos que deben mantenerse sincronizados:

| Artefacto | Ubicación | Contenido |
|---|---|---|
| Grupos de roles (backend, autoridad) | `app/utils/roles.py` | `SOLO_ADMIN`, `ADMIN_O_FACTURACION`, `ADMIN_O_LOGISTICO`, `STAFF_INTERNO` |
| Restricción de rol en BD | `CHECK chk_usuario_rol` | El conjunto de roles válidos |
| Espejo de permisos (frontend, UX) | `src/utils/permisos.ts` | Mismos tres grupos + `tienePermiso()` |

> `ADMIN_O_LOGISTICO` está definido en el backend pero **no se usa en ninguna ruta**. Grupo muerto que puede eliminarse o empezar a aplicarse.

---

## 2. RBAC: mecanismo de aplicación

### 2.1 Autenticación (`app/utils/auth_dependency.py`)

```
HTTP Bearer token
      │
      ├─ sin header Authorization ──────────► 401 "Falta el header Authorization: Bearer <token>"
      ├─ token vencido ─────────────────────► 401 "El token ha expirado. Inicia sesión nuevamente."
      ├─ token inválido / malformado ───────► 401 "Token inválido."
      └─ token válido ──────────────────────► UsuarioActual { id_usuario, rol_usuario }
```

`UsuarioActual` es el objeto que se propaga por toda la capa de negocio:
- `id_usuario` → se inyecta en los campos de autoría (`id_usuario_creador`, `id_usuario_logistico`) y en `app.usuario_actual` para la auditoría.
- `rol_usuario` → se usa para autorizar.

### 2.2 Autorización (`app/utils/roles.py`)

`requiere_rol(*roles_permitidos)` es una **fábrica de dependencias** de FastAPI:

```python
if usuario.rol_usuario not in roles_permitidos:
    raise HTTPException(status_code=403, detail="El rol '<rol>' no tiene permiso …")
```

Se aplica de dos formas:

| Forma | Ejemplo | Efecto |
|---|---|---|
| A nivel de router | `APIRouter(prefix="/alquileres", dependencies=[Depends(get_current_user)])` | Exige sesión en **todas** las rutas del router. |
| A nivel de endpoint | `@router.post("", dependencies=[Depends(requiere_rol(*ADMIN_O_FACTURACION))])` | Exige además un rol concreto. |

**Código de estado:** `403` (no `401`) cuando el rol no alcanza: el token es válido, lo que falla es la autorización. `401` queda reservado para credenciales y token.

### 2.3 Doble barrera (frontend + backend)

```
UI:  ProtectedRoute / tienePermiso()  →  oculta o deshabilita el control      (UX)
API: requiere_rol(...)                →  403 si el rol no alcanza              (autoridad)
```

El frontend **nunca** decide permisos: solo replica el grupo del backend para no ofrecer acciones que van a fallar. La autoridad es exclusivamente del backend.

---

## 3. Matriz de permisos por endpoint

Leyenda: ✅ permitido · ⛔ prohibido (403) · 🔒 solo admin · — sin sesión requerida

| Recurso / Operación | admin | encargado_facturacion | encargado_logistico | cliente |
|---|:---:|:---:|:---:|:---:|
| `GET /` (health) | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/login` | ✅ | ✅ | ✅ | ⛔ (rechazado en el controller) |
| **Usuarios** | | | | |
| `POST /usuarios` | 🔒 | ⛔ | ⛔ | ⛔ |
| `GET /usuarios` (sin filtro) | ✅ | ⛔ | ⛔ | ⛔ |
| `GET /usuarios?rol=encargado_logistico` | ✅ | ✅ | ✅ | ⛔ |
| `GET /usuarios/{id}` | 🔒 | ⛔ | ⛔ | ⛔ |
| `PATCH/PUT /usuarios/{id}` | 🔒 | ⛔ | ⛔ | ⛔ |
| `PATCH /usuarios/{id}/estado` | 🔒 | ⛔ | ⛔ | ⛔ |
| **Clientes** | | | | |
| `POST /clientes` | ✅ | ✅ | ⛔ | ⛔ |
| `GET /clientes` | ✅ | ✅ | ✅ | ⛔ |
| `GET /clientes/{id}` | ✅ | ✅ | ✅ | ⛔ |
| `PATCH/PUT /clientes/{id}` | ✅ | ✅ | ⛔ | ⛔ |
| `PATCH /clientes/{id}/estado` | ✅ | ✅ | ⛔ | ⛔ |
| **Productos** | | | | |
| `POST /productos` | 🔒 | ⛔ | ⛔ | ⛔ |
| `GET /productos` | ✅ | ✅ | ✅ | ⛔ |
| `GET /productos/{id}` | ✅ | ✅ | ✅ | ⛔ |
| `PATCH/PUT /productos/{id}` | 🔒 | ⛔ | ⛔ | ⛔ |
| `PATCH /productos/{id}/estado` | 🔒 | ⛔ | ⛔ | ⛔ |
| **Inventario** | | | | |
| `GET /inventario` | ✅ | ✅ | ✅ | ⛔ |
| `GET /inventario/productos/{id}` | ✅ | ✅ | ⛔ | ⛔ |
| **Alquileres** | | | | |
| `POST /alquileres` | ✅ | ✅ | ⛔ | ⛔ |
| `GET /alquileres` | ✅ | ✅ | ✅ | ⛔ |
| `GET /alquileres/buscar` | ✅ | ✅ | ✅ | ⛔ |
| `GET /alquileres/proximos-vencer` | ✅ | ✅ | ✅ | ⛔ |
| `GET /alquileres/pendientes-entrega` | ✅ | ✅ | ✅ | ⛔ |
| `GET /alquileres/{id}` | ✅ | ✅ | ✅ | ⛔ |
| `GET /alquileres/{id}/detalles` | ✅ | ✅ | ✅ | ⛔ |
| `PATCH/PUT /alquileres/{id}` | ✅ | ✅ | ⛔ | ⛔ |
| `PATCH /alquileres/{id}/estado` | ✅ | ✅ | ✅ | ⛔ |
| `DELETE /alquileres/{id}` (cancelar) | ✅ | ✅ | ⛔ | ⛔ |
| `GET /alquileres/{id}/historial` | ✅ | ✅ | ⛔ | ⛔ |
| `POST /alquileres/{id}/renovaciones` | ✅ | ✅ | ⛔ | ⛔ |
| `POST /alquileres/{id}/entregas` | ✅ | ✅ | ✅ | ⛔ |
| `GET /alquileres/{id}/entregas` | ✅ | ✅ | ✅ | ⛔ |
| `POST /alquileres/{id}/recogidas` | ✅ | ✅ | ✅ | ⛔ |
| `GET /alquileres/{id}/recogidas` | ✅ | ✅ | ✅ | ⛔ |
| **Detalle de alquiler** | | | | |
| `POST /detalle-alquiler` | ✅ | ✅ | ⛔ | ⛔ |
| `GET /detalle-alquiler/{id}` | ✅ | ✅ | ✅ | ⛔ |
| `PATCH /detalle-alquiler/{id}` | ✅ | ✅ | ⛔ | ⛔ |
| **Renovaciones (consulta)** | | | | |
| `GET /renovaciones/{id_auditoria}` | ✅ | ✅ | ⛔ | ⛔ |
| **Gastos logísticos** | | | | |
| `POST /gastos` | ✅ | ✅ | ✅ | ⛔ |
| `GET /gastos` | ✅ | ✅ | ✅ | ⛔ |
| `GET /gastos/resumen-semanal` | ✅ | ✅ | ⛔ | ⛔ |

### 3.1 Matriz funcional resumida

| Capacidad | admin | encargado_facturacion | encargado_logistico |
|---|:---:|:---:|:---:|
| Alta/edición/baja de **personal** (usuarios) | ✅ | — | — |
| Alta/edición/baja de **clientes** | ✅ | ✅ | — |
| Catálogo de **productos** (CRUD completo) | ✅ | — | — |
| **Inventario** (consulta general) | ✅ | ✅ | ✅ |
| **Crear alquileres** | ✅ | ✅ | — |
| **Editar/renovar/cancelar alquileres** | ✅ | ✅ | — |
| **Consultar alquileres** y su detalle | ✅ | ✅ | ✅ |
| **Historial de auditoría** de un alquiler | ✅ | ✅ | — |
| **Entregas y recogidas** en obra | ✅ | ✅ | ✅ |
| **Gestión de líneas de producto** del alquiler | ✅ | ✅ | — |
| **Registro de gastos** logísticos | ✅ | ✅ | ✅ |
| **Resumen semanal** de gastos | ✅ | ✅ | — |

---

## 4. Reglas de negocio del ciclo de vida del alquiler

### 4.1 Estados

`alquiler.estado_alquiler` — `CHECK chk_alquiler_estado`:

```
pendiente → activo → vencido → recogido → terminado
                    ↘        ↘         ↘
                     cancelado (alternativa)
```

### 4.2 Grafo de transiciones (`alquiler_controller.TRANSICIONES_VALIDAS`)

| Estado actual | Destinos permitidos |
|---|---|
| `pendiente` | `activo`, `cancelado` |
| `activo` | `vencido`, `recogido`, `terminado`, `cancelado` |
| `vencido` | `recogido`, `terminado`, `cancelado` |
| `recogido` | `terminado` |
| `terminado` | — (estado final) |
| `cancelado` | — (estado final) |

`ESTADOS_FINALES = {"terminado", "cancelado"}`.

- Una transición no permitida → `400 ALQUILER_ESTADO_INVALIDO`.
- Cambiar a un estado idéntico al actual → `400` ("El alquiler ya se encuentra en estado X").
- Reabrir un alquiler desde un estado final está **prohibido por la BD** (`trg_prohibir_reabrir_alquiler`), salvo el procedimiento administrativo `fn_admin_reabrir_alquiler` (§4.7).

### 4.3 RN-AUD-01 — Vencimiento y fórmula única

`fecha_vencimiento = fecha_inicio + (tiempo_alquiler_dias − 1)`. El día de inicio **cuenta** como el primer día del alquiler.

- `tiempo_alquiler_dias` es la única unidad persistida (decisión de escalabilidad documentada en `01_tablas.sql`).
- Zona horaria única: `America/Bogota` (`app/utils/tiempo.py`). Ningún módulo debe llamar `date.today()` o `datetime.now()` directamente.
- La fórmula se genera desde una **única plantilla** (`_plantilla_fecha_vencimiento`), en dos variantes SQL (con alias y sin alias), de modo que la versión Python y la SQL no pueden divergir. Existe un índice funcional sobre la misma expresión.

### 4.4 RN-AUD-02 — Vencimiento automático por doble vía

`activo → vencido` ocurre por dos mecanismos independientes:
1. **Job programado:** APScheduler, `CronTrigger(hour=0, minute=5, timezone="America/Bogota")`, registrado en el `startup` de la app. El `timezone` se pasa explícitamente al `CronTrigger` porque **no hereda** el del `BackgroundScheduler` (corregido en el código: sin ese parámetro el job corría a las 00:05 UTC = 19:05 Bogotá del día anterior).
2. **Reconciliación bajo demanda:** `verificar_y_actualizar_vencidos(db)` se invoca en las operaciones de escritura, para que la respuesta nunca contradiga al estado persistido.

### 4.5 RN-AUD-03 — Matriz de campos editables por estado

`alquiler_controller.CAMPOS_EDITABLES_POR_ESTADO`:

| Estado | Campos modificables |
|---|---|
| `pendiente` | `direccion`, `barrio`, `precio_alquiler`, `deposito`, `fecha_inicio`, `tiempo_alquiler_dias`, `se_lleva`, `se_recoge` |
| `activo` | `precio_alquiler`, `tiempo_alquiler_dias`, `se_lleva`, `se_recoge` |
| `vencido` | `precio_alquiler`, `tiempo_alquiler_dias` |
| `recogido` | — |
| `terminado` | — |
| `cancelado` | — |

Modificar un campo no permitido produce `400` con el mensaje: *"En estado 'X' no se puede modificar: <campos> (ver matriz de edición por estado)."*

### 4.6 RN-ALQ-03 — Creación transaccional con detalle anidado

- `POST /alquileres` inserta el alquiler y **todas** sus líneas `detalle_alquiler` en una **única transacción** (`db.add` + `db.flush` + `db.commit`). Si una línea falla (p. ej. stock insuficiente), no queda alquiler huérfano.
- El payload debe incluir al menos una línea (`detalles` con `min_length=1`).
- `id_usuario_creador` **nunca** se recibe del cliente: se toma del JWT.
- `fecha_inicio` no puede ser anterior a hoy (`trg_validar_fecha_inicio`).

### 4.7 RN-AUD-04 — Reapertura administrativa controlada

- Un alquiler en `terminado` o `recogido` **no** puede volver a `activo` por la vía HTTP (`PATCH /alquileres/{id}/estado` lo rechaza por el grafo de transiciones; el trigger lo rechaza a nivel de BD).
- Un alquiler `cancelado` **no** se puede reabrir bajo ninguna circunstancia, ni siquiera por el procedimiento administrativo.
- La vía autorizada es `fn_admin_reabrir_alquiler(p_id_alquiler)`, que:
  1. rechaza `cancelado`;
  2. verifica stock libre real en bodega para cada línea activa;
  3. habilita la bandera transaccional `app.permitir_reapertura = 'true'`;
  4. pone el alquiler en `activo`;
  5. re-descuenta el stock;
  6. limpia la bandera.

> **Pendiente de decisión (§7):** esta función no está expuesta por ningún endpoint. Hoy la reapertura es una operación de consola SQL, sin trazabilidad de usuario en `auditoria_sistema` más allá de la identidad de sesión.

### 4.8 RN-AUD-05 — Renovación

- Solo se renueva un alquiler en `activo` o `vencido`; en otro caso, `400 RENOVACION_NO_PERMITIDA`.
- `dias` se **suman** al período existente (`tiempo_alquiler_dias += dias`).
- Los días deben ser compatibles con la `unidad_minima_alquiler` de los productos **ya incluidos** en el alquiler.
- Si el alquiler estaba `vencido` y la nueva fecha de vencimiento es ≥ hoy, vuelve automáticamente a `activo`; si el vencimiento sigue en el pasado, permanece `vencido` deliberadamente.
- `precio_alquiler` es opcional: si se envía, reemplaza el total; si se omite, el precio no cambia.
- **No existe tabla `renovaciones`:** la renovación se persiste como un `UPDATE` sobre `alquiler` y queda registrada automáticamente en `auditoria_sistema`. El `id_auditoria` del evento se devuelve en `id_auditoria_renovacion` y puede consultarse en `GET /renovaciones/{id_auditoria}`.
- Un **aumento** de `tiempo_alquiler_dias` vía `PATCH /alquileres/{id}` se trata como una renovación (mismas reglas). Una **disminución** es una corrección administrativa y se rechaza si la nueva fecha de vencimiento quedaría en el pasado.

### 4.9 RN-AUD-06 — Precio del alquiler controlado por el staff

`precio_alquiler` **no** se recalcula como `SUM(detalle_alquiler.precio_conjunto)`.

- **Motivo documentado en el código:** un recálculo automático borraría en silencio ajustes comerciales (p. ej. transporte incluido en un alquiler grande) que el staff decidió conscientemente.
- Consecuencia: al agregar o modificar líneas de producto, el staff **debe** actualizar el precio manualmente vía `PATCH /alquileres/{id}`.
- La función `_recalcular_precio_alquiler` permanece en el código, marcada como *deprecated como llamada automática*, disponible por si en el futuro se quiere un botón explícito de "recalcular según productos".
- `precio_conjunto` sí es la "fotografía" del precio pactado por línea al momento de firmar.

### 4.10 RN-AUD-07 — Producto base vs. producto extra

- `detalle_alquiler.es_producto_extra`: `FALSE` = componente base del conjunto; `TRUE` = adicional cobrado.
- Índice único parcial `idx_unico_producto_alquiler ON (id_alquiler, id_producto) WHERE es_producto_extra = FALSE`: un producto solo puede aparecer **una vez** como línea base por alquiler; puede repetirse si es extra.
- El frontend replica esta regla en `validacionesAlquiler.ts` para dar un mensaje claro antes de que la BD rechace el `INSERT`.
- `producto.precio_base_extra` es el precio del ítem cuando se agrega como extra; si no se especifica al crear el producto, el controller lo iguala a `precio_base_producto`.

### 4.11 RN-AUD-08 — Unidad mínima de alquiler y convención comercial

- `producto.unidad_minima_alquiler ∈ {DIA, SEMANA, MES}`; jerarquía `DIA < SEMANA < MES`.
- `precio_base_producto` se interpreta **siempre** "por" la unidad mínima del producto (si es `SEMANA`, es un precio semanal).
- Un producto puede alquilarse en su unidad mínima o una **superior**, nunca inferior.
- Convención comercial: **1 semana = 7 días**, **1 mes = 30 días** (no el mes calendario).
- Consecuencia: `tiempo_alquiler_dias` debe ser múltiplo de 7 o de 30 según la unidad más restrictiva del conjunto.
- La autoridad de la regla es el backend (`app/utils/unidades.py:validar_tiempo_alquiler_para_productos`), que **re-consulta la BD** y no confía en la restricción de la UI. La UI solo deshabilita opciones (`src/utils/tiempoUi.ts`).

### 4.12 RN-AUD-09 — Cálculo de precio de conjunto

`precio_conjunto = precio_base_producto × cantidad × (días ÷ factor_unidad)`, con factor 1 / 7 / 30. El cálculo se hace por **unidades completas**, nunca con fracciones (se evita el prorrateo de una unidad comercial). Implementado en `src/utils/precios.ts`.

### 4.13 RN-AUD-10 — Líneas de detalle editables solo en contrato vivo

`detalle_alquiler_controller.ESTADOS_DETALLE_EDITABLE = ("pendiente", "activo")`.

- En `terminado`, `recogido` o `cancelado`, cualquier `INSERT`/`UPDATE` de una línea es rechazado por `trg_validar_detalle_alquiler` (mensaje: *"Operación denegada. No se pueden modificar ítems de un alquiler en estado '%'."*).
- `id_producto` es **inmutable** en una línea viva: *"No se permite cambiar el producto de una línea activa. Debe eliminar la línea y agregar una nueva."*
- `DetalleAlquilerUpdate` no expone `id_producto` ni `id_alquiler`.

### 4.14 RN-AUD-11 — El creator del alquiler debe estar activo

`trg_verificar_usuario_activo_alquiler` impide crear o modificar un alquiler cuyo `id_usuario_creador` esté desactivado.

> **Brecha:** el trigger solo valida en `INSERT`/`UPDATE` de `alquiler`. No impide que un usuario desactivado conserve alquileres `activo` vigentes. Ver §7.

### 4.15 RN-AUD-12 — Fecha de inicio no retroactiva

`trg_validar_fecha_inicio`: `NEW.fecha_inicio < CURRENT_DATE` → excepción *"La fecha de inicio del alquiler (%) no puede ser anterior a hoy (%)."*

---

## 5. Reglas de negocio de stock e inventario

### 5.1 RN-AUD-13 — `stock_alquilado` es un campo derivado

- **Nunca** se escribe desde la API ni manualmente: lo mantiene `trg_sincronizar_stock_producto`.
- El backend solo lo **lee**; el schema `ProductoUpdate` ni siquiera lo expone.
- Invariante: `0 ≤ stock_alquilado ≤ stock_total` (`CHECK chk_producto_stock_alquilado`).

### 5.2 RN-AUD-14 — Validación previa al descuento

`trg_validar_detalle_alquiler` (BEFORE) valida antes de que el AFTER descuente:
- No se admiten cambios en alquileres cerrados.
- No se puede cambiar el producto de una línea viva.
- La diferencia de cantidad no puede superar `stock_total − stock_alquilado`; el mensaje es *"Stock insuficiente para el producto '%'. Disponible: %, Solicitado adicional: %"*.

### 5.3 RN-AUD-15 — Baja de producto con unidades en obra

`trg_validar_modificacion_producto` rechaza el `DELETE` físico o el borrado lógico de un producto con `stock_alquilado > 0`:
*"Operación cancelada: El producto '%' tiene % unidades en obra. No se puede dar de baja."*

### 5.4 RN-AUD-16 — Ajuste de stock total

`NEW.stock_total < NEW.stock_alquilado` → *"Ajuste denegado para '%': El stock total (%) no puede ser menor al stock alquilado actualmente en obras (%)."* El backend no duplica esta validación: deja que la BD la aplique y traduce el mensaje.

### 5.5 RN-AUD-17 — Devolución de stock al cerrar

Al pasar de un estado no final a `terminado`/`recogido`/`cancelado`, `trg_cerrar_alquiler_devolver_stock` descuenta de `stock_alquilado` todas las líneas activas del alquiler.

### 5.6 RN-AUD-18 — Borrado lógico

Todas las tablas de negocio usan `estado_registro` (booleano) en lugar de `DELETE` físico, para preservar la trazabilidad. Los triggers de stock distinguen explícitamente el borrado lógico (`TRUE → FALSE`, resta) de la reactivación (`FALSE → TRUE`, suma).

---

## 6. Reglas de negocio de logística y gastos

### 6.1 RN-LOG-04 — Recogida exige entrega previa

> *"No se puede registrar una recogida sin una entrega previa para este alquiler."*

- Se verifica en el controller (`registrar_recogida`) consultando `logistica_alquiler` por la tabla puente.
- El estado del alquiler debe ser `activo` o `vencido`.
- Efecto: la recogida transiciona el alquiler a `recogido`.

### 6.2 RN-AUD-19 — Entrega

- Solo con el alquiler en `pendiente`; efecto: transiciona a `activo`.
- Registra en `logistica_alquiler` con `tipo_movimiento = 'ENTREGA'` y el usuario del JWT.

### 6.3 RN-AUD-20 — Gasto logístico N:N

- `tipo_movimiento = 'GASTO'`: no produce transición de estado y puede asociarse a **uno o varios** alquileres (viaje multiequipo).
- `valor_gasto_logistico ≥ 0` (`CHECK`).
- El gasto se registra contra los alquileres mediante filas en `logistica_alquiler_alquiler`.

### 6.4 RN-GAS-07 — Resumen semanal de gastos

- Endpoint `GET /gastos/resumen-semanal`, restringido a `ADMIN_O_FACTURACION`.
- Agrega por `date_trunc('week', fecha_gasto)`: `semana_inicio`, `cantidad_registros`, `total_gasto`.
- El resumen se pide **por separado** del listado, precisamente porque el rol logístico no tiene acceso a él: así el frontend carga la lista de gastos a todos los roles y el resumen solo a los autorizados.

---

## 7. Reglas de negocio de usuarios y auditoría

### 7.1 RN-AUTH-01 — El cliente no accede al sistema

`login_usuario` lanza explícitamente: *"Los usuarios con rol 'cliente' no tienen acceso al sistema."* Además, `cliente` no pertenece a ningún grupo de RBAC.

### 7.2 RN-AUTH-02 — Un usuario desactivado no inicia sesión

*"El usuario está desactivado y no puede iniciar sesión."* (`estado_registro = FALSE`).

### 7.3 RN-AUTH-03 — Contraseñas siempre hasheadas

- Contraseña en texto plano solo existe en el payload de entrada.
- Se almacena con `bcrypt.hashpw` (coste por defecto de la librería) en `usuario.contrasena_usuario` (`VARCHAR(255)`).
- La comparación usa `bcrypt.checkpw`; un valor almacenado que no sea un hash bcrypt válido devuelve `False` (no lanza).
- `ClienteCreate` **no** acepta contraseña: los clientes registrados en punto de venta no tienen credenciales (RN-CLI-01).

### 7.4 RN-CLI-01 — El cliente se registra sin credenciales

- `email_usuario` y `contrasena_usuario` quedan en `NULL`.
- El rol se fuerza a `cliente` en el controller; `ClienteCreate` ni siquiera expone el campo de rol.

### 7.5 RN-AUD-22 — Identidad siempre inyectada, nunca confiada

`id_usuario_creador`, `id_usuario_logistico` e `id_usuario_accion` proceden **siempre** del JWT. Los schemas Pydantic no exponen esos campos, de modo que ni siquiera pueden enviarse.

### 7.6 RN-AUD-23 — Auditoría exhaustiva

- Toda escritura sobre `usuario`, `producto`, `alquiler`, `detalle_alquiler` y `logistica_alquiler` deja un evento en `auditoria_sistema` con diff JSONB completo (`datos_anteriores` / `datos_nuevos`), autor y fecha.
- La tabla `auditoria_sistema` es la **única** fuente del historial de un alquiler y del detalle de una renovación.
- `id_usuario_accion` se puebla desde la variable de sesión `app.usuario_actual` (transaccional, `SET LOCAL`).

### 7.7 RN-AUD-24 — Mínimo un administrador activo

- `trg_garantizar_minimo_un_admin`: no se puede desactivar (o borrar) al último admin activo → *"Operación denegada: El sistema no puede quedarse sin administradores activos."*
- `trg_impedir_autodesactivacion_admin`: un admin no puede desactivar su propia cuenta → *"Operación denegada: Un administrador no puede desactivar su propia cuenta."*

> **Brecha detectada (H-AUD-01):** el segundo trigger lee `current_setting('app.current_user_id')`, variable que **el backend nunca escribe** (solo escribe `app.usuario_actual`). En consecuencia, la autodesactivación de un admin **no está realmente bloqueada**; la garantía efectiva la da `trg_garantizar_minimo_un_admin` (que impide quedarse sin admins) y el rol `SOLO_ADMIN` de la API. **Corrección recomendada:** escribir también `app.current_user_id` en `set_audit_context`, o unificar ambas variables.

### 7.8 RN-AUD-25 — Unicidad de identidad

`id_usuario` (documento), `telefono_usuario` y `email_usuario` son únicos. El controller valida los duplicados **antes** de insertar (evita depender solo de la restricción de la BD) y devuelve un `400` legible.

---

## 8. Resumen de reglas pendientes de definición manual

> Estas reglas **no** están formalizadas en el repositorio. Cada una se propone con la evidencia disponible y debe ser validada por el responsable del negocio antes de implementarse.

| # | Regla propuesta | Evidencia / hueco detectado | Impacto |
|---|---|---|---|
| **P-01** | **Política de contraseñas.** Longitud mínima real, complejidad, expiración, reutilización y Procedimiento de restablecimiento. | El backend solo exige `min_length=4` (`UsuarioCreate`, `UsuarioUpdate`); el seed usa una contraseña compartida para 11 empleados. | Alto — control de acceso débil |
| **P-02** | **Rotación y revocación de `JWT_SECRET_KEY`.** Procedimiento y periodicidad; invalidación de tokens al cambiar de rol. | `JWT_SECRET_KEY` es una variable de entorno estática; el `rol_usuario` viaja en el token y no se revalida contra la BD en cada petición. | Alto — un token stolen conserva privilegios hasta 8 h |
| **P-03** | **Gestión de la sesión y "cerrar sesión en todos los dispositivos".** Blacklist de tokens / revocación. | Solo hay cierre de sesión local (borrar `localStorage`); no existe invalidación del token en el servidor. | Medio |
| **P-04** | **Reapertura de alquileres: actor autorizado y procedimiento.** Hoy solo por consola SQL. | `fn_admin_reabrir_alquiler` no está expuesta por la API. | Medio — operación crítica sin trazabilidad de usuario ni registro en `auditoria_sistema` |
| **P-05** | **Alcance del `encargado_logistico` en la trazabilidad.** ¿Debe ver el historial de auditoría de un alquiler? | Hoy `GET /alquileres/{id}/historial` es `ADMIN_O_FACTURACION`: el logístico ve el contrato pero no quién lo modificó. | Medio |
| **P-06** | **Alcance del `encargado_logistico` sobre los estados del alquiler.** | `PATCH /alquileres/{id}/estado` es `STAFF_INTERNO`: el logístico puede llevar el contrato a `vencido` o `cancelado` (y `cancelado` es irreversible). | Alto — un `DELETE` lógico desde el rol operativo no debería permitirse |
| **P-07** | **Alcance del `encargado_logistico` en la consulta de inventario.** | `GET /inventario/productos/{id}` es `ADMIN_O_FACTURACION`, pero `GET /inventario` y `GET /productos` son `STAFF_INTERNO`: el mismo dato está disponible por otra vía. | Bajo — incoherencia de diseño |
| **P-08** | **Trazabilidad de los gastos: ¿el resumen semanal debe incluir entregas y recogidas?** | `GET /gastos/resumen-semanal` no filtra por `tipo_movimiento`: el total incluye fletes de entrega/recogida además de los gastos. | Medio — el dato financiero puede ser incorrecto |
| **P-09** | **Depósito:policy de devolución, discounts y morosidad.** | `deposito` es un `NUMERIC` sin estado (retenido/devuelto) ni fecha de devolución. | Medio — el depósito no se concilia |
| **P-10** | **Facturación e impresión de factura/comprobante.** | `precio_alquiler` y `deposito` existen, pero no hay documento fiscal, ni impresión, ni exportación. | Alto — el core del negocio no emite factura |
| **P-11** | **Descuentos, recargos e IVA.** | No hay campos ni tabla de descuentos/impuestos; todo el ajuste manual vive en `precio_alquiler` (RN-AUD-06), lo que impide auditarlo. | Alto |
| **P-12** | **Política de renewal/recargos por retraso** y días extra automaticos. | La renovación es manual; no hay recargo automático por días de retraso ni por mora en la recogida. | Medio |
| **P-13** | **Unidad de medida de stock yControl de inventario físico (conteo cíclico, merma, mantenimiento).** | Solo hay `stock_total` y `stock_alquilado`; no hay registro de conteos, ajustes ni mermas. | Alto — el inventario no es auditable |
| **P-14** | **Zona horaria y días hábiles/festivos para el cálculo de vencimientos.** | Todo se calcula en días calendario con `America/Bogota`; no hay concepto de día no hábil ni de festivo local. | Medio |
| **P-15** | **Tarifas de transporte y recogida.** | `TARIFA_ENTREGA_RECOGIDA = 15000` está **hardcodeada en el frontend** (`CrearAlquiler.tsx`), sin respaldo en configuración ni en la BD. | Alto — decisión de negocio en el cliente, no parametrizable |
| **P-16** | **Alcance del `DELETE` en productos: baja lógica con stock en obra.** | Hoy está prohibido bajar un producto con unidades en obra (RN-AUD-15). Falta definir el flujo alternativo (traslado a "repuestos", baja con autorización, etc.). | Medio |
| **P-17** | **Ciclo de vida de la trazabilidad: retención y archivado de `auditoria_sistema`.** | La tabla crece de forma indefinida; no hay política de particionado ni de purga. | Medio |
| **P-18** | **Concurrencia y reservas de stock.** | No hay bloqueo de fila (`SELECT … FOR UPDATE`) ni reservas: dos creados simultáneos pueden competir por el mismo stock y el trigger aborta el segundo. Falta definir la política de reintento y la experiencia de usuario. | Medio — la BD protege, pero el error llega como 400 genérico |
| **P-19** | **Trazabilidad de las acciones de front sin API.** | La UI esconde controles por rol, pero no hay registro de "el usuario intentó hacer X y no pudo". | Bajo |
| **P-20** | **Documentación de la API y versionado del contrato.** | No hay especificación OpenAPI versionada ni política de deprecación; el prefijo es fijo (`/api/sga`) y la versión solo aparece en el body de `GET /`. | Medio |
| **P-21** | **Escalamiento de incidentes operativos** (producto con stock inconsistente, alquiler bloqueado). | No hay runbook ni procedimiento de corrección manual con auditoría. | Medio |
| **P-22** | **Umbral de "por vencer" configurable.** | `dias = 2` está hardcodeado en el backend (`alquileres_proximos_a_vencer`) y espejado en el frontend (`DIAS_ALERTA_PROXIMO_VENCIMIENTO = 2`). | Bajo — pero debería ser un parámetro |
| **P-23** | **Numeración de contratos y documentos.** | `id_alquiler` es un `SERIAL` técnico, no un número de contrato comercial. | Medio |
| **P-24** | **Multiempresa / multi-sucursal.** | No existe dimensión de sede o empresa; `barrio` es texto libre sin catálogo. | Medio — limita el crecimiento |
| **P-25** | **Catálogo de barrios y direcciones.** | `barrio` es `VARCHAR(100)` libre; sin normalización, las búsquedas y reportes se degradan. | Medio |
| **P-26** | **Reglas de los documentos de identidad por tipo de cliente** (NIT para empresas, obligated VAT, foreigners). | `tipo_documento ∈ {CC, CE, NIT, PPT}` es una enumeración fija sin reglas asociadas. | Bajo |

### 8.1 Documentos de negocio que faltan y deben redactarse

| Documento | Contenido esperado | Prioridad |
|---|---|---|
| **Catálogo de reglas de negocio (RN)** | Documento maestro con todas las reglas numeradas, su actor responsable, su validación y su caso de prueba. Hoy las reglas están dispersas entre comentarios de código, triggers y README. | Alta |
| **Matriz de roles y permisos oficial** | Tabla legible por negocio (no por endpoint) de lo que cada rol puede y no puede hacer, con las excepciones justificadas (P-05, P-06, P-07, P-08). | Alta |
| **Política de precios y tarifas** | Definición de `precio_base_producto`, `precio_base_extra`, `precio_conjunto`, `precio_alquiler`, `deposito`, transporte/recogida, descuentos e IVA (P-10, P-11, P-15). | Alta |
| **Política de ciclo de vida de contratos** | Estados, transiciones, responsables por transición, tiempos límite, renovación, mora, cancelación y reapertura (P-04, P-12). | Alta |
| **Política de inventario y control físico** | Conteos cíclicos, ajustes, mermas, entradas/salidas de bodega y auditoría de stock (P-13). | Alta |
| **Política de gestión de usuarios y accesos** | Alta, baja, roles, contraseñas, revisiones periódicas de accesos, auditoría ylateda (P-01, P-02, P-03). | Alta |
| **Manual de contingencias y soporte** | Diagnóstico y corrección de stock inconsistente, contratos bloqueados, usuarios sin acceso (P-21). | Media |
| **Especificación funcional de los módulos** | Casos de uso y criterios de aceptación por módulo (los archivos `docs/requirements/user_cases.md` y `user_stories.md` existen pero están **vacíos**). | Media |
| **Plan de pruebas** | Suite de pruebas unitarias/integración de los triggers y del contrato API (no existe `tests/`). | Media |

---

## 9. Trazabilidad de las reglas → implementación

| Regla | Backend | Base de datos | Frontend | Test |
|---|---|---|---|---|
| RN-AUD-01 fórmula de vencimiento | `app/utils/tiempo.py` | `idx_alquiler_fecha_vencimiento` | `src/utils/tiempoUi.ts` | — |
| RN-AUD-02 vencimiento automático | `app/utils/scheduler.py`, `verificar_y_actualizar_vencidos` | — | `src/utils/vencimiento.ts` | — |
| RN-AUD-03 matriz de edición | `alquiler_controller.CAMPOS_EDITABLES_POR_ESTADO` | — | — | — |
| RN-ALQ-03 creación transaccional | `crear_alquiler` | `trg_validar_detalle_alquiler` | `validacionesAlquiler.ts` | — |
| RN-AUD-04 reapertura | `fn_admin_reabrir_alquiler` (sin endpoint) | `trg_prohibir_reabrir_alquiler` | — | — |
| RN-AUD-05 renovación | `renovar_alquiler` | `trg_auditoria_alquiler` | `AlquilerDetalle.tsx` | — |
| RN-AUD-06 precio controlado | `crear_alquiler`, `_recalcular_precio_alquiler` (no invocada) | — | `CrearAlquiler.tsx` | — |
| RN-AUD-07 base vs. extra | `crear_alquiler` | `idx_unico_producto_alquiler` | `validacionesAlquiler.ts` | — |
| RN-AUD-08 unidad mínima | `app/utils/unidades.py` | `chk_producto_unidad_minima_alquiler` | `src/utils/tiempoUi.ts` | — |
| RN-AUD-09 precio de conjunto | — | — | `src/utils/precios.ts` | — |
| RN-AUD-10 detalle editable | `detalle_alquiler_controller` | `trg_validar_detalle_alquiler` | — | — |
| RN-AUD-11 creador activo | — | `trg_verificar_usuario_activo_alquiler` | — | — |
| RN-AUD-12 fecha de inicio | — | `trg_validar_fecha_inicio` | `inputFecha.tsx` | — |
| RN-AUD-13 stock derivado | — | `trg_sincronizar_stock_producto` | `ProductoSelect.tsx` | — |
| RN-AUD-14 stock insuficiente | `crear_detalle_alquiler` | `trg_validar_detalle_alquiler` | `CrearAlquiler.tsx` | — |
| RN-AUD-15 baja con stock | `cambiar_estado_producto` | `trg_validar_modificacion_producto` | `Productos.tsx` | — |
| RN-AUD-16 ajuste de stock | `actualizar_producto` | `trg_validar_modificacion_producto` | `Productos.tsx` | — |
| RN-AUD-17 devolución al cerrar | `cambiar_estado_alquiler` | `trg_cerrar_alquiler_devolver_stock` | — | — |
| RN-AUD-18 borrado lógico | todos los controllers | — | — | — |
| RN-LOG-04 recogida con entrega | `registrar_recogida` | — | `AlquilerDetalle.tsx` | — |
| RN-AUD-19 entrega | `registrar_entrega` | — | `AlquilerDetalle.tsx` | — |
| RN-AUD-20 gasto N:N | `crear_gasto` | `logistica_alquiler_alquiler` | `Gastos.tsx` | — |
| RN-GAS-07 resumen semanal | `resumen_semanal_gastos` | — | `Gastos.tsx` | — |
| RN-AUTH-01 cliente sin acceso | `login_usuario` | `chk_usuario_rol` | — | — |
| RN-AUTH-02 desactivado no entra | `login_usuario` | — | — | — |
| RN-AUTH-03 bcrypt | `app/utils/security.py` | — | — | — |
| RN-CLI-01 cliente sin credenciales | `crear_cliente` | — | `CrearAlquiler.tsx` | — |
| RN-AUD-22 identidad inyectada | `set_audit_context` | `fn_auditar_cambios` | `src/interfaces/*` (sin campo de autor) | — |
| RN-AUD-23 auditoría | `app/utils/audit_context.py` | `trg_auditoria_*` | — | — |
| RN-AUD-24 mínimo un admin | — | `trg_garantizar_minimo_un_admin`, `trg_impedir_autodesactivacion_admin` | `Usuarios.tsx` | — |
| RN-AUD-25 unicidad | `crear_usuario`, `actualizar_usuario` | `UNIQUE` de email/teléfono | — | — |
| Matriz RBAC | `app/utils/roles.py` | `chk_usuario_rol` | `src/utils/permisos.ts` | — |

> **Ausencia de pruebas:** ninguna de las reglas tiene cobertura automatizada. La columna "Test" está vacía en todas las filas. Este es el principal riesgo residual del sistema: las reglas están expresadas en tres lenguajes distintos (SQL, Python, TypeScript) sin ningún mecanismo que verifique su coherencia.
