import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../utils/api';
import StatCard from '../components/StatCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [range, setRange] = useState('6m');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await api.get('/transactions/');
      setTransactions(data);
      setLoading(false);
    };
    load();
  }, []);

  // Filter by date range
  const now = new Date();
  const days = { '1m': 30, '3m': 90, '6m': 180, '1y': 365, 'all': 99999 }[range] || 180;
  const cutoff = new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10);
  const filtered = range === 'all' ? transactions : transactions.filter(t => t.date >= cutoff);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = Math.abs(filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0));
  const balance = totalIncome - totalExpense;

  // Monthly breakdown
  const monthlyMap = {};
  filtered.forEach(t => {
    const m = t.date.slice(0, 7);
    if (!monthlyMap[m]) monthlyMap[m] = { income: 0, expense: 0 };
    if (t.type === 'income') monthlyMap[m].income += Number(t.amount);
    else monthlyMap[m].expense += Math.abs(Number(t.amount));
  });
  const months = Object.keys(monthlyMap).sort();

  const barData = {
    labels: months.map(m => { const d = new Date(m + '-01'); return d.toLocaleDateString('en', { month: 'short', year: 'numeric' }); }),
    datasets: [
      { label: 'Income', data: months.map(m => monthlyMap[m].income), backgroundColor: '#2E7D32' },
      { label: 'Expenses', data: months.map(m => monthlyMap[m].expense), backgroundColor: '#C62828' },
    ],
  };

  // Category breakdown
  const catMap = {};
  filtered.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category_name || 'Uncategorized';
    catMap[cat] = (catMap[cat] || 0) + Math.abs(Number(t.amount));
  });
  const colors = ['#E8910C', '#2E7D32', '#C62828', '#1565C0', '#6A1B9A', '#F57F17', '#00838F', '#4E342E'];

  const pieData = {
    labels: Object.keys(catMap),
    datasets: [{ data: Object.values(catMap), backgroundColor: colors.slice(0, Object.keys(catMap).length) }],
  };

  const ranges = [['1m', '1 Month'], ['3m', '3 Months'], ['6m', '6 Months'], ['1y', '1 Year'], ['all', 'All Time']];

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="subtitle">Analyze your spending patterns</p>
        </div>
        <div className="filter-bar">
          {ranges.map(([k, label]) => (
            <button key={k} className={`filter-chip ${range === k ? 'active' : ''}`} onClick={() => setRange(k)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3"><StatCard label="Income" value={totalIncome} type="income" icon="📈" /></div>
        <div className="col-6 col-md-3"><StatCard label="Expenses" value={totalExpense} type="expense" icon="📉" /></div>
        <div className="col-6 col-md-3"><StatCard label="Balance" value={balance} type="balance" icon="💰" /></div>
        <div className="col-6 col-md-3"><StatCard label="Transactions" value={filtered.length} icon="📋" /></div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-8">
          <div className="content-card">
            <div className="card-header-custom"><h3 className="card-title">Monthly Income vs Expenses</h3></div>
            {months.length > 0 ? <Bar data={barData} options={{ responsive: true }} /> : <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No data</p>}
          </div>
        </div>
        <div className="col-md-4">
          <div className="content-card">
            <div className="card-header-custom"><h3 className="card-title">Expense Categories</h3></div>
            {Object.keys(catMap).length > 0 ? <Doughnut data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }} /> : <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No expenses</p>}
          </div>
        </div>
      </div>

      {/* Top expenses */}
      <div className="content-card">
        <div className="card-header-custom"><h3 className="card-title">Top Expenses</h3></div>
        {filtered.filter(t => t.type === 'expense').sort((a, b) => Number(a.amount) - Number(b.amount)).slice(0, 10).map(tx => (
          <div key={tx.id} className="transaction-item">
            <div className="transaction-left">
              <div className="transaction-icon expense">↓</div>
              <div>
                <div className="transaction-desc">{tx.description || 'No description'}</div>
                <div className="transaction-cat">{tx.category_name || 'Uncategorized'}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="transaction-amount expense">-${Math.abs(Number(tx.amount)).toFixed(2)}</div>
              <div className="transaction-date">{tx.date}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
