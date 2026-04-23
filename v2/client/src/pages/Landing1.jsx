import { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowRight, CheckCircle2, ChevronDown, Sparkles, Bot, Users, CalendarCheck, Shield, Zap } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   LANDING 1 — "The Floating Command Center"
   Dark glassmorphism + floating 3D phones with parallax
   ═══════════════════════════════════════════════════ */

const FEATURES = [
  { icon: Bot, title: 'Smart Auto-Replies', desc: 'Handle customer messages 24/7 with contextual responses.', color: 'from-indigo-500 to-violet-500' },
  { icon: Users, title: 'Lead Capture', desc: 'Collect customer info through interactive flows automatically.', color: 'from-pink-500 to-rose-500' },
  { icon: CalendarCheck, title: 'Request Management', desc: 'Track bookings, orders, and inquiries in one dashboard.', color: 'from-amber-500 to-orange-500' },
  { icon: Zap, title: 'Multi-Channel', desc: 'Deploy on WhatsApp, Telegram, and Instagram from one builder.', color: 'from-cyan-500 to-blue-500' },
  { icon: Shield, title: 'Enterprise Security', desc: 'JWT auth, encrypted data, and full tenant isolation.', color: 'from-slate-500 to-zinc-600' },
];



const FAQ = [
  { q: 'Do I need coding skills?', a: 'No. Just pick a template, customize, and publish. Zero code needed.' },
  { q: 'Which channels are supported?', a: 'WhatsApp, Telegram, and Instagram. More coming soon.' },
  { q: 'Can I try it free?', a: 'Yes! Starter plan includes 1 flow and 50 submissions/month. No card needed.' },
  { q: 'Is my data secure?', a: 'Absolutely. JWT auth, encrypted storage, full tenant isolation.' },
];

const STATS = [
  { value: '3', label: 'Channels supported' },
  { value: '0', label: 'Coding required' },
  { value: '<5min', label: 'Setup time' },
  { value: '24/7', label: 'Bot availability' },
];

/* ── 3D Phone Component ── */
/*  Channel Flow  1 flow  3 channels with brand logos  */
function ChannelFlow() {
  const channels = [
    {
      name: 'WhatsApp',
      desc: 'Bookings 24/7',
      bg: '#25D366',
      tintBg: 'rgba(37,211,102,0.08)',
      tintBorder: 'rgba(37,211,102,0.35)',
      logo: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      ),
    },
    {
      name: 'Telegram',
      desc: 'FAQ auto-reply',
      bg: '#2AABEE',
      tintBg: 'rgba(42,171,238,0.08)',
      tintBorder: 'rgba(42,171,238,0.35)',
      logo: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      ),
    },
    {
      name: 'Instagram',
      desc: 'DM leads',
      bg: 'linear-gradient(135deg, #833AB4, #E1306C, #F56040)',
      tintBg: 'rgba(225,48,108,0.08)',
      tintBorder: 'rgba(225,48,108,0.35)',
      logo: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
      ),
    },
  ];

  return (
    <div className="channel-flow">
      <div className="flow-node">
        <div style={{ fontSize: 30, marginBottom: 6 }}>&#9889;</div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'white' }}>Your Flow</p>
        <p style={{ fontSize: 10, opacity: 0.85, margin: '4px 0 0', color: 'white' }}>Built once</p>
      </div>
      <div className="mobile-beam" />
      <svg className="flow-lines" width="90" height="120" style={{ overflow: 'visible' }}>
        <line x1="0" y1="25" x2="90" y2="15" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 4" className="flow-line" />
        <line x1="0" y1="60" x2="90" y2="60" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 4" className="flow-line" />
        <line x1="0" y1="95" x2="90" y2="105" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 4" className="flow-line" />
      </svg>
      <div className="channel-list">
        {channels.map((c) => (
          <div
            key={c.name}
            className="channel-card"
            style={{ background: c.tintBg, border: `1px solid ${c.tintBorder}` }}
          >
            <div className="channel-logo" style={{ background: c.bg }}>
              {c.logo}
            </div>
            <div>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{c.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: 0 }}>{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
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

        .channel-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          min-height: 320px;
          padding: 20px 0;
        }
        .flow-node {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          padding: 28px 24px;
          border-radius: 18px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(99,102,241,0.3), 0 0 60px rgba(139,92,246,0.2);
          position: relative;
          border: 1px solid rgba(255,255,255,0.15);
          animation: flowRotate 8s ease-in-out infinite;
          transform-style: preserve-3d;
          min-width: 130px;
          flex-shrink: 0;
        }
        @keyframes flowRotate {
          0%, 100% { transform: perspective(800px) rotateY(-4deg); }
          50%      { transform: perspective(800px) rotateY(4deg); }
        }
        .flow-lines {
          flex-shrink: 0;
        }
        .flow-line {
          animation: dashFlow 1.5s linear infinite;
        }
        @keyframes dashFlow {
          to { stroke-dashoffset: -16; }
        }
        .channel-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .channel-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border-radius: 12px;
          min-width: 180px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
          transform: perspective(600px) rotateY(3deg);
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
          cursor: default;
        }
        .channel-card:hover {
          transform: perspective(600px) rotateY(0deg) translateY(-4px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.3);
        }
        .channel-logo {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        @media (max-width: 900px) {
          .channel-flow { gap: 28px; max-width: 600px; }
          .flow-node { padding: 20px 18px; min-width: 110px; }
          .flow-lines { width: 60px; }
          .channel-card { min-width: 150px; padding: 10px 14px; }
        }
        .mobile-beam {
          display: none;
        }
        @media (max-width: 640px) {
          .mobile-beam {
            display: block;
            width: 2px;
            height: 32px;
            background: linear-gradient(180deg, #8b5cf6, #25D366);
            border-radius: 2px;
            position: relative;
            overflow: hidden;
            margin: -4px auto 4px;
          }
          .mobile-beam::after {
            content: '';
            position: absolute;
            top: -30%;
            left: 0;
            right: 0;
            height: 30%;
            background: linear-gradient(180deg, transparent, rgba(255,255,255,0.8), transparent);
            animation: beamPulse 2s ease-in-out infinite;
          }
          @keyframes beamPulse {
            0%   { top: -30%; }
            100% { top: 100%; }
          }
        }
        @media (max-width: 640px) {
          .channel-flow {
            flex-direction: column;
            gap: 16px;
            max-width: 340px;
            min-height: auto;
          }
          .flow-node {
            transform: none;
            animation: none;
            padding: 18px 32px;
          }
          .flow-lines {
            display: none;
          }
          .channel-list {
            width: 100%;
            gap: 10px;
          }
          .channel-card {
            width: 100%;
            min-width: 0;
            transform: none;
          }
          .channel-card:hover {
            transform: translateY(-2px);
          }
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
            }}>Get started <ArrowRight size={16} /></button>
          </div>

          {/* Channel flow visualization */}
          <div style={{
            position: 'relative', width: '100%',
            margin: '0 auto',
            animation: 'slideUp 0.8s ease-out 0.4s both',
          }}>
            <ChannelFlow />
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

      {/* ── FAQ ── */}
      <section style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #0a0a1a, #0f0d2e)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>FAQ</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>Frequently asked questions</h2>
          </div>
          {FAQ.map((item, idx) => (
            <div key={idx} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(167,139,250,0.25)',
              marginBottom: 8, overflow: 'hidden', boxShadow: '0 0 20px rgba(139,92,246,0.08)',
            }}>
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{item.q}</span>
                <ChevronDown size={18} color="#a78bfa" style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>
              {openFaq === idx && (
                <div style={{ padding: '0 24px 18px' }}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>{item.a}</p>
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
              <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 16 }}>Be one of the first businesses to automate with NabzChat.</p>
              <button onClick={() => onNavigate('register')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', fontSize: 15, fontWeight: 600, color: '#fff',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
                borderRadius: 16, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
              }}>Get started <ArrowRight size={16} /></button>
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
