import { useState } from 'react';
import { MessageSquare, ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email) return setError('Email is required');
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Enter a valid email');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Something went wrong');
      }
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
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
          <button onClick={() => onNavigate('login')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>
          <div className="py-12">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">NabzChat</span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">Forgot your password?</h2>
            <p className="text-slate-400 leading-relaxed">No worries  enter your email and we'll send you a reset link valid for 1 hour.</p>
          </div>
          <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} NabzChat. All rights reserved.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 bg-slate-50">
        <div className="w-full max-w-[420px]">
          <button onClick={() => onNavigate('login')} className="lg:hidden flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">NabzChat</span>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
              <p className="text-sm text-slate-500 mb-2">We sent a reset link to</p>
              <p className="text-sm font-semibold text-slate-800 mb-6">{email}</p>
              <p className="text-xs text-slate-400 mb-8">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
              <button onClick={() => onNavigate('login')} className="text-sm text-indigo-600 font-semibold hover:underline">
                Back to login
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Reset password</h1>
              <p className="text-sm text-slate-500 mb-8">Enter your account email and we'll send a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 bg-white ${error ? 'border-red-300' : 'border-slate-200'}`}
                    />
                  </div>
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/25 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-500">
                Remember it?{' '}
                <button onClick={() => onNavigate('login')} className="text-indigo-600 font-semibold hover:underline">Sign in</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
