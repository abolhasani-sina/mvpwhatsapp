import { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowRight, CheckCircle2, Star, ChevronDown, Sparkles, Play, Bot, Users, CalendarCheck, Shield, Zap, BarChart3, Globe, Headphones } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   LANDING 1 — "The Floating Command Center"
   Dark glassmorphism + floating 3D phones with parallax
   ═══════════════════════════════════════════════════ */

const FEATURES = [
  { icon: Bot, title: 'Smart Auto-Replies', desc: 'Handle customer messages 24/7 with contextual responses.', color: 'from-indigo-500 to-violet-500' },
  { icon: Users, title: 'Lead Capture', desc: 'Collect customer info through interactive flows automatically.', color: 'from-pink-500 to-rose-500' },
  { icon: CalendarCheck, title: 'Request Management', desc: 'Track bookings, orders, and inquiries in one dashboard.', color: 'from-amber-500 to-orange-500' },
  { icon: Zap, title: 'Multi-Channel', desc: 'Deploy on WhatsApp, Telegram, and Instagram from one builder.', color: 'from-cyan-500 to-blue-500' },
  { icon: BarChart3, title: 'Live Analytics', desc: 'Monitor submissions, assignments, and performance.', color: 'from-emerald-500 to-teal-500' },
  { icon: Shield, title: 'Enterprise Security', desc: 'JWT auth, encrypted data, and full tenant isolation.', color: 'from-slate-500 to-zinc-600' },
];

const PRICING = [
  { name: 'Starter', price: '0', desc: 'Get started free', features: ['1 bot flow', '50 submissions/mo', 'Telegram channel', 'Community support'], cta: 'Start free', highlighted: false },
  { name: 'Pro', price: '29', desc: 'For growing businesses', features: ['Unlimited flows', '2,000 submissions/mo', 'All channels', '5 staff members', 'Priority support'], cta: 'Start free trial', highlighted: true },
  { name: 'Business', price: '79', desc: 'For teams & agencies', features: ['Everything in Pro', '10,000 submissions/mo', 'Unlimited staff', 'API access', 'Dedicated support'], cta: 'Contact us', highlighted: false },
];

const TESTIMONIALS = [
  { name: 'Sara M.', role: 'Salon Owner', text: 'Cut our no-show rate by 40%. Clients book directly on WhatsApp.', stars: 5 },
  { name: 'Omar K.', role: 'Clinic Manager', text: 'We handle 200+ patient inquiries per week without extra staff.', stars: 5 },
  { name: 'Lina T.', role: 'Restaurant Owner', text: 'Setup took under 10 minutes. Our WhatsApp handles orders now.', stars: 5 },
];

const FAQ = [
  { q: 'Do I need coding skills?', a: 'No. Just pick a template, customize, and publish. Zero code needed.' },
  { q: 'Which channels are supported?', a: 'WhatsApp, Telegram, and Instagram. More coming soon.' },
  { q: 'Can I try it free?', a: 'Yes! Starter plan includes 1 flow and 50 submissions/month. No card needed.' },
  { q: 'Is my data secure?', a: 'Absolutely. JWT auth, encrypted storage, full tenant isolation.' },
];

const STATS = [
  { value: '10K+', label: 'Messages handled' },
  { value: '500+', label: 'Businesses' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<5min', label: 'Setup time' },
];

/* ── 3D Phone Component ── */
function Phone3D({ channel, style, mouseOffset, children }) {
  const colors = {
    whatsapp: { header: 'linear-gradient(135deg, #25D366, #128C7E)', bg: '#ECE5DD', accent: '#25D366' },
    telegram: { header: 'linear-gradient(135deg, #2AABEE, #229ED9)', bg: '#E6EBF0', accent: '#2AABEE' },
    instagram: { header: 'linear-gradient(135deg, #833AB4, #E1306C, #F56040)', bg: '#FAFAFA', accent: '#E1306C' },
  };
  const c = colors[channel];
  const mx = mouseOffset?.x || 0;
  const my = mouseOffset?.y || 0;

  return (
    <div style={{
      ...style,
      transform: `${style?.transform || ''} perspective(1200px) rotateX(${5 + my * 0.02}deg) rotateY(${-15 + mx * 0.03}deg)`,
      transition: 'transform 0.1s ease-out',
      willChange: 'transform',
    }}>
      <div style={{
        width: 220, borderRadius: 28, background: '#1a1a2e', padding: 8,
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.15)',
      }}>
        <div style={{ borderRadius: 22, overflow: 'hidden', background: c.bg }}>
          {/* Header */}
          <div style={{
            background: c.header, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={14} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Your Business</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>online</div>
            </div>
          </div>
          {/* Chat */}
          <div style={{ padding: 12, minHeight: 220 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ text, from = 'bot', accent }) {
  const isBot = from === 'bot';
  return (
    <div style={{
      maxWidth: '85%', marginLeft: isBot ? 0 : 'auto', marginRight: isBot ? 'auto' : 0,
      marginBottom: 6,
    }}>
      <div style={{
        background: isBot ? '#fff' : (accent || '#6366f1'),
        color: isBot ? '#1e293b' : '#fff',
        borderRadius: 14,
        borderTopLeftRadius: isBot ? 4 : 14,
        borderBottomRightRadius: isBot ? 14 : 4,
        padding: '8px 12px',
        fontSize: 11,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        lineHeight: 1.4,
      }}>{text}</div>
    </div>
  );
}

function MenuButton({ text, accent }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${accent || '#6366f1'}22`,
      borderRadius: 10, padding: '6px 10px', fontSize: 11,
      fontWeight: 600, color: accent || '#6366f1', textAlign: 'center',
      marginBottom: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>{text}</div>
  );
}

/* ── Floating Notification Badge ── */
function FloatingBadge({ text, delay, mouseOffset }) {
  const mx = mouseOffset?.x || 0;
  const my = mouseOffset?.y || 0;
  return (
    <div style={{
      position: 'absolute',
      animation: `floatBadge 6s ease-in-out ${delay}s infinite`,
      transform: `translate(${mx * 0.01}px, ${my * 0.01}px)`,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
        padding: '6px 14px', fontSize: 11, fontWeight: 600,
        color: '#a5b4fc', whiteSpace: 'nowrap',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}>{text}</div>
    </div>
  );
}

export default function Landing1({ onNavigate }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setMouseOffset({ x: e.clientX - cx, y: e.clientY - cy });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes floatPhone {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(15,15,30,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>
              <MessageSquare size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>NabzChat</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => onNavigate('login')} style={{
              padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#94a3b8',
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}>Log in</button>
            <button onClick={() => onNavigate('register')} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#fff',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
              borderRadius: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>Get started</button>
          </div>
        </div>
      </nav>

      {/* ── Hero — Floating Command Center ── */}
      <section ref={heroRef} style={{
        position: 'relative', overflow: 'hidden', paddingTop: 64,
        background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0d2e 40%, #1a1145 100%)',
        minHeight: '100vh',
      }}>
        {/* Ambient glows */}
        <div style={{
          position: 'absolute', top: '10%', left: '30%', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)', animation: 'pulseGlow 4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: '10%', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(80px)', animation: 'pulseGlow 5s ease-in-out 1s infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '10%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)',
        }} />

        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div style={{
          position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '80px 24px 60px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#a5b4fc', fontSize: 13, fontWeight: 500, marginBottom: 32,
            
          }}>
            <Sparkles size={14} /> Multi-channel bot automation
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, color: '#fff',
            textAlign: 'center', lineHeight: 1.1, maxWidth: 700, margin: '0 auto 24px',
            letterSpacing: '-0.03em', 
          }}>
            Your business on{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #a78bfa, #c084fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>autopilot</span>
          </h1>

          <p style={{
            fontSize: 18, color: '#94a3b8', textAlign: 'center', maxWidth: 520,
            margin: '0 auto 40px', lineHeight: 1.7,
            
          }}>
            Build bots that handle bookings, answer FAQs, and capture leads across WhatsApp, Telegram & Instagram.
          </p>

          {/* CTA */}
          <div style={{
            display: 'flex', gap: 12, marginBottom: 60, flexWrap: 'wrap', justifyContent: 'center',
            
          }}>
            <button onClick={() => onNavigate('register')} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', fontSize: 15, fontWeight: 600, color: '#fff',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
              borderRadius: 16, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
            }}>Start for free <ArrowRight size={16} /></button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', fontSize: 15, fontWeight: 600, color: '#cbd5e1',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, cursor: 'pointer',
            }}><Play size={16} /> See demo</button>
          </div>

          {/* ── 3D Floating Phones ── */}
          <div style={{
            position: 'relative', width: '100%', maxWidth: 800,
            height: 420, margin: '0 auto',
            
          }}>
            {/* Main WhatsApp phone */}
            <Phone3D channel="whatsapp" mouseOffset={mouseOffset} style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)', zIndex: 3,
              animation: 'floatPhone 4s ease-in-out infinite',
            }}>
              <ChatBubble text="👋 Welcome! How can I help you today?" accent="#25D366" />
              <div style={{ maxWidth: '80%' }}>
                <MenuButton text="📋 Our Services" accent="#25D366" />
                <MenuButton text="📅 Book Now" accent="#25D366" />
                <MenuButton text="❓ FAQ" accent="#25D366" />
              </div>
              <ChatBubble text="📅 Book Now" from="user" accent="#25D366" />
              <ChatBubble text="Great choice! Let me guide you..." accent="#25D366" />
            </Phone3D>

            {/* Telegram phone - left, back */}
            <Phone3D channel="telegram" mouseOffset={mouseOffset} style={{
              position: 'absolute', left: '5%', top: '15%',
              transform: 'scale(0.75)', zIndex: 1, opacity: 0.7,
              animation: 'floatPhone 5s ease-in-out 0.5s infinite',
            }}>
              <ChatBubble text="Welcome to our service! 🤖" accent="#2AABEE" />
              <div style={{ maxWidth: '80%' }}>
                <MenuButton text="View Menu" accent="#2AABEE" />
                <MenuButton text="Book Appointment" accent="#2AABEE" />
              </div>
            </Phone3D>

            {/* Instagram phone - right, back */}
            <Phone3D channel="instagram" mouseOffset={mouseOffset} style={{
              position: 'absolute', right: '5%', top: '10%',
              transform: 'scale(0.75)', zIndex: 2, opacity: 0.7,
              animation: 'floatPhone 5s ease-in-out 1s infinite',
            }}>
              <ChatBubble text="Hey! 👋 Check out our services" accent="#E1306C" />
              <div style={{ maxWidth: '80%' }}>
                <MenuButton text="💇 Hair" accent="#E1306C" />
                <MenuButton text="💅 Nails" accent="#E1306C" />
              </div>
            </Phone3D>

            {/* Floating notification badges */}
            <div style={{ position: 'absolute', top: '5%', left: '20%' }}>
              <FloatingBadge text="✅ New booking!" delay={0} mouseOffset={mouseOffset} />
            </div>
            <div style={{ position: 'absolute', top: '60%', right: '8%' }}>
              <FloatingBadge text="📩 Lead captured" delay={2} mouseOffset={mouseOffset} />
            </div>
            <div style={{ position: 'absolute', bottom: '10%', left: '12%' }}>
              <FloatingBadge text="🔔 Staff notified" delay={4} mouseOffset={mouseOffset} />
            </div>

            {/* Glassmorphic dashboard panel behind phones */}
            <div style={{
              position: 'absolute', top: '30%', left: '50%',
              transform: `translate(-50%, -50%) perspective(800px) rotateX(8deg) translate(${mouseOffset.x * 0.005}px, ${mouseOffset.y * 0.005}px)`,
              width: 600, height: 200, borderRadius: 20,
              background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.06)', zIndex: 0,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }} />
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
            maxWidth: 500, margin: '40px auto 0', width: '100%',
          }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
          background: 'linear-gradient(to top, #fff, transparent)',
        }} />
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Features</p>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>Everything you need to automate</h2>
          <p style={{ marginTop: 16, color: '#64748b', fontSize: 18 }}>Powerful tools in an interface anyone can use</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: '#fff', borderRadius: 16, padding: 28,
              border: '1px solid #f1f5f9', transition: 'all 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, var(--c1), var(--c2))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                '--c1': f.color.includes('indigo') ? '#6366f1' : f.color.includes('pink') ? '#ec4899' : f.color.includes('amber') ? '#f59e0b' : f.color.includes('cyan') ? '#06b6d4' : f.color.includes('emerald') ? '#10b981' : '#64748b',
                '--c2': f.color.includes('violet') ? '#8b5cf6' : f.color.includes('rose') ? '#f43f5e' : f.color.includes('orange') ? '#f97316' : f.color.includes('blue') ? '#3b82f6' : f.color.includes('teal') ? '#14b8a6' : '#71717a',
              }}>
                <f.icon size={20} color="#fff" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '100px 24px', background: '#0a0a1a' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Testimonials</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>Loved by business owners</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{
                background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)',
                borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: t.stars }).map((_, i) => <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />)}
                </div>
                <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                  }}>{t.name[0]}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Pricing</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a' }}>Simple, transparent pricing</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {PRICING.map(p => (
              <div key={p.name} style={{
                borderRadius: 16, padding: 28,
                border: p.highlighted ? '2px solid #6366f1' : '1px solid #e2e8f0',
                background: p.highlighted ? 'linear-gradient(180deg, #eef2ff, #fff)' : '#fff',
                boxShadow: p.highlighted ? '0 12px 40px rgba(99,102,241,0.12)' : 'none',
                position: 'relative', transform: p.highlighted ? 'scale(1.03)' : 'none',
              }}>
                {p.highlighted && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
                  }}>Most Popular</div>
                )}
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{p.desc}</p>
                <div style={{ margin: '20px 0' }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: '#0f172a' }}>${p.price}</span>
                  <span style={{ fontSize: 14, color: '#94a3b8' }}>/mo</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569', marginBottom: 10 }}>
                      <CheckCircle2 size={16} color="#6366f1" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => onNavigate('register')} style={{
                  width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 600, borderRadius: 12,
                  border: 'none', cursor: 'pointer',
                  background: p.highlighted ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f1f5f9',
                  color: p.highlighted ? '#fff' : '#475569',
                  boxShadow: p.highlighted ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                }}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '100px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>FAQ</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a' }}>Frequently asked questions</h2>
          </div>
          {FAQ.map((item, idx) => (
            <div key={idx} style={{
              background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
              marginBottom: 8, overflow: 'hidden',
            }}>
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.q}</span>
                <ChevronDown size={18} color="#94a3b8" style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>
              {openFaq === idx && (
                <div style={{ padding: '0 24px 18px' }}>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            borderRadius: 24, padding: '60px 40px', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #312e81)',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 300, height: 300,
              background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
              borderRadius: '50%', filter: 'blur(40px)',
            }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Ready to automate?</h2>
              <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 16 }}>Join hundreds of businesses using NabzChat.</p>
              <button onClick={() => onNavigate('register')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', fontSize: 15, fontWeight: 600, color: '#fff',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
                borderRadius: 16, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
              }}>Start for free <ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 600, color: '#475569' }}>NabzChat</span>
          </div>
          <span>&copy; {new Date().getFullYear()} NabzChat. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
