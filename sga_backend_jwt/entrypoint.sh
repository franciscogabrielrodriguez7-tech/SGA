#!/bin/sh
# =============================================================================
# entrypoint.sh — Script de arranque del backend SGA
# Ejecuta las migraciones de Alembic y luego inicia Uvicorn.
# Se corre como ENTRYPOINT del contenedor Docker.
# =============================================================================

set -e   # Abortar si cualquier comando falla

# --- Espera activa hasta que PostgreSQL esté aceptando conexiones ---
# Evita que el backend intente conectarse antes de que la DB esté lista.
# docker-compose ya gestiona esto con depends_on + healthcheck, pero esta
# doble verificación es una red de seguridad para entornos sin compose.
echo "  Esperando a que PostgreSQL esté disponible..."
until python -c "
import os, sys, time
import psycopg2

db_url = os.environ.get('DATABASE_URL', '')
# Extraer host y puerto de la URL
# Formato: postgresql+psycopg2://user:pass@host:port/dbname
try:
    import re
    match = re.search(r'@([^:/]+):?(\d+)?/', db_url)
    host = match.group(1) if match else 'postgres'
    port = int(match.group(2)) if match and match.group(2) else 5432
    dbname = db_url.split('/')[-1]
    user = re.search(r'//([^:]+):', db_url).group(1)
    password = re.search(r':([^@]+)@', db_url).group(1)
    conn = psycopg2.connect(host=host, port=port, dbname=dbname, user=user, password=password, connect_timeout=3)
    conn.close()
    sys.exit(0)
except Exception as e:
    sys.exit(1)
" 2>/dev/null; do
  echo "   PostgreSQL no disponible aún — reintentando en 2 segundos..."
  sleep 2
done

echo "✅  PostgreSQL disponible."

# --- Ejecutar migraciones de Alembic ---
echo "🔄  Ejecutando migraciones (alembic upgrade head)..."
alembic upgrade head
echo "✅  Migraciones aplicadas."

# --- Iniciar Uvicorn ---
echo "🚀  Iniciando servidor FastAPI con Uvicorn..."
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2 \
    --log-level info
