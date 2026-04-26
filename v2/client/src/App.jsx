import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { fetchBusiness } from './lib/api';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BuilderPage from './pages/BuilderPage';
import SubmissionsList from './components/SubmissionsList';
import StaffManager from './components/StaffManager';
import { ToastProvider } from './components/Toast';
import SettingsPage from './pages/SettingsPage';
import WhatsAppTester from './pages/WhatsAppTester';
import SystemLogs from './pages/SystemLogs';
import OwnerPanel from './pages/OwnerPanel';
import AdminLayout from './components/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Landing1 from './pages/Landing1';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

function VerifyBanner() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    setSending(true);
    try {
      const token = localStorage.getItem('bd_access_token');
      await fetch(`${API}/auth/resend-verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSent(true);
    } catch {}
    setSending(false);
  }

  return (
    <div style={{
      background: '#fef3c7', borderBottom: '1px solid #fcd34d',
      padding: '10px 20px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 12, fontSize: 14,
    }}>
      <span> Please verify your email address to access all features.</span>
      {sent
        ? <span style={{color:'#059669',fontWeight:600}}> Email sent!</span>
        : <button onClick={resend} disabled={sending} style={{
            background:'#f59e0b',color:'#fff',border:'none',borderRadius:6,
            padding:'6px 16px',cursor:'pointer',fontWeight:600,
          }}>{sending ? 'Sending...' : 'Resend email'}</button>
      }
    </div>
  );
}


function UnverifiedPage({ onLogout }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function resend() {
    setSending(true);
    setError('');
    try {
      const token = localStorage.getItem('bd_access_token');
      const res = await fetch(`${API}/auth/resend-verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || 'Failed to send email');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 48, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ color: '#6c3fff', marginBottom: 24 }}>NabzChat</h1>
        <div style={{ fontSize: 48, marginBottom: 16 }}></div>
        <h2 style={{ color: '#111', marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>We sent a verification link to your email address. Please click it to activate your account.</p>
        {sent
          ? <p style={{ color: '#059669', fontWeight: 600 }}> Email sent! Check your inbox.</p>
          : <>
              {error && <p style={{ color: '#dc2626', marginBottom: 12 }}>{error}</p>}
              <button onClick={resend} disabled={sending} style={{
                background: '#6c3fff', color: '#fff', border: 'none', borderRadius: 8,
                padding: '12px 32px', cursor: 'pointer', fontWeight: 600, fontSize: 16, marginBottom: 16, width: '100%',
              }}>{sending ? 'Sending...' : 'Resend verification email'}</button>
            </>
        }
        <button onClick={onLogout} style={{
          background: 'transparent', color: '#999', border: '1px solid #e2e8f0', borderRadius: 8,
          padding: '10px 24px', cursor: 'pointer', fontSize: 14, width: '100%',
        }}>Log out</button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading, logout } = useAuth();
  const publicPages = ['landing', 'landing1', 'login', 'register', 'verify-email', 'forgot-password', 'reset-password'];
  const getInitialPage = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const search = window.location.search;
      const hasToken = new URLSearchParams(search).get('token');
      if (pathname === '/reset-password' && hasToken) return 'reset-password';
      if (pathname === '/verify-email' && hasToken) return 'verify-email';
      if (hasToken) { window.history.replaceState({}, '', window.location.pathname); }
      // Clear stale token from URL if user is logged in
      if (hasToken) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('token');
        window.history.replaceState({}, '', cleanUrl.toString());
      }
      const qp = new URLSearchParams(search).get('page');
      if (qp && publicPages.includes(qp)) return qp;
      const saved = sessionStorage.getItem('nabz_page');
      const isLoggedIn = !!localStorage.getItem('bd_user');
      if (saved && isLoggedIn) return saved;
    }
    return user ? 'dashboard' : 'landing1';
  };
  const [page, setPage] = useState(getInitialPage);
  const [businessId, setBusinessId] = useState(null);

  // Load business on login — always reset first so a new user never inherits
  // the previous user's businessId that was left in React state.
  useEffect(() => {
    setBusinessId(null);
    if (user && user.role !== 'platform_owner') {
      fetchBusiness().then((biz) => {
        setBusinessId(biz ? biz.id : null);
      }).catch(() => setBusinessId(null));
    }
  }, [user]);

  // Redirect after auth changes
  useEffect(() => {
    if (!loading && !user && !publicPages.includes(page)) {
      setPage('landing1');
    }
    if (!loading && user && ['landing', 'login', 'register'].includes(page)) {
      setPage('dashboard');
    }
  }, [user, loading, page]);

  function navigate(target) {
    setPage(target);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nabz_page', target);
      const isPublicTarget = publicPages.includes(target);
      const url = new URL(window.location.href);
      if (isPublicTarget && target.startsWith('landing')) {
        url.searchParams.set('page', target);
      } else {
        url.searchParams.delete('page');
        url.searchParams.delete('token');
      }
      window.history.replaceState({}, '', url.toString());
    }
  }

  function handleLogout() {
    logout();
    setPage('landing1');
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>;
  }

  // Public pages
  if (page === 'landing' || page === 'landing1') return <Landing1 onNavigate={navigate} />;
  if (page === 'login') return <Login onNavigate={navigate} />;
  if (page === 'register') return <Register onNavigate={navigate} />;
  if (page === 'verify-email') return <VerifyEmail onNavigate={navigate} />;
  if (page === 'forgot-password') return <ForgotPassword onNavigate={navigate} />;
  if (page === 'reset-password') return <ResetPassword onNavigate={navigate} />;

  // Protected — redirect if not logged in
  if (!user) return <Landing1 onNavigate={navigate} />;

  // Platform owners get the owner panel — bypass business AdminLayout entirely
  if (user.role === 'platform_owner') {
    return <OwnerPanel onLogout={handleLogout} />;
  }

  // Block unverified users
  if (!user.email_verified) {
    return <UnverifiedPage onLogout={handleLogout} />;
  }


  // Admin pages wrapped in layout
  return (
    <AdminLayout currentView={page} onViewChange={navigate} onLogout={handleLogout}>
      {page === 'dashboard' && <Dashboard businessId={businessId} setBusinessId={setBusinessId} onNavigate={navigate} />}
      {page === 'builder' && <BuilderPage businessId={businessId} setBusinessId={setBusinessId} />}
      {page === 'submissions' && <SubmissionsList businessId={businessId} />}
      {page === 'staff' && <StaffManager businessId={businessId} />}
      {page === 'settings' && <SettingsPage businessId={businessId} />}
      {page === 'tester' && <WhatsAppTester businessId={businessId} />}
      {page === 'logs' && <SystemLogs />}
    </AdminLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
