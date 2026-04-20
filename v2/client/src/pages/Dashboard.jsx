import { useState, useEffect } from 'react';
import { Inbox, Users, Bot, TrendingUp, ArrowRight, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { fetchAnalytics } from '../lib/api';
import { SkeletonCard } from '../components/Skeleton';

export default function Dashboard({ businessId, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    fetchAnalytics(businessId)
      .then((d) => setData(d))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, [businessId]);

  // ── Onboarding state ──
  if (!businessId) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to BotDesk</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Build your AI chat bot in minutes. Pick a template, customize it, and start receiving customer requests on WhatsApp, Telegram & Instagram.
          </p>
          <button
            onClick={() => onNavigate?.('builder')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            <Bot className="w-5 h-5" /> Create Your Bot <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const stats = data || { totalSubmissions: 0, newCount: 0, inProgress: 0, doneCount: 0, staffCount: 0, recentSubmissions: [], dailyCounts: [] };

  const cards = [
    { label: 'Total Submissions', value: stats.totalSubmissions, icon: Inbox, color: 'bg-blue-50 text-blue-600' },
    { label: 'New / Pending', value: stats.newCount, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-orange-50 text-orange-600' },
    { label: 'Completed', value: stats.doneCount, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
  ];

  const quickActions = [
    { label: 'Edit Bot', page: 'builder', icon: Bot, desc: 'Customize menus & flows' },
    { label: 'View Submissions', page: 'submissions', icon: Inbox, desc: 'Review incoming requests' },
    { label: 'Manage Staff', page: 'staff', icon: Users, desc: 'Assign team members' },
  ];

  const maxDaily = Math.max(...(stats.dailyCounts || []).map((d) => d.count), 1);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Overview of your bot activity</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); fetchAnalytics(businessId).then(d => setData(d)).catch(() => setError('Failed to load.')).finally(() => setLoading(false)); }} className="bg-emerald-500 text-white border-none rounded-lg px-4 py-2 text-sm cursor-pointer">Retry</button>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{c.value}</div>
                <div className="text-xs text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Activity chart + recent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily activity (last 7 days) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Last 7 Days</h3>
              {(stats.dailyCounts || []).length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">No activity yet</p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {(stats.dailyCounts || []).map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-500 font-medium">{d.count}</span>
                      <div
                        className="w-full bg-emerald-400 rounded-t-md min-h-[4px] transition-all"
                        style={{ height: `${(d.count / maxDaily) * 100}%` }}
                      />
                      <span className="text-[10px] text-gray-400">{d.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent submissions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Recent Submissions</h3>
                {stats.totalSubmissions > 0 && (
                  <button onClick={() => onNavigate?.('submissions')} className="text-xs text-emerald-600 hover:underline">
                    View all →
                  </button>
                )}
              </div>
              {(stats.recentSubmissions || []).length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">No submissions yet</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(stats.recentSubmissions || []).slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">{s.flow_name || 'Submission'}</span>
                        <span className="text-gray-400 ml-2">{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          s.status === 'new' ? 'bg-amber-100 text-amber-700' :
                          s.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickActions.map((a) => (
                <button
                  key={a.page}
                  onClick={() => onNavigate?.(a.page)}
                  className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <a.icon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{a.label}</div>
                    <div className="text-xs text-gray-400">{a.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
