# =============================================================================
# SGA Frontend — Dockerfile (Multi-Stage Build)
# =============================================================================
#
# Etapa 1 (build): Node 20 Alpine — compila TypeScript + React → archivos
#                  estáticos en /app/dist. La variable VITE_API_URL se inyecta
#                  como build-arg para quedar grabada en el bundle generado.
#
# Etapa 2 (serve): Nginx Alpine — sirve /dist, maneja rutas de SPA y actúa
#                  como reverse proxy hacia /api/ (backend).
#                  Imagen final: ~25 MB sin rastros de Node ni código fuente.
# =============================================================================

# ─── Etapa 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

LABEL org.opencontainers.image.title="SGA Frontend Builder"

WORKDIR /app

# Copiar manifests de dependencias primero para aprovechar caché de Docker.
# Si package.json y package-lock.json no cambian, esta capa no se rebuilda.
COPY package.json package-lock.json ./

# Instalación limpia y reproducible de dependencias
RUN npm ci --prefer-offline

# Copiar el resto del código fuente
COPY . .

# Build-arg para la URL de la API — se inyecta en tiempo de build de Docker.
# En docker-compose se pasa como: args: VITE_API_URL=/api/sga
ARG VITE_API_URL=/api/sga
ENV VITE_API_URL=${VITE_API_URL}

# Compilar TypeScript y generar los estáticos optimizados en /app/dist
RUN npm run build

# ─── Etapa 2: Servidor Nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

LABEL org.opencontainers.image.title="SGA Frontend"
LABEL org.opencontainers.image.description="React + Vite — Sistema de Gestión de Alquileres"

# Copiar solo los archivos estáticos generados en la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Reemplazar la configuración por defecto de Nginx con la nuestra
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Asegurarse de que nginx pueda escribir en sus directorios de caché/run
# (sin necesidad de correr como root si se ajusta en el futuro)
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
