import { useState, useEffect, useId } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BEHAVIORS = [
  {
    key: 'sub_buttons',
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
  {
    key: 'action',
    label: 'Button Action',
    description: 'What should happen when user clicks this button?',
    icon: '⚡',
  },
];

const BEHAVIOR_LABELS = {
  sub_buttons: '▸ more',
  info: 'ℹ info',
  action: '⚡ action',
};

const CURRENCIES = [
  { code: 'TRY', symbol: '₺' },
  { code: 'AED', symbol: 'د.إ' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
];

const STYLE_OPTIONS = [
  { key: 'clean', label: '✨ Clean', desc: 'Simple and minimal' },
  { key: 'friendly', label: '😊 Friendly', desc: 'Warm and inviting' },
  { key: 'premium', label: '💎 Premium', desc: 'Bold and elegant' },
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
    background: '#fff', borderRadius: '12px', padding: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)', width: '220px',
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
  { value: 'select_service_from_menu', label: 'Select from existing menu (with preview)' },
];

function StepTypeLabel(type) {
  const found = STEP_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
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

          {step.type === 'select_service_from_menu' && (
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
    const newStep = { id: genId(), question: '', type: 'text', key: `step_${flowSteps.length + 1}`, options: [] };
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
    const newStep = { id: genId(), question: '', type: 'text', key: `step_${flowSteps.length + 1}`, options: [] };
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
    border: '1px solid #e0e0e0',
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
    background: '#fafafa',
    borderBottom: '1px solid #f0f0f0',
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
    color: '#00a884',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 0',
    textAlign: 'left',
  },
};

const ACTION_TYPES = [
  { key: 'start_flow', label: '📋 Start flow', desc: 'Ask step-by-step questions' },
  { key: 'call', label: '📞 Call', desc: 'Open phone dialer' },
  { key: 'link', label: '🔗 Link', desc: 'Open a URL' },
  { key: 'go_back', label: '← Back', desc: 'Return to previous screen' },
  { key: 'navigate', label: '🔀 Navigate', desc: 'Go to another screen' },
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

function NavigationPicker({ value, onChange, allButtons }) {
  const targets = flattenButtons(allButtons || []);
  return (
    <select
      style={{ ...styles.input, padding: '8px' }}
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">— Select destination —</option>
      <option value="home">🏠 Home (main menu)</option>
      <option value="parent">⬆ Parent menu</option>
      {targets.map((t) => (
        <option key={t.id} value={String(t.id)}>
          {'\u00A0\u00A0'.repeat(t.depth)}{t.behavior === 'sub_buttons' ? '📂' : t.behavior === 'info' ? 'ℹ️' : t.behavior === 'action' ? '⚡' : '•'} {t.label}
        </option>
      ))}
    </select>
  );
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

function ActionEditor({ selectedButton, onUpdateButton, genId, allButtons, openSections, setOpenSections }) {
  const actionType = selectedButton.actionType || null;
  const actionSummary = actionType ? (ACTION_TYPES.find((a) => a.key === actionType)?.label || null) : null;

  return (
    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <Accordion
        title="⚡ Action type"
        open={openSections ? openSections.action : undefined}
        onToggle={setOpenSections ? () => setOpenSections((prev) => ({ ...prev, action: !prev.action })) : undefined}
        summary={actionSummary}
      >
        <p style={styles.accordionDesc}>What should happen when user clicks this button?</p>
        <div style={styles.optionsList}>
          {ACTION_TYPES.map((at) => {
            const isSelected = actionType === at.key;
            return (
              <button
                key={at.key}
                style={{
                  ...styles.optionCard,
                  ...(isSelected ? styles.optionCardSelected : {}),
                  padding: '10px',
                }}
                onClick={() => {
                  const updates = { actionType: at.key };
                  // Initialize empty flow steps when selecting start_flow
                  if (at.key === 'start_flow' && !selectedButton.flowSteps) {
                    updates.flowSteps = [
                      { id: genId(), question: '', type: 'text', key: 'step_1', options: [] },
                    ];
                  }
                  onUpdateButton(selectedButton.id, updates);
                  if (setOpenSections) {
                    setOpenSections((prev) => ({ ...prev, action: false, flow: true }));
                  }
                }}
              >
                <div style={styles.optionHeader}>
                  <span style={{
                    ...styles.optionLabel,
                    ...(isSelected ? styles.optionLabelSelected : {}),
                  }}>{at.label}</span>
                </div>
                <div style={styles.optionDesc}>{at.desc}</div>
                {isSelected && <div style={styles.checkmark}>✓</div>}
              </button>
            );
          })}
        </div>
      </Accordion>

      {actionType === 'start_flow' && selectedButton.flowSteps && (
        <FlowBuilder
          flowSteps={selectedButton.flowSteps}
          buttonId={selectedButton.id}
          onUpdateButton={onUpdateButton}
          genId={genId}
          allButtons={allButtons}
          open={openSections ? openSections.flow : undefined}
          onToggle={setOpenSections ? () => setOpenSections((prev) => ({ ...prev, flow: !prev.flow })) : undefined}
        />
      )}

      {actionType === 'call' && (
        <Accordion title="📞 Phone number" defaultOpen>
          <input
            style={styles.input}
            value={selectedButton.phoneNumber || ''}
            onChange={(e) => onUpdateButton(selectedButton.id, { phoneNumber: e.target.value })}
            placeholder="e.g. +1 555 123 4567"
          />
        </Accordion>
      )}

      {actionType === 'link' && (
        <Accordion title="🔗 URL" defaultOpen>
          <input
            style={styles.input}
            value={selectedButton.linkUrl || ''}
            onChange={(e) => onUpdateButton(selectedButton.id, { linkUrl: e.target.value })}
            placeholder="https://example.com"
          />
        </Accordion>
      )}

      {actionType === 'navigate' && (
        <Accordion title="🔀 Destination" defaultOpen>
          <NavigationPicker
            value={selectedButton.navigateTarget}
            onChange={(target) => onUpdateButton(selectedButton.id, { navigateTarget: target })}
            allButtons={allButtons}
          />
        </Accordion>
      )}
    </div>
  );
}

function InfoPageEditor({ infoPage, buttonId, onUpdateButton, genId, allButtons }) {
  const [emojiTarget, setEmojiTarget] = useState(null);

  function update(field, value) {
    onUpdateButton(buttonId, { infoPage: { ...infoPage, [field]: value } });
  }

  function insertEmoji(emoji) {
    if (emojiTarget === 'title') update('title', (infoPage.title || '') + emoji);
    else if (emojiTarget === 'description') update('description', (infoPage.description || '') + emoji);
  }

  return (
    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Style */}
      <Accordion title="🎨 Style">
        <div style={styles.styleGrid}>
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.key}
              style={{
                ...styles.styleCard,
                ...(infoPage.style === s.key ? styles.styleCardSelected : {}),
              }}
              onClick={() => update('style', s.key)}
            >
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </Accordion>

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

      {/* Actions */}
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
                  {ACTION_TYPES.map((at) => (
                    <button
                      key={at.key}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        fontSize: '11px',
                        fontWeight: ab.actionType === at.key ? 600 : 400,
                        background: ab.actionType === at.key ? '#e8f5e9' : '#fff',
                        border: ab.actionType === at.key ? '2px solid #00a884' : '1px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: ab.actionType === at.key ? '#00a884' : '#666',
                      }}
                      onClick={() => {
                        const changes = { actionType: at.key };
                        if (at.key === 'start_flow' && !ab.flowSteps) {
                          changes.flowSteps = [{ id: genId(), question: '', type: 'text', key: 'step_1', options: [] }];
                        }
                        updateAb(changes);
                      }}
                    >{at.label}</button>
                  ))}
                </div>

                {/* Conditional config based on action type */}
                {ab.actionType === 'start_flow' && ab.flowSteps && (
                  <InfoActionFlowBuilder
                    flowSteps={ab.flowSteps}
                    onUpdateSteps={(newSteps) => updateAb({ flowSteps: newSteps })}
                    genId={genId}
                    allButtons={allButtons}
                  />
                )}

                {ab.actionType === 'call' && (
                  <input
                    style={styles.input}
                    value={ab.phoneNumber || ''}
                    onChange={(e) => updateAb({ phoneNumber: e.target.value })}
                    placeholder="e.g. +1 555 123 4567"
                  />
                )}

                {ab.actionType === 'link' && (
                  <input
                    style={styles.input}
                    value={ab.url || ''}
                    onChange={(e) => updateAb({ url: e.target.value })}
                    placeholder="https://example.com"
                  />
                )}

                {ab.actionType === 'navigate' && (
                  <NavigationPicker
                    value={ab.navigateTarget}
                    onChange={(target) => updateAb({ navigateTarget: target })}
                    allButtons={allButtons}
                  />
                )}
              </div>
            );
          })}
        </div>
        <button
          style={styles.addChildButton}
          onClick={() => {
            const updated = [...infoPage.actionButtons, { id: genId(), label: 'New button', actionType: 'start_flow', flowSteps: [{ id: genId(), question: '', type: 'text', key: 'step_1', options: [] }] }];
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

export default function EditorPanel({ welcomeMessage, onWelcomeChange, selectedButton, onBehaviorChange, onBack, errorMessage, onAddChild, path, parentButton, visibleButtons, onAddButton, onSelectButton, onUpdateButton, genId, allButtons }) {
  const [openSections, setOpenSections] = useState({ behavior: true, action: false, flow: false });

  // Reset sections when selected button changes
  const selectedId = selectedButton ? selectedButton.id : null;
  useEffect(() => {
    if (selectedId) {
      setOpenSections({ behavior: true, action: false, flow: false });
    }
  }, [selectedId]);

  // If a button is selected, show its settings
  if (selectedButton) {
    const hasChildren = selectedButton.children && selectedButton.children.length > 0;
    const isSubButtons = selectedButton.behavior === 'sub_buttons';
    const isInfo = selectedButton.behavior === 'info';
    const isAction = selectedButton.behavior === 'action';
    const behaviorSummary = selectedButton.behavior ? (BEHAVIORS.find((b) => b.key === selectedButton.behavior)?.label || null) : null;

    return (
      <div style={styles.panel}>
        <button style={styles.backButton} onClick={onBack}>← Back</button>
        <h2 style={styles.title}>Button settings</h2>

        {/* Button label */}
        <label style={styles.label}>Button label</label>
        <input
          style={styles.input}
          value={selectedButton.label}
          onChange={(e) => onUpdateButton(selectedButton.id, { label: e.target.value })}
        />

        {errorMessage && (
          <div style={{ ...styles.errorBox, marginTop: '8px' }}>{errorMessage}</div>
        )}

        {/* Behavior */}
        <Accordion
          title="⚙️ Behavior"
          open={openSections.behavior}
          onToggle={() => setOpenSections((prev) => ({ ...prev, behavior: !prev.behavior }))}
          summary={behaviorSummary}
        >
          <p style={styles.accordionDesc}>What should happen when a customer taps this button?</p>
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
                      action: b.key === 'action',
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
          />
        )}

        {/* Action editor section */}
        {isAction && (
          <ActionEditor
            selectedButton={selectedButton}
            onUpdateButton={onUpdateButton}
            genId={genId}
            allButtons={allButtons}
            openSections={openSections}
            setOpenSections={setOpenSections}
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
        <h2 style={styles.title}>Sub-options of "{parentButton.label}"</h2>
        <p style={styles.subtitle}>These are the options your customer sees after tapping "{parentButton.label}".</p>

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
          💡 Click any sub-option to set what it does.
        </div>
      </div>
    );
  }

  // Default: welcome message editor (root level)
  return (
    <div style={styles.panel}>
      <h2 style={styles.title}>Welcome Message</h2>
      <label style={styles.label}>Message text</label>
      <textarea
        style={styles.textarea}
        value={welcomeMessage}
        onChange={(e) => onWelcomeChange(e.target.value)}
        rows={3}
      />
      <p style={styles.hint}>This is the first message your customer sees.</p>
      <div style={styles.tipBox}>
        💡 Click any button on the phone to set what it does.
      </div>
    </div>
  );
}

const styles = {
  panel: {
    flex: 1,
    minWidth: 0,
    background: '#fff',
    padding: '24px 28px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    flexShrink: 1,
    height: '100vh',
    overflowY: 'auto',
    position: 'sticky',
    top: 0,
  },
  accordion: {
    border: '1px solid #eee',
    borderRadius: '8px',
    marginTop: '8px',
    overflow: 'hidden',
  },
  accordionHeader: {
    width: '100%',
    background: '#fafafa',
    border: 'none',
    padding: '10px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    textAlign: 'left',
  },
  accordionTitle: {
    flex: 1,
  },
  accordionSummary: {
    fontSize: '12px',
    fontWeight: 400,
    color: '#00a884',
    fontStyle: 'italic',
  },
  accordionChevron: {
    fontSize: '12px',
    color: '#999',
    marginLeft: '8px',
  },
  accordionBody: {
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderTop: '1px solid #eee',
  },
  accordionDesc: {
    fontSize: '12px',
    color: '#888',
    margin: '0 0 4px 0',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 4px 0',
    color: '#111',
  },
  subtitle: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 16px 0',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#00a884',
    fontSize: '13px',
    fontWeight: 500,
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
    background: '#f9f9f9',
    border: '2px solid transparent',
    borderColor: 'transparent',
    borderRadius: '10px',
    padding: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#00a884',
    background: '#f0faf7',
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
    color: '#222',
  },
  optionLabelSelected: {
    color: '#00a884',
  },
  optionDesc: {
    fontSize: '12px',
    color: '#888',
    marginLeft: '24px',
  },
  checkmark: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    color: '#00a884',
    fontWeight: 700,
    fontSize: '16px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#555',
    marginBottom: '6px',
    display: 'block',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '8px',
  },
  tipBox: {
    marginTop: '16px',
    padding: '10px',
    background: '#f0faf7',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#555',
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
    color: '#333',
    marginBottom: '8px',
  },
  childrenList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '8px',
  },
  childItem: {
    background: '#f9f9f9',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '13px',
    color: '#333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childBadge: {
    fontSize: '10px',
    color: '#888',
  },
  addChildButton: {
    background: '#f0faf7',
    border: '1px dashed #00a884',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#00a884',
    cursor: 'pointer',
    width: '100%',
    fontWeight: 500,
  },
  childHint: {
    fontSize: '11px',
    color: '#999',
    marginTop: '6px',
    fontStyle: 'italic',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  sectionHeader: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '4px',
  },
  styleGrid: {
    display: 'flex',
    gap: '6px',
    marginBottom: '8px',
  },
  styleCard: {
    flex: 1,
    background: '#f9f9f9',
    border: '2px solid transparent',
    borderRadius: '8px',
    padding: '8px 6px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  styleCardSelected: {
    borderColor: '#00a884',
    background: '#f0faf7',
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
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: '#fff',
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
    background: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#333',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    textAlign: 'left',
    transition: 'border-color 0.15s',
  },
};
