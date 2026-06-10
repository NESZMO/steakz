import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(26,18,11,0.96)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #554336',
    }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: '#ffb77d' }}>restaurant</span>
          <span style={{ fontFamily: 'Playfair Display', fontSize: 22, color: '#ffb77d', fontWeight: 700 }}>Steakz</span>
        </Link>
        <Link to="/login" style={{
          padding: '10px 28px', border: '1px solid #ffb77d', color: '#ffb77d',
          textDecoration: 'none', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'all 0.2s',
        }}>
          Staff Login
        </Link>
      </div>
    </header>
  );
}