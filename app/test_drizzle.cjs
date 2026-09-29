const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('./db/schema.js');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool, { schema });

async function test() {
  try {
    console.log("Running Drizzle query...");
    const data = await db.select().from(schema.properties).limit(1);
    console.log("Success! Data:", data);
  } catch (err) {
    console.error("Drizzle Query Error:", err);
  }
  pool.end();
}
test();
