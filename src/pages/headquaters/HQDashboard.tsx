import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Sidebar from '../../components/Sidebar';

const NAV = [
  { label: 'Overview', icon: 'dashboard', path: '/hq' },
  { label: 'Branch Analytics', icon: 'analytics', path: '/hq/analytics' },
  { label: 'Inventory', icon: 'inventory_2', path: '/hq/inventory' },
  { label: 'Sales Reports', icon: 'bar_chart', path: '/hq/reports' },
  { label: 'Branch Management', icon: 'storefront', path: '/hq/branch-mgmt' },
  { label: 'Staff Management', icon: 'manage_accounts', path: '/hq/staff' },
];

type Tab = 'overview' | 'analytics' | 'analytics-detail' | 'inventory' | 'reports' | 'branch-mgmt' | 'staff';

interface BranchSummary { id: string; name: string; city: string; isActive: boolean; stats: { totalOrders: number; revenue: number; staffCount: number }; }
interface BranchPerf {
  branch: { id: string; name: string; city: string };
  stats: { totalOrders: number; revenue: number; averageOrderValue: number; completedOrders: number };
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; _count: { _all: number } }[];
  topSelling: { name: string; count: number }[];
  staff: { id: string; name: string; role: string; email: string }[];
}
interface InventoryItem { id: string; itemName: string; quantity: number; unit: string; minStock: number; branch: { name: string; city: string }; }
interface Branch { id: string; name: string; city: string; address: string; phone: string; email: string; isActive: boolean; _count: { users: number; orders: number }; }
interface ElevatedUser { id: string; name: string; email: string; role: string; branch?: { name: string } | null; }

export default function HQDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [selBranch, setSelBranch] = useState<BranchPerf | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invSearch, setInvSearch] = useState('');
  const [elevatedStaff, setElevatedStaff] = useState<ElevatedUser[]>([]);
  const [salesData, setSalesData] = useState<any>(null);
  const [salesFilter, setSalesFilter] = useState({ branchId: '', from: '', to: '' });
  const [reportDraft, setReportDraft] = useState('');
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', city: '', address: '', phone: '', email: '' });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'BRANCH_MANAGER', branchId: '' });
  const [saving, setSaving] = useState(false);

  const loadOverview = useCallback(async () => {
    const [ov, bp] = await Promise.all([api.get('/hq/overview'), api.get('/hq/branch-performance')]);
    setOverview(ov.data);
    setBranches(bp.data);
  }, []);

  const loadAllBranches = useCallback(async () => {
    const r = await api.get('/admin/branches');
    setAllBranches(r.data);
  }, []);

  const loadInventory = useCallback(async () => {
    const r = await api.get('/hq/inventory');
    setInventory(r.data);
  }, []);

  const loadStaff = useCallback(async () => {
    const r = await api.get('/hq/staff/elevated');
    setElevatedStaff(r.data);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/hq' || path === '/hq/') switchTab('overview');
    else if (path === '/hq/analytics') switchTab('analytics');
    else if (path === '/hq/inventory') switchTab('inventory');
    else if (path === '/hq/reports') switchTab('reports');
    else if (path === '/hq/branch-mgmt') switchTab('branch-mgmt');
    else if (path === '/hq/staff') switchTab('staff');
  }, [location.pathname]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const switchTab = (t: Tab) => {
    setTab(t);
    if (t === 'inventory') loadInventory();
    if (t === 'staff') loadStaff();
    if (t === 'branch-mgmt') loadAllBranches();
    if (t === 'analytics') loadOverview();
  };

  const handleTabClick = (t: Tab) => {
    const pathMap: Record<string, string> = {
      overview: '/hq',
      analytics: '/hq/analytics',
      inventory: '/hq/inventory',
      reports: '/hq/reports',
      'branch-mgmt': '/hq/branch-mgmt',
      staff: '/hq/staff',
    };
    if (pathMap[t]) navigate(pathMap[t]);
    else switchTab(t);
  };

  const openBranchDetail = async (id: string) => {
    const r = await api.get(`/hq/branches/${id}/performance`);
    setSelBranch(r.data);
    setTab('analytics-detail');
  };

  const loadSales = async () => {
    const params = new URLSearchParams();
    if (salesFilter.branchId) params.set('branchId', salesFilter.branchId);
    if (salesFilter.from) params.set('from', salesFilter.from);
    if (salesFilter.to) params.set('to', salesFilter.to);
    const r = await api.get(`/hq/reports/sales-data?${params.toString()}`);
    setSalesData(r.data);
  };

  const createBranch = async () => {
    if (!branchForm.name || !branchForm.city || !branchForm.address) return alert('Fill required fields');
    setSaving(true);
    await api.post('/hq/branches', branchForm);
    setSaving(false);
    setShowCreateBranch(false);
    setBranchForm({ name: '', city: '', address: '', phone: '', email: '' });
    loadAllBranches();
    loadOverview();
  };

  const deleteBranch = async (id: string) => {
    if (!window.confirm('Permanently delete this branch? All staff will be unassigned.')) return;
    await api.delete(`/hq/branches/${id}`);
    loadAllBranches();
    loadOverview();
  };

  const createStaff = async () => {
    if (!staffForm.name || !staffForm.email || !staffForm.password) return alert('Fill required fields');
    setSaving(true);
    await api.post('/hq/staff', staffForm);
    setSaving(false);
    setShowCreateStaff(false);
    setStaffForm({ name: '', email: '', password: '', role: 'BRANCH_MANAGER', branchId: '' });
    loadStaff();
  };

  const deleteStaff = async (id: string) => {
    if (!window.confirm('Permanently delete this staff member?')) return;
    await api.delete(`/hq/staff/${id}`);
    loadStaff();
  };

  const maxRev = selBranch ? Math.max(...selBranch.revenueByDay.map(d => d.revenue), 1) : 1;
  const ROLE_COLORS: Record<string, string> = { ADMIN: '#ef4444', HQ_MANAGER: '#8b5cf6', BRANCH_MANAGER: '#3b82f6' };
  const STATUS_C: Record<string, string> = { COMPLETED: '#10b981', PENDING: '#f59e0b', IN_PROGRESS: '#3b82f6', CANCELLED: '#ef4444', PAID: '#8b5cf6' };

  const filteredInv = inventory.filter(i =>
    i.itemName.toLowerCase().includes(invSearch.toLowerCase()) ||
    i.branch.name.toLowerCase().includes(invSearch.toLowerCase())
  );

  const LOW_STOCK = inventory.filter(i => i.quantity <= i.minStock);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#1a120b' }}>
      <Sidebar navItems={NAV} roleLabel="HQ Manager" />
      <main style={{ flex: 1, padding: '32px 36px', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: '#ffb77d', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px' }}>Headquarters</p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: '#fff', margin: 0 }}>
            {tab === 'overview' && 'Global Overview'}
            {tab === 'analytics' && 'Branch Analytics'}
            {tab === 'analytics-detail' && `Analytics: ${selBranch?.branch.name}`}
            {tab === 'inventory' && 'Inventory Overview'}
            {tab === 'reports' && 'Sales Reports'}
            {tab === 'branch-mgmt' && 'Branch Management'}
            {tab === 'staff' && 'Staff Management'}
          </h1>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: '1px solid #3d2e22', overflowX: 'auto' }}>
          {([
            ['overview', 'Overview', 'dashboard'],
            ['analytics', 'Branch Analytics', 'analytics'],
            ['inventory', 'Inventory', 'inventory_2'],
            ['reports', 'Sales Reports', 'bar_chart'],
            ['branch-mgmt', 'Branches', 'storefront'],
            ['staff', 'Staff', 'manage_accounts'],
          ] as const).map(([t, lbl, icon]) => (
            <button key={t} onClick={() => switchTab(t as Tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 18px', background: 'none', border: 'none',
                borderBottom: (tab === t || (tab === 'analytics-detail' && t === 'analytics')) ? '2px solid #ffb77d' : '2px solid transparent',
                color: (tab === t || (tab === 'analytics-detail' && t === 'analytics')) ? '#ffb77d' : 'rgba(245,237,227,0.5)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em',
                textTransform: 'uppercase', whiteSpace: 'nowrap', marginBottom: -1, transition: 'all 0.2s',
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
              {lbl}
            </button>
          ))}
        </div>

        {/* ══════════════════ OVERVIEW ══════════════════ */}
        {tab === 'overview' && overview && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 28 }}>
              {[
                { label: 'Total Branches', value: overview.totalBranches, icon: 'storefront', color: '#3b82f6' },
                { label: 'Total Staff', value: overview.totalUsers, icon: 'group', color: '#10b981' },
                { label: 'All-Time Revenue', value: `£${(overview.totalRevenue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'payments', color: '#ffb77d' },
                { label: 'Orders Today', value: overview.ordersToday, icon: 'receipt_long', color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: s.color }}>{s.icon}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif' }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Branch comparison bar chart */}
            <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '24px', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#fff', margin: '0 0 24px' }}>Revenue by Branch</h3>
              {(() => {
                const maxR = Math.max(...branches.map(b => b.stats?.revenue || 0), 1);
                return branches.map(b => (
                  <div key={b.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{b.name} <span style={{ color: 'rgba(245,237,227,0.4)', fontWeight: 400 }}>({b.city})</span></span>
                      <span style={{ fontSize: 13, color: '#ffb77d', fontWeight: 600 }}>£{(b.stats?.revenue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ height: 10, background: '#3d2e22', borderRadius: 5 }}>
                      <div style={{ height: '100%', width: `${((b.stats?.revenue || 0) / maxR) * 100}%`, background: 'linear-gradient(to right, #ffb77d, #ffd4a8)', borderRadius: 5, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.35)', marginTop: 2, display: 'block' }}>{b.stats?.totalOrders || 0} orders · {b.stats?.staffCount || 0} staff</span>
                  </div>
                ));
              })()}
            </div>
          </>
        )}

        {/* ══════════════════ BRANCH ANALYTICS (picker) ══════════════════ */}
        {tab === 'analytics' && (
          <>
            <p style={{ color: 'rgba(245,237,227,0.5)', fontSize: 14, marginBottom: 24 }}>
              Select a branch below to view its detailed graphical performance analytics.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
              {branches.map(b => (
                <div
                  key={b.id}
                  onClick={() => openBranchDetail(b.id)}
                  style={{
                    background: '#271e16', border: '1px solid #3d2e22', borderRadius: 10, padding: '22px',
                    cursor: 'pointer', transition: 'all 0.25s', position: 'relative',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#ffb77d';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#3d2e22';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ position: 'absolute', top: 14, right: 14 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.isActive ? '#4caf50' : '#ef4444' }} />
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#ffb77d', display: 'block', marginBottom: 12 }}>storefront</span>
                  <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, margin: '0 0 4px', color: '#fff' }}>{b.name}</h4>
                  <p style={{ fontSize: 13, color: 'rgba(245,237,227,0.45)', margin: '0 0 18px' }}>{b.city}</p>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div>
                      <p style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>£{Math.round(b.stats?.revenue || 0).toLocaleString()}</p>
                      <p style={{ margin: 0, fontSize: 10, color: 'rgba(245,237,227,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Revenue</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>{b.stats?.totalOrders || 0}</p>
                      <p style={{ margin: 0, fontSize: 10, color: 'rgba(245,237,227,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Orders</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, color: '#ffb77d', fontSize: 12 }}>
                    View Analytics <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_forward</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════ ANALYTICS DETAIL ══════════════════ */}
        {tab === 'analytics-detail' && selBranch && (
          <>
            <button onClick={() => setTab('analytics')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #3d2e22', color: 'rgba(245,237,227,0.6)', padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer', marginBottom: 24 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
              Back to All Branches
            </button>

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Orders', value: selBranch.stats.totalOrders, icon: 'receipt_long', color: '#3b82f6' },
                { label: 'Revenue', value: `£${(selBranch.stats.revenue).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'payments', color: '#ffb77d' },
                { label: 'Avg Order Value', value: `£${Number(selBranch.stats.averageOrderValue || 0).toFixed(2)}`, icon: 'trending_up', color: '#10b981' },
                { label: 'Completed', value: selBranch.stats.completedOrders, icon: 'check_circle', color: '#8b5cf6' },
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
              {/* Revenue chart */}
              <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 24px' }}>
                <h4 style={{ margin: '0 0 20px', fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Revenue — Last 7 Days</h4>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
                  {selBranch.revenueByDay.map(d => {
                    const pct = maxRev > 0 ? (d.revenue / maxRev) * 100 : 0;
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

              {/* Order status donut-style */}
              <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 24px' }}>
                <h4 style={{ margin: '0 0 18px', fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>By Status</h4>
                {selBranch.ordersByStatus.map(s => {
                  const total = selBranch.ordersByStatus.reduce((a, x) => a + x._count._all, 0);
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

            {/* Top Selling + Staff side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 24px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Top Selling Items</h4>
                {selBranch.topSelling.slice(0, 5).map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#ffb77d', fontWeight: 700, fontSize: 13, width: 22 }}>#{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#fff' }}>{item.name}</span>
                    <span style={{ fontSize: 12, color: 'rgba(245,237,227,0.5)' }}>{item.count}×</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 24px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Branch Staff</h4>
                {selBranch.staff.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: '#fff' }}>{s.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(245,237,227,0.4)' }}>{s.email}</p>
                    </div>
                    <span style={{ background: (ROLE_COLORS[s.role] ?? '#ffb77d') + '22', color: ROLE_COLORS[s.role] ?? '#ffb77d', border: `1px solid ${(ROLE_COLORS[s.role] ?? '#ffb77d')}44`, borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 600 }}>
                      {s.role.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════ INVENTORY ══════════════════ */}
        {tab === 'inventory' && (
          <>
            {LOW_STOCK.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: 20 }}>warning</span>
                <span style={{ fontSize: 14, color: '#ef4444' }}><strong>{LOW_STOCK.length} items</strong> at or below minimum stock level</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(245,237,227,0.4)' }}>search</span>
                <input value={invSearch} onChange={e => setInvSearch(e.target.value)} placeholder="Search by item or branch…"
                  style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '10px 14px 10px 40px', width: 300, fontSize: 14, outline: 'none' }} />
              </div>
              <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.4)' }}>{filteredInv.length} items across all branches</span>
            </div>
            <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a120b' }}>
                    {['Item', 'Branch', 'Qty', 'Unit', 'Min Stock', 'Status'].map(h => (
                      <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, color: 'rgba(245,237,227,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInv.map((item, i) => {
                    const low = item.quantity <= item.minStock;
                    return (
                      <tr key={item.id} style={{ borderTop: '1px solid #3d2e22', background: i % 2 === 0 ? 'transparent' : 'rgba(255,183,125,0.02)' }}>
                        <td style={{ padding: '12px 18px', fontSize: 13, color: '#fff', fontWeight: 500 }}>{item.itemName}</td>
                        <td style={{ padding: '12px 18px', fontSize: 13, color: 'rgba(245,237,227,0.65)' }}>{item.branch.name} <span style={{ color: 'rgba(245,237,227,0.35)' }}>({item.branch.city})</span></td>
                        <td style={{ padding: '12px 18px', fontSize: 13, color: low ? '#ef4444' : '#fff', fontWeight: low ? 700 : 400 }}>{item.quantity}</td>
                        <td style={{ padding: '12px 18px', fontSize: 13, color: 'rgba(245,237,227,0.5)' }}>{item.unit}</td>
                        <td style={{ padding: '12px 18px', fontSize: 13, color: 'rgba(245,237,227,0.5)' }}>{item.minStock}</td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{ background: low ? 'rgba(239,68,68,0.15)' : 'rgba(76,175,80,0.15)', color: low ? '#ef4444' : '#4caf50', border: `1px solid ${low ? 'rgba(239,68,68,0.3)' : 'rgba(76,175,80,0.3)'}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                            {low ? 'Low Stock' : 'Adequate'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══════════════════ SALES REPORTS ══════════════════ */}
        {tab === 'reports' && (
          <>
            {/* Filters */}
            <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 24px', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: '#fff', margin: '0 0 16px' }}>Report Filters</h3>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,237,227,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Branch</label>
                  <select value={salesFilter.branchId} onChange={e => setSalesFilter(p => ({ ...p, branchId: e.target.value }))}
                    style={{ background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '9px 14px', fontSize: 13, outline: 'none' }}>
                    <option value="">All Branches</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,237,227,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>From</label>
                  <input type="date" value={salesFilter.from} onChange={e => setSalesFilter(p => ({ ...p, from: e.target.value }))}
                    style={{ background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '9px 14px', fontSize: 13, outline: 'none', colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,237,227,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>To</label>
                  <input type="date" value={salesFilter.to} onChange={e => setSalesFilter(p => ({ ...p, to: e.target.value }))}
                    style={{ background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '9px 14px', fontSize: 13, outline: 'none', colorScheme: 'dark' }} />
                </div>
                <button onClick={loadSales}
                  style={{ background: '#ffb77d', color: '#1a120b', border: 'none', borderRadius: 6, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span>
                  Generate Report
                </button>
              </div>
            </div>

            {salesData && (
              <>
                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'Total Revenue', value: `£${(salesData.summary?.totalRevenue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'payments', color: '#ffb77d' },
                    { label: 'Total Orders', value: salesData.summary?.totalOrders || 0, icon: 'receipt_long', color: '#3b82f6' },
                    { label: 'Avg Order Value', value: `£${Number(salesData.summary?.avgOrderValue || 0).toFixed(2)}`, icon: 'trending_up', color: '#10b981' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '18px 22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif' }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Daily chart */}
                {salesData.dailyChart?.length > 0 && (
                  <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 24px', marginBottom: 20 }}>
                    <h4 style={{ margin: '0 0 20px', fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Daily Revenue</h4>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, overflowX: 'auto' }}>
                      {salesData.dailyChart.map((d: any) => {
                        const maxD = Math.max(...salesData.dailyChart.map((x: any) => x.revenue), 1);
                        const pct = (d.revenue / maxD) * 100;
                        return (
                          <div key={d.date} style={{ flex: '0 0 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 9, color: '#ffb77d' }}>£{Math.round(d.revenue)}</span>
                            <div style={{ width: '100%', background: '#3d2e22', borderRadius: 3, height: 100, display: 'flex', alignItems: 'flex-end' }}>
                              <div style={{ width: '100%', background: 'linear-gradient(to top, #ffb77d, #ffd4a8)', borderRadius: 3, height: `${Math.max(pct, 3)}%` }} />
                            </div>
                            <span style={{ fontSize: 9, color: 'rgba(245,237,227,0.35)' }}>{new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* By branch */}
                {salesData.byBranch?.length > 1 && (
                  <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #3d2e22' }}>
                      <h4 style={{ margin: 0, fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Revenue by Branch</h4>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ background: '#1a120b' }}>
                        {['Branch', 'City', 'Orders', 'Revenue', 'Avg Value'].map(h => (
                          <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 11, color: 'rgba(245,237,227,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {salesData.byBranch.map((row: any, i: number) => (
                          <tr key={row.branchId} style={{ borderTop: '1px solid #3d2e22', background: i % 2 === 0 ? 'transparent' : 'rgba(255,183,125,0.02)' }}>
                            <td style={{ padding: '12px 18px', fontSize: 13, color: '#fff', fontWeight: 500 }}>{row.branchName}</td>
                            <td style={{ padding: '12px 18px', fontSize: 13, color: 'rgba(245,237,227,0.6)' }}>{row.city}</td>
                            <td style={{ padding: '12px 18px', fontSize: 13, color: '#fff' }}>{row.totalOrders}</td>
                            <td style={{ padding: '12px 18px', fontSize: 13, color: '#ffb77d', fontWeight: 600 }}>£{(row.revenue).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '12px 18px', fontSize: 13, color: 'rgba(245,237,227,0.7)' }}>£{Number(row.avgValue || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Report draft */}
                <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 24px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Draft Report Notes</h4>
                  <textarea
                    value={reportDraft}
                    onChange={e => setReportDraft(e.target.value)}
                    placeholder="Add executive summary, observations, or action items here…"
                    rows={6}
                    style={{ width: '100%', background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '12px 14px', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button
                      onClick={() => alert('Report draft saved (feature: integrate with SalesReport model via POST /hq/reports/save)')}
                      style={{ background: '#ffb77d', color: '#1a120b', border: 'none', borderRadius: 6, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>
                      Save Draft
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════════ BRANCH MANAGEMENT ══════════════════ */}
        {tab === 'branch-mgmt' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <button onClick={() => setShowCreateBranch(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffb77d', color: '#1a120b', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_business</span>
                Add Branch
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
              {allBranches.map(b => (
                <div key={b.id} style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 10, padding: '22px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: b.isActive ? '#4caf50' : '#ef4444' }} />
                    <span style={{ fontSize: 10, color: b.isActive ? '#4caf50' : '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{b.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#ffb77d', marginBottom: 10, display: 'block' }}>storefront</span>
                  <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, margin: '0 0 4px', color: '#fff' }}>{b.name}</h4>
                  <p style={{ fontSize: 12, color: 'rgba(245,237,227,0.45)', margin: '0 0 4px' }}>{b.city}</p>
                  <p style={{ fontSize: 12, color: 'rgba(245,237,227,0.4)', margin: '0 0 12px' }}>{b.address}</p>
                  {b.phone && <p style={{ fontSize: 12, color: 'rgba(245,237,227,0.4)', margin: '0 0 16px' }}>{b.phone}</p>}
                  <div style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif' }}>{b._count?.users ?? 0}</p>
                      <p style={{ margin: 0, fontSize: 10, color: 'rgba(245,237,227,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Staff</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif' }}>{b._count?.orders ?? 0}</p>
                      <p style={{ margin: 0, fontSize: 10, color: 'rgba(245,237,227,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Orders</p>
                    </div>
                  </div>
                  <button onClick={() => deleteBranch(b.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '7px 14px', borderRadius: 5, fontSize: 12, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete_forever</span>
                    Delete Branch
                  </button>
                </div>
              ))}
            </div>

            {showCreateBranch && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 10, padding: 32, width: 460 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, margin: 0, color: '#fff' }}>Add New Branch</h3>
                    <button onClick={() => setShowCreateBranch(false)} style={{ background: 'none', border: 'none', color: 'rgba(245,237,227,0.5)', cursor: 'pointer', fontSize: 22 }}>✕</button>
                  </div>
                  {[
                    { label: 'Branch Name *', key: 'name', placeholder: 'Steakz Birmingham' },
                    { label: 'City *', key: 'city', placeholder: 'Birmingham' },
                    { label: 'Address *', key: 'address', placeholder: '15 Broad Street, B1 2AA' },
                    { label: 'Phone', key: 'phone', placeholder: '+44 121 000 0000' },
                    { label: 'Email', key: 'email', placeholder: 'birmingham@steakz.co.uk' },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,237,227,0.6)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{f.label}</label>
                      <input
                        value={(branchForm as any)[f.key]}
                        onChange={e => setBranchForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{ width: '100%', background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button onClick={() => setShowCreateBranch(false)} style={{ flex: 1, background: 'none', border: '1px solid #3d2e22', color: 'rgba(245,237,227,0.6)', borderRadius: 6, padding: 11, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                    <button onClick={createBranch} disabled={saving} style={{ flex: 2, background: '#ffb77d', color: '#1a120b', border: 'none', borderRadius: 6, padding: 11, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      {saving ? 'Creating…' : 'Create Branch'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════ STAFF MANAGEMENT ══════════════════ */}
        {tab === 'staff' && (
          <>
            <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ color: '#8b5cf6', fontSize: 18 }}>info</span>
              <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.7)' }}>
                HQ Managers can add or remove <strong style={{ color: '#fff' }}>System Admins</strong> and <strong style={{ color: '#fff' }}>Branch Managers</strong> only. Branch-level staff are managed by Branch Managers.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <button onClick={() => setShowCreateStaff(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffb77d', color: '#1a120b', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
                Add Staff Member
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
              {/* Admins */}
              <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #3d2e22', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ef4444' }}>admin_panel_settings</span>
                  <h4 style={{ margin: 0, fontSize: 14, color: '#fff', fontFamily: 'Playfair Display, serif' }}>System Admins</h4>
                  <span style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                    {elevatedStaff.filter(s => s.role === 'ADMIN').length}
                  </span>
                </div>
                {elevatedStaff.filter(s => s.role === 'ADMIN').map(s => (
                  <div key={s.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(61,46,34,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, color: '#fff', fontWeight: 500 }}>{s.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(245,237,227,0.45)' }}>{s.email}</p>
                    </div>
                    <button onClick={() => deleteStaff(s.id)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '5px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>
                ))}
                {elevatedStaff.filter(s => s.role === 'ADMIN').length === 0 && (
                  <div style={{ padding: '24px 20px', textAlign: 'center', color: 'rgba(245,237,227,0.3)', fontSize: 13 }}>No admins found</div>
                )}
              </div>

              {/* Branch Managers */}
              <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #3d2e22', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#3b82f6' }}>manage_accounts</span>
                  <h4 style={{ margin: 0, fontSize: 14, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Branch Managers</h4>
                  <span style={{ marginLeft: 'auto', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                    {elevatedStaff.filter(s => s.role === 'BRANCH_MANAGER').length}
                  </span>
                </div>
                {elevatedStaff.filter(s => s.role === 'BRANCH_MANAGER').map(s => (
                  <div key={s.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(61,46,34,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, color: '#fff', fontWeight: 500 }}>{s.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(245,237,227,0.45)' }}>{s.email}</p>
                      {s.branch && <p style={{ margin: 0, fontSize: 11, color: '#3b82f6' }}>{s.branch.name}</p>}
                    </div>
                    <button onClick={() => deleteStaff(s.id)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '5px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>
                ))}
                {elevatedStaff.filter(s => s.role === 'BRANCH_MANAGER').length === 0 && (
                  <div style={{ padding: '24px 20px', textAlign: 'center', color: 'rgba(245,237,227,0.3)', fontSize: 13 }}>No branch managers found</div>
                )}
              </div>
            </div>

            {/* Create Staff Modal */}
            {showCreateStaff && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 10, padding: 32, width: 460 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, margin: 0, color: '#fff' }}>Add Staff Member</h3>
                    <button onClick={() => setShowCreateStaff(false)} style={{ background: 'none', border: 'none', color: 'rgba(245,237,227,0.5)', cursor: 'pointer', fontSize: 22 }}>✕</button>
                  </div>
                  {[
                    { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Jane Smith' },
                    { label: 'Email *', key: 'email', type: 'email', placeholder: 'jane@steakz.co.uk' },
                    { label: 'Password *', key: 'password', type: 'password', placeholder: '••••••••' },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,237,227,0.6)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{f.label}</label>
                      <input
                        type={f.type}
                        value={(staffForm as any)[f.key]}
                        onChange={e => setStaffForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{ width: '100%', background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,237,227,0.6)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Role *</label>
                    <select value={staffForm.role} onChange={e => setStaffForm(p => ({ ...p, role: e.target.value }))}
                      style={{ width: '100%', background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '10px 14px', fontSize: 14, outline: 'none' }}>
                      <option value="BRANCH_MANAGER">Branch Manager</option>
                      <option value="ADMIN">System Admin</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,237,227,0.6)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Assign Branch</label>
                    <select value={staffForm.branchId} onChange={e => setStaffForm(p => ({ ...p, branchId: e.target.value }))}
                      style={{ width: '100%', background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '10px 14px', fontSize: 14, outline: 'none' }}>
                      <option value="">— No Branch —</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setShowCreateStaff(false)} style={{ flex: 1, background: 'none', border: '1px solid #3d2e22', color: 'rgba(245,237,227,0.6)', borderRadius: 6, padding: 11, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                    <button onClick={createStaff} disabled={saving} style={{ flex: 2, background: '#ffb77d', color: '#1a120b', border: 'none', borderRadius: 6, padding: 11, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      {saving ? 'Creating…' : 'Add Staff Member'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
