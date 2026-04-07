import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import api from '../utils/api';
import StatCard from '../components/StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, txRes] = await Promise.all([
          api.get('/summary/'),
          api.get('/transactions/'),
        ]);
        setSummary(sumRes.data);
        setTransactions(txRes.data.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;

  // Build balance chart from transactions
  let running = 0;
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const balancePoints = sorted.map(tx => {
    running += Number(tx.amount);
    return { x: tx.date, y: running };
  });

  // Category breakdown for pie chart
  const catMap = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category_name || 'Uncategorized';
    catMap[cat] = (catMap[cat] || 0) + Math.abs(Number(t.amount));
  });

  const colors = ['#E8910C', '#2E7D32', '#C62828', '#1565C0', '#6A1B9A', '#F57F17', '#00838F', '#4E342E'];

  const lineData = {
    labels: balancePoints.map(p => p.x),
    datasets: [{
      label: 'Balance',
      data: balancePoints.map(p => p.y),
      borderColor: '#E8910C',
      backgroundColor: 'rgba(232, 145, 12, 0.1)',
      fill: true,
      tension: 0.3,
    }],
  };

  const pieData = {
    labels: Object.keys(catMap),
    datasets: [{
      data: Object.values(catMap),
      backgroundColor: colors.slice(0, Object.keys(catMap).length),
    }],
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Your financial overview</p>
        </div>
        <Link to="/transactions/add" className="btn-primary-custom">+ Add Transaction</Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3"><StatCard label="Income" value={summary.total_income} type="income" icon="📈" /></div>
        <div className="col-6 col-md-3"><StatCard label="Expenses" value={summary.total_expense} type="expense" icon="📉" /></div>
        <div className="col-6 col-md-3"><StatCard label="Balance" value={summary.balance} type="balance" icon="💰" /></div>
        <div className="col-6 col-md-3"><StatCard label="Volume" value={summary.total_volume} icon="📊" /></div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-8">
          <div className="content-card">
            <div className="card-header-custom">
              <h3 className="card-title">Balance Trend</h3>
            </div>
            {balancePoints.length > 0 ? (
              <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No data yet</p>
            )}
          </div>
        </div>
        <div className="col-md-4">
          <div className="content-card">
            <div className="card-header-custom">
              <h3 className="card-title">By Category</h3>
            </div>
            {Object.keys(catMap).length > 0 ? (
              <Doughnut data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }} />
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No expenses yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header-custom">
          <h3 className="card-title">Recent Transactions</h3>
          <Link to="/transactions" className="btn-outline-custom">View All</Link>
        </div>
        {transactions.length > 0 ? transactions.slice(0, 5).map(tx => (
          <div key={tx.id} className="transaction-item">
            <div className="transaction-left">
              <div className={`transaction-icon ${tx.type}`}>{tx.type === 'income' ? '↑' : '↓'}</div>
              <div>
                <div className="transaction-desc">{tx.description || 'No description'}</div>
                <div className="transaction-cat">{tx.category_name || 'Uncategorized'}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className={`transaction-amount ${tx.type}`}>
                {tx.type === 'income' ? '+' : '-'}${Math.abs(Number(tx.amount)).toFixed(2)}
              </div>
              <div className="transaction-date">{tx.date}</div>
            </div>
          </div>
        )) : (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No transactions yet</h3>
            <p>Add your first transaction to get started.</p>
          </div>
        )}
      </div>
    </>
  );
}
