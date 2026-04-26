import { useState, useEffect, useCallback } from 'react';
import PhoneMockup from '../components/PhoneMockup';
import EditorPanel from '../components/EditorPanel';
import { TEMPLATES } from '../lib/templates';
import ChangeTemplateModal from '../components/ChangeTemplateModal';
import { fetchBusiness, createBusiness, applyTemplate, loadBuilder, saveBuilder, submitForm, fetchStaff } from '../lib/api';

// ── Helpers to work with nested button tree ──

let nextId = 100;
function genId() { return nextId++; }

// ── localStorage cache helpers ──
const LS_KEY = 'nabzchat_builder_';
function cacheBuilderState(businessId, welcomeMessage, buttons, flowId) {
  try {
    localStorage.setItem(LS_KEY + businessId, JSON.stringify({ welcomeMessage, buttons, flowId, ts: Date.now() }));
  } catch (e) { /* storage full — ignore */ }
}
function loadCachedState(businessId) {
  try {
    const raw = localStorage.getItem(LS_KEY + businessId);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function findButton(buttons, id) {
  for (const btn of buttons) {
    if (btn.id === id) return btn;
    if (btn.children) {
      const found = findButton(btn.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateButton(buttons, id, updater) {
  return buttons.map((btn) => {
    if (btn.id === id) return updater(btn);
    if (btn.children) return { ...btn, children: updateButton(btn.children, id, updater) };
    return btn;
  });
}

function getButtonsAtPath(buttons, path) {
  let current = buttons;
  for (const id of path) {
    const parent = current.find((b) => b.id === id);
    if (!parent || !parent.children) return [];
    current = parent.children;
  }
  return current;
}

function setButtonsAtPath(buttons, path, newChildren) {
  if (path.length === 0) return newChildren;
  const parentId = path[0];
  return buttons.map((btn) => {
    if (btn.id === parentId) {
      if (path.length === 1) return { ...btn, children: newChildren };
      return { ...btn, children: setButtonsAtPath(btn.children || [], path.slice(1), newChildren) };
    }
    return btn;
  });
}

function syncNextId(buttons) {
  for (const btn of buttons) {
    if (btn.id >= nextId) nextId = btn.id + 1;
    if (btn.children) syncNextId(btn.children);
  }
}

function findPathToButton(buttons, targetId, currentPath = []) {
  for (const btn of buttons) {
    if (btn.id === targetId) return currentPath;
    if (btn.children && btn.children.length > 0) {
      const found = findPathToButton(btn.children, targetId, [...currentPath, btn.id]);
      if (found) return found;
    }
  }
  return null;
}

export default function BuilderPage({ businessId, setBusinessId }) {
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [buttons, setButtons] = useState([]);
  const [selectedButtonId, setSelectedButtonId] = useState(null);
  const [path, setPath] = useState([]);
  const [viewingInfoId, setViewingInfoId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showChangeTemplate, setShowChangeTemplate] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [flowId, setFlowId] = useState(null);
  const [submissionToast, setSubmissionToast] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [businessName, setBusinessName] = useState('Your Business');
  const [channel, setChannel] = useState('whatsapp');

  const visibleButtons = getButtonsAtPath(buttons, path);
  const selectedButton = selectedButtonId ? findButton(buttons, selectedButtonId) : null;
  const parentButton = path.length > 0 ? findButton(buttons, path[path.length - 1]) : null;
  const viewingInfoButton = viewingInfoId ? findButton(buttons, viewingInfoId) : null;

  useEffect(() => {
    if (businessId) {
      loadBuilder(businessId).then((data) => {
        if (data.business?.name) setBusinessName(data.business.name);
        setWelcomeMessage(data.welcomeMessage);
        setButtons(data.buttons);
        syncNextId(data.buttons);
        if (data.flow) setFlowId(data.flow.id);
        cacheBuilderState(businessId, data.welcomeMessage, data.buttons, data.flow?.id);
        setLoaded(true);
      }).catch(() => {
        // Fallback: try localStorage cache
        const cached = loadCachedState(businessId);
        if (cached) {
          setWelcomeMessage(cached.welcomeMessage);
          setButtons(cached.buttons || []);
          syncNextId(cached.buttons || []);
          if (cached.flowId) setFlowId(cached.flowId);
        }
        setLoaded(true);
      });
    } else {
      setLoaded(true);
    }
  }, [businessId]);

  // Load staff for delivery resolution
  useEffect(() => {
    if (businessId) {
      fetchStaff(businessId).then((list) => setStaffList(list || []));
    }
  }, [businessId]);

  // Handle submission from PhoneMockup flow confirm
  const handleFlowSubmit = useCallback(async (submissionData) => {
    if (!businessId) {
      setSubmissionToast('❌ No business loaded — cannot save submission');
      setTimeout(() => setSubmissionToast(null), 4000);
      return;
    }

    // Build data object for API (clean — no internal fields)
    const data = { ...submissionData.answers };

    try {
      const result = await submitForm(
        businessId,
        data,
        flowId,
        submissionData.deliveryMethod || 'none',
        submissionData.deliveryStaffId || null
      );
      setSubmissionToast(`✅ Submission #${result.data?.id || ''} saved!`);
      setTimeout(() => setSubmissionToast(null), 3000);
    } catch (err) {
      console.error('Failed to save submission:', err);
      setSubmissionToast(`❌ Failed to save: ${err.message}`);
      setTimeout(() => setSubmissionToast(null), 5000);
    }
  }, [businessId, flowId]);

  function handleSelectButton(id) {
    const newId = id === selectedButtonId ? null : id;
    setSelectedButtonId(newId);
    setSaveStatus(null);
    setErrorMessage('');
    if (newId) {
      const btn = findButton(buttons, newId);
      if (btn && btn.behavior === 'info') {
        setViewingInfoId(newId);
      } else {
        setViewingInfoId(null);
      }
    } else {
      setViewingInfoId(null);
    }
  }

  function handleDrillIn(id) {
    const btn = findButton(buttons, id);
    if (!btn) return;
    if (btn.behavior === 'menu') {
      setPath((prev) => [...prev, id]);
      setSelectedButtonId(null);
      setViewingInfoId(null);
      setSaveStatus(null);
      setErrorMessage('');
    } else if (btn.behavior === 'info') {
      setViewingInfoId(id);
      setSelectedButtonId(null);
      setSaveStatus(null);
      setErrorMessage('');
    }
  }

  function handleCloseInfoPreview() { setViewingInfoId(null); }

  function handleGoBack() {
    setPath((prev) => prev.slice(0, -1));
    setSelectedButtonId(null);
    setSaveStatus(null);
    setErrorMessage('');
  }

  function handleUpdateButton(id, updates) {
    setSaveStatus(null);
    setButtons((prev) => updateButton(prev, id, (b) => ({ ...b, ...updates })));
  }

  function handleReorderButtons(fromIndex, toIndex) {
    setSaveStatus(null);
    const reordered = [...visibleButtons];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    if (path.length === 0) {
      setButtons(reordered);
    } else {
      setButtons((prev) => setButtonsAtPath(prev, path, reordered));
    }
  }

  function handleNavigateTo(target) {
    if (target === 'home') {
      setPath([]); setViewingInfoId(null); setSelectedButtonId(null);
    } else if (target === 'parent') {
      setViewingInfoId(null); handleGoBack();
    } else {
      const targetId = parseInt(target, 10);
      const btn = findButton(buttons, targetId);
      if (!btn) return;
      const pathTo = findPathToButton(buttons, targetId);
      if (pathTo === null) return;
      setViewingInfoId(null); setSelectedButtonId(null);
      if (btn.behavior === 'menu') { setPath([...pathTo, targetId]); }
      else if (btn.behavior === 'info') { setPath(pathTo); setViewingInfoId(targetId); }
      else { setPath(pathTo); }
    }
  }

  function handleBehaviorChange(behavior) {
    const btn = findButton(buttons, selectedButtonId);
    if (!btn) return;
    if (btn.children && btn.children.length > 0 && behavior !== 'menu') {
      setErrorMessage(`"${btn.label}" has sub-options. You need to remove sub-options before changing this button's behavior.`);
      setSaveStatus('error');
      return;
    }
    setErrorMessage(''); setSaveStatus(null);
    if (behavior === 'info') { setViewingInfoId(selectedButtonId); } else { setViewingInfoId(null); }
    setButtons((prev) => updateButton(prev, selectedButtonId, (b) => {
      const updated = { ...b, behavior, children: behavior === 'menu' ? (b.children || []) : [] };
      if (behavior === 'info' && !b.infoPage) {
        updated.infoPage = {
          title: b.label, description: '', amount: '', currency: 'USD', duration: '', style: 'clean',
          showPrice: true, showDuration: true,
          actionButtons: [{ id: genId(), label: 'Reserve' }, { id: genId(), label: 'Back' }],
        };
      }
      return updated;
    }));
  }

  function handleAddChild() {
    if (!selectedButton || selectedButton.behavior !== 'menu') return;
    const newChild = { id: genId(), label: 'New option', behavior: null, children: [] };
    setButtons((prev) => updateButton(prev, selectedButtonId, (b) => ({
      ...b, children: [...(b.children || []), newChild],
    })));
  }

  function handleDeleteButton(id) {
    const btn = findButton(buttons, id);
    if (!btn) return;
    const hasData = (btn.children && btn.children.length > 0) || (btn.flowSteps && btn.flowSteps.length > 0) || btn.infoPage;
    if (hasData) { if (!window.confirm('Are you sure you want to delete this button?')) return; }
    if (selectedButtonId === id) { setSelectedButtonId(null); setViewingInfoId(null); }
    setSaveStatus(null);
    const removeButton = (btns) => btns.filter((b) => b.id !== id).map((b) => b.children ? { ...b, children: removeButton(b.children) } : b);
    setButtons((prev) => removeButton(prev));
  }

  function handleAddButton() {
    const newBtn = { id: genId(), label: 'New button', behavior: null, children: [] };
    if (path.length === 0) { setButtons((prev) => [...prev, newBtn]); }
    else { setButtons((prev) => setButtonsAtPath(prev, path, [...visibleButtons, newBtn])); }
  }

  async function handleLoadTemplate(templateKey) {
    const tpl = TEMPLATES.find((t) => t.key === templateKey);
    if (!tpl) return;
    try {
      setErrorMessage(''); setSaveStatus(null);
      const templateData = JSON.parse(JSON.stringify(tpl.load())); // safe clone
      let activeId = businessId;
      if (activeId) {
        try {
          // Apply template to existing business (preserves staff, settings, submissions)
          await applyTemplate(activeId, templateKey, templateData);
        } catch (err) {
          if (err.message === 'Access denied' || err.message?.includes('Access denied')) {
            // businessId belongs to a different user (stale state) — create a fresh one
            activeId = null;
          } else {
            throw err;
          }
        }
      }
      if (!activeId) {
        // No business yet (or stale id cleared above) — create one
        const biz = await createBusiness(templateKey, tpl.name, templateData);
        activeId = biz.id;
        setBusinessId(activeId);
      }
      const data = await loadBuilder(activeId);
      setWelcomeMessage(data.welcomeMessage);
      setButtons(data.buttons);
      syncNextId(data.buttons);
      if (data.flow) setFlowId(data.flow.id);
      cacheBuilderState(activeId, data.welcomeMessage, data.buttons, data.flow?.id);
      setSelectedButtonId(null); setPath([]); setViewingInfoId(null); setSaveStatus(null); setErrorMessage('');
    } catch (err) {
      console.error('Failed to load template:', err);
      setErrorMessage(err.message || 'Failed to load template');
      setSaveStatus('error');
    }
  }

  async function handleTemplateApplied(templateKey, templateName) {
    // Reload builder after template change
    const data = await loadBuilder(businessId);
    setWelcomeMessage(data.welcomeMessage);
    setButtons(data.buttons);
    syncNextId(data.buttons);
    if (data.flow) setFlowId(data.flow.id);
    setSelectedButtonId(null); setPath([]); setViewingInfoId(null);
    setErrorMessage(''); setSaveStatus(null);
  }

  async function handleSave() {
    if (!businessId) { setErrorMessage('No business loaded. Pick a template first.'); setSaveStatus('error'); return; }
    if (!welcomeMessage || !welcomeMessage.trim()) { setErrorMessage('Welcome message is required.'); setSaveStatus('error'); return; }
    setSaving(true); setSaveStatus(null); setErrorMessage('');
    try {
      await saveBuilder(businessId, welcomeMessage, buttons);
      cacheBuilderState(businessId, welcomeMessage, buttons, flowId);
      setSaveStatus('saved');
    } catch (err) {
      cacheBuilderState(businessId, welcomeMessage, buttons, flowId);
      setErrorMessage(err.message || 'Failed to save'); setSaveStatus('error');
    } finally { setSaving(false); }
  }

  if (!loaded) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading builder…</div>;
  }

  // Contextual tip based on current state + channel
  const channelName = channel === 'whatsapp' ? 'WhatsApp' : channel === 'telegram' ? 'Telegram' : 'Instagram';
  const contextTip = (() => {
    if (selectedButton) {
      if (selectedButton.behavior === 'info') return `Set up this info page — customers on ${channelName} will see the title, description, price, and action buttons.`;
      if (selectedButton.behavior === 'menu') return `This button opens a sub-menu on ${channelName}. Configure the label and manage sub-options below.`;
      return `Choose what this button does on ${channelName} — show information or open more options.`;
    }
    if (path.length > 0 && parentButton) return `Editing sub-options inside "${parentButton.label}". Click any option to configure it.`;
    return `Click any button on the ${channelName} preview to configure it. ${channel === 'whatsapp' ? 'Max 10 buttons.' : channel === 'instagram' ? 'Max 13 quick replies.' : 'Unlimited inline buttons.'}`;
  })();

  return (
    <div style={{ minHeight: '100%', position: 'relative' }} className="bg-slate-100">
      {/* Submission toast */}
      {submissionToast && (
        <div className="fixed top-5 right-5 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-black/20 animate-[fadeIn_0.3s]">
          {submissionToast}
        </div>
      )}

      {/* Save bar with contextual tip */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
        {/* [ADDED: mobile-responsive] hide tip on mobile to keep Save button visible */}
        <div className="flex-1 text-xs text-slate-500 leading-relaxed hidden sm:block">
          💡 {contextTip}
        </div>
        {saveStatus === 'saved' && <span className="text-sm text-indigo-600 font-medium whitespace-nowrap">✓ Saved</span>}
        {saveStatus === 'error' && <span className="text-sm text-red-500 max-w-xs truncate">{errorMessage}</span>}
        <button
          className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* [ADDED: mobile-responsive] stack PhoneMockup + EditorPanel vertically on mobile, side-by-side on lg+ */}
      <div className="flex flex-col lg:flex-row items-start gap-6 p-4 lg:p-8 w-full">
        <PhoneMockup
          businessName={businessName}
          businessId={businessId}
          channel={channel}
          onChannelChange={setChannel}
          welcomeMessage={welcomeMessage}
          buttons={visibleButtons}
          selectedButtonId={selectedButtonId}
          onButtonClick={handleSelectButton}
          onButtonDoubleClick={handleDrillIn}
          onAddButton={handleAddButton}
          parentButton={parentButton}
          onGoBack={handleGoBack}
          path={path}
          viewingInfoButton={viewingInfoButton}
          onCloseInfoPreview={handleCloseInfoPreview}
          onReorderButtons={handleReorderButtons}
          allButtons={buttons}
          onNavigateTo={handleNavigateTo}
          onDeleteButton={handleDeleteButton}
          onSubmit={handleFlowSubmit}
        />
        <EditorPanel
          welcomeMessage={welcomeMessage}
          onWelcomeChange={(msg) => { setWelcomeMessage(msg); setSaveStatus(null); }}
          selectedButton={selectedButton}
          onBehaviorChange={handleBehaviorChange}
          onBack={() => { setSelectedButtonId(null); setErrorMessage(''); setSaveStatus(null); }}
          errorMessage={saveStatus === 'error' ? errorMessage : ''}
          onAddChild={handleAddChild}
          path={path}
          parentButton={parentButton}
          visibleButtons={visibleButtons}
          onAddButton={handleAddButton}
          onSelectButton={handleSelectButton}
          onUpdateButton={handleUpdateButton}
          genId={genId}
          onReorderButtons={handleReorderButtons}
          allButtons={buttons}
          templates={TEMPLATES}
          onLoadTemplate={handleLoadTemplate}
          onChangeTemplate={() => { console.log('CHANGE TEMPLATE CLICKED', showChangeTemplate); setShowChangeTemplate(true); console.log('SET TO TRUE'); }}
          businessId={businessId}
          flowId={flowId}
          onGoBack={handleGoBack}
          channel={channel}
        />
      </div>
    {showChangeTemplate && (
      <ChangeTemplateModal
        businessId={businessId}
        businessName={businessName}
        onClose={() => setShowChangeTemplate(false)}
        onApplied={async (templateKey, templateName) => {
          const data = await loadBuilder(businessId);
          setWelcomeMessage(data.welcomeMessage);
          setButtons(data.buttons);
          syncNextId(data.buttons);
          if (data.flow) setFlowId(data.flow.id);
          setSelectedButtonId(null); setPath([]); setViewingInfoId(null);
          setErrorMessage(''); setSaveStatus(null);
          setShowChangeTemplate(false);
        }}
      />
    )}
    </div>
  );
}
