# 📊 Arquitectura de Base de Datos: Esquema Unificado de Activos (Properties)

Este documento define la estructura de datos consolidada que hemos implementado en la plataforma **InmoTechArt**. Este esquema unifica los datos provenientes de diferentes tipos de orígenes (ej. Servicers como Welcome/Wantoku5 y carteras de Suelos/WIP), asegurando que toda la información crítica esté estandarizada y normalizada en una única tabla: `properties`.

## Tabla: `assets.properties`

Esta es la estructura exacta que está actualmente desplegada en la base de datos de producción (vía Drizzle ORM) y que rige los listados y las importaciones.

### 1. Identificadores Core
Campos utilizados para identificar de forma unívoca y trazar el activo frente a terceros.
- **`id`** *(UUID)*: Identificador interno único autogenerado.
- **`providerId`** *(UUID - Relacional)*: Vinculación con la tabla `providers` (ej. Proveedor del CSV/Excel).
- **`referenciaProveedor`** *(VARCHAR 100)*: Código identificador original que nos entrega el cliente/servicer (ej. `WANTOKU5_678729`).
- **`referenciaCatastral`** *(VARCHAR 50)*: Referencia catastral oficial de la parcela o inmueble.
- **`fincasRegistrales`** *(VARCHAR 100)*: Números de finca registral asociados.

### 2. Ubicación y Geografía
- **`ccaa`** *(VARCHAR 100)*: Comunidad Autónoma.
- **`provincia`** *(VARCHAR 100)*: Provincia (Obligatorio).
- **`municipio`** *(VARCHAR 150)*: Municipio o localidad (Obligatorio).
- **`direccion`** *(VARCHAR 255)*: Dirección postal completa del activo.
- **`codigoPostal`** *(VARCHAR 10)*: Código postal (normalizado a 5 dígitos en la importación).

### 3. Clasificación y Tipología
Estos campos unifican la disparidad de nomenclaturas (ej. 'VI' vs 'Vivienda', 'Suelo' vs 'WIP').
- **`tipoActivo`** *(VARCHAR 100)*: Categoría principal (Vivienda, Suelo, Local, Garaje, etc.).
- **`subtipoTipologia`** *(VARCHAR 100)*: Nivel de detalle secundario (Unifamiliar, Plurifamiliar, Oficina).
- **`usoUrbanistico`** *(VARCHAR 100)*: Uso asignado por planeamiento (Residencial, Terciario, Industrial).
- **`clasificacionSuelo`** *(VARCHAR 100)*: Calificación del suelo (Urbano, Urbanizable, Rústico).

### 4. Economía y Comercialización
- **`precioVenta`** *(NUMERIC 12,2)*: Precio PVP de venta (Obligatorio, por defecto '0').
- **`porcentajeParticipacion`** *(VARCHAR 50)*: Porcentaje de propiedad o proindiviso que se posee.
- **`modalidadComercial`** *(VARCHAR 100)*: Canal o estrategia de venta (Ej. 'Venta Okupado', 'Libre', 'Subasta').

### 5. Estado Legal y Posesorio
Especialmente diseñado para la carga de activos REO / Judicializados.
- **`faseJudicialOcupacion`** *(VARCHAR 150)*: Fase procesal exacta para recuperar la posesión (Ej. 'LANZAMIENTO', 'SENTENCIA ESTIMATORIA', 'LIBRE').

### 6. Datos Técnicos y Urbanísticos
Requerido para el análisis de bolsas de suelo y promociones WIP.
- **`superficieSueloM2`** *(NUMERIC 12,2)*: Metros cuadrados de parcela.
- **`edificabilidadSobreRasanteM2`** *(NUMERIC 12,2)*: Techo edificable sobre rasante.
- **`edificabilidadBajoRasanteM2`** *(NUMERIC 12,2)*: Techo edificable bajo rasante.
- **`numViviendas`** *(INT)*: Número de unidades (viviendas) proyectadas o existentes.

### 7. Metadata y Auditoría del Sistema
- **`isActive`** *(BOOLEAN)*: Flag lógico para habilitar/deshabilitar el activo sin borrarlo.
- **`lastSeenInBatchId`** *(UUID - Relacional)*: Vinculación con la tabla `import_batches` para auditar cuándo fue la última vez que el activo apareció en un excel subido.
- **`rawMetadata`** *(JSONB)*: Objeto JSON flexible para volcar columnas "raras" o imprevistas de los Excels sin tener que alterar la arquitectura de la base de datos.
- **`createdAt`** / **`updatedAt`** *(TIMESTAMP)*: Fechas automáticas de creación y última actualización.

---

## 🖥️ Mapeo en Frontend (Vista General)

En el Dashboard (`/dashboard/DataGridClient.js`), por razones de limpieza UI/UX Premium, no se muestran *todas* las 27 columnas a la vez, sino que se ha configurado la siguiente vista consolidada y limpia para el usuario:

1. **Catastro** -> `referenciaCatastral` (Font Mono)
2. **Tipo** -> `tipoActivo`
3. **Dirección** -> `direccion` (Truncado con tooltip)
4. **Municipio** -> `municipio`
5. **Precio** -> `precioVenta` (Formato Moneda Euro €)
6. **Estado** -> `faseJudicialOcupacion` (Con badges Premium verde/rojo según si el texto incluye 'LIBRE' o no).

*Nota: Cualquier otro campo puede visualizarse abriendo el cajón lateral (PropertyDrawer) o añadiendo nuevas columnas en el array de TanStack Table si el usuario administrador lo requiere.*
