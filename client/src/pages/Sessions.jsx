import { useState, useEffect, useCallback } from 'react';
import { sessionsApi } from '../services/api';
import { Spinner, ErrorMsg } from '../components/UI';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try { const res = await sessionsApi.list(); setSessions(res.data.data); }
    catch { setError('Failed to load sessions'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      sessionsApi.list().then(res => setSessions(res.data.data)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTakeover = async (id) => {
    setActionLoading(id);
    try { await sessionsApi.takeover(id); fetchSessions(); }
    catch (err) { setError(err.response?.data?.error?.message || 'Takeover failed'); }
    finally { setActionLoading(null); }
  };

  const handleRelease = async (id) => {
    setActionLoading(id);
    try { await sessionsApi.release(id); fetchSessions(); }
    catch (err) { setError(err.response?.data?.error?.message || 'Release failed'); }
    finally { setActionLoading(null); }
  };

  const humanCount = sessions.filter(s => s.mode === 'human_takeover').length;
  const autoCount = sessions.filter(s => s.mode !== 'human_takeover').length;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Conversations</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor active WhatsApp sessions. Take over for human support when needed.</p>
        </div>
        <button onClick={fetchSessions} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
          Refresh
        </button>
      </div>

      <ErrorMsg msg={error} onDismiss={() => setError(null)} />

      {/* Status summary cards */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Active</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{sessions.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bot Handling</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{autoCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Human Takeover</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{humanCount}</p>
          </div>
        </div>
      )}

      {/* Info box explaining takeover */}
      {sessions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <div className="text-blue-500 flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
            </div>
            <div className="text-sm text-blue-800">
              <strong>How takeover works:</strong> When you click <em>Take Over</em>, the bot pauses for that customer. 
              The customer&apos;s messages will no longer get automated replies, so you can respond manually via WhatsApp. 
              Click <em>Release</em> to return the conversation to the bot.
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {loading ? <Spinner /> : sessions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mx-auto mb-4">💬</div>
            <p className="font-semibold text-gray-900 mb-1">No active conversations</p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">When customers message your WhatsApp bot, their active sessions appear here. Sessions expire after 30 minutes of inactivity.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Mode</th>
                  <th className="px-6 py-3 font-medium">Current State</th>
                  <th className="px-6 py-3 font-medium">Last Activity</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s) => {
                  const isHuman = s.mode === 'human_takeover';
                  const timeSince = getTimeSince(s.last_activity);
                  return (
                    <tr key={s.id} className={`transition-colors ${isHuman ? 'bg-orange-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isHuman ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {s.phone_number?.slice(-2) || '??'}
                          </div>
                          <span className="font-mono text-sm">{s.phone_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${isHuman ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isHuman ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                          {isHuman ? 'Human' : 'Bot'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {s.current_flow_id ? (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                            <span>📝</span> Filling form (step {s.current_flow_step})
                          </span>
                        ) : s.current_menu_node_id ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                            <span>📋</span> Browsing menu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                            <span>🏠</span> Main menu
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{timeSince}</td>
                      <td className="px-6 py-4">
                        {isHuman ? (
                          <button onClick={() => handleRelease(s.id)} disabled={actionLoading === s.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition-all disabled:opacity-50 shadow-sm">
                            {actionLoading === s.id ? '...' : (
                              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg> Release to Bot</>
                            )}
                          </button>
                        ) : (
                          <button onClick={() => handleTakeover(s.id)} disabled={actionLoading === s.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer transition-all disabled:opacity-50 shadow-sm">
                            {actionLoading === s.id ? '...' : (
                              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg> Take Over</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-center">Auto-refreshes every 15 seconds • Sessions expire after 30 minutes of inactivity</p>
    </div>
  );
}

function getTimeSince(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}
