import { domainStyle, initials, score, scoreColor, genSummary, genStrengths, genRisks } from '../helpers';

export default function CompanyDetail({ company, onClose }) {
  if (!company) return null;
  const d = company;
  const sty = domainStyle(d.domain);
  const s = score(d);
  const scoreBreakdown = [
    { lab: 'TRL Score', val: (d.trl / 9) * 100, n: `${d.trl}/9`, c: '#2D6A4F' },
    { lab: 'Certification', val: (Math.min(d.cert.length, 3) / 3) * 100, n: d.cert.length, c: '#2B5BE0' },
    {
      lab: 'Profile completeness',
      val: (['website', 'contact', 'founded', 'employees'].filter((f) => d[f] && !String(d[f]).startsWith('Not')).length / 4) * 100,
      n: '',
      c: '#B45309',
    },
    { lab: 'Overall', val: s, n: s, c: scoreColor(s) },
  ];
  const strengths = genStrengths(d);
  const risks = genRisks(d);

  return (
    <div className="detail-overlay" onClick={(e) => e.target.classList.contains('detail-overlay') && onClose()}>
      <div className="detail-panel">
        <div className="dp-head">
          <div className="dp-logo" style={{ background: sty.solid }}>{initials(d.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="dp-name">{d.name}</div>
            <div className="dp-meta">
              {d.country}
              {d.founded && d.founded !== 'Not disclosed' ? ` · est. ${d.founded}` : ''}
              {d.employees && d.employees !== 'Not disclosed' ? ` · ${d.employees} employees` : ''}
            </div>
            <span className="domain-pill" style={{ background: sty.bg, color: sty.fg, marginTop: 6, display: 'inline-flex' }}>{d.domain}</span>
          </div>
          <button className="dp-close" onClick={onClose}>✕</button>
        </div>
        <div className="dp-body">
          <div className="dp-section">
            <div className="ai-label">✦ AI Summary</div>
            <div className="summary-box">{genSummary(d)}</div>
          </div>
          <div className="dp-section">
            <h4>Product &amp; Technology</h4>
            <p><strong>{d.product}</strong></p>
            <p style={{ marginTop: 8 }}>{d.tech}</p>
          </div>
          <div className="dp-section">
            <h4>Key Information</h4>
            <div className="info-grid">
              <div className="info-cell"><div className="k">Country</div><div className="v">{d.country}</div></div>
              <div className="info-cell"><div className="k">Founded</div><div className="v">{d.founded || 'Not disclosed'}</div></div>
              <div className="info-cell"><div className="k">TRL</div><div className="v">{d.trl}/9</div></div>
              <div className="info-cell"><div className="k">Score</div><div className="v" style={{ color: scoreColor(s) }}>{s}/100</div></div>
            </div>
          </div>
          <div className="dp-section">
            <h4>Scorecard</h4>
            {scoreBreakdown.map((r) => (
              <div className="score-bar-row" key={r.lab}>
                <div className="sbl">{r.lab}</div>
                <div className="sb-bg"><div className="sb-fill" style={{ width: `${r.val}%`, background: r.c }} /></div>
                <div className="sb-n">{r.n}</div>
              </div>
            ))}
          </div>
          <div className="dp-section">
            <h4>Strengths</h4>
            <ul className="strength-list">{strengths.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="dp-section">
            <h4>Risks &amp; Gaps</h4>
            <ul className="risk-list">{risks.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="dp-section">
            <h4>Certifications</h4>
            <div className="cert-tags">
              {d.cert.length
                ? d.cert.map((c) => <span className="cert-tag" key={c}>{c}</span>)
                : <span className="cert-tag cert-none">No public certification found</span>}
            </div>
          </div>
          <div className="dp-section">
            <h4>Maritime Implementation Pathway</h4>
            <div className="impl-box">{d.impl}</div>
          </div>
          <div className="dp-section">
            <h4>Contact &amp; Website</h4>
            <div className="contact-block">
              <span style={{ fontSize: 13 }}>{d.contact && !d.contact.startsWith('Not') ? d.contact : 'Contact not publicly listed'}</span>
              {d.website && d.website.startsWith('http')
                ? <a href={d.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>{d.website.replace(/^https?:\/\//, '')} ↗</a>
                : <span style={{ color: 'var(--muted)', fontSize: 12 }}>No site found</span>}
            </div>
          </div>
          {d.aiGenerated && (
            <div className="dp-section">
              <p style={{ fontSize: 12, color: 'var(--blue)' }}>
                This profile was AI-generated via web search. Verify all certification and compliance claims directly with the vendor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
