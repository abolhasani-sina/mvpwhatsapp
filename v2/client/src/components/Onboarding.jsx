import { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { TEMPLATES } from '../lib/templates';
import { createBusiness } from '../lib/api';

const FEATURED = [
  { key: 'beauty_salon',   icon: '💇', name: 'Beauty salon' },
  { key: 'restaurant',     icon: '🍽', name: 'Restaurant' },
  { key: 'medical_clinic', icon: '🏥', name: 'Clinic' },
  { key: 'fitness_gym',    icon: '💪', name: 'Gym' },
  { key: 'real_estate',    icon: '🏠', name: 'Real estate' },
  { key: 'car_rental',     icon: '🚗', name: 'Car rental' },
  { key: 'hotel',          icon: '🏨', name: 'Hotel' },
  { key: 'pet_care',       icon: '🐾', name: 'Pet care' },
  { key: 'education',      icon: '📚', name: 'Education' },
  { key: 'auto_repair',    icon: '🔧', name: 'Auto repair' },
  { key: 'photography',    icon: '📷', name: 'Photography' },
  { key: 'cleaning',       icon: '🧹', name: 'Cleaning' },
  { key: 'event_planning', icon: '🎉', name: 'Events' },
  { key: 'travel_agency',  icon: '✈️',  name: 'Travel' },
  { key: 'law_firm',       icon: '⚖️',  name: 'Law firm' },
];

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((s, i) => (
        <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all
            ${step > s ? 'bg-emerald-100 text-emerald-600' : step === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
            {step > s ? '' : s}
          </div>
          {i < 2 && <div className={`h-px flex-1 transition-all ${step > s ? 'bg-indigo-400' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [selectedKey, setSelectedKey] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [bizId, setBizId] = useState(null);
  const [error, setError] = useState('');

  const selected = FEATURED.find(t => t.key === selectedKey);
  const tplDef = TEMPLATES.find(t => t.key === selectedKey);

  async function handleCreate() {
    if (!businessName.trim()) return setError('Please enter a business name');
    setError('');
    setLoading(true);
    try {
      const templateData = JSON.parse(JSON.stringify(tplDef.load()));
      // Replace hardcoded template business name with user's business name
      const templateNames = [
        'Glow Studio', 'CarePoint Medical Center', 'Bella Tavola', 'Skyline Realty',
        'DriveEasy Rentals', 'IronCore Fitness', 'The Grand Meridian', 'Paws & Whiskers',
        'TutorSpark', 'AutoFix Pro', 'LensArt Studio', 'LexPro Legal', 'SparkClean',
        'EventCraft', 'SkyWay Travel',
      ];
      const userBizName = businessName.trim();
      for (const tName of templateNames) {
        if (templateData.welcomeMessage && templateData.welcomeMessage.includes(tName)) {
          templateData.welcomeMessage = templateData.welcomeMessage.replace(tName, userBizName);
          break;
        }
      }
      const biz = await createBusiness(selectedKey, userBizName, templateData);
      setBizId(biz.id);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to create bot');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <StepIndicator step={step} />

        {step === 1 && (
          <>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Step 1 of 3</p>
            <h2 className="text-xl font-semibold text-slate-900 mb-1">What kind of business are you?</h2>
            <p className="text-sm text-slate-500 mb-6">We'll load the right bot template for you.</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
              {FEATURED.map(t => (
                <button
                  key={t.key}
                  onClick={() => setSelectedKey(t.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all
                    ${selectedKey === t.key
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-100'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'}`}
                >
                  <span style={{fontSize:'22px',lineHeight:1,fontFamily:'Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif'}}>{t.icon}</span>
                  <span className={`text-xs font-medium leading-tight ${selectedKey === t.key ? 'text-indigo-700' : 'text-slate-600'}`}>{t.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { if (selectedKey) setStep(2); }}
              disabled={!selectedKey}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/25 text-sm disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Step 2 of 3</p>
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Name your business</h2>
            <p className="text-sm text-slate-500 mb-6">This is shown to your customers in the bot.</p>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-5 flex items-center gap-3">
              <span className="text-3xl">{selected?.emoji}</span>
              <div>
                <p className="text-sm font-medium text-slate-700">{selected?.name} template</p>
                <p className="text-xs text-slate-500">Menus, booking flow & services pre-built</p>
              </div>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Business name</label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={`e.g. ${selected?.name === 'Beauty salon' ? 'Glow Beauty Studio' : 'My ' + selected?.name}`}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white mb-2"
              autoFocus
            />
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={loading || !businessName.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/25 text-sm disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <>Create my bot <ArrowRight className="w-4 h-4" /></>}
            </button>
            <button onClick={() => setStep(1)} className="w-full py-2.5 mt-2 text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Your bot is ready!</h2>
              <p className="text-sm text-slate-500">Connect a channel to start receiving messages from customers.</p>
            </div>
            <div className="space-y-2 mb-6">
              {[
                { done: true,  text: `Bot created with ${selected?.name} template` },
                { done: false, text: 'Connect Telegram or WhatsApp' },
                { done: false, text: 'Test your bot' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${item.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${item.done ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                    {item.done ? '' : ''}
                  </div>
                  <span className={`text-sm ${item.done ? 'text-emerald-800 font-medium' : 'text-slate-500'}`}>{item.text}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { onComplete(bizId); setTimeout(() => onComplete('settings'), 50); }}
                className="py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/25 text-sm"
              >
                Connect channel
              </button>
              <button
                onClick={() => { onComplete(bizId); setTimeout(() => onComplete('builder'), 50); }}
                className="py-3 border border-indigo-500 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all text-sm"
              >
                Customize bot
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
