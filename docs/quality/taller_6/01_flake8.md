# 01 — Auditoría de Estilo y Sintaxis con Flake8 (PEP 8)

- **Herramienta:** `flake8 7.5.0` (`mccabe: 0.7.0`, `pycodestyle: 2.15.0`, `pyflakes: 4.1.0`)
- **Intérprete:** Python `3.12.10` (`sga_backend_jwt/venv`)
- **Alcance:** `sga_backend_jwt/app/`, `sga_backend_jwt/tests/` (por separado) y `sga_backend_jwt/locustfile.py`
- **RNF relacionado:** `RNF18` / `CP-RNF-18` (Mantenibilidad — estandarización y analizabilidad del código Python)

---

## 1. Línea Base Original (Sin Configuración ni Correcciones)

Antes de agregar `.flake8` ni aplicar correcciones de estilo, se ejecutó Flake8 con sus reglas por defecto (`max-line-length = 79`).

### 1.1 Código de aplicación (`sga_backend_jwt/app/`)
- **Comando:** `.\venv\Scripts\python.exe -m flake8 app/ --statistics`
- **Código de retorno:** `1`
- **Total de hallazgos:** **271** (evidencia completa en [`reportes/baseline_flake8_app.txt`](reportes/baseline_flake8_app.txt))

| Código | Descripción | Cantidad | Archivos afectados principales |
|---|---|---:|---|
| `E501` | Línea supera 79 caracteres (entre 80 y 137) | 249 | `routes/*.py`, `controllers/*.py`, `models/*.py`, `schemas/*.py`, `utils/*.py`, `config/settings.py`, `main.py` |
| `E402` | Importación de nivel de módulo fuera del inicio del archivo | 8 | `app/main.py` (líneas 43 y 101–107) |
| `E303` | Demasiadas líneas en blanco (3 en lugar de 2) | 3 | `cliente_controller.py`, `producto_controller.py`, `usuario_controller.py` |
| `W291` | Espacios en blanco al final de línea | 3 | `alquiler_controller.py`, `logistica_alquiler_controller.py` |
| `E302` | Se esperaban 2 líneas en blanco, encontradas 3 | 2 | `cliente_controller.py`, `usuario_controller.py` |
| `E712` | Comparación booleana `== True` en filtro SQLAlchemy | 2 | `alquiler_controller.py` (líneas 452 y 673) |
| `W391` | Línea en blanco adicional al final del archivo | 2 | `models/producto.py`, `schemas/producto_schema.py` |
| `F401` | Importación no utilizada (`sqlalchemy.UniqueConstraint`) | 1 | `models/detalle_alquiler.py:1` |
| `W293` | Línea en blanco contiene espacios | 1 | `alquiler_controller.py:421` |

### 1.2 Pruebas unitarias existentes (`sga_backend_jwt/tests/`)
- **Comando:** `.\venv\Scripts\python.exe -m flake8 tests/ --statistics`
- **Código de retorno:** `1`
- **Total de hallazgos:** **86** (`75 E501`, `11 E402` por configuración previa de `os.environ` antes de importar `app.*`) — ver [`reportes/baseline_flake8_tests.txt`](reportes/baseline_flake8_tests.txt).

---

## 2. Configuración Propuesta y Aplicada (`sga_backend_jwt/.flake8`)

Para evitar ocultar defectos reales y al mismo tiempo mantener un límite de línea realista para un proyecto FastAPI + SQLAlchemy con mensajes de negocio en español, se creó [`sga_backend_jwt/.flake8`](../../../sga_backend_jwt/.flake8):

```ini
[flake8]
max-line-length = 120
exclude =
    venv,
    .venv,
    __pycache__,
    alembic/versions,
    .git,
    htmlcov
per-file-ignores =
    # Los archivos de pruebas parchan dotenv y configuran variables de entorno ficticias antes de importar app.*
    tests/*.py: E402
```

**Justificación técnica de cada regla:**
- `max-line-length = 120`: reemplaza el límite histórico de 79 columnas (que provocaba el 91.9% de los avisos en mensajes de error y firmas FastAPI), pero conserva exigencia sobre líneas excesivamente largas (> 120 caracteres).
- `E402`, `F401`, `E302`, `E303`, `E712`, `W291`, `W293`, `W391`: **no** se desactivan globalmente en `app/`.
- `tests/*.py: E402`: únicamente en pruebas, porque requieren inyectar variables de entorno ficticias y neutralizar `dotenv.load_dotenv` antes de importar `app.config.settings`.

---

## 3. Remediaciones Seguras Aplicadas (Sin Alterar Lógica)

Se aplicaron exclusivamente correcciones de estilo seguras y sin impacto en comportamiento:

1. `app/main.py`: reubicación de todas las importaciones de nivel de módulo al inicio del archivo (`E402` resuelto sin `# noqa`).
2. `app/models/detalle_alquiler.py`: eliminación del import no utilizado `UniqueConstraint` (`F401`) y ajuste multilínea de dos cláusulas `ForeignKey(...)` de 121 caracteres (`E501`).
3. `app/models/producto.py` y `app/schemas/producto_schema.py`: eliminación de línea en blanco extra al final de archivo (`W391`).
4. `app/controllers/alquiler_controller.py`: ajuste de `CAMPOS_EDITABLES_POR_ESTADO["pendiente"]` (`137` -> `<= 120` chars), limpieza de espacios finales (`W291`, `W293`) y uso explícito de `# noqa: E712` en las comparaciones de columnas SQLAlchemy `== True` de líneas 452 y 673 (consistente con la línea 477 ya existente, preservando exactamente la expresión SQL generada).
5. `app/controllers/logistica_alquiler_controller.py`: limpieza de espacios al final de comentarios (`W291`).
6. `app/controllers/cliente_controller.py`, `producto_controller.py`, `usuario_controller.py`: normalización a 2 líneas en blanco antes de definiciones de función (`E302`, `E303`).

---

## 4. Resultado Final Verificado

- **Comandos ejecutados:**
  - `.\venv\Scripts\python.exe -m flake8 app/ tests/` -> salida vacía, **código de retorno `0`** ([`reportes/flake8_final.txt`](reportes/flake8_final.txt)).
  - `.\venv\Scripts\python.exe -m flake8 locustfile.py` -> salida vacía, **código de retorno `0`**.
- **Conclusión:** Bajo la configuración mínima [`sga_backend_jwt/.flake8`](../../../sga_backend_jwt/.flake8) (`max-line-length = 120`, `E402` permitido únicamente en `tests/*.py`), todo el código Python del backend (`app/`, `tests/` y `locustfile.py`) pasa Flake8 con **0 hallazgos**.
- **Nota de transparencia:** Si se exigiera estrictamente `max-line-length = 79` sin `.flake8`, permanecerían 246 líneas de 80–120 caracteres en `app/`, principalmente en firmas de rutas FastAPI y cadenas descriptivas en español.
