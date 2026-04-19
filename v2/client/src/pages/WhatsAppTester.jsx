import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../lib/api';
import { authFetch } from '../lib/auth';

const API = API_BASE;

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

// ─── Telegram Design Tokens ──────────────────────────────────────────
const TG = {
  bg: '#e6ebee',
  headerBg: '#517da2',
  headerText: '#fff',
  bubbleBot: '#ffffff',
  bubbleUser: '#effdde',
  textPrimary: '#000000',
  textSecondary: '#8e8e93',
  buttonPill: '#e3f0ff',
  buttonText: '#3390ec',
  buttonBorder: '#bdd8f5',
  listBtnBg: '#3390ec',
  listBtnText: '#fff',
  timestamp: '#8e8e93',
  inputBg: '#f0f2f5',
  overlayBg: 'rgba(0,0,0,0.45)',
  chatPattern: 'none',
  statusBarBg: '#4a7296',
  appName: 'Telegram',
  encryptionMsg: null,
};

// ─── Instagram Design Tokens ─────────────────────────────────────────
const IG = {
  bg: '#ffffff',
  headerBg: '#ffffff',
  headerText: '#262626',
  bubbleBot: '#efefef',
  bubbleUser: '#3797f0',
  bubbleUserText: '#ffffff',
  textPrimary: '#262626',
  textSecondary: '#8e8e8e',
  buttonPill: '#eff3f4',
  buttonText: '#3797f0',
  buttonBorder: '#dbdbdb',
  listBtnBg: '#3797f0',
  listBtnText: '#fff',
  timestamp: '#8e8e8e',
  inputBg: '#efefef',
  overlayBg: 'rgba(0,0,0,0.45)',
  chatPattern: 'none',
  statusBarBg: '#ffffff',
  appName: 'Instagram',
  encryptionMsg: null,
};

const CHANNEL_THEMES = { whatsapp: WA, telegram: TG, instagram: IG };
const CHANNEL_TABS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25D366' },
  { key: 'telegram', label: 'Telegram', icon: '✈️', color: '#0088cc' },
  { key: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C' },
];

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

function BotBubble({ children, time, theme }) {
  const t = theme || WA;
  const isIG = t === IG;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '2px 12px', maxWidth: '100%' }}>
      <div style={{
        background: t.bubbleBot, borderRadius: isIG ? '18px 18px 18px 4px' : '0 8px 8px 8px', padding: '6px 8px 4px',
        maxWidth: '85%', boxShadow: isIG ? 'none' : '0 1px 0.5px rgba(11,20,26,0.13)', position: 'relative',
      }}>
        {children}
        <div style={{ textAlign: 'right', marginTop: 2 }}>
          <span style={{ fontSize: 11, color: t.timestamp }}>{time}</span>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ text, time, theme }) {
  const t = theme || WA;
  const isIG = t === IG;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 12px' }}>
      <div style={{
        background: t.bubbleUser, borderRadius: isIG ? '18px 18px 4px 18px' : '8px 0 8px 8px', padding: '6px 8px 4px',
        maxWidth: '85%', boxShadow: isIG ? 'none' : '0 1px 0.5px rgba(11,20,26,0.13)',
      }}>
        <div style={{ fontSize: 14, color: isIG ? (t.bubbleUserText || t.textPrimary) : t.textPrimary, lineHeight: 1.45, wordBreak: 'break-word' }}>
          {text}
        </div>
        <div style={{ textAlign: 'right', marginTop: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 11, color: isIG ? '#ffffffaa' : t.timestamp }}>{time}</span>
          {!isIG && <svg width="16" height="11" viewBox="0 0 16 11"><path d="M11.07 0L5.44 5.63 3.28 3.47 2 4.75l3.44 3.44 6.91-6.91z" fill="#53bdeb"/><path d="M14.07 0L8.44 5.63 7.28 4.47 6 5.75l2.44 2.44 6.91-6.91z" fill="#53bdeb"/></svg>}
        </div>
      </div>
    </div>
  );
}

function QuickReplyButtons({ buttons, onSelect, theme }) {
  const t = theme || WA;
  const isTG = t === TG;
  const isIG = t === IG;
  return (
    <div style={{ display: 'flex', flexDirection: isTG ? 'row' : 'column', flexWrap: isTG ? 'wrap' : 'nowrap', gap: 6, padding: '4px 12px 6px', maxWidth: '85%' }}>
      {buttons.map((btn, i) => (
        <button key={btn.id || i} onClick={() => onSelect(btn)}
          style={{
            background: isTG ? t.buttonPill : '#fff',
            border: `1px solid ${t.buttonBorder}`, borderRadius: isIG ? 18 : isTG ? 16 : 8,
            padding: isTG ? '7px 14px' : '9px 14px', fontSize: 14, fontWeight: 500, color: t.buttonText,
            cursor: 'pointer', textAlign: 'center', transition: 'background 0.15s',
            boxShadow: isIG ? 'none' : '0 1px 0.5px rgba(11,20,26,0.08)',
          }}
          onMouseEnter={e => e.target.style.background = t.buttonPill}
          onMouseLeave={e => e.target.style.background = isTG ? t.buttonPill : '#fff'}
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
    authFetch(`${API}/business/${businessId}/media/${media.id}`)
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
  const [previewChannel, setPreviewChannel] = useState('whatsapp');
  const [activeChannel, setActiveChannel] = useState('whatsapp');
  const chatEndRef = useRef(null);
  const engineRef = useRef(null);
  const mediaCacheRef = useRef(new Map());
  const conversationStateRef = useRef(null);
  const lastTapRef = useRef({ id: null, ts: 0 });
  const processingRef = useRef(false); // blocks all button clicks during bot response
  const sessionTimerRef = useRef(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Session timeout indicator (30 min)
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

  function resetSessionTimer() {
    setSessionExpired(false);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(() => {
      setSessionExpired(true);
    }, SESSION_TIMEOUT_MS);
  }

  useEffect(() => {
    return () => { if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current); };
  }, []);

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  function appendBotMessage(msg) {
    if (!msg) return;
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.from === 'bot' && JSON.stringify(last.msg) === JSON.stringify(msg)) {
        return prev;
      }
      return [...prev, { from: 'bot', msg, time: timeStamp() }];
    });
  }

  function appendBotMessages(items) {
    if (!items || items.length === 0) return;
    setMessages(prev => {
      const next = [...prev];
      for (const msg of items) {
        const last = next[next.length - 1];
        if (last?.from === 'bot' && JSON.stringify(last.msg) === JSON.stringify(msg)) {
          continue;
        }
        next.push({ from: 'bot', msg, time: timeStamp() });
      }
      return next;
    });
  }

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, listOverlay]);

  // ── Load builder data ──
  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    authFetch(`${API}/business/${businessId}/builder`)
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
    resetSessionTimer();
  }, []);

  // ── Advance to next flow step or confirmation ──
  const advanceFlow = useCallback((nextIdx, answers) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (nextIdx >= engine.steps.length) {
      // All steps done → submit to server + show confirmation
      const flowId = builderData?.flow?.id || null;

      // Read delivery info from current state
      setConversationState(prev => {
        const deliveryMethod = prev?.deliveryMethod || 'none';
        const deliveryStaffId = prev?.deliveryStaffId || null;

        // POST real submission
        authFetch(`${API}/business/${businessId}/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: answers, flowId, deliveryMethod, deliveryStaffId }),
        }).catch(err => console.error('Failed to submit:', err));

        return { ...prev, phase: 'confirmed', answers };
      });

      setTimeout(() => {
        const conf = engine.getConfirmation(answers);
        appendBotMessage(conf);
        setWaitingForText(false);
      }, 400);
      return;
    }

    setTimeout(() => {
      const stepMsg = engine.getFlowStepMessage(nextIdx);
      if (stepMsg) {
        appendBotMessage(stepMsg);
        setConversationState(prev => ({
          ...prev, flowStep: nextIdx, answers,
        }));
        setWaitingForText(stepMsg.type === 'text');
      }
    }, 400);
  }, [builderData, businessId]);

  // ── Handle user selecting a button/list item ──
  const handleSelect = useCallback((item) => {
    setListOverlay(null);
    const engine = engineRef.current;
    if (!engine) return;

    // Block all clicks while processing a previous action
    if (processingRef.current) return;

    const now = timeStamp();
    const id = item.id;

    // Ignore same button/list tap if it occurs too quickly (double click/tap).
    if (lastTapRef.current.id === id && now && Date.now() - lastTapRef.current.ts < 450) {
      return;
    }
    lastTapRef.current = { id, ts: Date.now() };

    // Lock processing until bot response is rendered
    processingRef.current = true;
    setTimeout(() => { processingRef.current = false; }, 600);

    // Reset session inactivity timer
    resetSessionTimer();

    // Add user message
    setMessages(prev => [...prev, { from: 'user', text: item.title, time: now }]);

    // Determine next action based on item id

    // ── Main Menu / New Booking → restart
    if (id === 'main_menu' || id === 'new_booking') {
      setTimeout(() => startConversation(), 400);
      return;
    }

    // ── Go Back → show welcome
    if (id === 'go_back') {
      setTimeout(() => {
        const welcome = engine.getWelcome();
        appendBotMessage(welcome);
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
        setTimeout(() => {
          const menuMsg = engine.getChildrenList(btn.children || [], 'Here are our service categories — pick one to explore! ✨', 'Browse Services');
          appendBotMessage(menuMsg);
          setConversationState(prev => ({ ...prev, phase: 'browsing_menu', menuPath: [btnId] }));
        }, 400);
        return;
      }

      if (btn.behavior === 'info') {
        setTimeout(() => {
          const infoMsgs = engine.getInfoMessage(btn);
          appendBotMessages(infoMsgs);
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
        setTimeout(() => {
          const cleanLabel = btn.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
          const menuMsg = engine.getChildrenList(btn.children, `Great choice! Here\'s what we offer in *${cleanLabel}* 👇`, 'Browse');
          appendBotMessage(menuMsg);
          setConversationState(prev => ({ ...prev, menuPath: [...prev.menuPath, btnId] }));
        }, 400);
        return;
      }

      if (btn.behavior === 'info' && btn.infoPage) {
        setTimeout(() => {
          const infoMsgs = engine.getInfoMessage(btn);
          appendBotMessages(infoMsgs);
          setConversationState(prev => ({ ...prev, phase: 'viewing_info', currentInfo: btn }));
        }, 400);
        return;
      }
    }

    // ── Book button from info page → start flow ──
    if (id.startsWith('book_')) {
      const actionBtnId = Number(id.replace('book_', ''));
      const prevState = conversationStateRef.current || {};
      const serviceLabel = prevState.currentInfo?.label || '';
      const infoBtn = prevState.currentInfo;
      const actionBtn = infoBtn?.infoPage?.actionButtons?.find(a => a.id === actionBtnId);
      const deliveryMethod = actionBtn?.deliveryMethod || 'none';
      const deliveryStaffId = actionBtn?.deliveryStaffId || null;

      setTimeout(() => {
        const newAnswers = { ...(prevState.answers || {}) };
        if (engine.steps.length > 0 && engine.steps[0].type === 'select_from_menu') {
          newAnswers[engine.steps[0].label || engine.steps[0].key] = serviceLabel;
          const stepMsg = engine.getFlowStepMessage(1);
          if (stepMsg) {
            appendBotMessage(stepMsg);
            setConversationState(p => ({
              ...p,
              phase: 'flow',
              flowStep: 1,
              answers: newAnswers,
              deliveryMethod,
              deliveryStaffId,
            }));
            setWaitingForText(stepMsg.type === 'text');
          }
          return;
        }

        const stepMsg = engine.getFlowStepMessage(0);
        if (stepMsg) {
          appendBotMessage(stepMsg);
          setConversationState(p => ({
            ...p,
            phase: 'flow',
            flowStep: 0,
            answers: newAnswers,
            deliveryMethod,
            deliveryStaffId,
          }));
          setWaitingForText(stepMsg.type === 'text');
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

      const prevState = conversationStateRef.current || {};
      const step = engine.steps[prevState.flowStep];
      if (step) {
        const label = step.label || step.key;
        const newAnswers = { ...(prevState.answers || {}), [label]: item.title };
        advanceFlow((prevState.flowStep || 0) + 1, newAnswers);
      }
      return;
    }
  }, [startConversation, advanceFlow]);

  // ── Handle text input (for text steps & manual input) ──
  const handleSendText = useCallback(() => {
    if (!textInput.trim() || !waitingForText) return;
    const engine = engineRef.current;
    const now = timeStamp();
    const value = textInput.trim();

    setMessages(prev => [...prev, { from: 'user', text: value, time: now }]);
    setTextInput('');
    setWaitingForText(false);

    const prevState = conversationStateRef.current || {};
    const step = engine.steps[prevState.flowStep];
    if (step) {
      const label = step.label || step.key;
      const newAnswers = { ...(prevState.answers || {}), [label]: value };
      advanceFlow((prevState.flowStep || 0) + 1, newAnswers);
    }
  }, [textInput, waitingForText, advanceFlow]);

  // ── Render a single message ──
  function renderMessage(msg, idx) {
    const t = CHANNEL_THEMES[activeChannel] || WA;
    if (msg.from === 'user') {
      return <UserBubble key={idx} text={msg.text} time={msg.time} theme={t} />;
    }

    const m = msg.msg;
    if (!m) return null;

    if (m.type === 'image') {
      return (
        <BotBubble key={idx} time={msg.time} theme={t}>
          <MediaHeader media={m.media} businessId={businessId} cacheRef={mediaCacheRef} />
        </BotBubble>
      );
    }

    if (m.type === 'text') {
      return (
        <BotBubble key={idx} time={msg.time} theme={t}>
          <div style={{ fontSize: 14, color: t.textPrimary, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {renderFormattedText(m.body)}
          </div>
        </BotBubble>
      );
    }

    if (m.type === 'buttons') {
      return (
        <div key={idx}>
          <BotBubble time={msg.time} theme={t}>
            <div style={{ fontSize: 14, color: t.textPrimary, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {renderFormattedText(m.body)}
            </div>
          </BotBubble>
          <QuickReplyButtons buttons={m.buttons} onSelect={handleSelect} theme={t} />
        </div>
      );
    }

    if (m.type === 'list') {
      const isTG = t === TG;
      const isIG = t === IG;
      // Telegram: render as inline keyboard buttons
      // Instagram: render as quick reply pills
      if (isTG || isIG) {
        const allRows = m.sections.flatMap(s => s.rows);
        return (
          <div key={idx}>
            <BotBubble time={msg.time} theme={t}>
              <div style={{ fontSize: 14, color: t.textPrimary, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {renderFormattedText(m.body)}
              </div>
              {isTG && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                  {allRows.map((row, ri) => (
                    <button key={row.id || ri} onClick={() => handleSelect(row)}
                      style={{
                        background: t.buttonPill, border: 'none', borderRadius: 8,
                        padding: '9px 12px', fontSize: 14, fontWeight: 500, color: t.buttonText,
                        cursor: 'pointer', textAlign: 'center', transition: 'opacity 0.15s',
                        width: '100%',
                      }}
                      onMouseEnter={e => e.target.style.opacity = '0.8'}
                      onMouseLeave={e => e.target.style.opacity = '1'}
                    >
                      {row.title}
                    </button>
                  ))}
                </div>
              )}
            </BotBubble>
            {isIG && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 12px 6px', maxWidth: '85%' }}>
                {allRows.map((row, ri) => (
                  <button key={row.id || ri} onClick={() => handleSelect(row)}
                    style={{
                      background: '#fff', border: `1px solid ${t.buttonBorder}`, borderRadius: 18,
                      padding: '8px 16px', fontSize: 14, fontWeight: 500, color: t.buttonText,
                      cursor: 'pointer', textAlign: 'center', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.background = t.buttonPill}
                    onMouseLeave={e => e.target.style.background = '#fff'}
                  >
                    {row.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }
      // WhatsApp: dropdown list
      return (
        <div key={idx}>
          <BotBubble time={msg.time} theme={t}>
            <div style={{ fontSize: 14, color: t.textPrimary, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
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
  const theme = CHANNEL_THEMES[activeChannel] || WA;
  const isWA = activeChannel === 'whatsapp';
  const isTG = activeChannel === 'telegram';
  const isIG = activeChannel === 'instagram';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%',
      padding: '12px 24px 24px', background: '#f0f2f5',
    }}>
      {/* Channel Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: 12,
        padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {CHANNEL_TABS.map(ch => (
          <button key={ch.key} onClick={() => { setActiveChannel(ch.key); setPreviewChannel(ch.key); }}
            style={{
              padding: '8px 20px', fontSize: 13, fontWeight: activeChannel === ch.key ? 700 : 500,
              background: activeChannel === ch.key ? ch.color : 'transparent',
              color: activeChannel === ch.key ? '#fff' : '#666',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>{ch.icon}</span> {ch.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      {/* Phone Frame */}
      <div style={{
        width: 375, height: 720, borderRadius: 40, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 0 8px #1a1a1a, 0 0 0 10px #333',
        background: '#1a1a1a', display: 'flex', flexDirection: 'column', position: 'relative',
      }}>
        {/* Status Bar */}
        <div style={{
          height: 44, background: isIG ? '#fff' : (isTG ? TG.statusBarBg : '#075e54'),
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 20px', fontSize: 12,
          color: isIG ? '#000' : '#ffffffcc', fontWeight: 500,
        }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="6" width="3" height="6" rx="0.5" fill={isIG ? '#000' : '#ffffffcc'}/><rect x="4.5" y="4" width="3" height="8" rx="0.5" fill={isIG ? '#000' : '#ffffffcc'}/><rect x="9" y="2" width="3" height="10" rx="0.5" fill={isIG ? '#000' : '#ffffffcc'}/><rect x="13.5" y="0" width="2.5" height="12" rx="0.5" fill={isIG ? '#00000066' : '#ffffff66'}/></svg>
            <svg width="22" height="12" viewBox="0 0 22 12"><rect x="0" y="1" width="18" height="10" rx="2" stroke={isIG ? '#000' : '#ffffffcc'} strokeWidth="1" fill="none"/><rect x="1.5" y="2.5" width="13" height="7" rx="1" fill={isIG ? '#000' : '#ffffffcc'}/><rect x="19" y="4" width="2" height="4" rx="0.5" fill={isIG ? '#000' : '#ffffffcc'}/></svg>
          </div>
        </div>

        {/* App Header */}
        <div style={{
          background: theme.headerBg, padding: '8px 12px 10px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: isIG ? '1px solid #dbdbdb' : 'none',
        }}>
          <button onClick={startConversation} style={{
            background: 'none', border: 'none', color: theme.headerText, cursor: 'pointer', padding: 0, display: 'flex',
          }} title="Restart conversation">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.headerText} strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: isIG ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' : isTG ? '#3390ec' : '#00a884',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff',
          }}>
            {(builderData.business?.name || 'B')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.headerText }}>
              {builderData.business?.name || 'Your Business'}
            </div>
            <div style={{ fontSize: 12, color: isIG ? '#8e8e8e' : '#ffffffaa' }}>
              {isIG ? 'Active now' : isTG ? 'bot' : 'online'}
            </div>
          </div>
          <button onClick={startConversation} style={{
            background: 'none', border: 'none', color: theme.headerText, cursor: 'pointer', padding: 4,
            borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500,
          }} title="Restart conversation">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.headerText} strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
          </button>
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1, overflow: 'auto', background: theme.bg,
          backgroundImage: isWA ? WA.chatPattern : 'none',
          display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0',
          position: 'relative',
        }}>
          {/* Date chip */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
            <span style={{
              background: isIG ? '#efefef' : isTG ? '#cce5ff' : '#e1f2fb', borderRadius: 8, padding: '4px 12px',
              fontSize: 12, color: '#54656f', fontWeight: 500,
            }}>TODAY</span>
          </div>

          {/* Encryption notice (WhatsApp only) */}
          {isWA && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 8px' }}>
            <span style={{
              background: '#fdf8c8', borderRadius: 6, padding: '6px 10px', textAlign: 'center',
              fontSize: 11, color: '#54656f', lineHeight: 1.4,
            }}>
              🔒 Messages to this chat and calls are secured with end-to-end encryption.
            </span>
          </div>
          )}

          {messages.map((msg, i) => renderMessage(msg, i))}

          {/* Session expired indicator */}
          {sessionExpired && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 24px' }}>
              <div style={{
                background: '#fff3cd', borderRadius: 8, padding: '10px 16px', textAlign: 'center',
                fontSize: 13, color: '#856404', lineHeight: 1.4, maxWidth: 280,
              }}>
                ⏰ Session expired (30 min inactivity).
                <button onClick={() => { startConversation(); }} style={{
                  display: 'block', margin: '8px auto 0', padding: '6px 16px', fontSize: 12,
                  background: '#00a884', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer',
                }}>Restart Conversation</button>
              </div>
            </div>
          )}

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
          background: isIG ? '#fff' : '#f0f2f5', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6,
          borderTop: isIG ? '1px solid #dbdbdb' : '1px solid #e9edef',
        }}>
          <div style={{ fontSize: 22, cursor: 'pointer', color: '#54656f', padding: '0 2px' }}>😊</div>
          {!isIG && <div style={{ fontSize: 20, cursor: 'pointer', color: '#54656f', padding: '0 2px' }}>📎</div>}
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendText()}
            placeholder={waitingForText ? 'Type your answer…' : (isIG ? 'Message...' : 'Type a message')}
            disabled={!waitingForText}
            style={{
              flex: 1, border: isIG ? '1px solid #dbdbdb' : 'none', outline: 'none', borderRadius: 20,
              padding: '9px 14px', fontSize: 14, background: isIG ? '#fff' : '#fff',
              color: theme.textPrimary, opacity: waitingForText ? 1 : 0.5,
            }}
          />
          <button
            onClick={waitingForText ? handleSendText : undefined}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: isIG ? '#3797f0' : isTG ? '#3390ec' : WA.buttonText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          height: 20, background: isIG ? '#fff' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 120, height: 4, borderRadius: 2, background: '#bbb' }} />
        </div>
      </div>

      </div>{/* close flex row */}
    </div>
  );
}

// ── Channel-aware payload builder ──
function buildChannelPayload(msg, channel) {
  if (channel === 'telegram') return buildTelegramPayload(msg);
  if (channel === 'instagram') return buildInstagramPayload(msg);
  return buildWhatsAppPayload(msg);
}

function buildWhatsAppPayload(msg) {
  const to = '{{recipient_phone}}';
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };

  if (msg.type === 'image') {
    return { ...base, type: 'image', image: { link: `{{media_url}}/${msg.media?.id}` } };
  }
  if (msg.type === 'text') {
    return { ...base, type: 'text', text: { body: msg.body } };
  }
  if (msg.type === 'buttons') {
    return { ...base, type: 'interactive', interactive: {
      type: 'button', body: { text: msg.body },
      action: { buttons: msg.buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) },
    }};
  }
  if (msg.type === 'list') {
    return { ...base, type: 'interactive', interactive: {
      type: 'list', body: { text: msg.body },
      action: { button: msg.buttonLabel, sections: msg.sections },
    }};
  }
  return base;
}

function buildTelegramPayload(msg) {
  const chatId = '{{chat_id}}';

  if (msg.type === 'image') {
    return { method: 'sendPhoto', chat_id: chatId, photo: `{{media_url}}/${msg.media?.id}`, caption: msg.body || undefined, parse_mode: 'HTML' };
  }
  if (msg.type === 'text') {
    return { method: 'sendMessage', chat_id: chatId, text: msg.body, parse_mode: 'HTML' };
  }
  if (msg.type === 'buttons') {
    return { method: 'sendMessage', chat_id: chatId, text: msg.body, parse_mode: 'HTML',
      reply_markup: { inline_keyboard: msg.buttons.map(b => [{ text: b.title, callback_data: b.id }]) },
    };
  }
  if (msg.type === 'list') {
    const allRows = (msg.sections || []).flatMap(s => s.rows || []);
    return { method: 'sendMessage', chat_id: chatId, text: msg.body, parse_mode: 'HTML',
      reply_markup: { inline_keyboard: allRows.map(r => [{ text: r.title, callback_data: r.id }]) },
    };
  }
  return { method: 'sendMessage', chat_id: chatId, text: msg.body || '(empty)', parse_mode: 'HTML' };
}

function buildInstagramPayload(msg) {
  const recipient = { id: '{{recipient_id}}' };

  if (msg.type === 'image') {
    return { recipient, message: { attachment: { type: 'image', payload: { url: `{{media_url}}/${msg.media?.id}`, is_reusable: true } } } };
  }
  if (msg.type === 'text') {
    return { recipient, message: { text: msg.body } };
  }
  if (msg.type === 'buttons') {
    return { recipient, message: { text: msg.body,
      quick_replies: msg.buttons.map(b => ({ content_type: 'text', title: b.title, payload: b.id })),
    }};
  }
  if (msg.type === 'list') {
    const allRows = (msg.sections || []).flatMap(s => s.rows || []);
    return { recipient, message: { text: msg.body,
      quick_replies: allRows.slice(0, 13).map(r => ({ content_type: 'text', title: r.title, payload: r.id })),
    }};
  }
  return { recipient, message: { text: msg.body || '(empty)' } };
}