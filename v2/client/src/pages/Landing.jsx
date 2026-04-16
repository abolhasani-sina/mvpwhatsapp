import { useState } from 'react';
import { MessageSquare, Bot, Users, CalendarCheck, Sparkles, ArrowRight, CheckCircle2, Star } from 'lucide-react';

const FEATURES = [
  { icon: Bot, title: 'Automate Replies', desc: 'AI handles customer messages 24/7 with smart, contextual responses.' },
  { icon: Users, title: 'Capture Leads', desc: 'Collect customer info through interactive WhatsApp flows automatically.' },
  { icon: CalendarCheck, title: 'Manage Requests', desc: 'Track bookings, orders, and inquiries in one dashboard.' },
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

export default function Landing({ onNavigate }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">BotDesk</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm"
            >
              Start free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-powered WhatsApp automation
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight max-w-3xl mx-auto">
            Turn WhatsApp into your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
              AI receptionist
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Build automated WhatsApp bots that handle bookings, answer questions,
            and capture leads — no coding needed.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-3.5 text-base font-semibold text-white bg-emerald-500 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3.5 text-base font-semibold text-gray-700 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all"
            >
              See demo
            </button>
          </div>

          {/* Trust */}
          <div className="mt-14 flex items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free plan</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No code</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 5 min setup</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to automate WhatsApp</h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">Powerful tools packaged in a simple interface</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for every business</h2>
          <p className="text-gray-500 mb-12 max-w-lg mx-auto">Pre-built templates for popular industries. Pick one and customize.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {USE_CASES.map((uc) => (
              <div
                key={uc.label}
                className="flex items-center gap-2.5 px-5 py-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-default"
              >
                <span className="text-xl">{uc.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{uc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">See it in action</h2>
          <p className="text-gray-500 mb-12 max-w-lg mx-auto">This is exactly how your customers will interact with your WhatsApp bot.</p>
          {/* Phone mockup placeholder — the real PhoneMockup renders inside the builder */}
          <div className="max-w-sm mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Fake phone header */}
              <div className="bg-emerald-600 px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold text-sm">Your Business</div>
                  <div className="text-emerald-100 text-xs">online</div>
                </div>
              </div>
              {/* Chat body */}
              <div className="bg-[#e5ddd5] px-4 py-6 space-y-3 min-h-[340px]">
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[85%] shadow-sm">
                  <p className="text-sm text-gray-800">👋 Welcome! How can I help you today?</p>
                </div>
                <div className="space-y-2 max-w-[70%]">
                  {['📋 Our Services', '📅 Book Appointment', '❓ FAQ'].map((label) => (
                    <div key={label} className="bg-white rounded-xl px-4 py-2 text-center shadow-sm border border-emerald-100">
                      <span className="text-sm font-medium text-emerald-600">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <div className="bg-emerald-500 rounded-xl rounded-br-sm px-4 py-2.5 shadow-sm">
                    <p className="text-sm text-white">📅 Book Appointment</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[85%] shadow-sm">
                  <p className="text-sm text-gray-800">Great choice! Let me guide you through the booking process… 📝</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-12 text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-4">Ready to automate your WhatsApp?</h2>
            <p className="text-emerald-100 mb-8 max-w-md mx-auto">
              Join businesses already using BotDesk to handle customer messages automatically.
            </p>
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-3.5 text-base font-semibold bg-white text-emerald-600 rounded-2xl hover:bg-emerald-50 transition-colors shadow-lg flex items-center gap-2 mx-auto"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-gray-500">BotDesk</span>
          </div>
          <span>&copy; {new Date().getFullYear()} BotDesk. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
