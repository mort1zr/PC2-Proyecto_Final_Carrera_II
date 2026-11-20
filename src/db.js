const fs = require('fs');
const path = require('path');

const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

/** Crea el pool: PostgreSQL real (DATABASE_URL) o un pool inyectado (pruebas). */
function createPool() {
  const { Pool } = require('pg');
  if (!process.env.DATABASE_URL) {
    throw new Error('Falta la variable de entorno DATABASE_URL');
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 5,
  });
}

/** Aplica el esquema (idempotente). */
async function initSchema(pool) {
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }
}

module.exports = { createPool, initSchema };
