import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

interface Props {
  navItems: NavItem[];
  roleLabel: string;
}

export default function Sidebar({ navItems, roleLabel }: Props) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100%', width: 280,
      background: '#231a13', borderRight: '1px solid #554336',
      display: 'flex', flexDirection: 'column', zIndex: 50,
    }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #554336' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span className="material-symbols-outlined" style={{ color: '#ffb77d' }}>restaurant</span>
          <span style={{ fontFamily: 'Playfair Display', fontSize: 24, color: '#ffb77d', fontWeight: 700 }}>Steakz</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 4, background: '#3e332b', border: '1px solid #554336', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb77d', fontWeight: 700, fontSize: 14 }}>
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#f2dfd3', fontWeight: 600 }}>{user?.name}</p>
            <p style={{ fontSize: 10, color: '#dbc2b0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{roleLabel}</p>
            {user?.branch && <p style={{ fontSize: 10, color: '#ffb77d', opacity: 0.8 }}>{user.branch.city}</p>}
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <div className={active ? 'active-nav glow-active' : ''} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
                color: active ? '#ffb77d' : '#dbc2b0',
                transition: 'all 0.2s',
                borderLeft: active ? '2px solid #ffb77d' : '2px solid transparent',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{item.icon}</span>
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, letterSpacing: '0.05em' }}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: 16, borderTop: '1px solid #554336' }}>
        <button onClick={logout} style={{
          width: '100%', padding: '10px', background: 'transparent',
          border: '1px solid #554336', color: '#dbc2b0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 12, letterSpacing: '0.1em', transition: 'all 0.2s',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
          SIGN OUT
        </button>
      </div>
    </aside>
  );
}