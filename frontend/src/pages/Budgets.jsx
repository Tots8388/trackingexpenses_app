import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/budgets/', { params: { month } });
      setBudgets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    await api.delete(`/budgets/${id}/`);
    load();
  };

  const monthDisplay = new Date(month + '-01').toLocaleDateString('en', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Budgets</h1>
          <p className="subtitle">{monthDisplay} &mdash; Track spending against your limits</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="month" className="form-control" style={{ width: 'auto' }} value={month}
            onChange={e => setMonth(e.target.value)} />
          <Link to="/budgets/add" className="btn-primary-custom">+ Add Budget</Link>
        </div>
      </div>

      {loading ? <p style={{ textAlign: 'center', padding: '40px' }}>Loading...</p> :
        budgets.length > 0 ? (
          <div className="row g-3">
            {budgets.map(b => {
              const pct = b.amount > 0 ? Math.min((b.spent / Number(b.amount)) * 100, 100).toFixed(1) : 0;
              const over = b.spent > Number(b.amount);
              const remaining = Math.max(Number(b.amount) - b.spent, 0);
              return (
                <div key={b.id} className="col-md-6">
                  <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{b.category_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ${b.spent.toFixed(2)} of ${Number(b.amount).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/budgets/${b.id}/edit`} className="btn-outline-custom" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>Edit</Link>
                        <button className="btn-outline-custom" style={{ padding: '5px 12px', fontSize: '0.78rem', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
                          onClick={() => handleDelete(b.id)}>Delete</button>
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-main)', borderRadius: '8px', height: '24px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        height: '100%', borderRadius: '8px', width: `${pct}%`,
                        background: over ? 'var(--accent-red)' : pct >= 80 ? '#F59E0B' : 'var(--accent-green)',
                        transition: 'width 0.4s ease',
                      }} />
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>Spent: ${b.spent.toFixed(2)}</span>
                      <span style={over ? { color: 'var(--accent-red)', fontWeight: 600 } : {}}>
                        {over ? 'Over budget!' : `Remaining: $${remaining.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="content-card">
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>No budgets set</h3>
              <p>Create budgets to track your spending by category for {monthDisplay}.</p>
              <Link to="/budgets/add" className="btn-primary-custom" style={{ marginTop: '12px' }}>+ Add Budget</Link>
            </div>
          </div>
        )
      }
    </>
  );
}
