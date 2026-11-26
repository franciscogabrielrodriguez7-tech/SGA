# Dossier de Calidad — Taller 6 (Actividad 3: Auditoría SQA en Python)

- **Proyecto:** Sistema de Gestión de Alquileres de Andamios (SGA) — Fundiplacas Rodríguez
- **Rama aislada:** `feat/taller-6-calidad-sqa` (creada desde `dev` @ `599f96fd28e282725e6a325604e8ddaa0b8850b5`)
- **Fecha de ejecución:** 2026-11-25
- **Entorno verificado:** Windows · Python `3.12.10` (`sga_backend_jwt/venv`) · Node.js (`sga_frontend_jwt`)

---

## 1. Índice del Dossier

| Archivo | Propósito |
|---|---|
| [`actividad_3_bitacora_sqa.md`](actividad_3_bitacora_sqa.md) | Documento principal para la **Sección 6 — Bitácora SQA** del Dossier de Calidad, con tabla de trazabilidad RNF/CP-RNF y estado global |
| [`01_flake8.md`](01_flake8.md) | Auditoría PEP 8 y sintaxis con Flake8 (línea base, configuración `.flake8`, correcciones seguras de estilo y resultado limpio) |
| [`02_radon.md`](02_radon.md) | Análisis de Índice de Mantenibilidad (MI) y Complejidad Ciclomática (CC) por archivo y bloque con Radon |
| [`03_pytest_cov.md`](03_pytest_cov.md) | Pruebas unitarias y de rutas con `pytest-cov`, cobertura módulo a módulo (`86%` global) y reporte separado del frontend |
| [`04_locust.md`](04_locust.md) | Diseño de `locustfile.py`, configuración de carga para `RNF24`/`RNF25`, guardia de seguridad local y estado bloqueado de ejecución |
| [`05_plan_mejoras.md`](05_plan_mejoras.md) | Plan priorizado de remediación técnica, refactorizaciones propuestas y brechas pendientes |
| [`evidencias/`](evidencias/README.md) | Directorio destinado a las 4 capturas visuales requeridas por el taller (sin imágenes fabricadas) |
| `reportes/` | Salidas textuales completas (`baseline_*.txt`, `flake8_final.txt`, `radon_mi.txt`, `radon_cc.txt`, `pytest_cov.txt`), `coverage.xml` y `htmlcov/` |

---

## 2. Adaptación a la Estructura Real del Repositorio

El enunciado académico (`Taller-6-Evaluacion-RNF-Calidad.docx`) usa `src/` y `tests/` como nombres genéricos de ejemplo. En el repositorio real del SGA no se crearon carpetas ficticias; las herramientas se adaptaron a los directorios reales:

| Concepto del taller | Ubicación real en SGA | Herramientas aplicadas |
|---|---|---|
| Código fuente Python (`src/`) | `sga_backend_jwt/app/` | Flake8, Radon (`mi`, `cc`), `pytest-cov` (`--cov=app`) |
| Pruebas Python (`tests/`) | `sga_backend_jwt/tests/` | Flake8 (por separado), `pytest` |
| Script de carga | `sga_backend_jwt/locustfile.py` | Flake8, Locust |
| Código frontend (React/TS) | `sga_frontend_jwt/src/` | `oxlint src`, `tsc -b && vite build` *(reportado por separado)* |
| Pruebas frontend | `sga_frontend_jwt/tests/CambiarEstadoSection.test.mjs` | `node --test` *(reportado por separado)* |

---

## 3. Dependencias de Desarrollo Instaladas

Registradas en [`sga_backend_jwt/requirements-dev.txt`](../../../sga_backend_jwt/requirements-dev.txt) e instaladas exclusivamente en `sga_backend_jwt/venv` (sin modificar `requirements.txt` ni `Dockerfile` de producción):

- `flake8==7.5.0` (`mccabe==0.7.0`, `pycodestyle==2.15.0`, `pyflakes==4.1.0`)
- `radon==6.0.1` (`mando==0.7.1`)
- `pytest==9.2.0`
- `pytest-cov==7.1.0` (`coverage==7.17.5`)
- `locust==2.47.0`

---

## 4. Guía Rápida de Reproducción

Desde `sga_backend_jwt/`:

```powershell
# 1. Auditoría de estilo PEP 8 (código de aplicación, pruebas y script de carga)
.\venv\Scripts\python.exe -m flake8 app/ tests/ locustfile.py

# 2. Índice de Mantenibilidad (MI) y Complejidad Ciclomática (CC)
.\venv\Scripts\python.exe -m radon mi app/ -s
.\venv\Scripts\python.exe -m radon cc app/ -s -a -o SCORE

# 3. Suite de pruebas unitarias y cobertura global
.\venv\Scripts\python.exe -m pytest tests/ --cov=app --cov-report=term-missing --cov-report=html:../docs/quality/taller_6/reportes/htmlcov --cov-report=xml:../docs/quality/taller_6/reportes/coverage.xml

# 4. Prueba de carga (solo cuando exista PostgreSQL local aislado con datos sintéticos)
.\venv\Scripts\python.exe -m locust -f locustfile.py
```

> **Nota sobre Git:** El archivo `.gitignore` raíz excluye globalmente `coverage.xml` y `htmlcov/`, por lo que dichos artefactos se generan localmente en `docs/quality/taller_6/reportes/`, mientras que las salidas textuales `*.txt` y la documentación Markdown quedan disponibles para versionado.
