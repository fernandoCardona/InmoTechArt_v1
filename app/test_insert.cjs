const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { Pool } = require('pg');
const { drizzle: drizzleNode } = require('drizzle-orm/node-postgres');
const schema = require('./db/schema.js');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzleNode(pool, { schema });

async function test() {
  try {
    const provider = await db.select().from(schema.providers).limit(1);
    if (!provider.length) {
       console.log("No providers found");
       return;
    }
    const providerId = provider[0].id;
    console.log("Provider ID:", providerId);

    const [batch] = await db.insert(schema.importBatches).values({
        id: '123e4567-e89b-12d3-a456-426614174000',
        providerId,
        fileName: 'test.xlsx',
        status: 'PROCESSING'
      }).returning();
    console.log("Batch created:", batch.id);

  } catch (err) {
    console.error("Error testing insert:", err);
  } finally {
    pool.end();
  }
}
test();
