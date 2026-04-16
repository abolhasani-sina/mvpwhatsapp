import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentRulesApi, assigneesApi, servicesApi, flowsApi, menuApi } from '../services/api';
import { Modal, ModalActions, Spinner, ErrorMsg, inputClass, selectClass } from '../components/UI';

const TRIGGER_TYPES = ['service', 'menu_node', 'flow'];
const TRIGGER_LABELS = {
  service: '🛍️ When customer picks a Service',
  menu_node: '📱 When customer taps a Menu Button',
  flow: '📝 When customer fills a Form',
};

export default function AssignmentRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ trigger_type: 'service', trigger_id: '', assignee_id: '', priority: 1, is_active: true });

  // Lookup data
  const [assignees, setAssignees] = useState([]);
  const [services, setServices] = useState([]);
  const [flows, setFlows] = useState([]);
  const [menuNodes, setMenuNodes] = useState([]);

  const navigate = useNavigate();

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try { const res = await assignmentRulesApi.list(); setRules(res.data.data); }
    catch { setError('Failed to load rules'); }
    finally { setLoading(false); }
  }, []);

  const loadLookups = useCallback(async () => {
    try {
      const [a, s, f, m] = await Promise.all([
        assigneesApi.list(), servicesApi.list(), flowsApi.list(), menuApi.getTree(),
      ]);
      setAssignees(a.data.data);
      setServices(s.data.data);
      setFlows(f.data.data);
      setMenuNodes(flattenTree(m.data.data));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchRules(); loadLookups(); }, [fetchRules, loadLookups]);

  const openCreate = () => {
    setEditing(null);
    setForm({ trigger_type: 'service', trigger_id: '', assignee_id: '', priority: 1, is_active: true });
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      trigger_type: r.trigger_type || 'service',
      trigger_id: r.trigger_id || '',
      assignee_id: r.assignee_id || '',
      priority: r.priority || 1,
      is_active: r.is_active,
    });
    setModalOpen(true);
  };

  // Helper to resolve names from IDs
  const resolveTriggerName = (rule) => {
    if (!rule.trigger_type) return 'Any request (catch-all)';
    switch (rule.trigger_type) {
      case 'service': return services.find((s) => s.id === rule.trigger_id)?.name || 'Unknown service';
      case 'flow': return flows.find((f) => f.id === rule.trigger_id)?.name || 'Unknown form';
      case 'menu_node': return menuNodes.find((n) => n.id === rule.trigger_id)?.title || 'Unknown button';
      default: return rule.trigger_id || 'Unknown';
    }
  };

  const resolveAssigneeName = (rule) => {
    return assignees.find((a) => a.id === rule.assignee_id)?.name || 'Unknown member';
  };

  const triggerIcon = (type) => {
    switch (type) {
      case 'service': return '🛍️';
      case 'flow': return '📝';
      case 'menu_node': return '📱';
      default: return '🔄';
    }
  };

  const triggerVerb = (type) => {
    switch (type) {
      case 'service': return 'customer picks service';
      case 'flow': return 'customer fills form';
      case 'menu_node': return 'customer taps button';
      default: return 'any request comes in';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await assignmentRulesApi.update(editing.id, form);
      else await assignmentRulesApi.create(form);
      setModalOpen(false);
      fetchRules();
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to save rule'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try { await assignmentRulesApi.delete(id); fetchRules(); }
    catch { setError('Failed to delete rule'); }
  };

  const triggerOptions = () => {
    switch (form.trigger_type) {
      case 'service': return services.map((s) => ({ id: s.id, label: s.name }));
      case 'flow': return flows.map((f) => ({ id: f.id, label: f.name }));
      case 'menu_node': return menuNodes.map((n) => ({ id: n.id, label: n.title }));
      default: return [];
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Auto Assignment</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-all shadow-sm cursor-pointer">+ Add Rule</button>
      </div>
      <p className="text-sm text-gray-500 mb-4">Automatically route customer requests to the right team member. Rules are checked by priority (lowest number = checked first).</p>

      {/* Connection banner */}
      <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50/80 to-emerald-50/80 rounded-2xl border border-emerald-100">
        <p className="text-sm font-semibold text-gray-800 mb-2">🔗 How auto-assignment works</p>
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2 flex-wrap">
          <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium">📝 Customer completes form</span>
          <span className="text-gray-400">→</span>
          <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium">📥 Request created</span>
          <span className="text-gray-400">→</span>
          <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium">🎯 Rules checked</span>
          <span className="text-gray-400">→</span>
          <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium">👤 Assigned to team member</span>
        </div>
        <p className="text-xs text-gray-500">If no rule matches, the request stays unassigned and appears in your <button onClick={() => navigate('/dashboard/requests')} className="text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer">Customer Requests</button> for manual handling.</p>
      </div>

      <ErrorMsg msg={error} onDismiss={() => setError(null)} />

      {assignees.length === 0 && !loading && (
        <div className="mb-4 p-4 bg-amber-50 text-amber-800 text-sm rounded-xl border border-amber-200 flex items-center gap-2">
          <span>⚠️</span>
          <span>You need to <button onClick={() => navigate('/dashboard/assignees')} className="text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer underline">add team members</button> before creating assignment rules.</span>
        </div>
      )}

      {loading ? <Spinner /> : rules.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mx-auto mb-4">🎯</div>
          <p className="font-semibold text-gray-900 mb-1">No assignment rules yet</p>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Create rules so customer requests are automatically assigned to the right team member.</p>
          <button onClick={openCreate} className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-all shadow-sm cursor-pointer">+ Add First Rule</button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.sort((a, b) => (a.priority || 0) - (b.priority || 0)).map((r) => (
            <div key={r.id} className={`bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 card-hover transition-all ${!r.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Priority {r.priority}</span>
                    {r.is_active ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 mt-2">
                    <span className="text-gray-500">When</span>{' '}
                    <span className="font-medium">{triggerIcon(r.trigger_type)} {triggerVerb(r.trigger_type)}</span>{' '}
                    <span className="bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-800">&ldquo;{resolveTriggerName(r)}&rdquo;</span>
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    <span className="text-gray-500">Assign to</span>{' '}
                    <span className="font-semibold text-emerald-600">👤 {resolveAssigneeName(r)}</span>
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => openEdit(r)} className="text-xs text-emerald-600 hover:text-emerald-800 cursor-pointer px-2 py-1 rounded hover:bg-emerald-50 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(r.id)} className="text-xs text-red-600 hover:text-red-800 cursor-pointer px-2 py-1 rounded hover:bg-red-50 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link to related pages */}
      {rules.length > 0 && (
        <div className="mt-6 flex gap-4 text-xs">
          <button onClick={() => navigate('/dashboard/flows')} className="text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer">📝 Manage Forms →</button>
          <button onClick={() => navigate('/dashboard/assignees')} className="text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer">👥 Manage Team Members →</button>
          <button onClick={() => navigate('/dashboard/services')} className="text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer">🛍️ Manage Services →</button>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Edit Assignment Rule' : 'New Assignment Rule'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">When should this rule trigger? *</label>
              <select value={form.trigger_type} onChange={(e) => setForm({ ...form, trigger_type: e.target.value, trigger_id: '' })} className={selectClass}>
                {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Which {form.trigger_type === 'service' ? 'service' : form.trigger_type === 'flow' ? 'form' : 'menu button'}? *</label>
              <select required value={form.trigger_id} onChange={(e) => setForm({ ...form, trigger_id: e.target.value })} className={selectClass}>
                <option value="">Select...</option>
                {triggerOptions().map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Assign to which team member? *</label>
              <select required value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })} className={selectClass}>
                <option value="">Select team member...</option>
                {assignees.filter((a) => a.is_active).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority (lower = checked first) *</label>
              <input type="number" min={0} required value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className={inputClass} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" /> Active
            </label>
            <ModalActions onCancel={() => setModalOpen(false)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function flattenTree(nodes, result = []) {
  for (const node of nodes) {
    result.push(node);
    if (node.children) flattenTree(node.children, result);
  }
  return result;
}
