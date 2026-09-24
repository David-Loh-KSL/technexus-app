import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import Companies from './components/Companies';
import CompanyDetail from './components/CompanyDetail';
import CompareModal, { CompareTable } from './components/CompareModal';
import AddCompanyModal from './components/AddCompanyModal';
import Analytics from './components/Analytics';

const FAVS_KEY = 'tn_favs';

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [view, setView] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ domain: '', trl: '', cert: '', country: '' });

  const [favs, setFavs] = useState(() => new Set(JSON.parse(localStorage.getItem(FAVS_KEY) || '[]')));
  const [compared, setCompared] = useState(new Set());

  const [detailId, setDetailId] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    api
      .listCompanies()
      .then(setCompanies)
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVS_KEY, JSON.stringify([...favs]));
  }, [favs]);

  const toggleFav = (id) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCompare = (id) => {
    setCompared((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const detailCompany = useMemo(() => companies.find((c) => c.id === detailId) || null, [companies, detailId]);
  const comparedCompanies = useMemo(() => companies.filter((c) => compared.has(c.id)), [companies, compared]);

  const exportCSV = () => {
    const cols = ['name', 'country', 'domain', 'product', 'tech', 'trl', 'cert', 'website', 'contact'];
    const rows = [
      cols.join(','),
      ...companies.map((d) =>
        cols
          .map((c) => `"${(Array.isArray(d[c]) ? d[c].join('; ') : d[c] || '').toString().replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    a.download = 'technexus-export.csv';
    a.click();
  };

  const handleAdded = (created) => {
    setCompanies((prev) => [...prev, created]);
    setShowAddModal(false);
    setView('companies');
    setDetailId(created.id);
  };

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading TechNexus…</div>;
  }
  if (loadError) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h2>Could not reach the TechNexus API</h2>
        <p style={{ color: '#B91C1C' }}>{loadError}</p>
        <p>Check that the backend is running and VITE_API_BASE_URL is set correctly.</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <Sidebar view={view} setView={setView} compareCount={compared.size} />
      <div className="main">
        <Topbar
          query={query}
          setQuery={(q) => {
            setQuery(q);
            if (view !== 'companies') setView('companies');
          }}
          companies={companies}
          compareCount={compared.size}
          onOpenCompare={() => {
            if (compared.size > 1) setShowCompareModal(true);
            else alert('Select at least 2 companies to compare.');
          }}
          onClearCompare={() => setCompared(new Set())}
          onOpenAdd={() => setShowAddModal(true)}
          onExportCSV={exportCSV}
        />
        <div className="content">
          {view === 'dashboard' && (
            <Dashboard
              companies={companies}
              setView={setView}
              onOpenDetail={setDetailId}
              filters={filters}
              setFilters={setFilters}
            />
          )}
          {view === 'companies' && (
            <Companies
              companies={companies}
              query={query}
              filters={filters}
              setFilters={setFilters}
              favs={favs}
              toggleFav={toggleFav}
              compared={compared}
              toggleCompare={toggleCompare}
              onOpenDetail={setDetailId}
              onOpenAdd={() => setShowAddModal(true)}
            />
          )}
          {view === 'compare' && (
            comparedCompanies.length >= 2 ? (
              <section>
                <div className="ph"><div><h1>Company Comparison</h1><p>Selected companies, compared side-by-side</p></div></div>
                <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, padding: 20, overflow: 'auto' }}>
                  <CompareTable companies={comparedCompanies} />
                </div>
              </section>
            ) : (
              <div className="empty">
                <div className="empty-icon">⊞</div>
                <h3>No companies selected</h3>
                <p>Go to the Companies view, check the compare box on any cards, then return here.</p>
                <button className="btn btn-primary" onClick={() => setView('companies')}>Browse companies</button>
              </div>
            )
          )}
          {view === 'analytics' && <Analytics companies={companies} onOpenDetail={setDetailId} />}
        </div>
      </div>

      {detailCompany && <CompanyDetail company={detailCompany} onClose={() => setDetailId(null)} />}
      {showCompareModal && <CompareModal companies={comparedCompanies} onClose={() => setShowCompareModal(false)} />}
      {showAddModal && <AddCompanyModal onClose={() => setShowAddModal(false)} onAdded={handleAdded} />}
    </div>
  );
}
