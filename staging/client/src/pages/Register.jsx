import { useState, useMemo } from 'react';
import { MessageSquare, ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-400' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-400' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-indigo-400' };
  return { score: 4, label: 'Strong', color: 'bg-indigo-600' };
}

export default function Register({ onNavigate }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const fieldErrors = {
    name: touched.name && !name ? 'Business name is required' : '',
    email: touched.email && !email ? 'Email is required' : touched.email && !/\S+@\S+\.\S+/.test(email) ? 'Enter a valid email' : '',
    password: touched.password && !password ? 'Password is required' : touched.password && password.length < 8 ? 'At least 8 characters' : '',
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true });
    if (!name || !email || !password) return;
    if (!/\S+@\S+\.\S+/.test(email)) return;
    if (password.length < 8) return;
    setLoading(true);
    try {
      await register(email, password, name);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
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
        <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] bg-violet-500/15 rounded-full blur-[100px]" />
        <div className="relative flex flex-col justify-between p-10 w-full">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>
          <div className="py-12">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">NabzChat</span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">Start automating in minutes</h2>
            <p className="text-slate-400 leading-relaxed mb-10">Be one of the first businesses to automate customer conversations on WhatsApp, Telegram, and Instagram.</p>
            <div className="space-y-4">
              {[
                { icon: CheckCircle2, text: 'Setup in under 5 minutes' },
                { icon: Sparkles, text: 'Pre-built templates for any industry' },
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
          <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} NabzChat. All rights reserved.</p>
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
            <span className="text-xl font-bold text-slate-900">NabzChat</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
          <p className="text-sm text-slate-500 mb-8">Get started with NabzChat today</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Business name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, name: true }))}
                placeholder="My Awesome Business"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 bg-white ${fieldErrors.name ? 'border-red-300' : 'border-slate-200'}`}
              />
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>
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
                  placeholder="Min 8 characters"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 pr-11 bg-white ${fieldErrors.password ? 'border-red-300' : 'border-slate-200'}`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 ${strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-amber-500' : 'text-indigo-600'}`}>
                    {strength.label}
                  </p>
                </div>
              )}
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-2 bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
            <p className="text-xs text-slate-500">Your data is encrypted and stored securely</p>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')} className="text-indigo-600 font-semibold hover:underline">Sign in</button>
          </p>

          <p className="mt-6 text-center text-xs text-slate-400">
            By creating an account you agree to our <a href="https://nabzchat.tech/terms-of-service.html" target="_blank" style={{color:"#6366f1"}}>Terms of Service</a> and <a href="https://nabzchat.tech/privacy-policy.html" target="_blank" style={{color:"#6366f1"}}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
