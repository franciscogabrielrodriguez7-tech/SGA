# 04 — Diseño y Preparación de Pruebas de Carga con Locust (`RNF24` / `RNF25`)

- **Herramienta:** `locust 2.47.0`
- **Archivo implementado:** [`sga_backend_jwt/locustfile.py`](../../../sga_backend_jwt/locustfile.py)
- **RNF asociados:**
  - `RNF24` / `CP-RNF-24` — *Gestión de conexiones* (reutilización en pool SQLAlchemy `pool_pre_ping=True`, `pool_recycle=3600` sin agotamiento ni errores de conexión)
  - `RNF25` / `CP-RNF-25` — *Tiempo de respuesta* (percentil 95 `<= 1,5 s` y tasa de errores técnicos `<= 1%` bajo carga)
- **Estado actual de ejecución:** **BLOQUEADO / PENDIENTE DE ENTORNO LOCAL AISLADO** (por instrucción expresa: no ejecutar carga contra producción/Render ni contra BD no verificada como local aislada con datos sintéticos).

---

## 1. Criterios Propuestos en la Matriz RNF (No Medidos Aún)

Según `Matriz_RNF_SGA_Taller6_ISO25010_2023.xlsx`, los parámetros propuestos para validación académica son:
- **Usuarios concurrentes:** `50`
- **Spawn rate:** `5` usuarios/segundo
- **Duración objetivo:** `10` minutos
- **Umbral p95 propuesto:** `<= 1,5` segundos (`1500 ms`)
- **Tasa máxima de errores técnicos propuesta:** `<= 1%`

> Estos valores corresponden al criterio propuesto en la matriz de referencia, no a mediciones ejecutadas ni a un SLA productivo aprobado por el propietario.

---

## 2. Diseño del Script [`locustfile.py`](../../../sga_backend_jwt/locustfile.py)

### 2.1 Seguridad operacional integrada
- **Guardia obligatoria de host (`validar_host_seguro`):** En el evento `@events.test_start`, se valida el hostname destino. Únicamente permite `localhost`, `127.0.0.1` o hosts listados explícitamente en `SGA_LOAD_ALLOWED_STAGING_HOSTS`. Cualquier intento contra un dominio externo o productivo aborta inmediatamente con `RuntimeError`. *(Verificado unitariamente: `localhost ok`, `sga-prod.onrender.com` bloqueado).*
- **Sin secretos ni tokens codificados:** Las credenciales sintéticas del entorno de prueba se leen exclusivamente desde variables de entorno:
  - `SGA_LOAD_BASE_URL` (por defecto `http://127.0.0.1:8000`)
  - `SGA_LOAD_EMAIL` o `SGA_LOAD_PHONE`
  - `SGA_LOAD_PASSWORD`
- **Sin escrituras repetitivas de negocio:** `on_start()` realiza una sola autenticación `POST /api/sga/auth/login` por usuario virtual para obtener su JWT; todas las tareas `@task` posteriores ejecutan consultas `GET` seguras de solo lectura.

### 2.2 Mezcla de endpoints y agrupación (`name`)

| Peso (`@task`) | Método y Endpoint | Agrupación (`name`) | Rol / Requisito |
|---:|---|---|---|
| `1` | `GET /` | `/ (health)` | Público (diagnóstico) |
| `4` | `GET /api/sga/alquileres` | `/api/sga/alquileres` | `STAFF_INTERNO` (alimenta `self.alquiler_ids`) |
| `3` | `GET /api/sga/productos?solo_activos=true` | `/api/sga/productos` | `STAFF_INTERNO` |
| `2` | `GET /api/sga/clientes` | `/api/sga/clientes` | `STAFF_INTERNO` |
| `2` | `GET /api/sga/alquileres/proximos-vencer?dias=2` | `/api/sga/alquileres/proximos-vencer` | `STAFF_INTERNO` |
| `2` | `GET /api/sga/alquileres/pendientes-entrega` | `/api/sga/alquileres/pendientes-entrega` | `STAFF_INTERNO` |
| `2` | `GET /api/sga/alquileres/buscar?barrio=Centro` | `/api/sga/alquileres/buscar` | `STAFF_INTERNO` |
| `2` | `GET /api/sga/alquileres/{id}` y `/{id}/detalles` | `/api/sga/alquileres/[id]` y `/detalles` | `STAFF_INTERNO` (IDs capturados dinámicamente) |
| `1` | `GET /api/sga/gastos` + `GET /api/sga/usuarios?rol_usuario=encargado_logistico` (+ `/gastos/resumen-semanal` solo si es `admin` o `encargado_facturacion`) | Agrupados por ruta base | `STAFF_INTERNO` / `ADMIN_O_FACTURACION` |

- **Tiempo de espera (`wait_time`):** `between(1.0, 2.5)` segundos entre ciclos para simular navegación realista de usuarios concurrentes.
- **Estilo:** `locustfile.py` verificado con `flake8` (`exit code 0`).

---

## 3. Motivo del Bloqueo y Requisitos para Habilitar Ejecución Real

No se ejecutó la prueba de carga porque:
1. Por decisión del propietario, debe verificarse previamente la disponibilidad de una base de datos PostgreSQL **local aislada** cargada con datos sintéticos (`03_seed_data.sql`) y sin vínculo con Render/producción.
2. En el entorno actual no existe `.env.docker` ni se recibió autorización para levantar un servidor local contra la BD local activa de `sga_backend_jwt/.env`.

---

## 4. Procedimiento Reproducible (Cuando el Entorno Local Esté Listo)

1. **Preparar base de datos PostgreSQL local aislada** (ej. `sga_load_test`) con `alembic upgrade head`, `02_funciones_y_triggers.sql` y los usuarios/datos ficticios de `database/01_esquema/03_seed_data.sql`.
2. **Confirmar que el backend apunte exclusivamente a localhost** (`127.0.0.1:5432`) e iniciar Uvicorn en `127.0.0.1:8000`:
   ```powershell
   cd sga_backend_jwt
   .\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000
   ```
3. **Configurar variables de entorno para Locust en otra terminal** (usando únicamente un usuario ficticio local del seed, nunca credenciales productivas):
   ```powershell
   cd sga_backend_jwt
   $env:SGA_LOAD_BASE_URL = "http://127.0.0.1:8000"
   $env:SGA_LOAD_EMAIL = "<email_sintetico_seed_local>"
   $env:SGA_LOAD_PASSWORD = "<contrasena_ficticia_seed_local>"
   .\venv\Scripts\python.exe -m locust -f locustfile.py
   ```
4. **Ejecutar desde Web UI (`http://localhost:8089`):**
   - **Host:** `http://127.0.0.1:8000`
   - **Number of users:** `50`
   - **Spawn rate:** `5`
   - Ejecutar durante `10` minutos.
5. **Capturar y exportar evidencias reales:**
   - Descargar reportes CSV/HTML desde la pestaña *Download Data* de Locust hacia `docs/quality/taller_6/reportes/`.
   - Tomar captura real de la Web UI mostrando RPS, total de solicitudes, fallos, p50, p95, p99 y tiempo máximo y guardarla en `docs/quality/taller_6/evidencias/locust_ejecucion.png`.
   - Completar la tabla de métricas reales en este documento antes de cerrar la entrega académica.

---

## 5. Registro de Métricas de Ejecución *(Pendiente)*

| Métrica | Valor medido | Umbral propuesto (`RNF24`/`RNF25`) | Estado |
|---|---:|---|---|
| Usuarios concurrentes | *No ejecutado* | `50` | Bloqueado |
| Spawn rate | *No ejecutado* | `5` usuarios/s | Bloqueado |
| Duración real | *No ejecutado* | `10` minutos | Bloqueado |
| Total de solicitudes | *No ejecutado* | — | Bloqueado |
| RPS promedio | *No ejecutado* | — | Bloqueado |
| p50 / p95 / p99 / Máximo | *No ejecutado* | `p95 <= 1500 ms` | Bloqueado |
| Tasa de errores técnicos (%) | *No ejecutado* | `<= 1%` | Bloqueado |
