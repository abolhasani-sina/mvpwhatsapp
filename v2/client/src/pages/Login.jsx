import { useState } from 'react';
import { MessageSquare, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
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

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="••••••••"
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
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <button onClick={() => onNavigate('register')} className="text-emerald-600 font-semibold hover:underline">
              Sign up
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          By signing in you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
