#!/bin/bash

# ==============================================================================
# InmoTechArt v1 - Arranque Rápido del Proyecto (Local)
# ==============================================================================

echo "============================================================"
echo "🚀 INICIANDO INMOTECHART V1 (LOCAL) 🚀"
echo "============================================================"

# 1. Levantar Infraestructura Docker
echo "📦 1. Levantando contenedores Docker (Postgres, n8n, Ollama, Qdrant)..."
cd infra/docker
docker-compose -f docker-compose.local.yml up -d
cd ../..

echo ""
echo "✅ Docker Infraestructura OK."
echo ""

# 2. Iniciar Servidor Web de Next.js
echo "🌐 2. Iniciando servidor Next.js..."
cd app

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "⚙️ Instalando dependencias NPM..."
    npm install
fi

echo "🚀 El sistema está listo. Abriendo en http://localhost:3000"
npm run dev
