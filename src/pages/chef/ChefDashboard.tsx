import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// ── types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  quantity: number;
  isReady: boolean;
  menuItem: { name: string; category: string };
}
interface Order {
  id: string;
  status: string;
  createdAt: string;
  notes?: string;
  table?: { tableNumber: number };
  orderItems: OrderItem[];
}

// ── status colours ────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'New Order'   },
  CONFIRMED:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Confirmed'   },
  PREPARING:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: 'Cooking'     },
  IN_PROGRESS: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: 'In Progress' },
  READY:       { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Ready'       },
};

// elapsed time helper
const elapsed = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  return `${mins}m ago`;
};

// ── component ────────────────────────────────────────────────────────────────
export default function ChefDashboard() {
  const { user, logout } = useAuth();
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [newFlash, setNewFlash]   = useState(false);
  const prevCountRef              = useRef(0);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await api.get('/chef/orders');
      const incoming: Order[] = r.data;
      // Flash alert if a new order arrived since last poll
      if (prevCountRef.current > 0 && incoming.length > prevCountRef.current) {
        setNewFlash(true);
        setTimeout(() => setNewFlash(false), 4000);
      }
      prevCountRef.current = incoming.length;
      setOrders(incoming);
    } catch { /* silent */ }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const id = setInterval(() => fetchOrders(true), 8000);
    return () => clearInterval(id);
  }, []);

  // ── actions ───────────────────────────────────────────────────────────────
  const startCooking = async (orderId: string) => {
    await api.put(`/chef/orders/${orderId}/status`, { status: 'PREPARING' });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PREPARING' } : o));
  };

  const markItemReady = async (orderId: string, itemId: string) => {
    await api.put(`/chef/items/${itemId}/ready`);
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, orderItems: o.orderItems.map(i => i.id === itemId ? { ...i, isReady: true } : i) }
        : o
    ));
  };

  const markOrderReady = async (orderId: string) => {
    await api.put(`/chef/orders/${orderId}/status`, { status: 'READY' });
    // Remove from kitchen view — order is ready to be served
    setOrders(prev => prev.filter(o => o.id !== orderId));
    prevCountRef.current = Math.max(0, prevCountRef.current - 1);
  };

  // ── derived counts ────────────────────────────────────────────────────────
  const pendingCount   = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
  const cookingCount   = orders.filter(o => o.status === 'PREPARING' || o.status === 'IN_PROGRESS').length;

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
            Kitchen Station
          </span>
          {/* Live pulse */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 6px #4caf50' }} />
            <span style={{ fontSize: 11, color: '#4caf50' }}>Live · 8s</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => fetchOrders()}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #3d2e22', color: 'rgba(245,237,227,0.5)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>refresh</span>
            Refresh
          </button>
          <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.5)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 4 }}>account_circle</span>
            {user?.name}
          </span>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>logout</span>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── NEW ORDER FLASH BANNER ─────────────────────────────────────────── */}
      {newFlash && (
        <div style={{
          position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)',
          background: '#f59e0b', color: '#1a120b', padding: '12px 32px', borderRadius: 8,
          fontWeight: 700, fontSize: 15, zIndex: 500,
          boxShadow: '0 4px 24px rgba(245,158,11,0.5)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications_active</span>
          New order just arrived!
        </div>
      )}

      <main style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── PAGE TITLE ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, margin: '0 0 4px', color: '#fff' }}>
            Order Queue
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(245,237,227,0.4)' }}>
            All active orders from the floor — auto-refreshes every 8 seconds
          </p>
        </div>

        {/* ── STAT CARDS ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'New Orders',    value: pendingCount,          color: '#f59e0b', icon: 'notification_important', desc: 'Waiting to be cooked' },
            { label: 'Being Cooked',  value: cookingCount,          color: '#3b82f6', icon: 'local_fire_department',  desc: 'Currently on the grill' },
            { label: 'Total Active',  value: orders.length,         color: '#ffb77d', icon: 'receipt_long',           desc: 'Orders in the kitchen' },
          ].map(s => (
            <div key={s.label} style={{ background: '#271e16', border: `1px solid ${s.value > 0 ? s.color + '44' : '#3d2e22'}`, borderTop: `3px solid ${s.color}`, borderRadius: 10, padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: s.color }}>{s.icon}</span>
              </div>
              <p style={{ margin: '0 0 4px', fontFamily: 'Playfair Display, serif', fontSize: 40, fontWeight: 700, color: s.value > 0 ? s.color : 'rgba(245,237,227,0.2)', lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(245,237,227,0.35)' }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* ── ORDER GRID ─────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'rgba(245,237,227,0.3)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>hourglass_top</span>
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 12, padding: '80px 40px', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'rgba(245,237,227,0.08)', display: 'block', marginBottom: 16 }}>restaurant</span>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: 'rgba(245,237,227,0.3)', margin: '0 0 8px' }}>Kitchen is clear</p>
            <p style={{ fontSize: 13, color: 'rgba(245,237,227,0.2)', margin: 0 }}>No active orders. Waiting for the waiters…</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {orders.map(order => {
              const meta      = STATUS_META[order.status] ?? STATUS_META.PENDING;
              const allReady  = order.orderItems.every(i => i.isReady);
              const readyCount = order.orderItems.filter(i => i.isReady).length;
              const totalItems = order.orderItems.length;
              const minsOld   = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
              const isUrgent  = minsOld >= 20;
              const isPending = order.status === 'PENDING' || order.status === 'CONFIRMED';
              const isCooking = order.status === 'PREPARING' || order.status === 'IN_PROGRESS';

              return (
                <div key={order.id} style={{
                  background: '#271e16',
                  border: `2px solid ${isUrgent ? '#ef4444' : meta.color + '55'}`,
                  borderLeft: `4px solid ${isUrgent ? '#ef4444' : meta.color}`,
                  borderRadius: 10, overflow: 'hidden',
                  boxShadow: isPending ? `0 0 16px ${meta.color}22` : 'none',
                  transition: 'box-shadow 0.3s',
                }}>
                  {/* Card header */}
                  <div style={{ background: isPending ? 'rgba(245,158,11,0.06)' : isCooking ? 'rgba(59,130,246,0.06)' : '#150c06', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3d2e22' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: meta.color }}>
                        {isPending ? 'notification_important' : 'local_fire_department'}
                      </span>
                      <div>
                        <p style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#fff', fontWeight: 600 }}>
                          Table {order.table?.tableNumber ?? '—'}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: 'rgba(245,237,227,0.35)', fontFamily: 'monospace' }}>
                          #{order.id.slice(-6).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}44`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                        {meta.label}
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: isUrgent ? '#ef4444' : 'rgba(245,237,227,0.35)' }}>
                        {isUrgent && '⚠️ '}{elapsed(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Kitchen notes */}
                  {order.notes && (
                    <div style={{ background: 'rgba(255,183,125,0.06)', borderBottom: '1px solid #3d2e22', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ffb77d' }}>sticky_note_2</span>
                      <span style={{ fontSize: 12, color: '#ffb77d' }}>{order.notes}</span>
                    </div>
                  )}

                  {/* Items list */}
                  <div style={{ padding: '14px 18px' }}>
                    {/* Progress bar (only when cooking) */}
                    {isCooking && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress</span>
                          <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>{readyCount}/{totalItems} items done</span>
                        </div>
                        <div style={{ height: 4, background: '#3d2e22', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${totalItems > 0 ? (readyCount / totalItems) * 100 : 0}%`, background: allReady ? '#10b981' : '#3b82f6', borderRadius: 2, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    )}

                    {order.orderItems.map(item => (
                      <div key={item.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '9px 0', borderBottom: '1px solid rgba(61,46,34,0.4)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isCooking && (
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%',
                              background: item.isReady ? '#10b981' : 'transparent',
                              border: `2px solid ${item.isReady ? '#10b981' : '#3d2e22'}`,
                              flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {item.isReady && <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#fff' }}>check</span>}
                            </div>
                          )}
                          <span style={{
                            fontSize: 13, fontWeight: 600,
                            color: item.isReady ? 'rgba(245,237,227,0.3)' : '#f2dfd3',
                            textDecoration: item.isReady ? 'line-through' : 'none',
                          }}>
                            {item.quantity}× {item.menuItem.name}
                          </span>
                        </div>
                        {isCooking && !item.isReady && (
                          <button
                            onClick={() => markItemReady(order.id, item.id)}
                            style={{
                              padding: '4px 12px', background: 'rgba(16,185,129,0.12)',
                              border: '1px solid rgba(16,185,129,0.3)', color: '#10b981',
                              borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                            }}>
                            Done
                          </button>
                        )}
                        {isCooking && item.isReady && (
                          <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 18 }}>check_circle</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action button */}
                  <div style={{ padding: '0 18px 18px' }}>
                    {isPending && (
                      <button
                        onClick={() => startCooking(order.id)}
                        style={{
                          width: '100%', background: '#f59e0b', border: 'none', color: '#1a120b',
                          borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 14,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          letterSpacing: '0.04em',
                        }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>local_fire_department</span>
                        Start Cooking
                      </button>
                    )}
                    {isCooking && allReady && (
                      <button
                        onClick={() => markOrderReady(order.id)}
                        style={{
                          width: '100%', background: '#10b981', border: 'none', color: '#fff',
                          borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 14,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          letterSpacing: '0.04em',
                          boxShadow: '0 0 20px rgba(16,185,129,0.3)',
                        }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>room_service</span>
                        Mark as Ready — Send to Waiter
                      </button>
                    )}
                    {isCooking && !allReady && (
                      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                        <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>
                          Mark all items as done to complete the order
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}