import { useState } from 'react';
import { MessageSquare, ArrowLeft, Eye, EyeOff, Loader2, Bot, Zap, BarChart3 } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Login({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const fieldErrors = {
    email: touched.email && !email ? 'Email is required' : touched.email && !/\S+@\S+\.\S+/.test(email) ? 'Enter a valid email' : '',
    password: touched.password && !password ? 'Password is required' : '',
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setTouched({ email: true, password: true });
    if (!email || !password) return;
    if (!/\S+@\S+\.\S+/.test(email)) return;
    setLoading(true);
    try {
      await login(email, password);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950" />
        <div className="absolute inset-0 bd-grid-bg opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[100px]" />
        <div className="relative flex flex-col justify-between p-10 w-full">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>
          <div className="py-12">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">BotDesk</span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">Automate your business with WhatsApp</h2>
            <p className="text-slate-400 leading-relaxed mb-10">Smart bots that handle bookings, capture leads, and delight customers — while you focus on what matters.</p>
            <div className="space-y-4">
              {[
                { icon: Bot, text: 'AI-powered auto-replies 24/7' },
                { icon: Zap, text: 'Set up in under 5 minutes' },
                { icon: BarChart3, text: 'Real-time analytics dashboard' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <item.icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} BotDesk. All rights reserved.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 bg-slate-50">
        <div className="w-full max-w-[420px]">
          <button onClick={() => onNavigate('landing')} className="lg:hidden flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">BotDesk</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                placeholder="you@company.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 bg-white ${fieldErrors.email ? 'border-red-300' : 'border-slate-200'}`}
              />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 pr-11 bg-white ${fieldErrors.password ? 'border-red-300' : 'border-slate-200'}`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/25 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <button onClick={() => onNavigate('register')} className="text-indigo-600 font-semibold hover:underline">Sign up</button>
          </p>

          <p className="mt-6 text-center text-xs text-slate-400">
            By signing in you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
