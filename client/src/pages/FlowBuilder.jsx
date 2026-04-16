import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { flowsApi } from '../services/api';
import { Modal, ModalActions, Spinner, ErrorMsg, inputClass, selectClass } from '../components/UI';

const STEP_TYPES = ['text_input', 'number_input', 'select_option', 'select_service', 'select_date', 'select_time', 'summary', 'confirm'];

const STEP_TYPE_LABELS = {
  text_input: '✏️ Text Answer',
  number_input: '🔢 Number Answer',
  select_option: '📋 Multiple Choice',
  select_service: '🛍️ Pick a Service',
  select_date: '📅 Pick a Date',
  select_time: '⏰ Pick a Time',
  summary: '📊 Show Summary',
  confirm: '✅ Confirm & Submit',
};

export default function FlowBuilder() {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const navigate = useNavigate();

  // Flow modals
  const [flowModal, setFlowModal] = useState(false);
  const [flowForm, setFlowForm] = useState({ name: '', description: '', is_active: true });
  const [editingFlow, setEditingFlow] = useState(null);

  // Step modals
  const [stepModal, setStepModal] = useState(false);
  const [stepForm, setStepForm] = useState({ label: '', type: 'text_input', step_order: 1, config: '{}' });
  const [editingStep, setEditingStep] = useState(null);

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await flowsApi.list();
      setFlows(res.data.data);
    } catch { setError('Failed to load flows'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFlows(); }, [fetchFlows]);

  const selectFlow = async (flow) => {
    setSelectedFlow(flow);
    setStepsLoading(true);
    try {
      const res = await flowsApi.get(flow.id);
      setSteps(res.data.data.steps || []);
    } catch { setError('Failed to load steps'); }
    finally { setStepsLoading(false); }
  };

  // Flow CRUD
  const openCreateFlow = () => { setEditingFlow(null); setFlowForm({ name: '', description: '', is_active: true }); setFlowModal(true); };
  const openEditFlow = (f) => { setEditingFlow(f); setFlowForm({ name: f.name, description: f.description || '', is_active: f.is_active }); setFlowModal(true); };

  const handleFlowSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFlow) {
        await flowsApi.update(editingFlow.id, flowForm);
      } else {
        await flowsApi.create(flowForm);
      }
      setFlowModal(false);
      fetchFlows();
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to save flow'); }
  };

  const handleDeleteFlow = async (id) => {
    if (!confirm('Delete this flow?')) return;
    try { await flowsApi.delete(id); if (selectedFlow?.id === id) { setSelectedFlow(null); setSteps([]); } fetchFlows(); }
    catch { setError('Failed to delete flow'); }
  };

  // Step CRUD
  const openCreateStep = () => {
    setEditingStep(null);
    setStepForm({ label: '', type: 'text_input', step_order: steps.length + 1, config: '{}', _options: [] });
    setStepModal(true);
  };
  const openEditStep = (s) => {
    setEditingStep(s);
    const cfg = typeof s.config === 'object' ? s.config : (() => { try { return JSON.parse(s.config); } catch { return {}; } })();
    setStepForm({ label: s.label, type: s.type, step_order: s.step_order, config: typeof s.config === 'object' ? JSON.stringify(s.config, null, 2) : (s.config || '{}'), _options: cfg.options || [] });
    setStepModal(true);
  };

  const handleStepSubmit = async (e) => {
    e.preventDefault();
    try {
      const needsOptions = ['select_option', 'select_date', 'select_time'].includes(stepForm.type);
      const config = needsOptions ? { options: stepForm._options.filter(o => o.trim()) } : {};
      const payload = { label: stepForm.label, type: stepForm.type, step_order: stepForm.step_order, config };
      if (editingStep) {
        await flowsApi.updateStep(selectedFlow.id, editingStep.id, payload);
      } else {
        await flowsApi.createStep(selectedFlow.id, payload);
      }
      setStepModal(false);
      selectFlow(selectedFlow);
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to save step'); }
  };

  const handleDeleteStep = async (stepId) => {
    if (!confirm('Delete this step?')) return;
    try { await flowsApi.deleteStep(selectedFlow.id, stepId); selectFlow(selectedFlow); }
    catch { setError('Failed to delete step'); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
        <button onClick={openCreateFlow} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-all shadow-sm cursor-pointer">+ New Form</button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Forms collect information from your WhatsApp customers step by step — like name, date, and service. Each completed form creates a <strong className="text-gray-700">Customer Request</strong>.</p>
      <ErrorMsg msg={error} onDismiss={() => setError(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flow list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80">
          <div className="px-4 py-3 border-b border-gray-200"><h2 className="font-semibold text-gray-900">Your Forms</h2></div>
          {flows.length === 0 ? (
            <div className="px-4 py-12 text-center"><p className="text-3xl mb-2">📝</p><p className="font-medium text-gray-900 mb-1 text-sm">No forms yet</p><p className="text-xs text-gray-500 mb-3">Create a form to collect customer information step by step on WhatsApp.</p><button onClick={openCreateFlow} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer">+ Create Your First Form</button></div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {flows.map((f) => (
                <li key={f.id} className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${selectedFlow?.id === f.id ? 'bg-emerald-50' : ''}`} onClick={() => selectFlow(f)}>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{f.name}</p>
                    <p className="text-xs text-gray-500">{f.is_active ? '🟢 Active' : '⚪ Inactive'}</p>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEditFlow(f)} className="text-xs text-emerald-600 hover:text-emerald-800 cursor-pointer">Edit</button>
                    <button onClick={() => handleDeleteFlow(f.id)} className="text-xs text-red-600 hover:text-red-800 cursor-pointer">Del</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Steps panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200/80">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{selectedFlow ? `Questions: ${selectedFlow.name}` : 'Select a form'}</h2>
            {selectedFlow && <button onClick={openCreateStep} className="text-sm text-emerald-600 hover:text-emerald-800 cursor-pointer">+ Add Question</button>}
          </div>
          {!selectedFlow ? (
            <p className="px-4 py-12 text-gray-400 text-center text-sm">Select a form from the list to manage its questions.</p>
          ) : stepsLoading ? (
            <Spinner />
          ) : steps.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 text-sm mb-2">No questions yet. Add questions to collect customer information.</p>
              <button onClick={openCreateStep} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer">+ Add First Question</button>
            </div>
          ) : (
            <div>
              <div className="divide-y divide-gray-100">
                {steps.sort((a, b) => a.step_order - b.step_order).map((s, i) => (
                  <div key={s.id} className="px-4 py-3 flex items-center justify-between group hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="w-7 h-7 flex items-center justify-center bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{i + 1}</span>
                        {i < steps.length - 1 && <div className="w-0.5 h-4 bg-emerald-200 mt-1" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.label}</p>
                        <p className="text-xs text-gray-500">{STEP_TYPE_LABELS[s.type] || s.type}</p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                      <button onClick={() => openEditStep(s)} className="text-xs text-emerald-600 hover:text-emerald-800 cursor-pointer">Edit</button>
                      <button onClick={() => handleDeleteStep(s.id)} className="text-xs text-red-600 hover:text-red-800 cursor-pointer">Del</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connection banner */}
              <div className="m-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-lg border border-emerald-200/60">
                <p className="text-xs font-semibold text-gray-700 mb-2">🔗 What happens when a customer completes this form?</p>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                  <span className="bg-white px-2 py-1 rounded border border-gray-200 font-medium">📝 Form filled</span>
                  <span className="text-gray-400">→</span>
                  <span className="bg-white px-2 py-1 rounded border border-gray-200 font-medium">📥 Request created</span>
                  <span className="text-gray-400">→</span>
                  <span className="bg-white px-2 py-1 rounded border border-gray-200 font-medium">👤 Auto-assigned</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">A <strong>Customer Request</strong> is created automatically. If you have assignment rules, it gets routed to the right team member.</p>
                <button onClick={() => navigate('/dashboard/assignment-rules')} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer">🎯 Configure who handles these requests →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form modal */}
      {flowModal && (
        <Modal title={editingFlow ? 'Edit Form' : 'New Form'} onClose={() => setFlowModal(false)}>
          <form onSubmit={handleFlowSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input required value={flowForm.name} onChange={(e) => setFlowForm({ ...flowForm, name: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={2} value={flowForm.description} onChange={(e) => setFlowForm({ ...flowForm, description: e.target.value })} className={inputClass} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={flowForm.is_active} onChange={(e) => setFlowForm({ ...flowForm, is_active: e.target.checked })} className="rounded" /> Active
            </label>
            <ModalActions onCancel={() => setFlowModal(false)} />
          </form>
        </Modal>
      )}

      {/* Question modal */}
      {stepModal && (
        <Modal title={editingStep ? 'Edit Question' : 'New Question'} onClose={() => setStepModal(false)}>
          <form onSubmit={handleStepSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
              <input required value={stepForm.label} onChange={(e) => setStepForm({ ...stepForm, label: e.target.value })} className={inputClass} placeholder="What should the bot ask?" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Answer Type *</label>
                <select value={stepForm.type} onChange={(e) => setStepForm({ ...stepForm, type: e.target.value, _options: ['select_option', 'select_date', 'select_time'].includes(e.target.value) ? (stepForm._options.length > 0 ? stepForm._options : ['']) : [] })} className={selectClass}>
                  {STEP_TYPES.map((t) => <option key={t} value={t}>{STEP_TYPE_LABELS[t] || t}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Order *</label>
                <input type="number" min={1} required value={stepForm.step_order} onChange={(e) => setStepForm({ ...stepForm, step_order: Number(e.target.value) })} className={inputClass} /></div>
            </div>
            {['select_option', 'select_date', 'select_time'].includes(stepForm.type) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                <div className="space-y-2">
                  {(stepForm._options || []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5 text-right">{i + 1}.</span>
                      <input value={opt} onChange={(e) => { const o = [...stepForm._options]; o[i] = e.target.value; setStepForm({ ...stepForm, _options: o }); }} className={inputClass + ' flex-1'} placeholder="Option text" />
                      <button type="button" onClick={() => setStepForm({ ...stepForm, _options: stepForm._options.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600 text-xs cursor-pointer">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setStepForm({ ...stepForm, _options: [...(stepForm._options || []), ''] })} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer">+ Add option</button>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400">{stepForm.type === 'text_input' ? 'Customer types a free-text answer.' : stepForm.type === 'number_input' ? 'Customer enters a number.' : stepForm.type === 'select_service' ? 'Customer picks from your services list automatically.' : stepForm.type === 'summary' ? 'Displays all collected answers for review.' : stepForm.type === 'confirm' ? 'Final yes/no confirmation to submit.' : ''}</p>
            <ModalActions onCancel={() => setStepModal(false)} />
          </form>
        </Modal>
      )}
    </div>
  );
}
