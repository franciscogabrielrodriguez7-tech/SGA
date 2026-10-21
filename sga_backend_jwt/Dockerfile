# =============================================================================
# SGA Backend — Dockerfile
# Base: python:3.11-slim  (Debian Bookworm slim, ~50 MB)
# Modo producción: uvicorn con workers gestionados por gunicorn
# =============================================================================

FROM python:3.11-slim AS base

# --- Metadatos OCI ---
LABEL org.opencontainers.image.title="SGA Backend"
LABEL org.opencontainers.image.description="FastAPI + Uvicorn — Sistema de Gestión de Alquileres"

# --- Variables del sistema ---
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# --- Dependencias del sistema operativo mínimas ---
# libpq-dev  → psycopg2-binary necesita las cabeceras de libpq en runtime
# curl       → usado por el healthcheck del compose si se desea
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# --- Directorio de trabajo dentro del contenedor ---
WORKDIR /app

# --- Instalación de dependencias Python (capa cacheada por Docker) ---
# Copiamos primero solo requirements.txt para aprovechar el caché de capas:
# Si el código fuente cambia pero las dependencias no, esta capa no se rebuild.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Copia del código fuente ---
COPY . .

# --- Script de arranque: migraciones + uvicorn ---
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# --- Puerto que expone la API ---
EXPOSE 8000

# --- Punto de entrada ---
ENTRYPOINT ["/entrypoint.sh"]
