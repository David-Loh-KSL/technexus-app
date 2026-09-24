const { Pool } = require('pg');

// Connection config is provided entirely via environment variables so the
// same image works in local dev (.env / docker-compose) and in ECS
// (injected from Secrets Manager / task definition environment).
//
// Required env vars:
//   PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
// or a single PG_CONNECTION_STRING (postgres://user:pass@host:port/db)
const pool = process.env.PG_CONNECTION_STRING
  ? new Pool({
      connectionString: process.env.PG_CONNECTION_STRING,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 10,
    });

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error', err);
});

module.exports = { pool };
