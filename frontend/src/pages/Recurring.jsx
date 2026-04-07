import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function Recurring() {
  const [active, setActive] = useState([]);
  const [inactive, setInactive] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/recurring/');
    setActive(data.filter(r => r.is_active));
    setInactive(data.filter(r => !r.is_active));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this recurring transaction?')) return;
    await api.delete(`/recurring/${id}/`);
    load();
  };

  const handleToggle = async (item) => {
    await api.patch(`/recurring/${item.id}/`, { is_active: !item.is_active });
    load();
  };

  const freqLabel = { weekly: 'Weekly', biweekly: 'Every 2 Weeks', monthly: 'Monthly' };

  const RecurringItem = ({ r, dimmed }) => (
    <div className="transaction-item" style={dimmed ? { opacity: 0.6 } : {}}>
      <div className="transaction-left">
        <div className={`transaction-icon ${r.type}`}>{r.type === 'income' ? '📈' : '📉'}</div>
        <div>
          <div className="transaction-desc">{r.description || 'No description'}</div>
          <div className="transaction-cat">
            {r.category_name || 'Uncategorized'} &middot; {freqLabel[r.frequency] || r.frequency}
            {r.is_active && <> &middot; Next: {r.next_run}</>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ textAlign: 'right' }}>
          <div className={`transaction-amount ${r.type}`}>
            {r.type === 'income' ? '+' : '-'}${Math.abs(Number(r.amount)).toFixed(2)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn-outline-custom" style={{ padding: '5px 10px', fontSize: '0.75rem' }}
            onClick={() => handleToggle(r)} title={r.is_active ? 'Pause' : 'Resume'}>
            {r.is_active ? '⏸' : '▶'}
          </button>
          {r.is_active && <Link to={`/recurring/${r.id}/edit`} className="btn-outline-custom" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>Edit</Link>}
          <button className="btn-outline-custom" style={{ padding: '5px 10px', fontSize: '0.75rem', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
            onClick={() => handleDelete(r.id)}>Del</button>
        </div>
      </div>
    </div>
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Recurring Transactions</h1>
          <p className="subtitle">Automate your regular income and expenses</p>
        </div>
        <Link to="/recurring/add" className="btn-primary-custom">+ Add Recurring</Link>
      </div>

      {active.length > 0 && (
        <div className="content-card mb-4">
          <div className="card-header-custom"><h3 className="card-title">Active</h3></div>
          {active.map(r => <RecurringItem key={r.id} r={r} />)}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="content-card mb-4">
          <div className="card-header-custom"><h3 className="card-title" style={{ color: 'var(--text-muted)' }}>Paused</h3></div>
          {inactive.map(r => <RecurringItem key={r.id} r={r} dimmed />)}
        </div>
      )}

      {active.length === 0 && inactive.length === 0 && (
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-state-icon">🔄</div>
            <h3>No recurring transactions</h3>
            <p>Set up recurring transactions to automatically track regular income and expenses.</p>
            <Link to="/recurring/add" className="btn-primary-custom" style={{ marginTop: '12px' }}>+ Add Recurring</Link>
          </div>
        </div>
      )}
    </>
  );
}
