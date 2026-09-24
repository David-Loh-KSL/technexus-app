import { domainStyle, initials, score, genSummary } from '../helpers';

export default function Dashboard({ companies, setView, onOpenDetail, filters, setFilters }) {
  const total = companies.length || 1;
  const certified = companies.filter((d) => d.cert?.length > 0).length;
  const avgTrl = (companies.reduce((a, d) => a + d.trl, 0) / total).toFixed(1);
  const sg = companies.filter((d) => d.country?.toLowerCase().includes('singapore')).length;
  const high = companies.filter((d) => d.trl >= 7).length;
  const avgSc = Math.round(companies.reduce((a, d) => a + score(d), 0) / total);

  const buckets = [
    [1, 4, 'Early', '#B91C1C'],
    [5, 6, 'Growing', '#B45309'],
    [7, 8, 'Commercial', '#2B5BE0'],
    [9, 9, 'Proven', '#2D6A4F'],
  ];

  const dc = {};
  companies.forEach((d) => (dc[d.domain] = (dc[d.domain] || 0) + 1));
  const maxD = Math.max(1, ...Object.values(dc));

  const cc = {};
  companies.forEach((d) => {
    const c = d.country.split('(')[0].trim();
    cc[c] = (cc[c] || 0) + 1;
  });
  const maxC = Math.max(1, ...Object.values(cc));

  const recs = [...companies].sort((a, b) => score(b) - score(a)).slice(0, 4);
  const recent = [...companies].slice(-5).reverse();
  const relTime = (i) => ['1h ago', '3h ago', '6h ago', '1d ago', '2d ago'][i] || 'recently';

  const goto = (patch) => {
    setFilters({ ...filters, ...patch });
    setView('companies');
  };

  return (
    <section>
      <div className="ph">
        <div>
          <h1>Dashboard</h1>
          <p>Maritime technology partner ecosystem — executive overview</p>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi" onClick={() => setView('companies')}>
          <div className="kpi-val" style={{ color: '#2D6A4F' }}>{total}</div>
          <div className="kpi-lbl">Total Companies</div>
          <div className="kpi-sub">All tracked partners</div>
        </div>
        <div className="kpi" onClick={() => goto({ cert: 'yes' })}>
          <div className="kpi-val" style={{ color: '#2B5BE0' }}>{certified}</div>
          <div className="kpi-lbl">Certified Partners</div>
          <div className="kpi-sub">{Math.round((certified / total) * 100)}% coverage</div>
        </div>
        <div className="kpi" onClick={() => goto({ trl: '7' })}>
          <div className="kpi-val" style={{ color: '#B45309' }}>{high}</div>
          <div className="kpi-lbl">TRL 7+ Companies</div>
          <div className="kpi-sub">Commercial-ready tier</div>
        </div>
        <div className="kpi">
          <div className="kpi-val" style={{ color: '#2D6A4F' }}>{avgTrl}</div>
          <div className="kpi-lbl">Average TRL</div>
          <div className="kpi-sub">Across all {total} companies</div>
        </div>
        <div className="kpi">
          <div className="kpi-val" style={{ color: '#2B5BE0' }}>{avgSc}</div>
          <div className="kpi-lbl">Average Score</div>
          <div className="kpi-sub">0–100 composite</div>
        </div>
        <div className="kpi" onClick={() => goto({ country: 'Singapore' })}>
          <div className="kpi-val" style={{ color: '#B91C1C' }}>{sg}</div>
          <div className="kpi-lbl">Singapore-based</div>
          <div className="kpi-sub">Local partners</div>
        </div>
      </div>

      <div className="dash-row">
        <div className="panel">
          <div className="panel-title">
            Technology Readiness Distribution
            <span className="panel-link" onClick={() => setView('companies')}>View all →</span>
          </div>
          <div className="trl-grid">
            {buckets.map(([lo, hi, lbl, c]) => {
              const n = companies.filter((d) => d.trl >= lo && d.trl <= hi).length;
              return (
                <div className="trl-bucket" key={lbl} onClick={() => goto({ trl: String(lo) })}>
                  <div className="trl-n" style={{ color: c }}>{n}</div>
                  <div className="trl-lbl">{lbl}<br />TRL {lo}{hi !== lo ? `–${hi}` : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Domain Distribution</div>
          {Object.entries(dc).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
            <div className="dist-row" key={k} style={{ cursor: 'pointer' }} onClick={() => goto({ domain: k })}>
              <div className="dist-lbl">{k}</div>
              <div className="dist-bg"><div className="dist-fill" style={{ width: `${(v / maxD) * 100}%`, background: domainStyle(k).solid }} /></div>
              <div className="dist-n">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-row">
        <div className="panel">
          <div className="panel-title">
            Top Recommended Partners
            <span className="panel-link" onClick={() => setView('companies')}>All companies →</span>
          </div>
          {recs.map((d) => {
            const sty = domainStyle(d.domain);
            const s = score(d);
            return (
              <div className="rec-card" key={d.id} onClick={() => onOpenDetail(d.id)}>
                <div className="rec-logo" style={{ background: sty.solid }}>{initials(d.name)}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                    <div className="rec-name">{d.name}</div>
                    {s >= 70 && <span className="rec-badge" style={{ background: '#E8F4EE', color: '#2D6A4F' }}>Top Pick</span>}
                  </div>
                  <div className="rec-sub">{d.country} · TRL {d.trl}</div>
                  <div className="rec-desc">{genSummary(d).split('.')[0]}.</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="panel">
          <div className="panel-title">Recent Activity</div>
          {recent.map((d, i) => (
            <div className="activity-row" key={d.id} onClick={() => onOpenDetail(d.id)}>
              <div className="act-logo" style={{ background: domainStyle(d.domain).solid }}>{initials(d.name)}</div>
              <div>
                <div className="act-name">{d.name}</div>
                <div className="act-meta">{d.domain}</div>
              </div>
              <div className="act-time">{relTime(i)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-row three">
        <div className="panel">
          <div className="panel-title">Country Distribution</div>
          {Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => (
            <div className="dist-row" key={k}>
              <div className="dist-lbl">{k}</div>
              <div className="dist-bg"><div className="dist-fill" style={{ width: `${(v / maxC) * 100}%`, background: 'var(--accent)' }} /></div>
              <div className="dist-n">{v}</div>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title">Trending Technologies</div>
          {[['AI Video Analytics', '+12%'], ['Underwater Robotics', '+9%'], ['Robotic Welding', '+7%'], ['Hull Cleaning', '+5%'], ['Autonomous Patrol', '+3%']].map(([n, p]) => (
            <div className="trending-row" key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{n}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{p}</div>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title">Certification Coverage</div>
          <div className="dist-row">
            <div className="dist-lbl">Certified</div>
            <div className="dist-bg"><div className="dist-fill" style={{ width: `${(certified / total) * 100}%`, background: 'var(--accent)' }} /></div>
            <div className="dist-n">{certified}</div>
          </div>
          <div className="dist-row">
            <div className="dist-lbl">No certification</div>
            <div className="dist-bg"><div className="dist-fill" style={{ width: `${((total - certified) / total) * 100}%`, background: '#D1D5DB' }} /></div>
            <div className="dist-n">{total - certified}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
