const { loadEnvConfig } = require('@next/env');
const { Pool } = require('pg');

// Cargar variables de entorno
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ NO SE HA ENCONTRADO DATABASE_URL en .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function checkAndWipe() {
  console.log('🔍 Conectando a la base de datos para auditoría y limpieza...');
  try {
    const client = await pool.connect();
    
    // 1. Mostrar estado actual
    const resCount = await client.query('SELECT count(*) FROM assets.properties');
    console.log(`📊 Ítems actuales en 'properties': ${resCount.rows[0].count}`);

    // 2. Ejecutar borrado masivo
    console.log('🧹 Vaciando la tabla properties...');
    await client.query('TRUNCATE TABLE assets.properties CASCADE');
    
    // 3. Confirmar que está a cero
    const finalCount = await client.query('SELECT count(*) FROM assets.properties');
    console.log(`✅ Base de datos purgada. Ítems restantes: ${finalCount.rows[0].count} (Cero residuos).`);
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Error al interactuar con la DB:', err.message);
  }
}

checkAndWipe();
