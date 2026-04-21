import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { fetchBusiness } from './lib/api';
import Landing from './pages/Landing';
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
import Landing2 from './pages/Landing2';
import Landing3 from './pages/Landing3';
import Landing4 from './pages/Landing4';
import Landing5 from './pages/Landing5';

function AppRoutes() {
  const { user, loading, logout } = useAuth();
  const publicPages = ['landing', 'landing1', 'landing2', 'landing3', 'landing4', 'landing5', 'login', 'register'];
  const getInitialPage = () => {
    if (typeof window !== 'undefined') {
      const qp = new URLSearchParams(window.location.search).get('page');
      if (qp && publicPages.includes(qp)) return qp;
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
      setPage('landing');
    }
    if (!loading && user && ['landing', 'login', 'register'].includes(page)) {
      setPage('dashboard');
    }
  }, [user, loading, page]);

  function navigate(target) {
    setPage(target);
    if (typeof window !== 'undefined') {
      const isPublicTarget = publicPages.includes(target);
      const url = new URL(window.location.href);
      if (isPublicTarget && target.startsWith('landing')) {
        url.searchParams.set('page', target);
      } else {
        url.searchParams.delete('page');
      }
      window.history.replaceState({}, '', url.toString());
    }
  }

  function handleLogout() {
    logout();
    setPage('landing');
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>;
  }

  // Public pages
  if (page === 'landing' || page === 'landing1') return <Landing1 onNavigate={navigate} />;
  if (page === 'login') return <Login onNavigate={navigate} />;
  if (page === 'register') return <Register onNavigate={navigate} />;
  if (page === 'landing1') return <Landing1 onNavigate={navigate} />;
  if (page === 'landing2') return <Landing2 onNavigate={navigate} />;
  if (page === 'landing3') return <Landing3 onNavigate={navigate} />;
  if (page === 'landing4') return <Landing4 onNavigate={navigate} />;
  if (page === 'landing5') return <Landing5 onNavigate={navigate} />;

  // Protected — redirect if not logged in
  if (!user) return <Landing onNavigate={navigate} />;

  // Platform owners get the owner panel — bypass business AdminLayout entirely
  if (user.role === 'platform_owner') {
    return <OwnerPanel onLogout={handleLogout} />;
  }

  // Admin pages wrapped in layout
  return (
    <AdminLayout currentView={page} onViewChange={navigate} onLogout={handleLogout}>
      {page === 'dashboard' && <Dashboard businessId={businessId} onNavigate={navigate} />}
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
