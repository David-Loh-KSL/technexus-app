export default function Sidebar({ view, setView, compareCount }) {
  const items = [
    { v: 'dashboard', icon: '◧', label: 'Dashboard' },
    { v: 'companies', icon: '▤', label: 'Companies' },
    { v: 'compare', icon: '⊞', label: 'Compare', tag: compareCount },
    { v: 'analytics', icon: '⬟', label: 'Analytics' },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-name">
          Tech<span>Nexus</span>
        </div>
        <div className="brand-sub">Technology Intelligence Platform</div>
      </div>
      <nav className="nav">
        {items.map((it) => (
          <button
            key={it.v}
            className={`nav-btn${view === it.v ? ' active' : ''}`}
            onClick={() => setView(it.v)}
          >
            <span className="nav-icon">{it.icon}</span>
            <span className="nav-lbl">{it.label}</span>
            {!!it.tag && <span className="nav-tag">{it.tag}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
