import { useState, useEffect, useRef, useCallback } from 'react';

const API = 'http://localhost:4000/api';

// ─── WhatsApp Design Tokens ──────────────────────────────────────────
const WA = {
  bg: '#efeae2',
  headerBg: '#075e54',
  headerText: '#fff',
  bubbleBot: '#ffffff',
  bubbleUser: '#dcf8c6',
  textPrimary: '#111b21',
  textSecondary: '#667781',
  buttonPill: '#e7f7ee',
  buttonText: '#00a884',
  buttonBorder: '#b2dfdb',
  listBtnBg: '#00a884',
  listBtnText: '#fff',
  timestamp: '#667781',
  inputBg: '#f0f2f5',
  overlayBg: 'rgba(0,0,0,0.45)',
  chatPattern: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='80' height='80' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 40 Q20 20 40 40 Q60 60 80 40' fill='none' stroke='%23d1cdc7' stroke-width='0.5' opacity='0.3'/%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%23d1cdc7' opacity='0.2'/%3E%3Ccircle cx='70' cy='60' r='1' fill='%23d1cdc7' opacity='0.15'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23p)'/%3E%3C/svg%3E")`,
};

// ─── Helpers ─────────────────────────────────────────────────────────
function timeStamp() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function parseWhatsAppBold(text) {
  if (!text) return text;
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((p, i) =>
    p.startsWith('*') && p.endsWith('*')
      ? <b key={i} style={{ fontWeight: 600 }}>{p.slice(1, -1)}</b>
      : p.startsWith('_') && p.endsWith('_')
        ? <em key={i}>{p.slice(1, -1)}</em>
        : p
  );
}

function renderFormattedText(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => (
    <span key={i}>{i > 0 && <br />}{parseWhatsAppBold(line)}</span>
  ));
}

// ─── Chat Engine ─────────────────────────────────────────────────────
// Drives the conversation state machine using builder data.
function createEngine(builderData) {
  const { welcomeMessage, buttons, flow } = builderData;
  const steps = flow?.steps || [];

  function findInTree(tree, id) {
    for (const b of tree) {
      if (b.id === id) return b;
      if (b.children) {
        const found = findInTree(b.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function flattenLeaves(tree) {
    const leaves = [];
    for (const b of tree) {
      if (b.behavior === 'info') leaves.push(b);
      else if (b.children) leaves.push(...flattenLeaves(b.children));
    }
    return leaves;
  }

  // Build WhatsApp-style welcome message
  function getWelcome() {
    const actionable = buttons.filter(b => b.behavior);
    if (actionable.length <= 3) {
      return {
        type: 'buttons',
        body: welcomeMessage,
        buttons: actionable.map(b => ({ id: `root_${b.id}`, title: b.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim().slice(0, 20) })),
      };
    }
    return {
      type: 'list',
      body: welcomeMessage,
      buttonLabel: 'Options',
      sections: [{ title: 'Menu', rows: actionable.slice(0, 10).map(b => ({ id: `root_${b.id}`, title: b.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim().slice(0, 24) })) }],
    };
  }

  // Build a list message showing direct children as rows (step-by-step navigation)
  function getChildrenList(children, question, buttonLabel) {
    const clean = s => s.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
    const rows = children.slice(0, 10).map(btn => {
      const row = {
        id: `service_${btn.id}`,
        title: clean(btn.label).slice(0, 24),
      };
      // Add price/duration description for leaf info pages
      if (btn.infoPage) {
        const parts = [];
        if (btn.infoPage.amount && btn.infoPage.showPrice !== false)
          parts.push(`${btn.infoPage.currency || 'USD'}${btn.infoPage.amount}`);
        if (btn.infoPage.duration && btn.infoPage.showDuration !== false)
          parts.push(btn.infoPage.duration);
        if (parts.length) row.description = parts.join(' · ').slice(0, 72);
      } else if (btn.behavior === 'menu' && btn.children?.length) {
        row.description = `${btn.children.length} options`;
      }
      return row;
    });
    return {
      type: 'list',
      body: question || 'What are you looking for?',
      buttonLabel: buttonLabel || 'Browse',
      sections: [{ title: 'Available', rows }],
    };
  }

  // Build FlowStep message
  function getFlowStepMessage(stepIdx) {
    const step = steps[stepIdx];
    if (!step) return null;

    if (step.type === 'text') {
      return { type: 'text', body: step.question };
    }

    if (step.type === 'choice') {
      const opts = step.options || [];
      if (opts.length <= 3) {
        return {
          type: 'buttons',
          body: step.question,
          buttons: opts.map(o => ({ id: `choice_${o.id}`, title: o.label.slice(0, 20) })),
        };
      }
      return {
        type: 'list',
        body: step.question,
        buttonLabel: 'Select',
        sections: [{ title: step.label || 'Options', rows: opts.slice(0, 10).map(o => ({ id: `choice_${o.id}`, title: o.label.slice(0, 24) })) }],
      };
    }

    if (step.type === 'choice_with_manual') {
      const opts = step.options || [];
      if (opts.length <= 2) {
        return {
          type: 'buttons',
          body: step.question,
          buttons: [
            ...opts.map(o => ({ id: `choice_${o.id}`, title: o.label.slice(0, 20) })),
            { id: 'manual_input', title: 'Type manually' },
          ],
        };
      }
      return {
        type: 'list',
        body: step.question + '\n\n_Or type your answer directly._',
        buttonLabel: 'Select',
        sections: [{
          title: step.label || 'Options',
          rows: [
            ...opts.slice(0, 9).map(o => ({ id: `choice_${o.id}`, title: o.label.slice(0, 24) })),
            { id: 'manual_input', title: 'Type manually ✍️', description: step.manualPlaceholder || 'Enter your own answer' },
          ],
        }],
      };
    }

    if (step.type === 'select_from_menu') {
      const menuRoot = buttons.find(b => b.behavior === 'menu' && b.children?.length);
      if (menuRoot) {
        return getChildrenList(menuRoot.children, step.question, 'View Services');
      }
      return { type: 'text', body: step.question };
    }

    return { type: 'text', body: step.question };
  }

  // Build info page message
  function getInfoMessage(btn) {
    const info = btn.infoPage;
    if (!info) return [{ type: 'text', body: btn.label }];
    let body = `*${info.title}*\n`;
    if (info.description) body += `\n${info.description}\n`;
    const meta = [];
    if (info.amount && info.showPrice !== false) meta.push(`💰 ${info.currency || 'USD'} ${info.amount}`);
    if (info.duration && info.showDuration !== false) meta.push(`⏱️ ${info.duration}`);
    if (meta.length) body += `\n${meta.join('  ·  ')}`;
    const actions = (info.actionButtons || []).filter(a => a.behavior === 'start_flow' || a.behavior === 'go_back');
    const mediaItems = (info.media || []).filter(m => m.mediaType === 'image');

    // Build message array: one image message per media, then text+buttons last
    const msgs = [];
    for (const m of mediaItems) {
      msgs.push({ type: 'image', media: m });
    }

    if (actions.length <= 3 && actions.length > 0) {
      msgs.push({
        type: 'buttons',
        body,
        buttons: actions.map(a => ({
          id: a.behavior === 'start_flow' ? `book_${a.id}` : 'go_back',
          title: a.label.slice(0, 20),
        })),
      });
    } else {
      msgs.push({ type: 'text', body });
    }
    return msgs;
  }

  // Build confirmation message
  function getConfirmation(answers) {
    let body = '✅ *Booking Confirmed!*\n\nHere\'s your summary:\n\n';
    for (const [k, v] of Object.entries(answers)) {
      if (!k.startsWith('_')) body += `• *${k}*: ${v}\n`;
    }
    body += '\nWe\'ll get back to you shortly! 🙏';
    return {
      type: 'buttons',
      body,
      buttons: [
        { id: 'new_booking', title: 'New Booking' },
        { id: 'main_menu', title: 'Main Menu' },
      ],
    };
  }

  return { getWelcome, getFlowStepMessage, getInfoMessage, getConfirmation, getChildrenList, findInTree, steps, buttons, flattenLeaves };
}

// ═══════════════════════════════════════════════════════════════════════
// WhatsApp Message Renderers (Visual)
// ═══════════════════════════════════════════════════════════════════════

function BotBubble({ children, time }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '2px 12px', maxWidth: '100%' }}>
      <div style={{
        background: WA.bubbleBot, borderRadius: '0 8px 8px 8px', padding: '6px 8px 4px',
        maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)', position: 'relative',
      }}>
        {children}
        <div style={{ textAlign: 'right', marginTop: 2 }}>
          <span style={{ fontSize: 11, color: WA.timestamp }}>{time}</span>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ text, time }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 12px' }}>
      <div style={{
        background: WA.bubbleUser, borderRadius: '8px 0 8px 8px', padding: '6px 8px 4px',
        maxWidth: '85%', boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)',
      }}>
        <div style={{ fontSize: 14, color: WA.textPrimary, lineHeight: 1.45, wordBreak: 'break-word' }}>
          {text}
        </div>
        <div style={{ textAlign: 'right', marginTop: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 11, color: WA.timestamp }}>{time}</span>
          <svg width="16" height="11" viewBox="0 0 16 11"><path d="M11.07 0L5.44 5.63 3.28 3.47 2 4.75l3.44 3.44 6.91-6.91z" fill="#53bdeb"/><path d="M14.07 0L8.44 5.63 7.28 4.47 6 5.75l2.44 2.44 6.91-6.91z" fill="#53bdeb"/></svg>
        </div>
      </div>
    </div>
  );
}

function QuickReplyButtons({ buttons, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 12px 6px', maxWidth: '85%' }}>
      {buttons.map((btn, i) => (
        <button key={btn.id || i} onClick={() => onSelect(btn)}
          style={{
            background: '#fff', border: `1px solid ${WA.buttonBorder}`, borderRadius: 8,
            padding: '9px 14px', fontSize: 14, fontWeight: 500, color: WA.buttonText,
            cursor: 'pointer', textAlign: 'center', transition: 'background 0.15s',
            boxShadow: '0 1px 0.5px rgba(11,20,26,0.08)',
          }}
          onMouseEnter={e => e.target.style.background = WA.buttonPill}
          onMouseLeave={e => e.target.style.background = '#fff'}
        >
          {btn.title}
        </button>
      ))}
    </div>
  );
}

function MediaHeader({ media, businessId, cacheRef }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!media || !media.id) return;
    const cached = cacheRef.current.get(media.id);
    if (cached) { setSrc(cached); return; }
    fetch(`${API}/business/${businessId}/media/${media.id}`)
      .then(r => r.json())
      .then(json => {
        if (json.data?.data) {
          cacheRef.current.set(media.id, json.data.data);
          setSrc(json.data.data);
        }
      })
      .catch(() => {});
  }, [media?.id]);
  if (!src) return null;
  return (
    <img src={src} alt={media.fileName || 'Media'}
      style={{ width: '100%', borderRadius: '8px', objectFit: 'contain' }} />
  );
}

function ListButton({ label, onClick }) {
  return (
    <div style={{ padding: '4px 12px 6px', maxWidth: '85%' }}>
      <button onClick={onClick}
        style={{
          background: '#fff', border: `1px solid ${WA.buttonBorder}`, borderRadius: 8,
          padding: '10px 14px', fontSize: 14, fontWeight: 500, color: WA.buttonText,
          cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 1px 0.5px rgba(11,20,26,0.08)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.target.style.background = WA.buttonPill}
        onMouseLeave={e => e.target.style.background = '#fff'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={WA.buttonText} strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        {label}
      </button>
    </div>
  );
}

function ListOverlay({ sections, onSelect, onClose, title }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: WA.overlayBg, animation: 'fadeIn 0.15s ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '16px 16px 0 0', maxHeight: '70%', overflow: 'auto',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #e9edef',
          padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderRadius: '16px 16px 0 0', zIndex: 1,
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: WA.textPrimary }}>{title || 'Select an option'}</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 22, color: WA.textSecondary, cursor: 'pointer', lineHeight: 1,
          }}>✕</button>
        </div>
        {/* Sections */}
        {sections.map((section, si) => (
          <div key={si}>
            <div style={{
              padding: '10px 16px 4px', fontSize: 13, fontWeight: 600, color: WA.buttonText,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>{section.title}</div>
            {section.rows.map((row, ri) => (
              <button key={row.id || ri} onClick={() => onSelect(row)}
                style={{
                  width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                  borderBottom: '1px solid #f0f2f5', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', flexDirection: 'column', gap: 2, transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f2f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: 15, fontWeight: 500, color: WA.textPrimary }}>{row.title}</span>
                {row.description && (
                  <span style={{ fontSize: 13, color: WA.textSecondary }}>{row.description}</span>
                )}
              </button>
            ))}
          </div>
        ))}
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════════════

export default function WhatsAppTester({ businessId }) {
  const [builderData, setBuilderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]); // { from: 'bot'|'user', msg, time }
  const [listOverlay, setListOverlay] = useState(null); // { sections, title }
  const [textInput, setTextInput] = useState('');
  const [waitingForText, setWaitingForText] = useState(false);
  const [conversationState, setConversationState] = useState(null);
  const chatEndRef = useRef(null);
  const engineRef = useRef(null);
  const mediaCacheRef = useRef(new Map());

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, listOverlay]);

  // ── Load builder data ──
  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetch(`${API}/business/${businessId}/builder`)
      .then(r => r.json())
      .then(json => {
        setBuilderData(json.data);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [businessId]);

  // ── Start conversation ──
  useEffect(() => {
    if (!builderData) return;
    engineRef.current = createEngine(builderData);
    startConversation();
  }, [builderData]);

  const startConversation = useCallback(() => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    const welcome = engine.getWelcome();
    setMessages([{ from: 'bot', msg: welcome, time: timeStamp() }]);
    setConversationState({ phase: 'welcome', flowStep: 0, answers: {}, menuPath: [] });
    setWaitingForText(false);
    setListOverlay(null);
    setTextInput('');
  }, []);

  // ── Handle user selecting a button/list item ──
  const handleSelect = useCallback((item) => {
    setListOverlay(null);
    const engine = engineRef.current;
    if (!engine) return;
    const state = conversationState;
    const now = timeStamp();

    // Add user message
    setMessages(prev => [...prev, { from: 'user', text: item.title, time: now }]);

    // Determine next action based on item id
    const id = item.id;

    // ── Main Menu / New Booking → restart
    if (id === 'main_menu' || id === 'new_booking') {
      setTimeout(() => startConversation(), 400);
      return;
    }

    // ── Go Back → show welcome
    if (id === 'go_back') {
      setTimeout(() => {
        const welcome = engine.getWelcome();
        setMessages(prev => [...prev, { from: 'bot', msg: welcome, time: timeStamp() }]);
        setConversationState(prev => ({ ...prev, phase: 'welcome' }));
      }, 400);
      return;
    }

    // ── Root button selected from welcome ──
    if (id.startsWith('root_')) {
      const btnId = Number(id.replace('root_', ''));
      const btn = engine.findInTree(engine.buttons, btnId);
      if (!btn) return;

      if (btn.behavior === 'menu') {
        // Show categories as a simple list
        setTimeout(() => {
          const menuMsg = engine.getChildrenList(btn.children || [], 'Here are our service categories — pick one to explore! ✨', 'Browse Services');
          setMessages(prev => [...prev, { from: 'bot', msg: menuMsg, time: timeStamp() }]);
          setConversationState(prev => ({ ...prev, phase: 'browsing_menu', menuPath: [btnId] }));
        }, 400);
        return;
      }

      if (btn.behavior === 'info') {
        // Show info page — send each media as separate message, then text+buttons
        setTimeout(() => {
          const infoMsgs = engine.getInfoMessage(btn);
          const botMessages = infoMsgs.map(m => ({ from: 'bot', msg: m, time: timeStamp() }));
          setMessages(prev => [...prev, ...botMessages]);
          setConversationState(prev => ({ ...prev, phase: 'viewing_info', currentInfo: btn }));
        }, 400);
        return;
      }
    }

    // ── Service selected from menu ──
    if (id.startsWith('service_')) {
      const btnId = Number(id.replace('service_', ''));
      const btn = engine.findInTree(engine.buttons, btnId);
      if (!btn) return;

      if (btn.behavior === 'menu' && btn.children?.length) {
        // Drill into category — show its children
        setTimeout(() => {
          const cleanLabel = btn.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
          const menuMsg = engine.getChildrenList(btn.children, `Great choice! Here\'s what we offer in *${cleanLabel}* 👇`, 'Browse');
          setMessages(prev => [...prev, { from: 'bot', msg: menuMsg, time: timeStamp() }]);
          setConversationState(prev => ({ ...prev, menuPath: [...prev.menuPath, btnId] }));
        }, 400);
        return;
      }

      if (btn.behavior === 'info' && btn.infoPage) {
        // Show info page — send each media as separate message, then text+buttons
        setTimeout(() => {
          const infoMsgs = engine.getInfoMessage(btn);
          const botMessages = infoMsgs.map(m => ({ from: 'bot', msg: m, time: timeStamp() }));
          setMessages(prev => [...prev, ...botMessages]);
          setConversationState(prev => ({ ...prev, phase: 'viewing_info', currentInfo: btn }));
        }, 400);
        return;
      }
    }

    // ── Book button from info page → start flow ──
    if (id.startsWith('book_')) {
      const actionBtnId = Number(id.replace('book_', ''));
      const serviceLabel = state?.currentInfo?.label || '';
      // Find the action button to get delivery info
      const infoBtn = state?.currentInfo;
      const actionBtn = infoBtn?.infoPage?.actionButtons?.find(a => a.id === actionBtnId);
      const deliveryMethod = actionBtn?.deliveryMethod || 'none';
      const deliveryStaffId = actionBtn?.deliveryStaffId || null;

      setTimeout(() => {
        const newAnswers = { ...state.answers };
        // Check if first step is select_from_menu — pre-fill with this service
        if (engine.steps.length > 0 && engine.steps[0].type === 'select_from_menu') {
          newAnswers[engine.steps[0].label || engine.steps[0].key] = serviceLabel;
          // Skip to step 1
          const stepMsg = engine.getFlowStepMessage(1);
          if (stepMsg) {
            setMessages(prev => [...prev, { from: 'bot', msg: stepMsg, time: timeStamp() }]);
            setConversationState(prev => ({
              ...prev, phase: 'flow', flowStep: 1, answers: newAnswers,
              deliveryMethod, deliveryStaffId,
            }));
            if (stepMsg.type === 'text') setWaitingForText(true);
          }
          return;
        }
        // Else start from step 0
        const stepMsg = engine.getFlowStepMessage(0);
        if (stepMsg) {
          setMessages(prev => [...prev, { from: 'bot', msg: stepMsg, time: timeStamp() }]);
          setConversationState(prev => ({
            ...prev, phase: 'flow', flowStep: 0, answers: newAnswers,
            deliveryMethod, deliveryStaffId,
          }));
          if (stepMsg.type === 'text') setWaitingForText(true);
        }
      }, 400);
      return;
    }

    // ── Choice selected in flow ──
    if (id.startsWith('choice_') || id === 'manual_input') {
      if (id === 'manual_input') {
        setWaitingForText(true);
        return;
      }

      const step = engine.steps[state.flowStep];
      if (step) {
        const label = step.label || step.key;
        const newAnswers = { ...state.answers, [label]: item.title };
        advanceFlow(state.flowStep + 1, newAnswers);
      }
      return;
    }
  }, [conversationState, startConversation]);

  // ── Advance to next flow step or confirmation ──
  const advanceFlow = useCallback((nextIdx, answers) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (nextIdx >= engine.steps.length) {
      // All steps done → submit to server + show confirmation
      const flowId = builderData?.flow?.id || null;
      const deliveryMethod = conversationState?.deliveryMethod || 'none';
      const deliveryStaffId = conversationState?.deliveryStaffId || null;

      // POST real submission
      fetch(`${API}/business/${businessId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: answers, flowId, deliveryMethod, deliveryStaffId }),
      }).catch(err => console.error('Failed to submit:', err));

      setTimeout(() => {
        const conf = engine.getConfirmation(answers);
        setMessages(prev => [...prev, { from: 'bot', msg: conf, time: timeStamp() }]);
        setConversationState(prev => ({ ...prev, phase: 'confirmed', answers }));
        setWaitingForText(false);
      }, 400);
      return;
    }

    setTimeout(() => {
      const stepMsg = engine.getFlowStepMessage(nextIdx);
      if (stepMsg) {
        setMessages(prev => [...prev, { from: 'bot', msg: stepMsg, time: timeStamp() }]);
        setConversationState(prev => ({
          ...prev, flowStep: nextIdx, answers,
        }));
        setWaitingForText(stepMsg.type === 'text');
      }
    }, 400);
  }, []);

  // ── Handle text input (for text steps & manual input) ──
  const handleSendText = useCallback(() => {
    if (!textInput.trim() || !waitingForText) return;
    const engine = engineRef.current;
    const state = conversationState;
    const now = timeStamp();
    const value = textInput.trim();

    setMessages(prev => [...prev, { from: 'user', text: value, time: now }]);
    setTextInput('');
    setWaitingForText(false);

    const step = engine.steps[state.flowStep];
    if (step) {
      const label = step.label || step.key;
      const newAnswers = { ...state.answers, [label]: value };
      advanceFlow(state.flowStep + 1, newAnswers);
    }
  }, [textInput, waitingForText, conversationState, advanceFlow]);

  // ── Render a single message ──
  function renderMessage(msg, idx) {
    if (msg.from === 'user') {
      return <UserBubble key={idx} text={msg.text} time={msg.time} />;
    }

    const m = msg.msg;
    if (!m) return null;

    if (m.type === 'image') {
      return (
        <BotBubble key={idx} time={msg.time}>
          <MediaHeader media={m.media} businessId={businessId} cacheRef={mediaCacheRef} />
        </BotBubble>
      );
    }

    if (m.type === 'text') {
      return (
        <BotBubble key={idx} time={msg.time}>
          <div style={{ fontSize: 14, color: WA.textPrimary, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {renderFormattedText(m.body)}
          </div>
        </BotBubble>
      );
    }

    if (m.type === 'buttons') {
      return (
        <div key={idx}>
          <BotBubble time={msg.time}>
            <div style={{ fontSize: 14, color: WA.textPrimary, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {renderFormattedText(m.body)}
            </div>
          </BotBubble>
          <QuickReplyButtons buttons={m.buttons} onSelect={handleSelect} />
        </div>
      );
    }

    if (m.type === 'list') {
      return (
        <div key={idx}>
          <BotBubble time={msg.time}>
            <div style={{ fontSize: 14, color: WA.textPrimary, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {renderFormattedText(m.body)}
            </div>
          </BotBubble>
          <ListButton label={m.buttonLabel} onClick={() => setListOverlay({ sections: m.sections, title: m.buttonLabel })} />
        </div>
      );
    }

    return null;
  }

  // ── Loading / Error states ──
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#667781' }}>
        Loading bot configuration…
      </div>
    );
  }

  if (error || !builderData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#e74c3c' }}>
        {error || 'No business data found'}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
      padding: 24, background: '#f0f2f5',
    }}>
      {/* Phone Frame */}
      <div style={{
        width: 375, height: 720, borderRadius: 40, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 0 8px #1a1a1a, 0 0 0 10px #333',
        background: '#1a1a1a', display: 'flex', flexDirection: 'column', position: 'relative',
      }}>
        {/* Status Bar */}
        <div style={{
          height: 44, background: '#075e54', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 20px', fontSize: 12, color: '#ffffffcc',
          fontWeight: 500,
        }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="6" width="3" height="6" rx="0.5" fill="#ffffffcc"/><rect x="4.5" y="4" width="3" height="8" rx="0.5" fill="#ffffffcc"/><rect x="9" y="2" width="3" height="10" rx="0.5" fill="#ffffffcc"/><rect x="13.5" y="0" width="2.5" height="12" rx="0.5" fill="#ffffff66"/></svg>
            <svg width="22" height="12" viewBox="0 0 22 12"><rect x="0" y="1" width="18" height="10" rx="2" stroke="#ffffffcc" strokeWidth="1" fill="none"/><rect x="1.5" y="2.5" width="13" height="7" rx="1" fill="#ffffffcc"/><rect x="19" y="4" width="2" height="4" rx="0.5" fill="#ffffffcc"/></svg>
          </div>
        </div>

        {/* WhatsApp Header */}
        <div style={{
          background: WA.headerBg, padding: '8px 12px 10px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <button onClick={startConversation} style={{
            background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex',
          }} title="Restart conversation">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: '#00a884',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff',
          }}>
            {(builderData.business?.name || 'B')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: WA.headerText }}>
              {builderData.business?.name || 'Your Business'}
            </div>
            <div style={{ fontSize: 12, color: '#ffffffaa' }}>online</div>
          </div>
          <button onClick={startConversation} style={{
            background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4,
            borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500,
          }} title="Restart conversation">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
          </button>
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1, overflow: 'auto', background: WA.bg, backgroundImage: WA.chatPattern,
          display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0',
          position: 'relative',
        }}>
          {/* Date chip */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
            <span style={{
              background: '#e1f2fb', borderRadius: 8, padding: '4px 12px',
              fontSize: 12, color: '#54656f', fontWeight: 500,
            }}>TODAY</span>
          </div>

          {/* Encryption notice */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 8px' }}>
            <span style={{
              background: '#fdf8c8', borderRadius: 6, padding: '6px 10px', textAlign: 'center',
              fontSize: 11, color: '#54656f', lineHeight: 1.4,
            }}>
              🔒 Messages to this chat and calls are secured with end-to-end encryption.
            </span>
          </div>

          {messages.map((msg, i) => renderMessage(msg, i))}
          <div ref={chatEndRef} />
        </div>

        {/* List Overlay — positioned on the phone frame, not inside scroll */}
        {listOverlay && (
          <ListOverlay
            sections={listOverlay.sections}
            title={listOverlay.title}
            onSelect={(row) => handleSelect(row)}
            onClose={() => setListOverlay(null)}
          />
        )}

        {/* Input Bar */}
        <div style={{
          background: '#f0f2f5', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6,
          borderTop: '1px solid #e9edef',
        }}>
          <div style={{ fontSize: 22, cursor: 'pointer', color: '#54656f', padding: '0 2px' }}>😊</div>
          <div style={{ fontSize: 20, cursor: 'pointer', color: '#54656f', padding: '0 2px' }}>📎</div>
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendText()}
            placeholder={waitingForText ? 'Type your answer…' : 'Type a message'}
            disabled={!waitingForText}
            style={{
              flex: 1, border: 'none', outline: 'none', borderRadius: 20,
              padding: '9px 14px', fontSize: 14, background: '#fff',
              color: WA.textPrimary, opacity: waitingForText ? 1 : 0.5,
            }}
          />
          <button
            onClick={waitingForText ? handleSendText : undefined}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: WA.buttonText, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: waitingForText ? 'pointer' : 'default', opacity: waitingForText && textInput.trim() ? 1 : 0.6,
            }}
          >
            {waitingForText && textInput.trim() ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="#fff"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 18.5a6.5 6.5 0 0 0 6.5-6.5V6a6.5 6.5 0 0 0-13 0v6A6.5 6.5 0 0 0 12 18.5z"/><line x1="12" y1="22" x2="12" y2="18.5"/><path d="M8 22h8"/></svg>
            )}
          </button>
        </div>

        {/* Home Indicator */}
        <div style={{
          height: 20, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 120, height: 4, borderRadius: 2, background: '#bbb' }} />
        </div>
      </div>

      {/* Side Panel — Payload Inspector */}
      <div style={{
        width: 380, height: 720, marginLeft: 32, borderRadius: 12, overflow: 'hidden',
        background: '#1e1e2e', border: '1px solid #2d2d44', display: 'flex', flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid #2d2d44', fontSize: 13, fontWeight: 600,
          color: '#a0a0b8', textTransform: 'uppercase', letterSpacing: 1,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 15 }}>📡</span> API Payload Inspector
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {messages.filter(m => m.from === 'bot' && m.msg).map((m, i) => {
            const payload = buildApiPayload(m.msg);
            return (
              <details key={i} style={{ marginBottom: 8 }}>
                <summary style={{
                  fontSize: 12, color: '#8888aa', cursor: 'pointer', padding: '6px 8px',
                  borderRadius: 6, background: '#252538', fontFamily: 'monospace',
                  userSelect: 'none',
                }}>
                  <span style={{ color: '#e2b714', fontWeight: 600 }}>{m.msg.type}</span>
                  {' — '}
                  <span style={{ color: '#aaa' }}>{(m.msg.body || '').slice(0, 40)}…</span>
                </summary>
                <pre style={{
                  fontSize: 11, color: '#c8c8e0', background: '#1a1a2a', borderRadius: 6,
                  padding: 10, margin: '4px 0 0', overflow: 'auto', maxHeight: 300,
                  lineHeight: 1.5, fontFamily: '"Fira Code", "Consolas", monospace',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Build the real Meta Graph API payload from our internal message ──
function buildApiPayload(msg) {
  const to = '{{recipient_phone}}';
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };

  if (msg.type === 'image') {
    return { ...base, type: 'image', image: { link: `{{media_url}}/${msg.media?.id}` } };
  }

  if (msg.type === 'text') {
    return { ...base, type: 'text', text: { body: msg.body } };
  }

  if (msg.type === 'buttons') {
    const interactive = {
      type: 'button',
      body: { text: msg.body },
      action: {
        buttons: msg.buttons.map(b => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        })),
      },
    };
    return { ...base, type: 'interactive', interactive };
  }

  if (msg.type === 'list') {
    return {
      ...base, type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: msg.body },
        action: {
          button: msg.buttonLabel,
          sections: msg.sections,
        },
      },
    };
  }

  return base;
}