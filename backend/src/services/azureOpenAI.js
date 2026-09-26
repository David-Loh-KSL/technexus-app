/**
 * Server-side Azure OpenAI call for the "Add Company (AI)" feature.
 *
 * NOTE: unlike the original Anthropic implementation, this does NOT perform
 * a live web search — Azure OpenAI's Chat Completions API has no built-in
 * web-search tool the way Claude's API does. The model will answer from its
 * training data only, so enrichment quality/currency will differ. If you
 * want live web grounding later, look at Azure AI Foundry's "Grounding with
 * Bing Search" tool — that's a separate Azure resource + code change.
 */

const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT; // e.g. https://kaiva-dev-az-openai.openai.azure.com/
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT; // e.g. gpt-5-mini
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';

const SYSTEM_PROMPT = `You are populating a record in a Technology Partner Intelligence database (TechNexus) for Jurong Port, Singapore. Based on your knowledge, return STRICT JSON ONLY — no markdown, no code fences — with exactly these keys: name, country, founded, employees, domain, product, tech, cert (array of strings), trl (number 1-9), trlConf, website, contact, impl. Be conservative — never fabricate certifications or contacts. If information cannot be found, use "Not disclosed" or "Not publicly listed" rather than guessing.`;

async function enrichCompany(name, pastedDoc) {
  if (!process.env.AZURE_OPENAI_API_KEY) {
    throw new Error('AZURE_OPENAI_API_KEY is not configured on the server');
  }
  if (!ENDPOINT || !DEPLOYMENT) {
    throw new Error('AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_DEPLOYMENT is not configured on the server');
  }

  const userMessage = pastedDoc
    ? `Company: ${name}\n\nPartner document:\n${pastedDoc}`
    : `Company: ${name}`;

  const url = `${ENDPOINT.replace(/\/$/, '')}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.AZURE_OPENAI_API_KEY,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_completion_tokens: 1200,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Azure OpenAI error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';

  const cleaned = text.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Model did not return parseable JSON');
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
