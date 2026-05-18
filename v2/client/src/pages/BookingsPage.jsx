import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { fetchBookings, fetchStaffMembers } from '../lib/api';
import { authFetch } from '../lib/auth.jsx';
import { useToast } from '../components/Toast';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

const STATUS_CONFIG = {
  confirmed:  { label: 'Confirmed',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  completed:  { label: 'Completed',  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  no_show:    { label: 'No-show',    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
};

const CHANNEL_CONFIG = {
  voice:     { label: 'Voice',     bg: 'bg-purple-50', text: 'text-purple-700' },
  telegram:  { label: 'Telegram',  bg: 'bg-blue-50',   text: 'text-blue-700' },
  whatsapp:  { label: 'WhatsApp',  bg: 'bg-green-50',  text: 'text-green-700' },
  instagram: { label: 'Instagram', bg: 'bg-pink-50',   text: 'text-pink-700' },
  walk_in:   { label: 'Walk-in',   bg: 'bg-slate-100', text: 'text-slate-600' },
};

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.confirmed;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
}

function ChannelBadge({ channel }) {
  const c = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.walk_in;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
}

function StatCard({ label, value, sub, color = 'slate' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold text-slate-800`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const FILTERS = ['all', 'confirmed', 'completed', 'cancelled', 'no_show'];

export default function BookingsPage({ businessId }) {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (filter !== 'all') params.status = filter;
    if (staffFilter) params.staff_id = staffFilter;
    if (dateFilter) params.date = dateFilter;
    const [bks, st] = await Promise.all([
      fetchBookings(businessId, params),
      fetchStaffMembers(businessId)
    ]);
    setBookings(Array.isArray(bks) ? bks : []);
    setStaff(Array.isArray(st) ? st : []);
    setLoading(false);
  }, [businessId, filter, staffFilter, dateFilter]);

  useEffect(() => { load(); }, [load]);

  async function markComplete(id) {
    setActionLoading(id + '_complete');
    try {
      await authFetch(`${API}/business/${businessId}/bookings/${id}/complete`, { method: 'PUT' });
      addToast('Marked as completed', 'success');
      await load();
    } catch(e) { addToast('Failed', 'error'); }
    setActionLoading(null);
  }

  async function markNoShow(id) {
    setActionLoading(id + '_noshow');
    try {
      await authFetch(`${API}/business/${businessId}/bookings/${id}/no-show`, { method: 'PUT' });
      addToast('Marked as no-show', 'success');
      await load();
    } catch(e) { addToast('Failed', 'error'); }
    setActionLoading(null);
  }

  async function cancelBooking(id) {
    if (!confirm('Cancel this booking?')) return;
    setActionLoading(id + '_cancel');
    try {
      await authFetch(`${API}/business/${businessId}/bookings/${id}/cancel`, { method: 'PUT' });
      addToast('Booking cancelled', 'success');
      await load();
    } catch(e) { addToast('Failed', 'error'); }
    setActionLoading(null);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter(b => b.date === today);
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const noShows = bookings.filter(b => b.status === 'no_show').length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={bookings.length} sub="in current filter" />
        <StatCard label="Today" value={todayBookings.length} sub="bookings" />
        <StatCard label="Confirmed" value={confirmed} sub="upcoming" />
        <StatCard label="No-shows" value={noShows} sub="flagged" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto flex-wrap">
            <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)}
              className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
              <option value="">All staff</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <button onClick={() => { setFilter('all'); setStaffFilter(''); setDateFilter(''); }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Clear filters">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Service</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Staff</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Date & Time</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Channel</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-slate-800">{b.customer_name || 'Unknown'}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />{b.customer_phone || ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{b.service_name}</td>
                    <td className="px-4 py-3">
                      {b.staff_name ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium">{b.staff_name[0]}</div>
                          <span className="text-sm text-slate-700">{b.staff_name}</span>
                        </div>
                      ) : <span className="text-xs text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />{b.date}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />{b.time}
                      </div>
                    </td>
                    <td className="px-4 py-3"><ChannelBadge channel={b.channel} /></td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {b.status === 'confirmed' && <>
                          <button onClick={() => markComplete(b.id)} disabled={actionLoading === b.id + '_complete'}
                            title="Mark complete"
                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => markNoShow(b.id)} disabled={actionLoading === b.id + '_noshow'}
                            title="Mark no-show"
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-50">
                            <AlertCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => cancelBooking(b.id)} disabled={actionLoading === b.id + '_cancel'}
                            title="Cancel booking"
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>}
                      </div>
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
