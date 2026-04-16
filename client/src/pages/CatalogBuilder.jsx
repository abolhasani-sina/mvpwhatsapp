import { useState, useEffect, useCallback, useRef } from 'react';
import { servicesApi } from '../services/api';
import { Spinner, ErrorMsg, inputClass } from '../components/UI';

/* ─── Constants ──────────────────────────────────────────── */

const BEHAVIORS = [
  { value: 'show_children', label: 'Show more options', desc: 'Customer sees more buttons to choose from', icon: '📋' },
  { value: 'show_description', label: 'Show information', desc: 'Show a page with details and action buttons', icon: '📄' },
  { value: 'ask_questions', label: 'Ask the customer questions', desc: 'Start a step-by-step conversation form', icon: '💬' },
  { value: 'direct_action', label: 'Do something', desc: 'Call, open link, talk to agent, etc.', icon: '⚡' },
];

const ACTIONS = [
  { value: 'phone', label: 'Call us', icon: '📞', configLabel: 'Phone number', configKey: 'phone', placeholder: '+1 555 123 4567' },
  { value: 'link', label: 'Open a link', icon: '🔗', configLabel: 'URL', configKey: 'url', placeholder: 'https://example.com' },
  { value: 'handover', label: 'Talk to an agent', icon: '👤' },
  { value: 'back', label: 'Go back', icon: '⬅️' },
];

const ANSWER_TYPES = [
  { value: 'text', label: 'User types answer', icon: '⌨️' },
  { value: 'select', label: 'User selects from options', icon: '📋' },
  { value: 'hybrid', label: 'Both (options + type)', icon: '🔄' },
  { value: 'service_select', label: 'Use your existing services', icon: '🛍️' },
];

const DEFAULT_WELCOME = '👋 Welcome! How can we help you today?';

/* ─── Service tree helpers for form integration ──────────── */

function getServiceBranches(services) {
  // Returns services that have children (categories/groups)
  const parentIds = new Set(services.filter(s => s.parent_id).map(s => s.parent_id));
  return services.filter(s => parentIds.has(s.id));
}

function getLeafServices(services, branchId) {
  // If branchId is specified, return leaf descendants of that branch
  // Otherwise return all leaf services (services with no children)
  const parentIds = new Set(services.filter(s => s.parent_id).map(s => s.parent_id));
  
  if (!branchId) {
    return services.filter(s => !parentIds.has(s.id));
  }
  
  // Get all descendants of branchId, then filter to leaves
  const descendants = [];
  const collectDescendants = (parentId) => {
    services.filter(s => s.parent_id === parentId).forEach(s => {
      descendants.push(s);
      collectDescendants(s.id);
    });
  };
  collectDescendants(branchId);
  return descendants.filter(s => !parentIds.has(s.id));
}

function getServiceOptionsForStep(step, services) {
  if (step.answerType !== 'service_select') return [];
  const source = step.serviceSource || {};
  if (source.type === 'branch' && source.branchId) {
    return getLeafServices(services, source.branchId);
  }
  return getLeafServices(services, null);
}

/* ─── Helpers ────────────────────────────────────────────── */

function parseBehavior(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return null; }
}

function getBehaviorLabel(svc) {
  const b = parseBehavior(svc?.behavior);
  if (!b) return 'show_children';
  if (b.type === 'custom' && b.mode === 'ask_questions') return 'ask_questions';
  return b.type || 'show_children';
}

function serializeBehavior(type, data) {
  if (type === 'show_children') return { type: 'show_children' };
  if (type === 'show_description') return { type: 'show_description' };
  if (type === 'ask_questions') return { type: 'custom', mode: 'ask_questions', steps: data.steps || [] };
  if (type === 'direct_action') return { type: 'direct_action', action: data.action || 'back', config: data.config || {} };
  return { type: 'show_children' };
}

/* ─── Main Component ─────────────────────────────────────── */

export default function CatalogBuilder() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [welcomeMsg, setWelcomeMsg] = useState(() => localStorage.getItem('wa_welcome') || DEFAULT_WELCOME);
  const [saving, setSaving] = useState(false);
  const [saveVersion, setSaveVersion] = useState(0);
  const chatEndRef = useRef(null);

  const fetchServices = useCallback(async () => {
    try {
      const res = await servicesApi.list();
      setServices(res.data.data);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);
  useEffect(() => { localStorage.setItem('wa_welcome', welcomeMsg); }, [welcomeMsg]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [currentPath, services]);

  const currentParentId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;
  const currentChildren = services
    .filter(s => s.parent_id === currentParentId)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const selectedSvc = services.find(s => s.id === selectedId);
  const pathNames = currentPath.map(id => services.find(s => s.id === id)?.name || '...');

  /* ── CRUD ──────────────────────────────────────────────── */

  const addButton = async (title) => {
    if (!title?.trim()) return;
    setSaving(true);
    try {
      await servicesApi.create({
        name: title.trim(),
        parent_id: currentParentId,
        sort_order: currentChildren.length,
        behavior: { type: 'show_children' },
      });
      await fetchServices();
    } catch { setError('Failed to add button'); }
    finally { setSaving(false); }
  };

  const updateService = async (id, payload) => {
    setSaving(true);
    try {
      await servicesApi.update(id, payload);
      await fetchServices();
      setSaveVersion(v => v + 1);
      return true;
    } catch (err) {
      const details = err.response?.data?.error?.details;
      const serverMsg = err.response?.data?.error?.message;
      const msg = details?.length
        ? `Save failed: ${details.join(', ')}`
        : serverMsg
          ? `Save failed: ${serverMsg}`
          : `Save failed: ${err.message || 'Unknown error'}`;
      setError(msg);
      return false;
    }
    finally { setSaving(false); }
  };

  const deleteService = async (id) => {
    const hasKids = services.some(s => s.parent_id === id);
    const msg = hasKids
      ? 'This will delete this button AND everything inside it. Continue?'
      : 'Delete this button?';
    if (!confirm(msg)) return;
    try {
      const deleteRecursive = async (parentId) => {
        const children = services.filter(s => s.parent_id === parentId);
        for (const c of children) {
          await deleteRecursive(c.id);
          await servicesApi.delete(c.id);
        }
      };
      await deleteRecursive(id);
      await servicesApi.delete(id);
      if (selectedId === id) setSelectedId(null);
      await fetchServices();
    } catch { setError('Failed to delete'); }
  };

  const moveItem = async (id, direction) => {
    const svc = services.find(s => s.id === id);
    if (!svc) return;
    const siblings = services
      .filter(s => s.parent_id === svc.parent_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = siblings.findIndex(s => s.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    try {
      await servicesApi.update(id, { sort_order: siblings[swapIdx].sort_order ?? swapIdx });
      await servicesApi.update(siblings[swapIdx].id, { sort_order: svc.sort_order ?? idx });
      await fetchServices();
    } catch { setError('Failed to reorder'); }
  };

  /* ── Navigation ────────────────────────────────────────── */

  const navigateInto = (id) => {
    setCurrentPath(p => [...p, id]);
    setSelectedId(null);
  };

  const navigateBack = () => {
    setCurrentPath(p => p.slice(0, -1));
    setSelectedId(null);
  };

  const navigateTo = (idx) => {
    setCurrentPath(p => p.slice(0, idx));
    setSelectedId(null);
  };

  if (loading) return <Spinner />;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#075e54] flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">WhatsApp Builder</h1>
            <p className="text-xs text-gray-500">Design how your customers chat with you</p>
          </div>
        </div>
      </div>

      <ErrorMsg msg={error} onDismiss={() => setError(null)} />

      {/* Main: Phone + Editor */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Phone Preview ──────────────────────────────── */}
        <div className="flex-1 flex items-start justify-center py-6 px-4 overflow-y-auto bg-gray-50/80">
          <div className="w-[340px] flex-shrink-0">
            <div className="rounded-[2rem] bg-gray-900 p-2 shadow-2xl">
              <div className="rounded-[1.5rem] overflow-hidden bg-white flex flex-col" style={{ height: 560 }}>

                {/* WA header */}
                <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {currentParentId ? services.find(s => s.id === currentParentId)?.name : 'Your Business'}
                    </p>
                    <p className="text-emerald-200 text-[10px]">online</p>
                  </div>
                </div>

                {/* Breadcrumb */}
                {currentPath.length > 0 && (
                  <div className="bg-emerald-50 px-3 py-1.5 flex items-center gap-1 text-[11px] flex-shrink-0 overflow-x-auto">
                    <button onClick={() => navigateTo(0)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer font-medium whitespace-nowrap">
                      🏠 Home
                    </button>
                    {pathNames.map((name, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="text-gray-300">›</span>
                        <button
                          onClick={() => navigateTo(i + 1)}
                          className={`cursor-pointer whitespace-nowrap ${i === pathNames.length - 1 ? 'text-gray-700 font-semibold' : 'text-emerald-600 hover:text-emerald-800 font-medium'}`}
                        >
                          {name}
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Chat area */}
                <div className="flex-1 wa-phone px-3 py-3 overflow-y-auto flex flex-col gap-2">

                  {/* Welcome or context message */}
                  <div className="flex justify-start animate-fade-in">
                    <div
                      className={`max-w-[85%] wa-bubble-bot px-3 py-2 text-[13px] leading-snug whitespace-pre-wrap cursor-pointer transition-all ${!currentParentId && !selectedId ? 'ring-2 ring-[#075e54]/30' : 'hover:ring-1 hover:ring-gray-300'}`}
                      onClick={() => { if (!currentParentId) setSelectedId(null); }}
                    >
                      {currentParentId ? 'Please choose:' : welcomeMsg}
                    </div>
                  </div>

                  {/* Info display for show_description parent */}
                  {currentParentId && (() => {
                    const parent = services.find(s => s.id === currentParentId);
                    const beh = getBehaviorLabel(parent);
                    if (beh === 'show_description' && (parent?.description || parent?.price)) {
                      return (
                        <div className="flex justify-start animate-fade-in">
                          <div className="max-w-[85%] wa-bubble-bot px-3 py-2 text-[13px] leading-snug">
                            {parent.description && <p>{parent.description}</p>}
                            {parent.price != null && <p className="font-semibold mt-1">💰 ${parent.price}</p>}
                            {parent.duration && <p className="text-gray-500 text-[11px]">⏱ {parent.duration}</p>}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Form preview for ask_questions parent */}
                  {currentParentId && (() => {
                    const parent = services.find(s => s.id === currentParentId);
                    const b = parseBehavior(parent?.behavior);
                    if (b?.type === 'custom' && b?.mode === 'ask_questions' && b.steps?.length > 0) {
                      return b.steps.map((step, i) => {
                        const serviceOpts = step.answerType === 'service_select'
                          ? getServiceOptionsForStep(step, services)
                          : [];
                        return (
                        <div key={i} className="animate-fade-in">
                          <div className="flex justify-start mb-1">
                            <div className="max-w-[85%] wa-bubble-bot px-3 py-2 text-[13px]">
                              {step.question || `Question ${i + 1}`}
                            </div>
                          </div>
                          {(step.answerType === 'select' || step.answerType === 'hybrid') && step.options?.length > 0 && (
                            <div className="ml-2 space-y-1 mb-1">
                              {step.options.map((opt, oi) => (
                                <div key={oi} className="wa-btn text-[12px] opacity-60 pointer-events-none">{opt}</div>
                              ))}
                              {step.answerType === 'hybrid' && step.allowManual && (
                                <div className="wa-btn text-[12px] opacity-40 pointer-events-none italic">✏️ Enter manually</div>
                              )}
                            </div>
                          )}
                          {step.answerType === 'service_select' && serviceOpts.length > 0 && (
                            <div className="ml-2 space-y-1 mb-1">
                              {serviceOpts.map((svc) => (
                                <div key={svc.id} className="wa-btn text-[12px] opacity-60 pointer-events-none">
                                  🛍️ {svc.name}
                                </div>
                              ))}
                            </div>
                          )}
                          {step.answerType === 'text' && (
                            <div className="flex justify-end mb-1">
                              <div className="max-w-[75%] wa-bubble-user px-3 py-2 text-[12px] italic text-gray-500">
                                Customer types answer...
                              </div>
                            </div>
                          )}
                        </div>
                      );});
                    }
                    return null;
                  })()}

                  {/* Buttons */}
                  {currentChildren.length > 0 && (
                    <div className="mt-1 space-y-1.5 animate-fade-in">
                      {currentChildren.map((svc) => {
                        const isSelected = selectedId === svc.id;
                        const hasKids = services.some(s => s.parent_id === svc.id);
                        return (
                          <button
                            key={svc.id}
                            onClick={() => setSelectedId(isSelected ? null : svc.id)}
                            onDoubleClick={() => navigateInto(svc.id)}
                            className={`wa-btn flex items-center justify-center gap-1.5 relative transition-all ${isSelected ? 'ring-2 ring-[#075e54] bg-emerald-50 border-[#075e54] font-semibold' : ''}`}
                          >
                            {svc.name || 'Untitled'}
                            {hasKids && <span className="text-[10px] opacity-40 ml-1">›</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Back button in preview */}
                  {currentPath.length > 0 && (
                    <button onClick={navigateBack} className="wa-btn opacity-60 mt-1">⬅️ Back</button>
                  )}

                  {/* Add button inline */}
                  <AddButtonInline onAdd={addButton} saving={saving} />

                  {/* Empty state */}
                  {currentChildren.length === 0 && currentPath.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-xs">
                      <p className="text-2xl mb-2">👆</p>
                      <p>Add your first button to get started</p>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input bar (decorative) */}
                <div className="bg-[#f0f0f0] px-3 py-2 flex items-center gap-2 flex-shrink-0">
                  <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-xs text-gray-400">
                    Customers tap buttons above
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#075e54] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </div>
                </div>

              </div>
            </div>

            {/* Tips below phone */}
            <div className="mt-4 text-center space-y-1">
              <p className="text-[11px] text-gray-400">Click a button to edit · Double-click to go inside</p>
            </div>
          </div>
        </div>

        {/* ── Side Editor Panel ──────────────────────────── */}
        <div className="w-[400px] border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0">
          {selectedSvc ? (
            <ButtonEditor
              key={`${selectedSvc.id}-${saveVersion}`}
              svc={selectedSvc}
              services={services}
              onUpdate={updateService}
              onDelete={deleteService}
              onMove={moveItem}
              onNavigateInto={navigateInto}
              onClose={() => setSelectedId(null)}
              saving={saving}
            />
          ) : (
            <WelcomeEditor
              message={welcomeMsg}
              onChange={setWelcomeMsg}
              totalButtons={currentChildren.length}
              currentPath={currentPath}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Add Button Inline ──────────────────────────────────── */

function AddButtonInline({ onAdd, saving }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title);
    setTitle('');
    setAdding(false);
  };

  if (adding) {
    return (
      <form onSubmit={handleSubmit} className="mt-2 animate-fade-in">
        <div className="bg-white rounded-xl border border-emerald-200 p-2 shadow-sm">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Button title..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            maxLength={50}
          />
          <div className="flex gap-2 mt-2">
            <button type="submit" disabled={saving || !title.trim()} className="flex-1 py-1.5 text-xs font-medium bg-[#075e54] text-white rounded-lg hover:bg-[#064e46] disabled:opacity-40 cursor-pointer transition-colors">
              Add
            </button>
            <button type="button" onClick={() => { setAdding(false); setTitle(''); }} className="flex-1 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="mt-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-[#075e54] hover:text-[#075e54] transition-all cursor-pointer"
    >
      + Add Button
    </button>
  );
}

/* ─── Welcome Editor ─────────────────────────────────────── */

function WelcomeEditor({ message, onChange, totalButtons, currentPath }) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">💬</span>
        <h2 className="text-lg font-semibold text-gray-900">
          {currentPath.length === 0 ? 'Welcome Message' : 'Current Screen'}
        </h2>
      </div>

      {currentPath.length === 0 ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            This is the first thing your customer sees when they message you on WhatsApp.
          </p>
          <textarea
            value={message}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Type your welcome message..."
          />
          <p className="text-[11px] text-gray-400 mt-2">Tip: Keep it short, friendly, and include an emoji 😊</p>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Your flow</h3>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <p><span className="font-semibold text-gray-800">{totalButtons}</span> button{totalButtons !== 1 ? 's' : ''} on the home screen</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-emerald-50/80 rounded-xl border border-emerald-100">
            <p className="text-sm font-medium text-emerald-800 mb-2">💡 How it works</p>
            <ol className="text-xs text-emerald-700 space-y-1.5 list-decimal list-inside">
              <li>Your customer messages you on WhatsApp</li>
              <li>They see your welcome message and buttons</li>
              <li>They tap a button to navigate</li>
              <li>Each button leads somewhere you design</li>
            </ol>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-500 space-y-3">
          <p>Click a button in the preview to edit it.</p>
          <p>Double-click a button to see what&apos;s inside it.</p>
          <p className="text-xs text-gray-400 mt-4">Use the breadcrumb trail in the preview to navigate back.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Button Editor ──────────────────────────────────────── */

function ButtonEditor({ svc, services, onUpdate, onDelete, onMove, onNavigateInto, onClose, saving }) {
  const behavior = getBehaviorLabel(svc);
  const rawBehavior = parseBehavior(svc.behavior);

  const [name, setName] = useState(svc.name || '');
  const [beh, setBeh] = useState(behavior);
  const [desc, setDesc] = useState(svc.description || '');
  const [price, setPrice] = useState(svc.price ?? '');
  const [duration, setDuration] = useState(svc.duration || '');
  const [action, setAction] = useState(rawBehavior?.action || 'back');
  const [actionConfig, setActionConfig] = useState(rawBehavior?.config || {});
  const [steps, setSteps] = useState(rawBehavior?.steps || []);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    const behaviorData = {};
    if (beh === 'direct_action') {
      behaviorData.action = action;
      behaviorData.config = actionConfig;
    }
    if (beh === 'ask_questions') {
      behaviorData.steps = steps;
    }
    const payload = {
      name: name.trim() || 'Untitled',
      description: beh === 'show_description' ? (desc || null) : null,
      price: beh === 'show_description' && price !== '' ? Number(price) : null,
      duration: beh === 'show_description' ? (duration || null) : null,
      behavior: serializeBehavior(beh, behaviorData),
    };
    const success = await onUpdate(svc.id, payload);
    if (success) {
      setDirty(false);
    }
  };

  const hasChildren = services.some(s => s.parent_id === svc.id);
  const siblings = services.filter(s => s.parent_id === svc.parent_id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const sibIdx = siblings.findIndex(s => s.id === svc.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <h2 className="text-base font-semibold text-gray-900">Edit Button</h2>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors">✕</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* Button title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Button title</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty(); }}
            className={inputClass}
            placeholder="What does the customer see?"
            maxLength={50}
          />
        </div>

        {/* Reorder */}
        {siblings.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Order:</span>
            <button
              onClick={() => onMove(svc.id, 'up')}
              disabled={sibIdx === 0}
              className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
            </button>
            <button
              onClick={() => onMove(svc.id, 'down')}
              disabled={sibIdx === siblings.length - 1}
              className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
          </div>
        )}

        {/* Behavior selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            What should happen when the customer clicks this?
          </label>
          <div className="space-y-2">
            {BEHAVIORS.map((b) => (
              <label
                key={b.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  beh === b.value
                    ? 'border-[#075e54] bg-emerald-50/60 ring-1 ring-[#075e54]/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="behavior"
                  checked={beh === b.value}
                  onChange={() => { setBeh(b.value); markDirty(); }}
                  className="mt-0.5 accent-[#075e54]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>{b.icon}</span>
                    <span className="text-sm font-medium text-gray-800">{b.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 ml-6">{b.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ── Show more options content ── */}
        {beh === 'show_children' && (
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800 mb-3">
              {hasChildren
                ? `This button has ${services.filter(s => s.parent_id === svc.id).length} option(s) inside.`
                : 'No options inside yet.'}
            </p>
            <button
              onClick={() => onNavigateInto(svc.id)}
              className="px-4 py-2 text-xs font-medium bg-white text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              {hasChildren ? 'View & edit options inside →' : 'Go inside to add options →'}
            </button>
          </div>
        )}

        {/* ── Show information content ── */}
        {beh === 'show_description' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700">This shows a details page to your customer with the information below.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={desc}
                onChange={(e) => { setDesc(e.target.value); markDirty(); }}
                rows={3}
                className={inputClass}
                placeholder="What should the customer know?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => { setPrice(e.target.value); markDirty(); }}
                    className={inputClass + ' pl-7'}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  value={duration}
                  onChange={(e) => { setDuration(e.target.value); markDirty(); }}
                  className={inputClass}
                  placeholder="e.g. 30 min"
                />
              </div>
            </div>
            <button
              onClick={() => onNavigateInto(svc.id)}
              className="w-full px-4 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
            >
              {hasChildren ? 'Edit action buttons inside →' : '+ Add action buttons below this page'}
            </button>
          </div>
        )}

        {/* ── Ask questions (Form builder) ── */}
        {beh === 'ask_questions' && (
          <FormStepBuilder
            steps={steps}
            onChange={(newSteps) => { setSteps(newSteps); markDirty(); }}
            services={services}
          />
        )}

        {/* ── Do something (Action) ── */}
        {beh === 'direct_action' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">What should happen?</label>
            <div className="space-y-2">
              {ACTIONS.map((a) => (
                <label
                  key={a.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    action === a.value
                      ? 'border-[#075e54] bg-emerald-50/60'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="action"
                    checked={action === a.value}
                    onChange={() => { setAction(a.value); setActionConfig({}); markDirty(); }}
                    className="accent-[#075e54]"
                  />
                  <span>{a.icon}</span>
                  <span className="text-sm text-gray-800">{a.label}</span>
                </label>
              ))}
            </div>

            {/* Config fields for phone/link */}
            {ACTIONS.filter(a => a.configKey && action === a.value).map(a => (
              <div key={a.value}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{a.configLabel}</label>
                <input
                  value={actionConfig[a.configKey] || ''}
                  onChange={(e) => { setActionConfig({ ...actionConfig, [a.configKey]: e.target.value }); markDirty(); }}
                  className={inputClass}
                  placeholder={a.placeholder}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => onDelete(svc.id)}
          className="px-3 py-2 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
        >
          Delete
        </button>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="px-5 py-2 text-sm font-medium bg-[#075e54] text-white rounded-xl hover:bg-[#064e46] disabled:opacity-40 cursor-pointer transition-all shadow-sm btn-press"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

/* ─── Form Step Builder ──────────────────────────────────── */

function FormStepBuilder({ steps, onChange, services }) {
  const addStep = () => {
    onChange([...steps, { question: '', answerType: 'text', options: [], allowManual: false }]);
  };

  const updateStep = (idx, field, value) => {
    const updated = [...steps];
    updated[idx] = { ...updated[idx], [field]: value };
    // When switching to service_select, initialize serviceSource
    if (field === 'answerType' && value === 'service_select' && !updated[idx].serviceSource) {
      updated[idx].serviceSource = { type: 'all_leaves' };
    }
    onChange(updated);
  };

  const updateServiceSource = (idx, sourceType, branchId) => {
    const updated = [...steps];
    updated[idx] = {
      ...updated[idx],
      serviceSource: sourceType === 'branch'
        ? { type: 'branch', branchId }
        : { type: 'all_leaves' },
    };
    onChange(updated);
  };

  const removeStep = (idx) => {
    onChange(steps.filter((_, i) => i !== idx));
  };

  const moveStep = (idx, dir) => {
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= steps.length) return;
    const updated = [...steps];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    onChange(updated);
  };

  const addOption = (stepIdx) => {
    const updated = [...steps];
    updated[stepIdx] = { ...updated[stepIdx], options: [...(updated[stepIdx].options || []), ''] };
    onChange(updated);
  };

  const updateOption = (stepIdx, optIdx, value) => {
    const updated = [...steps];
    const opts = [...(updated[stepIdx].options || [])];
    opts[optIdx] = value;
    updated[stepIdx] = { ...updated[stepIdx], options: opts };
    onChange(updated);
  };

  const removeOption = (stepIdx, optIdx) => {
    const updated = [...steps];
    updated[stepIdx] = { ...updated[stepIdx], options: updated[stepIdx].options.filter((_, i) => i !== optIdx) };
    onChange(updated);
  };

  const branches = getServiceBranches(services || []);

  return (
    <div className="space-y-4">
      <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
        <p className="text-xs text-purple-700">Build your form as a conversation. Each step is a question the customer answers in chat.</p>
      </div>

      {steps.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm mb-2">No questions yet</p>
          <button onClick={addStep} className="px-4 py-2 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
            + Add first question
          </button>
        </div>
      )}

      {steps.map((step, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Step header */}
          <div className="bg-gray-50 px-3 py-2 flex items-center gap-2 border-b border-gray-100">
            <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">{idx + 1}</span>
            <span className="text-xs font-medium text-gray-600 flex-1">Question</span>
            <div className="flex gap-0.5">
              <button onClick={() => moveStep(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
              </button>
              <button onClick={() => moveStep(idx, 'down')} disabled={idx === steps.length - 1} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
              <button onClick={() => removeStep(idx)} className="p-1 text-red-400 hover:text-red-600 cursor-pointer ml-1">✕</button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Question text */}
            <input
              value={step.question}
              onChange={(e) => updateStep(idx, 'question', e.target.value)}
              className={inputClass}
              placeholder="What do you want to ask?"
            />

            {/* Answer type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">How should the customer answer?</label>
              <div className="grid grid-cols-2 gap-1.5">
                {ANSWER_TYPES.map((at) => (
                  <button
                    key={at.value}
                    type="button"
                    onClick={() => updateStep(idx, 'answerType', at.value)}
                    className={`p-2 rounded-lg text-center text-[11px] font-medium border cursor-pointer transition-all ${
                      step.answerType === at.value
                        ? 'border-purple-400 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-base mb-0.5">{at.icon}</div>
                    {at.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Options for select/hybrid */}
            {(step.answerType === 'select' || step.answerType === 'hybrid') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Options</label>
                <div className="space-y-1.5">
                  {(step.options || []).map((opt, oi) => (
                    <div key={oi} className="flex gap-1.5">
                      <input
                        value={opt}
                        onChange={(e) => updateOption(idx, oi, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500/30 focus:border-purple-400 outline-none"
                        placeholder={`Option ${oi + 1}`}
                      />
                      <button type="button" onClick={() => removeOption(idx, oi)} className="px-2 text-red-400 hover:text-red-600 cursor-pointer text-xs">✕</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(idx)}
                    className="w-full py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 hover:text-purple-600 hover:border-purple-300 cursor-pointer transition-colors"
                  >
                    + Add option
                  </button>
                </div>
              </div>
            )}

            {/* Service select configuration */}
            {step.answerType === 'service_select' && (
              <ServiceSourcePicker
                step={step}
                branches={branches}
                services={services || []}
                onChangeSource={(sourceType, branchId) => updateServiceSource(idx, sourceType, branchId)}
              />
            )}

            {/* Hybrid: allow manual */}
            {step.answerType === 'hybrid' && (
              <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={step.allowManual ?? false}
                  onChange={(e) => updateStep(idx, 'allowManual', e.target.checked)}
                  className="accent-purple-600 rounded"
                />
                <span className="text-xs text-gray-700">Allow customer to type their own answer</span>
              </label>
            )}
          </div>
        </div>
      ))}

      {steps.length > 0 && (
        <button
          type="button"
          onClick={addStep}
          className="w-full py-2.5 border-2 border-dashed border-purple-200 rounded-xl text-sm text-purple-500 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50/50 cursor-pointer transition-all"
        >
          + Add another question
        </button>
      )}
    </div>
  );
}

/* ─── Service Source Picker ───────────────────────────────── */

function ServiceSourcePicker({ step, branches, services, onChangeSource }) {
  const source = step.serviceSource || { type: 'all_leaves' };
  const resolvedOptions = getServiceOptionsForStep(step, services);

  return (
    <div className="space-y-3">
      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
        <p className="text-xs text-emerald-700 mb-0.5 font-medium">🛍️ Services from your WhatsApp Builder</p>
        <p className="text-[11px] text-emerald-600">Options will update automatically when you change your services.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Which services should the customer choose from?</label>
        <div className="space-y-1.5">
          <label
            className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
              source.type === 'all_leaves'
                ? 'border-emerald-400 bg-emerald-50/60 ring-1 ring-emerald-400/20'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name={`svc-source-${step.question}`}
              checked={source.type === 'all_leaves'}
              onChange={() => onChangeSource('all_leaves')}
              className="accent-emerald-600"
            />
            <div>
              <span className="text-xs font-medium text-gray-800">All services</span>
              <p className="text-[11px] text-gray-500">Every final service you&apos;ve created</p>
            </div>
          </label>

          {branches.length > 0 && (
            <label
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                source.type === 'branch'
                  ? 'border-emerald-400 bg-emerald-50/60 ring-1 ring-emerald-400/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={`svc-source-${step.question}`}
                checked={source.type === 'branch'}
                onChange={() => onChangeSource('branch', branches[0]?.id)}
                className="accent-emerald-600 mt-0.5"
              />
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-800">From a specific category</span>
                <p className="text-[11px] text-gray-500 mb-1.5">Only services inside one category</p>
                {source.type === 'branch' && (
                  <select
                    value={source.branchId || ''}
                    onChange={(e) => onChangeSource('branch', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-400/30 focus:border-emerald-400 outline-none bg-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Preview of resolved options */}
      {resolvedOptions.length > 0 ? (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Customer will see these options ({resolvedOptions.length}):
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {resolvedOptions.map(svc => (
              <div key={svc.id} className="px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-700 flex items-center gap-2">
                <span className="text-emerald-500">●</span>
                {svc.name}
                {svc.price != null && <span className="text-gray-400 ml-auto">${svc.price}</span>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
          <p className="text-xs text-amber-700">No services found. Add services in the builder first, then they&apos;ll appear here automatically.</p>
        </div>
      )}
    </div>
  );
}
