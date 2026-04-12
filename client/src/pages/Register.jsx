import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/useAuth';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ business_name: '', email: '', password: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.register(form.business_name, form.email, form.password);
      await login(form.email, form.password);
      navigate('/dashboard/setup', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">MVP<span className="text-emerald-600">Whatsapp</span></h1>
          <p className="text-sm text-gray-500 mt-1">Create your business account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {error}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
              <input
                type="text"
                required
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                placeholder="Your Business Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all cursor-pointer text-sm shadow-sm"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
