import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

type Tab = 'overview' | 'orders' | 'staff' | 'inventory';

const ORDER_C: Record<string, string> = {
  PENDING: '#f59e0b', IN_PROGRESS: '#3b82f6', READY: '#8b5cf6',
  SERVED: '#10b981', COMPLETED: '#10b981', CANCELLED: '#ef4444', PAID: '#6366f1',
};

const ROLE_C: Record<string, string> = {
  CHEF: '#f59e0b', CASHIER: '#10b981', WAITER: '#6366f1', BRANCH_MANAGER: '#3b82f6'
};

export default function BranchDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    api.get('/branch-manager/overview').then(r => setOverview(r.data)).catch(() => {});
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    if (t === 'orders') api.get('/branch-manager/orders').then(r => setOrders(r.data)).catch(() => {});
    if (t === 'staff') api.get('/branch-manager/staff').then(r => setStaff(r.data)).catch(() => {});
    if (t === 'inventory') api.get('/branch-manager/inventory').then(r => setInventory(r.data)).catch(() => {});
  };

  return (
    <div style={{ background: '#1a120b', minHeight: '100vh', color: '#f5ede3', fontFamily: 'Inter, sans-serif' }}>

      {/* ── STICKY HEADER ─────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#150c06', borderBottom: '1px solid #3d2e22',
        padding: '0 36px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#ffb77d', fontWeight: 700 }}>Steakz</span>
          <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.4)', padding: '3px 10px', borderRadius: 20, border: '1px solid #3d2e22', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {overview?.branch?.name ?? 'Branch Manager'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.55)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 5 }}>account_circle</span>
            {user?.name}
          </span>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>logout</span>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── TAB BAR ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 99,
        background: '#1a120b', borderBottom: '1px solid #3d2e22',
        padding: '0 36px', display: 'flex',
      }}>
        {([
          ['overview', 'Overview', 'dashboard'],
          ['orders', 'Orders', 'receipt_long'],
          ['staff', 'Staff', 'group'],
          ['inventory', 'Inventory', 'inventory_2'],
        ] as const).map(([t, lbl, icon]) => (
          <button key={t} onClick={() => switchTab(t)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '14px 22px', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #ffb77d' : '2px solid transparent',
              color: tab === t ? '#ffb77d' : 'rgba(245,237,227,0.5)',
              fontSize: 13, fontWeight: tab === t ? 600 : 400,
              cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
              transition: 'all 0.2s', marginBottom: -1,
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <main style={{ padding: '36px', maxWidth: 1400, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, color: '#fff', margin: 0 }}>
            {tab === 'overview' && (overview?.branch?.city ? `${overview.branch.city} Branch` : 'Branch Overview')}
            {tab === 'orders' && 'Active Orders'}
            {tab === 'staff' && 'Branch Staff'}
            {tab === 'inventory' && 'Inventory Management'}
          </h1>
        </div>

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
        {tab === 'overview' && overview && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 28 }}>
              {[
                { label: "Total Orders", value: overview.totalOrders ?? 0, icon: 'receipt_long', color: '#3b82f6' },
                { label: "Total Revenue", value: `£${Number(overview.totalRevenue ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'payments', color: '#ffb77d' },
                { label: 'Staff Count', value: overview.staffCount ?? 0, icon: 'group', color: '#10b981' },
                { label: 'Low Stock Items', value: overview.lowStockCount ?? 0, icon: 'warning', color: '#ef4444' },
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

            {/* Recent orders */}
            {overview.recentOrders?.length > 0 && (
              <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #3d2e22' }}>
                  <h3 style={{ margin: 0, fontSize: 15, color: '#fff', fontFamily: 'Playfair Display, serif' }}>Recent Orders</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a120b' }}>
                      {['Order #', 'Table', 'Items', 'Total', 'Status', 'Time'].map(h => (
                        <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 11, color: 'rgba(245,237,227,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recentOrders.map((o: any, i: number) => (
                      <tr key={o.id} style={{ borderTop: '1px solid #3d2e22', background: i % 2 === 0 ? 'transparent' : 'rgba(255,183,125,0.02)' }}>
                        <td style={{ padding: '11px 18px', fontSize: 12, color: 'rgba(245,237,227,0.5)', fontFamily: 'monospace' }}>{o.id.slice(-8).toUpperCase()}</td>
                        <td style={{ padding: '11px 18px', fontSize: 13, color: '#fff' }}>Table {o.table?.tableNumber ?? '—'}</td>
                        <td style={{ padding: '11px 18px', fontSize: 13, color: 'rgba(245,237,227,0.6)' }}>{o.orderItems?.length ?? 0}</td>
                        <td style={{ padding: '11px 18px', fontSize: 13, color: '#ffb77d', fontWeight: 600 }}>£{Number(o.totalAmount ?? 0).toFixed(2)}</td>
                        <td style={{ padding: '11px 18px' }}>
                          <span style={{ background: (ORDER_C[o.status] ?? '#ffb77d') + '22', color: ORDER_C[o.status] ?? '#ffb77d', border: `1px solid ${(ORDER_C[o.status] ?? '#ffb77d')}44`, borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ padding: '11px 18px', fontSize: 12, color: 'rgba(245,237,227,0.4)' }}>
                          {new Date(o.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ══ ORDERS ════════════════════════════════════════════════════════ */}
        {tab === 'orders' && (
          <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1a120b' }}>
                  {['Order #', 'Table', 'Waiter', 'Items', 'Total', 'Status', 'Time'].map(h => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, color: 'rgba(245,237,227,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'rgba(245,237,227,0.3)', fontSize: 14 }}>No orders found</td></tr>
                ) : orders.map((o, i) => (
                  <tr key={o.id} style={{ borderTop: '1px solid #3d2e22', background: i % 2 === 0 ? 'transparent' : 'rgba(255,183,125,0.02)' }}>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: 'rgba(245,237,227,0.5)', fontFamily: 'monospace' }}>{o.id.slice(-8).toUpperCase()}</td>
                    <td style={{ padding: '12px 18px', fontSize: 13, color: '#fff' }}>Table {o.table?.tableNumber ?? '—'}</td>
                    <td style={{ padding: '12px 18px', fontSize: 13, color: 'rgba(245,237,227,0.6)' }}>{o.waiter?.name ?? '—'}</td>
                    <td style={{ padding: '12px 18px', fontSize: 13, color: 'rgba(245,237,227,0.6)' }}>{o.orderItems?.length ?? 0}</td>
                    <td style={{ padding: '12px 18px', fontSize: 13, color: '#ffb77d', fontWeight: 600 }}>£{Number(o.totalAmount ?? 0).toFixed(2)}</td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ background: (ORDER_C[o.status] ?? '#ffb77d') + '22', color: ORDER_C[o.status] ?? '#ffb77d', border: `1px solid ${(ORDER_C[o.status] ?? '#ffb77d')}44`, borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: 'rgba(245,237,227,0.4)' }}>
                      {new Date(o.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ STAFF ═════════════════════════════════════════════════════════ */}
        {tab === 'staff' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 18 }}>
            {staff.length === 0 ? (
              <p style={{ color: 'rgba(245,237,227,0.3)', fontSize: 14 }}>No staff found</p>
            ) : staff.map(s => (
              <div key={s.id} style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: (ROLE_C[s.role] ?? '#ffb77d') + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: ROLE_C[s.role] ?? '#ffb77d' }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: '#fff', fontWeight: 600 }}>{s.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(245,237,227,0.45)' }}>{s.email}</p>
                  </div>
                </div>
                <span style={{ background: (ROLE_C[s.role] ?? '#ffb77d') + '22', color: ROLE_C[s.role] ?? '#ffb77d', border: `1px solid ${(ROLE_C[s.role] ?? '#ffb77d')}44`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                  {s.role.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ══ INVENTORY ═════════════════════════════════════════════════════ */}
        {tab === 'inventory' && (
          <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1a120b' }}>
                  {['Item', 'Current Stock', 'Min Stock', 'Unit', 'Status'].map(h => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, color: 'rgba(245,237,227,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'rgba(245,237,227,0.3)', fontSize: 14 }}>No inventory items found</td></tr>
                ) : inventory.map((item, i) => {
                  const isLow = item.currentStock <= item.minimumStock;
                  return (
                    <tr key={item.id} style={{ borderTop: '1px solid #3d2e22', background: i % 2 === 0 ? 'transparent' : 'rgba(255,183,125,0.02)' }}>
                      <td style={{ padding: '12px 18px', fontSize: 14, color: '#fff', fontWeight: 500 }}>{item.itemName}</td>
                      <td style={{ padding: '12px 18px', fontSize: 14, color: isLow ? '#ef4444' : '#fff' }}>{item.currentStock}</td>
                      <td style={{ padding: '12px 18px', fontSize: 14, color: 'rgba(245,237,227,0.6)' }}>{item.minimumStock}</td>
                      <td style={{ padding: '12px 18px', fontSize: 14, color: 'rgba(245,237,227,0.6)' }}>{item.unit}</td>
                      <td style={{ padding: '12px 18px' }}>
                        {isLow ? (
                          <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                            Low Stock
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}