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
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 rounded-2xl p-12 text-center shadow-xl">
          <div className="absolute inset-0 bd-grid-bg opacity-20" />
          <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-indigo-500/15 rounded-full blur-[80px]" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to NabzChat</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Build your smart bot in minutes. Pick a template, customize it, and start receiving customer requests on WhatsApp, Telegram & Instagram.
            </p>
            <button
              onClick={() => onNavigate?.('builder')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-indigo-500/25"
            >
              <Bot className="w-5 h-5" /> Create Your Bot <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = data || { totalSubmissions: 0, newCount: 0, inProgress: 0, doneCount: 0, staffCount: 0, recentSubmissions: [], dailyCounts: [] };

  const cards = [
    { label: 'Total Requests', value: stats.totalSubmissions, icon: Inbox, iconColor: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-100' },
    { label: 'Waiting for Reply', value: stats.newCount, icon: TrendingUp, iconColor: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-100' },
    { label: 'Being Handled', value: stats.inProgress, icon: Clock, iconColor: 'text-violet-500', bgColor: 'bg-violet-50', borderColor: 'border-violet-100' },
    { label: 'Done', value: stats.doneCount, icon: CheckCircle2, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100' },
  ];

  const quickActions = [
    { label: 'Edit Bot', page: 'builder', icon: Bot, desc: 'Customize menus & flows', gradient: 'from-indigo-500 to-violet-500' },
    { label: 'View Submissions', page: 'submissions', icon: Inbox, desc: 'Review incoming requests', gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Connect WhatsApp', page: 'settings', icon: Users, desc: 'Link your WhatsApp channel', gradient: 'from-amber-500 to-orange-500' },
  ];

  const maxDaily = Math.max(...(stats.dailyCounts || []).map((d) => d.count), 1);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Good morning </h2>
        <p className="text-sm text-slate-500 mt-1">Here is what is happening today</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); fetchAnalytics(businessId).then(d => setData(d)).catch(() => setError('Failed to load.')).finally(() => setLoading(false)); }} className="bg-indigo-500 hover:bg-indigo-600 text-white border-none rounded-xl px-5 py-2.5 text-sm font-medium cursor-pointer transition-colors">Retry</button>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className={`bg-white rounded-2xl border ${c.borderColor} p-5 hover:shadow-md transition-shadow`}>
                <div className={`w-10 h-10 rounded-xl ${c.bgColor} flex items-center justify-center mb-3`}>
                  <c.icon className={`w-5 h-5 ${c.iconColor}`} />
                </div>
                <div className="text-2xl font-bold text-slate-900">{c.value}</div>
                <div className="text-xs text-slate-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Activity chart + recent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Last 7 Days</h3>
              {(stats.dailyCounts || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No activity yet</p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {(stats.dailyCounts || []).map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-medium">{d.count}</span>
                      <div
                        className="w-full bg-gradient-to-t from-indigo-500 to-violet-400 rounded-t-md min-h-[4px] transition-all"
                        style={{ height: `${(d.count / maxDaily) * 100}%` }}
                      />
                      <span className="text-[10px] text-slate-400">{d.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Recent Submissions</h3>
                {stats.totalSubmissions > 0 && (
                  <button onClick={() => onNavigate?.('submissions')} className="text-xs text-indigo-600 hover:underline font-medium">
                    View all →
                  </button>
                )}
              </div>
              {(stats.recentSubmissions || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No submissions yet</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto bd-scrollbar">
                  {(stats.recentSubmissions || []).slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 text-xs">
                      <div>
                        <span className="font-medium text-slate-700">{s.flow_name || 'Submission'}</span>
                        <span className="text-slate-400 ml-2">{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${s.status === 'new' ? 'bg-amber-100 text-amber-700' : s.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
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
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickActions.map((a) => (
                <button
                  key={a.page}
                  onClick={() => onNavigate?.(a.page)}
                  className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all text-left group"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${a.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                    <a.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">{a.label}</div>
                    <div className="text-xs text-slate-400">{a.desc}</div>
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
