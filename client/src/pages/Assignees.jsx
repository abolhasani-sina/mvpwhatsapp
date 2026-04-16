import { useState, useEffect, useCallback } from 'react';
import { assigneesApi } from '../services/api';
import { Modal, ModalActions, Spinner, ErrorMsg, StatusBadge, inputClass } from '../components/UI';
import { useBusinessContext } from '../context/useBusiness';

export default function Assignees() {
  const { profile } = useBusinessContext();
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', phone_number: '', label: '', is_active: true });

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const res = await assigneesApi.list(); setAssignees(res.data.data); }
    catch { setError('Failed to load assignees'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditing(null); setForm({ name: '', phone_number: '', label: '', is_active: true }); setModalOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ name: a.name, phone_number: a.phone_number || '', label: a.label || '', is_active: a.is_active }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await assigneesApi.update(editing.id, form);
      else await assigneesApi.create(form);
      setModalOpen(false);
      fetch();
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this team member?')) return;
    try { await assigneesApi.delete(id); fetch(); }
    catch { setError('Failed to delete'); }
  };

  const toggleActive = async (a) => {
    try { await assigneesApi.update(a.id, { is_active: !a.is_active }); fetch(); }
    catch { setError('Failed to update'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-all shadow-sm cursor-pointer">+ Add Member</button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Manage your {profile.teamNoun} who handle {profile.customerNoun} requests. Add members so requests can be auto-assigned.</p>
      <ErrorMsg msg={error} onDismiss={() => setError(null)} />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {loading ? <Spinner /> : assignees.length === 0 ? (
          <div className="px-6 py-16 text-center"><div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mx-auto mb-4">👥</div><p className="font-semibold text-gray-900 mb-1">No team members yet</p><p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Add team members so customer requests can be assigned to them automatically.</p><button onClick={openCreate} className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-all shadow-sm cursor-pointer">+ Add First Member</button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Phone</th><th className="px-6 py-3">Label</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignees.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{a.name}</td>
                    <td className="px-6 py-3 font-mono text-xs">{a.phone_number || '—'}</td>
                    <td className="px-6 py-3 text-gray-500">{a.label || '—'}</td>
                    <td className="px-6 py-3"><StatusBadge status={a.is_active ? 'active' : 'inactive'} /></td>
                    <td className="px-6 py-3"><div className="flex gap-2">
                      <button onClick={() => toggleActive(a)} className="text-xs cursor-pointer text-gray-600 hover:text-gray-800">{a.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => openEdit(a)} className="text-xs text-emerald-600 hover:text-emerald-800 cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(a.id)} className="text-xs text-red-600 hover:text-red-800 cursor-pointer">Delete</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Team Member' : 'New Team Member'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Role / Label</label>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder={profile.rolePlaceholder} className={inputClass} /></div>
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
