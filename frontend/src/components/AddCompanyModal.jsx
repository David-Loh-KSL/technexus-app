import { useState } from 'react';
import { api } from '../api';

export default function AddCompanyModal({ onClose, onAdded }) {
  const [name, setName] = useState('');
  const [doc, setDoc] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!name.trim()) {
      setStatus('Enter a company name.');
      return;
    }
    setBusy(true);
    setStatus('Searching the web…');
    try {
      const created = await api.enrichCompany(name.trim(), doc.trim());
      setStatus(`✓ Added "${created.name}"`);
      setTimeout(() => {
        onAdded(created);
      }, 600);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
      setBusy(false);
    }
  };

  return (
    <div className="add-overlay" onClick={(e) => e.target.classList.contains('add-overlay') && onClose()}>
      <div className="add-modal">
        <button className="am-close" onClick={onClose}>✕</button>
        <h2>Add a company</h2>
        <p className="sub">Enter the company name. TechNexus searches the web and pre-fills the profile using AI — review before saving.</p>
        <label>Company name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sea Machines Robotics" />
        <label>Optional — paste partner-provided document text</label>
        <textarea value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="Paste any spec sheets, proposals, or meeting notes…" />
        <div className="status-line">
          {busy && <span className="spinner" />}
          {status}
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy} onClick={run}>
            {busy ? 'Working…' : 'Retrieve & preview'}
          </button>
        </div>
        <p style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 12, borderTop: '1px dashed var(--border)', paddingTop: 10 }}>
          Uses Claude with web search via the TechNexus backend. Verify certifications and compliance claims directly with the vendor.
        </p>
      </div>
    </div>
  );
}
