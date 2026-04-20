import { useState, useMemo } from 'react';
import { MessageSquare, ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
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
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-emerald-400' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-600' };
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BotDesk</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-8">Get started with BotDesk for free</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Business name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, name: true }))}
                placeholder="My Awesome Business"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 ${fieldErrors.name ? 'border-red-300' : 'border-gray-200'}`}
              />
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                placeholder="you@company.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 ${fieldErrors.email ? 'border-red-300' : 'border-gray-200'}`}
              />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  placeholder="Min 8 characters"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 pr-11 ${fieldErrors.password ? 'border-red-300' : 'border-gray-200'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 ${strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-xs text-gray-500">Your data is encrypted and stored securely</p>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')} className="text-emerald-600 font-semibold hover:underline">
              Sign in
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          By creating an account you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
