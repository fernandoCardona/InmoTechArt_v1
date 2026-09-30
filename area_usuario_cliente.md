# Plan de Desarrollo: CRM y Matching Inteligente (Arquitectura n8n + AI)

## 1. Visión General y Veredicto Arquitectónico
La decisión de delegar tanto la importación como el Matching a **n8n** es la más acertada y profesional. 
Al auditar tu propuesta sobre el "Matching en Loop por cliente recorriendo todos los activos", la lógica de negocio es perfecta para no dejar a ningún cliente atrás. **Sin embargo, a nivel de ingeniería de IA hay un cuello de botella crítico que debemos solucionar:** 
Cruzar por ejemplo 1.000 clientes contra 50.000 activos línea por línea usando Inteligencia Artificial colapsaría el servidor (50 millones de cálculos de IA). 
👉 **La Solución Premium (Híbrida):** Antes de pasarle los datos a la IA, n8n usará PostgreSQL para "Pre-filtrar" instantáneamente los activos (por provincia, rango de precio y si el activo es nuevo/actualizado). Así, la IA solo analizará un puñado de activos altamente probables por cada cliente, tardando segundos en lugar de días.

---

## 2. WORKFLOW 1: Importador y Conciliador IA (n8n)
Este flujo reemplaza la lógica pesada del backend actual. Se activa cuando el usuario sube un archivo desde la pantalla de importación.

### Paso a Paso del Flujo n8n:
1. **Webhook Trigger:** Next.js recibe el Excel en la pantalla de la UI, lo guarda en la carpeta local `/data/imports` (compartida vía Docker con n8n) y hace un POST al webhook de n8n indicando: `ruta_archivo`, `provider_id`.
2. **Read Node (Lector):** n8n abre el Excel/CSV y extrae las cabeceras (nombres de las columnas).
3. **AI Agent Node (Ollama):** n8n le pasa las cabeceras a Ollama con un prompt estructurado: *"Mapea estas cabeceras desconocidas del proveedor X a nuestro esquema de base de datos (provincia, referencia, precio, etc.). Devuelve un JSON"*.
4. **Data Transformer:** Con el mapa JSON devuelto por la IA, n8n procesa todas las filas del Excel, estandarizando los nombres de las columnas.
5. **PostgreSQL Node (Upsert):** n8n inserta los datos masivamente en la tabla `properties`. Si el activo ya existe (coincide la Referencia Catastral o Referencia de Proveedor), actualiza sus datos y marca el campo `updatedAt` con la fecha actual.
6. **Trigger del Matching:** Al finalizar el guardado, n8n dispara internamente el **Workflow 2**.

---

## 3. WORKFLOW 2: Motor de Matching Híbrido (n8n)
Este es el flujo clave. Se ejecuta automáticamente cada vez que termina una importación masiva (Workflow 1) o de forma manual (ej. Botón "Forzar Matching").

### Paso a Paso del Flujo n8n:
1. **Trigger:** Recibe la señal de inicio.
2. **PostgreSQL Node (Get Clients):** Extrae de la base de datos la lista de todos los `clients` activos y sus `client_search_profiles` (Expectativas).
3. **Loop Node (Iterador por Cliente):** n8n inicia un bucle que procesará a un cliente a la vez.
   - **Sub-Paso 3.1 (Pre-Filtro SQL Rápido):** Por cada cliente, n8n hace una consulta a PostgreSQL pidiendo solo los activos que:
     - Tengan un precio menor o igual al `presupuesto_maximo`.
     - Coincidan con la `provincia` del cliente (si está definida).
     - *Optativo para rendimiento:* Solo busque activos cuyo `updatedAt` o `createdAt` sea de hoy (o desde la última vez que corrió el flujo).
   - **Sub-Paso 3.2 (Filtro IA Profundo - Ollama):** Si el paso anterior devuelve activos (ej. 20 activos potenciales), n8n cruza la `descripcionIA` del cliente (ej. "Busco locales para transformar en vivienda") con los `rawMetadata` y tipología de esos 20 activos.
   - **Sub-Paso 3.3 (Cálculo de Match Score):** La IA devuelve una puntuación (0 a 100) y un razonamiento (`match_reason`).
   - **Sub-Paso 3.4 (Guardado):** Si el score es mayor a X (ej. 75%), se guarda el registro en la tabla `asset_matches` con el estado `SUGGESTED` y `isNew = true`.
4. El bucle se repite hasta terminar con todos los clientes.

---

## 4. Esquema de Base de Datos (Drizzle)
La estructura que soportará este motor en PostgreSQL (`db/schema.js`):

```javascript
// 1. Clientes del Agente
export const clients = appCore.table('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentId: uuid('agent_id').references(() => users.id).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Expectativas de Búsqueda
export const clientSearchProfiles = appCore.table('client_search_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  provincia: varchar('provincia', { length: 100 }), 
  tipoActivo: varchar('tipo_activo', { length: 100 }),
  presupuestoMaximo: numeric('presupuesto_maximo', { precision: 12, scale: 2 }),
  descripcionIA: text('descripcion_ia'),
});

// 3. Resultados del Matching
export const assetMatches = appCore.table('asset_matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  propertyId: uuid('property_id').references(() => properties.id).notNull(),
  matchScore: integer('match_score'), 
  matchReason: text('match_reason'),
  status: varchar('status', { length: 50 }).default('SUGGESTED'),
  isNew: boolean('is_new').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});
```

## 5. Diseño del Interfaz (Frontend UI en Next.js)
El CRM se visualizará en la ruta `/dashboard/clients`:
- **Vista Principal**: DataGrid con todos los clientes del usuario (Nombre, Email, Nº de Matches Pendientes).
- **Ficha del Cliente**: 
  - **Pestaña "Perfil de Búsqueda"**: Formulario para definir las expectativas duras (precio, provincia) y blandas (descripción IA).
  - **Pestaña "Oportunidades (Matches)"**: Interfaz tipo muro con los inmuebles sugeridos por n8n.
  - **Acción Comercial**: Cada inmueble sugerido tendrá un botón **"Enviar Propuesta"**. Al pulsarlo, Next.js llama a un 3º Flujo en n8n que genera el PDF/HTML y lo envía por SMTP/Resend al cliente.

## 6. Siguientes Pasos (Ejecución)
- **FASE 1 (Inmediata)**: Implementar las tablas en Drizzle ORM, hacer el `push` a PostgreSQL y montar el CRUD visual (Ficha de Cliente) en Next.js.
- [x] **FASE 2**: Construir el Flujo 1 (Importador IA) en n8n y enlazarlo con el botón de subida actual.
- [x] **FASE 3**: Construir el Flujo 2 (Motor de Matching Híbrido) en n8n.
- [x] **FASE 4**: Flujo de automatización de correos electrónicos.

## 5. Próximos Pasos (Validación y UI Avanzada)
- [x] Importar los 3 archivos JSON maestros (`infra/n8n/workflows/`) en el panel local de n8n.
- [x] Construir el interior de los componentes de Match en Next.js (Tarjetas cristalinas premium).
- [ ] Realizar prueba End-to-End (Subir archivo -> Procesado n8n -> Reflejo en DB -> Email enviado).
