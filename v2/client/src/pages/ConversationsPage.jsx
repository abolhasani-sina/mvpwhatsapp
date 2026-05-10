import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../lib/auth.jsx';
import { Mic, ImageIcon, Bot, User } from 'lucide-react';

const API = '/api';

function getInitials(phone) {
  return phone ? phone.slice(-2) : '??';
}

function getAvatarColor(phone) {
  const colors = [
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500',
    'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-pink-500'
  ];
  const idx = phone ? parseInt(phone.slice(-1)) % colors.length : 0;
  return colors[idx];
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return 'Today';
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function previewText(content, role) {
  if (!content) return '';
  if (content.startsWith('[Voice message]:')) return ' Voice message';
  if (content === 'Customer sent an image') return ' Image';
  const prefix = role === 'assistant' ? 'Luna: ' : '';
  return prefix + content.slice(0, 45) + (content.length > 45 ? '...' : '');
}

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  for (const msg of messages) {
    const date = new Date(msg.created_at).toDateString();
    if (date !== lastDate) {
      groups.push({ type: 'date', label: formatDate(msg.created_at) });
      lastDate = date;
    }
    groups.push({ type: 'message', msg });
  }
  return groups;
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isVoice = msg.content.startsWith('[Voice message]:');
  const isImage = msg.content === 'Customer sent an image';
  const text = isVoice ? msg.content.replace('[Voice message]:', '').trim() : msg.content;

  return (
    <div className={`flex items-end gap-2 mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[72%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-none'
            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
        }`}>
          {isVoice && (
            <div className={`flex items-center gap-1.5 mb-2 ${isUser ? 'text-indigo-200' : 'text-violet-500'}`}>
              <Mic className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Voice</span>
            </div>
          )}
          {isImage && (
            <div className={`flex items-center gap-1.5 mb-2 ${isUser ? 'text-indigo-200' : 'text-violet-500'}`}>
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Image</span>
            </div>
          )}
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-normal">{text}</p>
        </div>
        <span className={`text-[11px] mt-1 px-1 ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
          {formatTime(msg.created_at)}
        </span>
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mb-0.5">
          <User className="w-3.5 h-3.5 text-slate-500" />
        </div>
      )}
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

  const selectedCustomer = customers.find(c => c.customer_phone === selected);
  const grouped = groupByDate(messages);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">

      {/* Sidebar */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Conversations</h2>
          <p className="text-xs text-slate-400 mt-0.5">{customers.length} {customers.length === 1 ? 'customer' : 'customers'}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {customers.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Bot className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">No conversations yet</p>
            </div>
          )}
          {customers.map(c => (
            <button
              key={c.customer_phone}
              onClick={() => setSelected(c.customer_phone)}
              className={`w-full text-left px-4 py-3.5 border-b border-slate-50 transition-all ${
                selected === c.customer_phone
                  ? 'bg-indigo-50 border-l-[3px] border-l-indigo-500'
                  : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(c.customer_phone)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <span className="text-xs font-bold text-white">{getInitials(c.customer_phone)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-slate-800">+{c.customer_phone}</span>
                    <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">{formatTime(c.last_message_at)}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{previewText(c.last_message, c.last_role)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
              <Bot className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">Select a conversation to view</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-full ${getAvatarColor(selected)} flex items-center justify-center shadow-sm`}>
                <span className="text-xs font-bold text-white">{getInitials(selected)}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">+{selected}</p>
                <p className="text-xs text-slate-400">{selectedCustomer?.message_count || 0} messages</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f3f0ff 100%)' }}>
              {msgLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {grouped.map((item, i) => (
                item.type === 'date' ? (
                  <div key={i} className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">{item.label}</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                ) : (
                  <MessageBubble key={i} msg={item.msg} />
                )
              ))}
              <div ref={bottomRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
