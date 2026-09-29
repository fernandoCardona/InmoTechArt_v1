# 📋 NERETXAUS v1 — PROJECT TRACKER & JOURNAL

> **Documento vivo de seguimiento del proyecto.**
> Aquí iremos marcando el progreso, anotando decisiones de arquitectura, hallazgos (discoveries) y resolviendo issues.
> **Instrucción para el desarrollador/IA:** Antes de iniciar una nueva tarea o finalizar el día, revisa y actualiza este documento.

---

## 🎯 ESTADO GENERAL DEL PROYECTO

- **Fase Actual:** `FASE 4: DESPLIEGUE PRODUCCIÓN`
- **Estado de Auditoría:** Completada ✅ (Se limpiaron inconsistencias y versiones antiguas).
- **Siguiente Acción Inmediata:** Levantar infraestructura Docker local, aplicar nuevo modelo de schemas PostgreSQL y arrancar Next.js.

---

## 🏗️ ARQUITECTURA DE BASES DE DATOS (DECISIÓN RECIENTE)

**Issue planteado:** Separación de bases de datos para Web (Interna), Activos (Items) y n8n (Automatización), pero manteniendo la capacidad de hacer consultas cruzadas.
**Resolución (PostgreSQL Way):** En lugar de bases de datos físicas separadas (lo que impediría JOINs directos y requeriría `postgres_fdw`), usaremos **una única base de datos física** con **SCHEMAS lógicos separados**. Esto garantiza aislamiento, seguridad granular y conectividad total.

- Base de Datos Física: `realestate_master`
- **Schema 1:** `app_core` (Usuarios, Sesiones, Auditoría, Configuración).
- **Schema 2:** `assets` (Proveedores, Lotes de Importación, Inmuebles).
- **Schema 3:** `n8n_flow` (Exclusivo para uso interno de n8n).

*N8n y el Backend tendrán acceso a los schemas según sus roles, pero la separación lógica evitará que se mezclen tablas.*

---

## ✅ ROADMAP & EJECUCIÓN POR FASES

### FASE 0: SETUP Y AUDITORÍA
- [x] Auditoría exhaustiva de la documentación.
- [x] Limpieza de archivos obsoletos.
- [x] Definición de Roles y Permisos (`ROLES-Y-PERMISOS.md`).
- [x] Definición de Guía de Estilos y Diseño UI (`GUIA-ESTILOS-UI.md`).
- [x] Definición del Tracker de Proyecto (`PROJECT_TRACKER.md`).
- [x] Configuración de Reglas de Agente (`.agents/rules/PROYECTO.md`).

### FASE 1: INFRAESTRUCTURA LOCAL Y DOCKER
- [x] Revisión de `docker-compose.local.yml` (puertos expuestos para Desktop, conectividad n8n <-> backend).
- [x] Aplicar refactorización de Schemas en `01-init-schema.sql`.
- [x] Levantar contenedores localmente (`docker-compose up -d`).
- [x] Verificar healthchecks de PostgreSQL, n8n, Ollama, Qdrant.
- [x] Ejecutar Seed inicial (SuperAdmin).

### FASE 2: INICIALIZACIÓN NEXT.JS
- [x] Crear esqueleto Next.js 15 (`--js`).
- [x] Instalar dependencias base (Drizzle, Tailwind v3/4, FingerprintJS, etc.).
- [x] Configurar `.env.local` y `drizzle.config.js`.
- [x] Configurar UI base (Tailwind Layout & Fonts en globals.css).

### FASE 3: DESARROLLO CORE (IA CO-PILOT)
- [x] Middleware y Autenticación (Device Fingerprinting Backend).
- [x] Esquema Drizzle ORM sincronizado con DB.
- [x] Pantalla de Login Premium + Extracción de Huella Digital (Client/Action).
- [x] Motor de Importación (Parser + Reconciler) y SSE.
- [x] DataGrid Principal (React Table).
- [x] Asistente RAG Jurídico (Qdrant + Ollama).
- [x] Panel de Administración.

### FASE 4: DESPLIEGUE PRODUCCIÓN
- [x] Pruebas E2E (Next Build, Linting).
- [x] Push a GitHub y verificación de CI/CD.
- [x] Despliegue en Dokploy VPS (Manual Generado).

### FASE 5: MULTIDIOMA (i18n) & UI PREMIUM
- [ ] Ampliar base de datos (Campo `locale` en `users`).
- [ ] Configurar librería `next-intl` (Manejo automático de Idioma Browser/Cookie/BD).
- [ ] Crear diccionarios de idiomas (ES y CA) por páginas en `/locales`.
- [ ] Refactorizar Sidebar (Colapsable, React-Icons, Framer Motion).
- [ ] Implementar conmutador de idioma en el perfil.

---

## 🐛 ISSUES & HALLAZGOS (LOG)

| Fecha | Issue / Hallazgo | Estado | Solución Aplicada |
| :--- | :--- | :--- | :--- |
| 28/09/2026 | Separación de bases de datos solicitada por usuario. | Resuelto | Se implementará separación por Schemas lógicos en PG para mantener interoperabilidad. Implementado en `01-init-schema.sql`. |
| 28/09/2026 | Puertos en Docker Desktop y conexión n8n. | Resuelto | Puertos desplazados (5444, 6334, 11435, 5679). Añadido `host.docker.internal:host-gateway` a n8n en el `docker-compose.local.yml` para conectarse a Next.js (`localhost:3000`). |
| 28/09/2026 | Diseño visual, UX y UI de la aplicación. | Resuelto | Se crea una Guía de Estilos (`GUIA-ESTILOS-UI.md`) basando el diseño funcional en ChatGPT: limpio, con Sidebar colapsable, modo oscuro por defecto y Glassmorphism para componentes superpuestos. |

