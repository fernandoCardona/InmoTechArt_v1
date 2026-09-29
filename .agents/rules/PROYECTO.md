---
description: "Reglas fundamentales del proyecto NERETXAUS v1. Deben leerse antes de cualquier implementación."
version: 1.0.0
---

# REGLAS GLOBALES DEL PROYECTO NERETXAUS v1

## 1. RESTRICCIONES TECNOLÓGICAS (ABSOLUTAS)
- **CERO TYPESCRIPT:** El proyecto es **100% JavaScript puro (`.js`, `.jsx`)**. Está TERMINANTEMENTE PROHIBIDO crear archivos `.ts` o `.tsx`.
- **Framework:** Next.js 15 (App Router + Server Actions).
- **Estilos:** Tailwind CSS v3 (NO usar v4, Next.js instala v3 por defecto).
- **ORM:** Drizzle ORM (JS).

## 2. ARQUITECTURA DE BASES DE DATOS (SCHEMAS)
- La base de datos es única (`realestate_master`), pero **SEPARADA LÓGICAMENTE por Schemas**.
- **`app_core`**: Tablas de sistema (Usuarios, Dispositivos, Sesiones, Logs).
- **`assets`**: Tablas de negocio (Proveedores, Lotes, Inmuebles).
- **`n8n_flow`**: Tablas reservadas para el funcionamiento de n8n.
- Todas las consultas SQL/Drizzle deben especificar el schema o tener el `search_path` bien configurado.

## 3. SEGURIDAD Y PERMISOS
- **Control de Acceso:** Basado en Roles (SUPERADMIN, ADMIN, AGENT, READONLY) según la matriz definida en `ROLES-Y-PERMISOS.md`.
- **Device Fingerprinting:** Ningún usuario puede loguearse si su dispositivo no está `APPROVED` en BD (con la librería `@fingerprintjs/fingerprintjs`).
- **Sesión Única:** Al loguearse un usuario, se revocan TODAS sus sesiones anteriores atómicamente.

## 4. DISEÑO Y UX
- **Efecto WOW:** Diseño Súper Premium (Glassmorphism, dark mode por defecto, micro-animaciones en cada interacción).
- **Responsividad:** 100% funcional y atractivo desde móvil (320px) hasta monitores Wide (1440px+).

## 5. METODOLOGÍA
- **Reflexiona antes de programar:** Verifica siempre cómo tu cambio afecta al resto del sistema.
- **Sin Parches:** Si algo no funciona correctamente de base, se reescribe de raíz. No se apila código roto.
- **Testing:** Nada se da por terminado sin test (Jest para unitario, Playwright para E2E).

> **Aviso para la IA:** Si se te pide implementar una función, revisa primero `PROJECT_TRACKER.md` para ver el estado actual, y aplica estas reglas a rajatabla.
