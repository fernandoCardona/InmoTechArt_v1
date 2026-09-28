import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema.js';

// Configuramos el pool de conexiones de Node-Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Configuraciones para producción
  max: 20, // Número máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Inicializamos Drizzle ORM
export const db = drizzle(pool, { schema });
