# INMOTECHART v1 — Plataforma Privada de Gestión de Activos Inmobiliarios

> Plataforma corporativa privada para la gestión, homogeneización y análisis de activos inmobiliarios bancarios (REO / WIP / Suelo) con asistente jurídico-urbanístico IA integrado.

## ⚠️ Repositorio Privado

Este repositorio contiene lógica propietaria de negocio, medidas anti-scraping y configuración de infraestructura. **No compártalo ni lo hagas público.**

---

## Estructura del Proyecto

```
InmoTechArt_v1/
│
├── app/                    ← Aplicación Next.js 15 (código fuente)
│   ├── Dockerfile          ← Imagen Docker para producción
│   ├── middleware.js       ← Autenticación, fingerprinting, rate limiting
│   ├── app/               ← Next.js App Router (pages y layouts)
│   ├── lib/               ← Lógica de negocio (DB, auth, import, RAG)
│   ├── actions/           ← Server Actions
│   └── components/        ← Componentes React
│
├── infra/
│   ├── db/
│   │   └── 01-init-schema.sql     ← DDL completo de PostgreSQL
│   ├── docker/
│   │   ├── docker-compose.local.yml  ← Desarrollo local
│   │   ├── docker-compose.prod.yml   ← Producción (VPS + Dokploy)
│   │   └── .env.example             ← Plantilla de variables de entorno
│   └── github/
│       └── deploy.yml              ← (Copiar a .github/workflows/)
│
└── .github/
    └── workflows/
        └── deploy.yml              ← CI/CD: Jest → Playwright → Dokploy
```

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend/Backend | Next.js 15 (App Router + Server Actions + **JavaScript puro**) |
| Estilos | Tailwind CSS (glassmorphism, modo oscuro, 100% responsive) |
| BD Relacional | PostgreSQL 16 + Drizzle ORM |
| BD Vectorial | Qdrant v1.11+ |
| LLM Local | Ollama — `qwen2.5:7b-instruct` |
| Automatización | n8n |
| Testing | Jest + Playwright |
| Infraestructura | Docker Compose + Dokploy + Traefik |

---

## Arranque Rápido (Desarrollo Local)

```bash
# 1. Configura las variables de entorno
cd infra/docker
cp .env.example .env
# Edita .env con tus contraseñas reales

# 2. Levanta la infraestructura
docker-compose -f docker-compose.local.yml up -d

# 3. Descarga los modelos de IA (solo la primera vez)
docker exec -it inmotechart_ollama ollama pull qwen2.5:7b-instruct
docker exec -it inmotechart_ollama ollama pull nomic-embed-text

# 4. Instala dependencias e inicia el servidor
cd ../../app
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Puertos en Desarrollo Local

| Servicio | Puerto |
|----------|--------|
| Next.js App | 3000 |
| PostgreSQL | **5444** |
| Qdrant | **6334** |
| Ollama | **11435** |
| n8n | **5679** |

> Los puertos están desplazados intencionalmente para evitar colisiones con otros proyectos.

---

## Tests

```bash
cd app
npm test                  # Tests unitarios (Jest)
npx playwright test       # Tests E2E (Playwright)
```

---

## Despliegue en Producción

Flujo GitOps automático:
1. `git push origin main`
2. GitHub Actions ejecuta los tests
3. Si pasan, notifica a Dokploy vía webhook
4. Dokploy redesplega en VPS sin downtime
