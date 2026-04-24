import { useState, useEffect, useMemo } from 'react';
import { Inbox, Clock, User, Send, Search, ChevronDown, ChevronUp, Calendar, Filter, RefreshCw } from 'lucide-react';
import { fetchSubmissions, updateSubmissionStatus, assignSubmission, fetchStaff } from '../lib/api';

/* ── Status config ──────────────────────────────────────────── */
const STATUS_CFG = {
  new:         { label: 'New',         bg: 'bg-indigo-50',   text: 'text-indigo-600', border: 'border-indigo-100', dot: 'bg-indigo-500' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50',    text: 'text-amber-600',  border: 'border-amber-100',  dot: 'bg-amber-500' },
  done:        { label: 'Completed',   bg: 'bg-emerald-50',  text: 'text-emerald-600',border: 'border-emerald-100',dot: 'bg-emerald-500' },
  cancelled:   { label: 'Cancelled',   bg: 'bg-slate-100',   text: 'text-slate-500',  border: 'border-slate-200',  dot: 'bg-slate-400' },
};

const DATE_RANGES = [
  { key: 'today',    label: 'Today' },
  { key: 'yesterday',label: 'Yesterday' },
  { key: '7d',       label: 'Last 7 days' },
  { key: '30d',      label: 'Last 30 days' },
  { key: 'all',      label: 'All time' },
];

const SERVICE_KEYS = ['Selected service', 'Service', 'selected service', 'service'];
const NAME_KEYS   = ['step_name', 'Your name', 'Name', 'your name', 'name', 'Customer name', 'Guest name', 'Patient name', 'Student name', 'Pet parent name'];
const PHONE_KEYS  = ['Phone', 'phone', 'Phone number', 'phone number', 'Mobile', 'mobile'];

function extractField(data, keys) {
  if (!data) return null;
  for (const k of keys) { if (data[k]) return data[k]; }
  return null;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function filterByDateRange(submissions, range) {
  if (range === 'all') return submissions;
  const now = new Date();
  const todayStart = startOfDay(now);
  let from;

  if (range === 'today') {
    from = todayStart;
  } else if (range === 'yesterday') {
    from = new Date(todayStart);
    from.setDate(from.getDate() - 1);
    const to = todayStart;
    return submissions.filter(s => {
      const d = new Date(s.created_at);
      return d >= from && d < to;
    });
  } else if (range === '7d') {
    from = new Date(todayStart);
    from.setDate(from.getDate() - 7);
  } else if (range === '30d') {
    from = new Date(todayStart);
    from.setDate(from.getDate() - 30);
  }

  return submissions.filter(s => new Date(s.created_at) >= from);
}

/* ── Main component ─────────────────────────────────────────── */
export default function SubmissionsList({ businessId }) {
  const [submissions, setSubmissions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!businessId) return;
    loadData();
  }, [businessId]);

  async function loadData() {
    try {
      setError(null);
      const [subs, staffList] = await Promise.all([
        fetchSubmissions(businessId),
        fetchStaff(businessId),
      ]);
      setSubmissions(subs || []);
      setStaff(staffList || []);
    } catch {
      setError('Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(subId, status) {
    try {
      await updateSubmissionStatus(subId, status);
      await loadData();
    } catch { setError('Failed to update status.'); }
  }

  async function handleAssign(subId, staffId) {
    try {
      await assignSubmission(subId, staffId || null);
      await loadData();
    } catch { setError('Failed to assign staff.'); }
  }

  /* ── Filtering pipeline ──────────────────────────────────── */
  const filtered = useMemo(() => {
    let result = filterByDateRange(submissions, dateRange);
    if (statusFilter !== 'all') result = result.filter(s => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(sub => {
        const service  = extractField(sub.data, SERVICE_KEYS) || '';
        const customer = extractField(sub.data, NAME_KEYS) || '';
        return service.toLowerCase().includes(q) || customer.toLowerCase().includes(q) || String(sub.id).includes(q);
      });
    }
    return result;
  }, [submissions, dateRange, statusFilter, search]);

  /* ── Stats for current date range ────────────────────────── */
  const rangeData = useMemo(() => filterByDateRange(submissions, dateRange), [submissions, dateRange]);
  const stats = useMemo(() => ({
    total:       rangeData.length,
    new:         rangeData.filter(s => s.status === 'new').length,
    in_progress: rangeData.filter(s => s.status === 'in_progress').length,
    done:        rangeData.filter(s => s.status === 'done').length,
  }), [rangeData]);

  /* ── Empty states ────────────────────────────────────────── */
  if (!businessId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)] bg-slate-50">
        <div className="text-center">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium text-sm">No bot configured yet</p>
          <p className="text-slate-400 text-xs mt-1">Set up your bot in the Builder first.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)] bg-slate-50">
        <div className="text-slate-500 text-sm">Loading submissions…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)] bg-slate-50">
        <div className="text-center">
          <p className="text-red-500 font-medium text-sm mb-2">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); loadData(); }}
            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-5 py-2 text-sm font-medium transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Header bar ────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Bookings & Requests</h1>
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Date range picker */}
            <div className="relative">
              <select value={dateRange} onChange={e => setDateRange(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer transition-all">
                {DATE_RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            {/* Refresh */}
            <button onClick={() => { setLoading(true); loadData(); }}
              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats + filters row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Quick stats */}
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> {stats.new} New
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> {stats.in_progress} Being Handled
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {stats.done} Done
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2"> {/* [ADDED: mobile-responsive] */}
            {/* Status filter chips */}
            <div className="flex flex-wrap gap-1"> {/* [ADDED: mobile-responsive] */}
              {['all', 'new', 'in_progress', 'done', 'cancelled'].map(f => {
                const active = statusFilter === f;
                const cfg = STATUS_CFG[f];
                return (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                      active
                        ? f === 'all' ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : `${cfg.bg} ${cfg.text} ${cfg.border}`
                        : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                    }`}>
                    {f === 'all' ? 'All' : cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}{/* [ADDED: mobile-responsive] */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-44 pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bd-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center mb-4">
              <Inbox className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              {submissions.length === 0 ? 'No submissions yet' : 'No results found'}
            </p>
            <p className="text-xs text-slate-400">
              {submissions.length === 0
                ? 'Test your bot to create the first submission.'
                : dateRange !== 'all'
                  ? 'Try a wider date range or different filters.'
                  : 'Adjust your search or filters.'}
            </p>
            {submissions.length > 0 && dateRange !== 'all' && (
              <button onClick={() => setDateRange('all')}
                className="mt-3 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors">
                Show all time →
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-6 py-3 w-10">#</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Customer</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Service</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden">Assigned</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Date</th> {/* [ADDED: mobile-responsive] */}
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => (
                <SubmissionRow
                  key={sub.id}
                  sub={sub}
                  staff={staff}
                  expanded={expandedId === sub.id}
                  onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                  onStatusChange={handleStatusChange}
                  onAssign={handleAssign}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Single table row + expandable detail ───────────────────── */
function SubmissionRow({ sub, staff, expanded, onToggle, onStatusChange, onAssign }) {
  const service  = extractField(sub.data, SERVICE_KEYS) || sub.action_button_label || sub.flow_name || '—'; // [ADDED: submission-display-fallback]
  const customer = extractField(sub.data, NAME_KEYS) || sub.customer_name || (sub.customer_channel ? `${sub.customer_channel} user` : 'Bot Tester'); // [ADDED: customer-from-conversations]
  const phone    = extractField(sub.data, PHONE_KEYS);
  const cfg      = STATUS_CFG[sub.status] || STATUS_CFG.new;
  const assignedStaff = sub.assigned_to ? staff.find(s => s.id === sub.assigned_to) : null;

  return (
    <>
      <tr onClick={onToggle}
        className={`border-b border-slate-100 cursor-pointer transition-colors group ${
          expanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
        }`}>
        {/* ID */}
        <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">#{sub.business_submission_number || sub.id}</td>

        {/* Customer */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {getInitials(customer)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate" style={{display:'flex',alignItems:'center',gap:'4px'}}>
                {sub.customer_channel === 'telegram' && <span style={{fontSize:'10px',background:'#229ED9',color:'white',borderRadius:'3px',padding:'1px 4px',fontWeight:600}}>TG</span>}
                {sub.customer_channel === 'whatsapp' && <span style={{fontSize:'10px',background:'#25D366',color:'white',borderRadius:'3px',padding:'1px 4px',fontWeight:600}}>WA</span>}
                {sub.customer_channel === 'instagram' && <span style={{fontSize:'10px',background:'#E1306C',color:'white',borderRadius:'3px',padding:'1px 4px',fontWeight:600}}>IG</span>}
                {customer || ''}
              </div>
              {phone && <div className="text-[11px] text-slate-400">{phone}</div>}
            </div>
          </div>
        </td>

        {/* Service */}
        <td className="px-4 py-3.5 hidden md:table-cell">
          <span className="text-sm text-slate-600 truncate block max-w-[200px]">{service || '—'}</span>
        </td>

        {/* Status badge */}
        <td className="px-4 py-3.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </td>

        {/* Assigned */}
        <td className="px-4 py-3.5 hidden">
          {sub.assigned_name ? (
            <span className="text-sm text-slate-600 flex items-center gap-1.5">
              <User className="w-3 h-3 text-slate-400" /> {sub.assigned_name}
            </span>
          ) : (
            <span className="text-xs text-slate-300">Unassigned</span>
          )}
        </td>

        {/* Date */}
        <td className="px-4 py-3.5 hidden sm:table-cell"> {/* [ADDED: mobile-responsive] */}
          <div className="text-xs text-slate-500">{new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          <div className="text-[10px] text-slate-400">{new Date(sub.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        </td>

        {/* Expand icon */}
        <td className="px-4 py-3.5 text-right">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-indigo-500 inline-block" />
            : <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-500 inline-block transition-colors" />}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-slate-50 border-b border-slate-200 px-6 py-5">
            <div className="max-w-3xl">
              {/* Controls row */}
              <div className="flex flex-wrap gap-4 mb-5">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={sub.status} onChange={e => onStatusChange(sub.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer transition-all">
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assign to staff member</label>
                  <select value={sub.assigned_to || ''} onChange={e => onAssign(sub.id, e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer transition-all">
                    <option value="">Unassigned</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}{s.role ? ` · ${s.role}` : ''}</option>)}
                  </select>
                </div>
              </div>

              {/* Assigned staff card */}
              {assignedStaff && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 mb-5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(assignedStaff.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-800 truncate">{assignedStaff.name}</div>
                    <div className="text-xs text-slate-400">{assignedStaff.role || 'Team Member'}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {assignedStaff.telegram_chat_id && (
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-500 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                        <Send className="w-2.5 h-2.5" /> Telegram
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Submitted data */}
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Customer's Answers</p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {Object.entries(sub.data || {}).filter(([k]) => !k.startsWith('_')).map(([key, value], i, arr) => (
                  <div key={key} className={`flex px-4 py-3 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <span className="w-[140px] shrink-0 text-xs text-slate-400 font-medium">{key}</span>
                    <span className="text-sm text-slate-800 font-medium">{String(value)}</span>
                  </div>
                ))}
                {Object.keys(sub.data || {}).filter(k => !k.startsWith('_')).length === 0 && (
                  <div className="p-4 text-center text-slate-300 text-sm">No data recorded</div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
