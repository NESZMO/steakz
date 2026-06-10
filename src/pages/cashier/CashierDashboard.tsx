import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

type Tab = 'pending' | 'transactions';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  menuItem: { name: string; price: number; category: string };
}
interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  table: { id: string; tableNumber: number } | null;
  waiter: { name: string } | null;
  orderItems: OrderItem[];
}
interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: string;
  receiptNumber: string;
  createdAt: string;
  order: {
    table: { tableNumber: number } | null;
    orderItems: OrderItem[];
  };
  processedBy: { name: string } | null;
}

const METHOD_META: Record<string, { icon: string; color: string; label: string }> = {
  CASH:        { icon: 'payments',     color: '#10b981', label: 'Cash'        },
  CARD:        { icon: 'credit_card',  color: '#3b82f6', label: 'Card'        },
  CONTACTLESS: { icon: 'contactless',  color: '#8b5cf6', label: 'Contactless' },
};

export default function CashierDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab]                     = useState<Tab>('pending');
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [selected, setSelected]           = useState<Order | null>(null);
  const [method, setMethod]               = useState<'CASH' | 'CARD' | 'CONTACTLESS'>('CARD');
  const [processing, setProcessing]       = useState(false);
  const [justPaid, setJustPaid]           = useState<string | null>(null);
  const [transactions, setTransactions]   = useState<Transaction[]>([]);
  const [summary, setSummary]             = useState<any>(null);
  const [txLoading, setTxLoading]         = useState(false);

  /* ─── Load pending orders (auto-refresh every 12s) ──────────────────────── */
  const loadPending = useCallback(async () => {
    try {
      const r = await api.get('/cashier/orders');
      setPendingOrders(r.data);
      // keep selection valid
      setSelected(prev => {
        if (!prev) return null;
        return r.data.find((o: Order) => o.id === prev.id) ?? null;
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadPending();
    const id = setInterval(loadPending, 12000);
    return () => clearInterval(id);
  }, [loadPending]);

  /* ─── Load transactions ──────────────────────────────────────────────────── */
  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const [t, s] = await Promise.all([
        api.get('/cashier/transactions'),
        api.get('/cashier/summary'),
      ]);
      setTransactions(t.data);
      setSummary(s.data);
    } catch { /* silent */ }
    setTxLoading(false);
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    if (t === 'transactions') loadTransactions();
  };

  /* ─── Confirm payment ────────────────────────────────────────────────────── */
  const confirmPayment = async () => {
    if (!selected || processing) return;
    setProcessing(true);
    try {
      await api.post('/cashier/payment', { orderId: selected.id, paymentMethod: method });
      setJustPaid(selected.id);
      setSelected(null);
      await loadPending();
      setTimeout(() => setJustPaid(null), 3000);
    } catch {
      alert('Payment failed — please try again.');
    }
    setProcessing(false);
  };

  const totalItems = (o: Order) => o.orderItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ background: '#1a120b', minHeight: '100vh', color: '#f5ede3', fontFamily: 'Inter, sans-serif' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#150c06', borderBottom: '1px solid #3d2e22',
        padding: '0 36px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#ffb77d', fontWeight: 700 }}>Steakz</span>
          <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.4)', padding: '3px 10px', borderRadius: 20, border: '1px solid #3d2e22', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Payment Terminal
          </span>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 6px #4caf50', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, color: '#4caf50' }}>Live</span>
          </div>
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
          ['pending',      'Pending Payment', 'point_of_sale',  pendingOrders.length],
          ['transactions', 'Transactions',    'receipt_long',   null],
        ] as const).map(([t, lbl, icon, badge]) => (
          <button key={t} onClick={() => switchTab(t as Tab)}
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
            {badge !== null && badge > 0 && (
              <span style={{ background: '#ffb77d', color: '#1a120b', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700, marginLeft: 2 }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── SUCCESS TOAST ───────────────────────────────────────────────────── */}
      {justPaid && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', padding: '12px 28px', borderRadius: 8,
          fontWeight: 600, fontSize: 14, zIndex: 500,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
          Payment confirmed — receipt generated!
        </div>
      )}

      <main style={{ padding: '36px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ════════════════════════════════════════════════════════════════════
            PENDING PAYMENT TAB
        ════════════════════════════════════════════════════════════════════ */}
        {tab === 'pending' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'flex-start' }}>

            {/* LEFT — order queue ─────────────────────────────────────────── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, margin: 0, color: '#fff' }}>
                  Orders Queue
                </h2>
                <button onClick={loadPending}
                  style={{ background: 'none', border: '1px solid #3d2e22', color: 'rgba(245,237,227,0.5)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>refresh</span>
                  Refresh
                </button>
              </div>

              {pendingOrders.length === 0 ? (
                <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 10, padding: '48px 24px', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'rgba(245,237,227,0.15)', display: 'block', marginBottom: 12 }}>point_of_sale</span>
                  <p style={{ color: 'rgba(245,237,227,0.3)', fontSize: 14, margin: 0 }}>No orders awaiting payment</p>
                  <p style={{ color: 'rgba(245,237,227,0.2)', fontSize: 12, marginTop: 6 }}>Auto-refreshes every 12 seconds</p>
                </div>
              ) : pendingOrders.map(order => {
                const isSelected = selected?.id === order.id;
                const minutesAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelected(isSelected ? null : order)}
                    style={{
                      background: isSelected ? 'rgba(255,183,125,0.08)' : '#271e16',
                      border: `1px solid ${isSelected ? '#ffb77d' : '#3d2e22'}`,
                      borderRadius: 10, padding: '18px 20px', marginBottom: 10,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,183,125,0.4)'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#3d2e22'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffb77d' }}>table_restaurant</span>
                          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: '#fff', fontWeight: 600 }}>
                            Table {order.table?.tableNumber ?? '—'}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: 'rgba(245,237,227,0.45)' }}>
                          Waiter: {order.waiter?.name ?? 'Unknown'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#ffb77d', fontFamily: 'Playfair Display, serif' }}>
                          £{Number(order.totalAmount).toFixed(2)}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: 'rgba(245,237,227,0.35)' }}>
                          {minutesAgo}m ago
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'rgba(245,237,227,0.5)' }}>
                        {totalItems(order)} item{totalItems(order) !== 1 ? 's' : ''} · {order.orderItems.length} dish{order.orderItems.length !== 1 ? 'es' : ''}
                      </span>
                      <span style={{ background: 'rgba(255,183,125,0.12)', color: '#ffb77d', border: '1px solid rgba(255,183,125,0.25)', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                        {order.status}
                      </span>
                    </div>
                    {isSelected && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,183,125,0.2)', display: 'flex', alignItems: 'center', gap: 5, color: '#ffb77d', fontSize: 12 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                        Viewing receipt →
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RIGHT — receipt / payment panel ─────────────────────────────── */}
            <div>
              {!selected ? (
                <div style={{ background: '#271e16', border: '1px dashed #3d2e22', borderRadius: 10, padding: '80px 40px', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'rgba(245,237,227,0.1)', display: 'block', marginBottom: 16 }}>receipt_long</span>
                  <p style={{ color: 'rgba(245,237,227,0.25)', fontSize: 15, margin: 0 }}>Select an order from the queue to view the receipt</p>
                </div>
              ) : (
                <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 10, overflow: 'hidden' }}>

                  {/* Receipt header */}
                  <div style={{ background: '#150c06', padding: '20px 28px', borderBottom: '1px solid #3d2e22' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: 11, color: '#ffb77d', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px' }}>Payment Receipt</p>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, margin: '0 0 4px', color: '#fff' }}>
                          Table {selected.table?.tableNumber ?? '—'}
                        </h3>
                        <p style={{ fontSize: 12, color: 'rgba(245,237,227,0.4)', margin: 0 }}>
                          Order #{selected.id.slice(-8).toUpperCase()} · Waiter: {selected.waiter?.name ?? '—'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 11, color: 'rgba(245,237,227,0.4)', margin: '0 0 4px' }}>
                          {new Date(selected.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span style={{ background: 'rgba(255,183,125,0.12)', color: '#ffb77d', border: '1px solid rgba(255,183,125,0.3)', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600 }}>
                          {selected.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div style={{ padding: '20px 28px' }}>
                    <p style={{ fontSize: 11, color: 'rgba(245,237,227,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>Order Items</p>

                    {/* Group by category */}
                    {['STARTERS', 'MAIN_COURSE', 'SIDES', 'DESSERTS', 'DRINKS'].map(cat => {
                      const catItems = selected.orderItems.filter(i => i.menuItem.category === cat);
                      if (catItems.length === 0) return null;
                      return (
                        <div key={cat} style={{ marginBottom: 16 }}>
                          <p style={{ fontSize: 10, color: '#ffb77d', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px', paddingBottom: 4, borderBottom: '1px solid rgba(61,46,34,0.6)' }}>
                            {cat.replace('_', ' ')}
                          </p>
                          {catItems.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(61,46,34,0.3)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ background: '#3d2e22', color: '#ffb77d', borderRadius: 4, padding: '2px 7px', fontSize: 12, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                                  {item.quantity}×
                                </span>
                                <span style={{ fontSize: 14, color: '#f5ede3' }}>{item.menuItem.name}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>
                                  £{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                                </span>
                                {item.quantity > 1 && (
                                  <span style={{ display: 'block', fontSize: 10, color: 'rgba(245,237,227,0.35)' }}>
                                    £{Number(item.unitPrice).toFixed(2)} each
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}

                    {/* Totals */}
                    <div style={{ borderTop: '2px solid #3d2e22', marginTop: 8, paddingTop: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.55)' }}>Subtotal</span>
                        <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.7)' }}>£{Number(selected.totalAmount).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.55)' }}>Service (included)</span>
                        <span style={{ fontSize: 13, color: 'rgba(245,237,227,0.55)' }}>—</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #3d2e22', marginTop: 4 }}>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#fff', fontWeight: 700 }}>Total</span>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#ffb77d', fontWeight: 700 }}>
                          £{Number(selected.totalAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment method selector */}
                  <div style={{ padding: '0 28px 24px' }}>
                    <p style={{ fontSize: 11, color: 'rgba(245,237,227,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Payment Method</p>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                      {(['CASH', 'CARD', 'CONTACTLESS'] as const).map(m => {
                        const meta = METHOD_META[m];
                        const active = method === m;
                        return (
                          <button
                            key={m}
                            onClick={() => setMethod(m)}
                            style={{
                              flex: 1, padding: '14px 10px',
                              background: active ? meta.color + '20' : '#1a120b',
                              border: `2px solid ${active ? meta.color : '#3d2e22'}`,
                              borderRadius: 8, cursor: 'pointer',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                              transition: 'all 0.2s',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 24, color: active ? meta.color : 'rgba(245,237,227,0.4)' }}>
                              {meta.icon}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? meta.color : 'rgba(245,237,227,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                              {meta.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Confirm button */}
                    <button
                      onClick={confirmPayment}
                      disabled={processing}
                      style={{
                        width: '100%',
                        background: processing ? '#3d2e22' : '#ffb77d',
                        color: processing ? 'rgba(245,237,227,0.4)' : '#1a120b',
                        border: 'none', borderRadius: 8,
                        padding: '18px', fontWeight: 700, fontSize: 16,
                        cursor: processing ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        transition: 'all 0.2s',
                        fontFamily: 'Playfair Display, serif',
                      }}
                      onMouseEnter={e => { if (!processing) (e.currentTarget as HTMLElement).style.background = '#fca754'; }}
                      onMouseLeave={e => { if (!processing) (e.currentTarget as HTMLElement).style.background = '#ffb77d'; }}
                    >
                      {processing ? (
                        <>
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>hourglass_top</span>
                          Processing…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{METHOD_META[method].icon}</span>
                          Confirm {METHOD_META[method].label} Payment · £{Number(selected.totalAmount).toFixed(2)}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TRANSACTIONS TAB
        ════════════════════════════════════════════════════════════════════ */}
        {tab === 'transactions' && (
          <>
            {/* Summary cards */}
            {summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 28 }}>
                {[
                  { label: "Today's Revenue",      value: `£${(summary.totalRevenue ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'payments',     color: '#ffb77d' },
                  { label: 'Transactions Today',   value: summary.totalCount ?? 0,                                                                    icon: 'receipt_long', color: '#3b82f6' },
                  { label: 'Cash Collected',        value: `£${(summary.byMethod?.CASH ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'payments',     color: '#10b981' },
                  { label: 'Card / Contactless',   value: `£${((summary.byMethod?.CARD ?? 0) + (summary.byMethod?.CONTACTLESS ?? 0)).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'credit_card', color: '#8b5cf6' },
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
            )}

            {/* Payment method breakdown bar */}
            {summary?.byMethod && Object.keys(summary.byMethod).length > 0 && (
              <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, padding: '20px 24px', marginBottom: 24 }}>
                <p style={{ color: 'rgba(245,237,227,0.5)', margin: '0 0 14px', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 11 }}>Today's Revenue by Payment Method</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  {Object.entries(summary.byMethod).map(([m, amt]) => {
                    const meta = METHOD_META[m] ?? { icon: 'payments', color: '#ffb77d', label: m };
                    const pct  = summary.totalRevenue > 0 ? ((amt as number) / summary.totalRevenue) * 100 : 0;
                    return (
                      <div key={m} style={{ flex: 1, background: '#1a120b', borderRadius: 8, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: meta.color }}>{meta.icon}</span>
                          <span style={{ fontSize: 12, color: 'rgba(245,237,227,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{meta.label}</span>
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif' }}>
                          £{(amt as number).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </p>
                        <div style={{ height: 4, background: '#3d2e22', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(245,237,227,0.35)', marginTop: 4, display: 'block' }}>{pct.toFixed(1)}% of today</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Transaction table */}
            <div style={{ background: '#271e16', border: '1px solid #3d2e22', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #3d2e22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#fff', fontFamily: 'Playfair Display, serif' }}>
                  All Transactions
                  <span style={{ marginLeft: 10, fontSize: 13, color: 'rgba(245,237,227,0.35)', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>({transactions.length})</span>
                </h3>
                <button onClick={loadTransactions} style={{ background: 'none', border: '1px solid #3d2e22', color: 'rgba(245,237,227,0.5)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>refresh</span>
                  Refresh
                </button>
              </div>

              {txLoading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(245,237,227,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>hourglass_top</span>
                  Loading transactions…
                </div>
              ) : transactions.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(245,237,227,0.3)', fontSize: 14 }}>
                  No transactions yet today
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a120b' }}>
                      {['Receipt #', 'Table', 'Items', 'Total', 'Method', 'Processed By', 'Time'].map(h => (
                        <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, color: 'rgba(245,237,227,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => {
                      const meta = METHOD_META[tx.method] ?? { icon: 'payments', color: '#ffb77d', label: tx.method };
                      return (
                        <tr key={tx.id}
                          style={{ borderTop: '1px solid #3d2e22', background: i % 2 === 0 ? 'transparent' : 'rgba(255,183,125,0.02)', cursor: 'default' }}>
                          <td style={{ padding: '12px 18px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#ffb77d', background: 'rgba(255,183,125,0.1)', padding: '3px 8px', borderRadius: 4 }}>
                              {tx.receiptNumber}
                            </span>
                          </td>
                          <td style={{ padding: '12px 18px', fontSize: 13, color: '#fff' }}>
                            Table {tx.order?.table?.tableNumber ?? '—'}
                          </td>
                          <td style={{ padding: '12px 18px', fontSize: 13, color: 'rgba(245,237,227,0.6)' }}>
                            {tx.order?.orderItems?.reduce((s, it) => s + it.quantity, 0) ?? 0} items
                          </td>
                          <td style={{ padding: '12px 18px', fontSize: 14, color: '#ffb77d', fontWeight: 700 }}>
                            £{Number(tx.amount).toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 18px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}44`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{meta.icon}</span>
                              {meta.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 18px', fontSize: 13, color: 'rgba(245,237,227,0.6)' }}>
                            {tx.processedBy?.name ?? '—'}
                          </td>
                          <td style={{ padding: '12px 18px', fontSize: 12, color: 'rgba(245,237,227,0.4)' }}>
                            <div>{new Date(tx.createdAt).toLocaleDateString('en-GB')}</div>
                            <div>{new Date(tx.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
}
