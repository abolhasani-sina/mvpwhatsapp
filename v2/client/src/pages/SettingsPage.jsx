import { useState, useEffect } from 'react';
import { fetchSettings, updateSettings, updateBusiness, fetchBusiness } from '../lib/api';
import { useToast } from '../components/Toast';

export default function SettingsPage({ businessId }) {
  const { addToast } = useToast();
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [bizName, setBizName] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    Promise.all([fetchSettings(businessId), fetchBusiness()]).then(([s, biz]) => {
      if (s) {
        setTgToken(s.telegram_bot_token || '');
        setTgChatId(s.telegram_chat_id || '');
        setBusinessEmail(s.business_email || '');
        setWhatsappNumber(s.whatsapp_number || '');
      }
      if (biz) {
        setBizName(biz.name || '');
        setBizPhone(biz.phone || '');
      }
      setLoading(false);
    });
  }, [businessId]);

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        updateSettings(businessId, tgToken, tgChatId, businessEmail, whatsappNumber),
        updateBusiness(businessId, { name: bizName, phone: bizPhone }),
      ]);
      addToast('Settings saved successfully', 'success');
    } catch {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!businessId) {
    return (
      <div className="text-center py-16 text-slate-400">
        Load a template first.
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading…</div>;
  }

  return (
    <div className="p-6 max-w-[700px] mx-auto space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Configure your business profile and notification channels</p>
      </div>

      {/* Business Profile */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Business Profile</h2>
        <p className="text-[13px] text-slate-400 mb-4">
          Your business name and phone number.
        </p>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-500">
            Business Name
            <input
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              placeholder="My Business"
              className="py-2 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-500">
            Phone Number
            <input
              value={bizPhone}
              onChange={(e) => setBizPhone(e.target.value)}
              placeholder="+1234567890"
              className="py-2 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>
        </div>
      </div>

      {/* Business Contact */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Business Contact</h2>
        <p className="text-[13px] text-slate-400 mb-4">
          Main contact info for your business. Used for delivery notifications.
        </p>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-500">
            Business Email
            <input
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              placeholder="contact@yourbusiness.com"
              className="py-2 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-500">
            WhatsApp Number
            <input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+1234567890"
              className="py-2 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="text-[11px] text-slate-300 italic">WhatsApp integration coming soon</span>
          </label>
        </div>
      </div>

      {/* Telegram */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Telegram Notifications</h2>
        <p className="text-[13px] text-slate-400 mb-4">
          Get instant notifications on Telegram when a new submission arrives.
          Create a bot via <strong>@BotFather</strong> and get the chat ID.
        </p>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-500">
            Bot Token
            <input
              value={tgToken}
              onChange={(e) => setTgToken(e.target.value)}
              placeholder="123456:ABC-DEF..."
              className="py-2 px-3 rounded-lg border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-500">
            Default Chat ID
            <input
              value={tgChatId}
              onChange={(e) => setTgChatId(e.target.value)}
              placeholder="-100123456789"
              className="py-2 px-3 rounded-lg border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>
        </div>
      </div>

      {/* Future Channels */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 opacity-60">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">More Channels</h2>
        <p className="text-[13px] text-slate-400">
          SMS, Slack, Webhooks, and more integrations coming soon.
        </p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-none rounded-xl px-6 py-2.5 text-sm font-semibold cursor-pointer transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
