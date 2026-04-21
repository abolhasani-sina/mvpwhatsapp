import { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowRight, CheckCircle2, Star, ChevronDown, Sparkles, Bot, Users, CalendarCheck, Shield, Zap, BarChart3 } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   LANDING 4 — "The Morphing Device Showcase"
   Ultra-clean Apple-inspired white with 3D laptop → phone metamorphosis
   ═══════════════════════════════════════════════════ */

const FEATURES = [
  { icon: Bot, title: 'Smart Auto-Replies', desc: 'Handle customer messages 24/7 with contextual responses.' },
  { icon: Users, title: 'Lead Capture', desc: 'Collect customer info through interactive flows automatically.' },
  { icon: CalendarCheck, title: 'Request Management', desc: 'Track bookings, orders, and inquiries in one dashboard.' },
  { icon: Zap, title: 'Multi-Channel', desc: 'Deploy on WhatsApp, Telegram, and Instagram from one builder.' },
  { icon: BarChart3, title: 'Live Analytics', desc: 'Monitor submissions, assignments, and performance.' },
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

/* ── Floating feature cards (tilt on hover) ── */
function FeatureCard({ icon: Icon, title, desc, index }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const r = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 10;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -10;
    setTilt({ x, y });
  };

  return (
    <div ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        background: '#fff', borderRadius: 20, padding: 32,
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        transform: `perspective(600px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out, box-shadow 0.3s',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: '#f8fafc', border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
      }}>
        <Icon size={22} color="#6366f1" />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

export default function Landing4({ onNavigate }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Morph progress: 0 = laptop, 1 = phone
  const morphStart = 200;
  const morphEnd = 600;
  const morphProgress = Math.min(1, Math.max(0, (scrollY - morphStart) / (morphEnd - morphStart)));

  // Interpolations
  const deviceWidth = 480 - morphProgress * 340; // 480 → 140
  const deviceHeight = 300 - morphProgress * 60; // 300 → 240
  const deviceRadius = 12 + morphProgress * 16; // 12 → 28
  const baseRotateX = 55 - morphProgress * 55; // 55 → 0 (lid opens flat → phone flat)
  const deviceScale = 1 - morphProgress * 0.1;

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Inter', system-ui, sans-serif", color: '#0f172a' }}>
      <style>{`
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrollY > 50 ? 'rgba(255,255,255,0.8)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(16px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid #f1f5f9' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>NabzChat</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => onNavigate('login')} style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}>Log in</button>
            <button onClick={() => onNavigate('register')} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#fff',
              background: '#0f172a', border: 'none',
              borderRadius: 50, cursor: 'pointer',
            }}>Get started</button>
          </div>
        </div>
      </nav>

      {/* ── Hero — Morphing Device ── */}
      <section ref={heroRef} style={{
        paddingTop: 64, minHeight: '160vh', position: 'relative',
        background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)',
      }}>
        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          opacity: 0.3,
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div style={{ position: 'sticky', top: 80, zIndex: 2, textAlign: 'center', padding: '20px 24px' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 50,
            background: '#f1f5f9', color: '#475569',
            fontSize: 13, fontWeight: 600, marginBottom: 24,
            animation: 'slideUpIn 0.5s ease-out',
          }}>
            <Sparkles size={14} /> Build once, deploy everywhere
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5.5vw, 68px)', fontWeight: 800, color: '#0f172a',
            lineHeight: 1.05, maxWidth: 700, margin: '0 auto 20px', letterSpacing: '-0.04em',
            animation: 'slideUpIn 0.5s ease-out 0.1s both',
          }}>
            One bot.{' '}
            <span style={{ color: '#6366f1' }}>Every device.</span>
          </h1>

          <p style={{
            fontSize: 18, color: '#64748b', maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.7,
            animation: 'slideUpIn 0.5s ease-out 0.2s both',
          }}>
            Design on desktop. Preview on mobile. Deploy across three channels instantly.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 50, animation: 'slideUpIn 0.5s ease-out 0.3s both' }}>
            <button onClick={() => onNavigate('register')} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px',
              fontSize: 15, fontWeight: 600, color: '#fff', background: '#0f172a',
              border: 'none', borderRadius: 50, cursor: 'pointer',
            }}>Start building <ArrowRight size={16} /></button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px',
              fontSize: 15, fontWeight: 500, color: '#475569', background: '#f1f5f9',
              border: 'none', borderRadius: 50, cursor: 'pointer',
            }}>Watch demo</button>
          </div>

          {/* ── The Morphing Device ── */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            animation: 'slideUpIn 0.8s ease-out 0.4s both',
          }}>
            <div style={{
              perspective: 1200,
              transition: 'transform 0.1s ease-out',
            }}>
              {/* Device container */}
              <div style={{
                width: deviceWidth,
                transformStyle: 'preserve-3d',
                transition: 'width 0.05s linear',
                transform: `scale(${deviceScale})`,
              }}>
                {/* Lid / Screen */}
                <div style={{
                  width: '100%', height: deviceHeight,
                  background: '#1e293b', borderRadius: deviceRadius,
                  padding: morphProgress > 0.5 ? 8 : 12,
                  transform: `rotateX(${baseRotateX}deg)`,
                  transformOrigin: 'bottom center',
                  transition: 'transform 0.05s linear, border-radius 0.05s linear, height 0.05s linear, padding 0.05s linear',
                  boxShadow: `0 ${20 - morphProgress * 10}px ${40 + morphProgress * 20}px rgba(0,0,0,${0.15 + morphProgress * 0.1})`,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Screen content */}
                  <div style={{
                    width: '100%', height: '100%', borderRadius: deviceRadius - 4,
                    background: '#f8fafc', overflow: 'hidden',
                  }}>
                    {/* Dashboard or chat view based on morph */}
                    {morphProgress < 0.5 ? (
                      // Dashboard view
                      <div style={{ padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageSquare size={12} color="#fff" />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#0f172a' }}>NabzChat Dashboard</span>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                            {['#ef4444', '#fbbf24', '#22c55e'].map(c => (
                              <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                          {[{ label: 'Active Flows', val: '12' }, { label: 'Submissions', val: '2.4k' }, { label: 'Response Rate', val: '98%' }].map(s => (
                            <div key={s.label} style={{ background: '#fff', borderRadius: 8, padding: '8px 6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{s.val}</div>
                              <div style={{ fontSize: 6, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: '#fff', borderRadius: 8, padding: 8, border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: 7, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Recent Conversations</div>
                          {[{ name: 'Ahmed', msg: 'Booked haircut', ch: '💬' }, { name: 'Sarah', msg: 'Menu viewed', ch: '✈️' }].map(c => (
                            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderTop: '1px solid #f1f5f9' }}>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#6366f1', fontSize: 6, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{c.name[0]}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 7, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                                <div style={{ fontSize: 6, color: '#94a3b8' }}>{c.msg}</div>
                              </div>
                              <span style={{ fontSize: 10 }}>{c.ch}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      // Phone/chat view
                      <div style={{ padding: 6 }}>
                        <div style={{ background: '#25D366', borderRadius: '10px 10px 0 0', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>Beauty Salon</div>
                            <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.8)' }}>online</div>
                          </div>
                        </div>
                        <div style={{ background: '#ECE5DD', padding: 8, minHeight: 140, borderRadius: '0 0 10px 10px' }}>
                          <div style={{ background: '#fff', borderRadius: 8, padding: 6, fontSize: 9, color: '#333', marginBottom: 4, maxWidth: '80%' }}>
                            👋 Welcome! What can I help you with?
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
                            {['📋 Services', '📅 Book Now', '💰 Prices', '📞 Contact'].map(b => (
                              <div key={b} style={{
                                background: '#fff', borderRadius: 6, padding: '4px 8px',
                                fontSize: 8, color: '#6366f1', fontWeight: 600,
                                border: '1px solid #e2e8f0', textAlign: 'center',
                              }}>{b}</div>
                            ))}
                          </div>
                          <div style={{ background: '#dcf8c6', borderRadius: 8, padding: 6, fontSize: 9, color: '#333', marginLeft: 'auto', maxWidth: '60%', textAlign: 'right' }}>
                            📅 Book Now
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Keyboard base (fades with morph) */}
                <div style={{
                  width: '100%', height: 12,
                  background: '#94a3b8', borderRadius: '0 0 4px 4px',
                  opacity: 1 - morphProgress,
                  transition: 'opacity 0.1s linear',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }} />
              </div>
            </div>
          </div>

          {/* Floating label */}
          <div style={{
            marginTop: 24, fontSize: 13, fontWeight: 600,
            color: '#94a3b8', transition: 'opacity 0.3s',
          }}>
            {morphProgress < 0.3 ? '💻 Desktop Dashboard' : morphProgress > 0.7 ? '📱 Mobile Chat' : '✨ Transforming...'}
          </div>
          {morphProgress < 0.3 && (
            <div style={{ marginTop: 12, fontSize: 12, color: '#cbd5e1' }}>↓ Scroll to see the magic</div>
          )}
        </div>
      </section>

      {/* ── Floating Feature Cards ── */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Features</p>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>Everything you need</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '100px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Testimonials</p>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>Loved by businesses</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{
                background: '#fff', borderRadius: 20, padding: 32,
                border: '1px solid #f1f5f9',
              }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: t.stars }).map((_, i) => <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />)}
                </div>
                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#0f172a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#fff',
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
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Pricing</p>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>Choose your plan</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {PRICING.map(p => (
              <div key={p.name} style={{
                borderRadius: 20, padding: 32,
                border: p.highlighted ? '2px solid #0f172a' : '1px solid #e2e8f0',
                background: '#fff',
                boxShadow: p.highlighted ? '0 12px 40px rgba(0,0,0,0.08)' : 'none',
                position: 'relative', transform: p.highlighted ? 'scale(1.03)' : 'none',
              }}>
                {p.highlighted && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: '#0f172a', color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
                  }}>Most Popular</div>
                )}
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{p.desc}</p>
                <div style={{ margin: '20px 0' }}>
                  <span style={{ fontSize: 44, fontWeight: 800 }}>${p.price}</span>
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
                  width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 600, borderRadius: 50,
                  border: 'none', cursor: 'pointer',
                  background: p.highlighted ? '#0f172a' : '#f1f5f9',
                  color: p.highlighted ? '#fff' : '#475569',
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
            <h2 style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>FAQ</h2>
          </div>
          {FAQ.map((item, idx) => (
            <div key={idx} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 8 }}>
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{item.q}</span>
                <ChevronDown size={18} color="#94a3b8" style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>
              {openFaq === idx && <div style={{ padding: '0 24px 18px' }}><p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{item.a}</p></div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            borderRadius: 24, padding: '60px 40px',
            background: '#0f172a', position: 'relative', overflow: 'hidden',
          }}>
            {/* Subtle grid */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.05,
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px',
            }} />
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 16, position: 'relative' }}>Ready to build?</h2>
            <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 16, position: 'relative' }}>Start with a template and go live today.</p>
            <button onClick={() => onNavigate('register')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', fontSize: 15, fontWeight: 600, color: '#0f172a',
              background: '#fff', border: 'none',
              borderRadius: 50, cursor: 'pointer', position: 'relative',
            }}>Get started free <ArrowRight size={16} /></button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #f1f5f9', padding: '24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
