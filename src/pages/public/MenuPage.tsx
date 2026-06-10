import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
}

const CATEGORIES = ['STARTER', 'MAIN', 'SIDE', 'DESSERT', 'DRINK', 'SPECIAL'];

const CAT_META: Record<string, { label: string; icon: string; accent: string }> = {
  STARTER: { label: 'Starters',  icon: 'restaurant',    accent: '#ffb77d' },
  MAIN:    { label: 'Mains',     icon: 'lunch_dining',  accent: '#ffb77d' },
  SIDE:    { label: 'Sides',     icon: 'set_meal',       accent: '#ffb77d' },
  DESSERT: { label: 'Desserts',  icon: 'cake',           accent: '#ffb77d' },
  DRINK:   { label: 'Drinks',    icon: 'local_bar',      accent: '#ffb77d' },
  SPECIAL: { label: 'Specials',  icon: 'auto_awesome',  accent: '#ffd700' },
};

export default function MenuPage() {
  const [items, setItems]     = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState('STARTER');

  useEffect(() => {
    api.get('/menu').then(r => { setItems(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const byCategory = (cat: string) => items.filter(i => i.category === cat);

  return (
    <div style={{ background: '#1a120b', color: '#f5ede3', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(to bottom, #0f0702, #1a120b)',
        borderBottom: '1px solid #3d2e22',
        padding: '72px 40px 48px',
        textAlign: 'center',
      }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(245,237,227,0.5)', textDecoration: 'none', marginBottom: 24 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ffb77d')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,227,0.5)')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          Back to Home
        </Link>
        <p style={{ fontSize: 11, color: '#ffb77d', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 10 }}>Steakz Restaurant</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px,5vw,60px)', margin: '0 0 16px', color: '#fff' }}>Our Menu</h1>
        <p style={{ fontSize: 16, color: 'rgba(245,237,227,0.6)', maxWidth: 480, margin: '0 auto' }}>
          Seasonal ingredients, masterfully prepared. Every dish reflects our passion for quality.
        </p>
      </div>

      {/* Sticky category nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(26,18,11,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #3d2e22',
        padding: '0 40px',
        display: 'flex',
        overflowX: 'auto',
      }}>
        {CATEGORIES.map(cat => {
          const meta = CAT_META[cat];
          const isActive = active === cat;
          const isSpecial = cat === 'SPECIAL';
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '16px 20px', whiteSpace: 'nowrap',
                background: 'none', border: 'none',
                borderBottom: isActive ? `2px solid ${meta.accent}` : '2px solid transparent',
                color: isActive ? meta.accent : 'rgba(245,237,227,0.55)',
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.05em', cursor: 'pointer',
                transition: 'all 0.2s', textTransform: 'uppercase',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{meta.icon}</span>
              {meta.label}
              <span style={{
                background: isActive ? meta.accent : '#3d2e22',
                color: isActive ? '#1a120b' : 'rgba(245,237,227,0.5)',
                borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 600,
              }}>
                {byCategory(cat).length}
              </span>
              {isSpecial && (
                <span style={{ background: '#ffd700', color: '#1a120b', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.08em', marginLeft: -4 }}>
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Menu grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(245,237,227,0.4)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>restaurant_menu</span>
            Loading menu…
          </div>
        ) : (
          CATEGORIES.map(cat => {
            const meta = CAT_META[cat];
            const isSpecial = cat === 'SPECIAL';
            return (
              <div key={cat} style={{ display: active === cat ? 'block' : 'none' }}>

                {/* Category heading */}
                <div style={{ marginBottom: 40 }}>
                  {isSpecial && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 6, padding: '8px 16px', marginBottom: 16 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffd700' }}>auto_awesome</span>
                      <span style={{ fontSize: 12, color: '#ffd700', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>Chef's Seasonal Specials — Limited Availability</span>
                    </div>
                  )}
                  <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 38, margin: '0 0 10px', color: '#fff' }}>{meta.label}</h2>
                  <div style={{ width: 48, height: 3, background: meta.accent, borderRadius: 2 }} />
                  {isSpecial && (
                    <p style={{ fontSize: 14, color: 'rgba(245,237,227,0.5)', marginTop: 12 }}>
                      Our specials change seasonally. Please inform your server of any dietary requirements.
                    </p>
                  )}
                </div>

                {/* Item cards */}
                <div style={{ display: 'grid', gridTemplateColumns: isSpecial ? 'repeat(auto-fill, minmax(340px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                  {byCategory(cat).map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: '#271e16',
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: isSpecial ? '1px solid rgba(255,215,0,0.25)' : '1px solid #3d2e22',
                        opacity: item.isActive ? 1 : 0.5,
                        transition: 'transform 0.25s, box-shadow 0.25s',
                      }}
                      onMouseEnter={e => {
                        if (item.isActive) {
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
                          (e.currentTarget as HTMLElement).style.boxShadow = isSpecial
                            ? '0 16px 40px rgba(255,215,0,0.12)'
                            : '0 12px 32px rgba(0,0,0,0.4)';
                        }
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      {/* Image */}
                      {item.imageUrl ? (
                        <div style={{ height: isSpecial ? 240 : 200, overflow: 'hidden', position: 'relative' }}>
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                          />
                          {isSpecial && (
                            <div style={{ position: 'absolute', top: 12, left: 12, background: '#ffd700', color: '#1a120b', borderRadius: 4, padding: '4px 10px', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>auto_awesome</span>
                              Special
                            </div>
                          )}
                          {!item.isActive && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,7,2,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ background: '#554336', color: '#f5ede3', fontSize: 12, letterSpacing: '0.1em', padding: '6px 14px', borderRadius: 4, textTransform: 'uppercase' }}>
                                Unavailable
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ height: 180, background: '#1a120b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#3d2e22' }}>restaurant</span>
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ padding: '20px 20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: isSpecial ? 20 : 18, margin: 0, color: '#fff', lineHeight: 1.3 }}>
                            {item.name}
                          </h3>
                          <span style={{ color: isSpecial ? '#ffd700' : '#ffb77d', fontWeight: 700, fontSize: isSpecial ? 19 : 17, flexShrink: 0 }}>
                            £{Number(item.price).toFixed(2)}
                          </span>
                        </div>
                        {item.description && (
                          <p style={{ fontSize: 13, color: 'rgba(245,237,227,0.55)', lineHeight: 1.65, margin: 0 }}>
                            {item.description}
                          </p>
                        )}
                        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.isActive ? '#4caf50' : '#ef4444' }} />
                          <span style={{ fontSize: 11, color: item.isActive ? '#4caf50' : '#ef4444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            {item.isActive ? 'Available Today' : 'Currently Unavailable'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {byCategory(cat).length === 0 && !loading && (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(245,237,227,0.3)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 44, display: 'block', marginBottom: 12 }}>restaurant_menu</span>
                    No {meta.label.toLowerCase()} available right now
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}