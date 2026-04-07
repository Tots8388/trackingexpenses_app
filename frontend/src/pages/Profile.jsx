import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, txRes, budRes, recRes] = await Promise.all([
          api.get('/summary/'),
          api.get('/transactions/'),
          api.get('/budgets/'),
          api.get('/recurring/'),
        ]);
        setStats({
          ...sumRes.data,
          tx_count: txRes.data.length,
          budget_count: budRes.data.length,
          recurring_count: recRes.data.filter(r => r.is_active).length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p className="subtitle">Your account overview</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="content-card" style={{ textAlign: 'center' }}>
            <div className="user-avatar" style={{
              width: 72, height: 72, fontSize: '1.8rem',
              margin: '0 auto 16px', borderRadius: '50%',
              background: 'var(--primary-light)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            }}>
              {user.username[0].toUpperCase()}
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '1.2rem', margin: '0 0 4px' }}>
              {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>@{user.username}</p>
            {user.email && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</p>}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              Joined {new Date(user.date_joined).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
            </p>
            <button className="btn-logout" style={{ marginTop: '20px' }} onClick={logout}>Log Out</button>
          </div>
        </div>

        <div className="col-md-8">
          <div className="content-card mb-4">
            <div className="card-header-custom">
              <h3 className="card-title">Account Stats</h3>
            </div>
            <div className="row g-3">
              <div className="col-6">
                <div className="stat-card income">
                  <div className="stat-label">Total Income</div>
                  <div className="stat-value">${Number(stats?.total_income || 0).toFixed(2)}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="stat-card expense">
                  <div className="stat-label">Total Expenses</div>
                  <div className="stat-value">${Number(stats?.total_expense || 0).toFixed(2)}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="stat-card balance">
                  <div className="stat-label">Balance</div>
                  <div className="stat-value">${Number(stats?.balance || 0).toFixed(2)}</div>
                </div>
              </div>
              <div className="col-4">
                <div className="stat-card">
                  <div className="stat-label">Transactions</div>
                  <div className="stat-value" style={{ color: 'var(--text-primary)' }}>{stats?.tx_count || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="content-card">
            <div className="card-header-custom">
              <h3 className="card-title">Quick Info</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active Budgets</span>
                <span style={{ fontWeight: 600 }}>{stats?.budget_count || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active Recurring</span>
                <span style={{ fontWeight: 600 }}>{stats?.recurring_count || 0}</span>
              </div>
              {user.notification_prefs && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Weekly Summary</span>
                    <span style={{ fontWeight: 600, color: user.notification_prefs.weekly_summary ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {user.notification_prefs.weekly_summary ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Budget Alerts</span>
                    <span style={{ fontWeight: 600, color: user.notification_prefs.budget_alerts ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {user.notification_prefs.budget_alerts ? 'On' : 'Off'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
