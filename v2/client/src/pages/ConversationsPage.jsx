import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../lib/auth.jsx';
import { MessageCircle, Phone, Clock, Mic, Image } from 'lucide-react';

const API = '/api';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isVoice = msg.content.startsWith('[Voice message]:');
  const isImage = msg.content === 'Customer sent an image' || msg.content.startsWith('[Image]');
  const text = isVoice ? msg.content.replace('[Voice message]:', '').trim() : msg.content;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isUser ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
        {isVoice && (
          <div className="flex items-center gap-1.5 mb-1 opacity-70">
            <Mic className="w-3 h-3" />
            <span className="text-[11px] font-medium">Voice message</span>
          </div>
        )}
        {isImage && (
          <div className="flex items-center gap-1.5 mb-1 opacity-70">
            <Image className="w-3 h-3" />
            <span className="text-[11px] font-medium">Image</span>
          </div>
        )}
        <p className="leading-relaxed whitespace-pre-wrap">{text}</p>
        <p className={`text-[10px] mt-1 ${isUser ? 'text-indigo-200' : 'text-slate-400'} text-right`}>
          {formatTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function ConversationsPage({ businessId }) {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!businessId) return;
    authFetch(`${API}/business/${businessId}/ai-conversations`)
      .then(r => r.json())
      .then(data => { setCustomers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [businessId]);

  useEffect(() => {
    if (!selected) return;
    setMsgLoading(true);
    authFetch(`${API}/business/${businessId}/ai-conversations/${encodeURIComponent(selected)}`)
      .then(r => r.json())
      .then(data => { setMessages(data); setMsgLoading(false); })
      .catch(() => setMsgLoading(false));
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50">
      {/* Customer list */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Conversations</h2>
          <p className="text-xs text-slate-400 mt-0.5">{customers.length} customers</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {customers.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <MessageCircle className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No conversations yet</p>
            </div>
          )}
          {customers.map(c => (
            <button
              key={c.customer_phone}
              onClick={() => setSelected(c.customer_phone)}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${selected === c.customer_phone ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-800">+{c.customer_phone}</span>
                </div>
                <span className="text-[10px] text-slate-400">{formatTime(c.last_message_at)}</span>
              </div>
              <div className="flex items-center justify-between pl-10">
                <span className="text-xs text-slate-400">{c.message_count} messages</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Message view */}
      <div className="flex-1 flex flex-col">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Select a conversation</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 bg-white border-b border-slate-200">
              <p className="font-medium text-slate-800">+{selected}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {msgLoading && <div className="text-center text-slate-400 text-sm py-8">Loading...</div>}
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              <div ref={bottomRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
