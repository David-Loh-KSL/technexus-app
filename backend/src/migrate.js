/**
 * One-time schema migration: runs sql/schema.sql against the configured
 * Postgres database. Safe to re-run — schema.sql uses CREATE TABLE IF NOT
 * EXISTS / CREATE INDEX IF NOT EXISTS throughout.
 *
 * Usage (from inside the running ECS task, via `aws ecs execute-command`):
 *   node src/migrate.js
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function main() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Schema migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
