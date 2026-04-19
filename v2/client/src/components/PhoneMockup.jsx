import { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../lib/api';

function MediaImage({ mediaId, businessId, alt }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!mediaId || !businessId) return;
    fetch(`${API_BASE}/business/${businessId}/media/${mediaId}`)
      .then(r => r.json())
      .then(json => { if (json.data?.data) setSrc(json.data.data); })
      .catch(() => {});
  }, [mediaId, businessId]);
  if (!src) return null;
  return <img src={src} alt={alt || 'Media'} style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />;
}

// ─── Channel themes for builder preview ──────────────────────────────
const CHANNEL_THEMES = {
  whatsapp: {
    headerBg: '#075e54', avatarBg: '#25D366', statusColor: '#b0d9d1',
    chatBg: '#e5ddd5', accent: '#00a884', accentBg: '#f0faf7',
    userBubble: '#dcf8c6', navBg: '#075e54',
    buttonBorder: '#d1d7db', buttonSelectedBorder: '#00a884', buttonSelectedBg: '#f0faf7',
  },
  telegram: {
    headerBg: '#517da2', avatarBg: '#5ba0d0', statusColor: '#a8c9e0',
    chatBg: '#e6ebee', accent: '#3390ec', accentBg: '#e3f0ff',
    userBubble: '#effdde', navBg: '#517da2',
    buttonBorder: '#bdd8f5', buttonSelectedBorder: '#3390ec', buttonSelectedBg: '#e3f0ff',
  },
  instagram: {
    headerBg: '#ffffff', avatarBg: '#E1306C', statusColor: '#8e8e8e',
    chatBg: '#ffffff', accent: '#3797f0', accentBg: '#eff3f4',
    userBubble: '#3797f0', navBg: '#833AB4',
    buttonBorder: '#dbdbdb', buttonSelectedBorder: '#3797f0', buttonSelectedBg: '#eff3f4',
  },
};

const CHANNEL_TABS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { key: 'telegram', label: 'Telegram', icon: '✈️' },
  { key: 'instagram', label: 'Instagram', icon: '📸' },
];

const STYLE_PRESETS = {
  clean: {
    titleSize: '17px', titleWeight: 700, titleColor: '#111',
    descSize: '13.5px', descColor: '#444', descLineHeight: '1.5',
    cardBg: '#fff', cardRadius: '12px', cardPadding: '16px',
    metaBg: '#f0faf7', metaColor: '#00a884',
    gap: '10px',
  },
  friendly: {
    titleSize: '19px', titleWeight: 700, titleColor: '#1a1a2e',
    descSize: '14px', descColor: '#555', descLineHeight: '1.6',
    cardBg: '#fffef5', cardRadius: '16px', cardPadding: '18px',
    metaBg: '#fff3e0', metaColor: '#e67e22',
    gap: '12px',
  },
  premium: {
    titleSize: '18px', titleWeight: 800, titleColor: '#0d0d0d',
    descSize: '13.5px', descColor: '#333', descLineHeight: '1.55',
    cardBg: '#fafafa', cardRadius: '8px', cardPadding: '20px',
    metaBg: '#f5f0ff', metaColor: '#7c3aed',
    gap: '14px',
  },
};

function formatPrice(amount, currency) {
  if (!amount) return null;
  return `${amount} ${currency || 'USD'}`;
}

export default function PhoneMockupWithTabs(props) {
  const [channel, setChannel] = useState('whatsapp');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
      {/* Channel tabs */}
      <div style={{ display: 'flex', gap: '0', borderRadius: '12px 12px 0 0', overflow: 'hidden', border: '1px solid #e0e0e0', borderBottom: 'none' }}>
        {CHANNEL_TABS.map(tab => (
          <button key={tab.key} onClick={() => setChannel(tab.key)} style={{
            padding: '8px 18px', fontSize: '13px', fontWeight: channel === tab.key ? 700 : 500,
            background: channel === tab.key ? CHANNEL_THEMES[tab.key].headerBg : '#f9f9f9',
            color: channel === tab.key ? '#fff' : '#666',
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>
      <PhoneMockup {...props} channel={channel} />
    </div>
  );
}

function PhoneMockup({ businessName = 'Your Business', businessId, channel = 'whatsapp', welcomeMessage, buttons, selectedButtonId, onButtonClick, onButtonDoubleClick, onAddButton, parentButton, onGoBack, path, viewingInfoButton, onCloseInfoPreview, onReorderButtons, allButtons, onNavigateTo, onDeleteButton, onSubmit }) {
  const theme = CHANNEL_THEMES[channel] || CHANNEL_THEMES.whatsapp;
  const isWA = channel === 'whatsapp';
  const isTG = channel === 'telegram';
  const isIG = channel === 'instagram';
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [hoveredButtonId, setHoveredButtonId] = useState(null);
  const dragNode = useRef(null);

  // Flow execution state
  const [flowStep, setFlowStep] = useState(0);
  const [flowAnswers, setFlowAnswers] = useState({});
  const [flowTextInput, setFlowTextInput] = useState('');
  const [flowDone, setFlowDone] = useState(false);
  const [flowConfirmed, setFlowConfirmed] = useState(false);
  const [manualMode, setManualMode] = useState(false); // for choice_with_manual
  const [activeFlowButton, setActiveFlowButton] = useState(null); // button whose flow is running from info page
  const [menuNavPath, setMenuNavPath] = useState([]); // for select_from_menu: tracks drill-down path [{id, label}]
  const [menuNavMessages, setMenuNavMessages] = useState([]); // intermediate messages during menu navigation
  const [flowPreviewButton, setFlowPreviewButton] = useState(null); // button being previewed before confirm in flow
  const chatEndRef = useRef(null);
  const lastActionRef = useRef({ id: null, ts: 0 });

  function isRapidTap(id) {
    const now = Date.now();
    if (lastActionRef.current.id === id && now - lastActionRef.current.ts < 450) {
      return true;
    }
    lastActionRef.current = { id, ts: now };
    return false;
  }

  // Reset activeFlowButton when leaving info preview
  const infoId = viewingInfoButton ? viewingInfoButton.id : null;
  useEffect(() => {
    setActiveFlowButton(null);
    setMenuNavPath([]);
    setMenuNavMessages([]);
    setFlowPreviewButton(null);
  }, [infoId]);

  function findInTree(buttons, id) {
    for (const b of buttons) {
      if (b.id === id) return b;
      if (b.children) {
        const found = findInTree(b.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function getMenuButtons(navPath, menuRoot) {
    let current = allButtons || [];
    if (menuRoot) {
      const rootNode = findInTree(current, menuRoot);
      if (rootNode && rootNode.children) {
        current = rootNode.children;
      } else {
        return [];
      }
    }
    for (const entry of navPath) {
      const parent = current.find((b) => b.id === entry.id);
      if (!parent || !parent.children) return [];
      current = parent.children;
    }
    return current;
  }

  function handleMenuSelect(btn, steps, stepIdx) {
    if (isRapidTap(`menu_${btn.id}`)) return;
    
    const hasChildren = btn.children && btn.children.length > 0;
    const currentStep = steps[stepIdx];
    const key = currentStep.key || `step_${stepIdx}`;

    if (hasChildren) {
      // Drill down — add intermediate messages and update nav path
      const newPath = [...menuNavPath, { id: btn.id, label: btn.label }];
      setMenuNavMessages((prev) => [
        ...prev,
        { type: 'answer', text: btn.label },
      ]);
      setMenuNavPath(newPath);
    } else if (btn.infoPage) {
      // Leaf with infoPage — show preview before confirming
      setFlowPreviewButton(btn);
    } else {
      // Leaf selected (no infoPage) — save full path and advance
      const fullPathLabels = [...menuNavPath.map((p) => p.label), btn.label];
      const pathStr = fullPathLabels.join(' > ');
      const newAnswers = { ...flowAnswers, [key]: pathStr };
      setFlowAnswers(newAnswers);
      setMenuNavPath([]);
      setMenuNavMessages([]);
      setManualMode(false);
      if (stepIdx + 1 >= steps.length) {
        setFlowDone(true);
      } else {
        setFlowStep(stepIdx + 1);
      }
    }
  }

  function handlePreviewConfirm(steps, stepIdx) {
    if (!flowPreviewButton || isRapidTap(`preview_confirm_${flowPreviewButton.id}`)) return;
    const currentStep = steps[stepIdx];
    const key = currentStep.key || `step_${stepIdx}`;
    const fullPathLabels = [...menuNavPath.map((p) => p.label), flowPreviewButton.label];
    const pathStr = fullPathLabels.join(' > ');
    const newAnswers = { ...flowAnswers, [key]: pathStr };
    setFlowAnswers(newAnswers);
    setFlowPreviewButton(null);
    setMenuNavPath([]);
    setMenuNavMessages([]);
    setManualMode(false);
    if (stepIdx + 1 >= steps.length) {
      setFlowDone(true);
    } else {
      setFlowStep(stepIdx + 1);
    }
  }

  function handlePreviewBack() {
    setFlowPreviewButton(null);
  }

  function handleDragStart(e, idx) {
    dragNode.current = e.target;
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
    // Make ghost semi-transparent
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.4'; }, 0);
  }

  function handleDragOver(e, idx) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (idx !== dragOverIndex) setDragOverIndex(idx);
  }

  function handleDragEnd() {
    if (dragNode.current) dragNode.current.style.opacity = '1';
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      onReorderButtons(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNode.current = null;
  }

  // Action flow from info page action button (must be checked BEFORE info page so flow takes priority)
  if (activeFlowButton && activeFlowButton.flowSteps && activeFlowButton.flowSteps.length > 0 && activeFlowButton.behavior === 'start_flow') {
    const steps = activeFlowButton.flowSteps;

    function handleTextSubmit() {
      if (!flowTextInput.trim() || isRapidTap(`text_submit_${flowStep}`)) return;
      const currentStep = steps[flowStep];
      const newAnswers = { ...flowAnswers, [currentStep.key || `step_${flowStep}`]: flowTextInput.trim() };
      setFlowAnswers(newAnswers);
      setFlowTextInput('');
      setManualMode(false);
      if (flowStep + 1 >= steps.length) {
        setFlowDone(true);
      } else {
        setFlowStep(flowStep + 1);
      }
    }

    function handleChoiceSelect(label) {
      if (isRapidTap(`choice_${flowStep}_${label}`)) return;
      const currentStep = steps[flowStep];
      const newAnswers = { ...flowAnswers, [currentStep.key || `step_${flowStep}`]: label };
      setFlowAnswers(newAnswers);
      setManualMode(false);
      if (flowStep + 1 >= steps.length) {
        setFlowDone(true);
      } else {
        setFlowStep(flowStep + 1);
      }
    }

    function handleEdit() {
      // When restarting, respect prefillService — skip step 1 again
      const skipFirst = activeFlowButton.prefillService && steps[0] && steps[0].type === 'select_from_menu';
      const startStep = skipFirst ? 1 : 0;
      const prefillAnswers = {};
      if (skipFirst) {
        prefillAnswers[steps[0].key || 'step_0'] = activeFlowButton.prefillService;
      }
      setFlowStep(startStep);
      setFlowAnswers(prefillAnswers);
      setFlowTextInput('');
      setFlowDone(false);
      setFlowConfirmed(false);
      setManualMode(false);
      setMenuNavPath([]);
      setMenuNavMessages([]);
      setFlowPreviewButton(null);
    }

    function handleConfirm() {
      setFlowConfirmed(true);

      // Build structured submission data
      const answers = {};
      for (let i = 0; i < steps.length; i++) {
        const s = steps[i];
        const key = s.key || `step_${i}`;
        const label = s.label || key;
        let value = flowAnswers[key] || '';
        if (s.type === 'select_from_menu' && value.includes(' > ')) {
          value = value.split(' > ').pop();
        }
        answers[label] = value;
      }

      // Determine service name
      const serviceName = activeFlowButton.prefillService
        || flowAnswers[steps[0]?.key || 'step_0']
        || 'Unknown Service';

      const deliveryMethod = activeFlowButton.deliveryMethod || 'none';
      const deliveryStaffId = activeFlowButton.deliveryStaffId || null;

      // Simulate delivery
      if (deliveryMethod === 'email') {
        console.log(`📧 [DELIVERY] Sending email to staff #${deliveryStaffId}`, answers);
      } else if (deliveryMethod === 'telegram') {
        console.log(`✈️ [DELIVERY] Sending telegram to staff #${deliveryStaffId}`, answers);
      } else if (deliveryMethod === 'whatsapp') {
        console.log(`📱 [DELIVERY] WhatsApp delivery (coming soon) to staff #${deliveryStaffId}`, answers);
      }

      // Call onSubmit callback to create the submission
      if (onSubmit) {
        onSubmit({
          serviceName,
          answers,
          deliveryMethod,
          deliveryStaffId,
          createdAt: new Date().toISOString(),
          status: 'new',
        });
      }
    }

    function handleMenuBack() {
      if (menuNavPath.length > 0) {
        setMenuNavPath((prev) => prev.slice(0, -1));
        setMenuNavMessages((prev) => prev.slice(0, -1));
      } else if (flowStep > 0) {
        const prevKey = steps[flowStep - 1].key || `step_${flowStep - 1}`;
        const newAnswers = { ...flowAnswers };
        delete newAnswers[prevKey];
        setFlowAnswers(newAnswers);
        setFlowStep(flowStep - 1);
        setMenuNavPath([]);
        setMenuNavMessages([]);
      }
    }

    const chatMessages = [];
    // Skip rendering prefilled steps (e.g. step 1 when service is already known)
    const firstVisibleStep = (activeFlowButton.prefillService && steps[0] && steps[0].type === 'select_from_menu') ? 1 : 0;
    const answeredCount = flowDone ? steps.length : flowStep;
    for (let i = firstVisibleStep; i < answeredCount; i++) {
      const s = steps[i];
      const key = s.key || `step_${i}`;
      let answerText = flowAnswers[key] || '';
      if (s.type === 'select_from_menu' && answerText.includes(' > ')) {
        answerText = answerText.split(' > ').pop();
      }
      chatMessages.push({ type: 'question', text: s.question || `Step ${i + 1}` });
      chatMessages.push({ type: 'answer', text: answerText });
    }

    const currentStep = !flowDone && !flowConfirmed && !flowPreviewButton && steps[flowStep] ? steps[flowStep] : null;
    const showTextInput = currentStep && !flowDone && (currentStep.type === 'text' || manualMode);
    const isMenuStep = currentStep && currentStep.type === 'select_from_menu';
    const menuButtons = isMenuStep ? getMenuButtons(menuNavPath, currentStep.menuRoot) : [];

    return (
      <div style={{ ...styles.phone, background: theme.chatBg }}>
        <div style={{ ...styles.topBar, background: theme.headerBg }}>
          <div style={styles.topBarLeft}>
            <div style={{ ...styles.avatar, background: theme.avatarBg }}>{(businessName || 'YB').slice(0, 2).toUpperCase()}</div>
            <div>
              <div style={styles.businessName}>{businessName}</div>
              <div style={{ ...styles.status, color: theme.statusColor }}>online</div>
            </div>
          </div>
        </div>

        <div style={{ ...styles.chatArea, justifyContent: 'flex-start' }}>
          <button style={{ ...styles.navBack, background: theme.headerBg }} onClick={() => { handleEdit(); setActiveFlowButton(null); }}>
            ← Back to info
          </button>

          {chatMessages.map((msg, i) => (
            msg.type === 'question' ? (
              <div key={i} style={styles.bubble}>
                <div style={styles.bubbleText}>{msg.text}</div>
              </div>
            ) : (
              <div key={i} style={flowStyles.userBubble}>
                <div style={styles.bubbleText}>{msg.text}</div>
              </div>
            )
          ))}

          {currentStep && !flowDone && (
            <>
              <div style={styles.bubble}>
                <div style={styles.bubbleText}>{currentStep.question || `Step ${flowStep + 1}`}</div>
              </div>

              {/* Menu navigation intermediate messages */}
              {isMenuStep && menuNavMessages.map((msg, i) => (
                msg.type === 'answer' ? (
                  <div key={`mn-${i}`} style={flowStyles.userBubble}>
                    <div style={styles.bubbleText}>{msg.text}</div>
                  </div>
                ) : (
                  <div key={`mn-${i}`} style={styles.bubble}>
                    <div style={styles.bubbleText}>{msg.text}</div>
                  </div>
                )
              ))}

              {/* Menu service selection */}
              {isMenuStep && menuButtons.length > 0 && (
                <div style={flowStyles.choiceBtns}>
                  {(menuNavPath.length > 0 || flowStep > 0) && (
                    <button style={{ ...flowStyles.choiceBtn, color: '#888', fontStyle: 'italic' }} onClick={handleMenuBack}>
                      ← Back
                    </button>
                  )}
                  {menuButtons.map((btn) => (
                    <button key={btn.id} style={flowStyles.choiceBtn} onClick={() => handleMenuSelect(btn, steps, flowStep)}>
                      {btn.label}{btn.children && btn.children.length > 0 ? ' ▸' : ''}
                    </button>
                  ))}
                </div>
              )}

              {(currentStep.type === 'choice' || (currentStep.type === 'choice_with_manual' && !manualMode)) && (currentStep.options || []).length > 0 && (
                <div style={flowStyles.choiceBtns}>
                  {currentStep.options.map((opt) => (
                    <button key={opt.id} style={flowStyles.choiceBtn} onClick={() => handleChoiceSelect(opt.label || 'Option')}>
                      {opt.label || 'Option'}
                    </button>
                  ))}
                  {currentStep.type === 'choice_with_manual' && (
                    <button style={{ ...flowStyles.choiceBtn, fontStyle: 'italic', color: '#888' }} onClick={() => setManualMode(true)}>
                      Manual input ✍️
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Service info preview before confirming */}
          {flowPreviewButton && flowPreviewButton.infoPage && (() => {
            const info = flowPreviewButton.infoPage;
            const preset = STYLE_PRESETS[info.style] || STYLE_PRESETS.clean;
            const priceStr = formatPrice(info.amount, info.currency);
            return (
              <>
                <div style={flowStyles.userBubble}>
                  <div style={styles.bubbleText}>{flowPreviewButton.label}</div>
                </div>
                <div style={{
                  background: preset.cardBg,
                  borderRadius: preset.cardRadius,
                  padding: preset.cardPadding,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: preset.gap,
                  maxWidth: '85%',
                }}>
                  <div style={{ fontSize: preset.titleSize, fontWeight: preset.titleWeight, color: preset.titleColor, lineHeight: '1.3' }}>
                    {info.title || flowPreviewButton.label}
                  </div>
                  {info.description && (
                    <div style={{ fontSize: preset.descSize, lineHeight: preset.descLineHeight, color: preset.descColor, whiteSpace: 'pre-wrap' }}>
                      {info.description}
                    </div>
                  )}
                  {((info.showPrice !== false && priceStr) || (info.showDuration !== false && info.duration)) && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {info.showPrice !== false && priceStr && (
                        <span style={{ background: preset.metaBg, color: preset.metaColor, fontSize: '13px', fontWeight: 700, padding: '5px 12px', borderRadius: '14px' }}>{priceStr}</span>
                      )}
                      {info.showDuration !== false && info.duration && (
                        <span style={{ background: '#f3f4f6', color: '#555', fontSize: '13px', fontWeight: 500, padding: '5px 12px', borderRadius: '14px' }}>⏱ {info.duration}</span>
                      )}
                    </div>
                  )}
                </div>
                <div style={flowStyles.choiceBtns}>
                  <button style={{ ...flowStyles.choiceBtn, background: theme.accent, color: '#fff', border: `2px solid ${theme.accent}`, fontWeight: 600 }} onClick={() => handlePreviewConfirm(steps, flowStep)}>
                    Select this service ✔
                  </button>
                  <button style={{ ...flowStyles.choiceBtn, color: '#888', fontStyle: 'italic' }} onClick={handlePreviewBack}>
                    ← Back
                  </button>
                </div>
              </>
            );
          })()}

          {flowDone && !flowConfirmed && (
            <>
              <div style={styles.bubble}>
                <div style={styles.bubbleText}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '10px' }}>📋 Booking Summary</div>

                  {/* Show prefilled service prominently */}
                  {activeFlowButton.prefillService && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px', fontSize: '13.5px' }}>
                      <span style={{ color: theme.accent }}>•</span>
                      <span><span style={{ color: '#555' }}>Service:</span> <span style={{ fontWeight: 600, color: '#111' }}>{activeFlowButton.prefillService}</span></span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {steps.map((s, i) => {
                      if (i < firstVisibleStep) return null;
                      const key = s.key || `step_${i}`;
                      let value = flowAnswers[key] || '—';
                      if (s.type === 'select_from_menu' && value.includes(' > ')) {
                        value = value.split(' > ').pop();
                      }
                      const summaryLabel = s.label || `Step ${i + 1}`;
                      return (
                        <div key={s.id} style={{ fontSize: '13.5px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ color: theme.accent }}>•</span>
                          <span><span style={{ color: '#555' }}>{summaryLabel}:</span> <span style={{ fontWeight: 600, color: '#111' }}>{value}</span></span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f0f0f0', fontSize: '13px', color: '#666' }}>Does this look correct?</div>
                </div>
              </div>
              <div style={flowStyles.summaryActions}>
                <button style={flowStyles.confirmBtn} onClick={handleConfirm}>✔ Confirm</button>
                <button style={flowStyles.editBtn} onClick={handleEdit}>✏️ Edit</button>
              </div>
            </>
          )}

          {flowConfirmed && (
            <div style={styles.bubble}>
              <div style={styles.bubbleText}>
                <div>✅ All done! We've received your request 🎉</div>
                {activeFlowButton.deliveryMethod && activeFlowButton.deliveryMethod !== 'none' && (
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    {activeFlowButton.deliveryMethod === 'email' && '📧 A confirmation has been sent via email.'}
                    {activeFlowButton.deliveryMethod === 'telegram' && '✈️ A notification has been sent via Telegram.'}
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {showTextInput && (
          <div style={flowStyles.inputBar}>
            <input
              style={flowStyles.textField}
              value={flowTextInput}
              onChange={(e) => setFlowTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); }}
              placeholder={manualMode ? (currentStep.manualPlaceholder || 'Type a message...') : 'Type a message...'}
            />
            <button style={flowStyles.sendBtn} onClick={handleTextSubmit}>Send</button>
          </div>
        )}

        {!showTextInput && (
          <div style={styles.bottomBar}>
            <div style={styles.fakeInput}>{flowDone ? (flowConfirmed ? 'Chat ended' : 'Review your details') : flowPreviewButton ? 'Review service info' : 'Choose an option'}</div>
          </div>
        )}
      </div>
    );
  }

  // Info page preview mode
  if (viewingInfoButton && viewingInfoButton.infoPage) {
    const info = viewingInfoButton.infoPage;
    const preset = STYLE_PRESETS[info.style] || STYLE_PRESETS.clean;
    const priceStr = formatPrice(info.amount, info.currency);

    return (
      <div style={{ ...styles.phone, background: theme.chatBg }}>
        <div style={{ ...styles.topBar, background: theme.headerBg }}>
          <div style={styles.topBarLeft}>
            <div style={{ ...styles.avatar, background: theme.avatarBg }}>{(businessName || 'YB').slice(0, 2).toUpperCase()}</div>
            <div>
              <div style={{ ...styles.businessName, color: isIG ? '#262626' : '#fff' }}>{businessName}</div>
              <div style={{ ...styles.status, color: theme.statusColor }}>online</div>
            </div>
          </div>
        </div>

        <div style={styles.chatArea}>
          <button style={{ ...styles.navBack, background: theme.headerBg }} onClick={onCloseInfoPreview}>
            ← Back
          </button>

          {/* Media images */}
          {info.media && info.media.filter(m => m.mediaType === 'image').length > 0 && (
            <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {info.media.filter(m => m.mediaType === 'image').map(m => (
                <MediaImage key={m.id} mediaId={m.id} businessId={businessId} alt={m.fileName} />
              ))}
            </div>
          )}

          <div style={{
            background: preset.cardBg,
            borderRadius: preset.cardRadius,
            padding: preset.cardPadding,
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: preset.gap,
          }}>
            <div style={{
              fontSize: preset.titleSize,
              fontWeight: preset.titleWeight,
              color: preset.titleColor,
              lineHeight: '1.3',
            }}>{info.title || 'Untitled'}</div>

            {info.description && (
              <div style={{
                fontSize: preset.descSize,
                lineHeight: preset.descLineHeight,
                color: preset.descColor,
                whiteSpace: 'pre-wrap',
              }}>{info.description}</div>
            )}

            {((info.showPrice !== false && priceStr) || (info.showDuration !== false && info.duration)) && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {info.showPrice !== false && priceStr && (
                  <span style={{
                    background: preset.metaBg,
                    color: preset.metaColor,
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: '14px',
                  }}>{priceStr}</span>
                )}
                {info.showDuration !== false && info.duration && (
                  <span style={{
                    background: '#f3f4f6',
                    color: '#555',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '5px 12px',
                    borderRadius: '14px',
                  }}>⏱ {info.duration}</span>
                )}
              </div>
            )}

            {info.actionButtons && info.actionButtons.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                {info.actionButtons.map((ab) => {
                  const isClickable =
                    (ab.behavior === 'start_flow' && ab.flowSteps && ab.flowSteps.length > 0) ||
                    ab.behavior === 'go_back';

                  return (
                    <button key={ab.id} style={{
                      background: '#fff',
                      border: '2px solid #d1d7db',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '14px',
                      color: preset.metaColor,
                      fontWeight: 500,
                      cursor: isClickable ? 'pointer' : 'default',
                      textAlign: 'center',
                    }}
                    onClick={() => {
                      console.log('CLICKED BUTTON:', ab);
                      if (ab.behavior === 'start_flow' && ab.flowSteps && ab.flowSteps.length > 0) {
                        // Build merged flow: baseFlow + infoPage.extraSteps appended
                        let mergedSteps = ab.flowSteps;
                        const extras = info.extraSteps;
                        if (extras && extras.length > 0) {
                          mergedSteps = [...ab.flowSteps, ...extras];
                        }
                        // If service is already known (prefillService), skip the select_from_menu step
                        const skipFirst = ab.prefillService && mergedSteps[0] && mergedSteps[0].type === 'select_from_menu';
                        const startStep = skipFirst ? 1 : 0;
                        const prefillAnswers = {};
                        if (skipFirst) {
                          prefillAnswers[mergedSteps[0].key || 'step_0'] = ab.prefillService;
                        }
                        setFlowStep(startStep);
                        setFlowAnswers(prefillAnswers);
                        setFlowTextInput('');
                        setFlowDone(false);
                        setFlowConfirmed(false);
                        setActiveFlowButton({ ...ab, flowSteps: mergedSteps });
                      } else if (ab.behavior === 'go_back') {
                        onCloseInfoPreview();
                      }
                    }}
                    >
                      {ab.label}
                      {ab.behavior === 'go_back' ? ' ←' : ''}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={styles.bottomBar}>
          <div style={styles.fakeInput}>Tap a button to get started</div>
        </div>
      </div>
    );
  }



  return (
    <div style={{ ...styles.phone, background: theme.chatBg }}>
      <div style={{ ...styles.topBar, background: theme.headerBg }}>
        <div style={styles.topBarLeft}>
          <div style={{ ...styles.avatar, background: theme.avatarBg }}>{(businessName || 'YB').slice(0, 2).toUpperCase()}</div>
          <div>
            <div style={{ ...styles.businessName, color: isIG ? '#262626' : '#fff' }}>{businessName}</div>
            <div style={{ ...styles.status, color: theme.statusColor }}>online</div>
          </div>
        </div>
      </div>

      <div style={styles.chatArea}>
        {path.length > 0 && (
          <button style={{ ...styles.navBack, background: theme.headerBg }} onClick={onGoBack}>
            ← Back to {parentButton ? parentButton.label : 'main menu'}
          </button>
        )}

        {path.length === 0 && (
          <div style={styles.bubble}>
            <div style={styles.bubbleText}>{welcomeMessage}</div>
          </div>
        )}

        {parentButton && (
          <div style={styles.bubble}>
            <div style={styles.bubbleText}>
              You selected: <strong>{parentButton.label}</strong>
            </div>
          </div>
        )}

        {/* Buttons — draggable */}
        <div style={{
          ...styles.buttonsContainer,
          flexDirection: isIG ? 'row' : 'column',
          flexWrap: isIG ? 'wrap' : 'nowrap',
          gap: isIG ? '8px' : '6px',
        }}>
          {buttons.map((btn, idx) => {
            const isSelected = btn.id === selectedButtonId;
            const hasChildren = btn.children && btn.children.length > 0;
            const isDragOver = dragOverIndex === idx && dragIndex !== idx;
            const isHovered = hoveredButtonId === btn.id;
            return (
              <div
                key={btn.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoveredButtonId(btn.id)}
                onMouseLeave={() => setHoveredButtonId(null)}
              >
                <button
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  style={{
                    ...styles.whatsappButton,
                    ...(isTG ? styles.telegramButton : {}),
                    ...(isIG ? styles.instagramButton : {}),
                    color: theme.accent,
                    borderColor: theme.buttonBorder,
                    ...(isSelected ? { borderColor: theme.buttonSelectedBorder, background: theme.buttonSelectedBg } : {}),
                    ...(isDragOver ? { borderColor: theme.accent, borderStyle: 'dashed' } : {}),
                    width: isIG ? 'auto' : '100%',
                    minWidth: isIG ? '120px' : undefined,
                  }}
                  onClick={() => onButtonClick(btn.id)}
                  onDoubleClick={() => onButtonDoubleClick(btn.id)}
                >
                  <div style={styles.btnRow}>
                    <span style={{ ...styles.dragHandle, opacity: isWA ? 1 : 0.55 }}>⠿</span>
                    <span>{btn.label}{hasChildren ? ' ▸' : ''}</span>
                  </div>
                  {isWA && btn.behavior && (
                    <span style={styles.behaviorBadge}>{BEHAVIOR_LABELS[btn.behavior]}</span>
                  )}
                </button>
                {isHovered && (
                  <button
                    style={styles.deleteIcon}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteButton(btn.id);
                    }}
                    title="Delete button"
                  >✕</button>
                )}
              </div>
            );
          })}
        </div>

        <button style={styles.addButton} onClick={onAddButton}>
          + Add Button
        </button>

        {buttons.some((b) => b.behavior === 'menu') && (
          <div style={styles.hint}>Double-click a "▸ more" button to go inside</div>
        )}
        {buttons.some((b) => b.behavior === 'info') && (
          <div style={styles.hint}>Double-click an "ℹ info" button to preview</div>
        )}

      </div>

      <div style={styles.bottomBar}>
        <div style={styles.fakeInput}>Tap a button to get started</div>
      </div>
    </div>
  );
}

const BEHAVIOR_LABELS = {
  menu: '▸ more',
  info: 'ℹ info',
};

const flowStyles = {
  userBubble: {
    background: '#dcf8c6',
    borderRadius: '8px 0 8px 8px',
    padding: '8px 12px',
    maxWidth: '75%',
    alignSelf: 'flex-end',
    boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
  },
  choiceBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxWidth: '85%',
  },
  choiceBtn: {
    background: '#fff',
    border: '2px solid #d1d7db',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '14px',
    color: '#00a884',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'border-color 0.15s',
  },
  summaryActions: {
    display: 'flex',
    gap: '8px',
    maxWidth: '85%',
  },
  confirmBtn: {
    flex: 1,
    background: '#00a884',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  editBtn: {
    flex: 1,
    background: '#fff',
    color: '#555',
    border: '2px solid #d1d7db',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  inputBar: {
    background: '#f0f2f5',
    padding: '8px 12px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  textField: {
    flex: 1,
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '20px',
    padding: '10px 16px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  sendBtn: {
    background: '#00a884',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
};



const styles = {
  phone: {
    width: '360px',
    height: '640px',
    borderRadius: '32px',
    overflow: 'hidden',
    border: '8px solid #1a1a1a',
    background: '#e5ddd5',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    flexShrink: 0,
  },
  topBar: {
    background: '#075e54',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#25D366',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
  },
  businessName: {
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
  },
  status: {
    color: '#b0d9d1',
    fontSize: '12px',
  },
  chatArea: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navBack: {
    background: '#075e54',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    fontWeight: 500,
  },
  bubble: {
    background: '#fff',
    borderRadius: '0 8px 8px 8px',
    padding: '8px 12px',
    maxWidth: '85%',
    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
  },
  bubbleText: {
    fontSize: '14px',
    lineHeight: '1.4',
    color: '#111',
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxWidth: '85%',
  },
  whatsappButton: {
    background: '#fff',
    border: '2px solid #d1d7db',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '14px',
    color: '#00a884',
    fontWeight: 500,
    cursor: 'grab',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    transition: 'border-color 0.15s',
  },
  telegramButton: {
    background: '#e3f0ff',
    border: '1px solid #bdd8f5',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '14px',
    minHeight: '36px',
    boxShadow: 'none',
  },
  instagramButton: {
    borderRadius: '18px',
    padding: '8px 14px',
    fontSize: '13px',
    boxShadow: 'none',
  },
  whatsappButtonSelected: {
    borderColor: '#00a884',
    background: '#f0faf7',
  },
  behaviorBadge: {
    fontSize: '10px',
    color: '#888',
    fontWeight: 400,
  },
  addButton: {
    background: 'transparent',
    border: '2px dashed #bbb',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    color: '#888',
    cursor: 'pointer',
    maxWidth: '85%',
  },
  hint: {
    fontSize: '11px',
    color: '#999',
    fontStyle: 'italic',
    marginTop: '4px',
  },
  btnRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  dragHandle: {
    fontSize: '12px',
    color: '#bbb',
    cursor: 'grab',
    userSelect: 'none',
  },
  bottomBar: {
    background: '#f0f2f5',
    padding: '8px 12px',
  },
  fakeInput: {
    background: '#fff',
    borderRadius: '20px',
    padding: '10px 16px',
    fontSize: '13px',
    color: '#999',
  },
  deleteIcon: {
    position: 'absolute',
    right: '-8px',
    top: '-8px',
    background: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '22px',
    height: '22px',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    zIndex: 10,
    padding: 0,
  },
};
