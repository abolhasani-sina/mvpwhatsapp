import { useState, useEffect, useCallback } from 'react';
import { menuApi, flowsApi } from '../services/api';
import { Modal, ModalActions, Spinner, ErrorMsg, inputClass, selectClass } from '../components/UI';
import WhatsAppPreview from '../components/WhatsAppPreview';

const NODE_TYPE_LABELS = {
  menu: '📂 Sub-menu (shows more buttons)',
  info: 'ℹ️ Info (display a message)',
  flow_entry: '📝 Start Form (collect info)',
  action: '⚡ Action (call, location, link)',
};

export default function MenuBuilder() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ label: '', node_type: 'menu', parent_id: null, flow_id: '', action_type: '', action_config: {} });
  const [editingId, setEditingId] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [flows, setFlows] = useState([]);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await menuApi.getTree();
      setTree(res.data.data);
    } catch { setError('Failed to load menu'); }
    finally { setLoading(false); }
  }, []);

  const fetchFlows = useCallback(async () => {
    try { const res = await flowsApi.list(); setFlows(res.data.data); }
    catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchTree(); fetchFlows(); }, [fetchTree, fetchFlows]);

  const openCreate = (parentId = null) => {
    setEditingId(null);
    setForm({ label: '', node_type: 'menu', parent_id: parentId, flow_id: '', action_type: '', action_config: {} });
    setModalOpen(true);
  };

  const openEdit = async (nodeId) => {
    try {
      const res = await menuApi.getNode(nodeId);
      const n = res.data.data;
      setEditingId(n.id);
      setForm({
        label: n.label || '',
        node_type: n.node_type || 'menu',
        parent_id: n.parent_id || null,
        flow_id: n.flow_id || '',
        action_type: n.action_type || '',
        action_config: n.action_config || {},
      });
      setModalOpen(true);
    } catch { setError('Failed to load button'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = { ...form };
      if (!payload.flow_id) delete payload.flow_id;
      if (!payload.action_type) delete payload.action_type;
      if (editingId) {
        await menuApi.update(editingId, payload);
      } else {
        await menuApi.create(payload);
      }
      setModalOpen(false);
      fetchTree();
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to save button'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this button and all its children?')) return;
    try { await menuApi.delete(id); fetchTree(); }
    catch { setError('Failed to delete button'); }
  };

  const handlePublish = async () => {
    try {
      const res = await menuApi.publish();
      if (res.data.success) alert('Menu published successfully!');
      else alert('Violations found: ' + JSON.stringify(res.data.violations));
    } catch (err) {
      const violations = err.response?.data?.violations;
      if (violations) alert('Violations:\n' + violations.map((v) => v.message || v).join('\n'));
      else setError('Publish failed');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Menu</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-2 text-sm rounded-xl border transition-all cursor-pointer ${showPreview ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            📱 {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button onClick={handlePublish} className="px-4 py-2 text-sm border border-emerald-300 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer font-medium">
            Publish Menu
          </button>
          <button onClick={() => openCreate(null)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all cursor-pointer shadow-sm">
            + Add Button
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">Build the interactive button menu your customers see in WhatsApp. Customers navigate by tapping buttons — no free text.</p>
      <ErrorMsg msg={error} onDismiss={() => setError(null)} />

      <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 xl:grid-cols-[1fr,340px]' : 'grid-cols-1'}`}>
        {/* Menu tree */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Menu Buttons</h2>
            <span className="text-xs text-gray-400">{tree.length} root button{tree.length !== 1 ? 's' : ''}</span>
          </div>
          {tree.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mx-auto mb-4">📱</div>
              <p className="font-medium text-gray-900 mb-1">No menu buttons yet</p>
              <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">Create buttons that your WhatsApp customers will tap. Start with a root button.</p>
              <button onClick={() => openCreate(null)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all cursor-pointer">
                + Add First Button
              </button>
            </div>
          ) : (
            <TreeView nodes={tree} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} depth={0} />
          )}
        </div>

        {/* WhatsApp Preview */}
        {showPreview && (
          <div className="flex flex-col items-center">
            <div className="sticky top-20">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">Live Preview</p>
              <WhatsAppPreview tree={tree} businessName="Your Business" />
            </div>
          </div>
        )}
      </div>

      {/* Info box: how menu connects to forms */}
      {tree.length > 0 && (
        <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50/80 to-emerald-50/80 rounded-2xl border border-indigo-100">
          <p className="text-sm font-semibold text-gray-800 mb-2">💡 How buttons connect to forms</p>
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2 flex-wrap">
            <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium">📱 Customer taps button</span>
            <span className="text-gray-400">→</span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium">📝 Form starts (if linked)</span>
            <span className="text-gray-400">→</span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium">📥 Request created</span>
            <span className="text-gray-400">→</span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium">👤 Auto-assigned</span>
          </div>
          <p className="text-xs text-gray-500">Set a button's type to "Start Form" to link it to a form. When customers complete the form, a request is created automatically.</p>
        </div>
      )}

      {modalOpen && (
        <Modal title={editingId ? 'Edit Button' : 'New Button'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Label *</label>
              <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputClass} placeholder="e.g. Book Appointment" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Type *</label>
              <select value={form.node_type} onChange={(e) => setForm({ ...form, node_type: e.target.value })} className={selectClass}>
                {Object.entries(NODE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {form.node_type === 'menu' && 'Opens a sub-menu with more buttons for the customer.'}
                {form.node_type === 'info' && 'Displays information text to the customer.'}
                {form.node_type === 'flow_entry' && 'Starts a form to collect customer info step-by-step.'}
                {form.node_type === 'action' && 'Performs an action like showing a phone number or location.'}
              </p>
            </div>
            {form.node_type === 'flow_entry' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Linked Form *</label>
                <select value={form.flow_id} onChange={(e) => setForm({ ...form, flow_id: e.target.value })} className={selectClass}>
                  <option value="">Select a form...</option>
                  {flows.map((f) => <option key={f.id} value={f.id}>{f.name}{f.is_active ? '' : ' (Inactive)'}</option>)}
                </select>
                {flows.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠️ No forms found. Create a form first in the Forms page.</p>}
              </div>
            )}
            {form.node_type === 'action' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                <select value={form.action_type} onChange={(e) => setForm({ ...form, action_type: e.target.value })} className={selectClass}>
                  <option value="">Select action...</option>
                  <option value="show_phone">📞 Show Phone Number</option>
                  <option value="show_location">📍 Show Location</option>
                  <option value="open_link">🔗 Open Link</option>
                  <option value="go_back">⬅️ Go Back</option>
                </select>
              </div>
            )}
            <ModalActions onCancel={() => setModalOpen(false)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function TreeView({ nodes, onAdd, onEdit, onDelete, depth }) {
  const typeIcon = (type) => {
    switch (type) {
      case 'menu': return '📂';
      case 'flow_entry': return '📝';
      case 'info': return 'ℹ️';
      case 'action': return '⚡';
      default: return '📱';
    }
  };

  const typeLabel = (type) => {
    switch (type) {
      case 'menu': return 'Sub-menu';
      case 'flow_entry': return 'Start Form';
      case 'info': return 'Info';
      case 'action': return 'Action';
      default: return type;
    }
  };

  return (
    <ul className={depth > 0 ? 'ml-6 border-l-2 border-indigo-100 pl-4' : ''}>
      {nodes.map((node) => (
        <li key={node.id} className="py-1.5">
          <div className="flex items-center gap-3 group p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <span className="text-sm">{typeIcon(node.type)}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-900 text-sm">{node.title}</span>
              <span className="ml-2 text-[10px] font-medium text-gray-400 uppercase">{typeLabel(node.type)}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
              {node.type === 'menu' && (
                <button onClick={() => onAdd(node.id)} className="text-xs text-emerald-600 hover:text-emerald-800 cursor-pointer px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors">+ Child</button>
              )}
              <button onClick={() => onEdit(node.id)} className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">Edit</button>
              <button onClick={() => onDelete(node.id)} className="text-xs text-red-500 hover:text-red-700 cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
            </div>
          </div>
          {node.children && node.children.length > 0 && (
            <TreeView nodes={node.children} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}
