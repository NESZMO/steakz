import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

type Tab = 'overview' | 'users' | 'branches' | 'branch-detail';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#ef4444', HQ_MANAGER: '#8b5cf6', BRANCH_MANAGER: '#3b82f6',
  CHEF: '#f59e0b', CASHIER: '#10b981', WAITER: '#6366f1',
};
const STATUS_C: Record<string, string> = {
  COMPLETED: '#10b981', PENDING: '#f59e0b', IN_PROGRESS: '#3b82f6',
  CANCELLED: '#ef4444', PAID: '#8b5cf6',
};

interface Branch {
  id: string; name: string; city: string; address: string;
  phone: string; isActive: boolean;
  _count: { users: number; orders: number };
}
interface User {
  id: string; name: string; email: string; role: string;
  branch?: { name: string } | null; createdAt: string;
}
interface BranchPerf {
  branch: { id: string; name: string; city: string };
  stats: { totalOrders: number; revenue: number; averageOrderValue: number; completedOrders: number; pendingOrders: number };
  staff: User[];
  revenueByDay: { date: string; revenue: number }[];
  topSelling: { name: string; count: number }[];
  ordersByStatus: { status: string; _count: { _all: number } }[];
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [perf, setPerf] = useState<{ branch: { id: string; name: string; city: string }; stats: { totalOrders: number; revenue: number } }[]>([]);
  const [branchPerf, setBranchPerf] = useState<BranchPerf | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'WAITER', branchId: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [u, b, p] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/branches'),
        api.get('/admin/performance'),
      ]);
      setUsers(u.data);
      setBranches(b.data);
      setPerf(p.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openBranch = async (id: string) => {
    const r = await api.get(`/admin/branches/${id}/performance`);
    setBranchPerf(r.data);
    setTab('branch-detail');
  };

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) return alert('Fill all required fields');
    setSaving(true);
    await api.post('/admin/users', form);
    setSaving(false);
    setShowCreate(false);
    setForm({ name: '', email: '', password: '', role: 'WAITER', branchId: '' });
    loadAll();
  };

  const hardDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    await api.delete(`/admin/users/${id}`);
    loadAll();
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = perf.reduce((s, b) => s + (b.stats?.revenue || 0), 0);

  if (loading) {
    return (
      <div style={{ background: '#1a120b', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb77d' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, animation: 'spin 1s linear infinite', marginBottom: 16 }}>restaurant</span>
          <p style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 18 }}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#1a120b', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
        <div style={{ textAlign: 'center', background: '#271e16', padding: 40, borderRadius: 12, border: '1px solid #3d2e22', maxWidth: 400 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16 }}>error</span>
          <h2 style={{ margin: '0 0 12px', fontFamily: 'Playfair Display, serif' }}>Oops!</h2>
          <p style={{ margin: '0 0 24px', color: 'rgba(245,237,227,0.6)', lineHeight: 1.5 }}>{error}</p>
          <button onClick={loadAll} style={{ background: '#ffb77d', color: '#1a120b', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#1a120b', minHeight: '100vh', color: '#f5ede3', fontFamily: 'Inter, sans-serif' }}>

      {/* ── STICKY TOP HEADER ────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#150c06', borderBottom: '1px solid #3d2e22',
        padding: '0 36px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#ffb77d', fontWeight: 700 }}>Steakz</span>
          <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.4)', padding: '3px 10px', borderRadius: 20, border: '1px solid #3d2e22', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Admin Portal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.55)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 5 }}>account_circle</span>
            {user?.name}
          </span>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>logout</span>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── TAB BAR ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 99,
        background: '#1a120b', borderBottom: '1px solid #3d2e22',
        padding: '0 36px', display: 'flex', gap: 0,
      }}>
        {([
          ['overview', 'Overview', 'dashboard'],
          ['users', 'Users', 'group'],
          ['branches', 'Branches', 'storefront'],
        ] as const).map(([t, label, icon]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '14px 22px',
              background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #ffb77d' : '2px solid transparent',
              color: tab === t ? '#ffb77d' : 'rgba(245,237,227,0.5)',
              fontSize: 13, fontWeight: tab === t ? 600 : 400,
              cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
              transition: 'all 0.2s', marginBottom: -1,
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>
            {label}
          </button>
        ))}
        {tab === 'branch-detail' && branchPerf && (
          <button onClick={() => setTab('branches')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '14px 22px', background: 'none', border: 'none',
              borderBottom: '2px solid #ffb77d', color: '#ffb77d',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.04em', marginBottom: -1,
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            {branchPerf.branch.name}
          </button>
        )}
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main style={{ padding: '36px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, color: '#fff', margin: 0 }}>
            {tab === 'overview' && 'Dashboard Overview'}
            {tab === 'users' && 'User Management'}
            {tab === 'branches' && 'Branch Performance'}
            {tab === 'branch-detail' && `Branch: ${branchPerf?.branch.name}`}
          </h1>
        </div>

        {/* ══ OVERVIEW ══════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 28 }}>
              {[
                { label: 'Total Staff', value: users.length, icon: 'group', color: '#3b82f6' },
                { label: 'Active Branches', value: branches.filter(b => b.isActive).length, icon: 'storefront', color: '#10b981' },
                { label: 'System Admins', value: users.filter(u => u.role === 'ADMIN').length, icon: 'admin_panel_settings', color: '#ef4444' },
                { label: 'Total Revenue', value: `£${totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'payments', color: '#ffb77d' },
              ].map(s => (
                <div key={s.label} style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '22px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(245,237,227,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</p>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: s.color }}>{s.icon}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif' }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Branch performance table */}
            <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #3d2e22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#fff', fontFamily: 'Playfair Display, serif' }}>All Branches — Performance</h3>
                <span style={{ fontSize: 12, color: 'rgba(245,237,227,0.35)' }}>Click View to drill down into a branch</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a120b' }}>
                    {['Branch', 'City', 'Orders', 'Revenue', 'Staff', ''].map(h => (
                      <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontSize: 11, color: 'rgba(245,237,227,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perf.map((p, i) => {
                    const b = branches.find(x => x.id === p.branch.id);
                    return (
                      <tr key={p.branch.id} style={{ borderTop: '1px solid #3d2e22', background: i % 2 === 0 ? 'transparent' : 'rgba(255,183,125,0.02)' }}>
                        <td style={{ padding: '13px 20px', fontSize: 14, color: '#fff', fontWeight: 600 }}>{p.branch.name}</td>
                        <td style={{ padding: '13px 20px', fontSize: 14, color: 'rgba(245,237,227,0.6)' }}>{p.branch.city}</td>
                        <td style={{ padding: '13px 20px', fontSize: 14, color: '#fff' }}>{p.stats?.totalOrders ?? 0}</td>
                        <td style={{ padding: '13px 20px', fontSize: 14, color: '#ffb77d', fontWeight: 600 }}>
                          £{(p.stats?.revenue ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '13px 20px', fontSize: 14, color: 'rgba(245,237,227,0.6)' }}>{b?._count.users ?? 0}</td>
                        <td style={{ padding: '13px 20px' }}>
                          <button onClick={() => openBranch(p.branch.id)}
                            style={{ background: 'rgba(255,183,125,0.1)', border: '1px solid rgba(255,183,125,0.3)', color: '#ffb77d', padding: '6px 14px', borderRadius: 4, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ USERS ════════════════════════════════════════════════════ */}
        {tab === 'users' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(245,237,227,0.4)' }}>search</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                  style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '10px 14px 10px 40px', width: 300, fontSize: 14, outline: 'none' }} />
              </div>
              <button onClick={() => setShowCreate(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffb77d', color: '#1a120b', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
                Create User
              </button>
            </div>

            <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a120b' }}>
                    {['Name', 'Email', 'Role', 'Branch', 'Created', ''].map(h => (
                      <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontSize: 11, color: 'rgba(245,237,227,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'rgba(245,237,227,0.3)', fontSize: 14 }}>No users found</td></tr>
                  ) : filteredUsers.map((u, i) => (
                    <tr key={u.id} style={{ borderTop: '1px solid #3d2e22', background: i % 2 === 0 ? 'transparent' : 'rgba(255,183,125,0.02)' }}>
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: (ROLE_COLORS[u.role] ?? '#ffb77d') + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: ROLE_COLORS[u.role] ?? '#ffb77d' }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: 'rgba(245,237,227,0.6)' }}>{u.email}</td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ background: (ROLE_COLORS[u.role] ?? '#ffb77d') + '22', color: ROLE_COLORS[u.role] ?? '#ffb77d', border: `1px solid ${(ROLE_COLORS[u.role] ?? '#ffb77d')}44`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: 'rgba(245,237,227,0.6)' }}>{u.branch?.name ?? '—'}</td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: 'rgba(245,237,227,0.45)' }}>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                      <td style={{ padding: '13px 20px' }}>
                        <button onClick={() => hardDelete(u.id)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '6px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete_forever</span>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ BRANCHES — card grid ═══════════════════════════════════════ */}
        {tab === 'branches' && (
          <>
            <p style={{ color: 'rgba(245,237,227,0.5)', fontSize: 14, marginBottom: 24, margin: '0 0 24px' }}>
              Select any branch to view its full performance statistics and manage its staff.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {branches.map(b => {
                const p = perf.find(x => x.branch.id === b.id);
                return (
                  <div
                    key={b.id}
                    onClick={() => openBranch(b.id)}
                    style={{
                      background: '#271e16', border: '1px solid #3d2e22', borderRadius: 10,
                      padding: '24px', cursor: 'pointer', transition: 'all 0.25s', position: 'relative',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#ffb77d';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#3d2e22';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: b.isActive ? '#4caf50' : '#ef4444' }} />
                      <span style={{ fontSize: 10, color: b.isActive ? '#4caf50' : '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 34, color: '#ffb77d', display: 'block', marginBottom: 12 }}>storefront</span>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, margin: '0 0 4px', color: '#fff' }}>{b.name}</h3>
                    <p style={{ fontSize: 13, color: 'rgba(245,237,227,0.45)', margin: '0 0 18px' }}>{b.city} · {b.address}</p>
                    <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif' }}>{b._count.users}</p>
                        <p style={{ margin: 0, fontSize: 10, color: 'rgba(245,237,227,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Staff</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif' }}>{b._count.orders}</p>
                        <p style={{ margin: 0, fontSize: 10, color: 'rgba(245,237,227,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Orders</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#ffb77d', fontFamily: 'Playfair Display, serif' }}>
                          £{Math.round(p?.stats?.revenue ?? 0).toLocaleString()}
                        </p>
                        <p style={{ margin: 0, fontSize: 10, color: 'rgba(245,237,227,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Revenue</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, color: '#ffb77d', fontSize: 12 }}>
                      View Details <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_forward</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══ BRANCH DETAIL ════════════════════════════════════════════ */}
        {tab === 'branch-detail' && branchPerf && (
          <BranchDetail data={branchPerf} onDelete={hardDelete} />
        )}

      </main>

      {/* ── CREATE USER MODAL ──────────────────────────────────────── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 10, padding: 32, width: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, margin: 0, color: '#fff' }}>Create User</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'rgba(245,237,227,0.5)', cursor: 'pointer', fontSize: 22 }}>✕</button>
            </div>
            {[
              { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'John Smith' },
              { label: 'Email *', key: 'email', type: 'email', placeholder: 'john@steakz.co.uk' },
              { label: 'Password *', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,237,227,0.6)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,237,227,0.6)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Role *</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                style={{ width: '100%', background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '10px 14px', fontSize: 14, outline: 'none' }}>
                {['ADMIN','HQ_MANAGER','BRANCH_MANAGER','CHEF','CASHIER','WAITER'].map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,237,227,0.6)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Branch</label>
              <select value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}
                style={{ width: '100%', background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '10px 14px', fontSize: 14, outline: 'none' }}>
                <option value="">— No Branch —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: 'none', border: '1px solid #3d2e22', color: 'rgba(245,237,227,0.6)', borderRadius: 6, padding: '11px', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={createUser} disabled={saving} style={{ flex: 2, background: '#ffb77d', color: '#1a120b', border: 'none', borderRadius: 6, padding: '11px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {saving ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BRANCH DETAIL ─────────────────────────────────────────────────────────────
function BranchDetail({ data, onDelete }: { data: BranchPerf; onDelete: (id: string) => void }) {
  const maxRev = Math.max(...data.revenueByDay.map(d => d.revenue), 1);
  const ROLE_C: Record<string, string> = { ADMIN: '#ef4444', HQ_MANAGER: '#8b5cf6', BRANCH_MANAGER: '#3b82f6', CHEF: '#f59e0b', CASHIER: '#10b981', WAITER: '#6366f1' };
  const STATUS_C: Record<string, string> = { COMPLETED: '#10b981', PENDING: '#f59e0b', IN_PROGRESS: '#3b82f6', CANCELLED: '#ef4444', PAID: '#8b5cf6' };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Orders', value: data.stats.totalOrders, icon: 'receipt_long', color: '#3b82f6' },
          { label: 'Revenue', value: `£${(data.stats.revenue).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'payments', color: '#ffb77d' },
          { label: 'Avg Order Value', value: `£${Number(data.stats.averageOrderValue || 0).toFixed(2)}`, icon: 'trending_up', color: '#10b981' },
          { label: 'Staff', value: data.staff.length, icon: 'group', color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
            </div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 24px' }}>
          <h4 style={{ margin: '0 0 20px', fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Revenue — Last 7 Days</h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
            {data.revenueByDay.map(d => {
              const pct = (d.revenue / maxRev) * 100;
              return (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10, color: '#ffb77d' }}>£{Math.round(d.revenue)}</span>
                  <div style={{ width: '100%', background: '#3d2e22', borderRadius: 4, height: 120, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', background: 'linear-gradient(to top, #ffb77d, #ffd4a8)', borderRadius: 4, height: `${Math.max(pct, 3)}%` }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(245,237,227,0.4)' }}>{new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 24px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Orders by Status</h4>
          {data.ordersByStatus.map(s => {
            const total = data.ordersByStatus.reduce((a, x) => a + x._count._all, 0);
            const pct = total > 0 ? (s._count._all / total) * 100 : 0;
            return (
              <div key={s.status} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(245,237,227,0.65)' }}>{s.status}</span>
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{s._count._all}</span>
                </div>
                <div style={{ height: 6, background: '#3d2e22', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: STATUS_C[s.status] ?? '#ffb77d', borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #3d2e22' }}>
            <h4 style={{ margin: 0, fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Branch Staff</h4>
          </div>
          {data.staff.map((s, i) => (
            <div key={s.id} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(61,46,34,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'rgba(255,183,125,0.02)' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: '#fff' }}>{s.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(245,237,227,0.4)' }}>{s.email}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: (ROLE_C[s.role] ?? '#ffb77d') + '22', color: ROLE_C[s.role] ?? '#ffb77d', border: `1px solid ${(ROLE_C[s.role] ?? '#ffb77d')}44`, borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 600 }}>
                  {s.role.replace(/_/g, ' ')}
                </span>
                <button onClick={() => onDelete(s.id)}
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 24px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Top Selling Items</h4>
          {data.topSelling.length === 0
            ? <p style={{ color: 'rgba(245,237,227,0.3)', fontSize: 13 }}>No sales data yet</p>
            : data.topSelling.map((item, i) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#ffb77d', fontWeight: 700, width: 22 }}>#{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#fff' }}>{item.name}</span>
                <span style={{ fontSize: 12, color: 'rgba(245,237,227,0.5)' }}>{item.count}×</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}