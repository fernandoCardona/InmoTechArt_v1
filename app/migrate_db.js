const fs = require('fs');
const path = require('path');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  try {
    const sqlFile = path.join(__dirname, 'drizzle/0000_slimy_bullseye.sql');
    const sqlStr = fs.readFileSync(sqlFile, 'utf8');
    await pool.query(sqlStr);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    pool.end();
  }
}

migrate();
