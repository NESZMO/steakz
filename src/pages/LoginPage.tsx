import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const ROLE_ROUTES: Record<string, string> = {
    ADMIN: '/admin',
    HQ_MANAGER: '/hq',
    BRANCH_MANAGER: '/branch',
    CHEF: '/chef',
    CASHIER: '/cashier',
    WAITER: '/waiter',
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(ROLE_ROUTES[loggedInUser.role] || '/dashboard', { replace: true });
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a120b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <span className="material-symbols-outlined" style={{ color: '#ffb77d', fontSize: 32 }}>restaurant</span>
            <span style={{ fontFamily: 'Playfair Display', fontSize: 32, color: '#ffb77d', fontWeight: 700 }}>Steakz</span>
          </Link>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 24, color: '#f2dfd3', marginBottom: 8 }}>Staff Portal</h1>
          <p style={{ color: '#dbc2b0', fontSize: 13 }}>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#231a13', border: '1px solid #554336', padding: 32 }}>
          {error && (
            <div style={{ background: 'rgba(255,180,171,0.1)', border: '1px solid #ffb4ab', color: '#ffb4ab', padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#dbc2b0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="your@steakz.co.uk"
              style={{ width: '100%', background: '#1a120b', border: '1px solid #554336', color: '#f2dfd3', padding: '12px 16px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#dbc2b0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: '100%', background: '#1a120b', border: '1px solid #554336', color: '#f2dfd3', padding: '12px 16px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', background: '#d97707', color: '#432100',
            border: 'none', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em',
            textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ marginTop: 24, padding: '16px', background: '#1a120b', border: '1px solid #554336', fontSize: 11, color: '#dbc2b0' }}>
            <p style={{ fontWeight: 700, marginBottom: 8, color: '#ffb77d' }}>Demo Credentials:</p>
            <p>Admin: admin@steakz.co.uk / Admin@123</p>
            <p>HQ: hq@steakz.co.uk / Password@123</p>
            <p>Manager: manchester.manager@steakz.co.uk / Password@123</p>
            <p>Chef: manchester.chef@steakz.co.uk / Password@123</p>
            <p>Cashier: manchester.cashier@steakz.co.uk / Password@123</p>
            <p>Waiter: manchester.waiter1@steakz.co.uk / Password@123</p>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ color: '#dbc2b0', fontSize: 12, textDecoration: 'none' }}>← Back to Homepage</Link>
        </div>
      </div>
    </div>
  );
}