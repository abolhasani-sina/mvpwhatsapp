import { useState, useRef, useEffect, useCallback } from 'react';
import { whatsappApi, sessionsApi } from '../services/api';

const PHONE = '905000000000';

export default function WhatsAppTester() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetChat = useCallback(async () => {
    setResetting(true);
    try {
      await sessionsApi.reset(PHONE);
    } catch { /* ignore */ }
    setMessages([]);
    setResetting(false);
  }, []);

  // Auto-reset session when tester opens
  useEffect(() => { resetChat(); }, [resetChat]);

  async function sendMessage(text) {
    if (!text.trim()) return;
    setInput('');

    // Add user message to chat
    setMessages((prev) => [...prev, { from: 'user', text }]);
    setLoading(true);

    try {
      const res = await whatsappApi.simulate(PHONE, text);
      const responses = res.data?.data?.responses || [];

      for (const msg of responses) {
        const botMsg = { from: 'bot', text: '', buttons: [] };

        if (msg.type === 'text') {
          botMsg.text = msg.text.body;
        } else if (msg.type === 'interactive') {
          const inter = msg.interactive;
          botMsg.text = inter.body?.text || '';

          if (inter.type === 'button' && inter.action?.buttons) {
            botMsg.buttons = inter.action.buttons.map((b) => ({
              id: b.reply.id,
              title: b.reply.title,
            }));
          }
          if (inter.type === 'list' && inter.action?.sections) {
            const rows = inter.action.sections.flatMap((s) => s.rows || []);
            botMsg.buttons = rows.map((r) => ({
              id: r.id,
              title: r.title,
            }));
          }
        }

        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { from: 'bot', text: '⚠️ ' + (err.response?.data?.error?.message || err.message) }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    resetChat();
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075e54] text-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm">WhatsApp Simulator</p>
            <p className="text-[11px] text-white/70">Testing as {PHONE}</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          disabled={resetting}
          className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition"
        >
          {resetting ? '...' : '🔄 Reset Chat'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#ece5dd] px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-500 mt-10">
            Send a message to start the conversation
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm shadow-sm whitespace-pre-wrap ${
                msg.from === 'user'
                  ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-none'
                  : 'bg-white text-gray-900 rounded-tl-none'
              }`}
            >
              {msg.text}

              {/* Render buttons */}
              {msg.buttons && msg.buttons.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {msg.buttons.map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => sendMessage(btn.id)}
                      disabled={loading}
                      className="w-full text-center text-[13px] font-medium text-[#075e54] border border-[#075e54]/30 rounded-lg py-1.5 hover:bg-[#075e54]/10 transition disabled:opacity-50 cursor-pointer"
                    >
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
            <div className="bg-white rounded-xl px-4 py-2 text-sm text-gray-400 rounded-tl-none shadow-sm">
              typing...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 bg-[#f0f0f0] rounded-b-xl">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-full bg-white text-sm outline-none border border-gray-200 focus:border-[#075e54] transition disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-full bg-[#075e54] text-white flex items-center justify-center hover:bg-[#064e46] transition disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
