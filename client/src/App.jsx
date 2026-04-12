import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TenantGuard from './components/TenantGuard';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import BusinessProfile from './pages/BusinessProfile';
import Services from './pages/Services';
import MenuBuilder from './pages/MenuBuilder';
import FlowBuilder from './pages/FlowBuilder';
import Requests from './pages/Requests';
import Assignees from './pages/Assignees';
import AssignmentRules from './pages/AssignmentRules';
import Notifications from './pages/Notifications';
import Sessions from './pages/Sessions';
import SetupWizard from './pages/SetupWizard';
import ConversationBuilder from './pages/ConversationBuilder';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <TenantGuard>
            <Layout />
          </TenantGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="setup" element={<SetupWizard />} />
        <Route path="builder" element={<ConversationBuilder />} />
        <Route path="profile" element={<BusinessProfile />} />
        <Route path="services" element={<Services />} />
        <Route path="menu" element={<MenuBuilder />} />
        <Route path="flows" element={<FlowBuilder />} />
        <Route path="requests" element={<Requests />} />
        <Route path="assignees" element={<Assignees />} />
        <Route path="assignment-rules" element={<AssignmentRules />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="sessions" element={<Sessions />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
