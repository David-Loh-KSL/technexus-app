import { useMemo, useState } from 'react';
import { domainStyle, initials, score, scoreColor, relevance, highlight } from '../helpers';

export default function Companies({
  companies,
  query,
  filters,
  setFilters,
  favs,
  toggleFav,
  compared,
  toggleCompare,
  onOpenDetail,
  onOpenAdd,
}) {
  const [cardMode, setCardMode] = useState(true);

  const domains = useMemo(() => [...new Set(companies.map((d) => d.domain))], [companies]);
  const countries = useMemo(() => [...new Set(companies.map((d) => d.country))].sort(), [companies]);

  const filtered = useMemo(() => {
    return companies
      .map((d) => ({ d, r: relevance(d, query) }))
      .filter((x) => x.r > 0)
      .filter((x) => !filters.domain || x.d.domain === filters.domain)
      .filter((x) => !filters.trl || x.d.trl >= Number(filters.trl))
      .filter((x) => !filters.cert || (filters.cert === 'yes' ? x.d.cert.length > 0 : x.d.cert.length === 0))
      .filter((x) => !filters.country || x.d.country === filters.country)
      .sort((a, b) => b.r - a.r)
      .map((x) => x.d);
  }, [companies, query, filters]);

  const clearAll = () => setFilters({ domain: '', trl: '', cert: '', country: '' });

  return (
    <section>
      <div className="ph">
        <div>
          <h1>Companies</h1>
          <p>{filtered.length} of {companies.length} companies</p>
        </div>
        <div className="toolbar">
          <div className="tv-toggle">
            <button className={cardMode ? 'active' : ''} onClick={() => setCardMode(true)}>Cards</button>
            <button className={!cardMode ? 'active' : ''} onClick={() => setCardMode(false)}>Table</button>
          </div>
        </div>
      </div>

      <div className="tag-pills">
        {domains.map((d) => {
          const sty = domainStyle(d);
          const active = filters.domain === d;
          return (
            <button
              key={d}
              className={`pill${active ? ' active' : ''}`}
              style={{ background: sty.bg, color: sty.fg }}
              onClick={() => setFilters({ ...filters, domain: active ? '' : d })}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className="companies-layout">
        <div className="filter-panel">
          <div className="fp-title">Filters</div>
          <div className="fg">
            <label>Domain</label>
            <select value={filters.domain} onChange={(e) => setFilters({ ...filters, domain: e.target.value })}>
              <option value="">All domains</option>
              {domains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Min TRL</label>
            <select value={filters.trl} onChange={(e) => setFilters({ ...filters, trl: e.target.value })}>
              <option value="">Any TRL</option>
              <option value="3">TRL 3+</option>
              <option value="5">TRL 5+</option>
              <option value="7">TRL 7+</option>
            </select>
          </div>
          <div className="fg">
            <label>Certification</label>
            <select value={filters.cert} onChange={(e) => setFilters({ ...filters, cert: e.target.value })}>
              <option value="">Any</option>
              <option value="yes">Certified</option>
              <option value="no">None found</option>
            </select>
          </div>
          <div className="fg">
            <label>Country</label>
            <select value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })}>
              <option value="">All</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="clr-btn" onClick={clearAll}>Clear all</button>
        </div>

        <div>
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">⬡</div>
              <h3>No partners match</h3>
              <p>Try clearing a filter or adjusting your search.</p>
              <button className="btn btn-primary" onClick={onOpenAdd}>+ Add Company</button>
            </div>
          ) : cardMode ? (
            <div className="grid">
              {filtered.map((d) => {
                const sty = domainStyle(d.domain);
                const s = score(d);
                return (
                  <div className="card" key={d.id} onClick={() => onOpenDetail(d.id)}>
                    {d.aiGenerated && <div className="ai-badge">AI</div>}
                    <div className="card-head">
                      <div className="c-logo" style={{ background: sty.solid }}>{initials(d.name)}</div>
                      <div className="c-info">
                        <div className="c-name" dangerouslySetInnerHTML={{ __html: highlight(d.name, query) }} />
                        <div className="c-loc">{d.country}{d.founded && d.founded !== 'Not disclosed' ? ` · ${d.founded}` : ''}</div>
                      </div>
                      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                        <button className={`fav-btn${favs.has(d.id) ? ' active' : ''}`} onClick={() => toggleFav(d.id)}>
                          {favs.has(d.id) ? '★' : '☆'}
                        </button>
                        <button className={`cmp-btn${compared.has(d.id) ? ' active' : ''}`} onClick={() => toggleCompare(d.id)}>⊞</button>
                      </div>
                    </div>
                    <span className="domain-pill" style={{ background: sty.bg, color: sty.fg }}>{d.domain}</span>
                    <div className="c-product" dangerouslySetInnerHTML={{ __html: highlight(d.product, query) }} />
                    <div className="c-tech" dangerouslySetInnerHTML={{ __html: highlight(d.tech, query) }} />
                    <div className="card-foot">
                      <div className="cf-stat"><div className="cf-v" style={{ color: scoreColor(s) }}>{s}</div><div className="cf-k">Score</div></div>
                      <div className="cf-stat"><div className="cf-v">{d.trl}/9</div><div className="cf-k">TRL</div></div>
                      <div className="cert-info">{d.cert.length ? `✓ ${d.cert.length} cert` : '—'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="tablewrap">
              <table>
                <thead>
                  <tr><th>Company</th><th>Domain</th><th>TRL</th><th>Certification</th><th>Contact</th><th>Website</th></tr>
                </thead>
                <tbody>
                  {filtered.map((d) => {
                    const sty = domainStyle(d.domain);
                    return (
                      <tr key={d.id} onClick={() => onOpenDetail(d.id)}>
                        <td>
                          <div className="t-name" dangerouslySetInnerHTML={{ __html: highlight(d.name, query) }} />
                          <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{d.country}</div>
                        </td>
                        <td><span className="domain-pill" style={{ background: sty.bg, color: sty.fg }}>{d.domain}</span></td>
                        <td style={{ fontFamily: "'JetBrains Mono',monospace" }}>{d.trl}/9</td>
                        <td>{d.cert.length ? d.cert.join(', ') : <span style={{ color: 'var(--muted)' }}>None found</span>}</td>
                        <td>{d.contact && !d.contact.startsWith('Not') ? d.contact : <span style={{ color: 'var(--muted)' }}>Not listed</span>}</td>
                        <td>
                          {d.website && d.website.startsWith('http') ? (
                            <a href={d.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>
                              {d.website.replace(/^https?:\/\//, '')}
                            </a>
                          ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
