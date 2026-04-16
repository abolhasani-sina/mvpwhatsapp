import { useState, useEffect, useCallback, useRef } from 'react';
import { servicesApi, menuApi, flowsApi, sessionsApi, whatsappApi, assignmentRulesApi } from '../services/api';
import { FLOW_TEMPLATES, TEMPLATE_CATEGORIES } from '../lib/flowTemplates';

// ─── Constants ─────────────────────────────────────────────────
const STEP_TYPES = [
  { value: 'text_input', label: 'Text Answer', icon: '✏️' },
  { value: 'number_input', label: 'Number', icon: '🔢' },
  { value: 'select_option', label: 'Options', icon: '📋' },
  { value: 'select_service', label: 'Pick a Service', icon: '🛍️' },
  { value: 'select_date', label: 'Date', icon: '📅' },
  { value: 'select_time', label: 'Time', icon: '🕐' },
];

const ACTION_TYPES = [
  { value: 'START_FLOW', label: 'Start a Conversation', icon: '💬' },
  { value: 'QUICK_ACTION', label: 'Quick Action', icon: '⚡' },
  { value: 'OPEN_SUBMENU', label: 'Open Submenu', icon: '📂' },
  { value: 'SHOW_INFO', label: 'Show Info', icon: 'ℹ️' },
];

const QUICK_ACTION_TYPES = [
  { value: 'show_phone', label: 'Show Phone', icon: '📞' },
  { value: 'show_location', label: 'Show Location', icon: '📍' },
  { value: 'open_link', label: 'Open Link', icon: '🔗' },
];

// Flow templates imported from lib/flowTemplates.js

const WIZARD_TABS = [
  { num: 1, label: 'Services', icon: '🛍️' },
  { num: 2, label: 'Flows', icon: '💬' },
  { num: 3, label: 'Menu', icon: '📋' },
  { num: 4, label: 'Test', icon: '📱' },
];

let _counter = Date.now();
const uid = () => `local-${_counter++}`;

function parseConfig(val) {
  if (!val) return {};
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return {}; }
}

// ─── Tree utility functions ────────────────────────────────────
function treeNodeToButton(node, loadedFlows) {
  const label = node.title || node.label || '';
  if (node.type === 'flow_entry') {
    const matchedFlow = loadedFlows.find(f => f.id === node.flow_id) ||
      loadedFlows.find(f => f.name === label);
    return { localId: uid(), label, action_type: 'START_FLOW', action_value: matchedFlow?.localId || '', children: [] };
  }
  if (node.type === 'action') {
    return { localId: uid(), label, action_type: 'QUICK_ACTION', action_value: node.action_type || 'show_phone', children: [] };
  }
  if (node.type === 'info') {
    return { localId: uid(), label, action_type: 'SHOW_INFO', action_value: '', children: [] };
  }
  if (node.type === 'menu') {
    return {
      localId: uid(), label, action_type: 'OPEN_SUBMENU', action_value: '',
      children: (node.children || []).map(c => treeNodeToButton(c, loadedFlows)),
    };
  }
  return { localId: uid(), label, action_type: 'START_FLOW', action_value: '', children: [] };
}

function updateInTree(tree, localId, field, value) {
  return tree.map(node => {
    if (node.localId === localId) return { ...node, [field]: value };
    if (node.children?.length) return { ...node, children: updateInTree(node.children, localId, field, value) };
    return node;
  });
}

function removeFromTree(tree, localId) {
  return tree.filter(n => n.localId !== localId).map(n => ({
    ...n, children: n.children ? removeFromTree(n.children, localId) : [],
  }));
}

function addChildToTree(tree, parentId, child) {
  return tree.map(node => {
    if (node.localId === parentId) return { ...node, children: [...(node.children || []), child] };
    if (node.children?.length) return { ...node, children: addChildToTree(node.children, parentId, child) };
    return node;
  });
}

function moveBtnInTree(tree, localId, direction) {
  const idx = tree.findIndex(n => n.localId === localId);
  if (idx !== -1) {
    const target = idx + direction;
    if (target < 0 || target >= tree.length) return tree;
    const copy = [...tree];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    return copy;
  }
  return tree.map(n => ({ ...n, children: n.children ? moveBtnInTree(n.children, localId, direction) : [] }));
}

async function publishMenuButtons(parentId, btns, flowIdMap) {
  let sortOrder = 0;
  for (const btn of btns) {
    if (btn.action_type === 'OPEN_SUBMENU') {
      const res = await menuApi.create({ label: btn.label, node_type: 'menu', parent_id: parentId, sort_order: sortOrder++ });
      const submenuId = res.data.data.id;
      if (btn.children?.length) await publishMenuButtons(submenuId, btn.children, flowIdMap);
    } else if (btn.action_type === 'START_FLOW') {
      const realFlowId = flowIdMap[btn.action_value];
      if (realFlowId) {
        await menuApi.create({ label: btn.label, node_type: 'flow_entry', parent_id: parentId, sort_order: sortOrder++, flow_id: realFlowId });
      }
    } else if (btn.action_type === 'QUICK_ACTION') {
      await menuApi.create({ label: btn.label, node_type: 'action', parent_id: parentId, sort_order: sortOrder++, action_type: btn.action_value || 'show_phone' });
    } else if (btn.action_type === 'SHOW_INFO') {
      await menuApi.create({ label: btn.label, node_type: 'info', parent_id: parentId, sort_order: sortOrder++ });
    }
  }
}

// ─── Main Component ────────────────────────────────────────────
export default function ConversationBuilder() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasUnpublished, setHasUnpublished] = useState(false);

  // Data
  const [services, setServices] = useState([]);
  const [flows, setFlows] = useState([]);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [buttons, setButtons] = useState([]);

  // Flow editor + wizard
  const [editingFlowId, setEditingFlowId] = useState(null);
  const [showFlowWizard, setShowFlowWizard] = useState(false);
  const loadedRef = useRef(false);

  // ── Load from backend ──────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [svcRes, flowsRes, treeRes] = await Promise.all([
        servicesApi.list(), flowsApi.list(), menuApi.getTree(),
      ]);

      // Services — with parent_id support
      setServices((svcRes.data.data || []).map(s => ({
        id: s.id, name: s.name, price: s.price, duration: s.duration || '',
        description: s.description || '', parent_id: s.parent_id || null, isNew: false,
      })));

      // Flows with steps
      const flowList = flowsRes.data.data || [];
      const loadedFlows = [];
      for (const f of flowList) {
        try {
          const detail = await flowsApi.get(f.id);
          const fd = detail.data.data;
          loadedFlows.push({
            id: fd.id, localId: fd.id, name: fd.name, isNew: false,
            steps: (fd.steps || [])
              .filter(s => s.type !== 'summary' && s.type !== 'confirm')
              .map(s => {
                const cfg = parseConfig(s.config);
                return {
                  localId: s.id, question_text: s.label, input_type: s.type,
                  is_required: s.is_required, options: cfg.options || [],
                  order: s.step_order,
                };
              }),
          });
        } catch { /* skip broken flows */ }
      }
      setFlows(loadedFlows);

      // Menu tree → welcome message + buttons (hierarchical)
      const tree = treeRes.data.data || [];
      if (tree.length > 0) {
        const root = tree[0];
        setWelcomeMessage(root.title || root.label || '');
        setButtons((root.children || []).map(c => treeNodeToButton(c, loadedFlows)));
      } else {
        setButtons([]);
        setWelcomeMessage('');
      }

      setHasUnpublished(false);
    } catch (err) {
      setError('Failed to load: ' + (err.response?.data?.error?.message || err.message));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) { loadedRef.current = true; loadData(); }
  }, [loadData]);

  // Track changes → mark unpublished
  const markDirty = () => setHasUnpublished(true);

  // ── Publish to backend ─────────────────────────────────────
  const publishAll = async () => {
    // Safety confirmation
    if (!window.confirm('Publish will update your live WhatsApp bot configuration. Continue?')) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    // Snapshot current data for rollback messaging
    const steps = ['Clearing old data', 'Creating services', 'Creating flows', 'Building menu', 'Going live'];
    let currentStep = 0;

    try {
      // Phase 1: Delete existing data — capture old IDs first for rule remapping
      currentStep = 0;
      const [existTree, existFlows, existSvcs] = await Promise.all([
        menuApi.getTree(), flowsApi.list(), servicesApi.list(),
      ]);
      const oldServices = existSvcs.data.data || [];
      const oldFlows = existFlows.data.data || [];
      // Delete in correct order: menu first (references flows), then flows, then services
      for (const n of (existTree.data.data || [])) await menuApi.delete(n.id);
      for (const f of oldFlows) await flowsApi.delete(f.id);
      for (const s of oldServices) await servicesApi.delete(s.id);

      // Phase 2: Create services (topological order — parents before children, any depth)
      currentStep = 1;
      const serviceIdMap = {};
      const publishServicesRecursive = async (parentLocalId, realParentId) => {
        const children = services.filter(s => (s.parent_id || null) === parentLocalId);
        for (const svc of children) {
          const localId = svc.id || svc.localId;
          const res = await servicesApi.create({
            name: svc.name || 'Untitled Service', description: svc.description,
            price: svc.price ? Number(svc.price) : null,
            duration: svc.duration || null, parent_id: realParentId,
          });
          serviceIdMap[localId] = res.data.data.id;
          await publishServicesRecursive(localId, res.data.data.id);
        }
      };
      await publishServicesRecursive(null, null);

      // Phase 3: Create flows + steps
      currentStep = 2;
      const flowIdMap = {};
      for (const flow of flows) {
        const fRes = await flowsApi.create({ name: flow.name || 'Untitled Flow', description: '', is_active: true });
        const realFlowId = fRes.data.data.id;
        flowIdMap[flow.localId] = realFlowId;

        let order = 1;
        for (const s of flow.steps) {
          const config = {};
          if (s.input_type === 'select_option') {
            if (s.options?.length) config.options = s.options;
          }
          if (s.input_type === 'select_date' || s.input_type === 'select_time') {
            if (s.options?.length) config.options = s.options;
          }
          await flowsApi.createStep(realFlowId, {
            type: s.input_type, label: s.question_text,
            step_order: order++, config, is_required: s.is_required !== false,
          });
        }
        // Auto-add summary + confirm
        await flowsApi.createStep(realFlowId, { type: 'summary', label: 'Review your answers', step_order: order++, config: {} });
        await flowsApi.createStep(realFlowId, { type: 'confirm', label: 'Confirm', step_order: order++, config: {} });
      }

      // Phase 4: Create menu tree (recursive — supports submenus)
      currentStep = 3;
      if (welcomeMessage || buttons.length > 0) {
        const rootRes = await menuApi.create({
          label: welcomeMessage || 'Hello 👋 How can we help you today?',
          node_type: 'menu', parent_id: null, sort_order: 0,
        });
        const rootId = rootRes.data.data.id;
        await publishMenuButtons(rootId, buttons, flowIdMap);
      }

      // Phase 4b: Remap assignment rule triggers (old entity IDs → new)
      const maps = {};
      // Build service remap by matching names
      const svcRemap = {};
      for (const oldSvc of oldServices) {
        const localSvc = services.find(s => s.name === oldSvc.name);
        if (localSvc) {
          const newId = serviceIdMap[localSvc.id || localSvc.localId];
          if (newId) svcRemap[oldSvc.id] = newId;
        }
      }
      if (Object.keys(svcRemap).length) maps.service = svcRemap;
      // Build flow remap by matching names
      const flowRemap = {};
      for (const oldFlow of oldFlows) {
        const localFlow = flows.find(f => f.name === oldFlow.name);
        if (localFlow) {
          const newId = flowIdMap[localFlow.localId];
          if (newId) flowRemap[oldFlow.id] = newId;
        }
      }
      if (Object.keys(flowRemap).length) maps.flow = flowRemap;
      if (Object.keys(maps).length) {
        await assignmentRulesApi.remapTriggers(maps).catch(() => {});
      }

      // Phase 5: Publish — clear sessions so simulator is fresh
      currentStep = 4;
      await sessionsApi.publish();

      setHasUnpublished(false);
      setSuccess('Published successfully! Your WhatsApp bot is now live. Go to the Test tab to try it.');
    } catch (err) {
      setError(`Publish failed at step "${steps[currentStep]}": ${err.response?.data?.error?.message || err.message}. Please try publishing again.`);
    } finally { setSaving(false); }
  };

  // ── Service helpers (recursive tree — unlimited depth) ────
  const addService = (parentId = null) => {
    markDirty();
    setServices(p => [...p, { localId: uid(), name: '', price: '', duration: '', description: '', parent_id: parentId, isNew: true }]);
  };
  const updateSvc = (id, f, v) => {
    markDirty();
    setServices(p => p.map(s => (s.id || s.localId) === id ? { ...s, [f]: v } : s));
  };
  const removeSvc = (id) => {
    markDirty();
    // Cascade remove all descendants at any depth
    const toRemove = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const s of services) {
        const sId = s.id || s.localId;
        if (!toRemove.has(sId) && toRemove.has(s.parent_id)) {
          toRemove.add(sId);
          changed = true;
        }
      }
    }
    setServices(p => p.filter(s => !toRemove.has(s.id || s.localId)));
  };

  // Recursive tree builders for services
  const getRootServices = () => services.filter(s => !s.parent_id);
  const getChildServices = (parentId) => services.filter(s => s.parent_id === parentId);

  // ── Flow helpers ───────────────────────────────────────────
  const createFlowFromTemplate = (template) => {
    markDirty();
    const f = {
      localId: uid(),
      name: template.key === 'empty' ? 'New Flow' : template.name,
      isNew: true,
      steps: template.steps.map(s => ({
        localId: uid(), question_text: s.question_text, input_type: s.input_type,
        is_required: true, options: s.options || [], order: 0,
      })),
    };
    setFlows(p => [...p, f]);
    setShowFlowWizard(false);
    setEditingFlowId(f.localId);
  };
  const updateFlowName = (lid, name) => { markDirty(); setFlows(p => p.map(f => f.localId === lid ? { ...f, name } : f)); };
  const removeFlow = (lid) => {
    markDirty();
    setFlows(p => p.filter(f => f.localId !== lid));
    if (editingFlowId === lid) setEditingFlowId(null);
  };
  const addStep = (fid) => { markDirty(); setFlows(p => p.map(f => f.localId !== fid ? f : {
    ...f, steps: [...f.steps, { localId: uid(), question_text: '', input_type: 'text_input', is_required: true, options: [], order: f.steps.length + 1 }],
  })); };
  const updateStep = (fid, sid, field, val) => { markDirty(); setFlows(p => p.map(f => f.localId !== fid ? f : {
    ...f, steps: f.steps.map(s => s.localId === sid ? { ...s, [field]: val } : s),
  })); };
  const removeStep = (fid, sid) => { markDirty(); setFlows(p => p.map(f => f.localId !== fid ? f : {
    ...f, steps: f.steps.filter(s => s.localId !== sid),
  })); };
  const moveStep = (fid, idx, dir) => { markDirty(); setFlows(p => p.map(f => {
    if (f.localId !== fid) return f;
    const steps = [...f.steps];
    const t = idx + dir;
    if (t < 0 || t >= steps.length) return f;
    [steps[idx], steps[t]] = [steps[t], steps[idx]];
    return { ...f, steps };
  })); };

  // ── Button helpers (tree structure) ─────────────────────────────
  const addButton = () => { markDirty(); setButtons(p => [...p, { localId: uid(), label: '', action_type: 'START_FLOW', action_value: '', children: [] }]); };
  const addChildButton = (parentId) => { markDirty(); setButtons(p => addChildToTree(p, parentId, { localId: uid(), label: '', action_type: 'START_FLOW', action_value: '', children: [] })); };
  const updateBtn = (localId, f, v) => { markDirty(); setButtons(p => updateInTree(p, localId, f, v)); };
  const removeBtn = (localId) => { markDirty(); setButtons(p => removeFromTree(p, localId)); };
  const moveBtn = (localId, d) => { markDirty(); setButtons(p => moveBtnInTree(p, localId, d)); };

  const editingFlow = flows.find(f => f.localId === editingFlowId);

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading your setup...</p>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Tab Bar */}
      <div className="flex items-center justify-center gap-1 mb-6">
        {WIZARD_TABS.map((t, i) => (
          <div key={t.num} className="flex items-center">
            {i > 0 && <div className={`h-0.5 w-8 sm:w-14 mx-1 rounded-full transition-colors ${step >= t.num ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
            <button onClick={() => setStep(t.num)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                step === t.num ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                : step > t.num ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Unpublished banner */}
      {hasUnpublished && (
        <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-xl border border-amber-200 flex items-center justify-between">
          <span>⚠️ You have unpublished changes. Publish to make them live.</span>
          <button onClick={publishAll} disabled={saving}
            className="px-4 py-1.5 bg-amber-600 text-white text-xs rounded-lg hover:bg-amber-700 transition cursor-pointer disabled:opacity-50">
            {saving ? 'Publishing...' : 'Publish Now'}
          </button>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 cursor-pointer ml-2">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-200 flex justify-between items-center">
          {success}
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600 cursor-pointer ml-2">✕</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           STEP 1 — SERVICES (with sub-categories)
       ══════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🛍️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Services</h1>
            <p className="text-gray-500 max-w-md mx-auto">Build your service tree — categories, services, and sub-services at any depth.</p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {getRootServices().map(svc => (
              <ServiceNode key={svc.id || svc.localId} svc={svc} depth={0}
                services={services} getChildServices={getChildServices}
                updateSvc={updateSvc} removeSvc={removeSvc} addService={addService} />
            ))}

            <button onClick={() => addService(null)}
              className="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all cursor-pointer font-medium">
              + Add Service / Category
            </button>

            {services.length === 0 && (
              <p className="text-center text-xs text-gray-400 mt-2">Services are optional — skip if your bot doesn&apos;t need them.</p>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           STEP 2 — FLOWS (list view + wizard)
       ══════════════════════════════════════════════════════════ */}
      {step === 2 && !editingFlow && !showFlowWizard && (
        <div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">💬</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Conversation Flows</h1>
            <p className="text-gray-500 max-w-md mx-auto">Each flow is a conversation your bot has with a customer.</p>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            {flows.map(f => (
              <div key={f.localId} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-4 group hover:border-purple-200 transition-all">
                <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">💬</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{f.name || 'Untitled Flow'}</div>
                  <div className="text-xs text-gray-400">{f.steps.length} question{f.steps.length !== 1 ? 's' : ''}</div>
                </div>
                <button onClick={() => setEditingFlowId(f.localId)}
                  className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all cursor-pointer">
                  Edit
                </button>
                <button onClick={() => removeFlow(f.localId)}
                  className="text-gray-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-all p-1 text-lg">✕</button>
              </div>
            ))}

            <button onClick={() => setShowFlowWizard(true)}
              className="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/30 transition-all cursor-pointer font-medium">
              + Create New Flow
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 — Flow Creation Wizard (Template Library) ─── */}
      {step === 2 && showFlowWizard && !editingFlow && (
        <TemplateLibrary
          onBack={() => setShowFlowWizard(false)}
          onSelect={createFlowFromTemplate}
        />
      )}

      {/* ── STEP 2 — Flow Editor (chat-style) ─────────────────── */}
      {step === 2 && editingFlow && (
        <div>
          <button onClick={() => setEditingFlowId(null)}
            className="mb-4 text-sm text-gray-500 hover:text-gray-700 cursor-pointer font-medium">
            ← Back to all flows
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-xl">💬</div>
              <input value={editingFlow.name} onChange={e => updateFlowName(editingFlow.localId, e.target.value)}
                className="text-lg font-bold bg-transparent border-none focus:outline-none text-gray-900 flex-1 placeholder-gray-300"
                placeholder="Flow name (e.g. Book Appointment)" />
            </div>
            <p className="text-xs text-gray-400 mb-6 ml-14">This flow asks questions step-by-step to collect info from the customer.</p>

            {/* Chat-style step list */}
            <div className="space-y-4 mb-6">
              {editingFlow.steps.map((s, idx) => (
                <div key={s.localId} className="relative">
                  {/* Bot message bubble */}
                  <div className="flex items-start gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0 mt-1">🤖</div>
                    <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-none p-4 border border-gray-100 hover:border-purple-200 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                        <input value={s.question_text}
                          onChange={e => updateStep(editingFlow.localId, s.localId, 'question_text', e.target.value)}
                          className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-300"
                          placeholder="What should the bot ask?" />
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveStep(editingFlow.localId, idx, -1)} disabled={idx === 0}
                            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-30 p-1">↑</button>
                          <button onClick={() => moveStep(editingFlow.localId, idx, 1)} disabled={idx === editingFlow.steps.length - 1}
                            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-30 p-1">↓</button>
                          <button onClick={() => removeStep(editingFlow.localId, s.localId)}
                            className="text-xs text-red-400 hover:text-red-600 cursor-pointer p-1">✕</button>
                        </div>
                      </div>

                      {/* Answer type */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-xs text-gray-400 mr-1">Answer:</span>
                        {STEP_TYPES.map(t => (
                          <button key={t.value}
                            onClick={() => updateStep(editingFlow.localId, s.localId, 'input_type', t.value)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              s.input_type === t.value
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                            }`}>
                            {t.icon} {t.label}
                          </button>
                        ))}
                        <label className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                          <input type="checkbox" checked={s.is_required !== false}
                            onChange={e => updateStep(editingFlow.localId, s.localId, 'is_required', e.target.checked)}
                            className="rounded w-3.5 h-3.5" />
                          Required
                        </label>
                      </div>

                      {/* Options for select_option, select_date, select_time */}
                      {(s.input_type === 'select_option' || s.input_type === 'select_date' || s.input_type === 'select_time') && (
                        <div className="mt-3 space-y-1.5">
                          <label className="block text-xs text-gray-500 ml-1">Options</label>
                          {(s.options || []).map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{oi + 1}.</span>
                              <input value={typeof opt === 'object' ? opt.label || '' : opt} onChange={e => {
                                const opts = [...(s.options || [])]; opts[oi] = e.target.value;
                                updateStep(editingFlow.localId, s.localId, 'options', opts);
                              }}
                                className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-300 min-w-0"
                                placeholder="Option text" />
                              <button onClick={() => {
                                const opts = (s.options || []).filter((_, i) => i !== oi);
                                updateStep(editingFlow.localId, s.localId, 'options', opts);
                              }} className="text-xs text-red-400 cursor-pointer">✕</button>
                              {oi > 0 && <button onClick={() => {
                                const opts = [...(s.options || [])]; [opts[oi - 1], opts[oi]] = [opts[oi], opts[oi - 1]];
                                updateStep(editingFlow.localId, s.localId, 'options', opts);
                              }} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">↑</button>}
                              {oi < (s.options || []).length - 1 && <button onClick={() => {
                                const opts = [...(s.options || [])]; [opts[oi], opts[oi + 1]] = [opts[oi + 1], opts[oi]];
                                updateStep(editingFlow.localId, s.localId, 'options', opts);
                              }} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">↓</button>}
                            </div>
                          ))}
                          <button onClick={() => updateStep(editingFlow.localId, s.localId, 'options', [...(s.options || []), ''])}
                            className="text-xs text-purple-600 cursor-pointer font-medium ml-5">+ Add option</button>
                          {(s.options || []).length === 0 && (
                            <p className="text-xs text-amber-600 ml-5">⚠️ Add at least one option</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => addStep(editingFlow.localId)}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/30 transition-all cursor-pointer font-medium">
              + Add Question
            </button>

            {editingFlow.steps.length === 0 && (
              <p className="text-center text-xs text-gray-400 mt-3">Add questions to build the conversation.</p>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           STEP 3 — MENU (Buttons) + Publish
       ══════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📋</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Main Menu</h1>
            <p className="text-gray-500 max-w-md mx-auto">Design the first message and buttons customers see on WhatsApp.</p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Welcome Message */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">👋 Welcome Message</label>
              <textarea value={welcomeMessage} onChange={e => { markDirty(); setWelcomeMessage(e.target.value); }}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none resize-none"
                rows={2} placeholder="Hello 👋 How can we help you today?" />
            </div>

            {/* Buttons */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">🔘 Menu Buttons</label>
              <p className="text-xs text-gray-400 mb-4">Each button does ONE thing. Customers tap to choose.</p>

              <div className="space-y-3">
                {buttons.map((btn, bi) => (
                  <MenuButtonEditor key={btn.localId} btn={btn} index={bi} siblingCount={buttons.length}
                    flows={flows} updateBtn={updateBtn} removeBtn={removeBtn} moveBtn={moveBtn} addChildButton={addChildButton} />
                ))}

                <button onClick={addButton}
                  className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all cursor-pointer font-medium">
                  + Add Button
                </button>
              </div>
            </div>

            {/* Mini Preview */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-5 mb-6">
              <p className="text-xs font-semibold text-emerald-700 mb-3">📱 Preview</p>
              <div className="bg-white rounded-xl p-4 shadow-sm max-w-xs">
                <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">{welcomeMessage || 'Hello 👋'}</p>
                <PreviewButtons buttons={buttons} />
              </div>
            </div>

            {/* Publish */}
            <div className="text-center">
              <button onClick={publishAll} disabled={saving}
                className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold text-base hover:shadow-xl hover:shadow-emerald-200 disabled:opacity-50 transition-all cursor-pointer btn-press">
                {saving ? 'Publishing...' : '🚀 Publish'}
              </button>
              <p className="text-xs text-gray-400 mt-3">Saves everything and makes your bot live. Sessions are reset automatically.</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           STEP 4 — LIVE TEST (Embedded Simulator with Reset)
       ══════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📱</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Your Bot</h1>
            <p className="text-gray-500 max-w-md mx-auto">Chat with your bot live. Uses your published data only.</p>
          </div>
          <ChatSimulator />
        </div>
      )}

      {/* Bottom Nav */}
      {!(step === 2 && (editingFlow || showFlowWizard)) && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                ← Back
              </button>
            )}
          </div>
          <div>
            {step < 4 && (
              <button onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all cursor-pointer shadow-sm">
                Next →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Template Library (categorized picker) ──────────────────
function TemplateLibrary({ onBack, onSelect }) {
  const [activeCategory, setActiveCategory] = useState(TEMPLATE_CATEGORIES[0].key);

  const categorizedTemplates = FLOW_TEMPLATES.filter(t => t.category === activeCategory);
  const blankTemplate = FLOW_TEMPLATES.find(t => t.key === 'empty');

  return (
    <div>
      <button onClick={onBack}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700 cursor-pointer font-medium">
        ← Back to flows
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🧙</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pick a Template</h1>
        <p className="text-gray-500 max-w-md mx-auto">Choose a ready-made flow and we&apos;ll set up the questions for you. You can edit them after.</p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {TEMPLATE_CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeCategory === cat.key
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300 hover:bg-purple-50'
            }`}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="grid gap-3 max-w-2xl mx-auto">
        {categorizedTemplates.map(t => (
          <button key={t.key} onClick={() => onSelect(t)}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 text-left hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-gray-900 text-base group-hover:text-purple-700">{t.name}</div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg flex-shrink-0 ml-3">
                {t.steps.length} step{t.steps.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm text-gray-500">{t.description}</p>
          </button>
        ))}

        {categorizedTemplates.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No templates in this category yet.</p>
        )}
      </div>

      {/* Start from scratch — always visible */}
      {blankTemplate && (
        <div className="max-w-2xl mx-auto mt-4">
          <button onClick={() => onSelect(blankTemplate)}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/30 transition-all cursor-pointer font-medium">
            📝 Start from Scratch — build your own flow
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Recursive ServiceNode editor for unlimited depth ────────
function ServiceNode({ svc, depth, services, getChildServices, updateSvc, removeSvc, addService }) {
  const svcId = svc.id || svc.localId;
  const children = getChildServices(svcId);
  const depthColors = ['bg-emerald-100', 'bg-purple-100', 'bg-pink-100', 'bg-amber-100', 'bg-teal-100'];
  const iconBg = depthColors[depth % depthColors.length];
  const hasChildren = children.length > 0;

  return (
    <div className={`${depth > 0 ? 'bg-gray-50 rounded-xl p-4 border border-gray-100' : 'bg-white rounded-2xl shadow-sm border border-gray-200 p-5'} group/svc hover:border-emerald-200 transition-all`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center text-sm flex-shrink-0 mt-0.5`}>
          {hasChildren ? '📁' : '🛍️'}
        </div>
        <div className="flex-1 space-y-3">
          <input value={svc.name} onChange={e => updateSvc(svcId, 'name', e.target.value)}
            className="w-full text-sm font-semibold bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-300"
            placeholder={depth === 0 ? 'Service or category name' : 'Sub-service name'} />

          {/* Description — shown at ALL levels */}
          <textarea value={svc.description || ''} onChange={e => updateSvc(svcId, 'description', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none resize-none"
            rows={1} placeholder="Description (optional)" />

          {/* Price + Duration — shown at ALL levels */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">Price</label>
              <input type="number" min="0" step="0.01" value={svc.price ?? ''}
                onChange={e => updateSvc(svcId, 'price', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-300 outline-none"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">Duration</label>
              <input value={svc.duration || ''} onChange={e => updateSvc(svcId, 'duration', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-300 outline-none"
                placeholder="e.g. 30 min" />
            </div>
          </div>

          {/* Children — rendered recursively */}
          {children.length > 0 && (
            <div className="ml-2 space-y-2 border-l-2 border-emerald-100 pl-3">
              {children.map(child => (
                <ServiceNode key={child.id || child.localId} svc={child} depth={depth + 1}
                  services={services} getChildServices={getChildServices}
                  updateSvc={updateSvc} removeSvc={removeSvc} addService={addService} />
              ))}
            </div>
          )}

          <button onClick={() => addService(svcId)}
            className="text-xs text-emerald-600 cursor-pointer font-medium hover:text-emerald-800">
            + Add sub-service under &quot;{svc.name || 'this'}&quot;
          </button>
        </div>
        <button onClick={() => removeSvc(svcId)}
          className="text-gray-300 hover:text-red-500 cursor-pointer opacity-0 group-hover/svc:opacity-100 transition-all p-1 text-lg flex-shrink-0">✕</button>
      </div>
    </div>
  );
}

// ─── Preview Buttons (fully recursive) ───────────────────────
function PreviewButtons({ buttons, depth = 0 }) {
  if (!buttons || buttons.length === 0) {
    if (depth === 0) return <p className="text-xs text-gray-400 text-center italic">No buttons yet</p>;
    return null;
  }
  return (
    <div className={`space-y-1.5 ${depth > 0 ? 'ml-3 mt-1' : ''}`}>
      {buttons.map((btn) => (
        <div key={btn.localId}>
          <div className={`text-center py-2 bg-gray-50 rounded-lg text-xs font-medium border border-gray-100 ${
            btn.action_type === 'OPEN_SUBMENU' ? 'text-purple-600' : 'text-emerald-600'
          }`}>
            {btn.label || 'Button'}{btn.action_type === 'OPEN_SUBMENU' ? ' ▸' : ''}
          </div>
          {btn.action_type === 'OPEN_SUBMENU' && btn.children?.length > 0 && (
            <PreviewButtons buttons={btn.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Recursive Menu Button Editor ────────────────────────────
function MenuButtonEditor({ btn, index, siblingCount, flows, updateBtn, removeBtn, moveBtn, addChildButton, depth = 0 }) {
  return (
    <div>
      <div className={`bg-gray-50 rounded-xl p-4 border border-gray-100 group hover:border-emerald-200 transition-all ${depth > 0 ? 'bg-white' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-0.5 mt-2">
            <button onClick={() => moveBtn(btn.localId, -1)} disabled={index === 0}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-30">↑</button>
            <button onClick={() => moveBtn(btn.localId, 1)} disabled={index === siblingCount - 1}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-30">↓</button>
          </div>
          <div className="flex-1 space-y-3">
            <input value={btn.label} onChange={e => updateBtn(btn.localId, 'label', e.target.value)}
              className="w-full text-sm font-medium bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-300"
              placeholder={depth > 0 ? 'Sub-button label' : 'Button label (e.g. Book Now)'} />

            <div className="flex flex-wrap gap-1.5">
              {ACTION_TYPES.map(t => (
                <button key={t.value} onClick={() => updateBtn(btn.localId, 'action_type', t.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    btn.action_type === t.value
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {btn.action_type === 'START_FLOW' && (
              <select value={btn.action_value || ''} onChange={e => updateBtn(btn.localId, 'action_value', e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-1 focus:ring-emerald-300 outline-none w-full">
                <option value="">Select a flow...</option>
                {flows.map(f => <option key={f.localId} value={f.localId}>{f.name || 'Untitled'}</option>)}
              </select>
            )}
            {btn.action_type === 'QUICK_ACTION' && (
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTION_TYPES.map(t => (
                  <button key={t.value} onClick={() => updateBtn(btn.localId, 'action_value', t.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      btn.action_value === t.value
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => removeBtn(btn.localId)}
            className="text-gray-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-all p-1 text-lg flex-shrink-0">✕</button>
        </div>
      </div>

      {btn.action_type === 'OPEN_SUBMENU' && (
        <div className="ml-8 border-l-2 border-emerald-100 pl-4 mt-2 mb-2 space-y-2">
          {(btn.children || []).map((child, ci) => (
            <MenuButtonEditor key={child.localId} btn={child} index={ci} siblingCount={(btn.children || []).length}
              flows={flows} updateBtn={updateBtn} removeBtn={removeBtn} moveBtn={moveBtn} addChildButton={addChildButton} depth={depth + 1} />
          ))}
          <button onClick={() => addChildButton(btn.localId)}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all cursor-pointer font-medium">
            + Add sub-button under &quot;{btn.label || 'this menu'}&quot;
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Embedded WhatsApp Chat Simulator (with Reset) ───────────
function ChatSimulator() {
  const PHONE = '905000000000';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const resetChat = useCallback(async () => {
    setResetting(true);
    try {
      await sessionsApi.reset(PHONE);
    } catch { /* ignore */ }
    setMessages([]);
    setResetting(false);
  }, []);

  // Auto-reset session when simulator opens
  useEffect(() => { resetChat(); }, [resetChat]);

  async function send(text) {
    if (!text.trim()) return;
    setInput('');
    setMessages(p => [...p, { from: 'user', text }]);
    setLoading(true);
    try {
      const res = await whatsappApi.simulate(PHONE, text);
      const responses = res.data?.data?.responses || [];
      for (const msg of responses) {
        const botMsg = { from: 'bot', text: '', buttons: [] };
        if (msg.type === 'text') botMsg.text = msg.text.body;
        else if (msg.type === 'interactive') {
          const inter = msg.interactive;
          botMsg.text = inter.body?.text || '';
          if (inter.type === 'button' && inter.action?.buttons)
            botMsg.buttons = inter.action.buttons.map(b => ({ id: b.reply.id, title: b.reply.title }));
          if (inter.type === 'list' && inter.action?.sections)
            botMsg.buttons = inter.action.sections.flatMap(s => s.rows || []).map(r => ({ id: r.id, title: r.title }));
        }
        setMessages(p => [...p, botMsg]);
      }
    } catch (err) {
      setMessages(p => [...p, { from: 'bot', text: '⚠️ ' + (err.response?.data?.error?.message || err.message) }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[500px] rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 bg-[#075e54] text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">🤖</div>
          <div>
            <p className="font-semibold text-sm">Your WhatsApp Bot</p>
            <p className="text-[11px] text-white/70">Live simulator (published data only)</p>
          </div>
        </div>
        <button onClick={resetChat} disabled={resetting}
          className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50">
          {resetting ? '...' : '🔄 Reset Chat'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#ece5dd] px-4 py-3 space-y-2">
        {messages.length === 0 && <p className="text-center text-sm text-gray-500 mt-10">Send any message to start the conversation</p>}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm shadow-sm whitespace-pre-wrap ${
              msg.from === 'user' ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none'
            }`}>
              {msg.text}
              {msg.buttons?.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {msg.buttons.map(btn => (
                    <button key={btn.id} onClick={() => send(btn.id)} disabled={loading}
                      className="w-full text-center text-[13px] font-medium text-[#075e54] border border-[#075e54]/30 rounded-lg py-1.5 hover:bg-[#075e54]/10 transition disabled:opacity-50 cursor-pointer">
                      {btn.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-xl px-4 py-2 text-sm text-gray-400 rounded-tl-none shadow-sm">typing...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-3 py-3 bg-[#f0f0f0]">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Type a message..." disabled={loading}
          className="flex-1 px-4 py-2 rounded-full bg-white text-sm outline-none border border-gray-200 focus:border-[#075e54] transition disabled:opacity-50" />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-full bg-[#075e54] text-white flex items-center justify-center hover:bg-[#064e46] transition disabled:opacity-50 cursor-pointer">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  );
}
