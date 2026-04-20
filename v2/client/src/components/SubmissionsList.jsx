import { useState, useEffect } from 'react';
import { Inbox, Clock, User, Send, ChevronRight, Search } from 'lucide-react';
import { fetchSubmissions, updateSubmissionStatus, assignSubmission, fetchStaff } from '../lib/api';

const STATUS_CONFIG = {
  new:         { label: 'New',         tw: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-400' },
  in_progress: { label: 'In Progress', tw: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   dot: 'bg-amber-400' },
  done:        { label: 'Completed',   tw: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  cancelled:   { label: 'Cancelled',   tw: 'bg-slate-500/10 text-slate-400 border-slate-500/20',   dot: 'bg-slate-400' },
};

const STATUS_BADGE_LIGHT = {
  new:         'bg-indigo-50 text-indigo-600 border border-indigo-100',
  in_progress: 'bg-amber-50 text-amber-600 border border-amber-100',
  done:        'bg-emerald-50 text-emerald-600 border border-emerald-100',
  cancelled:   'bg-slate-100 text-slate-500 border border-slate-200',
};

const SERVICE_KEYS = ['Selected service', 'Service', 'selected service', 'service'];
const NAME_KEYS = ['Your name', 'Name', 'your name', 'name', 'Customer name'];

function extractField(data, keys) {
  if (!data) return null;
  for (const k of keys) { if (data[k]) return data[k]; }
  return null;
}

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function SubmissionsList({ businessId }) {
  const [submissions, setSubmissions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
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
      setError('Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(subId, status) {
    try {
      await updateSubmissionStatus(subId, status);
      await loadData();
    } catch {
      setError('Failed to update status.');
    }
  }

  async function handleAssign(subId, staffId) {
    try {
      await assignSubmission(subId, staffId || null);
      await loadData();
    } catch {
      setError('Failed to assign staff.');
    }
  }

  const counts = { all: submissions.length };
  for (const s of submissions) { counts[s.status] = (counts[s.status] || 0) + 1; }

  const filtered = (filter === 'all' ? submissions : submissions.filter(s => s.status === filter))
    .filter(sub => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const service = extractField(sub.data, SERVICE_KEYS) || '';
      const customer = extractField(sub.data, NAME_KEYS) || '';
      return service.toLowerCase().includes(q) || customer.toLowerCase().includes(q) || String(sub.id).includes(q);
    });

  const selected = selectedId ? submissions.find(s => s.id === selectedId) : null;

  if (!businessId) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
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
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="text-slate-500 text-sm">Loading submissions…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="text-center">
          <p className="text-red-500 font-medium text-sm mb-2">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); loadData(); }} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-5 py-2 text-sm font-medium transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* Left: Dark list panel */}
      <div className="w-[380px] shrink-0 flex flex-col bg-slate-900 border-r border-white/10">
        {/* Header */}
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white tracking-tight">Leads</h2>
              <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">{filtered.length}</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-slate-200 text-sm placeholder:text-slate-500 outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {['all', 'new', 'in_progress', 'done', 'cancelled'].map(f => {
              const active = filter === f;
              const cfg = STATUS_CONFIG[f];
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-all ${
                    active
                      ? f === 'all' ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400' : cfg?.tw
                      : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
                  }`}
                >
                  {f === 'all' ? 'All' : cfg?.label} · {counts[f] || 0}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2.5 pb-3 bd-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-12 px-5">
              {submissions.length === 0 ? 'No leads yet. Test your bot to create one.' : 'No leads match your criteria.'}
            </div>
          ) : filtered.map(sub => {
            const service = extractField(sub.data, SERVICE_KEYS);
            const customer = extractField(sub.data, NAME_KEYS);
            const isSelected = selectedId === sub.id;
            const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.new;
            return (
              <div
                key={sub.id}
                onClick={() => setSelectedId(sub.id)}
                className={`px-4 py-3.5 mb-1 rounded-xl cursor-pointer transition-all border-l-[3px] ${
                  isSelected
                    ? 'bg-slate-800/80 border-l-indigo-500 border border-indigo-500/20'
                    : 'border-l-transparent border border-transparent hover:bg-slate-800/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-[13px] truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {service || `Lead #${sub.id}`}
                    </div>
                    {customer && <div className="text-xs text-slate-400 mt-0.5">{customer}</div>}
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ml-2 shrink-0 ${cfg.tw}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(sub.created_at)}
                  </span>
                  {sub.assigned_name && (
                    <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
                      <User className="w-3 h-3" /> {sub.assigned_name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Detail panel */}
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        {selected ? (
          <SubmissionDetail submission={selected} staff={staff} onStatusChange={handleStatusChange} onAssign={handleAssign} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-5">
                <ChevronRight className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-400">Select a lead to view details</p>
              <p className="text-xs text-slate-300 mt-1">Click on any item from the list</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionDetail({ submission, staff, onStatusChange, onAssign }) {
  const sub = submission;
  const assignedStaff = sub.assigned_to ? staff.find(s => s.id === sub.assigned_to) : null;
  const cfg = STATUS_BADGE_LIGHT[sub.status] || STATUS_BADGE_LIGHT.new;
  const service = extractField(sub.data, SERVICE_KEYS);

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Lead #{sub.id}</p>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{service || `Submission #${sub.id}`}</h2>
            <p className="text-sm text-slate-400 mt-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(sub.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}
              {new Date(sub.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold ${cfg}`}>
            <div className="w-2 h-2 rounded-full bg-current" />
            {(STATUS_CONFIG[sub.status] || STATUS_CONFIG.new).label}
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-indigo-500/40 to-transparent mt-5" />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
          <select
            value={sub.status}
            onChange={e => onStatusChange(sub.id, e.target.value)}
            className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer transition-all"
          >
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assign to</label>
          <select
            value={sub.assigned_to || ''}
            onChange={e => onAssign(sub.id, e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer transition-all"
          >
            <option value="">Unassigned</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.role ? ` · ${s.role}` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assigned staff */}
      {assignedStaff && (
        <div className="flex items-center gap-3.5 p-4 bg-white rounded-xl border border-slate-200 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {getInitials(assignedStaff.name)}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-slate-800">{assignedStaff.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">{assignedStaff.role || 'Team Member'}</div>
          </div>
          <div className="flex gap-2">
            {assignedStaff.telegram_chat_id && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-500 text-[11px] font-semibold px-3 py-1 rounded-full">
                <Send className="w-3 h-3" /> Telegram
              </span>
            )}
            {assignedStaff.email && (
              <span className="flex items-center gap-1 bg-slate-100 text-slate-500 text-[11px] font-semibold px-3 py-1 rounded-full">
                ✉ Email
              </span>
            )}
          </div>
        </div>
      )}

      {/* Submitted data */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Submitted Information</p>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {Object.entries(sub.data || {}).filter(([k]) => !k.startsWith('_')).map(([key, value], i, arr) => (
            <div key={key} className={`flex px-5 py-3.5 hover:bg-slate-50 transition-colors ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <span className="w-[170px] shrink-0 text-sm text-slate-400 font-medium">{key}</span>
              <span className="text-sm text-slate-800 font-medium">{String(value)}</span>
            </div>
          ))}
          {Object.keys(sub.data || {}).filter(k => !k.startsWith('_')).length === 0 && (
            <div className="p-5 text-center text-slate-300 text-sm">No data recorded</div>
          )}
        </div>
      </div>
    </div>
  );
}
