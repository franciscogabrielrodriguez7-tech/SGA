# 03 — Pruebas Unitarias y Cobertura con `pytest-cov`

- **Herramientas:** `pytest 9.2.0`, `pytest-cov 7.1.0`, `coverage 7.17.5`
- **Configuración:** [`sga_backend_jwt/pyproject.toml`](../../../sga_backend_jwt/pyproject.toml) (`source = ["app"]`, `omit = []`)
- **RNF asociados:** `RNF01`–`RNF04`, `RNF15`, `RNF16` (parcial), `RNF17`, `RNF20`
- **Objetivo del taller:** Cobertura global `>= 80%` sin exclusiones arbitrarias

---

## 1. Comparativa Línea Base vs Suite Ampliada

| Medición | Pruebas ejecutadas | Fallidas | Sentencias (`Stmts`) | No cubiertas (`Miss`) | Cobertura global | Evidencia |
|---|---:|---:|---:|---:|---:|---|
| **Línea base inicial** (2 archivos existentes) | 31 | 0 | 1542 | 776 | **50%** | [`reportes/baseline_pytest_cov.txt`](reportes/baseline_pytest_cov.txt) |
| **Suite ampliada final** (5 archivos `test_*.py`) | **54** | **0** | 1542 | 211 | **86%** | [`reportes/pytest_cov.txt`](reportes/pytest_cov.txt) |

- **Comando exacto ejecutado:**
  ```powershell
  .\venv\Scripts\python.exe -m pytest tests/ --cov=app --cov-report=term-missing --cov-report=html:../docs/quality/taller_6/reportes/htmlcov --cov-report=xml:../docs/quality/taller_6/reportes/coverage.xml
  ```
- **Exclusiones aplicadas:** **Ninguna (`omit = []`)**. Se midieron los 47 módulos de `app/`.
- **Alcance técnico del entorno de prueba:** Las pruebas unitarias y ASGI de FastAPI operan con sesiones/motores SQLAlchemy mockeados y variables de entorno ficticias declaradas en memoria antes de importar `app.*`. Por tanto, validan lógica Python, contratos Pydantic, permisos RBAC, códigos HTTP y manejo de errores, **pero no ejecutan DDL/DML ni triggers reales de PostgreSQL** (`RNF14`, `RNF22`).

---

## 2. Suites de Pruebas Incluidas (`sga_backend_jwt/tests/`)

1. [`test_security_usuario_serialization.py`](../../../sga_backend_jwt/tests/test_security_usuario_serialization.py) *(preexistente)* — 8 pruebas sobre exclusión estricta de `contrasena_usuario` (`I-001` / `DXA-06`).
2. [`test_alquiler_subresources_and_permissions.py`](../../../sga_backend_jwt/tests/test_alquiler_subresources_and_permissions.py) *(preexistente)* — 23 pruebas sobre RBAC en `PATCH /alquileres/{id}/estado` y normalización `404` de subrecursos (`/detalles`, `/entregas`, `/recogidas`).
3. [`test_utils_and_schemas.py`](../../../sga_backend_jwt/tests/test_utils_and_schemas.py) *(añadida)* — 6 clases/métodos probando `security.py`, `jwt_utils.py`, `auth_dependency.py`, `tiempo.py`, `unidades.py`, `db_errors.py`, `scheduler.py`, `database.py`, `response.py` y validadores Pydantic.
4. [`test_controllers_crud_and_routes.py`](../../../sga_backend_jwt/tests/test_controllers_crud_and_routes.py) *(añadida)* — cobertura CRUD, errores de negocio, unicidad, RBAC y rutas HTTP para `auth`, `productos`, `clientes`, `usuarios`, `gastos`, `detalle-alquiler`, `auditoria` y `GET /`.
5. [`test_alquiler_lifecycle_and_routes.py`](../../../sga_backend_jwt/tests/test_alquiler_lifecycle_and_routes.py) *(añadida)* — ciclo de vida completo de alquileres (`crear_alquiler`, matriz de edición en `actualizar_alquiler`, `cambiar_estado_alquiler`, `cancelar_alquiler`, `renovar_alquiler`, `registrar_entrega`, `registrar_recogida` y endpoints de `/api/sga/alquileres/*`).

---

## 3. Cobertura Detallada por Módulo (`TOTAL: 86%`)

| Módulo (`app/`) | Stmts | Miss | Cover | Líneas no cubiertas (`Missing`) |
|---|---:|---:|---:|---|
| `app/__init__.py` | 0 | 0 | 100% | — |
| `app/config/__init__.py` | 0 | 0 | 100% | — |
| `app/config/database.py` | 12 | 0 | **100%** | — |
| `app/config/settings.py` | 13 | 2 | **85%** | 12, 22 *(raises al faltar env vars)* |
| `app/controllers/__init__.py` | 0 | 0 | 100% | — |
| `app/controllers/alquiler_controller.py` | 230 | 23 | **90%** | 180-182, 199, 258, 303, 318, 327-329, 366-368, 510, 536-538, 567, 663, 687, 717-719 |
| `app/controllers/auditoria_controller.py` | 10 | 0 | **100%** | — |
| `app/controllers/cliente_controller.py` | 65 | 3 | **95%** | 125-127 |
| `app/controllers/detalle_alquiler_controller.py` | 60 | 8 | **87%** | 23, 142-144, 169, 204-206 |
| `app/controllers/logistica_alquiler_controller.py` | 35 | 0 | **100%** | — |
| `app/controllers/producto_controller.py` | 54 | 0 | **100%** | — |
| `app/controllers/usuario_controller.py` | 93 | 8 | **91%** | 23, 27, 47-49, 136-138 |
| `app/main.py` | 50 | 6 | **88%** | 32-33, 55, 60, 94-95 |
| `app/models/*` (8 archivos) | 117 | 0 | **100%** | — |
| `app/routes/__init__.py` | 0 | 0 | 100% | — |
| `app/routes/alquiler_routes.py` | 168 | 61 | **64%** | Bloques `except ValueError/Exception` y ramas 404 pendientes de prueba de error HTTP |
| `app/routes/auth_routes.py` | 18 | 0 | **100%** | — |
| `app/routes/cliente_routes.py` | 63 | 24 | **62%** | Bloques `except` 400/500 y 404 en PATCH |
| `app/routes/detalle_alquiler_routes.py` | 42 | 13 | **69%** | Bloques `except` 500/400 y 404 en PATCH |
| `app/routes/gastos_routes.py` | 35 | 10 | **71%** | Bloques `except` 400/500 |
| `app/routes/producto_routes.py` | 62 | 24 | **61%** | Bloques `except` 400/500 y 404 en PATCH |
| `app/routes/usuario_routes.py` | 65 | 24 | **63%** | Bloques `except` 400/500 y 404 en PATCH |
| `app/schemas/*` (7 archivos) | 157 | 1 | **99.4%** | `usuario_schema.py:96` |
| `app/utils/audit_context.py` | 4 | 0 | **100%** | — |
| `app/utils/auth_dependency.py` | 19 | 0 | **100%** | — |
| `app/utils/db_errors.py` | 13 | 0 | **100%** | — |
| `app/utils/jwt_utils.py` | 18 | 0 | **100%** | — |
| `app/utils/response.py` | 43 | 4 | **91%** | 61, 64-65, 73 |
| `app/utils/roles.py` | 12 | 0 | **100%** | — |
| `app/utils/scheduler.py` | 22 | 0 | **100%** | — |
| `app/utils/security.py` | 11 | 0 | **100%** | — |
| `app/utils/tiempo.py` | 38 | 0 | **100%** | — |
| `app/utils/unidades.py` | 13 | 0 | **100%** | — |
| **TOTAL** | **1542** | **211** | **86%** | Ver detalle línea a línea en [`reportes/pytest_cov.txt`](reportes/pytest_cov.txt) |

---

## 4. Artefactos de Reporte Generados

- Reporte completo de consola: [`reportes/pytest_cov.txt`](reportes/pytest_cov.txt)
- Reporte XML (Cobertura): `docs/quality/taller_6/reportes/coverage.xml` *(generado en disco; excluido de Git por `.gitignore:47`)*
- Reporte HTML interactivo: `docs/quality/taller_6/reportes/htmlcov/index.html` *(generado en disco; excluido de Git por `.gitignore:40`)*

---

## 5. Estado del Frontend (Reporte Separado — No Mezclado con Cobertura Python)

- **Pruebas automatizadas (`sga_frontend_jwt/tests/CambiarEstadoSection.test.mjs`):** `node --test tests/CambiarEstadoSection.test.mjs` -> **`7/7` subpruebas aprobadas (`0` fallos)**. Cubren renderizado SSR de `CambiarEstadoSection` (permisos de facturación vs restricción) y `LogisticaSection` (estado vacío, tarjetas con datos, autonomía logística).
- **Linter de código fuente (`sga_frontend_jwt/src/`):** `npx oxlint src` -> **`0` errores**, `7` advertencias (`68` archivos analizados en `139 ms`). *(Nota: ejecutar `npm run lint` sin ruta incluye `node_modules/` por configuración predeterminada de `oxlint`; se reporta esta observación en [`05_plan_mejoras.md`](05_plan_mejoras.md)).*
- **Build de producción:** `npm run build` (`tsc -b && vite build`) -> compilación exitosa verificada previamente sin errores de TypeScript.
