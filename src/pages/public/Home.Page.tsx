import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const SIGNATURE_CUTS = [
  {
    name: 'Bone-In Ribeye',
    desc: '32oz USDA Prime, dry-aged 45 days, finished with compound herb butter',
    price: '£68',
    img: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
  },
  {
    name: 'Wagyu Tomahawk',
    desc: 'Japanese A5 Wagyu, 40oz long-bone tomahawk, served on a salt block',
    price: '£120',
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  },
  {
    name: 'Châteaubriand',
    desc: 'Centre-cut beef tenderloin for two, truffle jus, béarnaise',
    price: '£95',
    img:'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
  },
];

const PROMOS = [
  {
    icon: 'workspace_premium',
    title: 'Prime Aged Beef',
    desc: 'Every cut sourced from hand-selected British and Japanese herds, aged in our in-house dry-ageing cabinet for minimum 28 days.',
  },
  {
    icon: 'local_fire_department',
    title: 'Mastered by Fire',
    desc: 'Our chefs work exclusively on custom-built 900 °C charcoal grills, locking in flavour and delivering the perfect crust every time.',
  },
  {
    icon: 'location_on',
    title: '7 UK Locations',
    desc: 'From London to Edinburgh, each Steakz restaurant brings the same obsessive commitment to quality to your city.',
  },
];

const GALLERY = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&q=80',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
];

export default function HomePage() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (parallaxRef.current) {
        parallaxRef.current.style.backgroundPositionY = `${window.scrollY * 0.4}px`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: '#1a120b', color: '#f5ede3', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        ref={parallaxRef}
        style={{
          position: 'relative',
          height: '100vh',
          minHeight: 600,
          backgroundImage: 'url(https://images.unsplash.com/photo-1558030006-450675393462?w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(15,7,2,0.55) 0%, rgba(15,7,2,0.75) 60%, rgba(26,18,11,1) 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, padding: '0 24px' }}>
          <p style={{ fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#ffb77d', marginBottom: 20 }}>
            Established 2018 · 7 UK Locations
          </p>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(48px, 8vw, 88px)',
            fontWeight: 700,
            lineHeight: 1.05,
            margin: '0 0 24px',
            color: '#fff',
          }}>
            Where Fire Meets<br /><span style={{ color: '#ffb77d' }}>Perfection</span>
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(245,237,227,0.75)', marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Premium dry-aged steaks, mastered over live coals. A dining experience built for those who demand the very best.
          </p>
          <Link
            to="/menu"
            style={{
              display: 'inline-block',
              background: '#ffb77d',
              color: '#1a120b',
              padding: '16px 44px',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fca754')}
            onMouseLeave={e => (e.currentTarget.style.background = '#ffb77d')}
          >
            View Our Menu
          </Link>
        </div>
      </section>

      {/* ── PROMOS ROW ────────────────────────────────────────────────────── */}
      <section style={{ background: '#271e16', borderBottom: '1px solid #3d2e22', padding: '60px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 40 }}>
          {PROMOS.map(p => (
            <div key={p.title} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#ffb77d', flexShrink: 0, marginTop: 2 }}>
                {p.icon}
              </span>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, margin: '0 0 8px', color: '#fff' }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(245,237,227,0.65)', lineHeight: 1.7, margin: 0 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SIGNATURE CUTS ────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 40px', background: '#1a120b' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, color: '#ffb77d', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>Our Craft</p>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px,5vw,52px)', margin: '0 0 16px', color: '#fff' }}>
              Signature Cuts
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(245,237,227,0.6)', maxWidth: 520, margin: '0 auto' }}>
              Each cut selected, aged, and cooked by our master chefs to exacting specifications.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28 }}>
            {SIGNATURE_CUTS.map(cut => (
              <div
                key={cut.name}
                style={{
                  background: '#271e16',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid #3d2e22',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div style={{ height: 240, overflow: 'hidden' }}>
                  <img
                    src={cut.img}
                    alt={cut.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                </div>
                <div style={{ padding: '24px 24px 28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, margin: 0, color: '#fff' }}>{cut.name}</h3>
                    <span style={{ color: '#ffb77d', fontWeight: 700, fontSize: 18 }}>{cut.price}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'rgba(245,237,227,0.6)', lineHeight: 1.7, margin: 0 }}>{cut.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* SINGLE CTA BELOW SIGNATURE CUTS */}
          <div style={{ textAlign: 'center', marginTop: 52 }}>
            <Link
              to="/menu"
              style={{
                display: 'inline-block',
                border: '2px solid #ffb77d',
                color: '#ffb77d',
                padding: '14px 48px',
                borderRadius: 4,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#ffb77d';
                (e.currentTarget as HTMLElement).style.color = '#1a120b';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#ffb77d';
              }}
            >
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE SECTION ────────────────────────────────────────────── */}
      <section style={{ background: '#150c06', borderTop: '1px solid #3d2e22', padding: '100px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, color: '#ffb77d', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>
              The Steakz Experience
            </p>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(30px,4vw,46px)', margin: '0 0 24px', color: '#fff', lineHeight: 1.2 }}>
              More Than a Meal — It's an Occasion
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(245,237,227,0.65)', lineHeight: 1.8, marginBottom: 20 }}>
              From the moment you walk in, every detail — the aroma of live coals, the low amber lighting, the sound of sizzling cast iron — is crafted to put you in the mood for something extraordinary.
            </p>
            <p style={{ fontSize: 15, color: 'rgba(245,237,227,0.65)', lineHeight: 1.8, marginBottom: 36 }}>
              Our sommeliers curate a wine list of over 200 labels, our bar team shake cocktails built around the flavours of fire and smoke, and our pastry chefs close each meal with desserts that are anything but an afterthought.
            </p>
            <div style={{ display: 'flex', gap: 40 }}>
              {[['28+', 'Days Aged'], ['900°C', 'Grill Temp'], ['7', 'UK Locations']].map(([val, lbl]) => (
                <div key={lbl}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, color: '#ffb77d', fontWeight: 700 }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'rgba(245,237,227,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {GALLERY.map((url, i) => (
              <div
                key={i}
                style={{
                  height: i === 0 ? 280 : 200,
                  borderRadius: 6,
                  overflow: 'hidden',
                  gridColumn: i === 0 ? '1 / -1' : 'auto',
                }}
              >
                <img
                  src={url}
                  alt="dining"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESERVATIONS BANNER ───────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #3d1f0a 0%, #271e16 100%)',
        borderTop: '1px solid #4a3020',
        padding: '80px 40px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, color: '#ffb77d', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 14 }}>Book a Table</p>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px,4vw,44px)', margin: '0 0 16px', color: '#fff' }}>
          Reserve Your Experience
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(245,237,227,0.6)', maxWidth: 480, margin: '0 auto 40px' }}>
          Available every evening from 5 pm. Private dining rooms available for parties of 10 or more.
        </p>
        <a
          href="tel:+443001234567"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: '#ffb77d',
            color: '#1a120b',
            padding: '16px 44px',
            borderRadius: 4,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fca754')}
          onMouseLeave={e => (e.currentTarget.style.background = '#ffb77d')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>call</span>
          +44 300 123 4567
        </a>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0f0702', borderTop: '1px solid #271e16', padding: '48px 40px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48, marginBottom: 40 }}>
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#ffb77d', margin: '0 0 12px' }}>Steakz</h3>
              <p style={{ fontSize: 14, color: 'rgba(245,237,227,0.5)', lineHeight: 1.7, maxWidth: 320 }}>
                Britain's premier steakhouse group. Seven restaurants bringing world-class beef to world-class cities.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ffb77d', margin: '0 0 16px' }}>Explore</h4>
              {[['Our Menu', '/menu'], ['Staff Login', '/login']].map(([label, to]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <Link to={to} style={{ fontSize: 14, color: 'rgba(245,237,227,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffb77d')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,237,227,0.55)')}>
                    {label}
                  </Link>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ffb77d', margin: '0 0 16px' }}>Contact</h4>
              <p style={{ fontSize: 14, color: 'rgba(245,237,227,0.55)', lineHeight: 1.8, margin: 0 }}>
                hello@steakz.co.uk<br />
                +44 300 123 4567<br />
                Mon – Sun: 12pm – 11pm
              </p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #271e16', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(245,237,227,0.3)', margin: 0 }}>© 2026 Steakz Ltd. All rights reserved.</p>
            <p style={{ fontSize: 13, color: 'rgba(245,237,227,0.3)', margin: 0 }}>Registered in England & Wales · No. 11234567</p>
          </div>
        </div>
      </footer>
    </div>
  );
}