const express = require('express');
const { pool } = require('../db');
const { enrichCompany } = require('../services/azureOpenAI');

const router = express.Router();

function rowToApi(row) {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    founded: row.founded,
    employees: row.employees,
    domain: row.domain,
    product: row.product,
    tech: row.tech,
    cert: row.cert || [],
    trl: row.trl,
    trlConf: row.trl_conf,
    website: row.website,
    contact: row.contact,
    impl: row.impl,
    aiGenerated: row.ai_generated,
    createdAt: row.created_at,
  };
}

// GET /api/companies
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM companies ORDER BY id ASC');
    res.json(rows.map(rowToApi));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// GET /api/companies/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rowToApi(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// POST /api/companies  (manual add / edit form)
router.post('/', async (req, res) => {
  const d = req.body || {};
  if (!d.name || !d.domain) {
    return res.status(400).json({ error: 'name and domain are required' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO companies
        (name, country, founded, employees, domain, product, tech, cert, trl, trl_conf, website, contact, impl, ai_generated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        d.name,
        d.country || 'Not disclosed',
        String(d.founded ?? 'Not disclosed'),
        d.employees || 'Not disclosed',
        d.domain,
        d.product || '',
        d.tech || '',
        Array.isArray(d.cert) ? d.cert : [],
        Number.isFinite(Number(d.trl)) ? Number(d.trl) : 5,
        d.trlConf || '',
        d.website || 'Not publicly disclosed',
        d.contact || 'Not publicly listed',
        d.impl || '',
        Boolean(d.aiGenerated),
      ]
    );
    res.status(201).json(rowToApi(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// PUT /api/companies/:id
router.put('/:id', async (req, res) => {
  const d = req.body || {};
  try {
    const { rows } = await pool.query(
      `UPDATE companies SET
        name=$1, country=$2, founded=$3, employees=$4, domain=$5, product=$6, tech=$7,
        cert=$8, trl=$9, trl_conf=$10, website=$11, contact=$12, impl=$13, updated_at=now()
       WHERE id=$14 RETURNING *`,
      [
        d.name, d.country, String(d.founded ?? ''), d.employees, d.domain, d.product, d.tech,
        Array.isArray(d.cert) ? d.cert : [], Number(d.trl) || 5, d.trlConf, d.website, d.contact, d.impl,
        req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rowToApi(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// DELETE /api/companies/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM companies WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// POST /api/companies/enrich  { name, doc? }
// Researches the company via Azure OpenAI (server-side, real API key)
// and inserts the resulting record directly, matching the original artifact's
// "Retrieve & preview" -> auto-add UX.
router.post('/enrich', async (req, res) => {
  const { name, doc } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Company name is required' });
  }
  try {
    const enriched = await enrichCompany(name.trim(), doc);
    const { rows } = await pool.query(
      `INSERT INTO companies
        (name, country, founded, employees, domain, product, tech, cert, trl, trl_conf, website, contact, impl, ai_generated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        enriched.name, enriched.country, enriched.founded, enriched.employees, enriched.domain,
        enriched.product, enriched.tech, enriched.cert, enriched.trl, enriched.trlConf,
        enriched.website, enriched.contact, enriched.impl, true,
      ]
    );
    res.status(201).json(rowToApi(rows[0]));
  } catch (err) {
    console.error('enrich failed:', err.message);
    res.status(502).json({ error: err.message || 'Enrichment failed' });
  }
});

module.exports = router;
