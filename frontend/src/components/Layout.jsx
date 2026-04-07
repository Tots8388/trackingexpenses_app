import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`nav-link-item ${location.pathname === to ? 'active' : ''}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      {user && (
        <nav className="top-navbar">
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link className="brand" to="/" style={{ textDecoration: 'none' }}>
              <span className="brand-icon">💰</span>
              Expense Tracker
            </Link>
            <div className="nav-links">
              {navLink('/', 'Dashboard')}
              {navLink('/transactions', 'Transactions')}
              {navLink('/reports', 'Reports')}
              {navLink('/budgets', 'Budgets')}
              {navLink('/recurring', 'Recurring')}
              {navLink('/settings', 'Settings')}
            </div>
            <div className="nav-user">
              <button className="theme-toggle" onClick={toggleTheme} title="Toggle dark mode">
                <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
              <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="user-avatar">{user.username[0].toUpperCase()}</div>
                <span className="user-name">{user.username}</span>
              </Link>
              <button className="btn-logout" onClick={logout}>Logout</button>
            </div>
          </div>
        </nav>
      )}
      <div className="container main-content">
        {children}
      </div>
    </>
  );
}
