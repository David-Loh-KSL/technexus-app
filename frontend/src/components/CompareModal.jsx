import { score } from '../helpers';

const ROWS = [
  ['Product', (d) => d.product],
  ['Domain', (d) => d.domain],
  ['Country', (d) => d.country],
  ['Founded', (d) => d.founded || 'N/A'],
  ['TRL', (d) => `${d.trl}/9`],
  ['Score', (d) => `${score(d)}/100`],
  ['Certifications', (d) => (d.cert.length ? d.cert.join(', ') : 'None')],
  ['Contact', (d) => (d.contact?.startsWith('Not') ? 'Not listed' : d.contact)],
  ['Website', (d) => (d.website?.startsWith('http') ? d.website.replace(/^https?:\/\//, '') : '—')],
  ['Pathway summary', (d) => `${d.impl.split('.')[0]}.`],
];

// The actual comparison <table>, reused by both the popup modal and the
// dedicated Compare page (embedded=true skips the overlay/close chrome).
export function CompareTable({ companies }) {
  const cos = companies;
  if (!cos.length) return null;
  const bestTrl = Math.max(...cos.map((d) => d.trl));
  const bestSc = Math.max(...cos.map((d) => score(d)));

  return (
    <table className="cmp-table">
      <thead>
        <tr>
          <th>Field</th>
          {cos.map((d) => <th key={d.id} style={{ minWidth: 180 }}>{d.name}</th>)}
        </tr>
      </thead>
      <tbody>
        {ROWS.map(([lbl, fn]) => (
          <tr key={lbl}>
            <td className="row-lbl">{lbl}</td>
            {cos.map((d) => {
              const isBest = (lbl === 'TRL' && d.trl === bestTrl) || (lbl === 'Score' && score(d) === bestSc);
              return <td key={d.id} className={isBest ? 'best' : ''}>{fn(d)}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CompareModal({ companies, onClose }) {
  if (!companies.length) return null;
  return (
    <div className="compare-overlay" onClick={(e) => e.target.classList.contains('compare-overlay') && onClose()}>
      <div className="compare-modal">
        <div className="cmp-head">
          <h2>Side-by-side Comparison</h2>
          <button className="cmp-close" onClick={onClose}>✕ Close</button>
        </div>
        <div style={{ overflow: 'auto' }}>
          <CompareTable companies={companies} />
        </div>
      </div>
    </div>
  );
}
