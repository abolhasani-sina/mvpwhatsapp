import { useState, useEffect } from 'react';
import { profileApi } from '../services/api';
import { Spinner, inputClass } from '../components/UI';

export default function BusinessProfile() {
  const [form, setForm] = useState({ name: '', phone: '', location: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    profileApi.get()
      .then((res) => setForm(res.data.data))
      .catch(() => setMsg({ type: 'error', text: 'Failed to load profile' }))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await profileApi.update(form);
      setForm(res.data.data);
      setMsg({ type: 'success', text: 'Profile updated' });
    } catch {
      setMsg({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Business Profile</h1>
      <p className="text-sm text-gray-500 mb-6">Your business details shown to customers in WhatsApp. Keep them up to date.</p>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 max-w-lg">
        {msg && (
          <div className={`mb-4 p-3 text-sm rounded-xl ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input required value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass} />
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
