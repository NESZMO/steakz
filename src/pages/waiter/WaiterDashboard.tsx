import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// ── types ────────────────────────────────────────────────────────────────────
interface TableRow {
  id: string;
  tableNumber: number;   // schema field name
  capacity: number;
  status: string;
  orders: ActiveOrder[];
}
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  isActive: boolean;     // schema field name
}
interface CartItem { menuItem: MenuItem; quantity: number; }
interface ActiveOrder {
  id: string;
  status: string;
  totalAmount: number;   // schema field name
  createdAt: string;
  notes?: string;
  table: { tableNumber: number };  // schema field name
  user:  { name: string };
  orderItems: {
    id?: string;
    quantity: number;
    unitPrice: number;   // schema field name
    menuItem: { name: string; price: number };
  }[];
}

// ── constants ────────────────────────────────────────────────────────────────
const TABLE_STATUS_META: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  AVAILABLE: { color: '#4caf50', bg: 'rgba(76,175,80,0.12)',   label: 'Available', icon: 'check_circle'     },
  OCCUPIED:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'Occupied',  icon: 'people'           },
  RESERVED:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Reserved',  icon: 'event_available'  },
  CLEANING:  { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  label: 'Cleaning',  icon: 'cleaning_services'},
};
const ORDER_STATUS_META: Record<string, { color: string; label: string }> = {
  PENDING:     { color: '#f59e0b', label: 'Waiting for Chef'  },
  CONFIRMED:   { color: '#f59e0b', label: 'Confirmed'         },
  PREPARING:   { color: '#3b82f6', label: 'Being Prepared'    },
  IN_PROGRESS: { color: '#3b82f6', label: 'Being Cooked'      },
  READY:       { color: '#10b981', label: 'Ready to Serve'    },
  SERVED:      { color: '#8b5cf6', label: 'Served'            },
  COMPLETED:   { color: '#10b981', label: 'Completed'         },
};
const MENU_CATS = ['STARTER', 'MAIN', 'SIDE', 'DESSERT', 'DRINK', 'SPECIAL'] as const;
const CAT_ICONS: Record<string, string> = {
  STARTER: 'restaurant',  MAIN: 'lunch_dining', SIDE: 'set_meal',
  DESSERT: 'cake',        DRINK: 'local_bar',   SPECIAL: 'auto_awesome',
};
const CAT_LABELS: Record<string, string> = {
  STARTER: 'Starters', MAIN: 'Mains', SIDE: 'Sides',
  DESSERT: 'Desserts', DRINK: 'Drinks', SPECIAL: 'Specials',
};

type View = 'tables' | 'new-order' | 'orders';

// ── component ────────────────────────────────────────────────────────────────
export default function WaiterDashboard() {
  const { user, logout } = useAuth();

  const [view, setView]                   = useState<View>('tables');
  const [tables, setTables]               = useState<TableRow[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableRow | null>(null);
  const [menuItems, setMenuItems]         = useState<MenuItem[]>([]);
  const [menuCat, setMenuCat]             = useState<string>('MAIN');
  const [cart, setCart]                   = useState<CartItem[]>([]);
  const [notes, setNotes]                 = useState('');
  const [orders, setOrders]               = useState<ActiveOrder[]>([]);
  const [placing, setPlacing]             = useState(false);
  const [serving, setServing]             = useState<string | null>(null);
  const [successMsg, setSuccessMsg]       = useState('');
  const [branchError, setBranchError]     = useState('');
  const [tablesError, setTablesError]     = useState('');

  // ── data loaders ─────────────────────────────────────────────────────────
  const loadTables = useCallback(async () => {
    setTablesError('');
    try {
      const r = await api.get('/waiter/tables');
      setTables(r.data);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to load tables';
      if (err?.response?.status === 400) {
        setBranchError(msg);
      } else {
        setTablesError(msg);
      }
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const r = await api.get('/waiter/orders');
      setOrders(r.data);
    } catch { /* silent */ }
  }, []);

  const loadMenu = useCallback(async () => {
    try {
      const r = await api.get('/waiter/menu');
      setMenuItems(r.data);
    } catch { /* silent */ }
  }, []);

  // Initial load + view-change loads
  useEffect(() => { loadTables(); }, [loadTables]);

  useEffect(() => {
    if (view === 'tables')    loadTables();
    if (view === 'new-order') { if (!menuItems.length) loadMenu(); }
    if (view === 'orders')    loadOrders();
  }, [view]); // eslint-disable-line

  // Auto-refresh every 15s
  useEffect(() => {
    const id = setInterval(() => {
      if (view === 'tables') loadTables();
      if (view === 'orders') loadOrders();
    }, 8000);
    return () => clearInterval(id);
  }, [view, loadTables, loadOrders]);

  // ── cart helpers ─────────────────────────────────────────────────────────
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(c => c.menuItem.id === id ? { ...c, quantity: c.quantity + delta } : c)
          .filter(c => c.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((s, c) => s + Number(c.menuItem.price) * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const inCart    = (id: string) => cart.find(c => c.menuItem.id === id)?.quantity ?? 0;

  // ── select a table ────────────────────────────────────────────────────────
  const selectTable = (t: TableRow) => {
    if (t.status !== 'AVAILABLE') return;
    setSelectedTable(t);
    setCart([]);
    setNotes('');
    setMenuCat('MAIN');
    setView('new-order');
  };

  // ── place order ───────────────────────────────────────────────────────────
  const placeOrder = async () => {
    if (!selectedTable || !cart.length || placing) return;
    setPlacing(true);
    try {
      await api.post('/waiter/orders', {
        tableId: selectedTable.id,
        items:   cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity })),
        notes:   notes || undefined,
      });
      flash(`✅ Order placed — Table ${selectedTable.tableNumber} sent to the kitchen!`);
      setView('tables');
      loadTables();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Failed to place order');
    }
    setPlacing(false);
  };

  // ── mark served ───────────────────────────────────────────────────────────
  const markServed = async (orderId: string) => {
    setServing(orderId);
    try {
      await api.put(`/waiter/orders/${orderId}/serve`);
      flash('✅ Order marked as served!');
      loadOrders();
      loadTables();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Cannot mark as served — chef has not finished yet');
    }
    setServing(null);
  };

  // ── free a table ──────────────────────────────────────────────────────────
  const freeTable = async (tableId: string, tableNumber: number) => {
    if (!window.confirm(`Mark Table ${tableNumber} as Available? Only do this after the customer has left.`)) return;
    await api.put(`/waiter/tables/${tableId}/status`, { status: 'AVAILABLE' });
    loadTables();
  };

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const visibleMenu = menuItems.filter(m => m.category === menuCat);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#1a120b', minHeight: '100vh', color: '#f5ede3', fontFamily: 'Inter, sans-serif' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#150c06', borderBottom: '1px solid #3d2e22',
        padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#ffb77d', fontWeight: 700 }}>Steakz</span>
          <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.4)', padding: '3px 10px', borderRadius: 20, border: '1px solid #3d2e22', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Waiter Station
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 6px #4caf50' }} />
            <span style={{ fontSize: 11, color: '#4caf50' }}>Live</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.5)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 4 }}>account_circle</span>
            {user?.name}
          </span>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>logout</span>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── TAB BAR ────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 99,
        background: '#1a120b', borderBottom: '1px solid #3d2e22',
        padding: '0 32px', display: 'flex',
      }}>
        {([
          ['tables', 'Tables',        'table_restaurant', tables.filter(t => t.status === 'AVAILABLE').length],
          ['orders', 'Active Orders', 'receipt_long',     orders.filter(o => o.status === 'READY').length],
        ] as [View, string, string, number][]).map(([v, lbl, icon, badge]) => (
          <button key={v} onClick={() => setView(v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '14px 22px', background: 'none', border: 'none',
              borderBottom: view === v ? '2px solid #ffb77d' : '2px solid transparent',
              color: view === v ? '#ffb77d' : 'rgba(245,237,227,0.5)',
              fontSize: 13, fontWeight: view === v ? 600 : 400,
              cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
              transition: 'all 0.2s', marginBottom: -1,
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>
            {lbl}
            {badge > 0 && (
              <span style={{ background: v === 'orders' ? '#10b981' : '#ffb77d', color: '#1a120b', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                {badge}
              </span>
            )}
          </button>
        ))}
        {view === 'new-order' && selectedTable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '14px 22px', borderBottom: '2px solid #ffb77d', color: '#ffb77d', fontSize: 13, fontWeight: 600, marginBottom: -1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit_note</span>
            New Order — Table {selectedTable.tableNumber}
            {cartCount > 0 && (
              <span style={{ background: '#ffb77d', color: '#1a120b', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{cartCount}</span>
            )}
          </div>
        )}
      </div>

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {successMsg && (
        <div style={{
          position: 'fixed', top: 78, left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', padding: '12px 28px', borderRadius: 8,
          fontWeight: 600, fontSize: 14, zIndex: 500,
          boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
        }}>
          {successMsg}
        </div>
      )}

      <main style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ════════ BRANCH ERROR ════════════════════════════════════════════ */}
        {branchError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#ef4444', flexShrink: 0, marginTop: 2 }}>error</span>
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#ef4444', fontSize: 15 }}>Branch Not Assigned</p>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(245,237,227,0.7)', lineHeight: 1.6 }}>
                Your account is not linked to a branch yet. Please <strong>sign out and sign back in</strong> to refresh your session.
                If the problem continues, ask your manager to re-run the branch seed.
              </p>
              <button onClick={logout}
                style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Sign Out Now
              </button>
            </div>
          </div>
        )}

        {/* ════════ TABLES VIEW ════════════════════════════════════════════ */}
        {view === 'tables' && !branchError && (
          <>
            {/* Stats + legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, margin: '0 0 6px', color: '#fff' }}>Floor Plan</h2>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(245,237,227,0.45)' }}>
                  {tables.filter(t => t.status === 'AVAILABLE').length} available
                  &nbsp;·&nbsp;
                  {tables.filter(t => t.status === 'OCCUPIED').length} occupied
                  &nbsp;·&nbsp;
                  {tables.length} total
                </p>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {Object.entries(TABLE_STATUS_META).map(([status, meta]) => (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color }} />
                    <span style={{ fontSize: 12, color: 'rgba(245,237,227,0.5)' }}>{meta.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {tablesError && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#f59e0b' }}>
                ⚠️ {tablesError}
              </div>
            )}

            {tables.length === 0 && !tablesError ? (
              <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 10, padding: '64px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 52, color: 'rgba(245,237,227,0.1)', display: 'block', marginBottom: 14 }}>table_restaurant</span>
                <p style={{ color: 'rgba(245,237,227,0.4)', fontSize: 15, margin: 0 }}>No tables found for your branch</p>
                <p style={{ color: 'rgba(245,237,227,0.25)', fontSize: 13, marginTop: 8 }}>Please ask your manager to seed the tables, or sign out and sign back in.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {tables.map(table => {
                  const meta        = TABLE_STATUS_META[table.status] ?? TABLE_STATUS_META.AVAILABLE;
                  const isAvail     = table.status === 'AVAILABLE';
                  const isOccupied  = table.status === 'OCCUPIED';
                  const activeOrder = table.orders?.[0];
                  const minutesAgo  = activeOrder ? Math.floor((Date.now() - new Date(activeOrder.createdAt).getTime()) / 60000) : 0;
                  const orderMeta   = activeOrder ? ORDER_STATUS_META[activeOrder.status] : null;

                  return (
                    <div
                      key={table.id}
                      onClick={() => isAvail ? selectTable(table) : undefined}
                      style={{
                        background: '#271e16',
                        border: `2px solid ${isAvail ? '#3d2e22' : meta.color + '55'}`,
                        borderRadius: 12, padding: '20px 18px',
                        cursor: isAvail ? 'pointer' : 'default',
                        transition: 'all 0.2s', position: 'relative', minHeight: 170,
                        display: 'flex', flexDirection: 'column',
                      }}
                      onMouseEnter={e => {
                        if (isAvail) {
                          (e.currentTarget as HTMLDivElement).style.borderColor = '#ffb77d';
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (isAvail) {
                          (e.currentTarget as HTMLDivElement).style.borderColor = '#3d2e22';
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                        }
                      }}
                    >
                      {/* Status badge */}
                      <div style={{ position: 'absolute', top: 12, right: 12 }}>
                        <div style={{ background: meta.bg, color: meta.color, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{meta.icon}</span>
                          {meta.label}
                        </div>
                      </div>

                      {/* Table number */}
                      <div style={{ marginBottom: 12 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: isAvail ? '#ffb77d' : meta.color, display: 'block', marginBottom: 6 }}>table_restaurant</span>
                        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>
                          Table {table.tableNumber}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: 'rgba(245,237,227,0.4)' }}>{table.capacity} seats</p>
                      </div>

                      {/* Occupied — show order info */}
                      {isOccupied && activeOrder && (
                        <div style={{ borderTop: '1px solid #3d2e22', paddingTop: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: orderMeta?.color ?? '#ffb77d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {orderMeta?.label ?? activeOrder.status}
                            </span>
                            <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.35)' }}>{minutesAgo}m ago</span>
                          </div>
                          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(245,237,227,0.6)' }}>
                            {activeOrder.orderItems.length} items · £{Number(activeOrder.totalAmount).toFixed(2)}
                          </p>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {activeOrder.status === 'READY' && (
                              <button
                                onClick={e => { e.stopPropagation(); markServed(activeOrder.id); }}
                                style={{ flex: 1, background: '#10b981', border: 'none', color: '#fff', borderRadius: 6, padding: '7px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>room_service</span>
                                Serve
                              </button>
                            )}
                            {(activeOrder.status === 'SERVED' || activeOrder.status === 'COMPLETED') && (
                              <button
                                onClick={e => { e.stopPropagation(); freeTable(table.id, table.tableNumber); }}
                                style={{ flex: 1, background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.3)', color: '#4caf50', borderRadius: 6, padding: '7px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check_circle</span>
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Available — CTA */}
                      {isAvail && (
                        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 4, color: '#ffb77d', fontSize: 12 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add_circle</span>
                          Tap to start order
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ════════ NEW ORDER VIEW ═════════════════════════════════════════ */}
        {view === 'new-order' && selectedTable && (
          <div>
            {/* Back + header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <button
                onClick={() => { setView('tables'); setCart([]); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #3d2e22', color: 'rgba(245,237,227,0.6)', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                Back
              </button>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, margin: '0 0 2px', color: '#fff' }}>
                  New Order — Table {selectedTable.tableNumber}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(245,237,227,0.45)' }}>
                  {selectedTable.capacity}-seat table · Browse the menu and add items
                </p>
              </div>
            </div>

            {/* Split: menu | cart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' }}>

              {/* ── LEFT: menu browser ──────────────────────────────────── */}
              <div>
                {/* Category tabs */}
                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #3d2e22', marginBottom: 20, overflowX: 'auto' }}>
                  {MENU_CATS.map(cat => (
                    <button key={cat} onClick={() => setMenuCat(cat)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 18px', background: 'none', border: 'none',
                        borderBottom: menuCat === cat ? '2px solid #ffb77d' : '2px solid transparent',
                        color: menuCat === cat ? '#ffb77d' : 'rgba(245,237,227,0.5)',
                        fontSize: 12, fontWeight: menuCat === cat ? 600 : 400,
                        cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                        whiteSpace: 'nowrap', marginBottom: -1, transition: 'all 0.2s',
                      }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{CAT_ICONS[cat]}</span>
                      {CAT_LABELS[cat]}
                      <span style={{ background: menuCat === cat ? '#ffb77d' : '#3d2e22', color: menuCat === cat ? '#1a120b' : 'rgba(245,237,227,0.4)', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>
                        {menuItems.filter(m => m.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>

                {visibleMenu.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(245,237,227,0.3)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>restaurant_menu</span>
                    {menuItems.length === 0 ? 'Loading menu…' : 'No items in this category'}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                    {visibleMenu.map(item => {
                      const qty = inCart(item.id);
                      return (
                        <div key={item.id} style={{
                          background: qty > 0 ? 'rgba(255,183,125,0.08)' : '#271e16',
                          border: `1px solid ${qty > 0 ? 'rgba(255,183,125,0.4)' : '#3d2e22'}`,
                          borderRadius: 10, overflow: 'hidden', transition: 'all 0.2s',
                        }}>
                          {item.imageUrl && (
                            <div style={{ height: 140, overflow: 'hidden' }}>
                              <img src={item.imageUrl} alt={item.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            </div>
                          )}
                          <div style={{ padding: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff', flex: 1, paddingRight: 8, lineHeight: 1.3 }}>{item.name}</p>
                              <span style={{ color: '#ffb77d', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>£{Number(item.price).toFixed(2)}</span>
                            </div>
                            {item.description && (
                              <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(245,237,227,0.45)', lineHeight: 1.5 }}>
                                {item.description.length > 72 ? item.description.slice(0, 72) + '…' : item.description}
                              </p>
                            )}
                            {qty === 0 ? (
                              <button onClick={() => addToCart(item)}
                                style={{ width: '100%', background: '#ffb77d', border: 'none', color: '#1a120b', borderRadius: 6, padding: 9, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
                                Add to Order
                              </button>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a120b', borderRadius: 6, padding: 4 }}>
                                <button onClick={() => changeQty(item.id, -1)}
                                  style={{ width: 34, height: 34, background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', borderRadius: 5, cursor: 'pointer', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                <span style={{ fontWeight: 700, fontSize: 16, color: '#ffb77d', minWidth: 28, textAlign: 'center' }}>{qty}</span>
                                <button onClick={() => changeQty(item.id, +1)}
                                  style={{ width: 34, height: 34, background: 'rgba(255,183,125,0.15)', border: 'none', color: '#ffb77d', borderRadius: 5, cursor: 'pointer', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── RIGHT: cart ─────────────────────────────────────────── */}
              <div style={{ position: 'sticky', top: 120 }}>
                <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ background: '#150c06', padding: '16px 20px', borderBottom: '1px solid #3d2e22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, margin: 0, color: '#fff' }}>Order Summary</h3>
                    <span style={{ background: '#ffb77d', color: '#1a120b', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                      Table {selectedTable.tableNumber}
                    </span>
                  </div>

                  <div style={{ padding: '16px 20px', minHeight: 120, maxHeight: 340, overflowY: 'auto' }}>
                    {cart.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'rgba(245,237,227,0.15)', display: 'block', marginBottom: 8 }}>shopping_cart</span>
                        <p style={{ color: 'rgba(245,237,227,0.3)', fontSize: 13, margin: 0 }}>No items added yet</p>
                        <p style={{ color: 'rgba(245,237,227,0.2)', fontSize: 11, marginTop: 4 }}>Browse the menu and tap "Add to Order"</p>
                      </div>
                    ) : (
                      cart.map(c => (
                        <div key={c.menuItem.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid rgba(61,46,34,0.5)' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 13, color: '#fff', fontWeight: 500 }}>{c.menuItem.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: 'rgba(245,237,227,0.4)' }}>£{Number(c.menuItem.price).toFixed(2)} each</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={() => changeQty(c.menuItem.id, -1)}
                              style={{ width: 26, height: 26, background: '#3d2e22', border: 'none', color: '#f5ede3', borderRadius: 4, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', minWidth: 18, textAlign: 'center' }}>{c.quantity}</span>
                            <button onClick={() => changeQty(c.menuItem.id, +1)}
                              style={{ width: 26, height: 26, background: '#3d2e22', border: 'none', color: '#f5ede3', borderRadius: 4, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#ffb77d', minWidth: 52, textAlign: 'right' }}>
                            £{(Number(c.menuItem.price) * c.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div style={{ padding: '0 20px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '2px solid #3d2e22' }}>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#fff', fontWeight: 700 }}>Total</span>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#ffb77d', fontWeight: 700 }}>£{cartTotal.toFixed(2)}</span>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 11, color: 'rgba(245,237,227,0.5)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Kitchen Notes (optional)
                        </label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)}
                          placeholder="e.g. medium-rare, no onions, nut allergy…"
                          rows={3}
                          style={{ width: '100%', background: '#1a120b', border: '1px solid #3d2e22', borderRadius: 6, color: '#f5ede3', padding: '9px 12px', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
                      </div>
                      <button
                        onClick={placeOrder}
                        disabled={placing}
                        style={{
                          width: '100%', background: placing ? '#3d2e22' : '#ffb77d',
                          color: placing ? 'rgba(245,237,227,0.4)' : '#1a120b',
                          border: 'none', borderRadius: 8, padding: 16,
                          fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700,
                          cursor: placing ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          transition: 'all 0.2s',
                        }}>
                        {placing
                          ? <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>hourglass_top</span>Sending to Kitchen…</>
                          : <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>Send to Kitchen · £{cartTotal.toFixed(2)}</>
                        }
                      </button>
                      <button
                        onClick={() => { setView('tables'); setCart([]); }}
                        style={{ width: '100%', marginTop: 8, background: 'none', border: '1px solid #3d2e22', color: 'rgba(245,237,227,0.5)', borderRadius: 8, padding: 10, fontSize: 13, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ════════ ACTIVE ORDERS VIEW ════════════════════════════════════ */}
        {view === 'orders' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, margin: 0, color: '#fff' }}>Active Orders</h2>
              <button onClick={loadOrders} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #3d2e22', color: 'rgba(245,237,227,0.5)', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                Refresh
              </button>
            </div>

            {orders.length === 0 ? (
              <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 10, padding: 64, textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 52, color: 'rgba(245,237,227,0.1)', display: 'block', marginBottom: 14 }}>receipt_long</span>
                <p style={{ color: 'rgba(245,237,227,0.3)', fontSize: 15, margin: 0 }}>No active orders right now</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
                {orders.map(order => {
                  const oMeta = ORDER_STATUS_META[order.status] ?? { color: '#ffb77d', label: order.status };
                  const mins  = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                  return (
                    <div key={order.id} style={{
                      background: '#271e16',
                      border: `1px solid ${order.status === 'READY' ? '#10b981' : '#3d2e22'}`,
                      borderRadius: 10, overflow: 'hidden',
                      boxShadow: order.status === 'READY' ? '0 0 20px rgba(16,185,129,0.2)' : 'none',
                    }}>
                      <div style={{ background: order.status === 'READY' ? 'rgba(16,185,129,0.1)' : '#150c06', padding: '14px 18px', borderBottom: '1px solid #3d2e22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ffb77d' }}>table_restaurant</span>
                          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#fff', fontWeight: 600 }}>
                            Table {order.table.tableNumber}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.35)' }}>{mins}m ago</span>
                          <span style={{ background: oMeta.color + '22', color: oMeta.color, border: `1px solid ${oMeta.color}44`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                            {oMeta.label}
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '14px 18px' }}>
                        {order.orderItems.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.7)' }}>
                              <span style={{ color: '#ffb77d', fontWeight: 700 }}>{item.quantity}×</span> {item.menuItem.name}
                            </span>
                            <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.5)' }}>
                              £{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid #3d2e22', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Total</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#ffb77d' }}>£{Number(order.totalAmount).toFixed(2)}</span>
                        </div>
                      </div>

                      <div style={{ padding: '0 18px 16px' }}>
                        {order.status === 'READY' && (
                          <button onClick={() => markServed(order.id)} disabled={serving === order.id}
                            style={{ width: '100%', background: '#10b981', border: 'none', color: '#fff', borderRadius: 8, padding: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>room_service</span>
                            {serving === order.id ? 'Marking…' : 'Mark as Served'}
                          </button>
                        )}
                        {(order.status === 'SERVED' || order.status === 'COMPLETED') && (
                          <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: 10, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#8b5cf6' }}>point_of_sale</span>
                            <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600 }}>Waiting for cashier payment</span>
                          </div>
                        )}
                        {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: 10, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#f59e0b' }}>soup_kitchen</span>
                            <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>Order received — waiting for kitchen</span>
                          </div>
                        )}
                        {(order.status === 'IN_PROGRESS' || order.status === 'PREPARING') && (
                          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, padding: 10, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#3b82f6' }}>local_fire_department</span>
                            <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>Being prepared in the kitchen</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}