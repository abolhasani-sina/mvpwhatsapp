import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestsApi, sessionsApi, notificationsApi, templatesApi, servicesApi } from '../services/api';
import { StatusBadge } from '../components/UI';

const CHECKLIST = [
  { key: 'profile', label: 'Set up your business profile', desc: 'Add your business name, phone, and description', path: '/dashboard/profile', icon: '🏢' },
  { key: 'welcome', label: 'Create your welcome message', desc: 'Set the first message customers see on WhatsApp', path: '/dashboard/catalog', icon: '💬' },
  { key: 'buttons', label: 'Add your first buttons', desc: 'Create the options customers can tap in WhatsApp', path: '/dashboard/catalog', icon: '📱' },
  { key: 'paths', label: 'Build conversation paths', desc: 'Design what happens when customers tap each button', path: '/dashboard/catalog', icon: '🗂️' },
  { key: 'flow', label: 'Add a booking or request flow', desc: 'Create a step-by-step form to collect customer info', path: '/dashboard/catalog', icon: '📝' },
  { key: 'test', label: 'Test your chat', desc: 'Open the tester and simulate a full customer conversation', path: '/dashboard/catalog', icon: '🧪' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ requests: 0, sessions: 0, unread: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(true);
  const [checklist, setChecklist] = useState({});

  useEffect(() => {
    Promise.all([
      templatesApi.status().then((r) => r.data.data.setup_complete),
      requestsApi.list().then((r) => r.data.data),
      sessionsApi.list().then((r) => r.data.data),
      notificationsApi.listUnread().then((r) => r.data.data),
      servicesApi.list().then((r) => r.data.data).catch(() => []),
    ])
      .then(([isSetup, requests, sessions, unread, services]) => {
        setSetupComplete(isSetup);
        setStats({
          requests: requests.length,
          sessions: sessions.length,
          unread: unread.length,
        });
        setRecentRequests(requests.slice(0, 5));

        // Builder-based completion checks
        const rootServices = services.filter(s => !s.parent_id);
        const hasNested = services.some(s => s.parent_id);
        const hasForm = services.some(s => {
          const beh = typeof s.behavior === 'string' ? (() => { try { return JSON.parse(s.behavior); } catch { return {}; } })() : (s.behavior || {});
          return beh.type === 'custom' && beh.mode === 'ask_questions' && beh.steps?.length > 0;
        });

        setChecklist({
          profile: true,
          welcome: true, // Welcome message always exists (default or custom)
          buttons: rootServices.length > 0,
          paths: hasNested,
          flow: hasForm,
          test: requests.length > 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!setupComplete) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center animate-fade-in">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm">🚀</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome! Let's get you started</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Choose a business template to auto-create your services, menu, and forms — or start from scratch.
        </p>
        <button
          onClick={() => navigate('/dashboard/setup')}
          className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 cursor-pointer btn-press"
        >
          Start Setup →
        </button>
      </div>
    );
  }

  const completedCount = CHECKLIST.filter((c) => checklist[c.key]).length;
  const allDone = completedCount === CHECKLIST.length;
  const progress = Math.round((completedCount / CHECKLIST.length) * 100);

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your WhatsApp automation system.</p>
      </div>

      {/* Getting Started checklist */}
      {!allDone && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 mb-8 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Getting Started</h2>
              <p className="text-sm text-gray-500 mt-0.5">Complete these steps to go live on WhatsApp</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-emerald-600">{completedCount}/{CHECKLIST.length}</span>
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          <div className="space-y-2 stagger">
            {CHECKLIST.map((item) => {
              const done = checklist[item.key];
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${done ? 'bg-gray-50' : 'bg-gradient-to-r from-emerald-50/40 to-white hover:from-emerald-50/70 cursor-pointer'}`}
                  onClick={() => !done && navigate(item.path)}
                >
                  {done ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-300 flex items-center justify-center flex-shrink-0 text-sm">
                      {item.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.label}</p>
                    {!done && <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>}
                  </div>
                  {!done && (
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 stagger">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 card-hover animate-fade-in group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Customer Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.requests}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
              </svg>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/requests')} className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-800 cursor-pointer">View all →</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 card-hover animate-fade-in group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Live Conversations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.sessions}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/sessions')} className="mt-3 text-xs font-medium text-cyan-600 hover:text-cyan-800 cursor-pointer">View all →</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 card-hover animate-fade-in group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Unread Notifications</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.unread}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/notifications')} className="mt-3 text-xs font-medium text-amber-600 hover:text-amber-800 cursor-pointer">View all →</button>
        </div>
      </div>

      {/* Recent Customer Requests */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Customer Requests</h2>
          <button onClick={() => navigate('/dashboard/requests')} className="text-xs font-medium text-emerald-600 hover:text-emerald-800 cursor-pointer">View all →</button>
        </div>
        {recentRequests.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl mx-auto mb-3">📥</div>
            <p className="font-medium text-gray-900 text-sm mb-1">No customer requests yet</p>
            <p className="text-xs text-gray-500">When customers complete a form on WhatsApp, their requests appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs">{r.phone_number || '—'}</td>
                    <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-3 text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
