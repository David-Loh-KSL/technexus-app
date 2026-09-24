/**
 * One-time seed script: loads sql/companies-seed-data.json into the
 * `companies` table. Safe to re-run — it clears the table first.
 *
 * Usage:
 *   node src/seed.js
 *
 * Requires the same PG* env vars as db.js.
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function main() {
  const dataPath = path.join(__dirname, '..', 'sql', 'companies-seed-data.json');
  const companies = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE companies RESTART IDENTITY');

    for (const d of companies) {
      await client.query(
        `INSERT INTO companies
          (name, country, founded, employees, domain, product, tech, cert, trl, trl_conf, website, contact, impl, ai_generated)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,false)`,
        [
          d.name,
          d.country,
          String(d.founded ?? 'Not disclosed'),
          d.employees,
          d.domain,
          d.product,
          d.tech,
          d.cert || [],
          d.trl,
          d.trlConf,
          d.website,
          d.contact,
          d.impl,
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${companies.length} companies.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
