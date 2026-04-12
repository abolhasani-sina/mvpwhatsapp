import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestsApi, sessionsApi, notificationsApi, templatesApi, servicesApi, menuApi, flowsApi, assigneesApi, assignmentRulesApi } from '../services/api';
import { useBusinessContext } from '../context/useBusiness';

const CHECKLIST = [
  { key: 'profile', label: 'Set up your business profile', desc: 'Add your business name, phone, and description', path: '/dashboard/profile', icon: '🏢' },
  { key: 'services', label: 'Add your services', descFn: (p) => `Define the ${p.serviceNounPlural} you offer to ${p.customerNoun}s`, path: '/dashboard/services', icon: '🛠' },
  { key: 'menu', label: 'Build your WhatsApp menu', desc: 'Create the buttons your customers see in WhatsApp', path: '/dashboard/menu', icon: '📱' },
  { key: 'flows', label: 'Create a form', descFn: (p) => `Build step-by-step questions to collect ${p.customerNoun} info`, path: '/dashboard/flows', icon: '📝' },
  { key: 'team', label: 'Add team members', descFn: (p) => `Add ${p.teamNoun} who will handle ${p.customerNoun} requests`, path: '/dashboard/assignees', icon: '👥' },
  { key: 'rules', label: 'Set up auto-assignment', descFn: (p) => `Route ${p.customerNoun} requests to the right ${p.teamNoun.endsWith('s') ? p.teamNoun.slice(0, -1) : p.teamNoun} automatically`, path: '/dashboard/assignment-rules', icon: '🎯' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useBusinessContext();
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
      menuApi.getTree().then((r) => r.data.data).catch(() => []),
      flowsApi.list().then((r) => r.data.data).catch(() => []),
      assigneesApi.list().then((r) => r.data.data).catch(() => []),
      assignmentRulesApi.list().then((r) => r.data.data).catch(() => []),
    ])
      .then(([isSetup, requests, sessions, unread, services, menuNodes, flows, assignees, rules]) => {
        setSetupComplete(isSetup);
        setStats({
          requests: requests.length,
          sessions: sessions.length,
          unread: unread.length,
        });
        setRecentRequests(requests.slice(0, 5));
        setChecklist({
          profile: true, // profile always exists after registration
          services: services.length > 0,
          menu: menuNodes.length > 0,
          flows: flows.length > 0,
          team: assignees.length > 0,
          rules: rules.length > 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!setupComplete) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center animate-fade-in">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">🚀</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome! Let's get you started</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Choose a business template to auto-create your services, menu, and forms — or start from scratch.
        </p>
        <button
          onClick={() => navigate('/dashboard/setup')}
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 cursor-pointer"
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
              <span className="text-sm font-semibold text-indigo-600">{completedCount}/{CHECKLIST.length}</span>
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          <div className="space-y-2 stagger">
            {CHECKLIST.map((item) => {
              const done = checklist[item.key];
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${done ? 'bg-gray-50' : 'bg-gradient-to-r from-indigo-50/60 to-white hover:from-indigo-50 cursor-pointer'}`}
                  onClick={() => !done && navigate(item.path)}
                >
                  {done ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-300 flex items-center justify-center flex-shrink-0 text-sm">
                      {item.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.label}</p>
                    {!done && <p className="text-xs text-gray-500 mt-0.5">{item.descFn ? item.descFn(profile) : item.desc}</p>}
                  </div>
                  {!done && (
                    <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 card-hover animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Customer Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.requests}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
              </svg>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/requests')} className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer">View all →</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 card-hover animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Live Conversations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.sessions}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/sessions')} className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-800 cursor-pointer">View all →</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 card-hover animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Unread Notifications</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.unread}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
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
          <button onClick={() => navigate('/dashboard/requests')} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer">View all →</button>
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

function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    rejected: 'bg-red-50 text-red-700 ring-red-600/20',
    manual_followup: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    completed: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${colors[status] || 'bg-gray-50 text-gray-600 ring-gray-500/20'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
