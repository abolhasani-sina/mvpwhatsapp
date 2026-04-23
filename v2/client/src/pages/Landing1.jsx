import { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowRight, ChevronDown } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   LANDING 1 — 3D Neon Glow Design
   Dark glassmorphism + 3D floating phones + live plans
   ═══════════════════════════════════════════════════ */

const TEMPLATES = [
  { emoji: '💇‍♀️', title: 'Beauty Salon', desc: 'Bookings, services, offers', tag: 'Popular' },
  { emoji: '💈', title: 'Barbershop', desc: 'Walk-ins, bookings, styles', tag: 'Ready' },
  { emoji: '🍽️', title: 'Restaurant', desc: 'Reservations, menu, delivery', tag: 'Popular' },
  { emoji: '☕', title: 'Café', desc: 'Orders, loyalty, hours', tag: 'Ready' },
  { emoji: '🦷', title: 'Dental Clinic', desc: 'Appointments, emergencies', tag: 'Ready' },
  { emoji: '🏥', title: 'Medical Clinic', desc: 'Bookings, consultations', tag: 'Ready' },
  { emoji: '💆', title: 'Spa', desc: 'Treatments, packages, gifts', tag: 'Ready' },
  { emoji: '💪', title: 'Gym', desc: 'Memberships, classes, trials', tag: 'Popular' },
  { emoji: '🚗', title: 'Car Dealership', desc: 'Test drives, inventory', tag: 'Ready' },
  { emoji: '🏠', title: 'Real Estate', desc: 'Listings, viewings, leads', tag: 'Ready' },
  { emoji: '🏨', title: 'Hotel', desc: 'Rooms, reservations, FAQ', tag: 'Ready' },
  { emoji: '💊', title: 'Pharmacy', desc: 'Orders, delivery, Rx refills', tag: 'Ready' },
  { emoji: '🐕', title: 'Pet Grooming', desc: 'Appointments, services', tag: 'Ready' },
  { emoji: '👔', title: 'Laundry', desc: 'Pickup, delivery, status', tag: 'Ready' },
  { emoji: '👗', title: 'Boutique', desc: 'Products, orders, styling', tag: 'Ready' },
];

const WA_SCRIPT = [
  { type: 'received', text: 'Hi! Welcome to Beauty Salon ✨', delay: 700 },
  { type: 'received', text: 'How can I help?', buttons: ['📅 Book', '💅 Services', '📍 Find us'], delay: 500 },
  { type: 'sent', text: '📅 Book', delay: 1400 },
  { type: 'received', text: 'Which service?', buttons: ['Haircut', 'Color', 'Manicure'], delay: 800 },
  { type: 'sent', text: 'Haircut', delay: 1200 },
  { type: 'received', text: 'Your name?', delay: 700 },
  { type: 'sent', text: 'Fatima', delay: 1300 },
  { type: 'received', text: '✅ Booked! Tomorrow, 2 PM', delay: 700 },
  { type: 'info', text: '⏰ Next day — auto reminder sent', delay: 2500 },
  { type: 'received', text: 'Reminder: your haircut is in 24h 💇', delay: 800 },
];

const TG_SCRIPT = [
  { type: 'received', text: 'Welcome to Dental Clinic 🦷', delay: 600 },
  { type: 'received', text: 'How can I help?', buttons: ['📋 Book', 'ℹ️ Services', '👤 Talk to team'], delay: 500 },
  { type: 'sent', text: '👤 Talk to team', delay: 1400 },
  { type: 'received', text: 'What do you need help with?', delay: 700 },
  { type: 'sent', text: 'I need a refund for last visit', delay: 1400 },
  { type: 'received', text: '✅ Our team will reply shortly 🙏', delay: 700 },
  { type: 'info', text: '🔔 Staff notified on Telegram', delay: 1800 },
  { type: 'info', text: '🔗 Dr. Sara tapped the reply link', delay: 1500 },
  { type: 'staff', text: 'Hi! I reviewed your case — full refund approved. Processing today.', delay: 1200, staffBadge: 'Dr. Sara' },
];

const IG_SCRIPT = [
  { type: 'received', text: 'Hey! Welcome to FitZone 💪', delay: 700 },
  { type: 'received', text: 'How can I help?', buttons: ['🏋️ Free trial', '📋 Memberships', '📅 Classes'], delay: 600 },
  { type: 'sent', text: '🏋️ Free trial', delay: 1400 },
  { type: 'received', text: 'Great! Your name?', delay: 800 },
  { type: 'sent', text: 'Ahmed', delay: 1300 },
  { type: 'received', text: 'When works for you?', buttons: ['Today', 'Tomorrow', 'This weekend'], delay: 900 },
  { type: 'sent', text: 'Tomorrow', delay: 1200 },
  { type: 'received', text: 'Morning or evening?', buttons: ['Morning', 'Evening'], delay: 800 },
  { type: 'sent', text: 'Evening', delay: 1100 },
  { type: 'received', text: '✅ Trial booked! Tomorrow, 6 PM 🔥', delay: 800 },
];

/* ── Phone Chat Component ── */
function PhoneChat({ id, theme, avatar, title, status, script, avatarBg, delay: startDelay = 0 }) {
  const chatRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      await new Promise(r => setTimeout(r, startDelay));
      while (!cancelled) {
        if (chatRef.current) chatRef.current.innerHTML = '';
        for (const item of script) {
          if (cancelled) break;
          await new Promise(r => setTimeout(r, item.delay));
          if (!chatRef.current || cancelled) break;
          const el = document.createElement('div');
          if (item.type === 'info') {
            el.className = 'msg-info';
            el.textContent = item.text;
          } else {
            el.className = `msg ${item.type}`;
            let html = '';
            if (item.staffBadge) html += `<div class="staff-badge">${item.staffBadge}</div>`;
            html += item.text;
            if (item.buttons) html += item.buttons.map(b => `<div class="msg-btn">${b}</div>`).join('');
            el.innerHTML = html;
          }
          chatRef.current.appendChild(el);
          requestAnimationFrame(() => {
            if (chatRef.current) chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
          });
        }
        if (!cancelled) await new Promise(r => setTimeout(r, 3000));
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={`phone-screen screen-${theme}`}>
      <div className="phone-notch" />
      <div className={`app-header app-header-${theme}`}>
        <div className="app-avatar" style={{ background: avatarBg }}>{avatar}</div>
        <div>
          <div className="app-title">{title}</div>
          <div className="app-status">{status}</div>
        </div>
      </div>
      <div className={`app-body app-body-${theme}`} ref={chatRef} />
    </div>
  );
}

/* ── FAQ Item ── */
function FaqItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(!open)}>
        {q}
        <div className="faq-chevron">
          <ChevronDown size={14} />
        </div>
      </button>
      <div className="faq-a">
        <p>{a}</p>
      </div>
    </div>
  );
}

export default function Landing1({ onNavigate }) {
  const [plans, setPlans] = useState([]);
  const stageRef = useRef(null);

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(d => { if (d.plans) setPlans(d.plans); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!stageRef.current || window.innerWidth < 1024) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 6;
      stageRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  function getPlanFeatures(plan) {
    const features = [
      `${plan.max_flows === 100 ? 'Unlimited' : plan.max_flows} bot flow${plan.max_flows === 1 ? '' : 's'}`,
      `${plan.max_submissions_per_month.toLocaleString()} submissions/month`,
    ];
    const channels = [];
    if (plan.allow_telegram) channels.push('Telegram');
    if (plan.allow_whatsapp) channels.push('WhatsApp');
    if (plan.allow_instagram) channels.push('Instagram');
    features.push(channels.join(', ') || 'Telegram');
    if (plan.allow_whatsapp) {
      features.push('Analytics dashboard');
      features.push('Staff handover system');
      features.push('Customer CRM');
      features.push('Auto reminders');
    }
    if (plan.max_staff >= 100) {
      features.push('Unlimited staff members');
      features.push('Campaigns & broadcasts');
      features.push('Priority support');
    }
    return features;
  }

  const templateCount = TEMPLATES.length;
  const radius = 560;

  return (
    <div style={{ minHeight: '100vh', background: '#05050f', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

        .bg-mesh {
          position: fixed; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 20%, rgba(99,102,241,0.25), transparent 60%),
            radial-gradient(ellipse 50% 60% at 80% 30%, rgba(168,85,247,0.25), transparent 60%),
            radial-gradient(ellipse 80% 40% at 50% 80%, rgba(6,182,212,0.18), transparent 60%),
            #05050f;
          animation: meshMove 20s ease-in-out infinite;
        }
        @keyframes meshMove { 0%,100% { filter: hue-rotate(0deg); } 50% { filter: hue-rotate(20deg); } }

        .bg-grid {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background-image: linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
        }

        .gradient-text {
          background: linear-gradient(135deg, #818cf8, #c084fc, #f0abfc, #22d3ee);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: gradientFlow 4s ease-in-out infinite;
        }
        @keyframes gradientFlow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

        /* NAV */
        .landing-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 16px 24px;
        }
        .nav-inner {
          max-width: 1280px; margin: 0 auto;
          background: rgba(10,10,20,0.6); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
          padding: 10px 20px; display: flex; align-items: center; justify-content: space-between;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon {
          width: 32px; height: 32px; border-radius: 9px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(139,92,246,0.6);
          position: relative;
        }
        .logo-icon::before {
          content: ''; position: absolute; inset: -2px; border-radius: 11px; z-index: -1;
          background: linear-gradient(135deg, #6366f1, #a855f7, #06b6d4);
          filter: blur(8px); opacity: 0.5; animation: logoGlow 3s ease-in-out infinite;
        }
        @keyframes logoGlow { 0%,100% { opacity: 0.5; } 50% { opacity: 0.9; } }
        .logo-text { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
        .nav-buttons { display: flex; align-items: center; gap: 8px; }
        .btn-ghost { padding: 8px 14px; font-size: 14px; font-weight: 500; color: #cbd5e1; background: transparent; border: none; cursor: pointer; border-radius: 8px; }
        .btn-ghost:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .btn-nav-primary {
          padding: 9px 18px; font-size: 14px; font-weight: 600; color: #fff;
          background: linear-gradient(135deg, #6366f1, #a855f7); border: none; border-radius: 10px; cursor: pointer;
          box-shadow: 0 4px 14px rgba(99,102,241,0.5); transition: all 0.2s;
        }
        .btn-nav-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.6); }

        /* HERO */
        .hero-badge {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 8px 16px; border-radius: 100px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.3);
          color: #c4b5fd; font-size: 13px; font-weight: 500; margin-bottom: 24px;
        }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 12px #10b981; animation: pulseDot 2s ease-in-out infinite; }
        @keyframes pulseDot { 0%,100% { opacity:1; transform: scale(1); } 50% { opacity:0.5; transform: scale(1.3); } }
        .cta-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 16px 28px; font-size: 15px; font-weight: 600; color: #fff;
          background: linear-gradient(135deg, #6366f1, #a855f7); border: none; border-radius: 12px; cursor: pointer;
          box-shadow: 0 8px 30px rgba(99,102,241,0.5); transition: all 0.2s; position: relative; overflow: hidden;
        }
        .cta-primary::before { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background: linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); transition: left 0.5s; }
        .cta-primary:hover::before { left: 100%; }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(99,102,241,0.65); }
        .cta-secondary {
          padding: 16px 24px; font-size: 15px; font-weight: 500; color: #cbd5e1;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer;
        }
        .cta-secondary:hover { background: rgba(255,255,255,0.08); }

        /* PHONES */
        .phones-3d { position: relative; height: 640px; perspective: 2400px; perspective-origin: 50% 50%; }
        .phones-stage {
          position: relative; width: 100%; height: 100%; transform-style: preserve-3d;
          animation: stageRotate 20s ease-in-out infinite;
        }
        @keyframes stageRotate { 0%,100% { transform: rotateY(-4deg) rotateX(2deg); } 50% { transform: rotateY(4deg) rotateX(-1deg); } }
        .phone-3d {
          position: absolute; width: 220px; height: 460px; border-radius: 32px;
          background: linear-gradient(145deg, #1e1e3a, #0f0f20); padding: 8px;
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1);
          transform-style: preserve-3d;
        }
        .phone-3d::before { content:''; position:absolute; inset:-2px; border-radius:34px; z-index:-1; opacity:0.7; filter:blur(18px); }
        .phone-wa { top:120px; left:-10px; animation: phoneFloat1 7s ease-in-out infinite; }
        .phone-wa::before { background: linear-gradient(135deg,#25D366,#128C7E); }
        @keyframes phoneFloat1 { 0%,100% { transform: translateZ(-120px) rotateY(18deg) translateY(0); } 50% { transform: translateZ(-120px) rotateY(20deg) translateY(-15px); } }
        .phone-tg { top:60px; left:50%; animation: phoneFloat2 8s ease-in-out infinite; z-index:3; }
        .phone-tg::before { background: linear-gradient(135deg,#2AABEE,#229ED9); }
        @keyframes phoneFloat2 { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-20px); } }
        .phone-ig { top:120px; right:-10px; animation: phoneFloat3 9s ease-in-out infinite; }
        .phone-ig::before { background: linear-gradient(135deg,#833AB4,#E1306C,#F56040); }
        @keyframes phoneFloat3 { 0%,100% { transform: translateZ(-120px) rotateY(-18deg) translateY(0); } 50% { transform: translateZ(-120px) rotateY(-20deg) translateY(-15px); } }

        .phone-screen { width:100%; height:100%; border-radius:26px; overflow:hidden; display:flex; flex-direction:column; position:relative; }
        .phone-notch { position:absolute; top:5px; left:50%; transform:translateX(-50%); width:70px; height:18px; background:#0a0a14; border-radius:20px; z-index:10; }

        .screen-wa { background: #0b141a; }
        .app-header-wa { background:#1f2c33; padding:32px 10px 8px; display:flex; align-items:center; gap:8px; color:#fff; }
        .app-body-wa { flex:1; background: linear-gradient(rgba(11,20,26,0.85),rgba(11,20,26,0.85)), repeating-linear-gradient(45deg,#182229 0 8px,#1f2c33 8px 16px); padding:8px 6px; overflow-y:auto; scrollbar-width:none; display:flex; flex-direction:column; gap:3px; }
        .app-body-wa::-webkit-scrollbar { display:none; }
        .screen-wa .msg.received { background:#1f2c33; color:#e9edef; align-self:flex-start; }
        .screen-wa .msg.sent { background:#005c4b; color:#e9edef; align-self:flex-end; }
        .screen-wa .msg-btn { background:rgba(0,168,132,0.15); border:1px solid rgba(0,168,132,0.3); color:#00a884; padding:3px 5px; border-radius:4px; font-size:9.5px; margin-top:3px; text-align:center; }

        .screen-tg { background: #17212b; }
        .app-header-tg { background:#17212b; padding:32px 10px 8px; display:flex; align-items:center; gap:8px; color:#fff; border-bottom:1px solid #1a2733; }
        .app-body-tg { flex:1; background:#0e1621; padding:8px 6px; overflow-y:auto; scrollbar-width:none; display:flex; flex-direction:column; gap:3px; }
        .app-body-tg::-webkit-scrollbar { display:none; }
        .screen-tg .msg.received { background:#182533; color:#fff; align-self:flex-start; }
        .screen-tg .msg.sent { background:#2b5278; color:#fff; align-self:flex-end; }
        .screen-tg .msg.staff { background:linear-gradient(135deg,#1e3a8a,#2b5278); color:#fff; align-self:flex-end; border-left:2px solid #60a5fa; }
        .screen-tg .msg-btn { background:rgba(42,171,238,0.15); border:1px solid rgba(42,171,238,0.3); color:#2AABEE; padding:3px 5px; border-radius:4px; font-size:9.5px; margin-top:3px; text-align:center; }

        .screen-ig { background: #000; }
        .app-header-ig { background:#000; padding:32px 10px 8px; display:flex; align-items:center; gap:8px; color:#fff; border-bottom:1px solid #262626; }
        .app-body-ig { flex:1; background:#000; padding:8px 6px; overflow-y:auto; scrollbar-width:none; display:flex; flex-direction:column; gap:3px; }
        .app-body-ig::-webkit-scrollbar { display:none; }
        .screen-ig .msg.received { background:#262626; color:#fff; align-self:flex-start; }
        .screen-ig .msg.sent { background:linear-gradient(135deg,#833AB4,#E1306C); color:#fff; align-self:flex-end; }
        .screen-ig .msg-btn { background:rgba(225,48,108,0.15); border:1px solid rgba(225,48,108,0.3); color:#E1306C; padding:3px 5px; border-radius:4px; font-size:9.5px; margin-top:3px; text-align:center; }

        .msg { max-width:82%; padding:5px 8px; border-radius:9px; font-size:10.5px; line-height:1.3; opacity:0; animation:msgIn 0.4s ease-out forwards; }
        @keyframes msgIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        .msg-info { background:rgba(255,193,7,0.1); border:1px solid rgba(255,193,7,0.25); color:#ffc107; padding:5px 7px; border-radius:6px; font-size:9.5px; align-self:center; text-align:center; font-style:italic; max-width:90%; opacity:0; animation:msgIn 0.4s ease-out forwards; }
        .staff-badge { display:inline-block; font-size:8px; font-weight:700; background:rgba(96,165,250,0.2); color:#60a5fa; padding:1px 4px; border-radius:3px; margin-bottom:2px; text-transform:uppercase; letter-spacing:0.04em; }
        .app-avatar { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; }
        .app-title { font-size:10.5px; font-weight:600; }
        .app-status { font-size:8.5px; opacity:0.6; }

        /* SECTIONS */
        .section-tag {
          display:inline-block; font-size:12px; font-weight:600; color:#a78bfa;
          text-transform:uppercase; letter-spacing:0.12em; padding:6px 14px;
          background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.25); border-radius:100px;
          margin-bottom:20px;
        }

        /* STEPS */
        .step-card {
          padding:36px 28px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
          border-radius:20px; backdrop-filter:blur(20px); position:relative; transition:all 0.3s; overflow:hidden;
        }
        .step-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(99,102,241,0.1),transparent); opacity:0; transition:opacity 0.3s; }
        .step-card:hover { transform:translateY(-6px); border-color:rgba(139,92,246,0.4); box-shadow:0 20px 40px rgba(99,102,241,0.2); }
        .step-card:hover::before { opacity:1; }
        .step-num { font-family:'JetBrains Mono',monospace; font-size:48px; font-weight:700; background:linear-gradient(135deg,#6366f1,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; line-height:1; margin-bottom:16px; opacity:0.5; }

        /* TEMPLATES */
        .templates-showcase { position:relative; height:440px; perspective:1600px; }
        .templates-track { position:relative; width:100%; height:100%; transform-style:preserve-3d; animation:carouselSpin 50s linear infinite; }
        @keyframes carouselSpin { from { transform:rotateY(0deg); } to { transform:rotateY(360deg); } }
        .template-card {
          position:absolute; top:50%; left:50%; width:220px; height:280px; margin:-140px 0 0 -110px;
          background:linear-gradient(145deg,rgba(30,30,55,0.9),rgba(15,15,30,0.95));
          border:1px solid rgba(139,92,246,0.3); border-radius:20px; padding:24px 20px;
          backdrop-filter:blur(20px); box-shadow:0 20px 40px rgba(0,0,0,0.5);
          display:flex; flex-direction:column; align-items:center; text-align:center;
        }
        .template-emoji { font-size:56px; margin-bottom:14px; filter:drop-shadow(0 4px 12px rgba(139,92,246,0.4)); }
        .template-title { font-size:17px; font-weight:700; margin-bottom:6px; }
        .template-desc { font-size:12px; color:#94a3b8; line-height:1.5; margin-bottom:14px; }
        .template-badge { font-size:10px; font-weight:600; color:#a78bfa; padding:4px 10px; background:rgba(139,92,246,0.15); border:1px solid rgba(139,92,246,0.3); border-radius:100px; margin-top:auto; }
        .carousel-mask { position:relative; }
        .carousel-mask::before,.carousel-mask::after { content:''; position:absolute; top:0; bottom:0; width:200px; z-index:10; pointer-events:none; }
        .carousel-mask::before { left:0; background:linear-gradient(90deg,#05050f 0%,transparent 100%); }
        .carousel-mask::after { right:0; background:linear-gradient(-90deg,#05050f 0%,transparent 100%); }

        /* FEATURES */
        .feature-card {
          padding:28px 24px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
          border-radius:18px; backdrop-filter:blur(20px); transition:all 0.3s; position:relative; overflow:hidden;
        }
        .feature-card::before { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; background:radial-gradient(circle,var(--glow) 0%,transparent 40%); opacity:0; transition:opacity 0.4s; }
        .feature-card:hover::before { opacity:0.15; }
        .feature-card:hover { transform:translateY(-4px); border-color:rgba(139,92,246,0.4); }
        .feature-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:18px; position:relative; }
        .feature-icon::before { content:''; position:absolute; inset:-4px; border-radius:14px; filter:blur(10px); background:var(--glow); opacity:0.5; }

        /* HANDOVER */
        .flow-node { display:flex; align-items:center; gap:14px; padding:14px 18px; background:rgba(10,10,20,0.6); border:1px solid rgba(139,92,246,0.2); border-radius:12px; }
        .flow-node-icon { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#6366f1,#a855f7); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:18px; }
        .flow-arrow { display:flex; justify-content:center; color:#a78bfa; animation:arrowPulse 2s ease-in-out infinite; }
        @keyframes arrowPulse { 0%,100% { transform:translateY(0); opacity:0.6; } 50% { transform:translateY(4px); opacity:1; } }

        /* PRICING */
        .plan-card { padding:32px 28px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:20px; backdrop-filter:blur(20px); display:flex; flex-direction:column; gap:8px; }
        .plan-card.highlighted { background:linear-gradient(145deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1)); border-color:rgba(139,92,246,0.5); box-shadow:0 20px 60px rgba(99,102,241,0.25); transform:scale(1.03); position:relative; }
        .plan-badge { position:absolute; top:-14px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg,#6366f1,#a855f7); color:#fff; font-size:11px; font-weight:700; padding:5px 16px; border-radius:100px; white-space:nowrap; }

        /* FAQ */
        .faq-item { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; margin-bottom:10px; backdrop-filter:blur(20px); overflow:hidden; transition:all 0.3s; }
        .faq-item:hover { border-color:rgba(139,92,246,0.25); }
        .faq-item.open { border-color:rgba(139,92,246,0.4); }
        .faq-q { width:100%; display:flex; justify-content:space-between; align-items:center; padding:22px 28px; background:none; border:none; cursor:pointer; text-align:left; font-size:16px; font-weight:600; color:#fff; }
        .faq-chevron { transition:transform 0.3s; color:#a78bfa; width:24px; height:24px; background:rgba(139,92,246,0.15); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .faq-item.open .faq-chevron { transform:rotate(180deg); }
        .faq-a { max-height:0; overflow:hidden; transition:max-height 0.3s ease; }
        .faq-item.open .faq-a { max-height:400px; }
        .faq-a p { font-size:15px; color:#94a3b8; line-height:1.7; padding:0 28px 22px; }

        /* FOOTER */
        .footer-link { font-size:14px; color:#64748b; text-decoration:none; display:block; margin-bottom:10px; }
        .footer-link:hover { color:#cbd5e1; }
        .footer-col-title { font-size:13px; font-weight:700; color:#fff; margin-bottom:16px; text-transform:uppercase; letter-spacing:0.06em; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
          .hero-left { display: flex; flex-direction: column; align-items: center; }
          .phones-3d { margin-top: 60px; height: 560px; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .handover-grid { grid-template-columns: 1fr !important; gap: 40px; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .phone-wa, .phone-ig { display: none; }
          .phone-tg { transform: translateX(-50%) !important; animation: none !important; }
          .phones-3d { height: 480px; perspective: none; }
          .phones-stage { animation: none; transform: none !important; }
          .btn-ghost { display: none; }
          .hero-meta { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      <div className="bg-mesh" />
      <div className="bg-grid" />

      {/* NAV */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-icon">
              <MessageSquare size={16} color="#fff" />
            </div>
            <span className="logo-text">NabzChat</span>
          </div>
          <div className="nav-center">
            <button className="btn-ghost" onClick={() => document.getElementById('features').scrollIntoView({behavior:'smooth'})}>Features</button>
            <button className="btn-ghost" onClick={() => document.getElementById('templates').scrollIntoView({behavior:'smooth'})}>Templates</button>
            <button className="btn-ghost" onClick={() => document.getElementById('pricing').scrollIntoView({behavior:'smooth'})}>Pricing</button>
            <button className="btn-ghost" onClick={() => document.getElementById('faq').scrollIntoView({behavior:'smooth'})}>FAQ</button>
          </div>
          <div className="nav-right">
            <button className="btn-ghost" onClick={() => onNavigate('login')}>Log in</button>
            <button className="btn-nav-primary" onClick={() => onNavigate('register')}>Get started</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 2, minHeight: '100vh', padding: '140px 24px 80px', display: 'flex', alignItems: 'center' }}>
        <div className="hero-grid" style={{ maxWidth: 1400, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 60, alignItems: 'center' }}>
          <div className="hero-left">
            <div className="hero-badge">
              <div className="badge-dot" />
              Live on WhatsApp, Telegram & Instagram
            </div>
            <h1 style={{ fontSize: 'clamp(40px,5vw,64px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 24 }}>
              One bot.<br />Three channels.<br /><span className="gradient-text">Zero code.</span>
            </h1>
            <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, maxWidth: 520, marginBottom: 36 }}>
              The complete chatbot platform for small businesses. Handle bookings, manage conversations, hand over to staff, and grow — all from one visual builder.
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 36, flexWrap: 'wrap' }}>
              <button className="cta-primary" onClick={() => onNavigate('register')}>
                Get started <ArrowRight size={16} />
              </button>
            </div>
            <div className="hero-meta" style={{ display: 'flex', gap: 24, fontSize: 13, color: '#64748b' }}>
              {['15 industry templates', 'Setup in 5 minutes', 'No credit card'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* 3D PHONES */}
          <div className="phones-3d">
            <div className="phones-stage" ref={stageRef}>
              <div className="phone-3d phone-wa">
                <PhoneChat theme="wa" avatar="🌸" avatarBg="#25D366" title="Beauty Salon" status="WhatsApp • online" script={WA_SCRIPT} delay={0} />
              </div>
              <div className="phone-3d phone-tg">
                <PhoneChat theme="tg" avatar="🦷" avatarBg="#2AABEE" title="Dental Clinic" status="Telegram" script={TG_SCRIPT} delay={1500} />
              </div>
              <div className="phone-3d phone-ig">
                <PhoneChat theme="ig" avatar="💪" avatarBg="linear-gradient(135deg,#833AB4,#E1306C)" title="FitZone Gym" status="Instagram • Active" script={IG_SCRIPT} delay={3000} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: 'relative', zIndex: 2, padding: '120px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div className="section-tag">How it works</div>
          <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Live in <span className="gradient-text">3 simple steps</span>
          </h2>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>No developers. No consultants. Just pick, customize, launch.</p>
        </div>
        <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {[
            { n: '01', title: 'Pick a template', desc: 'Start from one of 15 ready-made templates built for your industry — salon, restaurant, clinic, dealership, and more.' },
            { n: '02', title: 'Customize visually', desc: 'Edit buttons, messages, and questions in a visual builder. See changes live as you type, no code ever.' },
            { n: '03', title: 'Connect and go', desc: 'Link WhatsApp, Telegram, or Instagram in one click. Your bot is handling customers before your coffee cools.' },
          ].map(s => (
            <div key={s.n} className="step-card">
              <div className="step-num" style={{ position: 'relative', zIndex: 1 }}>{s.n}</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, position: 'relative', zIndex: 1 }}>{s.title}</h3>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TEMPLATES */}
      <section id="templates" style={{ position: 'relative', zIndex: 2, padding: '120px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div className="section-tag">Templates</div>
          <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Built for <span className="gradient-text">15 industries</span>
          </h2>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>Every template is purpose-built with the right questions, flow, and buttons for your business type.</p>
        </div>
        <div className="carousel-mask">
          <div className="templates-showcase">
            <div className="templates-track">
              {TEMPLATES.map((t, i) => (
                <div key={t.title} className="template-card" style={{ transform: `rotateY(${(i / templateCount) * 360}deg) translateZ(${radius}px)` }}>
                  <div className="template-emoji">{t.emoji}</div>
                  <div className="template-title">{t.title}</div>
                  <div className="template-desc">{t.desc}</div>
                  <div className="template-badge">{t.tag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ position: 'relative', zIndex: 2, padding: '120px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div className="section-tag">Features</div>
          <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Everything you need to <span className="gradient-text">automate & grow</span>
          </h2>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>A complete toolkit — from the first customer message to the lifetime repeat booking.</p>
        </div>
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { glow: 'rgba(99,102,241,0.4)', bg: 'linear-gradient(135deg,#6366f1,#4f46e5)', title: 'Visual bot builder', desc: 'Drag-and-drop flows with live preview. What you build is exactly what your customers see.', icon: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></> },
            { glow: 'rgba(236,72,153,0.4)', bg: 'linear-gradient(135deg,#ec4899,#db2777)', title: 'Handover to staff', desc: 'Customer needs a human? Staff gets a secure one-time link — replies without ever logging in.', icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></> },
            { glow: 'rgba(6,182,212,0.4)', bg: 'linear-gradient(135deg,#06b6d4,#0891b2)', title: 'Multi-channel deploy', desc: 'Build once, publish to WhatsApp, Telegram, Instagram. Same flow, three channels.', icon: <><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></> },
            { glow: 'rgba(168,85,247,0.4)', bg: 'linear-gradient(135deg,#a855f7,#9333ea)', title: 'Booking management', desc: 'Track every booking, inquiry, and request. Kanban view with status, notes, and assignment.', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></> },
            { glow: 'rgba(16,185,129,0.4)', bg: 'linear-gradient(135deg,#10b981,#059669)', title: 'Analytics dashboard', desc: 'See message volume, peak hours, top services, and conversion rate. Real data, clear decisions.', icon: <><path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 5-5"/></> },
            { glow: 'rgba(245,158,11,0.4)', bg: 'linear-gradient(135deg,#f59e0b,#d97706)', title: 'Customer CRM', desc: 'Every customer auto-saved with history, preferences, and total bookings. Searchable, taggable.', icon: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
            { glow: 'rgba(239,68,68,0.4)', bg: 'linear-gradient(135deg,#ef4444,#dc2626)', title: 'Auto reminders', desc: 'Bot sends reminder 24h before each booking. Fewer no-shows, more revenue, zero manual work.', icon: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></> },
            { glow: 'rgba(251,113,133,0.4)', bg: 'linear-gradient(135deg,#fb7185,#e11d48)', title: 'Reviews & ratings', desc: 'Bot asks customers to rate 1–5 stars after service. Collect reviews, spot issues, boost reputation.', icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
            { glow: 'rgba(139,92,246,0.4)', bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', title: 'Campaigns & broadcasts', desc: 'Send promos, offers, and follow-ups to all customers or filtered segments. Grow revenue on autopilot.', icon: <><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></> },
            { glow: 'rgba(132,204,22,0.4)', bg: 'linear-gradient(135deg,#84cc16,#65a30d)', title: 'Bank-grade security', desc: 'Encrypted storage, JWT auth, strict tenant isolation. Your customer data stays yours — always.', icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></> },
            { glow: 'rgba(251,146,60,0.4)', bg: 'linear-gradient(135deg,#fb923c,#ea580c)', title: 'Owner dashboard', desc: 'See every conversation, every booking, every stat. Inbox, Kanban, and analytics in one place.', icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></> },
            { glow: 'rgba(34,211,238,0.4)', bg: 'linear-gradient(135deg,#22d3ee,#0891b2)', title: 'Smart lead capture', desc: 'Collect names, phones, and service choices automatically. Every conversation becomes structured data.', icon: <><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></> },
          ].map(f => (
            <div key={f.title} className="feature-card" style={{ '--glow': f.glow }}>
              <div className="feature-icon" style={{ background: f.bg, '--glow': f.glow }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ position: 'relative', zIndex: 1 }}>{f.icon}</svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, position: 'relative', zIndex: 1 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HANDOVER DEEP DIVE */}
      <section style={{ position: 'relative', zIndex: 2, padding: '120px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div className="section-tag">Handover system</div>
          <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
            When your customer needs a <span className="gradient-text">human</span>
          </h2>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>The bot handles 90% of messages. For the other 10% — staff can help without logging into anything.</p>
        </div>
        <div className="handover-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div style={{ padding: 40, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 20, backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '💬', text: <><strong>Customer</strong> taps "Talk to team"</> },
                { arrow: true },
                { icon: '🔔', text: <><strong>Staff notified</strong> via Telegram, Email, or WhatsApp</> },
                { arrow: true },
                { icon: '🔗', text: <><strong>Staff taps link</strong> — replies without logging in</> },
                { arrow: true },
                { icon: '✅', text: <><strong>Customer gets reply</strong> on their channel</> },
              ].map((item, i) => item.arrow ? (
                <div key={i} className="flow-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                </div>
              ) : (
                <div key={i} className="flow-node">
                  <div className="flow-node-icon">{item.icon}</div>
                  <div style={{ fontSize: 14, color: '#cbd5e1' }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 16 }}>No app. No login. No training.</h3>
            <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>Your staff doesn't need a NabzChat account. When a customer needs help, staff get a notification and a secure one-time reply link.</p>
            {[
              'Route to the right staff by department',
              'Full conversation history saved for you',
              'Control what each staff member can see',
              'Links auto-expire when conversation ends',
            ].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#cbd5e1', marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ position: 'relative', zIndex: 2, padding: '120px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div className="section-tag">Pricing</div>
          <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>
            Simple, <span className="gradient-text">transparent pricing</span>
          </h2>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>Start free. Scale as you grow. No hidden fees, cancel anytime.</p>
        </div>
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
          {plans.length > 0 ? plans.map((plan, i) => {
            const isHighlighted = plan.monthly_price === 29;
            const features = getPlanFeatures(plan);
            return (
              <div key={plan.id} className={`plan-card${isHighlighted ? ' highlighted' : ''}`}>
                {isHighlighted && <div className="plan-badge">Most Popular</div>}
                <div style={{ fontSize: 13, fontWeight: 600, color: isHighlighted ? '#a78bfa' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em' }}>{plan.monthly_price === 0 ? 'Free' : `$${plan.monthly_price}`}</span>
                  {plan.monthly_price > 0 && <span style={{ fontSize: 14, color: '#64748b' }}>/month</span>}
                </div>
                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                  {plan.monthly_price === 0 ? 'Get started, no card needed' : plan.monthly_price === 29 ? 'For growing businesses' : 'For teams & agencies'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#cbd5e1' }}>
                      <span style={{ color: '#10b981' }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onNavigate('register')}
                  className={isHighlighted ? 'cta-primary' : 'cta-secondary'}
                  style={{ marginTop: 24, width: '100%', justifyContent: 'center', borderRadius: 12, padding: '12px 0' }}
                >
                  {plan.contact_sales ? 'Contact us' : plan.monthly_price === 0 ? 'Get started free' : 'Get started'}
                </button> {/* [ADDED: contact-sales-button] */}
              </div>
            );
          }) : (
            // Fallback skeleton while loading
            [0,1,2].map(i => (
              <div key={i} className="plan-card" style={{ opacity: 0.3, height: 400 }} />
            ))
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ position: 'relative', zIndex: 2, padding: '120px 24px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div className="section-tag">FAQ</div>
          <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Common <span className="gradient-text">questions</span>
          </h2>
        </div>
        <FaqItem defaultOpen q="Do I need coding skills?" a="No. NabzChat is built for non-technical owners. Pick a template, customize with clicks, publish. Zero code required — ever." />
        <FaqItem q="Which channels are supported?" a="WhatsApp, Telegram, and Instagram — the three channels your customers already use every day. Build one bot, it works on all three." />
        <FaqItem q="How does the handover to staff work?" a="When a customer needs a human, your staff gets notified on Telegram, Email, or WhatsApp — and receives a secure one-time link to reply. No login required, no app to install. First staff member to respond takes the conversation." />
        <FaqItem q="How long does setup take?" a="Under 5 minutes for most businesses. Pick a template matching your industry, customize the text, connect your channel — you're live." />
        <FaqItem q="Is my data secure?" a="Yes. JWT authentication, encrypted storage for sensitive tokens, and strict tenant isolation. Your customer data is never mixed with any other business's data." />
        <FaqItem q="Can I customize the bot for my specific business?" a="Absolutely. Every template is fully editable — change buttons, questions, confirmations, media, everything. Make it yours in minutes." />
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '120px 24px', position: 'relative', zIndex: 2 }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto', padding: '80px 40px', borderRadius: 32,
          background: 'radial-gradient(ellipse at top left,rgba(139,92,246,0.3),transparent 50%), radial-gradient(ellipse at bottom right,rgba(6,182,212,0.2),transparent 50%), linear-gradient(135deg,#0f0f25,#1a1140)',
          border: '1px solid rgba(139,92,246,0.3)', position: 'relative', overflow: 'hidden', textAlign: 'center',
          boxShadow: '0 40px 80px rgba(99,102,241,0.2)',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(139,92,246,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.08) 1px,transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse at center,black 30%,transparent 70%)' }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Put your business on<br /><span className="gradient-text">autopilot today</span>
            </h2>
            <p style={{ fontSize: 18, color: '#cbd5e1', maxWidth: 560, margin: '0 auto 32px' }}>Be one of the first businesses to automate customer conversations with NabzChat. Setup takes 5 minutes.</p>
            <button className="cta-primary" onClick={() => onNavigate('register')} style={{ padding: '18px 32px', fontSize: 16 }}>
              Get started <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '60px 24px 40px', background: 'rgba(5,5,15,0.5)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div className="logo" style={{ marginBottom: 16 }}>
                <div className="logo-icon"><MessageSquare size={16} color="#fff" /></div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>NabzChat</span>
              </div>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 280 }}>The chatbot platform built for small businesses. Handle bookings, answer FAQs, and capture leads — automatically.</p>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              <a className="footer-link" href="#features">Features</a>
              <a className="footer-link" href="#templates">Templates</a>
              <a className="footer-link" href="#pricing">Pricing</a>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <a className="footer-link" href="#">About</a>
              <a className="footer-link" href="#">Contact</a>
              <a className="footer-link" href="mailto:info@nabzchat.tech">info@nabzchat.tech</a>
            </div>
            <div>
              <div className="footer-col-title">Legal</div>
              <a className="footer-link" href="#">Privacy Policy</a>
              <a className="footer-link" href="#">Terms of Service</a>
            </div>
          </div>
          <div style={{ paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#475569', flexWrap: 'wrap', gap: 12 }}>
            <span>© 2026 NabzChat. All rights reserved.</span>
            <span>Built for small businesses in Dubai & beyond 🌍</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
