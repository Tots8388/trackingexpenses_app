import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import StatCard from '../components/StatCard';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ type: '', q: '', category: '', date_from: '', date_to: '' });
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0, total_volume: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;

      const [txRes, sumRes, catRes] = await Promise.all([
        api.get('/transactions/', { params }),
        api.get('/summary/', { params }),
        api.get('/categories/'),
      ]);

      let txs = txRes.data;
      // Client-side text search and date filters
      if (filters.q) {
        const q = filters.q.toLowerCase();
        txs = txs.filter(t => (t.description || '').toLowerCase().includes(q) || (t.category_name || '').toLowerCase().includes(q));
      }
      if (filters.date_from) txs = txs.filter(t => t.date >= filters.date_from);
      if (filters.date_to) txs = txs.filter(t => t.date <= filters.date_to);

      setTransactions(txs);
      setSummary(sumRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filters.type]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}/`);
    loadData();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p className="subtitle">Manage all your income and expenses</p>
        </div>
        <Link to="/transactions/add" className="btn-primary-custom">+ Add Transaction</Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3"><StatCard label="Income" value={summary.total_income} type="income" /></div>
        <div className="col-6 col-md-3"><StatCard label="Expenses" value={summary.total_expense} type="expense" /></div>
        <div className="col-6 col-md-3"><StatCard label="Balance" value={summary.balance} type="balance" /></div>
        <div className="col-6 col-md-3"><StatCard label="Volume" value={summary.total_volume} /></div>
      </div>

      <div className="content-card mb-4">
        <form onSubmit={handleSearch}>
          <div className="filter-bar mb-3">
            {['', 'income', 'expense'].map(t => (
              <button key={t} type="button"
                className={`filter-chip ${filters.type === t ? 'active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, type: t }))}
              >
                {t === '' ? 'All' : t === 'income' ? 'Income' : 'Expenses'}
              </button>
            ))}
            <div className="ms-auto" style={{ minWidth: 200 }}>
              <input type="text" className="form-control" placeholder="Search descriptions..."
                style={{ fontSize: '0.85rem' }}
                value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Category</label>
              <select className="form-select" style={{ fontSize: '0.85rem', minWidth: 140 }}
                value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>From</label>
              <input type="date" className="form-control" style={{ fontSize: '0.85rem' }}
                value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>To</label>
              <input type="date" className="form-control" style={{ fontSize: '0.85rem' }}
                value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary-custom" style={{ height: 42 }}>Filter</button>
            <button type="button" className="btn-outline-custom" style={{ height: 42 }}
              onClick={() => { setFilters({ type: '', q: '', category: '', date_from: '', date_to: '' }); }}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="content-card">
        {loading ? <p style={{ textAlign: 'center', padding: '40px' }}>Loading...</p> :
          transactions.length > 0 ? transactions.map(tx => (
            <div key={tx.id} className="transaction-item">
              <div className="transaction-left">
                <div className={`transaction-icon ${tx.type}`}>{tx.type === 'income' ? '↑' : '↓'}</div>
                <div>
                  <div className="transaction-desc">{tx.description || 'No description'}</div>
                  <div className="transaction-cat">{tx.category_name || 'Uncategorized'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div className={`transaction-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}${Math.abs(Number(tx.amount)).toFixed(2)}
                  </div>
                  <div className="transaction-date">{tx.date}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Link to={`/transactions/${tx.id}/edit`} className="btn-outline-custom" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>Edit</Link>
                  <button className="btn-outline-custom" style={{ padding: '5px 10px', fontSize: '0.75rem', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
                    onClick={() => handleDelete(tx.id)}>Del</button>
                </div>
              </div>
            </div>
          )) : (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <h3>No transactions found</h3>
              <p>Try adjusting your filters or add a new transaction.</p>
            </div>
          )
        }
      </div>
    </>
  );
}
