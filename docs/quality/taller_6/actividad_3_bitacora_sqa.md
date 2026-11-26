# Bitácora SQA — Sección 6 del Dossier de Calidad (Taller 6, Actividad 3)

- **Proyecto:** Sistema de Gestión de Alquileres de Andamios (SGA)
- **Norma de referencia:** ISO/IEC 25010:2023 (según `Matriz_RNF_SGA_Taller6_ISO25010_2023.xlsx`)
- **Documento académico:** `Taller-6-Evaluacion-RNF-Calidad.docx` (Actividad 3)
- **Rama de auditoría:** `feat/taller-6-calidad-sqa` (base: `dev` @ `599f96fd28e282725e6a325604e8ddaa0b8850b5`)
- **Fecha de registro:** 2026-11-25

---

## 1. Resumen Ejecutivo de Estado

| Actividad / Herramienta | Línea Base | Resultado Final | Criterio Taller 6 | Estado |
|---|---|---|---|---|
| **Flake8** (`app/`, `tests/`, `locustfile.py`) | `271` hallazgos en `app/`, `86` en `tests/` (exit `1`) | **`0` hallazgos** (exit `0` con `.flake8`, `max-line-length=120`) | Resultado limpio sin errores | **Cumplido con evidencia** *(captura visual PNG pendiente manual)* |
| **Radon MI** (`app/`) | `47/47` archivos en calificación **A** (`44.85`–`100.00`) | **`47/47` archivos en A** (`44.92`–`100.00`), `0` B, `0` C/D/F | Notas A o B en todos los módulos | **Cumplido con evidencia** *(captura visual PNG pendiente manual)* |
| **Radon CC** (`app/`) | `148` bloques; promedio **A (2.88)**; `3` en **C**, `7` en **B** | **`148` bloques; promedio A (2.88)**; `3` en **C** (máx. `17`) | Baja complejidad; documentar/proponer refactor C/D/F | **Cumplido con evidencia** *(propuestas de refactorización documentadas en `02_radon.md` sin alterar lógica)* |
| **pytest-cov** (`app/`) | `31` pruebas OK; **`50%`** cobertura (`1542` stmts, `776` miss) | **`54` pruebas OK (`0` fallos); `86%` cobertura** (`211` miss, `0` exclusiones) | Cobertura global `>= 80%` | **Cumplido con evidencia** *(con mocks de BD; captura PNG pendiente manual)* |
| **Locust** (`locustfile.py`) | No existía `locustfile.py` | `locustfile.py` creado, verificado sintácticamente y con guardia de host local | 50 usuarios, 5/s, 10 min, `p95 <= 1,5 s`, errores `<= 1%` | **Bloqueado por entorno** *(sin BD PostgreSQL local aislada verificada ni autorización de ejecución activa)* |
| **Frontend (separado)** | `7/7` tests; `npm run lint` sin filtrar `node_modules` | **`7/7` tests OK** (`node --test`); **`oxlint src`: `0` errores** (`7` warnings); `vite build` OK | Reportar por separado | **Cumplido con evidencia** *(informativo, separado de cobertura Python)* |

---

## 2. Tabla de Trazabilidad RNF / CP-RNF / Herramienta

Basada estrictamente en los identificadores de `Matriz_RNF_SGA_Taller6_ISO25010_2023.xlsx` (ISO/IEC 25010:2023) sin inventar ni alterar criterios:

| Herramienta / Verificación | RNF / CP-RNF asociado | Comando exacto | Fecha y entorno | Resultado real medido | Evidencia | Estado |
|---|---|---|---|---|---|---|
| **Flake8** (línea base sin `.flake8`) | `RNF18` / `CP-RNF-18` (Modularidad / Mantenibilidad) | `.\venv\Scripts\python.exe -m flake8 app/ --statistics` | 2026-11-25 · Python 3.12.10 Windows (`sga_backend_jwt`) | `271` hallazgos en `app/` (`249 E501`, `8 E402`, `3 E303`, `3 W291`, `2 E302`, `2 E712`, `2 W391`, `1 F401`, `1 W293`); exit `1` | [`reportes/baseline_flake8_app.txt`](reportes/baseline_flake8_app.txt) | Línea base registrada |
| **Flake8** (final con `.flake8`) | `RNF18` / `CP-RNF-18` (Mantenibilidad) | `.\venv\Scripts\python.exe -m flake8 app/ tests/ locustfile.py` | 2026-11-25 · Python 3.12.10 Windows (`sga_backend_jwt`) | **`0` errores / `0` advertencias**; exit `0` | [`reportes/flake8_final.txt`](reportes/flake8_final.txt) *(PNG pendiente en `evidencias/flake8_resultado.png`)* | **Cumplido con evidencia** (texto) / **Pendiente captura manual** |
| **Radon MI** | `RNF18` / `CP-RNF-18` (Mantenibilidad — Analizabilidad) | `.\venv\Scripts\python.exe -m radon mi app/ -s` | 2026-11-25 · Python 3.12.10 Windows (`sga_backend_jwt`) | **`47/47` archivos en nota A** (rango `44.92` a `100.00`; `0` B, `0` C/D/F) | [`reportes/radon_mi.txt`](reportes/radon_mi.txt) *(PNG pendiente en `evidencias/radon_mi.png`)* | **Cumplido con evidencia** (texto) / **Pendiente captura manual** |
| **Radon CC** | `RNF18` / `CP-RNF-18` (Mantenibilidad — Modularidad) | `.\venv\Scripts\python.exe -m radon cc app/ -s -a -o SCORE` | 2026-11-25 · Python 3.12.10 Windows (`sga_backend_jwt`) | `148` bloques; promedio **A (2.88)**; `138` A, `7` B, `3` C (`_orm_to_dict` C17, `actualizar_alquiler` C14, `actualizar_usuario` C11) | [`reportes/radon_cc.txt`](reportes/radon_cc.txt) | **Cumplido con evidencia** (propuestas de refactorización documentadas) |
| **pytest-cov** (línea base) | `RNF01`–`RNF04`, `RNF15`, `RNF17` | `.\venv\Scripts\python.exe -m pytest tests/ --cov=app --cov-report=term-missing` | 2026-11-25 · Python 3.12.10 Windows (mocks SQLAlchemy) | `31 passed`; **`50%`** cobertura (`1542` stmts, `776` miss) | [`reportes/baseline_pytest_cov.txt`](reportes/baseline_pytest_cov.txt) | Línea base registrada |
| **pytest-cov** (suite ampliada) | `RNF01` (`CP-RNF-01`), `RNF02` (`CP-RNF-02`), `RNF03` (`CP-RNF-03`), `RNF04` (`CP-RNF-04`), `RNF15` (`CP-RNF-15`), `RNF16` (`CP-RNF-16`, parcial vía llamada a `set_audit_context`), `RNF17` (`CP-RNF-17`), `RNF20` (`CP-RNF-20`) | `.\venv\Scripts\python.exe -m pytest tests/ --cov=app --cov-report=term-missing --cov-report=html:../docs/quality/taller_6/reportes/htmlcov --cov-report=xml:../docs/quality/taller_6/reportes/coverage.xml` | 2026-11-25 · Python 3.12.10 Windows (mocks SQLAlchemy) | **`54 passed, 0 failed`**; **`86%` cobertura global** (`1542` stmts, `211` miss, `0` exclusiones) | [`reportes/pytest_cov.txt`](reportes/pytest_cov.txt), `reportes/coverage.xml`, `reportes/htmlcov/` *(PNG pendiente en `evidencias/pytest_cov_resumen.png`)* | **Cumplido con evidencia** en entorno mock *(no prueba triggers/rollbacks reales de PostgreSQL para `RNF14`/`RNF22`)* |
| **Locust** (`locustfile.py`) | `RNF24` (`CP-RNF-24`) y `RNF25` (`CP-RNF-25`) | `.\venv\Scripts\python.exe -m locust -f locustfile.py` *(preparado, no ejecutado)* | 2026-11-25 · `locust 2.47.0` | Script válido (`flake8` exit `0`), guardia contra hosts productivos verificada | [`sga_backend_jwt/locustfile.py`](../../../sga_backend_jwt/locustfile.py), [`04_locust.md`](04_locust.md) *(PNG pendiente en `evidencias/locust_ejecucion.png`)* | **Bloqueado** (sin BD PostgreSQL local aislada ni autorización de carga viva) |
| **Inspección Git / Secretos** | `RNF07` (`CP-RNF-07`), `RNF21` (`CP-RNF-21`) | `git status`, `git diff --check`, revisión manual | 2026-11-25 · rama `feat/taller-6-calidad-sqa` | `0` secretos añadidos, `git diff --check` limpio, `.env` excluido | Estado Git de la rama | **Cumplido con evidencia** |
| **Pruebas y lint Frontend** (separado) | `RNF04` (UI), `RNF05` (parcial), `RNF10` | `node --test tests/CambiarEstadoSection.test.mjs`; `npx oxlint src` | 2026-11-25 · `sga_frontend_jwt` | `7/7` tests OK; `oxlint src`: `0` errores, `7` warnings | [`03_pytest_cov.md`](03_pytest_cov.md) | **Cumplido con evidencia** (alcance parcial UI) |

---

## 3. Cobertura frente al Total de la Matriz RNF01–RNF25

Las herramientas de la Actividad 3 (Flake8, Radon, `pytest-cov`, Locust) auditan principalmente **Mantenibilidad, Seguridad en lógica/API, Corrección Funcional y Eficiencia de Desempeño** del backend Python. Para no sobredimensionar su alcance, se deja constancia explícita de los RNF que **no quedan certificados** por esta actividad:

- **Parcialmente verificados (solo con mocks unitarios, sin PostgreSQL real):** `RNF14` (*Integridad transaccional y rollback de triggers*), `RNF16` (*Trazabilidad en `auditoria_sistema` vía triggers SQL*), `RNF22` (*Migraciones Alembic desde cero y scripts SQL auxiliares*).
- **No ejecutables en esta actividad (requieren entorno local/staging en ejecución):** `RNF23` (*Docker Compose y healthchecks*), `RNF24` y `RNF25` (*Locust contra backend local con BD sintética*).
- **Fuera del alcance de auditoría Python (requieren navegador/DevTools/Playwright o escaneo dedicado):** `RNF05`, `RNF06` (preflight CORS real), `RNF08` (*Responsive 360/768/1280*), `RNF09` (*Consistencia visual*), `RNF10` (*Idioma español*), `RNF11` (*Persistencia de tema*), `RNF12` (*Retroalimentación*), `RNF13` (*Manejo de errores/red en UI*), `RNF19` (comparación formal esquema OpenAPI en ejecución vs `api_reference.md`).

---

## 4. Instrucciones para Capturas Visuales Obligatorias

La Actividad 3 solicita 4 capturas en la Sección 6 del dossier (`evidencias/`). En cumplimiento estricto de integridad, **no se fabricaron ni dibujaron imágenes simuladas**. Cuando el equipo ejecute la captura en terminal interactiva y navegador, debe guardarlas en:

1. `docs/quality/taller_6/evidencias/flake8_resultado.png` — Captura de consola ejecutando `.\venv\Scripts\python.exe -m flake8 app/ tests/ locustfile.py` con salida limpia y retorno sin errores.
2. `docs/quality/taller_6/evidencias/radon_mi.png` — Captura de consola ejecutando `.\venv\Scripts\python.exe -m radon mi app/ -s` mostrando los 47 módulos con nota `A`.
3. `docs/quality/taller_6/evidencias/pytest_cov_resumen.png` — Captura de consola ejecutando `.\venv\Scripts\python.exe -m pytest tests/ --cov=app --cov-report=term-missing` mostrando `54 passed` y `TOTAL 86%`.
4. `docs/quality/taller_6/evidencias/locust_ejecucion.png` — Captura de la Web UI de Locust (`http://localhost:8089`) ejecutándose contra el backend **local aislado** con `50` usuarios, `5` usuarios/s durante `10` minutos (ver [`04_locust.md`](04_locust.md)).
