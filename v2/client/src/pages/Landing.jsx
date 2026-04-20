import { useState } from 'react';
import { MessageSquare, Bot, Users, CalendarCheck, Sparkles, ArrowRight, CheckCircle2, Star, ChevronDown, Shield, Zap, BarChart3, Play, Globe, Headphones } from 'lucide-react';

const FEATURES = [
  { icon: Bot, title: 'Smart Auto-Replies', desc: 'AI handles customer messages 24/7 with contextual, human-like responses.', color: 'from-indigo-500 to-violet-500' },
  { icon: Users, title: 'Lead Capture', desc: 'Collect customer info through interactive WhatsApp flows automatically.', color: 'from-pink-500 to-rose-500' },
  { icon: CalendarCheck, title: 'Request Management', desc: 'Track bookings, orders, and inquiries in one powerful dashboard.', color: 'from-amber-500 to-orange-500' },
  { icon: Zap, title: 'Multi-Channel', desc: 'Deploy on WhatsApp, Telegram, and Instagram from a single builder.', color: 'from-cyan-500 to-blue-500' },
  { icon: BarChart3, title: 'Live Analytics', desc: 'Monitor submissions, staff assignments, and performance at a glance.', color: 'from-emerald-500 to-teal-500' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Encrypted data, JWT auth, and full tenant isolation between businesses.', color: 'from-slate-500 to-zinc-600' },
];

const USE_CASES = [
  { emoji: '💇', label: 'Beauty Salon' },
  { emoji: '🏥', label: 'Clinic' },
  { emoji: '🍕', label: 'Restaurant' },
  { emoji: '🏋️', label: 'Gym & Fitness' },
  { emoji: '🏠', label: 'Real Estate' },
  { emoji: '🔧', label: 'Auto Repair' },
  { emoji: '🎓', label: 'Tutoring' },
  { emoji: '🐾', label: 'Pet Services' },
];

const PRICING = [
  {
    name: 'Starter',
    price: '0',
    desc: 'Get started with the basics',
    features: ['1 bot flow', '50 submissions/mo', 'Telegram channel', 'Community support'],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '29',
    desc: 'For growing businesses',
    features: ['Unlimited flows', '2,000 submissions/mo', 'All channels', '5 staff members', 'Priority support'],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '79',
    desc: 'For teams and agencies',
    features: ['Everything in Pro', '10,000 submissions/mo', 'Unlimited staff', 'API access', 'Dedicated support'],
    cta: 'Contact us',
    highlighted: false,
  },
];

const TESTIMONIALS = [
  { name: 'Sara M.', role: 'Salon Owner', text: 'BotDesk cut our no-show rate by 40%. Clients book directly on WhatsApp and get automatic reminders.', stars: 5 },
  { name: 'Omar K.', role: 'Clinic Manager', text: 'We handle 200+ patient inquiries per week without extra staff. The Telegram integration is seamless.', stars: 5 },
  { name: 'Lina T.', role: 'Restaurant Owner', text: 'Setup took under 10 minutes. Our WhatsApp menu handles orders while we focus on cooking.', stars: 5 },
];

const FAQ = [
  { q: 'Do I need coding skills?', a: 'No. BotDesk is a visual builder — just pick a template, customize the text, and publish. Zero code needed.' },
  { q: 'Which messaging channels are supported?', a: 'Currently WhatsApp, Telegram, and Instagram. More channels are on the roadmap.' },
  { q: 'Can I try it for free?', a: 'Yes! The Starter plan includes 1 bot flow and 50 submissions per month. No credit card required.' },
  { q: 'How are customer messages handled?', a: 'Your bot guides customers through interactive menus and forms. Submissions are delivered to your dashboard and optionally to Telegram or email.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use JWT authentication, encrypted storage for sensitive fields, and full tenant isolation between businesses.' },
];

const STATS = [
  { value: '10K+', label: 'Messages handled' },
  { value: '500+', label: 'Businesses' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<5min', label: 'Setup time' },
];

export default function Landing({ onNavigate }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bd-glass border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <MessageSquare className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">BotDesk</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => onNavigate('login')} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Log in
            </button>
            <button onClick={() => onNavigate('register')} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl hover:from-indigo-600 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/25">
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950" />
        <div className="absolute inset-0 bd-grid-bg opacity-40" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-24 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-6 sm:mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" /> AI-powered WhatsApp automation
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight max-w-4xl mx-auto">
            Your business on
            <span className="block bd-gradient-text mt-1">autopilot</span>
          </h1>
          <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Build WhatsApp bots that handle bookings, answer questions, and capture leads. No coding. Ready in 5 minutes.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button onClick={() => onNavigate('register')} className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl hover:from-indigo-600 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
              Start for free <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-300 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <Play className="w-4 h-4" /> See demo
            </button>
          </div>
          <div className="mt-16 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{s.value}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-sm font-semibold text-indigo-500 tracking-wide uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Everything you need to automate</h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto text-lg">Powerful tools packaged in an interface anyone can use</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="group relative bg-white rounded-2xl p-7 border border-slate-100 hover:border-slate-200 transition-all hover:shadow-lg">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-md`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-semibold text-indigo-500 tracking-wide uppercase mb-3">Industries</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">Built for every business</h2>
          <p className="text-slate-500 mb-12 max-w-lg mx-auto text-lg">Pre-built templates for popular industries</p>
          <div className="flex flex-wrap justify-center gap-3">
            {USE_CASES.map((uc) => (
              <div key={uc.label} className="flex items-center gap-2.5 px-5 py-3 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all cursor-default">
                <span className="text-lg">{uc.emoji}</span>
                <span className="text-sm font-medium text-slate-700">{uc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-indigo-500 tracking-wide uppercase mb-3">Live Preview</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">See it in action</h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">This is exactly how your customers interact with your WhatsApp bot. Smart menus, instant replies, seamless booking.</p>
              <div className="space-y-4">
                {[
                  { icon: Globe, text: 'Works on WhatsApp, Telegram & Instagram' },
                  { icon: Zap, text: 'Instant automated responses 24/7' },
                  { icon: Headphones, text: 'Hand off to human agents when needed' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="text-sm text-slate-600">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-[300px]">
                <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
                  <div className="bg-white rounded-[2rem] overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-white font-semibold text-sm">Your Business</div>
                        <div className="text-indigo-200 text-xs">online</div>
                      </div>
                    </div>
                    <div className="bg-[#f0f2f5] px-4 py-5 space-y-3 min-h-[320px]">
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] shadow-sm">
                        <p className="text-sm text-slate-800">👋 Welcome! How can I help you today?</p>
                      </div>
                      <div className="space-y-2 max-w-[70%]">
                        {['📋 Our Services', '📅 Book Appointment', '❓ FAQ'].map((label) => (
                          <div key={label} className="bg-white rounded-xl px-4 py-2 text-center shadow-sm border border-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer">
                            <span className="text-sm font-medium text-indigo-600">{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
                          <p className="text-sm text-white">📅 Book Appointment</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] shadow-sm">
                        <p className="text-sm text-slate-800">Great! Let me guide you through the booking… 📝</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-sm font-semibold text-indigo-400 tracking-wide uppercase mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Loved by business owners</h2>
            <p className="mt-4 text-slate-400 max-w-lg mx-auto">See what our users are saying</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/5 backdrop-blur-sm rounded-2xl p-7 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white">{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-sm font-semibold text-indigo-500 tracking-wide uppercase mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto text-lg">Start free, upgrade when you grow</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRICING.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-7 border transition-all ${plan.highlighted ? 'bg-gradient-to-b from-indigo-50 to-white border-indigo-200 shadow-xl shadow-indigo-500/10 relative scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">Most Popular</div>
                )}
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">${plan.price}</span>
                  <span className="text-sm text-slate-400">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => onNavigate('register')} className={`w-full py-3 text-sm font-semibold rounded-xl transition-all ${plan.highlighted ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-sm font-semibold text-indigo-500 tracking-wide uppercase mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Frequently asked questions</h2>
            <p className="mt-4 text-slate-500">Everything you need to know</p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-sm">
                  <button onClick={() => setOpenFaq(isOpen ? null : idx)} className="w-full flex items-center justify-between px-6 py-5 text-left" aria-expanded={isOpen}>
                    <span className="text-sm font-semibold text-slate-900 pr-4">{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 -mt-1">
                      <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="relative rounded-3xl p-10 sm:p-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950" />
            <div className="absolute inset-0 bd-grid-bg opacity-20" />
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Ready to automate your WhatsApp?</h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto text-lg">Join hundreds of businesses using BotDesk to handle messages automatically.</p>
              <button onClick={() => onNavigate('register')} className="px-8 py-4 text-base font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl hover:from-indigo-600 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2 mx-auto">
                Start for free <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-slate-600">BotDesk</span>
          </div>
          <span>&copy; {new Date().getFullYear()} BotDesk. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
