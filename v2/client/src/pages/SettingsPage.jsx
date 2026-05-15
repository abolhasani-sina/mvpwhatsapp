import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import {
  fetchSettings, updateSettings, updateBusiness, fetchBusiness,
  createChannelChangeRequest, fetchChannelChangeRequests, fetchAnalytics,
} from '../lib/api';
import { useToast } from '../components/Toast';
import { authFetch } from '../lib/auth.jsx';

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
  const [plan, setPlan] = useState(null);
  const [esLoading, setEsLoading] = useState(false);
  const [esError, setEsError] = useState('');
  const [tgSetupMode, setTgSetupMode] = useState(null); // null | 'new' | 'import'
  const [detectingChatId, setDetectingChatId] = useState(false);
  const [detectStatus, setDetectStatus] = useState('');
  const [detectDone, setDetectDone] = useState(false);
  const [botInfo, setBotInfo] = useState(null); // { username, firstName }
  const [chatIdLocked, setChatIdLocked] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    Promise.all([
      fetchSettings(businessId),
      fetchBusiness(),
      fetchChannelChangeRequests(businessId).catch(() => []),
      fetchAnalytics(businessId).catch(() => null),
    ]).then(([s, biz, reqs, analytics]) => {
      if (analytics?.plan) setPlan(analytics.plan);
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
        setChatIdLocked(s.telegram_chat_id_locked === 1);
      }
      if (biz) {
        setBizName(biz.name || '');
        setBizPhone(biz.phone || '');
      }
      setRequests(reqs || []);
      setLoading(false);
      // Auto-start chat ID detection if token locked but chat ID not set
      if (s?.telegram_locked === 1 && !s?.telegram_chat_id && !s?.telegram_chat_id_locked) {
        setTimeout(() => detectChatId(), 500);
      }
    }).then(() => {
      // Fetch bot info if token exists
      if (businessId) {
        fetch(`/api/business/${businessId}/telegram-bot/info`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('bd_access_token')}` }
        }).then(r => r.json()).then(d => { if (d.username) setBotInfo(d); }).catch(() => {});
      }
    });
  }, [businessId]);

  function pendingFor(channel) {
    return requests.find((r) => r.channel === channel && r.status === 'pending');
  }

  function detectChatId() {
    setDetectingChatId(true);
    setDetectStatus('Waiting for you to message your bot...');
    setDetectDone(false);
    const evtSource = new EventSource(`/api/business/${businessId}/telegram-bot/detect-chat-id`, {
      withCredentials: true,
    });
    // Pass auth token via URL since EventSource doesn't support headers
    const token = localStorage.getItem('bd_access_token');
    const sessionKey = Math.random().toString(36).slice(2);
    const url = `/api/business/${businessId}/telegram-bot/detect-chat-id?session=${sessionKey}${token ? `&_t=${token}` : ''}`;
    evtSource.close();
    // Use fetch with SSE manually
    const ctrl = new AbortController();
    fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal })
      .then(async res => {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          let event = '', data = '';
          for (const line of lines) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            if (line.startsWith('data:')) {
              try {
                data = JSON.parse(line.slice(5).trim());
                if (event === 'status') setDetectStatus(data.message);
                if (event === 'found') {
                  setTgChatId(String(data.chatId));
                  setDetectStatus(` Chat ID captured${data.name ? ` for ${data.name}` : ''}! Click Save Settings to confirm.`);
                  setDetectDone(true);
                  setDetectingChatId(false);
                }
                if (event === 'timeout') {
                  setDetectStatus(' No message received. Try again.');
                  setDetectingChatId(false);
                }
              } catch {}
            }
          }
        }
        setDetectingChatId(false);
      })
      .catch(() => {
        setDetectStatus('Connection error. Try again.');
        setDetectingChatId(false);
      });
  }

  async function handleSave() {
    // Validate token if not locked
    if (!locks.telegram && tgToken && tgToken.trim().length < 20) {
      addToast('Please enter a valid bot token', 'error');
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        updateSettings(businessId, locks.telegram ? undefined : tgToken, tgChatId, businessEmail, '', waPhoneNumberId, waAccessToken, waWabaId), // [ADDED: dont-send-locked-token]
        // [ADDED: remove-whatsapp-field]
        updateBusiness(businessId, { name: bizName, phone: bizPhone }),
      ]);
      addToast('Settings saved successfully', 'success');
      // Refresh settings to get lock states and bot info
      const [newS, newReqs] = await Promise.all([fetchSettings(businessId), fetchChannelChangeRequests(businessId).catch(() => [])]);
      if (newS) {
        setLocks({ telegram: newS.telegram_locked === 1, whatsapp: newS.whatsapp_locked === 1, instagram: newS.instagram_locked === 1 });
        setChatIdLocked(newS.telegram_chat_id_locked === 1);
        setTgChatId(newS.telegram_chat_id || '');
      }
      setRequests(newReqs || []);
      // Refresh bot info
      fetch(`/api/business/${businessId}/telegram-bot/info`, { headers: { Authorization: `Bearer ${localStorage.getItem('bd_access_token')}` } }).then(r => r.json()).then(d => { if (d.username) setBotInfo(d); }).catch(() => {});
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




  const launchEmbeddedSignup = () => {
    setEsError('');
    setEsLoading(true);
    const doLogin = () => {
    const msgHandler = (ev) => {
      if (ev.origin !== 'https://www.facebook.com' && ev.origin !== 'https://web.facebook.com') return;
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP' && data.event === 'FINISH') {
          const { phone_number_id, waba_id } = data.data;
          if (phone_number_id) setWaPhoneNumberId(phone_number_id);
          if (waba_id) setWaWabaId(waba_id);
          setEsLoading(false);
          window.removeEventListener('message', msgHandler);
        } else if (data.type === 'WA_EMBEDDED_SIGNUP' && data.event === 'CANCEL') {
          setEsLoading(false);
          window.removeEventListener('message', msgHandler);
        }
      } catch (e) {}
    };
    window.addEventListener('message', msgHandler);
    window.FB.login((response) => {
      if (response.authResponse) {
        const code = response.authResponse.code;
        authFetch('/api/whatsapp/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        })
          .then(r => r.json())
          .then(d => {
            if (d.access_token) { setWaAccessToken(d.access_token); }
            setEsLoading(false);
          })
          .catch(() => setEsLoading(false));
      } else {
        setEsLoading(false);
        window.removeEventListener('message', msgHandler);
      }
    }, {
      config_id: '1262395959310168',
      response_type: 'code',
      override_default_response_type: true,
      extras: { sessionInfoVersion: 3, version: 'v4', featureType: 'whatsapp_business_app_onboarding' }
    });
    };
    if (window.FB) {
      doLogin();
    } else {
      window.fbAsyncInit = function () {
        window.FB.init({ appId: '1974211913207772', autoLogAppEvents: true, xfbml: true, version: 'v21.0' });
        doLogin();
      };
      const s = document.createElement('script');
      s.src = 'https://connect.facebook.net/en_US/sdk.js';
      s.async = true;
      document.body.appendChild(s);
    }
  };
  //  End Embedded Signup 

  return (
    <div className="p-6 max-w-[700px] mx-auto space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Configure your business profile and notification channels</p>
        </div>
        {plan && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 self-start">
            <span className="text-xs text-slate-500">Current Plan</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">{plan.name}</span>
          </div>
        )}
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

      {/* Channel Plan Status */}
      {plan && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Channels on Your Plan</h2>
          <div className="flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${plan.allowTelegram ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <span>{plan.allowTelegram ? '' : ''}</span> Telegram
              {!plan.allowTelegram && <span className="text-slate-400 font-normal"> Upgrade required</span>}
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${plan.allowWhatsapp ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <span>{plan.allowWhatsapp ? '' : ''}</span> WhatsApp
              {!plan.allowWhatsapp && <span className="text-slate-400 font-normal"> Upgrade required</span>}
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${plan.allowInstagram ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <span>{plan.allowInstagram ? '' : ''}</span> Instagram
              {!plan.allowInstagram && <span className="text-slate-400 font-normal"> Upgrade required</span>}
            </div>
          </div>
        </div>
      )}

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
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-500"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.036 9.586c-.152.667-.546.833-1.107.517l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.697l-2.95-.924c-.64-.203-.654-.64.136-.948l11.527-4.445c.534-.194 1.001.13.37.868z"/></svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Telegram Bot</h2>
            <p className="text-[12px] text-slate-400">Receive customer bookings directly on Telegram</p>
          </div>
          {locks.telegram && <span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">Connected</span>}
        </div>

        {/* If already has token  show current setup */}
        {locks.telegram ? (
          <div className="mt-4 flex flex-col gap-3">
            {/* Bot username display */}
            {botInfo && (
              <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {botInfo.firstName?.[0] || 'B'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{botInfo.firstName}</div>
                  <div className="text-xs text-blue-600 font-mono">@{botInfo.username}</div>
                </div>
                <a
                  href={`tg://resolve?domain=${botInfo.username}&text=/start`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  Open Bot
                </a>
              </div>
            )}
            {/* Masked token */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-slate-500">Bot Token</label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"> Locked</span>
                  {!pendingFor('telegram') && (
                    <button onClick={() => openRequest('telegram', tgToken)} className="text-[11px] text-indigo-600 hover:underline">Request change</button>
                  )}
                </div>
              </div>
              <div className="py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-mono text-slate-500">
                {tgToken ? tgToken.slice(0, 8) + ':' + tgToken.split(':')[1]?.slice(0, 4) + '' : ''}
              </div>
            </div>
            {/* Chat ID */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-slate-500">Your Chat ID</label>
                {chatIdLocked && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"> Locked</span>
                    <button onClick={() => openRequest('telegram_chat_id', tgChatId)} className="text-[11px] text-indigo-600 hover:underline">Request change</button>
                  </div>
                )}
              </div>
              {!chatIdLocked ? (
                <div className="flex flex-col gap-2">
                  {botInfo && (
                    
                      <a
                      href={`tg://resolve?domain=${botInfo.username}&text=/start`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { if (!detectingChatId) detectChatId(); }}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 transition-colors w-fit"
                    >
                       Open @{botInfo.username} on Telegram  send /start
                    </a>
                  )}
                  <input
                    value={tgChatId}
                    onChange={(e) => setTgChatId(e.target.value)}
                    placeholder="Will be detected automatically..."
                    readOnly={detectingChatId}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {detectStatus && (
                    <div className={`text-[12px] px-3 py-2 rounded-lg ${detectDone ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                      {detectingChatId && ' '}{detectStatus}
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-mono text-slate-500">
                  {tgChatId ? tgChatId.slice(0, 4) + '' + tgChatId.slice(-4) : ''}
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-1">Booking notifications will be sent here.</p>
            </div>
          </div>
        ) : (
          /* No token yet  show setup options */
          <div className="mt-4">
            {!tgSetupMode ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setTgSetupMode('new')}
                  className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-center group"
                >
                  <span className="text-2xl"></span>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">Create New Bot</span>
                  <span className="text-[11px] text-slate-400">I don't have a Telegram bot yet</span>
                </button>
                <button
                  onClick={() => setTgSetupMode('import')}
                  className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-center group"
                >
                  <span className="text-2xl"></span>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">Import Existing Bot</span>
                  <span className="text-[11px] text-slate-400">I already have a bot token</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <button onClick={() => setTgSetupMode(null)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 w-fit">
                   Back
                </button>
                {tgSetupMode === 'new' && (
                  <div className="bg-blue-50 rounded-xl p-4 flex flex-col gap-3">
                    <p className="text-sm font-semibold text-blue-800">Create your Telegram bot in 3 steps:</p>
                    <ol className="flex flex-col gap-2">
                      <li className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">1</span>
                        <div>
                          <p className="text-[13px] text-slate-700 font-medium">Open BotFather on Telegram, then type <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-mono">/newbot</code></p>
                          <a href="tg://resolve?domain=BotFather&text=/newbot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors">Open Telegram  @BotFather</a>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">2</span>
                        <p className="text-[13px] text-slate-700">Follow BotFather's steps  give your bot a name and username</p>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">3</span>
                        <p className="text-[13px] text-slate-700">Copy the token BotFather gives you and paste it below</p>
                      </li>
                    </ol>
                  </div>
                )}
                {tgSetupMode === 'import' && (
                  <div className="bg-indigo-50 rounded-xl p-4 flex flex-col gap-3">
                    <p className="text-sm font-semibold text-indigo-800">Get your existing bot token in 3 steps:</p>
                    <ol className="flex flex-col gap-2">
                      <li className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">1</span>
                        <div>
                          <p className="text-[13px] text-slate-700 font-medium">Open BotFather and view your bots</p>
                          <a href="tg://resolve?domain=BotFather&text=/mybots" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors">Open Telegram  Select Your Bot</a>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">2</span>
                        <p className="text-[13px] text-slate-700">Select your bot from the list, then tap <strong>API Token</strong></p>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">3</span>
                        <p className="text-[13px] text-slate-700">Copy the token and paste it below</p>
                      </li>
                    </ol>
                  </div>
                )}
                <ChannelField
                  label="Paste Your Bot Token"
                  value={tgToken}
                  onChange={setTgToken}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  mono
                  locked={locks.telegram}
                  pending={pendingFor('telegram')}
                  onRequestChange={() => openRequest('telegram', tgToken)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Cloud API - only show if plan allows WhatsApp */}
      {plan?.allowWhatsapp && <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">WhatsApp Cloud API</h2>
        <p className="text-[13px] text-slate-400 mb-4">
          Connect your WhatsApp Business number via Meta Cloud API. You need a verified Meta Business account and a WhatsApp Business Account (WABA).
        </p>
        <div className="flex flex-col gap-3">
          {/* Embedded Signup */}
          <div className="flex flex-col gap-2 mb-1">
            <button
              type="button"
              onClick={launchEmbeddedSignup}
              disabled={esLoading}
              style={{ background: '#1877F2' }}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
              {esLoading ? 'Connecting…' : 'Connect with Meta (Recommended)'}
            </button>
            {esError && <p className="text-[12px] text-red-500">{esError}</p>}
            <p className="text-[11px] text-slate-400">Opens a secure Meta popup — auto-fills your credentials below.</p>
          </div>
          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] text-slate-400 font-medium">or enter manually</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
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
      </div>}

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
                placeholder={requestModal.channel === 'telegram' ? 'New bot token' : requestModal.channel === 'telegram_chat_id' ? 'Your numeric Telegram ID' : 'New value'}
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
