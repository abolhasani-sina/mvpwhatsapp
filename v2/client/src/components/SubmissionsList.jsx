import { useState, useEffect } from 'react';
import { Inbox, Clock, User, Send, ChevronRight, Circle, Search } from 'lucide-react';
import { fetchSubmissions, updateSubmissionStatus, assignSubmission, fetchStaff } from '../lib/api';

// ── Design tokens ──
const GOLD = '#c8a255';
const GOLD_LIGHT = '#e8d5a3';
const DARK = '#0c0e14';
const DARK_CARD = '#161922';
const DARK_CARD_HOVER = '#1c1f2b';
const DARK_CARD_SELECTED = '#1a1d2a';
const DARK_BORDER = '#252836';
const MUTED = '#6b7280';
const SOFT_WHITE = '#f0f0f2';

const STATUS_CONFIG = {
  new:         { label: 'New',         color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  dot: '#818cf8' },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  dot: '#fbbf24' },
  done:        { label: 'Completed',   color: '#10b981', bg: 'rgba(16,185,129,0.12)',   dot: '#34d399' },
  cancelled:   { label: 'Cancelled',   color: '#6b7280', bg: 'rgba(107,114,128,0.12)',  dot: '#9ca3af' },
};

const SERVICE_KEYS = ['Selected service', 'Service', 'selected service', 'service'];
const NAME_KEYS = ['Your name', 'Name', 'your name', 'name', 'Customer name'];

function extractField(data, keys) {
  if (!data) return null;
  for (const k of keys) {
    if (data[k]) return data[k];
  }
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

  useEffect(() => {
    if (!businessId) return;
    loadData();
  }, [businessId]);

  async function loadData() {
    const [subs, staffList] = await Promise.all([
      fetchSubmissions(businessId),
      fetchStaff(businessId),
    ]);
    setSubmissions(subs || []);
    setStaff(staffList || []);
  }

  async function handleStatusChange(subId, status) {
    await updateSubmissionStatus(subId, status);
    await loadData();
  }

  async function handleAssign(subId, staffId) {
    await assignSubmission(subId, staffId || null);
    await loadData();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#fafafa' }}>
        <div style={{ textAlign: 'center' }}>
          <Inbox style={{ width: 48, height: 48, color: '#d1d5db', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280', fontWeight: 500, fontSize: 15 }}>No bot configured yet</p>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Set up your bot in the Builder first.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* ═══ LEFT: Dark list panel ═══ */}
      <div style={{
        width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: DARK,
        borderRight: `1px solid ${DARK_BORDER}`,
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{
                margin: 0, fontSize: 20, fontWeight: 700, color: '#fff',
                letterSpacing: '-0.02em',
              }}>Leads</h2>
              <span style={{
                background: GOLD, color: DARK, fontSize: 11, fontWeight: 700,
                padding: '2px 10px', borderRadius: 20, letterSpacing: '0.03em',
              }}>{filtered.length}</span>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#4b5563' }} />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 36px',
                background: DARK_CARD, border: `1px solid ${DARK_BORDER}`, borderRadius: 10,
                color: '#e5e7eb', fontSize: 13, outline: 'none',
              }}
            />
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {['all', 'new', 'in_progress', 'done', 'cancelled'].map(f => {
              const active = filter === f;
              const cfg = STATUS_CONFIG[f];
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 20,
                    border: active ? `1px solid ${f === 'all' ? GOLD : cfg?.color}` : `1px solid ${DARK_BORDER}`,
                    background: active ? (f === 'all' ? 'rgba(200,162,85,0.15)' : cfg?.bg) : 'transparent',
                    color: active ? (f === 'all' ? GOLD : cfg?.color) : '#6b7280',
                    cursor: 'pointer', transition: 'all 0.2s',
                    letterSpacing: '0.02em',
                  }}
                >
                  {f === 'all' ? 'All' : cfg?.label} · {counts[f] || 0}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#4b5563', fontSize: 13, padding: '48px 20px' }}>
              {submissions.length === 0
                ? 'No leads yet. Test your bot to create one.'
                : 'No leads match your criteria.'}
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
                style={{
                  padding: '14px 16px', marginBottom: 4, borderRadius: 12, cursor: 'pointer',
                  background: isSelected ? DARK_CARD_SELECTED : 'transparent',
                  border: isSelected ? `1px solid ${GOLD}44` : '1px solid transparent',
                  borderLeft: isSelected ? `3px solid ${GOLD}` : '3px solid transparent',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = DARK_CARD_HOVER; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: 13, color: isSelected ? '#fff' : '#e5e7eb',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {service || `Lead #${sub.id}`}
                    </div>
                    {customer && (
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{customer}</div>
                    )}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: cfg.bg, padding: '3px 10px', borderRadius: 20,
                    marginLeft: 8, flexShrink: 0,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, letterSpacing: '0.03em' }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 11, height: 11 }} />
                    {timeAgo(sub.created_at)}
                  </span>
                  {sub.assigned_name && (
                    <span style={{ fontSize: 11, color: GOLD, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User style={{ width: 11, height: 11 }} />
                      {sub.assigned_name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ RIGHT: Detail panel ═══ */}
      <div style={{ flex: 1, background: '#fafbfc', overflowY: 'auto' }}>
        {selected ? (
          <SubmissionDetail
            submission={selected}
            staff={staff}
            onStatusChange={handleStatusChange}
            onAssign={handleAssign}
          />
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ChevronRight style={{ width: 28, height: 28, color: '#9ca3af' }} />
              </div>
              <p style={{ color: '#9ca3af', fontSize: 14, fontWeight: 500, margin: 0 }}>Select a lead to view details</p>
              <p style={{ color: '#d1d5db', fontSize: 12, marginTop: 4 }}>Click on any item from the list</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail Component ───

function SubmissionDetail({ submission, staff, onStatusChange, onAssign }) {
  const sub = submission;
  const assignedStaff = sub.assigned_to ? staff.find(s => s.id === sub.assigned_to) : null;
  const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.new;
  const service = extractField(sub.data, SERVICE_KEYS);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 40px 48px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <p style={{ fontSize: 12, color: MUTED, fontWeight: 500, margin: '0 0 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Lead #{sub.id}
            </p>
            <h2 style={{
              margin: 0, fontSize: 24, fontWeight: 700, color: '#111827',
              letterSpacing: '-0.02em', lineHeight: 1.2,
            }}>
              {service || `Submission #${sub.id}`}
            </h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock style={{ width: 13, height: 13 }} />
              {new Date(sub.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}
              {new Date(sub.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: cfg.bg, border: `1px solid ${cfg.color}22`,
            padding: '6px 16px', borderRadius: 24,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
          </div>
        </div>
        <div style={{ height: 1, background: `linear-gradient(to right, ${GOLD}, transparent)`, marginTop: 20, opacity: 0.3 }} />
      </div>

      {/* ── Controls ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32,
      }}>
        <div>
          <label style={labelStyle}>Status</label>
          <select
            value={sub.status}
            onChange={e => onStatusChange(sub.id, e.target.value)}
            style={selectStyle}
          >
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Assign to</label>
          <select
            value={sub.assigned_to || ''}
            onChange={e => onAssign(sub.id, e.target.value ? Number(e.target.value) : null)}
            style={selectStyle}
          >
            <option value="">Unassigned</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}{s.role ? ` · ${s.role}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Assigned staff card ── */}
      {assignedStaff && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
          background: '#fff', borderRadius: 14, marginBottom: 32,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${GOLD}, #a07c3a)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '0.03em',
          }}>
            {getInitials(assignedStaff.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>{assignedStaff.name}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
              {assignedStaff.role || 'Team Member'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {assignedStaff.telegram_chat_id && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(59,130,246,0.08)', padding: '5px 12px', borderRadius: 20,
                color: '#3b82f6', fontSize: 11, fontWeight: 600,
              }}>
                <Send style={{ width: 11, height: 11 }} /> Telegram
              </div>
            )}
            {assignedStaff.email && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(107,114,128,0.08)', padding: '5px 12px', borderRadius: 20,
                color: '#6b7280', fontSize: 11, fontWeight: 600,
              }}>
                ✉ Email
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Submitted Data ── */}
      <div>
        <p style={{
          fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '0.1em',
          textTransform: 'uppercase', margin: '0 0 12px',
        }}>Submitted Information</p>

        <div style={{
          background: '#fff', borderRadius: 14, overflow: 'hidden',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {Object.entries(sub.data || {}).filter(([k]) => !k.startsWith('_')).map(([key, value], i, arr) => (
            <div key={key} style={{
              display: 'flex', padding: '14px 20px',
              borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                width: 170, flexShrink: 0, fontSize: 13, fontWeight: 500,
                color: '#9ca3af', letterSpacing: '0.01em',
              }}>{key}</span>
              <span style={{ fontSize: 13, color: '#1f2937', fontWeight: 500 }}>
                {String(value)}
              </span>
            </div>
          ))}
          {Object.keys(sub.data || {}).filter(k => !k.startsWith('_')).length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>
              No data recorded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ──
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600, color: MUTED,
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
};

const selectStyle = {
  width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 500,
  color: '#1f2937', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 10, outline: 'none', cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};
