import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

export default function BudgetForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category: '', amount: '', month: new Date().toISOString().slice(0, 7) });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/categories/').then(r => setCategories(r.data));
    if (isEdit) {
      api.get(`/budgets/${id}/`).then(r => {
        setForm({ category: r.data.category, amount: r.data.amount, month: r.data.month.slice(0, 7) });
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, month: form.month + '-01' };
      if (isEdit) await api.put(`/budgets/${id}/`, payload);
      else await api.post('/budgets/', payload);
      navigate('/budgets');
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error saving budget.');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit' : 'Add'} Budget</h1>
          <p className="subtitle">Set a monthly spending limit for a category</p>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="content-card">
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="mb-3">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Budget Amount</label>
                <input type="number" className="form-control" step="0.01" min="0.01" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Month</label>
                <input type="month" className="form-control" value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" className="btn-primary-custom" style={{ flex: 1, justifyContent: 'center' }}>Save Budget</button>
                <button type="button" className="btn-outline-custom" style={{ flex: 1, textAlign: 'center' }} onClick={() => navigate('/budgets')}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
