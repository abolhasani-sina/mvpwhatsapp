import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templatesApi } from '../services/api';
import { Spinner } from '../components/UI';
import { useBusinessContext } from '../context/useBusiness';

const INDUSTRY_ICONS = {
  beauty_salon: '💇',
  clinic: '🏥',
  spa: '🧖',
  restaurant: '🍽️',
  sport_salon: '🏋️',
  real_estate: '🏠',
  car_rental: '🚗',
  driving_school: '🚘',
  consulting: '💼',
  dental: '🦷',
  pet_care: '🐾',
  tutoring: '📚',
  event_planning: '🎉',
  photography: '📸',
  auto_repair: '🔧',
  fitness: '💪',
  cleaning: '🧹',
  legal: '⚖️',
};

export default function SetupWizard() {
  const navigate = useNavigate();
  const { setBusinessType } = useBusinessContext();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    templatesApi
      .status()
      .then((res) => {
        if (res.data.data.setup_complete) {
          navigate('/dashboard', { replace: true });
          return;
        }
        return templatesApi.list();
      })
      .then((res) => {
        if (res) setTemplates(res.data.data);
      })
      .catch(() => setError('Failed to load templates'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleApply = async () => {
    setApplying(true);
    setError(null);
    try {
      if (selected === 'custom') {
        await templatesApi.skip();
        setBusinessType(null);
      } else {
        await templatesApi.apply(selected);
        const tpl = templates.find((t) => t.id === selected);
        if (tpl) setBusinessType(tpl.industry_type);
      }
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to apply template');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Spinner />;

  // Step 3: Done
  if (step === 3) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          {selected === 'custom'
            ? 'Your workspace is ready. Start by adding services, building your menu, and creating forms.'
            : 'Your template has been applied! Services, menu, and forms are ready to customize.'}
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 cursor-pointer"
          >
            Go to Dashboard →
          </button>
          <p className="text-xs text-gray-400">Follow the getting started checklist to complete your setup</p>
        </div>
      </div>
    );
  }

  // Step 2: Confirm
  if (step === 2) {
    const tpl = selected === 'custom' ? null : templates.find((t) => t.id === selected);
    return (
      <div className="max-w-lg mx-auto py-10 animate-fade-in">
        <button onClick={() => { setStep(1); setError(null); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Choice</h2>
        <p className="text-gray-500 mb-6">This will pre-fill your workspace with services, a WhatsApp menu, and forms. You can customize everything later.</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 mb-6">
          {tpl ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl flex-shrink-0">
                {INDUSTRY_ICONS[tpl.industry_type] || '📦'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{tpl.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{tpl.description}</p>
                <p className="text-xs text-gray-400 mt-2">Will create sample services, menu buttons, and booking forms.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl flex-shrink-0">⚡</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Start from Scratch</h3>
                <p className="text-sm text-gray-500 mt-0.5">Empty workspace — build everything yourself.</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>
        )}

        <button
          onClick={handleApply}
          disabled={applying}
          className="w-full px-5 py-3 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200 cursor-pointer font-medium"
        >
          {applying ? 'Setting up your workspace...' : 'Apply & Continue →'}
        </button>
      </div>
    );
  }

  // Step 1: Choose
  return (
    <div className="max-w-3xl mx-auto py-10 animate-fade-in">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">🏢</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What type of business do you run?</h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          Pick a template to auto-create services, menu buttons, and forms for your business type — or start from scratch.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8 stagger">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setSelected(tpl.id)}
            className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer animate-fade-in ${
              selected === tpl.id
                ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200 shadow-md'
                : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{INDUSTRY_ICONS[tpl.industry_type] || '📦'}</span>
              <h3 className="text-base font-semibold text-gray-900">{tpl.name}</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{tpl.description}</p>
          </button>
        ))}

        {/* Custom — start from scratch */}
        <button
          onClick={() => setSelected('custom')}
          className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer animate-fade-in ${
            selected === 'custom'
              ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200 shadow-md'
              : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚡</span>
            <h3 className="text-base font-semibold text-gray-900">Start from Scratch</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">Create everything manually — full control from day one.</p>
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setStep(2)}
          disabled={!selected}
          className="px-6 py-2.5 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-sm cursor-pointer font-medium"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
