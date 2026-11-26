# Evidencias Visuales — Actividad 3 (Taller 6)

Esta carpeta aloja las **4 capturas reales** exigidas para la **Sección 6 — Bitácora SQA** del Dossier de Calidad:

| Archivo esperado | Contenido requerido | Estado actual |
|---|---|---|
| `flake8_resultado.png` | Captura real de terminal ejecutando `.\venv\Scripts\python.exe -m flake8 app/ tests/ locustfile.py` con salida limpia (exit `0`) | **Pendiente de captura manual** *(salida textual real en `../reportes/flake8_final.txt`)* |
| `radon_mi.png` | Captura real de consola ejecutando `.\venv\Scripts\python.exe -m radon mi app/ -s` mostrando calificación `A` en los 47 módulos | **Pendiente de captura manual** *(salida textual real en `../reportes/radon_mi.txt`)* |
| `pytest_cov_resumen.png` | Captura real del resumen de cobertura ejecutando `.\venv\Scripts\python.exe -m pytest tests/ --cov=app --cov-report=term-missing` (`54 passed`, `86%` global) | **Pendiente de captura manual** *(salida textual real en `../reportes/pytest_cov.txt`)* |
| `locust_ejecucion.png` | Captura real de la Web UI de Locust (`http://localhost:8089`) contra backend local aislado (`50` usuarios, spawn rate `5/s`, `10` min) | **Bloqueada / Pendiente de entorno local PostgreSQL con datos sintéticos** |

> **Regla de integridad:** No se generaron imágenes sintéticas ni capturas simuladas. Cada archivo PNG debe ser tomado por el equipo directamente desde la terminal/navegador al reproducir los comandos documentados en [`../README.md`](../README.md) y [`../04_locust.md`](../04_locust.md).
