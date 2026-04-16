import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../services/api';
import { Spinner, ErrorMsg } from '../components/UI';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUnread, setShowUnread] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = showUnread
        ? await notificationsApi.listUnread()
        : await notificationsApi.list();
      setNotifications(res.data.data);
    } catch { setError('Failed to load notifications'); }
    finally { setLoading(false); }
  }, [showUnread]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      fetchNotifications();
    } catch { setError('Failed to mark as read'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated on new requests, assignments, and system events.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUnread(false)} className={`px-3 py-1.5 text-sm rounded-xl cursor-pointer transition-all ${!showUnread ? 'bg-emerald-600 text-white shadow-sm' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>All</button>
          <button onClick={() => setShowUnread(true)} className={`px-3 py-1.5 text-sm rounded-xl cursor-pointer transition-all ${showUnread ? 'bg-emerald-600 text-white shadow-sm' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Unread</button>
        </div>
      </div>
      <ErrorMsg msg={error} onDismiss={() => setError(null)} />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80">
        {loading ? <Spinner /> : notifications.length === 0 ? (
          <div className="px-6 py-16 text-center"><div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl mx-auto mb-4">🔔</div><p className="font-semibold text-gray-900 mb-1">No notifications yet</p><p className="text-sm text-gray-500 max-w-xs mx-auto">Notifications appear here when customers interact with your WhatsApp bot.</p></div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li key={n.id} className={`px-6 py-4 flex items-start justify-between gap-4 ${n.is_read ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.is_read && <span className="w-2 h-2 bg-emerald-600 rounded-full flex-shrink-0" />}
                    <span className="text-xs font-medium text-emerald-600 uppercase">{n.type?.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markAsRead(n.id)} className="text-xs text-emerald-600 hover:text-emerald-800 flex-shrink-0 cursor-pointer">Mark read</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
