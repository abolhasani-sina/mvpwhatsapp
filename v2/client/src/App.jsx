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
import SettingsPage from './pages/SettingsPage';
import WhatsAppTester from './pages/WhatsAppTester';
import AdminLayout from './components/AdminLayout';

function AppRoutes() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState(user ? 'dashboard' : 'landing');
  const [businessId, setBusinessId] = useState(null);

  // Load business on login
  useEffect(() => {
    if (user) {
      fetchBusiness().then((biz) => {
        if (biz) setBusinessId(biz.id);
      });
    }
  }, [user]);

  // Redirect after auth changes
  useEffect(() => {
    if (!loading && !user && !['landing', 'login', 'register'].includes(page)) {
      setPage('landing');
    }
    if (!loading && user && ['landing', 'login', 'register'].includes(page)) {
      setPage('dashboard');
    }
  }, [user, loading, page]);

  function navigate(target) {
    setPage(target);
  }

  function handleLogout() {
    logout();
    setPage('landing');
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  }

  // Public pages
  if (page === 'landing') return <Landing onNavigate={navigate} />;
  if (page === 'login') return <Login onNavigate={navigate} />;
  if (page === 'register') return <Register onNavigate={navigate} />;

  // Protected — redirect if not logged in
  if (!user) return <Landing onNavigate={navigate} />;

  // Admin pages wrapped in layout
  return (
    <AdminLayout currentView={page} onViewChange={navigate} onLogout={handleLogout}>
      {page === 'dashboard' && <Dashboard businessId={businessId} onNavigate={navigate} />}
      {page === 'builder' && <BuilderPage businessId={businessId} setBusinessId={setBusinessId} />}
      {page === 'submissions' && <SubmissionsList businessId={businessId} />}
      {page === 'staff' && <StaffManager businessId={businessId} />}
      {page === 'settings' && <SettingsPage businessId={businessId} />}
      {page === 'tester' && <WhatsAppTester businessId={businessId} />}
    </AdminLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
