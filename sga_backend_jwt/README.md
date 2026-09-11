# SGA Backend JWT — v2 (esquema con auditoría centralizada)

Backend FastAPI + SQLAlchemy + Pydantic para el Sistema de Gestión de
Alquileres de Andamios (SGA), construido desde cero contra el nuevo
esquema PostgreSQL con auditoría centralizada, validado con una base
de datos PostgreSQL real (no simulada).

## 1. Puesta en marcha

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edita .env: DATABASE_URL, JWT_SECRET_KEY

# Cargar el esquema (orden obligatorio):
psql -d TU_BASE_DE_DATOS -f database/01_tablas.sql
psql -d TU_BASE_DE_DATOS -f database/02_funciones_y_triggers.sql
psql -d TU_BASE_DE_DATOS -f database/03_seed_data.sql   # opcional, datos de prueba

uvicorn app.main:app --reload
```

Swagger: `http://localhost:8000/docs` — usa el botón **Authorize** con
el `access_token` que devuelve `POST /api/sga/auth/login`.

**Usuarios de prueba (seed)** — contraseña para todos: `Sga2026*`
(ver nota en `database/03_seed_data.sql`):
- admin: teléfono `3000000000`
- encargado_facturacion: teléfono `3101234567`
- encargado_logistico: teléfono `3151234567`

## 2. Decisiones de diseño flagged explícitamente

Estas son correcciones o decisiones que tomé sobre el esquema
entregado y que quiero que revises antes de dar esto por definitivo:

### 2.1 Bug bloqueante corregido en `01_tablas.sql`
`CREATE INDEX idx_usuario_rol ... WHERE estado_usuario IS TRUE` hacía
fallar la carga completa del esquema porque `usuario` no tiene columna
`estado_usuario` (la auditoría centralizada la reemplazó por
`estado_registro`, igual que en las demás tablas). **Corregido** a
`estado_registro`. Verificado con `psql` contra una instancia
PostgreSQL real: el esquema corregido carga sin errores.

### 2.2 `auditoria_sistema.id_usuario_accion` nunca se poblaba
El trigger `fn_auditar_cambios()` insertaba en `auditoria_sistema`
pero nunca incluía `id_usuario_accion` en el `INSERT` — quedaba
siempre `NULL`. Esto contradice la regla de negocio de "auditoría
inyectada desde el JWT, nunca confiada al payload". Un trigger de
PostgreSQL no puede leer un JWT directamente, así que agregué el
mecanismo mínimo necesario:

- El trigger ahora lee `current_setting('app.usuario_actual', true)`.
- El backend ejecuta `SET LOCAL app.usuario_actual = '<id_usuario>'`
  al inicio de cada transacción de escritura, ANTES del primer
  `INSERT`/`UPDATE`/`DELETE` (ver `app/utils/audit_context.py`,
  `set_audit_context()`, llamado desde cada función de controller que
  escribe en una tabla auditada).
- `SET LOCAL` (no `SET`): el valor solo vive dentro de la transacción
  actual y se descarta automáticamente al hacer COMMIT/ROLLBACK, así
  que nunca puede filtrarse hacia otra request que reutilice la misma
  conexión del pool.

Verificado con `psql`: `BEGIN; SET LOCAL app.usuario_actual='...';
UPDATE ...; COMMIT;` deja el `id_usuario_accion` correcto en
`auditoria_sistema`.

### 2.3 Fórmula de fecha de vencimiento
`fecha_vencimiento = fecha_inicio + (tiempo_alquiler_dias - 1) días`.
El esquema unificó el tiempo de alquiler a días para ganar
flexibilidad. Se mantiene el mismo principio ya usado antes para la
fórmula semanal: el día de inicio cuenta como el primer día del
alquiler, así que un alquiler de 15 días que empieza el 01/09 vence el
15/09 (no el 16/09). Centralizada en `app/utils/tiempo.py` para que
SQL y Python nunca puedan desincronizarse.

### 2.4 Historial y renovaciones ahora son reales
Con la auditoría centralizada, `GET /alquileres/{id}/historial` y
`GET /renovaciones/{id}` consultan `auditoria_sistema` de verdad
(antes, sin esta tabla, solo se podía devolver el estado actual). No
existe una tabla `renovacion` independiente: una renovación es un
evento `UPDATE` sobre `alquiler` que aumenta `tiempo_alquiler_dias`;
`POST /alquileres/{id}/renovaciones` devuelve el alquiler actualizado
más el campo `id_auditoria_renovacion`, que es justamente el `id` que
espera `GET /renovaciones/{id}`.

### 2.5 Módulo `/clientes` separado de `/usuarios`
Ambos operan sobre la misma tabla `usuario` (`rol_usuario='cliente'`
vs. roles de personal). `/clientes` nunca acepta `rol_usuario` en el
payload — el controller lo fuerza siempre a `'cliente'`. Un cliente
registrado en punto de venta no recibe contraseña (queda `NULL`, tal
como lo permite el esquema).

### 2.6 `GET /usuarios` con jerarquía de roles
Un `admin` puede listar todo el personal sin filtro. Un
`encargado_facturacion` o `encargado_logistico` **solo** puede
consultar `GET /usuarios?rol_usuario=encargado_logistico` (para, por
ejemplo, asignar una entrega). Cualquier otro uso del endpoint por
esos roles devuelve 403.

### 2.7 Reconciliación del vencimiento — verificada en dos capas independientes
Se comprobó explícitamente, contra PostgreSQL real, que un alquiler
`activo` pasa a `vencido` automáticamente por **dos vías
independientes** (ninguna depende de la otra):

1. **Por acción**: `verificar_y_actualizar_vencidos()` corre al
   inicio de las 11 funciones de `alquiler_controller.py` que leen o
   modifican alquileres (crear, consultar, listar, actualizar, cambiar
   estado, buscar, próximos a vencer, pendientes de entrega, renovar,
   registrar entrega, registrar recogida). Prueba real: se forzó
   `fecha_inicio` de un alquiler `activo` 20 días atrás directamente
   en la BD (sin pasar por el backend) y una simple llamada a
   `GET /alquileres/{id}` lo dejó en `vencido`, persistido en la BD.
2. **Por scheduler diario**: `app/utils/scheduler.py`, job en
   `CronTrigger(hour=0, minute=5, timezone="America/Bogota")`. Se
   probó ejecutando el job manualmente (sin ningún endpoint HTTP de
   por medio) sobre otro alquiler vencido y también lo transicionó
   correctamente.

**Bug encontrado y corregido durante esta verificación**: `CronTrigger`
NO hereda automáticamente la timezone del `BackgroundScheduler` que lo
contiene — por defecto usa UTC salvo que se le pase `timezone=`
explícitamente al propio trigger. La versión original
(`CronTrigger(hour=0, minute=5)`, sin `timezone`) habría ejecutado el
job a las 00:05 **UTC** (7:05 p.m. hora Bogotá del día anterior), no a
medianoche Bogotá como estaba documentado. Corregido pasando
`timezone="America/Bogota"` también al `CronTrigger`. Verificado:
`next_run_time` ahora muestra offset `-05:00` en el horario esperado.

### 2.8 Sin columnas `actualizado_por` / `eliminado_por` / `fecha_eliminacion`
El esquema anterior las tenía; el nuevo las centralizó en
`auditoria_sistema`, así que se eliminaron de todos los modelos
SQLAlchemy. "Quién hizo qué" se consulta en `auditoria_sistema`
(`id_usuario_accion`), no en la tabla de negocio.

## 3. Estructura del proyecto

```
app/
├── main.py                 # FastAPI, CORS, manejador de excepciones, routers
├── config/                 # settings.py (env), database.py (SQLAlchemy)
├── models/                 # 1 modelo SQLAlchemy por tabla del esquema
├── schemas/                # Pydantic: *Create, *Update, *EstadoUpdate
├── controllers/            # Lógica de negocio (transaccional, sin mocks)
├── routes/                 # FastAPI routers, RBAC vía Depends(requiere_rol(...))
└── utils/
    ├── jwt_utils.py         # emitir/validar JWT
    ├── security.py          # bcrypt
    ├── roles.py              # RBAC + jerarquía de grupos de roles
    ├── auth_dependency.py    # HTTPBearer -> UsuarioActual
    ├── audit_context.py      # SET LOCAL app.usuario_actual (ver 2.2)
    ├── tiempo.py              # fórmula de vencimiento, única fuente de verdad
    ├── db_errors.py           # traduce RAISE EXCEPTION de triggers a 400 legible
    ├── response.py            # sobre {status, mensaje, data, error, code}
    └── scheduler.py           # job diario activo -> vencido
database/
├── 01_tablas.sql            # esquema (con el fix de 2.1)
├── 02_funciones_y_triggers.sql  # triggers (con el fix de 2.2)
└── 03_seed_data.sql         # datos de prueba (passwords bcrypt reales)
```

## 4. Jerarquía de roles (RBAC)

```
admin  >  encargado_facturacion  >  encargado_logistico  >  cliente (sin acceso)
```

`encargado_facturacion` puede hacer todo lo que hace
`encargado_logistico` (grupo `STAFF_INTERNO` los incluye siempre
juntos), pero no al revés. `cliente` nunca aparece en ningún grupo de
roles — no tiene acceso al sistema.

## 5. Regla crítica de auditoría

`id_usuario_creador`, `id_usuario_logistico` e `id_usuario_accion`
JAMÁS se reciben del payload. Siempre se extraen de
`usuario_actual.id_usuario` (inyectado por `get_current_user` desde el
JWT decodificado) dentro del controller. Ningún schema Pydantic de
creación/actualización expone esos campos.
