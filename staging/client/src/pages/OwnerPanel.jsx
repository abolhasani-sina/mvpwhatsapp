import { useState, useEffect, useCallback } from 'react';
import {
  Users, Package, Inbox, BarChart3, AlertTriangle, LogOut,
  CheckCircle2, XCircle, Pause, Play,
} from 'lucide-react';
import {
  fetchOwnerTenants, suspendTenant, reactivateTenant, setTenantPlan,
  fetchOwnerPlans, createOwnerPlan, updateOwnerPlan, deleteOwnerPlan,
  fetchOwnerChannelRequests, approveChannelRequest, rejectChannelRequest,
  fetchOwnerStats, fetchErrorLogs,
} from '../lib/api';
import { useToast } from '../components/Toast';

const TABS = [
  { key: 'tenants', label: 'Tenants', icon: Users },
  { key: 'plans', label: 'Plans', icon: Package },
  { key: 'channel-requests', label: 'Channel Requests', icon: Inbox },
  { key: 'stats', label: 'Stats', icon: BarChart3 },
  { key: 'logs', label: 'System Logs', icon: AlertTriangle },
];

export default function OwnerPanel({ onLogout }) {
  const [tab, setTab] = useState('tenants');
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <span className="font-semibold tracking-tight">Platform Owner</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <nav className="bg-white border-b border-slate-200 px-6 flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                active
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 overflow-auto">
        {tab === 'tenants' && <TenantsTab />}
        {tab === 'plans' && <PlansTab />}
        {tab === 'channel-requests' && <ChannelRequestsTab />}
        {tab === 'stats' && <StatsTab />}
        {tab === 'logs' && <LogsTab />}
      </main>
    </div>
  );
}

// ──────────────────────────────────────────────
// TENANTS TAB
// ──────────────────────────────────────────────
function TenantsTab() {
  const { addToast } = useToast();
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([fetchOwnerTenants(), fetchOwnerPlans()]);
      setTenants(t);
      setPlans(p);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  async function handleSuspend(id, suspended) {
    setBusyId(id);
    try {
      if (suspended) await reactivateTenant(id);
      else await suspendTenant(id);
      addToast(suspended ? 'Tenant reactivated' : 'Tenant suspended', 'success');
      await load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handlePlanChange(tenantId, planId) {
    setBusyId(tenantId);
    try {
      await setTenantPlan(tenantId, planId);
      addToast('Plan updated', 'success');
      await load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">Loading tenants…</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Tenants ({tenants.length})</h2>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Business</th>
              <th className="text-left px-4 py-3">Owner</th>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Submissions</th>
              <th className="text-left px-4 py-3">Staff</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                <td className="px-4 py-3 text-slate-600">{t.owner_email || '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={t.plan_id || ''}
                    disabled={busyId === t.id}
                    onChange={(e) => handlePlanChange(t.id, Number(e.target.value))}
                    className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {t.suspended ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                      Suspended
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{t.submission_count}</td>
                <td className="px-4 py-3 text-slate-600">{t.staff_count}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    disabled={busyId === t.id}
                    onClick={() => handleSuspend(t.id, t.suspended)}
                    className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium ${
                      t.suspended
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    } disabled:opacity-50`}
                  >
                    {t.suspended ? <><Play className="w-3 h-3" /> Reactivate</> : <><Pause className="w-3 h-3" /> Suspend</>}
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-400">No tenants yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// PLANS TAB
// ──────────────────────────────────────────────
function PlansTab() {
  const { addToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await fetchOwnerPlans());
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setEditing({
      id: null, name: '', monthly_price: 0, max_flows: 1, max_staff: 1,
      max_submissions_per_month: 100,
      allow_whatsapp: 0, allow_telegram: 1, allow_instagram: 0, is_default: 0, contact_sales: 0,
    });
  }

  async function handleSave() {
    try {
      if (editing.id) await updateOwnerPlan(editing.id, editing);
      else await createOwnerPlan(editing);
      setEditing(null);
      await load();
      addToast('Plan saved successfully ', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save plan', 'error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this plan?')) return;
    try {
      await deleteOwnerPlan(id);
      addToast('Plan deleted', 'success');
      await load();
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">Loading plans…</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Plans ({plans.length})</h2>
        <button
          onClick={startNew}
          className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          + New Plan
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-slate-900">{p.name}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">${p.monthly_price}<span className="text-xs text-slate-400 font-normal">/mo</span></div>
              </div>
              {p.is_default ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">Default</span>
              ) : null}
            </div>
            <ul className="text-xs text-slate-500 space-y-1 mt-3">
              <li>Flows: {p.max_flows}</li>
              <li>Staff: {p.max_staff}</li>
              <li>Submissions/mo: {p.max_submissions_per_month}</li>
              <li>Channels: {[
                p.allow_telegram ? 'Telegram' : null,
                p.allow_whatsapp ? 'WhatsApp' : null,
                p.allow_instagram ? 'Instagram' : null,
              ].filter(Boolean).join(', ') || '—'}</li>
            </ul>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditing(p)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >Edit</button>
              {!p.is_default && (
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                >Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editing.id ? 'Edit Plan' : 'New Plan'}</h3>
            <div className="space-y-3">
              <Field label="Name">
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm" />
              </Field>
              <Field label="Monthly Price ($)">
                <input type="number" value={editing.monthly_price}
                  onChange={(e) => setEditing({ ...editing, monthly_price: Number(e.target.value) })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm" />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Max flows">
                  <input type="number" value={editing.max_flows}
                    onChange={(e) => setEditing({ ...editing, max_flows: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm" />
                </Field>
                <Field label="Max staff">
                  <input type="number" value={editing.max_staff}
                    onChange={(e) => setEditing({ ...editing, max_staff: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm" />
                </Field>
                <Field label="Subs / mo">
                  <input type="number" value={editing.max_submissions_per_month}
                    onChange={(e) => setEditing({ ...editing, max_submissions_per_month: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm" />
                </Field>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <Toggle label="Telegram" value={editing.allow_telegram}
                  onChange={(v) => setEditing({ ...editing, allow_telegram: v })} />
                <Toggle label="WhatsApp" value={editing.allow_whatsapp}
                  onChange={(v) => setEditing({ ...editing, allow_whatsapp: v })} />
                <Toggle label="Instagram" value={editing.allow_instagram}
                  onChange={(v) => setEditing({ ...editing, allow_instagram: v })} />
                <Toggle label="Default plan" value={editing.is_default}
                  onChange={(v) => setEditing({ ...editing, is_default: v })} />
                <Toggle label="Contact us (no self-serve)" value={editing.contact_sales}
                  onChange={(v) => setEditing({ ...editing, contact_sales: v })} /> {/* [ADDED: contact-sales-toggle] */}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 text-slate-700">Cancel</button>
              <button onClick={handleSave} className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      {children}
    </label>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked ? 1 : 0)} />
      <span>{label}</span>
    </label>
  );
}

// ──────────────────────────────────────────────
// CHANNEL REQUESTS TAB
// ──────────────────────────────────────────────
function ChannelRequestsTab() {
  const { addToast } = useToast();
  const [filter, setFilter] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [noteFor, setNoteFor] = useState(null); // { id, action }
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchOwnerChannelRequests(filter));
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, filter]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(id, action, n) {
    setBusyId(id);
    try {
      if (action === 'approve') await approveChannelRequest(id, n);
      else await rejectChannelRequest(id, n);
      addToast(action === 'approve' ? 'Approved' : 'Rejected', 'success');
      await load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setBusyId(null);
      setNoteFor(null);
      setNote('');
    }
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Channel Change Requests</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-semibold text-slate-900">
                  {r.business_name} <span className="text-xs text-slate-400">#{r.id}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{r.requested_by_email} • {new Date(r.created_at).toLocaleString()}</div>
                <div className="mt-3 flex gap-6 text-sm">
                  <div>
                    <div className="text-xs text-slate-400 uppercase">Channel</div>
                    <div className="font-mono">{r.channel}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase">New value</div>
                    <div className="font-mono text-slate-700">{r.requested_value_masked}</div>
                  </div>
                </div>
                {r.reason && (
                  <div className="mt-3 text-sm text-slate-600">
                    <span className="text-xs text-slate-400 uppercase block">Reason</span>
                    {r.reason}
                  </div>
                )}
                {r.decision_note && (
                  <div className="mt-3 text-xs text-slate-500 italic">
                    Decision note: {r.decision_note}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                  r.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>{r.status}</span>
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      disabled={busyId === r.id}
                      onClick={() => setNoteFor({ id: r.id, action: 'approve' })}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                    ><CheckCircle2 className="w-3 h-3" /> Approve</button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => setNoteFor({ id: r.id, action: 'reject' })}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                    ><XCircle className="w-3 h-3" /> Reject</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center text-slate-400 py-12 text-sm">No requests.</div>}
      </div>

      {noteFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setNoteFor(null)}>
          <div className="bg-white rounded-xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">{noteFor.action === 'approve' ? 'Approve request' : 'Reject request'}</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for the tenant…"
              rows={3}
              className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setNoteFor(null); setNote(''); }} className="px-3 py-1.5 text-sm rounded-lg bg-slate-100">Cancel</button>
              <button
                onClick={() => handleAction(noteFor.id, noteFor.action, note)}
                className={`px-3 py-1.5 text-sm rounded-lg text-white ${noteFor.action === 'approve' ? 'bg-green-600' : 'bg-red-600'}`}
              >{noteFor.action === 'approve' ? 'Approve' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// STATS TAB
// ──────────────────────────────────────────────
function StatsTab() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerStats()
      .then(setStats)
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  if (loading) return <div className="p-8 text-slate-400 text-sm">Loading stats…</div>;
  if (!stats) return <div className="p-8 text-slate-400 text-sm">No stats available.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Platform Stats</h2>

      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <StatCard label="MRR" value={`$${stats.mrr_usd || 0}`} />
        <StatCard label="Tenants (active)" value={stats.tenants_active || 0} />
        <StatCard label="Tenants (suspended)" value={stats.tenants_suspended || 0} />
        <StatCard label="Pending Channel Requests" value={stats.pending_channel_requests || 0} />
        <StatCard label="Submissions (30d)" value={stats.submissions_30d || 0} />
      </div>

      <h3 className="font-semibold text-slate-700 mb-2">Plan Breakdown</h3>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr><th className="text-left px-4 py-2">Plan</th><th className="text-left px-4 py-2">Price</th><th className="text-left px-4 py-2">Tenants</th></tr>
          </thead>
          <tbody>
            {(stats.plan_breakdown || []).map((p) => (
              <tr key={p.name} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2 text-slate-600">${p.monthly_price}/mo</td>
                <td className="px-4 py-2 text-slate-600">{p.tenants}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

// ──────────────────────────────────────────────
// LOGS TAB
// ──────────────────────────────────────────────
function LogsTab() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchErrorLogs(50)
      .then(setLogs)
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">System Error Logs</h2>
        <button onClick={load} className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">Refresh</button>
      </div>
      {loading ? (
        <div className="p-8 text-slate-400 text-sm">Loading…</div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">No recent errors. 🎉</div>
      ) : (
        <div className="space-y-2">
          {logs.map((l, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900">{l.message || l.msg || 'Error'}</div>
                  <div className="text-xs text-slate-500 mt-1">{l.time || l.timestamp}</div>
                </div>
                {l.module && <span className="text-xs text-slate-400">{l.module}</span>}
              </div>
              {l.stack && <pre className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded overflow-auto max-h-40">{l.stack}</pre>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
