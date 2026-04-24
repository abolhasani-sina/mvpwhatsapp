import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import {
  fetchSettings, updateSettings, updateBusiness, fetchBusiness,
  createChannelChangeRequest, fetchChannelChangeRequests,
} from '../lib/api';
import { useToast } from '../components/Toast';

export default function SettingsPage({ businessId }) {
  const { addToast } = useToast();
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [bizName, setBizName] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [locks, setLocks] = useState({ telegram: false, whatsapp: false, instagram: false });
  const [requests, setRequests] = useState([]);
  const [requestModal, setRequestModal] = useState(null); // { channel, currentValue }
  const [requestValue, setRequestValue] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waAccessToken, setWaAccessToken] = useState('');
  const [waWabaId, setWaWabaId] = useState('');
  const [showWaToken, setShowWaToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    Promise.all([
      fetchSettings(businessId),
      fetchBusiness(),
      fetchChannelChangeRequests(businessId).catch(() => []),
    ]).then(([s, biz, reqs]) => {
      if (s) {
        setTgToken(s.telegram_bot_token || '');
        setTgChatId(s.telegram_chat_id || '');
        setBusinessEmail(s.business_email || '');
        setWaPhoneNumberId(s.whatsapp_phone_number_id || '');
        setWaAccessToken(s.whatsapp_access_token || '');
        setWaWabaId(s.whatsapp_waba_id || '');
        setLocks({
          telegram: s.telegram_locked === 1,
          whatsapp: s.whatsapp_locked === 1,
          instagram: s.instagram_locked === 1,
        });
      }
      if (biz) {
        setBizName(biz.name || '');
        setBizPhone(biz.phone || '');
      }
      setRequests(reqs || []);
      setLoading(false);
    });
  }, [businessId]);

  function pendingFor(channel) {
    return requests.find((r) => r.channel === channel && r.status === 'pending');
  }

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        updateSettings(businessId, locks.telegram ? undefined : tgToken, tgChatId, businessEmail, '', waPhoneNumberId, waAccessToken, waWabaId), // [ADDED: dont-send-locked-token]
        // [ADDED: remove-whatsapp-field]
        updateBusiness(businessId, { name: bizName, phone: bizPhone }),
      ]);
      addToast('Settings saved successfully', 'success');
    } catch (err) {
      if (err.code === 'CHANNEL_LOCKED') {
        addToast(`${err.channel} is locked — submit a change request.`, 'error');
      } else {
        addToast(err.message || 'Failed to save settings', 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  function openRequest(channel, currentValue) {
    setRequestModal({ channel, currentValue });
    setRequestValue('');
    setRequestReason('');
  }

  async function submitRequest() {
    if (!requestValue.trim()) {
      addToast('New value is required', 'error');
      return;
    }
    setSubmittingRequest(true);
    try {
      await createChannelChangeRequest(businessId, requestModal.channel, requestValue.trim(), requestReason.trim());
      addToast('Change request submitted for owner approval', 'success');
      const reqs = await fetchChannelChangeRequests(businessId);
      setRequests(reqs);
      setRequestModal(null);
    } catch (err) {
      addToast(err.message || 'Failed to submit request', 'error');
    } finally {
      setSubmittingRequest(false);
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
          Your contact details so we can notify you when a new booking arrives.
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

        </div>
      </div>

      {/* Telegram */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Telegram Notifications</h2>
        <div className="mb-4">
          <p className="text-[13px] text-slate-400 mb-3">
            Get notified on Telegram every time a new booking arrives. Follow these steps to connect:
          </p>
          <ol className="flex flex-col gap-2">
            <li className="flex gap-2 text-[13px] text-slate-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">1</span>
              <span>Open Telegram and message <strong>@BotFather</strong></span>
            </li>
            <li className="flex gap-2 text-[13px] text-slate-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">2</span>
              <span>Type <strong>/newbot</strong> and follow the steps  you'll get a token</span>
            </li>
            <li className="flex gap-2 text-[13px] text-slate-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">3</span>
              <span>Copy the token and paste it in the field below</span>
            </li>
          </ol>
        </div>
        <div className="flex flex-col gap-3">
          <ChannelField
            label="Bot Token"
            value={tgToken}
            onChange={setTgToken}
            placeholder="123456:ABC-DEF..."
            mono
            locked={locks.telegram}
            pending={pendingFor('telegram')}
            onRequestChange={() => openRequest('telegram', tgToken)}
          />
          <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-500">
            Default Chat ID
            <input
              value={tgChatId}
              onChange={(e) => setTgChatId(e.target.value)}
              placeholder="-100123456789"
              className="py-2 px-3 rounded-lg border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Don't know your Chat ID? Message <strong>@userinfobot</strong> on Telegram and it will reply with your ID.
            </p>
          </label>
        </div>
      </div>

      {/* WhatsApp Cloud API */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">WhatsApp Cloud API</h2>
        <p className="text-[13px] text-slate-400 mb-4">
          Connect your WhatsApp Business number via Meta Cloud API. You need a verified Meta Business account and a WhatsApp Business Account (WABA).
        </p>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-500">
            Phone Number ID
            <input
              value={waPhoneNumberId}
              onChange={(e) => setWaPhoneNumberId(e.target.value)}
              placeholder="1093820477142269"
              className="py-2 px-3 rounded-lg border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Found in Meta Developer App  WhatsApp  API Setup</p>
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-500">
            Access Token
            <div className="relative">
              <input
                value={waAccessToken}
                onChange={(e) => setWaAccessToken(e.target.value)}
                type={showWaToken ? 'text' : 'password'}
                placeholder="EAAxxxxxxxx..."
                className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowWaToken(!showWaToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-indigo-600 hover:text-indigo-800"
              >{showWaToken ? 'Hide' : 'Show'}</button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Temporary or permanent access token from Meta Developer App</p>
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-500">
            WhatsApp Business Account ID (WABA ID)
            <input
              value={waWabaId}
              onChange={(e) => setWaWabaId(e.target.value)}
              placeholder="2998883523654864"
              className="py-2 px-3 rounded-lg border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Found in Meta Developer App  WhatsApp  API Setup</p>
          </label>
        </div>
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

      {requestModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setRequestModal(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-slate-900">Request {requestModal.channel} change</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              The {requestModal.channel} channel is locked. Submit a request and the platform owner will review it.
            </p>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 mb-3">
              New value
              <input
                value={requestValue}
                onChange={(e) => setRequestValue(e.target.value)}
                placeholder={requestModal.channel === 'telegram' ? 'New bot token' : 'New value'}
                className="py-2 px-3 rounded-lg border border-slate-200 text-sm font-mono"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Reason
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={3}
                placeholder="Why do you need this change?"
                className="py-2 px-3 rounded-lg border border-slate-200 text-sm"
              />
            </label>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setRequestModal(null)}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 text-slate-700"
              >Cancel</button>
              <button
                onClick={submitRequest}
                disabled={submittingRequest}
                className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50"
              >{submittingRequest ? 'Submitting…' : 'Submit Request'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelField({ label, value, onChange, placeholder, mono, locked, pending, onRequestChange, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[13px] font-medium text-slate-500">
        <span className="flex items-center gap-2">
          {label}
          {locked && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
              <Lock className="w-2.5 h-2.5" /> Locked
            </span>
          )}
          {pending && (
            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Change pending
            </span>
          )}
        </span>
        {locked && !pending && (
          <button
            type="button"
            onClick={onRequestChange}
            className="text-[11px] text-indigo-600 hover:text-indigo-800"
          >Request change</button>
        )}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={locked}
        className={`py-2 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
          mono ? 'font-mono' : ''
        } ${locked ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
      />
      {hint && <span className="text-[11px] text-slate-300 italic">{hint}</span>}
    </div>
  );
}
