import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { fetchStaff, createStaff, updateStaff, deleteStaff } from '../lib/api';

export default function StaffManager({ businessId }) {
  const [staff, setStaff] = useState([]);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelegram, setNewTelegram] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelegram, setEditTelegram] = useState('');

  useEffect(() => {
    if (!businessId) return;
    loadData();
  }, [businessId]);

  async function loadData() {
    const staffList = await fetchStaff(businessId);
    setStaff(staffList || []);
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    await createStaff(businessId, newName.trim(), newRole.trim(), newEmail.trim(), newTelegram.trim());
    setNewName(''); setNewRole(''); setNewEmail(''); setNewTelegram('');
    await loadData();
  }

  async function handleUpdate(id) {
    await updateStaff(id, editName, editRole, editEmail, editTelegram);
    setEditingId(null);
    await loadData();
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this staff member?')) return;
    await deleteStaff(id);
    await loadData();
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
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bot configured yet</p>
          <p className="text-sm text-gray-400">Set up your bot in the Builder first, then manage staff here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[700px] mx-auto">
      {/* Staff section */}
      <div className="bg-white rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Staff Members</h2>
        <p className="text-[13px] text-gray-400 mb-4">
          Add team members who can be assigned to incoming submissions.
        </p>

        {/* Add form */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="flex-1 py-2 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Role (optional)"
              className="w-40 py-2 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="flex gap-2">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email (optional)"
              className="flex-1 py-2 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              value={newTelegram}
              onChange={(e) => setNewTelegram(e.target.value)}
              placeholder="Telegram Chat ID (optional)"
              className="flex-1 py-2 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <button
            onClick={handleAdd}
            className="bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer whitespace-nowrap transition-colors self-start"
          >
            + Add Staff
          </button>
        </div>

        {/* Staff list */}
        {staff.length === 0 ? (
          <div className="text-gray-300 text-center py-8 text-sm">
            No staff members yet.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {staff.map((s) => (
              <div key={s.id} className="bg-gray-50 rounded-lg p-3">
                {editingId === s.id ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 py-1.5 px-2.5 rounded-md border border-gray-300 text-[13px] outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Name"
                      />
                      <input
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-[120px] py-1.5 px-2.5 rounded-md border border-gray-300 text-[13px] outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Role"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="flex-1 py-1.5 px-2.5 rounded-md border border-gray-300 text-[13px] outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Email"
                      />
                      <input
                        value={editTelegram}
                        onChange={(e) => setEditTelegram(e.target.value)}
                        className="flex-1 py-1.5 px-2.5 rounded-md border border-gray-300 text-[13px] outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Telegram Chat ID"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleUpdate(s.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-md px-3 py-1.5 text-xs cursor-pointer transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-500 border-none rounded-md px-3 py-1.5 text-xs cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-700 flex-1">{s.name}</span>
                      {s.role && (
                        <span className="text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                          {s.role}
                        </span>
                      )}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEdit(s)}
                          className="bg-transparent border border-gray-200 hover:border-gray-400 rounded-md px-2.5 py-1 text-xs cursor-pointer text-gray-500 transition-colors"
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
                      <div className="flex gap-3 text-[11px] text-gray-400 mt-0.5">
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
      </div>
    </div>
  );
}
