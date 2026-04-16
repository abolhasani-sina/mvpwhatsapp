import { useState, useEffect, useCallback } from 'react';
import { requestsApi, assigneesApi } from '../services/api';
import { Modal, ModalActions, Spinner, ErrorMsg, StatusBadge, selectClass } from '../components/UI';
import { useBusinessContext } from '../context/useBusiness';

const STATUS_FILTERS = ['', 'pending', 'approved', 'rejected', 'manual_followup', 'completed'];
const TRANSITIONS = {
  pending: ['approved', 'rejected', 'manual_followup'],
  approved: ['completed'],
  manual_followup: ['approved', 'rejected', 'completed'],
};

export default function Requests() {
  const { profile } = useBusinessContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [assignees, setAssignees] = useState([]);

  // Assign modal
  const [assignModal, setAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assigneeId, setAssigneeId] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, assRes] = await Promise.all([
        requestsApi.list(filter || undefined),
        assigneesApi.list().catch(() => ({ data: { data: [] } })),
      ]);
      setRequests(reqRes.data.data);
      setAssignees(assRes.data.data);
    } catch { setError('Failed to load requests'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const getAssigneeName = (id) => {
    if (!id) return null;
    const a = assignees.find(a => a.id === id);
    return a ? a.name : 'Unknown';
  };

  const fetchAssignees = async () => {
    try { const res = await assigneesApi.list(); setAssignees(res.data.data); }
    catch { /* ignore */ }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await requestsApi.updateStatus(id, newStatus);
      fetchRequests();
      if (selected?.id === id) {
        const res = await requestsApi.get(id);
        setSelected(res.data.data);
      }
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to update status'); }
  };

  const openAssign = (req) => {
    setAssignTarget(req);
    setAssigneeId('');
    fetchAssignees();
    setAssignModal(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await requestsApi.assign(assignTarget.id, assigneeId);
      setAssignModal(false);
      fetchRequests();
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to assign'); }
  };

  const viewDetails = async (req) => {
    try { const res = await requestsApi.get(req.id); setSelected(res.data.data); }
    catch { setError('Failed to load request'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.customerNoun.charAt(0).toUpperCase() + profile.customerNoun.slice(1)} Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage requests submitted by {profile.customerNoun}s through WhatsApp.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={selectClass + ' w-auto'}>
          <option value="">All Statuses</option>
          {STATUS_FILTERS.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <ErrorMsg msg={error} onDismiss={() => setError(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
          {loading ? <Spinner /> : requests.length === 0 ? (
            <div className="px-6 py-12 text-center"><p className="text-4xl mb-3">📥</p><p className="font-medium text-gray-900 mb-1">No requests yet</p><p className="text-sm text-gray-500">When customers complete a booking flow, their requests will appear here.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((r) => (
                    <tr key={r.id} className={`hover:bg-gray-50 cursor-pointer ${selected?.id === r.id ? 'bg-emerald-50' : ''}`} onClick={() => viewDetails(r)}>
                      <td className="px-4 py-3 font-mono text-xs">{r.phone_number || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.assigned_to_id ? getAssigneeName(r.assigned_to_id) : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openAssign(r)} className="text-xs text-emerald-600 hover:text-emerald-800 cursor-pointer">Assign</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Details</h2>
          {!selected ? (
            <p className="text-sm text-gray-400">Select a request to view details.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">ID:</span> <span className="font-mono text-xs break-all">{selected.id}</span></div>
              <div><span className="text-gray-500">Phone:</span> {selected.phone_number || '—'}</div>
              <div><span className="text-gray-500">Status:</span> <StatusBadge status={selected.status} /></div>
              <div><span className="text-gray-500">Flow ID:</span> <span className="font-mono text-xs break-all">{selected.source_flow_id || '—'}</span></div>
              <div><span className="text-gray-500">Assigned:</span> {selected.assigned_to_id ? getAssigneeName(selected.assigned_to_id) : 'Unassigned'}</div>
              <div><span className="text-gray-500">Created:</span> {new Date(selected.created_at).toLocaleString()}</div>
              {selected.data && (
                <div>
                  <span className="text-gray-500">Data:</span>
                  <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-40">{JSON.stringify(typeof selected.data === 'string' ? JSON.parse(selected.data) : selected.data, null, 2)}</pre>
                </div>
              )}
              {/* Status transition buttons */}
              {TRANSITIONS[selected.status] && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {TRANSITIONS[selected.status].map((s) => (
                    <button key={s} onClick={() => handleStatusChange(selected.id, s)}
                      className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 capitalize cursor-pointer">{s.replace(/_/g, ' ')}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assign modal */}
      {assignModal && (
        <Modal title="Assign Request" onClose={() => setAssignModal(false)}>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee *</label>
              <select required value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={selectClass}>
                <option value="">Select assignee...</option>
                {assignees.filter((a) => a.is_active).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <ModalActions onCancel={() => setAssignModal(false)} submitLabel="Assign" />
          </form>
        </Modal>
      )}
    </div>
  );
}
