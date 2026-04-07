import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

export default function TransactionForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    type: 'expense', amount: '', category: '', date: new Date().toISOString().slice(0, 10), description: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/categories/').then(r => setCategories(r.data));
    if (isEdit) {
      api.get(`/transactions/${id}/`).then(r => {
        const d = r.data;
        setForm({
          type: d.type,
          amount: Math.abs(Number(d.amount)),
          category: d.category || '',
          date: d.date,
          description: d.description || '',
        });
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (isEdit) {
        await api.put(`/transactions/${id}/`, payload);
      } else {
        await api.post('/transactions/', payload);
      }
      navigate('/transactions');
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error saving transaction.');
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit' : 'Add'} Transaction</h1>
          <p className="subtitle">{isEdit ? 'Update transaction details' : 'Record a new transaction'}</p>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="content-card">
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="mb-3">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={set('type')}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Amount</label>
                <input type="number" className="form-control" step="0.01" min="0.01" value={form.amount} onChange={set('amount')} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={set('category')}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={form.date} onChange={set('date')} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <input type="text" className="form-control" value={form.description} onChange={set('description')} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" className="btn-primary-custom" style={{ flex: 1, justifyContent: 'center' }}>
                  {isEdit ? 'Update' : 'Add'} Transaction
                </button>
                <button type="button" className="btn-outline-custom" style={{ flex: 1, textAlign: 'center' }}
                  onClick={() => navigate('/transactions')}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
