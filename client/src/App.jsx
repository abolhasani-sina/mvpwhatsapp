import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TenantGuard from './components/TenantGuard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BusinessProfile from './pages/BusinessProfile';
import Services from './pages/Services';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <TenantGuard>
            <Layout />
          </TenantGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<BusinessProfile />} />
        <Route path="services" element={<Services />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
