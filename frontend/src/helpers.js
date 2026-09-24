export const DOMAINS = {
  'Security / Surveillance': { bg: '#E8F4EE', fg: '#2D6A4F', solid: '#2D6A4F' },
  'Patrol Robotics': { bg: '#EBF0FD', fg: '#2B5BE0', solid: '#2B5BE0' },
  'Hull Cleaning / Underwater': { bg: '#FEF3C7', fg: '#B45309', solid: '#B45309' },
  'Shipyard Welding': { bg: '#FEE2E2', fg: '#B91C1C', solid: '#B91C1C' },
};

const PALETTE = [
  { bg: '#E8F4EE', fg: '#2D6A4F', solid: '#2D6A4F' },
  { bg: '#EBF0FD', fg: '#2B5BE0', solid: '#2B5BE0' },
  { bg: '#FEF3C7', fg: '#B45309', solid: '#B45309' },
  { bg: '#FEE2E2', fg: '#B91C1C', solid: '#B91C1C' },
];

export function domainStyle(domain) {
  if (DOMAINS[domain]) return DOMAINS[domain];
  let h = 0;
  for (const c of domain) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length;
  return PALETTE[h];
}

export function initials(name) {
  return (
    name
      .replace(/[^a-zA-Z ]/g, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export function score(d) {
  const trl = (d.trl / 9) * 45;
  const cert = (Math.min(d.cert?.length || 0, 3) / 3) * 30;
  const complete =
    (['website', 'contact', 'founded', 'employees'].filter(
      (f) => d[f] && !String(d[f]).startsWith('Not')
    ).length /
      4) *
    25;
  return Math.round(trl + cert + complete);
}

export function scoreColor(s) {
  return s >= 70 ? '#2D6A4F' : s >= 45 ? '#B45309' : '#B91C1C';
}

export function genSummary(d) {
  const trlStr = d.trl >= 8 ? `high (TRL ${d.trl})` : d.trl >= 5 ? `mid-range (TRL ${d.trl})` : `early (TRL ${d.trl})`;
  const certStr = d.cert?.length ? `with ${d.cert.join(' and ')} credentials` : 'without public certification';
  return `${d.name} is a ${d.domain.toLowerCase()} company based in ${d.country}, offering ${(d.product || '').toLowerCase()}. The technology maturity is ${trlStr} ${certStr}. ${(d.impl || '').split('.')[0]}.`;
}

export function genStrengths(d) {
  const s = [];
  if (d.trl >= 7) s.push(`High technology readiness (TRL ${d.trl}/9)`);
  if (d.cert?.length) s.push(`Publicly certified: ${d.cert.join(', ')}`);
  if (d.country?.includes('Singapore')) s.push('Local Singapore presence — lower integration friction');
  if (d.website && d.website.startsWith('http')) s.push('Active public web presence');
  if (d.founded && d.founded !== 'Not disclosed') s.push(`Established company (founded ${d.founded})`);
  if (!s.length) s.push('Active in specialised domain — monitor for updates');
  return s.slice(0, 4);
}

export function genRisks(d) {
  const r = [];
  if (d.trl < 5) r.push('Low TRL — not yet commercially validated');
  if (!d.cert?.length) r.push('No public certification found — verify compliance independently');
  if (d.contact?.startsWith('Not')) r.push('No named contact — cold outreach required');
  if (!d.founded || d.founded === 'Not disclosed') r.push('Founding date unknown — assess company maturity carefully');
  if (!r.length) r.push('Profile data incomplete — confirm all claims with vendor');
  return r.slice(0, 3);
}

const FIELDS = ['name', 'country', 'domain', 'product', 'tech', 'impl', 'trlConf', 'website', 'contact'];

export function relevance(d, q) {
  if (!q) return 1;
  const ql = q.toLowerCase().trim();
  const hay = [...FIELDS.map((f) => d[f] || ''), ...(d.cert || [])].join(' ').toLowerCase();
  const tm = ql.match(/trl\s*(\d+)/);
  if (tm) return d.trl >= Number(tm[1]) ? 3 : 0;
  const words = ql.split(/\s+/);
  let sc = 0;
  for (const w of words) {
    if (!hay.includes(w)) {
      if (w.length > 3 && hay.includes(w.slice(0, -1))) sc += 0.5;
      else return 0;
    } else sc += 1;
  }
  if (d.name.toLowerCase().includes(ql)) sc += 3;
  if (d.domain.toLowerCase().includes(ql)) sc += 1;
  return sc;
}

export function highlight(text, q) {
  if (!q || !text) return text || '';
  try {
    const words = q.trim().split(/\s+/).filter((w) => w.length > 1);
    let r = text;
    words.forEach((w) => {
      r = r.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
    });
    return r;
  } catch {
    return text;
  }
}
