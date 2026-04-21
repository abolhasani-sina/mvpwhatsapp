import { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowRight, CheckCircle2, Star, ChevronDown, Sparkles, Bot, Users, CalendarCheck, Shield, Zap, BarChart3 } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   LANDING 2 — "The Isometric Bot Factory"
   Light/bright isometric 3D world with conveyor belt animation
   ═══════════════════════════════════════════════════ */

const FEATURES = [
  { icon: Bot, title: 'Smart Auto-Replies', desc: 'Handle customer messages 24/7 with contextual responses.', gradient: ['#6366f1', '#8b5cf6'] },
  { icon: Users, title: 'Lead Capture', desc: 'Collect customer info through interactive flows automatically.', gradient: ['#ec4899', '#f43f5e'] },
  { icon: CalendarCheck, title: 'Request Management', desc: 'Track bookings, orders, and inquiries in one dashboard.', gradient: ['#f59e0b', '#f97316'] },
  { icon: Zap, title: 'Multi-Channel', desc: 'Deploy on WhatsApp, Telegram, and Instagram from one builder.', gradient: ['#06b6d4', '#3b82f6'] },
  { icon: BarChart3, title: 'Live Analytics', desc: 'Monitor submissions, assignments, and performance.', gradient: ['#10b981', '#14b8a6'] },
  { icon: Shield, title: 'Enterprise Security', desc: 'JWT auth, encrypted data, and full tenant isolation.', gradient: ['#64748b', '#71717a'] },
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

/* ── Isometric cube/block component ── */
function IsoCube({ x, y, w, h, d, topColor, leftColor, rightColor, children, style: extraStyle }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transformStyle: 'preserve-3d',
      ...extraStyle,
    }}>
      {/* Top face */}
      <div style={{
        position: 'absolute', width: w, height: d,
        background: topColor, transform: `rotateX(60deg) rotateZ(-45deg) translateZ(${h}px)`,
        transformOrigin: 'center center',
      }} />
      {/* Left face */}
      <div style={{
        position: 'absolute', width: d * 0.707, height: h,
        background: leftColor,
        transform: `skewY(-30deg)`, transformOrigin: 'top left',
        top: d * 0.354, left: 0,
      }} />
      {/* Right face */}
      <div style={{
        position: 'absolute', width: w * 0.707, height: h,
        background: rightColor,
        transform: `skewY(30deg)`, transformOrigin: 'top right',
        top: d * 0.354, left: d * 0.707,
      }} />
      {children}
    </div>
  );
}

/* ── Conveyor belt message bubble (animated) ── */
function ConveyorBubble({ color, emoji, text, delay, duration }) {
  return (
    <div style={{
      position: 'absolute',
      animation: `conveyorMove ${duration || 8}s linear ${delay || 0}s infinite`,
      opacity: 0,
    }}>
      <div style={{
        background: color, borderRadius: 12, padding: '8px 14px',
        fontSize: 12, color: '#fff', fontWeight: 600,
        boxShadow: `0 4px 16px ${color}44`,
        display: 'flex', alignItems: 'center', gap: 6,
        whiteSpace: 'nowrap',
      }}>
        <span>{emoji}</span> {text}
      </div>
    </div>
  );
}

/* ── Processing gear animation ── */
function Gear({ size, x, y, speed, color }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size,
      animation: `gearSpin ${speed || 4}s linear infinite`,
    }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="20" fill={color || '#6366f1'} opacity="0.2" />
        <circle cx="50" cy="50" r="12" fill={color || '#6366f1'} opacity="0.4" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <rect key={angle} x="46" y="10" width="8" height="20" rx="4" fill={color || '#6366f1'} opacity="0.3"
            transform={`rotate(${angle} 50 50)`} />
        ))}
      </svg>
    </div>
  );
}

/* ── Output card (booking/result) ── */
function OutputCard({ text, icon, delay }) {
  return (
    <div style={{
      animation: `popCard 3s ease-in-out ${delay}s infinite`,
      background: '#fff', borderRadius: 12, padding: '10px 16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
      fontSize: 12, fontWeight: 600, color: '#1e293b',
      display: 'flex', alignItems: 'center', gap: 8,
      whiteSpace: 'nowrap', marginBottom: 8,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span> {text}
    </div>
  );
}

export default function Landing2({ onNavigate }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFF', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes conveyorMove {
          0% { transform: translateX(-100px); opacity: 0; }
          5% { opacity: 1; }
          45% { opacity: 1; }
          50% { transform: translateX(350px); opacity: 0; }
          100% { transform: translateX(350px); opacity: 0; }
        }
        @keyframes gearSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes popCard {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-8px) scale(1.05); opacity: 1; }
        }
        @keyframes isoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(250,251,255,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
            }}>
              <MessageSquare size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>BotDesk</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => onNavigate('login')} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}>Log in</button>
            <button onClick={() => onNavigate('register')} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#fff',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
              borderRadius: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
            }}>Get started</button>
          </div>
        </div>
      </nav>

      {/* ── Hero — Isometric Factory ── */}
      <section style={{
        paddingTop: 64, minHeight: '100vh', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(180deg, #F0F4FF 0%, #FAFBFF 50%, #fff 100%)',
      }}>
        {/* Isometric grid floor */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          opacity: 0.08,
          backgroundImage: 'repeating-linear-gradient(60deg, #6366f1 0px, #6366f1 1px, transparent 1px, transparent 30px), repeating-linear-gradient(-60deg, #6366f1 0px, #6366f1 1px, transparent 1px, transparent 30px)',
        }} />

        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '60px 24px 40px', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: '#EEF2FF', border: '1px solid #C7D2FE',
            color: '#6366f1', fontSize: 13, fontWeight: 600, marginBottom: 24,
            animation: 'slideUpIn 0.5s ease-out',
          }}>
            <Sparkles size={14} /> See how automation works
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5.5vw, 64px)', fontWeight: 800, color: '#0f172a',
            lineHeight: 1.1, maxWidth: 650, margin: '0 auto 20px', letterSpacing: '-0.03em',
            animation: 'slideUpIn 0.5s ease-out 0.1s both',
          }}>
            Messages in,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>results out</span>
          </h1>

          <p style={{
            fontSize: 18, color: '#64748b', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7,
            animation: 'slideUpIn 0.5s ease-out 0.2s both',
          }}>
            Your bot factory turns every customer message into a structured booking, lead, or request — automatically.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 50, animation: 'slideUpIn 0.5s ease-out 0.3s both' }}>
            <button onClick={() => onNavigate('register')} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px',
              fontSize: 15, fontWeight: 600, color: '#fff',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
              borderRadius: 16, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
            }}>Start for free <ArrowRight size={16} /></button>
          </div>

          {/* ── The Factory Scene ── */}
          <div style={{
            position: 'relative', width: '100%', maxWidth: 800,
            height: 360, margin: '0 auto',
            animation: 'slideUpIn 0.8s ease-out 0.4s both',
          }}>
            {/* ── INPUT STATION (Phone) ── */}
            <div style={{
              position: 'absolute', left: '2%', top: '20%',
              animation: 'isoFloat 4s ease-in-out infinite',
            }}>
              {/* Simplified isometric phone */}
              <div style={{
                width: 100, background: '#1a1a2e', borderRadius: 16, padding: 5,
                transform: 'perspective(600px) rotateY(15deg) rotateX(-2deg)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              }}>
                <div style={{ background: '#25D366', borderRadius: '12px 12px 0 0', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                  <span style={{ color: '#fff', fontSize: 8, fontWeight: 600 }}>WhatsApp</span>
                </div>
                <div style={{ background: '#ECE5DD', padding: 6, borderRadius: '0 0 12px 12px', minHeight: 80 }}>
                  <div style={{ background: '#fff', borderRadius: 6, padding: '4px 6px', fontSize: 7, color: '#333', marginBottom: 4 }}>Hi! I'd like to book</div>
                  <div style={{ background: '#dcf8c6', borderRadius: 6, padding: '4px 6px', fontSize: 7, color: '#333', marginLeft: 'auto', maxWidth: '70%', textAlign: 'right' }}>Sure! Select...</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6366f1', marginTop: 10 }}>📱 Messages In</div>
            </div>

            {/* ── Conveyor belt (SVG line) ── */}
            <svg style={{ position: 'absolute', left: '14%', top: '45%', width: '72%', height: 40, overflow: 'visible' }}>
              <line x1="0" y1="20" x2="100%" y2="20" stroke="#c7d2fe" strokeWidth="3" strokeDasharray="8 4">
                <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1s" repeatCount="indefinite" />
              </line>
            </svg>

            {/* Conveyor bubbles */}
            <div style={{ position: 'absolute', left: '14%', top: '32%' }}>
              <ConveyorBubble color="#25D366" emoji="💬" text="Book haircut" delay={0} duration={7} />
              <div style={{ position: 'absolute', top: 30 }}>
                <ConveyorBubble color="#2AABEE" emoji="📩" text="Check menu" delay={2.5} duration={7} />
              </div>
              <div style={{ position: 'absolute', top: 60 }}>
                <ConveyorBubble color="#E1306C" emoji="📋" text="Price list" delay={5} duration={7} />
              </div>
            </div>

            {/* ── PROCESSING UNIT (Bot Engine) ── */}
            <div style={{
              position: 'absolute', left: '38%', top: '10%',
              width: 180, textAlign: 'center',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                borderRadius: 20, padding: 20, border: '2px solid #C7D2FE',
                boxShadow: '0 20px 40px rgba(99,102,241,0.1)',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Gears */}
                <div style={{ position: 'relative', height: 60 }}>
                  <Gear size={50} x={15} y={5} speed={4} color="#6366f1" />
                  <Gear size={35} x={60} y={20} speed={3} color="#8b5cf6" />
                  <Gear size={40} x={100} y={0} speed={5} color="#a78bfa" />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', marginTop: 8 }}>🤖 Bot Engine</div>
                <div style={{ fontSize: 9, color: '#818cf8', marginTop: 4 }}>Auto-sorting & routing</div>
              </div>
              {/* Status dots */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                {['#22c55e', '#f59e0b', '#6366f1'].map((c, i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: c,
                    animation: `dotPulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                    boxShadow: `0 0 8px ${c}44`,
                  }} />
                ))}
              </div>
            </div>

            {/* ── OUTPUT STATION (Dashboard) ── */}
            <div style={{
              position: 'absolute', right: '2%', top: '10%',
              animation: 'isoFloat 4s ease-in-out 1s infinite',
            }}>
              <div style={{
                width: 160, background: '#fff', borderRadius: 16, padding: 12,
                border: '1px solid #e2e8f0', boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
                transform: 'perspective(600px) rotateY(-10deg)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#64748b' }}>Dashboard</span>
                </div>
                <OutputCard text="✅ Booking #142" icon="📅" delay={0} />
                <OutputCard text="📩 New lead" icon="👤" delay={1} />
                <OutputCard text="⭐ Review received" icon="💬" delay={2} />
              </div>
              <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6366f1', marginTop: 10 }}>📊 Results Out</div>
            </div>

            {/* Channel badges floating */}
            <div style={{
              position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 12,
            }}>
              {[
                { name: 'WhatsApp', color: '#25D366', emoji: '💬' },
                { name: 'Telegram', color: '#2AABEE', emoji: '✈️' },
                { name: 'Instagram', color: '#E1306C', emoji: '📸' },
              ].map(ch => (
                <div key={ch.name} style={{
                  background: '#fff', border: `2px solid ${ch.color}22`,
                  borderRadius: 20, padding: '6px 14px', fontSize: 11, fontWeight: 600,
                  color: ch.color, display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}>
                  {ch.emoji} {ch.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, #fff, transparent)' }} />
      </section>

      {/* ── How it Works (3-step) ── */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>How it works</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a' }}>Three simple steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { step: '01', title: 'Pick a template', desc: 'Choose from beauty, clinic, restaurant, and more. Customize it.', emoji: '🎨' },
              { step: '02', title: 'Connect channels', desc: 'Link WhatsApp, Telegram, or Instagram in one click.', emoji: '🔗' },
              { step: '03', title: 'Go live', desc: 'Your bot handles everything while you focus on your business.', emoji: '🚀' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
                  background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                }}>{s.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', marginBottom: 8 }}>STEP {s.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '100px 24px', background: '#F8FAFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Features</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a' }}>Everything you need</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: '#fff', borderRadius: 16, padding: 28,
                border: '1px solid #e2e8f0', transition: 'all 0.2s', cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `linear-gradient(135deg, ${f.gradient[0]}, ${f.gradient[1]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                }}>
                  <f.icon size={20} color="#fff" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Testimonials</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a' }}>Loved by business owners</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{
                background: '#f8fafc', borderRadius: 16, padding: 28, border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: t.stars }).map((_, i) => <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />)}
                </div>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                  }}>{t.name[0]}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: '100px 24px', background: '#F8FAFF' }}>
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
                boxShadow: p.highlighted ? '0 12px 40px rgba(99,102,241,0.1)' : 'none',
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
                }}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a' }}>FAQ</h2>
          </div>
          {FAQ.map((item, idx) => (
            <div key={idx} style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 8, overflow: 'hidden' }}>
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.q}</span>
                <ChevronDown size={18} color="#94a3b8" style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>
              {openFaq === idx && <div style={{ padding: '0 24px 18px' }}><p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{item.a}</p></div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px', background: '#F8FAFF' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            borderRadius: 24, padding: '60px 40px', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF, #C7D2FE)',
            border: '1px solid #C7D2FE',
          }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1e1b4b', marginBottom: 16 }}>Ready to build your factory?</h2>
            <p style={{ color: '#6366f1', marginBottom: 32, fontSize: 16 }}>Start automating in under 5 minutes.</p>
            <button onClick={() => onNavigate('register')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', fontSize: 15, fontWeight: 600, color: '#fff',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
              borderRadius: 16, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
            }}>Start for free <ArrowRight size={16} /></button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '24px', background: '#FAFBFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 600, color: '#475569' }}>BotDesk</span>
          </div>
          <span>&copy; {new Date().getFullYear()} BotDesk. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
