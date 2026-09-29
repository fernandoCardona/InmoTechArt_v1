# 🚀 Guía de Despliegue en VPS (Hostinger + Dokploy)

Esta guía explica paso a paso cómo conectar este repositorio de GitHub con **Dokploy** (en un VPS de Hostinger) para desplegar toda la infraestructura de Neretxaus de manera profesional, con certificados SSL automáticos y cero caídas.

---

## 1. Configuración de Dominios (DNS) en Hostinger

Antes de ir a Dokploy, asegúrate de crear dos Registros A en la zona DNS de tu dominio que apunten a la IP pública de tu VPS:
- `neretxaus.tudominio.com` (Para la aplicación web)
- `n8n.neretxaus.tudominio.com` (Para el panel de n8n)

---

## 2. Creación del Entorno en Dokploy

Accede a tu panel de Dokploy (`http://ip-de-tu-vps:3000`) y crea un nuevo Proyecto llamado `Neretxaus`.

Dentro de este proyecto, desplegaremos dos componentes separados:
1. **El Motor de Servicios (Compose)**: Contendrá PostgreSQL, n8n, Ollama y Qdrant.
2. **La Aplicación Web (Application)**: Contendrá el frontend y backend de Next.js, lo que permitirá a Dokploy compilarlo y gestionarlo nativamente.

---

## 3. Despliegue de los Servicios (Base de Datos + IA + N8n)

1. En tu proyecto Dokploy, haz clic en **"Add Compose"**.
2. **Nombre**: `infra-services`
3. Selecciona la opción **GitHub**.
4. Repositorio: `fernandoCardona/Neretxaus_v1`
5. Rama: `main`
6. Compose Path: `infra/docker/docker-compose.prod.yml`
7. **Paso Crucial - Variables de Entorno**: Antes de hacer Deploy, ve a la pestaña "Environment" de este Compose y añade las variables necesarias (ej. contraseñas):
```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=una_contraseña_muy_segura_123
QDRANT_API_KEY=tu_clave_secreta_qdrant_456
N8N_DOMAIN=n8n.neretxaus.tudominio.com
```
8. Haz clic en **Deploy**. 
*Nota: Ollama y n8n pueden tardar unos minutos en descargar sus imágenes. No desesperes.*

---

## 4. Despliegue de la Web (Next.js App)

Dokploy es experto compilando Next.js si le damos un Dockerfile. Ya lo tienes preparado (`app.Dockerfile`).

1. En tu proyecto Dokploy, haz clic en **"Add Application"**.
2. **Nombre**: `webapp`
3. Tipo de origen: **GitHub**
4. Repositorio: `fernandoCardona/Neretxaus_v1`
5. Rama: `main`
6. Ve a la pestaña **Build**:
   - En *Build Type* selecciona **Dockerfile**.
   - Dockerfile path: `infra/app.Dockerfile`
   - Context path: `/`
7. Ve a la pestaña **Environment**:
```env
# Conexiones internas (gracias a Dokploy Network)
POSTGRES_USER=admin
POSTGRES_PASSWORD=una_contraseña_muy_segura_123
DATABASE_URL=postgresql://admin:una_contraseña_muy_segura_123@neretxaus_postgres:5432/realestate_master
QDRANT_URL=http://neretxaus_qdrant:6333
QDRANT_API_KEY=tu_clave_secreta_qdrant_456
OLLAMA_BASE_URL=http://neretxaus_ollama:11434
N8N_INTERNAL_URL=http://neretxaus_n8n:5678

# Seguridad Web
AUTH_SECRET=genera_un_secreto_aleatorio_largo_aqui
NEXT_PUBLIC_APP_URL=https://neretxaus.tudominio.com
NODE_ENV=production
```
8. Ve a la pestaña **Domains**:
   - Añade tu dominio (ej. `neretxaus.tudominio.com`).
   - Activa los certificados HTTPS (Let's Encrypt).
9. Haz clic en **Deploy**. 

---

## 5. ¡A Disfrutar!

Una vez los logs muestren `Build Success`, dirígete a `https://neretxaus.tudominio.com`. El sistema detectará que no hay base de datos iniciada e Neretxaus estará funcionando a velocidad luz impulsado por la red ultra rápida del VPS.

*Felicidades por alcanzar Producción.* 🎉
