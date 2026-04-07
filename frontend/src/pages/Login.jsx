import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <div className="content-card" style={{ marginTop: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="brand-icon" style={{ width: 48, height: 48, fontSize: '1.3rem', margin: '0 auto 12px' }}>💰</div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: '1.4rem' }}>Welcome Back</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Log in to your expense tracker</p>
          </div>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary-custom" style={{ width: '100%', justifyContent: 'center' }}>Log In</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
