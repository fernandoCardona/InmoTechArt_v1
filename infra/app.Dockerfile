# app/Dockerfile — Build multi-stage para producción
# ============================================================
# Stage 1: DEPS — Instalar solo dependencias de producción
# Stage 2: BUILDER — Compilar Next.js
# Stage 3: RUNNER — Imagen mínima con solo lo necesario
#
# Requiere en next.config.js: output: 'standalone'
# ============================================================

# ============================================================
# STAGE 1: Instalar dependencias
# ============================================================
FROM node:20-alpine AS deps

# Instalar dependencias nativas necesarias para pg y bcryptjs
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json package-lock.json ./

# Instalar TODAS las dependencias (necesitamos devDeps para el build de Next.js)
RUN npm ci

# ============================================================
# STAGE 2: Builder — Compilar la aplicación
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar node_modules del stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar todo el código fuente
COPY . .

# Variables de entorno necesarias para el build estático de Next.js
# (No contienen secretos — son valores de placeholder para el build)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Construir la aplicación
# Las variables de entorno reales se inyectan en runtime, no en buildtime
RUN npm run build

# ============================================================
# STAGE 3: Runner — Imagen mínima de producción
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos estáticos públicos
COPY --from=builder /app/public ./public

# Copiar el output standalone (incluye server.js y dependencias mínimas)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Crear directorio para uploads con permisos correctos
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

# Usar usuario no-root
USER nextjs

EXPOSE 3000

# El servidor standalone de Next.js
CMD ["node", "server.js"]
