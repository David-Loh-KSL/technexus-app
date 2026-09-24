import { score, scoreColor } from '../helpers';

export default function Analytics({ companies, onOpenDetail }) {
  const sBuckets = [[0, 39, 'Low'], [40, 69, 'Mid'], [70, 100, 'High']];
  const maxA = Math.max(1, ...sBuckets.map(([lo, hi]) => companies.filter((d) => score(d) >= lo && score(d) <= hi).length));

  const trlBuckets = [[7, 9], [5, 6], [1, 4]];

  const top = [...companies].sort((a, b) => score(b) - score(a)).slice(0, 6);
  const maxS = top.length ? score(top[0]) : 1;

  return (
    <section>
      <div className="ph">
        <div>
          <h1>Analytics</h1>
          <p>Score distribution and portfolio analysis</p>
        </div>
      </div>
      <div className="dash-row three">
        <div className="panel">
          <div className="panel-title">Score distribution</div>
          {sBuckets.map(([lo, hi, lbl]) => {
            const n = companies.filter((d) => score(d) >= lo && score(d) <= hi).length;
            return (
              <div className="dist-row" key={lbl}>
                <div className="dist-lbl">{lbl} ({lo}–{hi})</div>
                <div className="dist-bg"><div className="dist-fill" style={{ width: `${(n / maxA) * 100}%`, background: lo >= 70 ? '#2D6A4F' : lo >= 40 ? '#B45309' : '#B91C1C' }} /></div>
                <div className="dist-n">{n}</div>
              </div>
            );
          })}
        </div>
        <div className="panel">
          <div className="panel-title">TRL vs Certification</div>
          {trlBuckets.map(([lo, hi]) => {
            const withCert = companies.filter((d) => d.trl >= lo && d.trl <= hi && d.cert.length > 0).length;
            const noCert = companies.filter((d) => d.trl >= lo && d.trl <= hi && d.cert.length === 0).length;
            return (
              <div className="dist-row" key={`${lo}-${hi}`}>
                <div className="dist-lbl">TRL {lo}–{hi}</div>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{withCert} cert</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{noCert} uncert</div>
              </div>
            );
          })}
        </div>
        <div className="panel">
          <div className="panel-title">Top-scoring companies</div>
          {top.map((d) => {
            const s = score(d);
            return (
              <div className="dist-row" key={d.id} style={{ cursor: 'pointer' }} onClick={() => onOpenDetail(d.id)}>
                <div className="dist-lbl">{d.name}</div>
                <div className="dist-bg"><div className="dist-fill" style={{ width: `${(s / maxS) * 100}%`, background: scoreColor(s) }} /></div>
                <div className="dist-n" style={{ color: scoreColor(s) }}>{s}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
