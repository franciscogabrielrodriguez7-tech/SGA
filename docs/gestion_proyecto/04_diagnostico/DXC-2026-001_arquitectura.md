# 01 — Arquitectura del Sistema SGA

> **Proyecto:** SGA — Sistema de Gestión de Alquileres de Andamios
> **Repositorio:** https://github.com/franciscogabrielrodriguez7-tech/SGA
> **Documento generado por:** auditoría e ingeniería inversa del código fuente (rama `dev`)
> **Versión de la API documentada:** `2.0.0`

> ⚠️ **Documento generado el 2026-10-19 sobre la rama local `dev` @ `14726ad`
> (anterior al commit `12760d4`).** Contenido parcialmente desactualizado:
> menciona router `inventario` (eliminado, R-07) y referencias a despliegue en Render/Vercel
> (reemplazado por Docker Compose, R-09). Contrasta con [AUD-2026-002](../01_auditorias/AUD-2026-002_auditoria_dev_remota_12760d4.md) para el estado vigente.
---

## 1. Propósito y alcance

SGA es una aplicación web full-stack para administrar el alquiler de equipos de andamiaje y construcción (planchones, crucetas, secciones, escaleras). El sistema cubre el ciclo de vida completo de un contrato de alquiler: cotización → creación → entrega en obra → vigencia → vencimiento → recogida → cierre, con control de stock en tiempo real, auditoría automática de todos los cambios y control de acceso por roles.

Este documento describe la arquitectura de tres tiers, el stack tecnológico, el flujo de datos entre capas y los puntos de despliegue. Los documentos complementarios son:

| Documento | Contenido |
|---|---|
| [`DXC-2026-002_base_de_datos.md`](../04_diagnostico/DXC-2026-002_base_de_datos.md) | Diccionario de datos y mecánicas de triggers PL/pgSQL |
| [`DXC-2026-003_api_contrato.md`](../04_diagnostico/DXC-2026-003_api_contrato.md) | Catálogo completo de endpoints REST |
| [`DXC-2026-004_frontend_componentes.md`](../04_diagnostico/DXC-2026-004_frontend_componentes.md) | Organización del frontend, CSS y consumo de servicios |
| [`DXC-2026-005_reglas_negocio_rbac.md`](../04_diagnostico/DXC-2026-005_reglas_negocio_rbac.md) | Reglas de negocio y matriz de roles (RBAC) |
| [`DXC-2026-006_despliegue_configuracion.md`](../04_diagnostico/DXC-2026-006_despliegue_configuracion.md) | Configuración local y despliegue en Render/Vercel |

---

## 2. Vista de tres tiers

```
┌──────────────────────────────────────────────────────────────────────────┐
│  CLIENTE — SPA React 19 + TypeScript + Vite (CSS puro)                  │
│  Hospedaje: Vercel (build estático)                                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ pages/  →  AppShell + ProtectedRoute                              │  │
│  │ api/    →  client.ts (fetch + sobre + Bearer token)              │  │
│  │ context/→  AuthContext (JWT en localStorage)                     │  │
│  │ styles/ →  tokens/base/layout/components.css (sistema de diseño)  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ HTTPS  ·  Authorization: Bearer <JWT>
                                │ VITE_API_URL = https://<api>/api/sga
┌───────────────────────────────▼──────────────────────────────────────────┐
│  API — FastAPI 0.141 (Python 3.11)                                      │
│  Hospedaje: Render (Web Service)                                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ routes/     → 9 routers, prefijo global /api/sga                 │  │
│  │ controllers/→ lógica de negocio + transacciones                   │  │
│  │ schemas/    → contratos Pydantic v2 (entrada/salida)              │  │
│  │ models/     → mapeo SQLAlchemy 2.0 (6 tablas)                    │  │
│  │ utils/      → JWT, bcrypt, RBAC, tiempo, unidades, auditoría,     │  │
│  │               scheduler, traducción de errores de BD              │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ SQLAlchemy Core/ORM  ·  psycopg2-binary
                                │ postgresql+psycopg2://...
┌───────────────────────────────▼──────────────────────────────────────────┐
│  DATOS — PostgreSQL 14+                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ 6 tablas + 19 triggers PL/pgSQL (auditoría, stock, RBAC, ciclo)  │  │
│  │ Funciones: fn_auditar_cambios, fn_sincronizar_stock_producto,    │  │
│  │ fn_admin_reabrir_alquiler, fn_validar_*, fn_actualizar_timestamp │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Stack tecnológico

### 3.1 Capa de datos

| Elemento | Tecnología | Versión | Ubicación |
|---|---|---|---|
| Motor | PostgreSQL | 14+ (validado contra 16) | `database/01_esquema/*.sql` |
| Driver | psycopg2-binary | 2.9.12 | `requirements.txt` |
| ORM | SQLAlchemy | 2.0.52 | `app/models/`, `app/config/database.py` |
| Migraciones | Alembic | ⚠️ **no declarado en `requirements.txt`** | `alembic/`, `alembic.ini` |
| Lógica de negocio en BD | PL/pgSQL (triggers + funciones) | — | `database/01_esquema/02_funciones_y_triggers.sql` |

> **Principio de diseño:** la lógica de integridad que debe ser *imposible de eludir* vive en la base de datos (triggers), no solo en Python. Ver §6.

### 3.2 Capa de aplicación (backend)

| Elemento | Tecnología | Versión |
|---|---|---|
| Framework | FastAPI | 0.141.1 |
| Servidor ASGI | Uvicorn (local) / Gunicorn (producción) | 0.52.3 / 23.0.0 |
| Validación | Pydantic | 2.13.4 |
| Autenticación | PyJWT (HS256) | 2.10.1 |
| Hash de contraseñas | bcrypt | 4.2.1 |
| Tareas programadas | APScheduler | 3.11.3 |
| Configuración | python-dotenv | 1.2.3 |
| Documentación interactiva | Swagger UI / OpenAPI (nativa de FastAPI) | `/docs` |

Dependencias declaradas en `sga_backend_jwt/requirements.txt` (21 líneas, versiones fijadas con `==`).

### 3.3 Capa de presentación (frontend)

| Elemento | Tecnología | Versión |
|---|---|---|
| Biblioteca UI | React / React DOM | 19.2.x |
| Lenguaje | TypeScript | ~6.0.2 |
| Bundler / dev server | Vite | 8.2.0 |
| Enrutado | react-router-dom | 7.18.3 |
| Validación de formularios | Zod (+ `@hookform/resolvers`) | 4.6.5 |
| Linter | oxlint | 1.75.0 |
| Estilos | **CSS puro** (variables CSS nativas + `@import`) | — |
| UI components | **No hay librería externa** (ni Chakra UI ni Emotion) | — |

> **Requisito no funcional crítico:** el diseño del proyecto prohíbe explícitamente librerías de UI de terceros. El sistema de diseño está implementado como variables CSS semánticas en `src/styles/tokens.css` (paleta cian `#2BE6E1`, neutros fríos, modo claro/oscuro) y clases utilitarias/componentes en `src/styles/*.css`. Cualquier componente nuevo debe consumir estas clases y no introducir un framework de estilos.

---

## 4. Estructura del repositorio

```
SGA/
├── database/                     # Esquema PostgreSQL (fuente de verdad del DDL)
│   ├── 01_esquema/
│   │   ├── 01_tablas.sql         # DDL: 6 tablas + restricciones + índices
│   │   ├── 02_funciones_y_triggers.sql  # PL/pgSQL: 12 funciones + 19 triggers
│   │   ├── 03_seed_data.sql      # Semilla: 1 admin, 5 facturación, 5 logística, 10 clientes, 7 productos
│   │   ├── 04_plantillas.sql     # Plantillas DML operativas (⚠ no revisadas)
│   │   ├── 05_consultas.sql      # Consultas DQL de reportes (⚠ no revisadas)
│   │   └── 06_vistas_dashboard.sql  # Vista vw_dashboard_operativo
│   ├── 03_documentacion/INDICE.md
│   ├── 06_demos_endpoints/       # Demos SQL de comportamiento por endpoint
│   └── README_base_de_datos.md
├── sga_backend_jwt/              # API REST
│   ├── app/
│   │   ├── main.py               # App FastAPI, CORS, handler de errores, scheduler
│   │   ├── config/               # settings.py (env), database.py (engine/Session/Base)
│   │   ├── models/               # 7 modelos SQLAlchemy
│   │   ├── schemas/              # 6 módulos Pydantic
│   │   ├── routes/               # 9 routers
│   │   ├── controllers/          # 8 controladores de lógica de negocio
│   │   └── utils/                # 10 utilidades transversales
│   ├── alembic/                  # Migraciones
│   ├── requirements.txt
│   └── .env.example
├── sga_frontend_jwt/             # SPA
│   ├── src/
│   │   ├── api/                  # 7 módulos de servicios + client.ts
│   │   ├── components/           # layout/, ui/, inputs/, productos/
│   │   ├── context/AuthContext.tsx
│   │   ├── interfaces/           # Tipos TypeScript del dominio
│   │   ├── pages/                # 7 vistas
│   │   ├── styles/               # tokens/base/layout/components.css
│   │   └── utils/                # permisos, precios, tiempo, validaciones
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json
└── docs/                         # Documentación técnica (este conjunto)
```

---

## 5. Flujo de arquitectura

### 5.1 Flujo de autenticación

```
Usuario → POST /api/sga/auth/login {telefono_usuario|email_usuario, contrasena_usuario}
   │
   ├─ usuario_controller.login_usuario()
   │    ├─ SELECT por teléfono (prioritario) o email
   │    ├─ Rechazo explícito si rol_usuario = 'cliente'      (RN-AUTH-01)
   │    ├─ Rechazo si estado_registro = FALSE                (RN-AUTH-02)
   │    └─ bcrypt.checkpw(contrasena_plana, hash)            (RN-AUTH-03)
   │
   └─ jwt_utils.crear_access_token(id_usuario, rol_usuario)
        payload = { sub, rol_usuario, iat, exp }   (exp = 480 min por defecto)
        firma HS256 con JWT_SECRET_KEY
   │
   ▼
Respuesta 200 { status:true, data:{ logueado, id_usuario, rol_usuario,
                 nombres_usuario, apellidos_usuario, access_token, token_type } }
   │
   ▼
Frontend: AuthContext persiste el objeto en localStorage (clave "sga_sesion_usuario")
           client.ts adjunta "Authorization: Bearer <token>" en cada petición
```

**Decisiones de seguridad asociadas:**
- El JWT **no** transporta información sensible: solo `sub` (documento), `rol_usuario` y tiempos. No incluye hash de contraseña.
- El `rol_usuario` viaja en el token; el backend lo usa para autorizar. Esto implica que un cambio de rol solo surte efecto al reemitir el token (ver *Deuda técnica* en §8).
- El backend nunca confía en `id_usuario_creador`, `id_usuario_logistico` ni `id_usuario_accion` enviados por el cliente: siempre se inyectan desde el JWT.

### 5.2 Flujo de una escritura con auditoría

Este es el flujo canónico de todo `INSERT`/`UPDATE`/`DELETE` sobre tablas de negocio:

```
Ruta FastAPI
  └─ Depends(get_current_user)  →  valida Bearer + decodifica JWT → UsuarioActual
      └─ Depends(requiere_rol(*))  →  valida rol → 403 si no alcanza
          └─ Controller
              ├─ set_audit_context(db, usuario_actual.id_usuario)
              │     └─ SET LOCAL app.usuario_actual = '<documento>'
              │        (vigente solo durante la transacción actual)
              ├─ db.add(...) / db.execute(...)
              └─ db.commit()
                    │
                    ▼
                PostgreSQL dispara los triggers:
                  ├─ BEFORE: fn_validar_* / fn_actualizar_timestamp → validan y ajustan
                  └─ AFTER:  trg_sincronizar_stock_producto  → ajusta producto.stock_alquilado
                            trg_auditoria_* (fn_auditar_cambios) → inserta en auditoria_sistema
                                  └─ lee current_setting('app.usuario_actual') → id_usuario_accion
```

> **Punto clave:** un trigger de PostgreSQL no puede leer un JWT. La "puente" entre la identidad autenticada y la auditoría es la variable de sesión `app.usuario_actual`, poblada con `SET LOCAL` (transaccional, nunca se filtra al pool de conexiones) desde `app/utils/audit_context.py`. Cualquier escritura que olvide llamar `set_audit_context` producirá una fila de auditoría con `id_usuario_accion = NULL`.

### 5.3 Flujo de conciliación de vencimientos

El paso `activo → vencido` está respaldado por **dos mecanismos independientes**, de modo que la información nunca queda desactualizada:

1. **Job programado (respaldo).** APScheduler con `CronTrigger(hour=0, minute=5, timezone="America/Bogota")` registrado en el evento `startup` de FastAPI (`app/utils/scheduler.py`). Ejecuta un `UPDATE alquiler SET estado_alquiler='vencido' WHERE estado_alquiler='activo' AND (fecha_inicio + tiempo_alquiler_dias - 1) < CURRENT_DATE`.
2. **Reconciliación bajo demanda.** `alquiler_controller.verificar_y_actualizar_vencidos(db)` se invoca al inicio de las operaciones de escritura (crear, actualizar, cambiar estado, renovar, entrega, recogida) para que la respuesta nunca contradiga al estado real persistido.

Ambos caminos usan **la misma fórmula** de vencimiento, generada desde una única plantilla en `app/utils/tiempo.py`:

```
fecha_vencimiento = fecha_inicio + (tiempo_alquiler_dias - 1) días
```

El día de inicio cuenta como el primer día del alquiler. Zona horaria única del proyecto: `America/Bogota` (centralizada en `fecha_actual_bogota()`; ningún otro módulo debe llamar `date.today()`).

### 5.4 Flujo de sincronización de stock

```
detalle_alquiler (INSERT/UPDATE/DELETE)
   │
   ├─ BEFORE  trg_validar_detalle_alquiler
   │     ├─ ¿alquiler en {terminado, recogido, cancelado}? → EXCEPTION
   │     ├─ UPDATE de línea con id_producto distinto      → EXCEPTION
   │     └─ diferencia de cantidad > stock_disponible     → EXCEPTION
   │
   └─ AFTER   trg_sincronizar_stock_producto
         INSERT (+cantidad) | UPDATE (borrado lógico − | reactivación + | cambio de cantidad Δ)
         DELETE (−cantidad)
              │
              └─► UPDATE producto SET stock_alquilado = stock_alquilado ± cantidad
                    (respeta CHECK stock_alquilado <= stock_total)
```

Detalle completo en [`DXC-2026-002_base_de_datos.md`](../04_diagnostico/DXC-2026-002_base_de_datos.md) §5.

---

## 6. Decisiones arquitectónicas

| # | Decisión | Justificación | Consecuencia |
|---|---|---|---|
| AD-01 | La integridad fuerte vive en triggers de PostgreSQL, no solo en Python | Un `UPDATE` manual por consola, un script o un endpoint futuro no pueden saltarse la regla | Los mensajes de error de BD deben traducirse a HTTP 400 legible (ver `app/utils/db_errors.py`) |
| AD-02 | Sobre de respuesta único `{status, mensaje, data, error, code}` | Contrato uniforme para el cliente; el `HTTPException` por defecto de FastAPI se reescribe con un handler global | El frontend solo conoce un formato de error |
| AD-03 | `id_usuario_creador`, `id_usuario_logistico` y `id_usuario_accion` se inyectan desde el JWT | Nunca confiar identidad en el payload | Los schemas Pydantic ni siquiera exponen esos campos |
| AD-04 | Auditoría centralizada en `auditoria_sistema` (JSONB) en lugar de columnas `*_por` por tabla | Evita duplicar metadatos y da un diff antes/después completo | El historial y las renovaciones se leen de esa tabla; no existe tabla `renovacion` |
| AD-05 | `precio_alquiler` NO se recalcula como `SUM(precio_conjunto)` | Un recálculo borraría en silencio descuentos logísticos decididos por el staff | El precio es un campo controlado manualmente; la función `_recalcular_precio_alquiler` queda como helper no invocado |
| AD-06 | `tiempo_alquiler_dias` es la única unidad persistida | Evita el acoplamiento a semanas/meses | La UI convierte (días/semanas/meses) y el backend valida contra `unidad_minima_alquiler` |
| AD-07 | Convención comercial 1 semana = 7 días, 1 mes = 30 días | Uniformidad y ausencia de fracciones | Definida en `app/utils/unidades.py` y espejada en `src/utils/tiempoUi.ts` |
| AD-08 | `estado_registro` (borrado lógico) en todas las tablas de negocio | Preserva la trazabilidad y el historial de auditoría | No hay `DELETE` físico de registros con historial |
| AD-09 | En la BD, `logistica_alquiler` no apunta a un alquiler: usa tabla puente | Un gasto logístico puede servir a varios alquileres (viaje multiequipo) | `ENTREGA`/`RECOGIDA` bridged a 1 alquiler; `GASTO` a 1..N |
| AD-10 | CSS puro con tokens semánticos en variables CSS | Requisito del proyecto: eliminar Chakra UI/Emotion | Modo claro/oscuro con `[data-theme="dark"]`; sin dependencia de estilos de terceros |
| AD-11 | CORS permisivo (`*`) en `app/main.py` | Facilidad de desarrollo | **Riesgo de producción** — ver §8 |

---

## 7. Despliegue y topología

| Componente | Plataforma | Artefacto | Nota |
|---|---|---|---|
| Frontend SPA | **Vercel** | Build estático de Vite (`dist/`) | `vercel.json` define el rewrite SPA `/(.*) → /index.html` |
| Backend API | **Render** (Web Service) | Uvicorn/Gunicorn sobre `app.main:app` | `gunicorn` está declarado en `requirements.txt` para el arranque en producción |
| Base de datos | PostgreSQL gestionado (o el que provea Render) | — | `DATABASE_URL` por variable de entorno |

Variables de entorno que atraviesan el flujo:

- **Backend:** `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES`.
- **Frontend:** `VITE_API_URL` (debe incluir el prefijo `/api/sga`).

Detalle operativo en [`DXC-2026-006_despliegue_configuracion.md`](../04_diagnostico/DXC-2026-006_despliegue_configuracion.md).

---

## 8. Deuda técnica y riesgos detectados en la auditoría

| # | Hallazgo | Ubicación | Impacto | Severidad |
|---|---|---|---|---|
| H-01 | `allow_origins` incluye `"*"` junto con `allow_credentials=True` | `app/main.py:59-69` | Configuración insegura e inconsistente en producción; además es un conflicto técnico de CORS | Alta |
| H-02 | El `rol_usuario` viaja dentro del JWT y no se revalida contra la BD en cada petición | `app/utils/auth_dependency.py` | Un cambio de rol o una desactivación no surte efecto hasta que expire el token (480 min) | Media |
| H-03 | `04_plantillas.sql` y `05_consultas.sql` están desalineados del esquema vigente (referencian `estado_usuario`, `id_alquiler` directo en `logistica_alquiler`, `es_recogida`) | `database/01_esquema/` | Fallan si se ejecutan tal cual | Media |
| H-04 | `database/03_documentacion/INDICE.md` describe un esquema anterior (no menciona `precio_base_extra`, `unidad_minima_alquiler`, `tipo_movimiento` ni la tabla puente) | `database/03_documentacion/INDICE.md` | Induce a error a quien lo use como diccionario | Media |
| H-05 | El README raíz documenta contraseñas de seed (<credencial de prueba — ver R-08>) que **no coinciden** con `03_seed_data.sql` (<credencial de prueba — ver R-08>) | `README.md:82-88` vs `03_seed_data.sql` | Imposible iniciar sesión siguiendo la guía | Media |
| H-06 | `src/interfaces/Alquiler.ts` define `HistorialAlquiler` con una forma incompatible con la respuesta real de `GET /alquileres/{id}/historial` (`{id_alquiler, total_eventos, eventos[]}`) | `src/interfaces/Alquiler.ts:96-103` | Deserialización inconsistente | Media |
| H-07 | Los tipos de `src/api/alquileres.ts` y `src/api/gastos.ts` aún incluyen `es_recogida: boolean`, campo que ya no existe (fue sustituido por `tipo_movimiento`) | `src/api/*.ts` | Contrato desalineado con la BD | Baja |
| H-08 | La migración `d4f74f3d4896_baseline_schema.py` es un *baseline* cuyo `upgrade()` hace `DROP` de objetos existentes | `alembic/versions/` | Ejecutar `alembic upgrade head` sobre una BD ya creada por SQL elimina índices, constraints y la tabla `auditoria_sistema` | Alta |
| H-09 | La vista `vw_dashboard_operativo` y las vistas de `06_vistas_dashboard.sql` no están expuestas por ningún endpoint de la API | `database/01_esquema/06_vistas_dashboard.sql` | El dashboard se arma con 3 llamadas a `/alquileres/*` en lugar de una | Baja |
| H-10 | `docs/requirements/*.md`, `docs/scrum/*.md`, `docs/ui_ux/*.md` y `docs/architecture/architecture_map.md` existen pero están **vacíos** | `docs/` | No hay historia de requisitos ni criterios de aceptación formalizados | Media |
| H-11 | No existe suite de pruebas automatizadas (ni `tests/` en backend ni tests en frontend) | — | Regresiones no detectadas de forma automática | Media |
| H-12 | `POST /usuarios` no acepta `estado_registro` ni `contrasena_usuario` obligatoria en el frontend (`UsuarioCreatePayload.contrasena_usuario` es opcional) mientras el backend exige `min_length=4` | `src/interfaces/Usuario.ts` vs `app/schemas/usuario_schema.py` | Riesgo de 422 en el formulario de alta de usuarios | Baja |
| H-13 | `alembic` **no está declarado** en `requirements.txt` | `sga_backend_jwt/requirements.txt` | `alembic stamp head` (paso obligatorio de la guía de instalación) falla en una instalación limpia | Media |
| H-14 | `app/models/__init__.py` está vacío: los modelos no se registran de forma centralizada | `app/models/__init__.py` | Cada módulo debe importarlos explícitamente; es la causa de que `alembic/env.py` olvide `AuditoriaSistema` | Baja |

---

## 9. Atributos de calidad evaluados

| Atributo | Estado | Evidencia / brecha |
|---|---|---|
| **Seguridad** | Parcial | bcrypt + JWT HS256 + RBAC por endpoint + auditoría con identidad inyectada. Pendiente: endurecer CORS (H-01), revalidación de rol (H-02), definir rotación de `JWT_SECRET_KEY` y política de contraseñas. |
| **Integridad referencial y de datos** | Alta | 6 tablas con FK, `CHECK`, índices parciales únicos y 14 triggers que impiden stock negativo, baja de producto en obra, alquiler cerrado editable y sistema sin admin. |
| **Trazabilidad** | Alta | `auditoria_sistema` con diff JSONB completo, autor, y timestamp. |
| **Mantenibilidad** | Media-Alta | Separación estricta routes/controllers/schemas/models/utils; módulos `tiempo.py` y `unidades.py` como fuente única de verdad. Brecha: código duplicado por patrón `try/except` en cada ruta y ausencia de tests. |
| **Escalabilidad** | Media | Pool con `pool_pre_ping` y `pool_recycle=3600`; índices de rendimiento relevantes. Sin caché, sin paginación en los listados (potencial problema con volúmenes altos de alquileres) y scheduler en proceso (una sola instancia debe correrlo). |
| **Usabilidad de la UI** | Media-Alta | Sistema de diseño propio, modo claro/oscuro, responsive con `list-card` en móvil, toasts, modales. |
| **Observabilidad** | Baja | Solo logging por `print` en el arranque. No hay logging estructurado, ni métricas, ni trazas (Sentry/OpenTelemetry) ni health-check dedicado. |
| **Portabilidad / reproducibilidad** | Media | Versiones fijadas en `requirements.txt`; `package.json` con rangos `^` (no reproducible) y `package-lock.json` presente. |

---

## 10. Referencias cruzadas

- Contrato HTTP detallado: [`DXC-2026-003_api_contrato.md`](../04_diagnostico/DXC-2026-003_api_contrato.md)
- Esquema, columnas y triggers: [`DXC-2026-002_base_de_datos.md`](../04_diagnostico/DXC-2026-002_base_de_datos.md)
- Reglas de negocio y RBAC: [`DXC-2026-005_reglas_negocio_rbac.md`](../04_diagnostico/DXC-2026-005_reglas_negocio_rbac.md)
- Componentes y estilos del frontend: [`DXC-2026-004_frontend_componentes.md`](../04_diagnostico/DXC-2026-004_frontend_componentes.md)
- Puesta en marcha y despliegue: [`DXC-2026-006_despliegue_configuracion.md`](../04_diagnostico/DXC-2026-006_despliegue_configuracion.md)
