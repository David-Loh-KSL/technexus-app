/**
 * Server-side Claude API call for the "Add Company (AI)" feature.
 *
 * This replaces the client-side fetch() to api.anthropic.com that the
 * original artifact used. Browsers can't be trusted with the API key, and
 * api.anthropic.com's CORS policy won't allow the request from a plain
 * static site anyway — so the browser calls THIS backend, and the backend
 * (which holds the real key, injected from Secrets Manager) talks to
 * Anthropic.
 *
 * NOTE: check https://docs.claude.com for the current model string and
 * tool type before deploying — both can change over time. Values below
 * were correct as of this build.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

const SYSTEM_PROMPT = `You are populating a record in a Technology Partner Intelligence database (TechNexus) for Jurong Port, Singapore. Research the company via web search and return STRICT JSON ONLY — no markdown, no code fences — with exactly these keys: name, country, founded, employees, domain, product, tech, cert (array of strings), trl (number 1-9), trlConf, website, contact, impl. Be conservative — never fabricate certifications or contacts. If information cannot be found, use "Not disclosed" or "Not publicly listed" rather than guessing.`;

async function enrichCompany(name, pastedDoc) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server');
  }

  const userMessage = pastedDoc
    ? `Company: ${name}\n\nPartner document:\n${pastedDoc}`
    : `Company: ${name}`;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const textBlocks = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const cleaned = textBlocks.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Claude did not return parseable JSON');
  }

  const parsed = JSON.parse(match[0]);

  // Normalize / defend against odd model output before it hits the DB
  return {
    name: String(parsed.name || name),
    country: String(parsed.country || 'Not disclosed'),
    founded: String(parsed.founded ?? 'Not disclosed'),
    employees: String(parsed.employees ?? 'Not disclosed'),
    domain: String(parsed.domain || 'Uncategorized'),
    product: String(parsed.product || ''),
    tech: String(parsed.tech || ''),
    cert: Array.isArray(parsed.cert) ? parsed.cert.map(String) : parsed.cert ? [String(parsed.cert)] : [],
    trl: Number.isFinite(Number(parsed.trl)) ? Math.min(9, Math.max(1, Number(parsed.trl))) : 5,
    trlConf: String(parsed.trlConf || ''),
    website: String(parsed.website || 'Not publicly disclosed'),
    contact: String(parsed.contact || 'Not publicly listed'),
    impl: String(parsed.impl || ''),
    aiGenerated: true,
  };
}

module.exports = { enrichCompany };
