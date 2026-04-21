import { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowRight, CheckCircle2, Star, ChevronDown, Sparkles, Bot, Users, CalendarCheck, Shield, Zap, BarChart3 } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   LANDING 3 — "The Holographic Interface"
   Dark futuristic with neon wireframe, holographic menu tree, particles
   ═══════════════════════════════════════════════════ */

const FEATURES = [
  { icon: Bot, title: 'Smart Auto-Replies', desc: 'Handle customer messages 24/7 with contextual responses.' },
  { icon: Users, title: 'Lead Capture', desc: 'Collect customer info through interactive flows automatically.' },
  { icon: CalendarCheck, title: 'Request Management', desc: 'Track bookings, orders, and inquiries in one dashboard.' },
  { icon: Zap, title: 'Multi-Channel', desc: 'Deploy on WhatsApp, Telegram, and Instagram from one builder.' },
  { icon: BarChart3, title: 'Live Analytics', desc: 'Monitor submissions, assignments, and performance in real time.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'JWT auth, encrypted data, and full tenant isolation.' },
];

const PRICING = [
  { name: 'Starter', price: '0', desc: 'Get started free', features: ['1 bot flow', '50 submissions/mo', 'Telegram channel', 'Community support'], cta: 'Start free', highlighted: false },
  { name: 'Pro', price: '29', desc: 'For growing businesses', features: ['Unlimited flows', '2,000 submissions/mo', 'All channels', '5 staff', 'Priority support'], cta: 'Start free trial', highlighted: true },
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
  { q: 'Can I try it free?', a: 'Yes! Starter plan includes 1 flow and 50 submissions/month.' },
  { q: 'Is my data secure?', a: 'Absolutely. JWT auth, encrypted storage, full tenant isolation.' },
];

/* ── Floating particles ── */
function Particles() {
  const particles = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      dur: 4 + Math.random() * 6,
      delay: Math.random() * 5,
      color: ['#06b6d4', '#6366f1', '#8b5cf6', '#22d3ee'][Math.floor(Math.random() * 4)],
    }))
  ).current;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.color, boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          animation: `particleDrift ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
          opacity: 0.6,
        }} />
      ))}
    </div>
  );
}

/* ── Holographic menu tree that rises from the phone ── */
function HoloMenuTree() {
  const nodes = [
    { x: 0, y: 0, label: '🏠 Main Menu', level: 0 },
    { x: -100, y: -60, label: '📋 Services', level: 1 },
    { x: 0, y: -70, label: '📅 Book', level: 1 },
    { x: 100, y: -60, label: '💰 Prices', level: 1 },
    { x: -140, y: -120, label: '💇 Haircut', level: 2 },
    { x: -60, y: -125, label: '💅 Nails', level: 2 },
    { x: -20, y: -135, label: '📆 Select Date', level: 2 },
    { x: 20, y: -130, label: '⏰ Select Time', level: 2 },
    { x: 80, y: -115, label: '🏷️ Basic', level: 2 },
    { x: 130, y: -125, label: '⭐ Premium', level: 2 },
  ];

  const connections = [
    [0, 1], [0, 2], [0, 3],
    [1, 4], [1, 5],
    [2, 6], [2, 7],
    [3, 8], [3, 9],
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '35%',
      transform: 'translateX(-50%)',
      width: 400, height: 200,
    }}>
      {/* Connections */}
      <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        {connections.map(([from, to], i) => (
          <line key={i}
            x1={200 + nodes[from].x} y1={180 + nodes[from].y}
            x2={200 + nodes[to].x} y2={180 + nodes[to].y}
            stroke="#06b6d4" strokeWidth="1" opacity="0.4"
            strokeDasharray="4 3"
          >
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
          </line>
        ))}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: 200 + node.x - (node.level === 0 ? 50 : 40),
          top: 180 + node.y - 12,
          padding: '5px 10px',
          borderRadius: 8,
          border: `1px solid ${node.level === 0 ? '#06b6d4' : '#6366f1'}`,
          background: `${node.level === 0 ? '#06b6d4' : '#6366f1'}15`,
          boxShadow: `0 0 12px ${node.level === 0 ? '#06b6d4' : '#6366f1'}33, inset 0 0 8px ${node.level === 0 ? '#06b6d4' : '#6366f1'}11`,
          fontSize: node.level === 0 ? 10 : 8,
          color: node.level === 0 ? '#22d3ee' : '#a5b4fc',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          animation: `holoNodeAppear 0.6s ease-out ${0.3 + i * 0.12}s both, holoPulse 4s ease-in-out ${i * 0.3}s infinite`,
          textAlign: 'center',
        }}>{node.label}</div>
      ))}
    </div>
  );
}

/* ── Circular HUD elements ── */
function HUDRing({ size, x, y, color, speed }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: size, height: size, animation: `gearSpin ${speed}s linear infinite` }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
        <circle cx="50" cy="50" r="35" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" strokeDasharray="10 5" />
        {[0, 90, 180, 270].map(a => (
          <circle key={a} cx={50 + 45 * Math.cos(a * Math.PI/180)} cy={50 + 45 * Math.sin(a * Math.PI/180)} r="2" fill={color} opacity="0.5" />
        ))}
      </svg>
    </div>
  );
}

export default function Landing3({ onNavigate }) {
  const [openFaq, setOpenFaq] = useState(null);
  const heroRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handler = (e) => {
      const r = el.getBoundingClientRect();
      setMouse({
        x: ((e.clientX - r.left) / r.width - 0.5) * 2,
        y: ((e.clientY - r.top) / r.height - 0.5) * 2,
      });
    };
    el.addEventListener('mousemove', handler);
    return () => el.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0' }}>
      <style>{`
        @keyframes gearSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes particleDrift {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes holoNodeAppear {
          from { opacity: 0; transform: translateY(20px) scale(0.7); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes holoPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        @keyframes neonPulse {
          0%, 100% { box-shadow: 0 0 20px #06b6d433, 0 0 40px #6366f122; }
          50% { box-shadow: 0 0 30px #06b6d466, 0 0 60px #6366f144; }
        }
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanLine {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes glowText {
          0%, 100% { text-shadow: 0 0 10px #06b6d444, 0 0 20px #6366f122; }
          50% { text-shadow: 0 0 20px #06b6d488, 0 0 40px #6366f144; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(6,182,212,0.15)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              border: '1px solid #06b6d4',
              background: 'rgba(6,182,212,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(6,182,212,0.3)',
            }}>
              <MessageSquare size={18} color="#06b6d4" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.05em' }}>BotDesk</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => onNavigate('login')} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}>Log in</button>
            <button onClick={() => onNavigate('register')} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#fff',
              background: 'transparent', border: '1px solid #06b6d4',
              borderRadius: 12, cursor: 'pointer', boxShadow: '0 0 12px rgba(6,182,212,0.2)',
            }}>Get started</button>
          </div>
        </div>
      </nav>

      {/* ── Hero — Holographic Interface ── */}
      <section ref={heroRef} style={{
        paddingTop: 64, minHeight: '100vh', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 60%, #0c1222 0%, #000 70%)',
      }}>
        <Particles />

        {/* HUD rings */}
        <HUDRing size={200} x="5%" y="15%" color="#06b6d4" speed={30} />
        <HUDRing size={150} x="80%" y="25%" color="#6366f1" speed={25} />
        <HUDRing size={100} x="75%" y="65%" color="#22d3ee" speed={20} />

        {/* Grid floor */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(to top, rgba(6,182,212,0.05), transparent)',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(6,182,212,0.08) 0px, rgba(6,182,212,0.08) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, rgba(6,182,212,0.08) 0px, rgba(6,182,212,0.08) 1px, transparent 1px, transparent 60px)',
          transform: 'perspective(500px) rotateX(45deg)',
          transformOrigin: 'bottom center',
        }} />

        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '80px 24px 40px', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
            color: '#22d3ee', fontSize: 13, fontWeight: 600, marginBottom: 24,
            animation: 'slideUpIn 0.5s ease-out',
          }}>
            <Sparkles size={14} /> Next-gen bot interface
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5.5vw, 64px)', fontWeight: 800, color: '#e2e8f0',
            lineHeight: 1.1, maxWidth: 700, margin: '0 auto 20px', letterSpacing: '-0.03em',
            animation: 'slideUpIn 0.5s ease-out 0.1s both, glowText 4s ease-in-out infinite',
          }}>
            The future of{' '}
            <span style={{ color: '#06b6d4' }}>customer</span>{' '}
            <span style={{ color: '#8b5cf6' }}>automation</span>
          </h1>

          <p style={{
            fontSize: 18, color: '#64748b', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7,
            animation: 'slideUpIn 0.5s ease-out 0.2s both',
          }}>
            Build intelligent WhatsApp bots with a holographic flow builder. See your menu tree come alive.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 60, animation: 'slideUpIn 0.5s ease-out 0.3s both' }}>
            <button onClick={() => onNavigate('register')} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px',
              fontSize: 15, fontWeight: 600, color: '#000',
              background: 'linear-gradient(135deg, #06b6d4, #22d3ee)', border: 'none',
              borderRadius: 16, cursor: 'pointer', boxShadow: '0 0 24px rgba(6,182,212,0.4)',
            }}>Enter the interface <ArrowRight size={16} /></button>
          </div>

          {/* ── The Holographic Scene ── */}
          <div style={{
            position: 'relative', width: '100%', maxWidth: 500,
            height: 400, margin: '0 auto',
            animation: 'slideUpIn 0.8s ease-out 0.4s both',
          }}>
            {/* Central phone */}
            <div style={{
              position: 'absolute', left: '50%', bottom: 20,
              transform: `translateX(-50%) perspective(800px) rotateX(${5 + mouse.y * 3}deg) rotateY(${mouse.x * 5}deg)`,
              transition: 'transform 0.15s ease-out',
            }}>
              <div style={{
                width: 140, background: '#0a0a1a', borderRadius: 24, padding: 6,
                border: '1px solid rgba(6,182,212,0.3)',
                boxShadow: '0 0 40px rgba(6,182,212,0.15), 0 20px 60px rgba(0,0,0,0.5)',
                animation: 'neonPulse 3s ease-in-out infinite',
              }}>
                {/* Status bar */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
                  <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(6,182,212,0.3)' }} />
                </div>
                {/* Screen */}
                <div style={{
                  background: '#0c1222', borderRadius: 18, padding: 10, minHeight: 160,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Scan line */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: 1,
                    background: 'linear-gradient(90deg, transparent, #06b6d433, transparent)',
                    animation: 'scanLine 3s linear infinite',
                  }} />

                  <div style={{ background: '#25D366', borderRadius: 8, padding: '5px 8px', fontSize: 8, color: '#fff', fontWeight: 600, marginBottom: 8 }}>
                    💬 WhatsApp Bot
                  </div>
                  {[
                    { text: 'Hi! How can I help?', bot: true },
                    { text: 'Show me services', bot: false },
                    { text: 'Select from menu ↓', bot: true },
                  ].map((msg, i) => (
                    <div key={i} style={{
                      background: msg.bot ? 'rgba(6,182,212,0.15)' : 'rgba(99,102,241,0.15)',
                      borderRadius: 6, padding: '3px 6px', fontSize: 7, marginBottom: 3,
                      color: msg.bot ? '#22d3ee' : '#a5b4fc',
                      border: `1px solid ${msg.bot ? 'rgba(6,182,212,0.2)' : 'rgba(99,102,241,0.2)'}`,
                      marginLeft: msg.bot ? 0 : 'auto', maxWidth: '80%',
                      textAlign: msg.bot ? 'left' : 'right',
                    }}>{msg.text}</div>
                  ))}
                </div>
              </div>

              {/* Holographic projection beam */}
              <div style={{
                position: 'absolute', left: '50%', top: -10,
                transform: 'translateX(-50%)',
                width: 2, height: 10,
                background: 'linear-gradient(to top, #06b6d4, transparent)',
                boxShadow: '0 0 10px #06b6d4',
              }} />
            </div>

            {/* Holo menu tree floating above */}
            <HoloMenuTree />

            {/* Data readouts */}
            <div style={{ position: 'absolute', left: 0, top: '30%', fontSize: 9, color: '#22d3ee', opacity: 0.5, fontFamily: 'monospace' }}>
              <div>SYS.STATUS: ACTIVE</div>
              <div>CHANNELS: 3/3</div>
              <div>UPTIME: 99.9%</div>
            </div>
            <div style={{ position: 'absolute', right: 0, top: '35%', fontSize: 9, color: '#a78bfa', opacity: 0.5, fontFamily: 'monospace', textAlign: 'right' }}>
              <div>FLOWS: 12</div>
              <div>RESPONSES: 2.4k</div>
              <div>LATENCY: 45ms</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '100px 24px', background: '#050510' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Capabilities</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#e2e8f0' }}>Engineered for performance</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: 'rgba(15,23,42,0.5)', borderRadius: 16, padding: 28,
                border: '1px solid rgba(6,182,212,0.1)',
                transition: 'all 0.3s', cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(6,182,212,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                }}>
                  <f.icon size={20} color="#06b6d4" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '100px 24px', background: '#000' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Testimonials</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#e2e8f0' }}>Trusted by operators</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{
                background: 'rgba(15,23,42,0.4)', borderRadius: 16, padding: 28,
                border: '1px solid rgba(99,102,241,0.15)',
              }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: t.stars }).map((_, i) => <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />)}
                </div>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '1px solid #06b6d4', background: 'rgba(6,182,212,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#22d3ee',
                  }}>{t.name[0]}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: '100px 24px', background: '#050510' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Pricing</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#e2e8f0' }}>Transparent pricing</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {PRICING.map(p => (
              <div key={p.name} style={{
                borderRadius: 16, padding: 28,
                border: p.highlighted ? '1px solid #06b6d4' : '1px solid rgba(99,102,241,0.15)',
                background: p.highlighted ? 'rgba(6,182,212,0.05)' : 'rgba(15,23,42,0.4)',
                boxShadow: p.highlighted ? '0 0 30px rgba(6,182,212,0.1)' : 'none',
                position: 'relative', transform: p.highlighted ? 'scale(1.03)' : 'none',
              }}>
                {p.highlighted && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #06b6d4, #22d3ee)', color: '#000',
                    fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
                  }}>Most Popular</div>
                )}
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{p.desc}</p>
                <div style={{ margin: '20px 0' }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: '#e2e8f0' }}>${p.price}</span>
                  <span style={{ fontSize: 14, color: '#64748b' }}>/mo</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#94a3b8', marginBottom: 10 }}>
                      <CheckCircle2 size={16} color="#06b6d4" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => onNavigate('register')} style={{
                  width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 600, borderRadius: 12,
                  border: 'none', cursor: 'pointer',
                  background: p.highlighted ? 'linear-gradient(135deg, #06b6d4, #22d3ee)' : 'rgba(99,102,241,0.15)',
                  color: p.highlighted ? '#000' : '#a5b4fc',
                }}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '100px 24px', background: '#000' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#e2e8f0' }}>FAQ</h2>
          </div>
          {FAQ.map((item, idx) => (
            <div key={idx} style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(6,182,212,0.1)', marginBottom: 8 }}>
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{item.q}</span>
                <ChevronDown size={18} color="#64748b" style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>
              {openFaq === idx && <div style={{ padding: '0 24px 18px' }}><p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{item.a}</p></div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px', background: '#050510' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            borderRadius: 24, padding: '60px 40px', position: 'relative', overflow: 'hidden',
            background: 'rgba(6,182,212,0.05)',
            border: '1px solid rgba(6,182,212,0.2)',
            boxShadow: '0 0 60px rgba(6,182,212,0.05)',
          }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>Ready to enter the interface?</h2>
            <p style={{ color: '#64748b', marginBottom: 32, fontSize: 16 }}>Start building your holographic bot in minutes.</p>
            <button onClick={() => onNavigate('register')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', fontSize: 15, fontWeight: 600, color: '#000',
              background: 'linear-gradient(135deg, #06b6d4, #22d3ee)', border: 'none',
              borderRadius: 16, cursor: 'pointer', boxShadow: '0 0 24px rgba(6,182,212,0.4)',
            }}>Get started <ArrowRight size={16} /></button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(6,182,212,0.1)', padding: '24px', background: '#000' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={14} color="#06b6d4" />
            </div>
            <span style={{ fontWeight: 600, color: '#94a3b8' }}>BotDesk</span>
          </div>
          <span>&copy; {new Date().getFullYear()} BotDesk. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
