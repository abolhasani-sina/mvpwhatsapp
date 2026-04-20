import { useState, useEffect, useId } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchStaff, uploadButtonMedia, deleteButtonMedia } from '../lib/api';

const BEHAVIORS = [
  {
    key: 'menu',
    label: 'Show more options',
    description: 'This button will show sub-buttons',
    icon: '▸',
  },
  {
    key: 'info',
    label: 'Show information',
    description: 'This button will show a description page',
    icon: 'ℹ',
  },
];

const BEHAVIOR_LABELS = {
  menu: '▸ more',
  info: 'ℹ info',
};

const CURRENCIES = [
  { code: 'TRY', symbol: '₺' },
  { code: 'AED', symbol: 'د.إ' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
];

const EMOJI_GRID = [
  '😊', '👋', '🎉', '💈', '💇', '💅', '🏋️', '🧖',
  '✅', '⭐', '🔥', '💰', '🎯', '📞', '📍', '🕐',
  '❤️', '💪', '🌟', '🎁', '👍', '🙏', '🏠', '🚗',
];

function EmojiPicker({ onSelect, onClose }) {
  return (
    <div style={emojiStyles.overlay} onClick={onClose}>
      <div style={emojiStyles.picker} onClick={(e) => e.stopPropagation()}>
        <div style={emojiStyles.grid}>
          {EMOJI_GRID.map((em) => (
            <button key={em} style={emojiStyles.btn} onClick={() => { onSelect(em); onClose(); }}>
              {em}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const emojiStyles = {
  overlay: { position: 'fixed', inset: 0, zIndex: 1000 },
  picker: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    background: '#fff', borderRadius: '14px', padding: '14px',
    boxShadow: '0 8px 32px rgba(99,102,241,0.15)', border: '1px solid #e2e8f0', width: '220px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px' },
  btn: {
    background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer',
    padding: '4px', borderRadius: '6px', lineHeight: 1,
  },
};

function Accordion({ title, defaultOpen, open, onToggle, summary, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen || false);
  const controlled = open !== undefined;
  const expanded = controlled ? open : isOpen;

  useEffect(() => {
    if (defaultOpen) setIsOpen(true);
  }, [defaultOpen]);

  return (
    <div style={styles.accordion}>
      <button
        style={styles.accordionHeader}
        onClick={() => {
          if (onToggle) onToggle();
          else if (!controlled) setIsOpen((v) => !v);
        }}
      >
        <span style={styles.accordionTitle}>{title}{!expanded && summary ? <span style={styles.accordionSummary}> — {summary}</span> : null}</span>
        <span style={styles.accordionChevron}>{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && <div style={styles.accordionBody}>{children}</div>}
    </div>
  );
}

const STEP_TYPES = [
  { value: 'text', label: 'Text input' },
  { value: 'choice', label: 'Choice buttons' },
  { value: 'choice_with_manual', label: 'Choice + manual' },
  { value: 'select_from_menu', label: 'Select from existing menu (with preview)' },
];

function StepTypeLabel(type) {
  const found = STEP_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
}

function getSuggestions(type) {
  switch (type) {
    case 'text': return ["What's your name?", "What's your phone number?", "Any additional notes?", "Can you describe your request?"];
    case 'choice': return ['Choose an option', 'Select one', 'Which one do you prefer?'];
    case 'choice_with_manual': return ['When would you like to come?', 'Pick a date', 'Select a time', 'Choose or enter manually'];
    case 'select_from_menu': return ['Which service would you like?', 'What service are you interested in?', 'Select a service', 'Choose a category'];
    default: return [];
  }
}

function SortableStepItem({ step, idx, expandedStepId, setExpandedStepId, updateStep, removeStep, addOption, updateOption, removeOption, allButtons }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const isExpanded = expandedStepId === step.id;
  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={{ ...flowBuilderStyles.stepCard, ...dndStyle, ...(isDragging ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : {}) }}>
      <div
        style={{ ...flowBuilderStyles.stepHeader, cursor: 'pointer' }}
        onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
      >
        <span {...attributes} {...listeners} style={flowBuilderStyles.dragHandle} onClick={(e) => e.stopPropagation()}>⠿</span>
        <span style={flowBuilderStyles.stepNum}>Step {idx + 1}</span>
        {!isExpanded && step.question && <span style={flowBuilderStyles.stepPreview}>{step.question}</span>}
        {!isExpanded && <span style={flowBuilderStyles.stepTypeBadge}>{StepTypeLabel(step.type)}</span>}
        <span style={flowBuilderStyles.expandChevron}>{isExpanded ? '▾' : '▸'}</span>
        <button style={flowBuilderStyles.removeBtn} onClick={(e) => { e.stopPropagation(); removeStep(step.id); }} title="Remove">✕</button>
      </div>

      {isExpanded && (
        <div style={flowBuilderStyles.stepBody}>
          <label style={styles.label}>Question</label>
          <input
            style={styles.input}
            value={step.question}
            onChange={(e) => updateStep(step.id, 'question', e.target.value)}
            placeholder="e.g. What date would you like?"
          />
          {(() => {
            const suggestions = getSuggestions(step.type);
            return suggestions.length > 0 ? (
              <div style={flowBuilderStyles.suggestionsRow}>
                <span style={flowBuilderStyles.suggestionsLabel}>💡</span>
                {suggestions.map((s) => (
                  <button key={s} style={flowBuilderStyles.suggestionChip} onClick={() => updateStep(step.id, 'question', s)}>{s}</button>
                ))}
              </div>
            ) : null;
          })()}

          <label style={styles.label}>Summary label</label>
          <input
            style={styles.input}
            value={step.label || ''}
            onChange={(e) => updateStep(step.id, 'label', e.target.value)}
            placeholder="e.g. Name, Date, Service..."
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={styles.label}>Type</label>
            <select
              style={styles.select}
              value={step.type}
              onChange={(e) => updateStep(step.id, 'type', e.target.value)}
            >
              {STEP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {step.type === 'select_from_menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={styles.label}>Start from menu</label>
              <MenuRootPicker
                value={step.menuRoot}
                onChange={(val) => updateStep(step.id, 'menuRoot', val)}
                allButtons={allButtons}
              />
              <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>This will show service info before continuing the flow</div>
            </div>
          )}

          {(step.type === 'choice' || step.type === 'choice_with_manual') && (
            <div style={flowBuilderStyles.optionsSection}>
              <div style={flowBuilderStyles.optionsLabel}>Choices</div>
              {(step.options || []).map((opt) => (
                <div key={opt.id} style={flowBuilderStyles.optionRow}>
                  <span style={flowBuilderStyles.optionBullet}>○</span>
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    value={opt.label}
                    onChange={(e) => updateOption(step.id, opt.id, e.target.value)}
                    placeholder="Choice label..."
                  />
                  <button style={flowBuilderStyles.removeBtn} onClick={() => removeOption(step.id, opt.id)} title="Remove">✕</button>
                </div>
              ))}
              <button style={flowBuilderStyles.addOptionBtn} onClick={() => addOption(step.id)}>+ Add choice</button>
              {step.type === 'choice_with_manual' && (
                <>
                  <div style={{ ...flowBuilderStyles.optionsLabel, marginTop: '6px' }}>Manual input placeholder</div>
                  <input
                    style={styles.input}
                    value={step.manualPlaceholder || ''}
                    onChange={(e) => updateStep(step.id, 'manualPlaceholder', e.target.value)}
                    placeholder="e.g. Type your preferred date..."
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simplified FlowBuilder for info page action buttons
function InfoActionFlowBuilder({ flowSteps, onUpdateSteps, genId, allButtons }) {
  const [expandedStepId, setExpandedStepId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function updateStep(sId, field, value) {
    onUpdateSteps(flowSteps.map((s) => s.id === sId ? { ...s, [field]: value } : s));
  }

  function addStep() {
    const newStep = { id: genId(), question: getSuggestions('text')[0] || '', type: 'text', key: `step_${flowSteps.length + 1}`, options: [] };
    onUpdateSteps([...flowSteps, newStep]);
    setExpandedStepId(newStep.id);
  }

  function removeStep(sId) {
    onUpdateSteps(flowSteps.filter((s) => s.id !== sId));
    if (expandedStepId === sId) setExpandedStepId(null);
  }

  function addOption(sId) {
    onUpdateSteps(flowSteps.map((s) =>
      s.id === sId ? { ...s, options: [...(s.options || []), { id: genId(), label: '' }] } : s
    ));
  }

  function updateOption(sId, optId, label) {
    onUpdateSteps(flowSteps.map((s) =>
      s.id === sId ? { ...s, options: (s.options || []).map((o) => o.id === optId ? { ...o, label } : o) } : s
    ));
  }

  function removeOption(sId, optId) {
    onUpdateSteps(flowSteps.map((s) =>
      s.id === sId ? { ...s, options: (s.options || []).filter((o) => o.id !== optId) } : s
    ));
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = flowSteps.findIndex((s) => s.id === active.id);
    const newIndex = flowSteps.findIndex((s) => s.id === over.id);
    onUpdateSteps(arrayMove(flowSteps, oldIndex, newIndex));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>Flow steps</div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={flowSteps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {flowSteps.map((step, idx) => (
            <SortableStepItem
              key={step.id}
              step={step}
              idx={idx}
              expandedStepId={expandedStepId}
              setExpandedStepId={setExpandedStepId}
              updateStep={updateStep}
              removeStep={removeStep}
              addOption={addOption}
              updateOption={updateOption}
              removeOption={removeOption}
              allButtons={allButtons}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button style={styles.addChildButton} onClick={addStep}>+ Add Step</button>
    </div>
  );
}

function FlowBuilder({ flowSteps, buttonId, onUpdateButton, genId, allButtons, open, onToggle }) {
  const [expandedStepId, setExpandedStepId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function updateSteps(newSteps) {
    onUpdateButton(buttonId, { flowSteps: newSteps });
  }

  function updateStep(sId, field, value) {
    updateSteps(flowSteps.map((s) =>
      s.id === sId ? { ...s, [field]: value } : s
    ));
  }

  function addStep() {
    const newStep = { id: genId(), question: getSuggestions('text')[0] || '', type: 'text', key: `step_${flowSteps.length + 1}`, options: [] };
    updateSteps([...flowSteps, newStep]);
    setExpandedStepId(newStep.id);
  }

  function removeStep(sId) {
    updateSteps(flowSteps.filter((s) => s.id !== sId));
    if (expandedStepId === sId) setExpandedStepId(null);
  }

  function addOption(sId) {
    updateSteps(flowSteps.map((s) =>
      s.id === sId ? { ...s, options: [...(s.options || []), { id: genId(), label: '' }] } : s
    ));
  }

  function updateOption(sId, optId, label) {
    updateSteps(flowSteps.map((s) =>
      s.id === sId
        ? { ...s, options: (s.options || []).map((o) => o.id === optId ? { ...o, label } : o) }
        : s
    ));
  }

  function removeOption(sId, optId) {
    updateSteps(flowSteps.map((s) =>
      s.id === sId
        ? { ...s, options: (s.options || []).filter((o) => o.id !== optId) }
        : s
    ));
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = flowSteps.findIndex((s) => s.id === active.id);
    const newIndex = flowSteps.findIndex((s) => s.id === over.id);
    updateSteps(arrayMove(flowSteps, oldIndex, newIndex));
  }

  return (
    <Accordion title="⚡ Flow steps" defaultOpen={open === undefined} open={open} onToggle={onToggle} summary={flowSteps.length > 0 ? `${flowSteps.length} step${flowSteps.length !== 1 ? 's' : ''}` : null}>
      <p style={styles.accordionDesc}>Define the step-by-step questions for this action.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={flowSteps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {flowSteps.map((step, idx) => (
              <SortableStepItem
                key={step.id}
                step={step}
                idx={idx}
                expandedStepId={expandedStepId}
                setExpandedStepId={setExpandedStepId}
                updateStep={updateStep}
                removeStep={removeStep}
                addOption={addOption}
                updateOption={updateOption}
                removeOption={removeOption}
                allButtons={allButtons}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button style={styles.addChildButton} onClick={addStep}>
        + Add Step
      </button>

      <p style={styles.childHint}>
        Double-click the button on the phone to preview the flow.
      </p>
    </Accordion>
  );
}

const flowBuilderStyles = {
  stepCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'box-shadow 0.15s ease',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 10px',
    background: '#f8fafc',
    borderBottom: '1px solid #f1f5f9',
  },
  stepBody: {
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  stepNum: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#7c3aed',
    flexShrink: 0,
  },
  stepPreview: {
    fontSize: '12px',
    color: '#666',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stepTypeBadge: {
    fontSize: '10px',
    color: '#888',
    background: '#f0f0f0',
    borderRadius: '4px',
    padding: '2px 6px',
    flexShrink: 0,
  },
  expandChevron: {
    fontSize: '11px',
    color: '#999',
    flexShrink: 0,
  },
  dragHandle: {
    fontSize: '14px',
    color: '#bbb',
    cursor: 'grab',
    userSelect: 'none',
    padding: '2px',
    lineHeight: 1,
    touchAction: 'none',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '2px 4px',
    lineHeight: 1,
    flexShrink: 0,
  },
  row: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  optionsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingLeft: '4px',
  },
  optionsLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#888',
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  optionBullet: {
    fontSize: '14px',
    color: '#bbb',
  },
  addOptionBtn: {
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 0',
    textAlign: 'left',
  },
  suggestionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'center',
    marginTop: '2px',
  },
  suggestionsLabel: {
    fontSize: '12px',
    flexShrink: 0,
  },
  suggestionChip: {
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    borderRadius: '12px',
    padding: '3px 10px',
    fontSize: '11px',
    color: '#6366f1',
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    lineHeight: '1.4',
  },
};

const ACTION_BUTTON_BEHAVIORS = [
  { key: 'start_flow', label: '📋 Start flow', desc: 'Ask step-by-step questions' },
  { key: 'go_back', label: '← Back', desc: 'Return to previous screen' },
];

function flattenButtons(btns, depth = 0) {
  const result = [];
  for (const btn of btns) {
    result.push({ id: btn.id, label: btn.label, behavior: btn.behavior, depth });
    if (btn.children && btn.children.length > 0) {
      result.push(...flattenButtons(btn.children, depth + 1));
    }
  }
  return result;
}

function MenuRootPicker({ value, onChange, allButtons }) {
  function flattenParents(btns, depth = 0) {
    const result = [];
    for (const btn of btns) {
      if (btn.children && btn.children.length > 0) {
        result.push({ id: btn.id, label: btn.label, depth });
        result.push(...flattenParents(btn.children, depth + 1));
      }
    }
    return result;
  }
  const targets = flattenParents(allButtons || []);
  return (
    <div>
      <select
        style={{ ...styles.input, padding: '8px' }}
        value={value != null ? String(value) : ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">— Select starting point —</option>
        {targets.map((t) => (
          <option key={t.id} value={String(t.id)}>
            {'\u00A0\u00A0'.repeat(t.depth)}📂 {t.label}
          </option>
        ))}
      </select>
      {!value && <div style={{ fontSize: '11px', color: '#e53e3e', marginTop: '4px' }}>⚠ Required: select a starting menu</div>}
    </div>
  );
}



function InfoPageEditor({ infoPage, buttonId, onUpdateButton, genId, allButtons, staff, businessId }) {
  const [emojiTarget, setEmojiTarget] = useState(null);
  const [uploading, setUploading] = useState(false);

  function update(field, value) {
    onUpdateButton(buttonId, { infoPage: { ...infoPage, [field]: value } });
  }

  function insertEmoji(emoji) {
    if (emojiTarget === 'title') update('title', (infoPage.title || '') + emoji);
    else if (emojiTarget === 'description') update('description', (infoPage.description || '') + emoji);
  }

  return (
    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Content */}
      <Accordion title="📝 What should your customer see?" defaultOpen>
        <label style={styles.label}>Title</label>
        <div style={styles.inputWithEmoji}>
          <input
            style={{ ...styles.input, paddingRight: '32px' }}
            value={infoPage.title}
            onChange={(e) => update('title', e.target.value)}
          />
          <button style={styles.emojiBtn} onClick={() => setEmojiTarget('title')} title="Add emoji">😀</button>
        </div>

        <label style={styles.label}>Description</label>
        <div style={styles.inputWithEmoji}>
          <textarea
            style={{ ...styles.textarea, paddingRight: '32px' }}
            value={infoPage.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            placeholder="Describe this service or item..."
          />
          <button style={{ ...styles.emojiBtn, top: '6px' }} onClick={() => setEmojiTarget('description')} title="Add emoji">😀</button>
        </div>

        {emojiTarget && (
          <EmojiPicker onSelect={insertEmoji} onClose={() => setEmojiTarget(null)} />
        )}

        <div style={styles.infoRow}>
          <div style={{ ...styles.infoField, flex: 2 }}>
            <label style={styles.label}>Amount</label>
            <input
              style={styles.input}
              type="number"
              min="0"
              value={infoPage.amount || ''}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="120"
            />
          </div>
          <div style={{ ...styles.infoField, flex: 1 }}>
            <label style={styles.label}>Currency</label>
            <select
              style={styles.select}
              value={infoPage.currency || 'USD'}
              onChange={(e) => update('currency', e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
        </div>

        <label style={styles.label}>Duration</label>
        <input
          style={styles.input}
          value={infoPage.duration || ''}
          onChange={(e) => update('duration', e.target.value)}
          placeholder="e.g. 30 min"
        />

        <div style={{ ...styles.sectionHeader, marginTop: '8px' }}>Display options</div>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={infoPage.showPrice !== false}
            onChange={(e) => update('showPrice', e.target.checked)}
          />
          <span>Highlight price</span>
        </label>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={infoPage.showDuration !== false}
            onChange={(e) => update('showDuration', e.target.checked)}
          />
          <span>Show duration</span>
        </label>
      </Accordion>

      {/* Media */}
      <Accordion title="📷 Media (Optional)" summary={infoPage.media && infoPage.media.length > 0 ? `${infoPage.media.length} file${infoPage.media.length !== 1 ? 's' : ''}` : null}>
        <p style={styles.accordionDesc}>Upload images or files to show in this info page. The first image will appear as a header in the chat.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(infoPage.media || []).map((m, idx) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {m.mediaType === 'image' ? '🖼️' : m.mediaType === 'video' ? '🎬' : m.mediaType === 'audio' ? '🎵' : '📄'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.fileName}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>{m.mediaType}</div>
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53935', fontSize: '16px', padding: '4px' }}
                title="Remove"
                onClick={async () => {
                  try {
                    await deleteButtonMedia(businessId, m.id);
                    update('media', (infoPage.media || []).filter((x) => x.id !== m.id));
                  } catch (err) { console.error(err); }
                }}
              >✕</button>
            </div>
          ))}
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '12px', border: '2px dashed #ddd', borderRadius: '8px', cursor: uploading ? 'wait' : 'pointer',
            color: '#888', fontSize: '13px', transition: 'border-color 0.2s',
          }}>
            <input
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const result = await uploadButtonMedia(businessId, buttonId, file);
                  update('media', [...(infoPage.media || []), { id: result.id, fileName: result.fileName, mediaType: result.mediaType, sortOrder: result.sortOrder }]);
                } catch (err) {
                  alert(err.message);
                } finally {
                  setUploading(false);
                  e.target.value = '';
                }
              }}
            />
            {uploading ? '⏳ Uploading...' : '+ Add photo or file'}
          </label>
          <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>
            Image: max 5MB (JPEG, PNG) · Video: max 16MB (MP4) · Doc: max 100MB (PDF)
          </p>
        </div>
      </Accordion>

      {/* Actions */}
      <Accordion title="❓ Extra Questions (Optional)" summary={infoPage.extraSteps && infoPage.extraSteps.length > 0 ? `${infoPage.extraSteps.length} step${infoPage.extraSteps.length !== 1 ? 's' : ''}` : null}>
        <p style={styles.accordionDesc}>Add service-specific questions appended to the booking flow when "Book this" is clicked.</p>
        <InfoActionFlowBuilder
          flowSteps={infoPage.extraSteps || []}
          onUpdateSteps={(newSteps) => update('extraSteps', newSteps)}
          genId={genId}
          allButtons={allButtons}
        />
      </Accordion>

      <Accordion title="👆 Buttons inside this page" defaultOpen>
        <p style={styles.accordionDesc}>These buttons will be shown after entering this page</p>
        <div style={styles.actionButtonsList}>
          {infoPage.actionButtons.map((ab, idx) => {
            const updateAb = (changes) => {
              const updated = [...infoPage.actionButtons];
              updated[idx] = { ...ab, ...changes };
              onUpdateButton(buttonId, { infoPage: { ...infoPage, actionButtons: updated } });
            };

            return (
              <div key={ab.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    value={ab.label}
                    onChange={(e) => updateAb({ label: e.target.value })}
                  />
                  <button
                    style={styles.removeActionButton}
                    onClick={() => {
                      const updated = infoPage.actionButtons.filter((x) => x.id !== ab.id);
                      onUpdateButton(buttonId, { infoPage: { ...infoPage, actionButtons: updated } });
                    }}
                    title="Remove"
                  >✕</button>
                </div>

                {/* Action type selector */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {ACTION_BUTTON_BEHAVIORS.map((at) => (
                    <button
                      key={at.key}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        fontSize: '11px',
                        fontWeight: ab.behavior === at.key ? 600 : 400,
                        background: ab.behavior === at.key ? '#eef2ff' : '#fff',
                        border: ab.behavior === at.key ? '2px solid #6366f1' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: ab.behavior === at.key ? '#6366f1' : '#64748b',
                      }}
                      onClick={() => {
                        const changes = { behavior: at.key };
                        if (at.key === 'start_flow' && !ab.flowSteps) {
                          changes.flowSteps = [{ id: genId(), question: getSuggestions('text')[0] || '', type: 'text', key: 'step_1', options: [] }];
                        }
                        updateAb(changes);
                      }}
                    >{at.label}</button>
                  ))}
                </div>

                {/* Conditional config based on action type */}
                {ab.behavior === 'start_flow' && ab.flowSteps && (
                  <InfoActionFlowBuilder
                    flowSteps={ab.flowSteps}
                    onUpdateSteps={(newSteps) => updateAb({ flowSteps: newSteps })}
                    genId={genId}
                    allButtons={allButtons}
                  />
                )}

                {/* Per-button Delivery Settings */}
                {ab.behavior === 'start_flow' && (
                  <ButtonDelivery
                    deliveryMethod={ab.deliveryMethod || 'none'}
                    deliveryStaffId={ab.deliveryStaffId || ''}
                    staff={staff}
                    onChange={(changes) => updateAb(changes)}
                  />
                )}

              </div>
            );
          })}
        </div>
        <button
          style={styles.addChildButton}
          onClick={() => {
            const updated = [...infoPage.actionButtons, { id: genId(), label: 'New button', behavior: 'start_flow', flowSteps: [{ id: genId(), question: getSuggestions('text')[0] || '', type: 'text', key: 'step_1', options: [] }], deliveryMethod: 'none', deliveryStaffId: '' }];
            onUpdateButton(buttonId, { infoPage: { ...infoPage, actionButtons: updated } });
          }}
        >+ Add action button</button>
      </Accordion>

      <p style={styles.childHint}>
        Double-click the button on the phone to preview the info page.
      </p>
    </div>
  );
}

function ButtonDelivery({ deliveryMethod, deliveryStaffId, staff, onChange }) {
  const filteredStaff = (staff || []).filter((s) => {
    if (deliveryMethod === 'email') return s.email;
    if (deliveryMethod === 'telegram') return s.telegram_chat_id;
    return true;
  });

  const selectedStaff = staff?.find((s) => s.id === Number(deliveryStaffId));
  const validationError = (() => {
    if (!selectedStaff || deliveryMethod === 'none') return null;
    if (deliveryMethod === 'email' && !selectedStaff.email) return 'Selected staff has no email address.';
    if (deliveryMethod === 'telegram' && !selectedStaff.telegram_chat_id) return 'Selected staff has no Telegram Chat ID.';
    return null;
  })();

  return (
    <div style={{ background: '#f0f8ff', borderRadius: '8px', padding: '10px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>📨 Delivery</div>

      <label style={{ fontSize: '11px', fontWeight: 500, color: '#888' }}>Delivery Method</label>
      <select
        value={deliveryMethod}
        onChange={(e) => onChange({ deliveryMethod: e.target.value, deliveryStaffId: '' })}
        style={{ ...styles.input, padding: '7px 8px', fontSize: '13px' }}
      >
        <option value="none">None</option>
        <option value="email">✉ Email</option>
        <option value="telegram">✈ Telegram</option>
        <option value="whatsapp" disabled>WhatsApp (coming soon)</option>
      </select>

      {deliveryMethod !== 'none' && (
        <>
          <label style={{ fontSize: '11px', fontWeight: 500, color: '#888' }}>Assign to Staff</label>
          <select
            value={deliveryStaffId}
            onChange={(e) => onChange({ deliveryStaffId: e.target.value ? Number(e.target.value) : '' })}
            style={{ ...styles.input, padding: '7px 8px', fontSize: '13px' }}
          >
            <option value="">— Select staff —</option>
            {filteredStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.role ? ` (${s.role})` : ''}
                {deliveryMethod === 'email' && s.email ? ` — ${s.email}` : ''}
                {deliveryMethod === 'telegram' && s.telegram_chat_id ? ` — ${s.telegram_chat_id}` : ''}
              </option>
            ))}
          </select>

          {filteredStaff.length === 0 && staff.length > 0 && (
            <div style={{ fontSize: '11px', color: '#e53e3e' }}>
              ⚠ No staff with {deliveryMethod === 'email' ? 'email' : 'Telegram chat ID'} configured. Add contact details in Staff page.
            </div>
          )}

          {validationError && (
            <div style={{ fontSize: '11px', color: '#e53e3e' }}>⚠ {validationError}</div>
          )}
        </>
      )}
    </div>
  );
}

// ── Template preview card ──
function TemplateCard({ tpl, onLoadTemplate }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const p = tpl.preview;

  const handleApply = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      await onLoadTemplate(tpl.key);
    } catch (err) {
      console.error('Template apply failed:', err);
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', width: '100%' }}
        onClick={() => { setExpanded(!expanded); setConfirming(false); }}
      >
        <span style={{ fontSize: '22px' }}>{tpl.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{tpl.name}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{tpl.description}</div>
        </div>
        <span style={{ fontSize: '12px', color: '#94a3b8', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </div>
      {expanded && p && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: 8 }}>
            <strong>{p.total} services/items</strong> across {p.categories.length} categories:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 6 }}>
            {p.categories.map((cat) => (
              <span key={cat} style={{ fontSize: '10px', background: '#eef2ff', color: '#4338ca', padding: '2px 8px', borderRadius: 12, fontWeight: 500 }}>{cat}</span>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: 6 }}>📋 Flow: {p.flow}</div>
          {confirming && (
            <div style={{ marginTop: 8, padding: '8px 10px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, fontSize: 11, color: '#856404' }}>
              ⚠️ This will replace your current buttons and welcome message. Click again to confirm.
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleApply(); }}
              disabled={loading}
              style={{
                flex: 1, padding: '8px 16px', background: confirming ? '#dc3545' : '#6366f1', color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Applying…' : confirming ? 'Confirm Apply' : 'Apply Template'}
            </button>
            {confirming && (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                style={{ padding: '8px 12px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPanel({ welcomeMessage, onWelcomeChange, selectedButton, onBehaviorChange, onBack, errorMessage, onAddChild, path, parentButton, visibleButtons, onAddButton, onSelectButton, onUpdateButton, genId, allButtons, templates, onLoadTemplate, businessId, flowId, onGoBack }) {
  const [openSections, setOpenSections] = useState({ behavior: true, flow: false });
  const [staff, setStaff] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Load staff for delivery dropdowns
  useEffect(() => {
    if (businessId) {
      fetchStaff(businessId).then((list) => setStaff(list || []));
    }
  }, [businessId]);

  // Reset sections when selected button changes
  const selectedId = selectedButton ? selectedButton.id : null;
  useEffect(() => {
    if (selectedId) {
      setOpenSections({ behavior: true, flow: false });
    }
  }, [selectedId]);

  // If a button is selected, show its settings
  if (selectedButton) {
    const hasChildren = selectedButton.children && selectedButton.children.length > 0;
    const isSubButtons = selectedButton.behavior === 'menu';
    const isInfo = selectedButton.behavior === 'info';
    const behaviorSummary = selectedButton.behavior ? (BEHAVIORS.find((b) => b.key === selectedButton.behavior)?.label || null) : null;

    return (
      <div style={styles.panel}>
        {/* Contextual guide banner */}
        <div style={styles.guideBanner}>
          <div style={styles.guideBannerIcon}>⚙️</div>
          <div>
            <div style={styles.guideBannerTitle}>
              {isInfo ? 'Info Page Settings' : isSubButtons ? 'Menu Button Settings' : 'Button Settings'}
            </div>
            <div style={styles.guideBannerText}>
              {isInfo
                ? 'Set up the information page your customer sees — title, description, price, and action buttons.'
                : isSubButtons
                  ? 'This button opens a sub-menu. Configure the label, then add or manage sub-options below.'
                  : 'Choose what happens when a customer taps this button — show info or open more options.'}
            </div>
          </div>
        </div>

        {/* Breadcrumb back */}
        <button style={styles.backButton} onClick={onBack}>
          ← {path.length > 0 && parentButton ? `Back to ${parentButton.label}` : 'Back to welcome'}
        </button>

        <h2 style={styles.title}>Button settings</h2>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px', lineHeight: '1.5' }}>Configure what this button does when a customer taps it in WhatsApp.</p>

        {/* Button label */}
        <label style={styles.label}>Button label <span style={{ color: '#94a3b8', fontWeight: 400 }}>— visible to customers</span></label>
        <input
          style={{
            ...styles.input,
            ...(selectedButton.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim().length > 20
              ? { borderColor: '#f59e0b', boxShadow: '0 0 0 1px #f59e0b' } : {}),
          }}
          value={selectedButton.label}
          onChange={(e) => onUpdateButton(selectedButton.id, { label: e.target.value })}
          maxLength={50}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 11 }}>
          <span style={{ color: selectedButton.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim().length > 20 ? '#f59e0b' : '#9ca3af' }}>
            {selectedButton.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim().length > 20
              ? '⚠ Button limit is 20 chars (emojis stripped)'
              : `${selectedButton.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim().length}/20 chars`}
          </span>
        </div>

        {errorMessage && (
          <div style={{ ...styles.errorBox, marginTop: '8px' }}>{errorMessage}</div>
        )}

        {/* Behavior */}
        <Accordion
          title="⚙️ What happens on tap?"
          open={openSections.behavior}
          onToggle={() => setOpenSections((prev) => ({ ...prev, behavior: !prev.behavior }))}
          summary={behaviorSummary}
        >
          <p style={styles.accordionDesc}>Choose what your customer sees after tapping this button:</p>
          <div style={styles.optionsList}>
            {BEHAVIORS.map((b) => {
              const isSelected = selectedButton.behavior === b.key;
              return (
                <button
                  key={b.key}
                  style={{
                    ...styles.optionCard,
                    ...(isSelected ? styles.optionCardSelected : {}),
                  }}
                  onClick={() => {
                    onBehaviorChange(b.key);
                    setOpenSections((prev) => ({
                      ...prev,
                      behavior: false,
                    }));
                  }}
                >
                  <div style={styles.optionHeader}>
                    <span style={styles.optionIcon}>{b.icon}</span>
                    <span style={{
                      ...styles.optionLabel,
                      ...(isSelected ? styles.optionLabelSelected : {}),
                    }}>{b.label}</span>
                  </div>
                  <div style={styles.optionDesc}>{b.description}</div>
                  {isSelected && <div style={styles.checkmark}>✓</div>}
                </button>
              );
            })}
          </div>
        </Accordion>

        {/* Info page accordion sections */}
        {isInfo && selectedButton.infoPage && (
          <InfoPageEditor
            infoPage={selectedButton.infoPage}
            buttonId={selectedButton.id}
            onUpdateButton={onUpdateButton}
            genId={genId}
            allButtons={allButtons}
            staff={staff}
            businessId={businessId}
          />
        )}

        {/* Sub-buttons section */}
        {isSubButtons && (
          <Accordion title="📂 Sub-options" defaultOpen>
            <div style={styles.childrenHeader}>
              {hasChildren ? selectedButton.children.length : 0} sub-option{hasChildren && selectedButton.children.length !== 1 ? 's' : ''}
            </div>
            {hasChildren && (
              <div style={styles.childrenList}>
                {selectedButton.children.map((child) => (
                  <div key={child.id} style={styles.childItem}>
                    {child.label}
                    {child.behavior && (
                      <span style={styles.childBadge}>{BEHAVIOR_LABELS[child.behavior]}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button style={styles.addChildButton} onClick={onAddChild}>
              + Add sub-option
            </button>
            <p style={styles.childHint}>
              Double-click the button on the phone to see and edit sub-options.
            </p>
          </Accordion>
        )}
      </div>
    );
  }

  // Inside a submenu (no button selected) → show submenu editor
  if (path && path.length > 0 && parentButton) {
    return (
      <div style={styles.panel}>
        {/* Contextual guide banner */}
        <div style={styles.guideBanner}>
          <div style={styles.guideBannerIcon}>📂</div>
          <div>
            <div style={styles.guideBannerTitle}>Sub-menu Editor</div>
            <div style={styles.guideBannerText}>
              You're editing the sub-options inside <strong>"{parentButton.label}"</strong>. Click any option to configure what it does, or add new ones.
            </div>
          </div>
        </div>

        {/* Back navigation */}
        <button style={styles.backButton} onClick={onGoBack}>
          ← {path.length > 1 ? 'Back one level' : 'Back to welcome'}
        </button>

        <h2 style={styles.title}>Sub-options of "{parentButton.label}"</h2>
        <p style={styles.subtitle}>Your customer sees these options after tapping <strong>"{parentButton.label}"</strong>. Click any option below to configure it.</p>

        <div style={styles.childrenList}>
          {visibleButtons && visibleButtons.map((child) => (
            <button
              key={child.id}
              style={styles.submenuItem}
              onClick={() => onSelectButton(child.id)}
            >
              <span>{child.label}</span>
              {child.behavior && (
                <span style={styles.childBadge}>{BEHAVIOR_LABELS[child.behavior]}</span>
              )}
            </button>
          ))}
        </div>

        <button style={styles.addChildButton} onClick={onAddButton}>
          + Add sub-option
        </button>

        <div style={styles.tipBox}>
          💡 Click any sub-option to set what it does. Double-click on the phone preview to drill into nested menus.
        </div>
      </div>
    );
  }

  // Default: welcome message editor (root level)
  const rootBtnCount = visibleButtons?.length || 0;
  const hasButtons = rootBtnCount > 0;
  const waOverLimit = rootBtnCount > 10;
  const igOverLimit = rootBtnCount > 13;
  const channelWarnings = [];
  if (waOverLimit) channelWarnings.push('WhatsApp supports max 10 menu items. Extra buttons will be hidden.');
  if (igOverLimit) channelWarnings.push('Instagram supports max 13 quick replies. Extra buttons will be hidden.');

  return (
    <div style={styles.panel}>
      {/* Contextual guide banner */}
      <div style={styles.guideBanner}>
        <div style={styles.guideBannerIcon}>👋</div>
        <div>
          <div style={styles.guideBannerTitle}>Welcome Screen</div>
          <div style={styles.guideBannerText}>
            {hasButtons
              ? 'Edit your welcome message below. Click any button on the phone preview to configure it.'
              : 'Start by picking a template below, or write your welcome message and add buttons on the phone preview.'}
          </div>
        </div>
      </div>

      <h2 style={{ ...styles.title, margin: '0 0 4px' }}>Welcome Message</h2>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px', lineHeight: '1.5' }}>
        This is the first thing your customers see when they message your bot.
      </p>

      <label style={styles.label}>Message text</label>
      <textarea
        style={{
          ...styles.textarea,
          ...(!welcomeMessage?.trim() ? { borderColor: '#f59e0b', boxShadow: '0 0 0 1px #f59e0b' } : {}),
        }}
        value={welcomeMessage}
        onChange={(e) => onWelcomeChange(e.target.value)}
        rows={3}
      />
      {!welcomeMessage?.trim() && (
        <p style={{ fontSize: 11, color: '#f59e0b', margin: '2px 0 0' }}>⚠ Welcome message is required</p>
      )}
      <p style={styles.hint}>Your customer receives this as a chat message with the buttons below it.</p>

      {/* Channel limit warnings */}
      {channelWarnings.length > 0 && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 8, padding: '8px 12px', marginTop: 8, fontSize: 12,
        }}>
          {channelWarnings.map((w, i) => (
            <div key={i} style={{ color: '#b91c1c', marginBottom: i < channelWarnings.length - 1 ? 4 : 0 }}>
              ⚠ {w}
            </div>
          ))}
        </div>
      )}

      {hasButtons && (
        <div style={styles.tipBox}>
          💡 <strong>How it works:</strong> Click any button on the phone preview →
          set its behavior (show info or sub-menu) → save. Your bot is ready!
        </div>
      )}

      {/* Template selector — collapsible when buttons already exist */}
      {templates && templates.length > 0 && (
        <>
          {hasButtons ? (
            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#64748b', padding: 0 }}
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <span>🚀</span> Templates {showTemplates ? '▾' : '▸'}
                <span style={{ fontSize: '11px', fontWeight: 400, color: '#94a3b8' }}>— replace current setup</span>
              </button>
              {showTemplates && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', lineHeight: '1.5' }}>⚠️ Applying a template will replace your current buttons and welcome message.</p>
                  {templates.map((tpl) => (
                    <TemplateCard key={tpl.key} tpl={tpl} onLoadTemplate={onLoadTemplate} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '16px' }}>🚀</span>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Quick start with a template</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 12px', lineHeight: '1.5' }}>Pick a pre-built business template to get started instantly. You can customize everything after.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {templates.map((tpl) => (
                  <TemplateCard key={tpl.key} tpl={tpl} onLoadTemplate={onLoadTemplate} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  panel: {
    flex: 1,
    minWidth: 0,
    background: '#fff',
    padding: '24px 28px',
    borderLeft: '1px solid #e2e8f0',
    flexShrink: 1,
    height: '100vh',
    overflowY: 'auto',
    position: 'sticky',
    top: 0,
  },
  guideBanner: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '14px 16px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '16px',
  },
  guideBannerIcon: {
    fontSize: '20px',
    flexShrink: 0,
    marginTop: '1px',
  },
  guideBannerTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '2px',
  },
  guideBannerText: {
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '1.5',
  },
  accordion: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    marginTop: '10px',
    overflow: 'hidden',
  },
  accordionHeader: {
    width: '100%',
    background: '#f8fafc',
    border: 'none',
    padding: '11px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1e293b',
    textAlign: 'left',
  },
  accordionTitle: {
    flex: 1,
  },
  accordionSummary: {
    fontSize: '12px',
    fontWeight: 400,
    color: '#6366f1',
    fontStyle: 'italic',
  },
  accordionChevron: {
    fontSize: '12px',
    color: '#94a3b8',
    marginLeft: '8px',
  },
  accordionBody: {
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid #e2e8f0',
  },
  accordionDesc: {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 4px 0',
    lineHeight: '1.5',
  },
  title: {
    fontSize: '16px',
    fontWeight: 700,
    margin: '0 0 4px 0',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 16px 0',
    lineHeight: '1.5',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '0',
    marginBottom: '12px',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  optionCard: {
    background: '#f8fafc',
    border: '2px solid transparent',
    borderColor: '#e2e8f0',
    borderRadius: '10px',
    padding: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    position: 'relative',
    transition: 'border-color 0.15s, background 0.15s',
  },
  optionCardSelected: {
    borderColor: '#6366f1',
    background: '#eef2ff',
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  optionIcon: {
    fontSize: '16px',
  },
  optionLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1e293b',
  },
  optionLabelSelected: {
    color: '#6366f1',
  },
  optionDesc: {
    fontSize: '12px',
    color: '#64748b',
    marginLeft: '24px',
  },
  checkmark: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    color: '#6366f1',
    fontWeight: 700,
    fontSize: '16px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#475569',
    marginBottom: '6px',
    display: 'block',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  hint: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '8px',
    lineHeight: '1.5',
  },
  tipBox: {
    marginTop: '16px',
    padding: '12px 14px',
    background: '#eef2ff',
    borderRadius: '10px',
    border: '1px solid #e0e7ff',
    fontSize: '12px',
    color: '#4338ca',
    lineHeight: '1.5',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '12px',
    color: '#dc2626',
    marginBottom: '12px',
  },
  childrenSection: {
    marginTop: '16px',
    borderTop: '1px solid #eee',
    paddingTop: '12px',
  },
  childrenHeader: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '8px',
  },
  childrenList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '8px',
  },
  childItem: {
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '13px',
    color: '#1e293b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #f1f5f9',
  },
  childBadge: {
    fontSize: '10px',
    color: '#6366f1',
    background: '#eef2ff',
    padding: '2px 8px',
    borderRadius: '8px',
    fontWeight: 500,
  },
  addChildButton: {
    background: '#eef2ff',
    border: '1px dashed #a5b4fc',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#6366f1',
    cursor: 'pointer',
    width: '100%',
    fontWeight: 600,
    transition: 'background 0.15s',
  },
  childHint: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '6px',
    fontStyle: 'italic',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  sectionHeader: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '4px',
  },
  inputWithEmoji: {
    position: 'relative',
  },
  emojiBtn: {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '2px',
    lineHeight: 1,
  },
  select: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: '#fff',
    outline: 'none',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#444',
    cursor: 'pointer',
    padding: '4px 0',
  },
  infoRow: {
    display: 'flex',
    gap: '8px',
  },
  infoField: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  actionButtonsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  actionButtonRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  removeActionButton: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
  },
  submenuItem: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#1e293b',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    textAlign: 'left',
    transition: 'border-color 0.15s',
  },
};
