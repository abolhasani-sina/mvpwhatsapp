import { Suspense, lazy, useRef, useState, useEffect } from "react";
import {
  ArrowRight, BarChart3, CalendarCheck, CheckCircle2,
  Layers, MessageSquare, Rocket, Users, Workflow, Zap,
} from "lucide-react";

const BotScene = lazy(() => import("../components/BotScene"));

const FEATURES = [
  { id: "tl", side: "left",  yPct: 20, icon: Workflow,     title: "Build Flows",       desc: "Visual no-code conversation builder. Menus, prompts, navigation." },
  { id: "bl", side: "left",  yPct: 56, icon: CalendarCheck, title: "Handle Requests",   desc: "Auto-capture bookings, orders and leads into your dashboard." },
  { id: "tr", side: "right", yPct: 20, icon: Zap,           title: "Deploy 3 Channels", desc: "WhatsApp, Telegram, Instagram — one flow, three live channels." },
  { id: "br", side: "right", yPct: 56, icon: BarChart3,     title: "Live Operations",   desc: "Staff assignment, analytics, and system logs in real time." },
];

const HOW_IT_WORKS = [
  { n: "01", title: "Pick Template",    text: "Salon, clinic, restaurant, real estate — pre-built and ready.",           icon: Layers },
  { n: "02", title: "Customize Flow",   text: "Edit menus, prompts, services and bookings in the visual builder.",        icon: Workflow },
  { n: "03", title: "Connect Channel",  text: "Point your WhatsApp, Telegram or Instagram handle at BotDesk.",           icon: MessageSquare },
  { n: "04", title: "Manage Requests",  text: "Submissions appear in the dashboard. Assign staff. Monitor live.",         icon: Users },
];

const CHANNELS = [
  { name: "WhatsApp",  from: "from-emerald-400", to: "to-green-600",  desc: "Menus, buttons, media, booking flows" },
  { name: "Telegram",  from: "from-sky-400",     to: "to-blue-600",   desc: "Inline keyboards, callbacks, notifications" },
  { name: "Instagram", from: "from-fuchsia-500", to: "to-rose-500",   desc: "DM-ready renderer with quick replies" },
];

const PLANS = [
  { name: "Starter", price: "$0",  desc: "First launch",  points: ["1 active flow", "Core templates", "Basic submissions"] },
  { name: "Growth",  price: "$29", desc: "Active teams",  points: ["Unlimited flows", "All channels", "Staff + analytics"], featured: true },
  { name: "Scale",   price: "$79", desc: "Agencies",      points: ["Advanced automations", "Priority support", "Full monitoring"] },
];

export default function Landing({ onNavigate }) {
  const mouseRef = useRef({ x: 0, y: 0 });
  const [activeFeature, setActiveFeature] = useState(null);

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth)  * 2 - 1;
      mouseRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const activate   = (id) => setActiveFeature(id);
  const deactivate = ()   => setActiveFeature(null);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030712] text-white">

      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-700 p-2.5 shadow-[0_12px_28px_rgba(14,165,233,0.35)]">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-wide">BotDesk</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("login")} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-white/40 sm:px-4 sm:text-sm">Log in</button>
            <button onClick={() => onNavigate("register")} className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-2 text-xs font-bold text-slate-950 shadow-[0_12px_26px_rgba(14,165,233,0.45)] transition hover:from-cyan-300 hover:to-blue-500 sm:px-4 sm:text-sm">Start Free</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative h-screen min-h-[600px] max-h-[980px]">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 60% at 50% 0%,rgba(14,165,233,0.18),transparent 60%),radial-gradient(ellipse 60% 50% at 15% 90%,rgba(30,64,175,0.18),transparent 50%),linear-gradient(170deg,#020710,#040d1a 45%,#030712)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.12) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />

        {/* BOTDESK text sits behind robot via z-index */}
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center overflow-hidden">
          <p className="select-none whitespace-nowrap font-black uppercase tracking-[-0.04em] text-white" style={{ fontSize: "clamp(60px,18vw,240px)", opacity: 0.04 }}>BOTDESK</p>
        </div>

        {/* Three.js canvas — alpha:true lets BOTDESK text bleed through transparent areas */}
        <div className="absolute inset-0 z-[10]">
          <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" /></div>}>
            <BotScene mouseRef={mouseRef} activeFeature={activeFeature} />
          </Suspense>
        </div>

        {/* Feature cards overlay — desktop */}
        <div className="pointer-events-none absolute inset-0 z-[20] hidden lg:block">
          {FEATURES.map((feat) => {
            const Icon     = feat.icon;
            const isLeft   = feat.side === "left";
            const isActive = activeFeature === feat.id;
            return (
              <button key={feat.id}
                className={["pointer-events-auto absolute w-52 rounded-2xl border p-4 text-left backdrop-blur-lg transition-all duration-300", isActive ? "border-cyan-300/60 bg-slate-900/90 shadow-[0_0_32px_rgba(14,165,233,0.4)]" : "border-white/15 bg-slate-900/55 shadow-[0_6px_24px_rgba(2,6,23,0.5)] hover:border-cyan-300/35 hover:bg-slate-900/75"].join(" ")}
                style={{ [isLeft ? "left" : "right"]: "5%", top: `${feat.yPct}%` }}
                onMouseEnter={() => activate(feat.id)} onMouseLeave={deactivate}
                onClick={() => (isActive ? deactivate() : activate(feat.id))}
              >
                <div className={["mb-2.5 inline-flex rounded-xl p-2 transition-all", isActive ? "bg-gradient-to-br from-cyan-400 to-blue-700 shadow-[0_8px_18px_rgba(14,165,233,0.4)]" : "bg-white/10"].join(" ")}>
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-300"}`} />
                </div>
                <p className="text-sm font-semibold text-white">{feat.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{feat.desc}</p>
                <span className={["absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full transition-colors", isActive ? "bg-cyan-300" : "bg-white/25", isLeft ? "-right-3" : "-left-3"].join(" ")} />
              </button>
            );
          })}
        </div>

        {/* Hero content — bottom band so the robot dominates the upper view */}
        <div className="absolute inset-x-0 bottom-5 z-[20] flex flex-col items-center gap-2 px-4 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
            <Rocket className="h-3 w-3" /> Interactive 3D Bot
          </p>
          <h1 className="max-w-sm text-2xl font-black leading-tight tracking-tight text-white sm:max-w-md sm:text-3xl lg:text-4xl">
            Your 24/7 <span className="text-cyan-300">WhatsApp</span> assistant — built in minutes
          </h1>
          <p className="text-[11px] text-slate-500">Hover panels to see the robot react · move cursor to steer</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button onClick={() => onNavigate("register")} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3 text-sm font-bold text-slate-950 shadow-[0_16px_36px_rgba(14,165,233,0.5)] transition hover:-translate-y-0.5">
              Launch Your Bot <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-7 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/40 hover:text-white">
              See How It Works
            </button>
          </div>
        </div>

        {/* Mobile feature grid */}
        <div className="absolute bottom-56 inset-x-0 z-[20] px-4 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((feat) => {
              const Icon     = feat.icon;
              const isActive = activeFeature === feat.id;
              return (
                <button key={feat.id}
                  className={["rounded-2xl border p-3 text-left backdrop-blur-md transition-all", isActive ? "border-cyan-300/60 bg-slate-900/90" : "border-white/15 bg-slate-900/55"].join(" ")}
                  onMouseEnter={() => activate(feat.id)} onMouseLeave={deactivate}
                  onClick={() => (isActive ? deactivate() : activate(feat.id))}
                >
                  <Icon className="mb-1.5 h-4 w-4 text-cyan-200" />
                  <p className="text-xs font-semibold text-white">{feat.title}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">How It Works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">From setup to live in minutes</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((s) => {
            const Icon = s.icon;
            return (
              <article key={s.n} className="rounded-3xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-cyan-300/30">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{s.n}</span>
                  <div className="rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 p-2"><Icon className="h-4 w-4 text-cyan-200" /></div>
                </div>
                <h3 className="text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{s.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* CHANNELS */}
      <section className="border-y border-white/10 bg-slate-950/60 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">Channels</p>
          <h2 className="mt-3 text-3xl font-bold text-white">One bot, every channel</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CHANNELS.map((ch) => (
              <div key={ch.name} className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-center transition hover:border-white/20">
                <div className={`mx-auto mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br ${ch.from} ${ch.to}`} />
                <p className="text-base font-semibold text-white">{ch.name}</p>
                <p className="mt-1.5 text-xs text-slate-300">{ch.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Start free, grow on demand</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article key={plan.name} className={["rounded-3xl border p-6", plan.featured ? "border-cyan-300/50 bg-cyan-400/10 shadow-[0_22px_48px_rgba(14,165,233,0.28)]" : "border-white/10 bg-slate-900/50"].join(" ")}>
              <p className="text-base font-bold text-white">{plan.name}</p>
              <p className="mt-0.5 text-xs text-slate-300">{plan.desc}</p>
              <p className="mt-4 text-4xl font-black text-white">{plan.price}<span className="ml-1 text-sm font-medium text-slate-300">/mo</span></p>
              <ul className="mt-4 space-y-2">
                {plan.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2 text-xs text-slate-200">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-300" />{pt}
                  </li>
                ))}
              </ul>
              <button onClick={() => onNavigate("register")} className={["mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition", plan.featured ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950" : "border border-white/20 text-slate-200 hover:border-white/40"].join(" ")}>Get started</button>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-cyan-300/20 bg-cyan-400/8 p-10 text-center backdrop-blur-sm shadow-[inset_0_1px_0_rgba(14,165,233,0.2)]">
          <Rocket className="mx-auto mb-4 h-8 w-8 text-cyan-300" />
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to automate your support?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-300">Build your first interactive bot in under 5 minutes. No credit card required.</p>
          <button onClick={() => onNavigate("register")} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3 text-sm font-bold text-slate-950 shadow-[0_16px_36px_rgba(14,165,233,0.45)] transition hover:-translate-y-0.5">
            Launch Your Bot <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-slate-950/80 px-4 py-6 text-center text-xs text-slate-500 sm:px-6">
        © {new Date().getFullYear()} BotDesk · Multi-channel automation for modern businesses
      </footer>
    </div>
  );
}
