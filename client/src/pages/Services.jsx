import { useState, useEffect, useCallback } from 'react';
import { servicesApi } from '../services/api';
import { inputClass } from '../components/UI';
import { useBusinessContext } from '../context/useBusiness';

export default function Services() {
  const { profile } = useBusinessContext();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '' });
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await servicesApi.list();
      setServices(res.data.data);
    } catch { setError('Failed to load services'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', price: '', duration: '' }); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, description: s.description || '', price: s.price || '', duration: s.duration || '' }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, price: form.price ? Number(form.price) : null };
      if (editing) await servicesApi.update(editing.id, payload);
      else await servicesApi.create(payload);
      setModalOpen(false);
      fetchServices();
    } catch { setError('Failed to save service'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return;
    try { await servicesApi.delete(id); fetchServices(); }
    catch { setError('Failed to delete service'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-sm cursor-pointer">+ Add Service</button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Define the {profile.serviceNounPlural} your business offers. {profile.customerNoun.charAt(0).toUpperCase() + profile.customerNoun.slice(1)}s see these when they {profile.bookingVerb} through WhatsApp.</p>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-center justify-between">{error}<button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 cursor-pointer">✕</button></div>}

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl mx-auto mb-4">🛠</div>
          <p className="font-semibold text-gray-900 mb-1">No services yet</p>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Add your first service so customers can book it through WhatsApp.</p>
          <button onClick={openCreate} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-sm cursor-pointer">+ Add Your First Service</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {services.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 card-hover animate-fade-in group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg flex-shrink-0">🛠</div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button onClick={() => openEdit(s)} className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:text-red-700 cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{s.name}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.description || 'No description'}</p>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                {s.price != null && <span className="bg-gray-50 px-2 py-1 rounded-lg font-medium">${s.price}</span>}
                {s.duration && <span className="bg-gray-50 px-2 py-1 rounded-lg">{s.duration}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Edit Service' : 'New Service'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder={profile.servicePlaceholder} /></Field>
            <Field label="Description"><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="Brief description of this service" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price"><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} placeholder="0.00" /></Field>
              <Field label="Duration"><input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 30 min" className={inputClass} /></Field>
            </div>
            <ModalActions onCancel={() => setModalOpen(false)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (<div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>);
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">Cancel</button>
      <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 cursor-pointer transition-all shadow-sm">Save</button>
    </div>
  );
}
