import { useState, useEffect, useCallback, useRef } from 'react';
import { servicesApi, menuApi, flowsApi, assigneesApi, assignmentRulesApi } from '../services/api';
import { useBusinessContext } from '../context/useBusiness';
import { TEMPLATES, LANGUAGES, getTemplate } from '../lib/templateContent';
import { inputClass } from '../components/UI';

// ─── Constants ─────────────────────────────────────────────────
const Q_TYPES = [
  { value: 'text', label: 'Text Answer', icon: '✏️' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'select', label: 'Multiple Choice', icon: '📋' },
  { value: 'service', label: 'Pick a Service', icon: '🛍️' },
  { value: 'date', label: 'Pick a Date', icon: '📅' },
  { value: 'time', label: 'Pick a Time', icon: '⏰' },
  { value: 'phone', label: 'Phone Number', icon: '📱' },
  { value: 'image', label: 'Upload Photo', icon: '📷' },
  { value: 'file', label: 'Upload File', icon: '📎' },
];

const BUTTON_TYPES = [
  { value: 'open_services', label: 'Show All Services', icon: '📋' },
  { value: 'start_conversation', label: 'Start Conversation', icon: '💬' },
  { value: 'action', label: 'Quick Action', icon: '⚡' },
];

const ACTION_TYPES = [
  { value: 'show_phone', label: 'Show Phone Number', icon: '📞' },
  { value: 'show_location', label: 'Show Location', icon: '📍' },
  { value: 'open_link', label: 'Open Link', icon: '🔗' },
];

// ─── Helpers ───────────────────────────────────────────────────
let _c = Date.now();
const uid = () => `b-${_c++}`;

function toStepType(uiType) {
  const map = { text: 'text_input', number: 'number_input', select: 'select_option', service: 'select_service', date: 'select_date', time: 'select_time', phone: 'text_input', image: 'text_input', file: 'text_input' };
  return map[uiType] || 'text_input';
}

function fromStepType(type, config) {
  const cfg = typeof config === 'string' ? safeJson(config) : (config || {});
  if (type === 'text_input') {
    if (cfg.hint === 'phone') return 'phone';
    if (cfg.hint === 'image') return 'image';
    if (cfg.hint === 'file') return 'file';
    return 'text';
  }
  const map = { number_input: 'number', select_option: 'select', select_service: 'service', select_date: 'date', select_time: 'time' };
  return map[type] || 'text';
}

function stepConfig(q) {
  if (q.type === 'select' && q.options?.length) return { options: q.options };
  if (q.type === 'phone') return { hint: 'phone' };
  if (q.type === 'image') return { hint: 'image' };
  if (q.type === 'file') return { hint: 'file' };
  return {};
}

function safeJson(val) {
  if (!val) return {};
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return {}; }
}

function deepClone(arr) {
  return JSON.parse(JSON.stringify(arr));
}

function buildEmptyService(name = 'New Service') {
  return {
    id: uid(), name, description: '', price: null, duration: '',
    actionLabel: name,
    questions: [
      { id: uid(), label: 'Your full name', type: 'text', required: true, options: [] },
      { id: uid(), label: 'Phone number', type: 'phone', required: true, options: [] },
    ],
    assigneeId: null, responseType: 'request',
    confirmMessage: 'Your request has been sent!',
  };
}

// ─── Main Component ────────────────────────────────────────────
export default function ConversationBuilder() {
  const { businessType, allProfiles } = useBusinessContext();
  const [categories, setCategories] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [selCat, setSelCat] = useState(null);
  const [selSvc, setSelSvc] = useState(null);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [hasData, setHasData] = useState(null); // null=checking, true/false
  const [startConfig, setStartConfig] = useState({
    welcomeMessage: 'Hello 👋 How can we help you today?',
    buttons: [
      { id: uid(), label: 'Our Services', type: 'open_services' },
      { id: uid(), label: 'Contact Us', type: 'action', actionType: 'show_phone' },
    ],
  });
  const loadedRef = useRef(false);

  // Convenience: get selected service
  const selectedService = selCat !== null && selSvc !== null ? categories[selCat]?.services?.[selSvc] : null;

  // ─── Load from Backend ────────────────────────────────
  const loadFromBackend = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [svcRes, treeRes, flowsRes, assignRes, rulesRes] = await Promise.all([
        servicesApi.list(), menuApi.getTree(), flowsApi.list(),
        assigneesApi.list(), assignmentRulesApi.list(),
      ]);
      const svcs = svcRes.data.data;
      const tree = treeRes.data.data;
      const flows = flowsRes.data.data;
      const asgn = assignRes.data.data;
      const rules = rulesRes.data.data;

      setAssignees(asgn);

      if (svcs.length === 0 && tree.length === 0 && flows.length === 0) {
        setHasData(false);
        setLoading(false);
        return;
      }
      setHasData(true);

      // Load flow details
      const flowMap = {};
      for (const f of flows) {
        try {
          const r = await flowsApi.get(f.id);
          flowMap[f.id] = r.data.data;
        } catch { /* skip */ }
      }

      // Find main booking flow (has select_service step)
      const mainFlow = Object.values(flowMap).find(f => f.steps?.some(s => s.type === 'select_service'));
      const defaultQuestions = mainFlow
        ? mainFlow.steps.filter(s => !['summary', 'confirm'].includes(s.type)).map(s => ({
            id: uid(), label: s.label, type: fromStepType(s.type, s.config),
            required: s.is_required, options: safeJson(s.config)?.options || [],
          }))
        : [];
      const defaultConfirm = mainFlow?.steps?.find(s => s.type === 'confirm')?.label || 'Confirm';

      // Build categories from menu tree
      const cats = [];
      const root = tree[0];
      if (root?.children) {
        for (const child of root.children) {
          if (child.node_type === 'menu' && child.children?.length > 0) {
            const flowEntries = child.children.filter(c => c.node_type === 'flow_entry');
            if (flowEntries.length === 0) continue;

            const cat = { id: uid(), name: child.label, services: [] };
            for (const fe of flowEntries) {
              try {
                const nodeRes = await menuApi.getNode(fe.id);
                const flowId = nodeRes.data.data.flow_id;
                const flow = flowId ? flowMap[flowId] : null;
                const steps = flow?.steps || [];
                const qs = steps.filter(s => !['summary', 'confirm'].includes(s.type)).map(s => ({
                  id: uid(), label: s.label, type: fromStepType(s.type, s.config),
                  required: s.is_required, options: safeJson(s.config)?.options || [],
                }));
                const confirmStep = steps.find(s => s.type === 'confirm');
                const matchSvc = svcs.find(s => s.name === fe.label) || svcs.find(s => fe.label.includes(s.name));
                const rule = matchSvc ? rules.find(r => r.trigger_type === 'service' && r.trigger_id === matchSvc.id) : null;

                cat.services.push({
                  id: uid(), name: fe.label, description: matchSvc?.description || '',
                  price: matchSvc?.price || null, duration: matchSvc?.duration || '',
                  actionLabel: fe.label,
                  questions: qs.length > 0 ? qs : deepClone(defaultQuestions).map(q => ({ ...q, id: uid() })),
                  assigneeId: rule?.assignee_id || null, responseType: 'request',
                  confirmMessage: confirmStep?.label || defaultConfirm,
                });
              } catch { /* skip node */ }
            }
            if (cat.services.length > 0) cats.push(cat);
          } else if (child.node_type === 'flow_entry') {
            try {
              const nodeRes = await menuApi.getNode(child.id);
              const flowId = nodeRes.data.data.flow_id;
              const flow = flowId ? flowMap[flowId] : null;
              const steps = flow?.steps || [];
              const qs = steps.filter(s => !['summary', 'confirm'].includes(s.type)).map(s => ({
                id: uid(), label: s.label, type: fromStepType(s.type, s.config),
                required: s.is_required, options: safeJson(s.config)?.options || [],
              }));
              const confirmStep = steps.find(s => s.type === 'confirm');
              const matchSvc = svcs.find(s => s.name === child.label) || svcs.find(s => child.label.includes(s.name));
              const rule = matchSvc ? rules.find(r => r.trigger_type === 'service' && r.trigger_id === matchSvc.id) : null;

              cats.push({
                id: uid(), name: child.label, services: [{
                  id: uid(), name: child.label, description: matchSvc?.description || flow?.description || '',
                  price: matchSvc?.price || null, duration: matchSvc?.duration || '',
                  actionLabel: child.label,
                  questions: qs.length > 0 ? qs : deepClone(defaultQuestions).map(q => ({ ...q, id: uid() })),
                  assigneeId: rule?.assignee_id || null, responseType: 'request',
                  confirmMessage: confirmStep?.label || defaultConfirm,
                }],
              });
            } catch { /* skip */ }
          }
        }
      }

      // Fallback: all services in one category
      if (cats.length === 0 && svcs.length > 0) {
        cats.push({
          id: uid(), name: 'Services', services: svcs.map(s => ({
            id: uid(), name: s.name, description: s.description || '', price: s.price, duration: s.duration || '',
            actionLabel: s.name,
            questions: deepClone(defaultQuestions).map(q => ({ ...q, id: uid() })),
            assigneeId: rules.find(r => r.trigger_type === 'service' && r.trigger_id === s.id)?.assignee_id || null,
            responseType: 'request', confirmMessage: defaultConfirm,
          })),
        });
      }

      setCategories(cats);
      if (cats.length > 0 && cats[0].services.length > 0) { setSelCat(0); setSelSvc(0); }

      // Extract start configuration from menu tree
      const startBtns = [];
      if (cats.length > 0) {
        startBtns.push({ id: uid(), label: 'Our Services', type: 'open_services' });
      }
      if (root?.children) {
        for (const child of root.children) {
          if (child.node_type === 'action') {
            startBtns.push({ id: uid(), label: child.label, type: 'action', actionType: child.action_type || 'show_phone' });
          }
        }
      }
      if (startBtns.length === 0) {
        startBtns.push({ id: uid(), label: 'Our Services', type: 'open_services' });
      }
      setStartConfig({
        welcomeMessage: root?.label || 'Hello 👋 How can we help you today?',
        buttons: startBtns,
      });
    } catch (err) {
      setError('Failed to load data: ' + (err.response?.data?.error?.message || err.message));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!loadedRef.current) { loadedRef.current = true; loadFromBackend(); } }, [loadFromBackend]);

  // ─── Apply Template ───────────────────────────────────
  const applyTemplate = useCallback((type, lang) => {
    const tpl = getTemplate(type, lang);
    if (!tpl) return;
    const cats = tpl.categories.map(c => ({
      id: uid(), name: c.name,
      services: c.services.map(s => ({
        id: uid(), name: s.name, description: s.description || '', price: s.price, duration: s.duration || '',
        actionLabel: s.name,
        questions: (c.questions || []).map(q => ({ id: uid(), ...q, options: q.options ? [...q.options] : [] })),
        assigneeId: null, responseType: c.responseType || 'request',
        confirmMessage: c.confirmMessage || 'Your request has been sent!',
      })),
    }));
    setCategories(cats);
    setSelCat(0);
    setSelSvc(0);
    setHasData(true);
    setDirty(true);
    setSuccess(null);
    setStartConfig({
      welcomeMessage: 'Hello 👋 How can we help you today?',
      buttons: [
        { id: uid(), label: 'Our Services', type: 'open_services' },
        { id: uid(), label: 'Contact Us', type: 'action', actionType: 'show_phone' },
      ],
    });
  }, []);

  // ─── Save to Backend ──────────────────────────────────
  const saveToBackend = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Phase 1: Delete existing data
      setSaveProgress('Clearing old data...');
      const [existRules, existTree, existFlows, existSvcs] = await Promise.all([
        assignmentRulesApi.list(), menuApi.getTree(), flowsApi.list(), servicesApi.list(),
      ]);
      for (const r of existRules.data.data) await assignmentRulesApi.delete(r.id);
      for (const n of existTree.data.data) await menuApi.delete(n.id);
      for (const f of existFlows.data.data) await flowsApi.delete(f.id);
      for (const s of existSvcs.data.data) await servicesApi.delete(s.id);

      // Phase 2: Create services
      setSaveProgress('Creating services...');
      const serviceIdMap = {};
      for (const cat of categories) {
        for (const svc of cat.services) {
          const res = await servicesApi.create({
            name: svc.name, description: svc.description,
            price: svc.price ? Number(svc.price) : null, duration: svc.duration || null,
          });
          serviceIdMap[svc.id] = res.data.data.id;
        }
      }

      // Phase 3: Create flows (one per service)
      setSaveProgress('Creating conversations...');
      const flowIdMap = {};
      for (const cat of categories) {
        for (const svc of cat.services) {
          const flow = await flowsApi.create({ name: svc.name, description: svc.description || '', is_active: true });
          flowIdMap[svc.id] = flow.data.data.id;
          let order = 1;
          for (const q of svc.questions) {
            await flowsApi.createStep(flow.data.data.id, {
              type: toStepType(q.type), label: q.label, step_order: order++,
              config: stepConfig(q), is_required: q.required !== false,
            });
          }
          await flowsApi.createStep(flow.data.data.id, { type: 'summary', label: 'Review', step_order: order++, config: {} });
          await flowsApi.createStep(flow.data.data.id, {
            type: 'confirm', label: svc.confirmMessage || 'Confirm', step_order: order++,
            config: { message: svc.confirmMessage, responseType: svc.responseType },
          });
        }
      }

      // Phase 4: Create menu tree
      setSaveProgress('Building menu...');
      const root = await menuApi.create({ label: startConfig.welcomeMessage || 'Welcome', node_type: 'menu', parent_id: null, sort_order: 0 });
      const rootId = root.data.data.id;
      let catOrder = 0;
      let servicesPlaced = false;
      for (const btn of startConfig.buttons) {
        if (btn.type === 'open_services' && !servicesPlaced) {
          servicesPlaced = true;
          for (const cat of categories) {
            if (cat.services.length === 1) {
              const svc = cat.services[0];
              await menuApi.create({
                label: svc.actionLabel || svc.name, node_type: 'flow_entry',
                parent_id: rootId, sort_order: catOrder++, flow_id: flowIdMap[svc.id],
              });
            } else {
              const catNode = await menuApi.create({
                label: cat.name, node_type: 'menu', parent_id: rootId, sort_order: catOrder++,
              });
              let svcOrder = 0;
              for (const svc of cat.services) {
                await menuApi.create({
                  label: svc.actionLabel || svc.name, node_type: 'flow_entry',
                  parent_id: catNode.data.data.id, sort_order: svcOrder++, flow_id: flowIdMap[svc.id],
                });
              }
            }
          }
        } else if (btn.type === 'start_conversation' && btn.serviceId) {
          const fid = flowIdMap[btn.serviceId];
          if (fid) {
            await menuApi.create({
              label: btn.label || 'Start', node_type: 'flow_entry',
              parent_id: rootId, sort_order: catOrder++, flow_id: fid,
            });
          }
        } else if (btn.type === 'action') {
          await menuApi.create({
            label: btn.label || 'Contact', node_type: 'action', parent_id: rootId,
            sort_order: catOrder++, action_type: btn.actionType || 'show_phone',
          });
        }
      }
      // Ensure services are saved even if no open_services button
      if (!servicesPlaced && categories.length > 0) {
        for (const cat of categories) {
          if (cat.services.length === 1) {
            const svc = cat.services[0];
            await menuApi.create({
              label: svc.actionLabel || svc.name, node_type: 'flow_entry',
              parent_id: rootId, sort_order: catOrder++, flow_id: flowIdMap[svc.id],
            });
          } else {
            const catNode = await menuApi.create({
              label: cat.name, node_type: 'menu', parent_id: rootId, sort_order: catOrder++,
            });
            let svcOrder = 0;
            for (const svc of cat.services) {
              await menuApi.create({
                label: svc.actionLabel || svc.name, node_type: 'flow_entry',
                parent_id: catNode.data.data.id, sort_order: svcOrder++, flow_id: flowIdMap[svc.id],
              });
            }
          }
        }
      }

      // Phase 5: Assignment rules
      setSaveProgress('Setting up auto-assignment...');
      let priority = Object.keys(serviceIdMap).length + 1;
      for (const cat of categories) {
        for (const svc of cat.services) {
          if (svc.assigneeId) {
            await assignmentRulesApi.create({
              name: `${svc.name} → Auto`, trigger_type: 'service',
              trigger_id: serviceIdMap[svc.id], assignee_id: svc.assigneeId,
              priority: priority--, is_active: true,
            });
          }
        }
      }
      const active = assignees.filter(a => a.is_active);
      if (active.length > 0) {
        await assignmentRulesApi.create({
          name: 'Fallback', trigger_type: null, trigger_id: null,
          assignee_id: active[0].id, priority: 0, conditions: {}, is_active: true,
        });
      }

      setSaveProgress('');
      setSuccess('Saved successfully! Your WhatsApp menu and conversations are live.');
      setDirty(false);
    } catch (err) {
      setError('Save failed: ' + (err.response?.data?.error?.message || err.message));
    } finally { setSaving(false); setSaveProgress(''); }
  };

  // ─── Start Config Updaters ────────────────────────────
  const updateStartButton = (idx, field, value) => {
    setStartConfig(prev => {
      const btns = [...prev.buttons];
      btns[idx] = { ...btns[idx], [field]: value };
      return { ...prev, buttons: btns };
    });
    setDirty(true); setSuccess(null);
  };

  const addStartButton = () => {
    setStartConfig(prev => ({
      ...prev,
      buttons: [...prev.buttons, { id: uid(), label: 'New Button', type: 'action', actionType: 'show_phone' }],
    }));
    setDirty(true); setSuccess(null);
  };

  const removeStartButton = (idx) => {
    setStartConfig(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== idx),
    }));
    setDirty(true); setSuccess(null);
  };

  const moveStartButton = (idx, dir) => {
    setStartConfig(prev => {
      const btns = [...prev.buttons];
      const target = idx + dir;
      if (target < 0 || target >= btns.length) return prev;
      [btns[idx], btns[target]] = [btns[target], btns[idx]];
      return { ...prev, buttons: btns };
    });
    setDirty(true); setSuccess(null);
  };

  // ─── State Updaters ───────────────────────────────────
  const update = (fn) => { fn(); setDirty(true); setSuccess(null); };

  const addCategory = () => update(() => {
    const newCats = [...categories, { id: uid(), name: 'New Category', services: [buildEmptyService()] }];
    setCategories(newCats);
    setSelCat(newCats.length - 1);
    setSelSvc(0);
  });

  const removeCategory = (idx) => update(() => {
    const newCats = categories.filter((_, i) => i !== idx);
    setCategories(newCats);
    if (selCat === idx) { setSelCat(newCats.length > 0 ? 0 : null); setSelSvc(newCats.length > 0 ? 0 : null); }
    else if (selCat > idx) { setSelCat(selCat - 1); }
  });

  const renameCategory = (idx, name) => update(() => {
    const c = [...categories]; c[idx] = { ...c[idx], name }; setCategories(c);
  });

  const addService = (catIdx) => update(() => {
    const c = [...categories];
    const svc = buildEmptyService();
    c[catIdx] = { ...c[catIdx], services: [...c[catIdx].services, svc] };
    setCategories(c);
    setSelCat(catIdx);
    setSelSvc(c[catIdx].services.length - 1);
  });

  const removeService = (catIdx, svcIdx) => update(() => {
    const c = [...categories];
    c[catIdx] = { ...c[catIdx], services: c[catIdx].services.filter((_, i) => i !== svcIdx) };
    if (c[catIdx].services.length === 0) { c.splice(catIdx, 1); setSelCat(null); setSelSvc(null); }
    else if (selCat === catIdx && selSvc === svcIdx) { setSelSvc(Math.max(0, svcIdx - 1)); }
    else if (selCat === catIdx && selSvc > svcIdx) { setSelSvc(selSvc - 1); }
    setCategories(c);
  });

  const updateService = (catIdx, svcIdx, field, value) => update(() => {
    const c = [...categories];
    const svcs = [...c[catIdx].services];
    svcs[svcIdx] = { ...svcs[svcIdx], [field]: value };
    c[catIdx] = { ...c[catIdx], services: svcs };
    setCategories(c);
  });

  const addQuestion = (catIdx, svcIdx) => update(() => {
    const c = [...categories];
    const svc = { ...c[catIdx].services[svcIdx] };
    svc.questions = [...svc.questions, { id: uid(), label: 'New question', type: 'text', required: true, options: [] }];
    c[catIdx] = { ...c[catIdx], services: [...c[catIdx].services] };
    c[catIdx].services[svcIdx] = svc;
    setCategories(c);
  });

  const removeQuestion = (catIdx, svcIdx, qIdx) => update(() => {
    const c = [...categories];
    const svc = { ...c[catIdx].services[svcIdx] };
    svc.questions = svc.questions.filter((_, i) => i !== qIdx);
    c[catIdx] = { ...c[catIdx], services: [...c[catIdx].services] };
    c[catIdx].services[svcIdx] = svc;
    setCategories(c);
  });

  const updateQuestion = (catIdx, svcIdx, qIdx, field, value) => update(() => {
    const c = [...categories];
    const svc = { ...c[catIdx].services[svcIdx] };
    const qs = [...svc.questions];
    qs[qIdx] = { ...qs[qIdx], [field]: value };
    svc.questions = qs;
    c[catIdx] = { ...c[catIdx], services: [...c[catIdx].services] };
    c[catIdx].services[svcIdx] = svc;
    setCategories(c);
  });

  const moveQuestion = (catIdx, svcIdx, qIdx, dir) => update(() => {
    const c = [...categories];
    const svc = { ...c[catIdx].services[svcIdx] };
    const qs = [...svc.questions];
    const target = qIdx + dir;
    if (target < 0 || target >= qs.length) return;
    [qs[qIdx], qs[target]] = [qs[target], qs[qIdx]];
    svc.questions = qs;
    c[catIdx] = { ...c[catIdx], services: [...c[catIdx].services] };
    c[catIdx].services[svcIdx] = svc;
    setCategories(c);
  });

  // ─── Loading State ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading your conversation setup...</p>
        </div>
      </div>
    );
  }

  // ─── Template Picker (no data yet) ────────────────────
  if (hasData === false) {
    const types = Object.keys(TEMPLATES);
    return (
      <div className="max-w-3xl mx-auto py-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">💬</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conversation Builder</h1>
          <p className="text-gray-500">Choose a template to start building your customer interactions, or start from scratch.</p>
        </div>
        <div className="flex justify-center gap-2 mb-6">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLanguage(l.code)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all cursor-pointer ${language === l.code ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {types.map(type => {
            const p = allProfiles?.[type] || { label: type, icon: '📦' };
            return (
              <button key={type} onClick={() => applyTemplate(type, language)}
                className="text-left p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{p.icon}</span>
                  <span className="font-semibold text-sm text-gray-900">{p.label}</span>
                </div>
                <p className="text-xs text-gray-500">Pre-built services and conversations</p>
              </button>
            );
          })}
        </div>
        <div className="text-center">
          <button onClick={() => { setCategories([{ id: uid(), name: 'Services', services: [buildEmptyService()] }]); setHasData(true); setSelCat(0); setSelSvc(0); setDirty(true); }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">
            or start from scratch →
          </button>
        </div>
      </div>
    );
  }

  // ─── Main 3-Panel Layout ──────────────────────────────
  const langObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="animate-fade-in" dir={langObj.dir}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversation Builder</h1>
          <p className="text-sm text-gray-500 mt-0.5">Design your customer interactions — services, questions, and assignments in one place.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language selector */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLanguage(l.code)}
                className={`px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${language === l.code ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {l.label}
              </button>
            ))}
          </div>
          {/* Template reset */}
          {businessType && TEMPLATES[businessType] && (
            <button onClick={() => { if (confirm('Reset to template? This will replace your current setup.')) applyTemplate(businessType, language); }}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer transition-all">
              🔄 Reset to template
            </button>
          )}
          {/* Save */}
          <button onClick={saveToBackend} disabled={saving || !dirty}
            className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-sm cursor-pointer font-medium">
            {saving ? saveProgress || 'Saving...' : dirty ? '💾 Save & Publish' : '✓ Saved'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex justify-between items-center">{error}<button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 cursor-pointer">✕</button></div>}
      {success && <div className="mb-3 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-200 flex justify-between items-center">{success}<button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600 cursor-pointer">✕</button></div>}

      {/* ─── Start Section (Entry Point) ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">🟢</span>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Start</h2>
            <p className="text-[11px] text-gray-400">What customers see when they first message you</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Welcome Message</label>
          <input
            value={startConfig.welcomeMessage}
            onChange={e => { setStartConfig(c => ({ ...c, welcomeMessage: e.target.value })); setDirty(true); setSuccess(null); }}
            className={inputClass}
            placeholder="Hello 👋 How can we help you today?"
          />
          <p className="text-[10px] text-gray-400 mt-1">This is the first message your customers will see</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Start Buttons</label>
          <div className="space-y-2">
            {startConfig.buttons.map((btn, bi) => (
              <div key={btn.id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100 group">
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveStartButton(bi, -1)} disabled={bi === 0}
                    className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-30">↑</button>
                  <button onClick={() => moveStartButton(bi, 1)} disabled={bi === startConfig.buttons.length - 1}
                    className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-30">↓</button>
                </div>
                <input value={btn.label} onChange={e => updateStartButton(bi, 'label', e.target.value)}
                  className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-300 outline-none min-w-0"
                  placeholder="Button label" />
                <select value={btn.type} onChange={e => updateStartButton(bi, 'type', e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-indigo-300 outline-none">
                  {BUTTON_TYPES.filter(t => t.value !== 'open_services' || !startConfig.buttons.some((b, i) => b.type === 'open_services' && i !== bi)).map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
                {btn.type === 'start_conversation' && (
                  <select value={btn.serviceId || ''} onChange={e => updateStartButton(bi, 'serviceId', e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-indigo-300 outline-none max-w-[140px]">
                    <option value="">Pick a service...</option>
                    {categories.flatMap((c, ci) => c.services.map((s, si) => (
                      <option key={`${ci}-${si}`} value={s.id}>{s.name}</option>
                    )))}
                  </select>
                )}
                {btn.type === 'action' && (
                  <select value={btn.actionType || 'show_phone'} onChange={e => updateStartButton(bi, 'actionType', e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-indigo-300 outline-none">
                    {ACTION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                )}
                <button onClick={() => removeStartButton(bi)}
                  className="text-xs text-red-400 hover:text-red-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity p-1">✕</button>
              </div>
            ))}
            <button onClick={addStartButton}
              className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-pointer">
              + Add Button
            </button>
          </div>
        </div>
      </div>

      {/* 3 Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-4" style={{ minHeight: 'calc(100vh - 14rem)' }}>
        {/* ═══ LEFT: Service Tree ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Services</h2>
            <button onClick={addCategory} className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium">+ Category</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {categories.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-gray-500 mb-3">No services yet</p>
                <button onClick={addCategory} className="text-xs text-indigo-600 font-medium cursor-pointer">+ Add Category</button>
              </div>
            ) : categories.map((cat, ci) => (
              <div key={cat.id} className="mb-1">
                {/* Category header */}
                <div className="flex items-center gap-1 group px-2 py-1.5 rounded-lg hover:bg-gray-50">
                  <span className="text-xs text-gray-400">📁</span>
                  <input value={cat.name} onChange={e => renameCategory(ci, e.target.value)}
                    className="flex-1 text-xs font-semibold text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0 min-w-0 p-0"
                    onFocus={e => e.target.select()} />
                  <button onClick={() => addService(ci)} className="text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 cursor-pointer px-1" title="Add service">+</button>
                  <button onClick={() => removeCategory(ci)} className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer px-1" title="Remove">✕</button>
                </div>
                {/* Services */}
                <div className="ml-4">
                  {cat.services.map((svc, si) => (
                    <div key={svc.id}
                      onClick={() => { setSelCat(ci); setSelSvc(si); }}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group text-xs transition-all ${selCat === ci && selSvc === si ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <span className="text-gray-400">•</span>
                      <span className="flex-1 truncate">{svc.name || 'Untitled'}</span>
                      {svc.price != null && <span className="text-[10px] text-gray-400">${svc.price}</span>}
                      <button onClick={e => { e.stopPropagation(); removeService(ci, si); }}
                        className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer" title="Remove">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CENTER: Service Details ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col">
          {selectedService ? (
            <div className="flex-1 overflow-y-auto p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Service Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input value={selectedService.name} onChange={e => updateService(selCat, selSvc, 'name', e.target.value)}
                    className={inputClass} placeholder="Service name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                    <input value={selectedService.duration || ''} onChange={e => updateService(selCat, selSvc, 'duration', e.target.value)}
                      className={inputClass} placeholder="e.g. 30 min" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                    <input type="number" min="0" step="0.01" value={selectedService.price ?? ''} onChange={e => updateService(selCat, selSvc, 'price', e.target.value ? Number(e.target.value) : null)}
                      className={inputClass} placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea rows={2} value={selectedService.description} onChange={e => updateService(selCat, selSvc, 'description', e.target.value)}
                    className={inputClass} placeholder="Brief description" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Button Label (what customer sees)</label>
                  <input value={selectedService.actionLabel || ''} onChange={e => updateService(selCat, selSvc, 'actionLabel', e.target.value)}
                    className={inputClass} placeholder={selectedService.name} />
                </div>
              </div>

              {/* Service card preview */}
              <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Preview</p>
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-sm text-gray-900">{selectedService.name || 'Service Name'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedService.description || 'No description'}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedService.price != null && <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">${selectedService.price}</span>}
                    {selectedService.duration && <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md">{selectedService.duration}</span>}
                  </div>
                  <button className="mt-3 w-full py-2 bg-emerald-500 text-white text-xs rounded-lg font-medium cursor-default">
                    {selectedService.actionLabel || selectedService.name || 'Start'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mx-auto mb-3">👈</div>
                <p className="font-medium text-gray-900 text-sm mb-1">Select a service</p>
                <p className="text-xs text-gray-500">Click on a service from the tree to edit its details and conversation.</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Conversation Builder ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col">
          {selectedService ? (
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-sm">Conversation</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">What the customer sees step by step</p>
              </div>
              <div className="p-4 space-y-3">
                {/* Questions */}
                {selectedService.questions.map((q, qi) => (
                  <div key={q.id} className="group bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{qi + 1}</span>
                      <input value={q.label} onChange={e => updateQuestion(selCat, selSvc, qi, 'label', e.target.value)}
                        className="flex-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 p-0 font-medium text-gray-800 min-w-0"
                        placeholder="Question text" />
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveQuestion(selCat, selSvc, qi, -1)} disabled={qi === 0}
                          className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-30 p-0.5">↑</button>
                        <button onClick={() => moveQuestion(selCat, selSvc, qi, 1)} disabled={qi === selectedService.questions.length - 1}
                          className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-30 p-0.5">↓</button>
                        <button onClick={() => removeQuestion(selCat, selSvc, qi)}
                          className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer p-0.5">✕</button>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <select value={q.type} onChange={e => updateQuestion(selCat, selSvc, qi, 'type', e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-1 focus:ring-indigo-300 outline-none">
                        {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-[10px] text-gray-500">
                        <input type="checkbox" checked={q.required} onChange={e => updateQuestion(selCat, selSvc, qi, 'required', e.target.checked)} className="rounded w-3 h-3" />
                        Required
                      </label>
                    </div>
                    {/* Options for select type */}
                    {q.type === 'select' && (
                      <div className="mt-2 ml-7 space-y-1">
                        {(q.options || []).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-400">○</span>
                            <input value={opt} onChange={e => {
                              const opts = [...(q.options || [])]; opts[oi] = e.target.value;
                              updateQuestion(selCat, selSvc, qi, 'options', opts);
                            }} className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-300 min-w-0" />
                            <button onClick={() => {
                              const opts = (q.options || []).filter((_, i) => i !== oi);
                              updateQuestion(selCat, selSvc, qi, 'options', opts);
                            }} className="text-[10px] text-red-400 cursor-pointer">✕</button>
                          </div>
                        ))}
                        <button onClick={() => updateQuestion(selCat, selSvc, qi, 'options', [...(q.options || []), 'New option'])}
                          className="text-[10px] text-indigo-600 cursor-pointer font-medium">+ Add option</button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add question */}
                <button onClick={() => addQuestion(selCat, selSvc)}
                  className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-pointer">
                  + Add question
                </button>

                {/* Divider */}
                <div className="border-t border-gray-200 my-2" />

                {/* Final Step */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h3 className="text-xs font-semibold text-emerald-800 mb-3">Final Step</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">Assign to</label>
                      <select value={selectedService.assigneeId || ''} onChange={e => updateService(selCat, selSvc, 'assigneeId', e.target.value || null)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-indigo-300 outline-none">
                        <option value="">Auto (first available)</option>
                        {assignees.filter(a => a.is_active).map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                      {assignees.length === 0 && <p className="text-[10px] text-amber-600 mt-1">Add team members first to enable assignment</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">Response type</label>
                      <div className="flex gap-2">
                        <label className={`flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${selectedService.responseType === 'request' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}`}>
                          <input type="radio" name={`resp-${selectedService.id}`} value="request" checked={selectedService.responseType === 'request'}
                            onChange={() => updateService(selCat, selSvc, 'responseType', 'request')} className="w-3 h-3" />
                          Send as request
                        </label>
                        <label className={`flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${selectedService.responseType === 'auto_confirm' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}`}>
                          <input type="radio" name={`resp-${selectedService.id}`} value="auto_confirm" checked={selectedService.responseType === 'auto_confirm'}
                            onChange={() => updateService(selCat, selSvc, 'responseType', 'auto_confirm')} className="w-3 h-3" />
                          Auto confirm
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">Confirmation message</label>
                      <textarea rows={2} value={selectedService.confirmMessage || ''} onChange={e => updateService(selCat, selSvc, 'confirmMessage', e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-indigo-300 outline-none resize-none"
                        placeholder="Message shown after submission" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mx-auto mb-3">💬</div>
                <p className="font-medium text-gray-900 text-sm mb-1">No service selected</p>
                <p className="text-xs text-gray-500">Select a service to edit its conversation flow.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How it works info */}
      <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50/60 to-emerald-50/60 rounded-xl border border-indigo-100">
        <p className="text-xs font-semibold text-gray-700 mb-2">💡 How it works</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-600 flex-wrap">
          <span className="bg-white px-2 py-1 rounded border border-gray-200 font-medium">📱 Customer taps service</span>
          <span className="text-gray-400">→</span>
          <span className="bg-white px-2 py-1 rounded border border-gray-200 font-medium">💬 Answers questions</span>
          <span className="text-gray-400">→</span>
          <span className="bg-white px-2 py-1 rounded border border-gray-200 font-medium">📥 Request created</span>
          <span className="text-gray-400">→</span>
          <span className="bg-white px-2 py-1 rounded border border-gray-200 font-medium">👤 Auto-assigned</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-2">When you save, the system automatically generates your WhatsApp menu, forms, and assignment rules. Customers see the service buttons and answer the questions you defined.</p>
      </div>
    </div>
  );
}
