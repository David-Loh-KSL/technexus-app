import { useState } from 'react';

export default function Topbar({ query, setQuery, companies, compareCount, onOpenCompare, onClearCompare, onOpenAdd, onExportCSV }) {
  const [suggestOpen, setSuggestOpen] = useState(false);

  const ql = query.trim().toLowerCase();
  const matchCos = ql ? companies.filter((d) => d.name.toLowerCase().includes(ql)).slice(0, 4) : [];
  const matchDomains = ql
    ? [...new Set(companies.filter((d) => d.domain.toLowerCase().includes(ql)).map((d) => d.domain))].slice(0, 3)
    : [];

  return (
    <div className="topbar">
      <div className="search-wrap">
        <span className="s-icon">⌕</span>
        <input
          className="search-input"
          placeholder='Search anything — "hull cleaning", "ISO 27001", "TRL 7", "Singapore"…'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSuggestOpen(true);
          }}
          onFocus={() => query && setSuggestOpen(true)}
          onBlur={() => setTimeout(() => setSuggestOpen(false), 160)}
        />
        {suggestOpen && ql && (
          <div className="suggest-box open">
            {matchCos.length > 0 && (
              <div className="suggest-section">
                <div className="suggest-label">Companies</div>
                {matchCos.map((d) => (
                  <div key={d.id} className="suggest-row" onMouseDown={() => setQuery(d.name)}>
                    {d.name}
                    <span className="suggest-chip">{d.domain}</span>
                  </div>
                ))}
              </div>
            )}
            {matchDomains.length > 0 && (
              <div className="suggest-section">
                <div className="suggest-label">Domains</div>
                {matchDomains.map((dom) => (
                  <div key={dom} className="suggest-row" onMouseDown={() => setQuery(dom)}>
                    {dom}
                  </div>
                ))}
              </div>
            )}
            {matchCos.length === 0 && matchDomains.length === 0 && (
              <div className="suggest-section">
                <div className="suggest-row" style={{ color: 'var(--muted)' }}>
                  No suggestions — press Enter to search all fields
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="topbar-right">
        {compareCount > 0 && (
          <div className="compare-bar show">
            <span>{compareCount} selected</span>
            <button onClick={onOpenCompare}>Compare</button>
            <button className="clr" onClick={onClearCompare}>Clear</button>
          </div>
        )}
        <button className="btn" onClick={onExportCSV}>⬇ Export CSV</button>
        <button className="btn btn-primary" onClick={onOpenAdd}>+ Add Company</button>
      </div>
    </div>
  );
}
