import { useState, useEffect, useCallback } from 'react';
import { sessionsApi } from '../services/api';
import { Spinner, ErrorMsg } from '../components/UI';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try { const res = await sessionsApi.list(); setSessions(res.data.data); }
    catch { setError('Failed to load sessions'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleTakeover = async (id) => {
    try { await sessionsApi.takeover(id); fetchSessions(); }
    catch (err) { setError(err.response?.data?.error?.message || 'Takeover failed'); }
  };

  const handleRelease = async (id) => {
    try { await sessionsApi.release(id); fetchSessions(); }
    catch (err) { setError(err.response?.data?.error?.message || 'Release failed'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Conversations</h1>
          <p className="text-sm text-gray-500 mt-1">View active WhatsApp conversations. Take over from the bot for human support when needed.</p>
        </div>
        <button onClick={fetchSessions} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all font-medium">↻ Refresh</button>
      </div>
      <ErrorMsg msg={error} onDismiss={() => setError(null)} />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {loading ? <Spinner /> : sessions.length === 0 ? (
          <div className="px-6 py-16 text-center"><div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mx-auto mb-4">💬</div><p className="font-semibold text-gray-900 mb-1">No active conversations</p><p className="text-sm text-gray-500 max-w-xs mx-auto">Active WhatsApp conversations will appear here when customers message your bot.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Current State</th>
                  <th className="px-6 py-3">Last Activity</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-sm">{s.phone_number}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${s.mode === 'human_takeover' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        {s.mode === 'human_takeover' ? 'Human' : 'Auto'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {s.current_flow_id ? 'In flow (step ' + s.current_flow_step + ')' : s.current_menu_node_id ? 'In menu' : 'Root menu'}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">{new Date(s.last_activity).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      {s.mode === 'human_takeover' ? (
                        <button onClick={() => handleRelease(s.id)} className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">Release</button>
                      ) : (
                        <button onClick={() => handleTakeover(s.id)} className="px-3 py-1 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer">Takeover</button>
                      )}
                    </td>
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
