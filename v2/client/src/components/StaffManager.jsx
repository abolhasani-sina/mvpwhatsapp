import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { fetchStaff, createStaff, updateStaff, deleteStaff } from '../lib/api';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';

export default function StaffManager({ businessId }) {
  const { addToast } = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelegram, setNewTelegram] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!businessId) return;
    loadData();
  }, [businessId]);

  async function loadData() {
    try {
      setError(null);
      const staffList = await fetchStaff(businessId);
      setStaff(staffList || []);
    } catch (err) {
      setError('Failed to load staff. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    try {
      await createStaff(businessId, newName.trim(), newRole.trim(), newEmail.trim(), newTelegram.trim());
      setNewName(''); setNewRole(''); setNewEmail(''); setNewTelegram('');
      addToast('Staff member added', 'success');
      await loadData();
    } catch (err) {
      addToast('Failed to add staff member', 'error');
    }
  }

  async function handleUpdate(id) {
    try {
      await updateStaff(id, editName, editRole, editEmail, editTelegram);
      setEditingId(null);
      addToast('Staff member updated', 'success');
      await loadData();
    } catch (err) {
      addToast('Failed to update staff member', 'error');
    }
  }

  async function handleDelete(id) {
    setDeleteTarget(id);
  }

  async function confirmDelete() {
    try {
      await deleteStaff(deleteTarget);
      addToast('Staff member removed', 'success');
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      addToast('Failed to remove staff member', 'error');
      setDeleteTarget(null);
    }
  }

  function startEdit(s) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditRole(s.role || '');
    setEditEmail(s.email || '');
    setEditTelegram(s.telegram_chat_id || '');
  }

  if (!businessId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No bot configured yet</p>
          <p className="text-sm text-slate-400">Set up your bot in the Builder first, then manage staff here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[700px] mx-auto">
      {/* Staff section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Staff Members</h2>
        <p className="text-[13px] text-slate-400 mb-4">
          Add team members who can be assigned to incoming submissions.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => { setError(null); loadData(); }} className="text-red-500 hover:text-red-700 text-xs font-medium cursor-pointer bg-transparent border-none">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400 text-sm">Loading staff…</div>
        ) : (
          <>
        {/* Add form */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Role (optional)"
              className="w-40 py-2 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="flex gap-2">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email (optional)"
              className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              value={newTelegram}
              onChange={(e) => setNewTelegram(e.target.value)}
              placeholder="Telegram Chat ID (optional)"
              className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <button
            onClick={handleAdd}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-none rounded-lg px-4 py-2 text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all shadow-sm self-start"
          >
            + Add Staff
          </button>
        </div>

        {/* Staff list */}
        {staff.length === 0 ? (
          <div className="text-slate-300 text-center py-8 text-sm">
            No staff members yet.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {staff.map((s) => (
              <div key={s.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                {editingId === s.id ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 py-1.5 px-2.5 rounded-md border border-slate-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Name"
                      />
                      <input
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-[120px] py-1.5 px-2.5 rounded-md border border-slate-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Role"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="flex-1 py-1.5 px-2.5 rounded-md border border-slate-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Email"
                      />
                      <input
                        value={editTelegram}
                        onChange={(e) => setEditTelegram(e.target.value)}
                        className="flex-1 py-1.5 px-2.5 rounded-md border border-slate-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Telegram Chat ID"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleUpdate(s.id)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white border-none rounded-md px-3 py-1.5 text-xs cursor-pointer transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-500 border-none rounded-md px-3 py-1.5 text-xs cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-700 flex-1">{s.name}</span>
                      {s.role && (
                        <span className="text-xs text-slate-500 bg-slate-200 rounded-full px-2 py-0.5">
                          {s.role}
                        </span>
                      )}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEdit(s)}
                          className="bg-transparent border border-slate-200 hover:border-indigo-400 rounded-md px-2.5 py-1 text-xs cursor-pointer text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="bg-transparent border border-red-300 hover:border-red-500 rounded-md px-2.5 py-1 text-xs cursor-pointer text-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {(s.email || s.telegram_chat_id) && (
                      <div className="flex gap-3 text-[11px] text-slate-400 mt-0.5">
                        {s.email && <span>✉ {s.email}</span>}
                        {s.telegram_chat_id && <span>✈ {s.telegram_chat_id}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Remove Staff Member"
        message="Are you sure you want to remove this staff member? They will be unassigned from any future submissions."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
