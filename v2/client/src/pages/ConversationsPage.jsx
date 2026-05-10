import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../lib/auth.jsx';
import { Mic, ImageIcon, Bot, User } from 'lucide-react';

const API = '/api';
const CHANNEL_COLORS = { whatsapp: 'bg-emerald-500', telegram: 'bg-blue-500', instagram: 'bg-pink-500' };
const CHANNEL_LABELS = { whatsapp: 'WA', telegram: 'TG', instagram: 'IG' };

function getAvatarColor(phone) {
  const colors = ['bg-violet-500','bg-indigo-500','bg-blue-500','bg-teal-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-pink-500'];
  return colors[parseInt((phone||'0').slice(-1)) % colors.length];
}

function getInitials(name, phone) {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0]+parts[1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
  }
  return (phone||'??').slice(-2);
}

function ChannelBadge({ channel }) {
  if (!channel) return null;
  const color = CHANNEL_COLORS[channel] || 'bg-slate-400';
  const label = CHANNEL_LABELS[channel] || '??';
  return <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ${color}`}>{label}</span>;
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts), now = new Date(), diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts), now = new Date(), diff = now - d;
  if (diff < 86400000) return 'Today';
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function previewText(content, role) {
  if (!content) return 'No messages yet';
  if (content.startsWith('[Voice message]:')) return ' ' + content.replace('[Voice message]:','').trim().slice(0,35);
  if (content === 'Customer sent an image') return ' Image';
  const prefix = role === 'assistant' ? 'Luna: ' : '';
  const clean = content.replace(/\*\*/g,'').replace(/\n/g,' ');
  return prefix + clean.slice(0,42) + (clean.length > 42 ? '...' : '');
}

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  for (const msg of messages) {
    const date = new Date(msg.created_at).toDateString();
    if (date !== lastDate) { groups.push({ type: 'date', label: formatDate(msg.created_at) }); lastDate = date; }
    groups.push({ type: 'message', msg });
  }
  return groups;
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isVoice = msg.content.startsWith('[Voice message]:');
  const isImage = msg.content === 'Customer sent an image';
  const text = isVoice ? msg.content.replace('[Voice message]:','').trim() : msg.content;
  return (
    <div className={`flex items-end gap-2 mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[72%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${isUser ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'}`}>
          {isVoice && <div className={`flex items-center gap-1.5 mb-2 ${isUser ? 'text-indigo-200' : 'text-violet-500'}`}><Mic className="w-3.5 h-3.5" /><span className="text-[11px] font-semibold uppercase tracking-wide">Voice</span></div>}
          {isImage && <div className={`flex items-center gap-1.5 mb-2 ${isUser ? 'text-indigo-200' : 'text-violet-500'}`}><ImageIcon className="w-3.5 h-3.5" /><span className="text-[11px] font-semibold uppercase tracking-wide">Image</span></div>}
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>
        <span className="text-[11px] mt-1 px-1 text-slate-400">{formatTime(msg.created_at)}</span>
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
  const [filter, setFilter] = useState('all');
  const bottomRef = useRef(null);

  const fetchCustomers = () => {
    if (!businessId) return;
    authFetch(`${API}/business/${businessId}/ai-conversations`)
      .then(r => r.json()).then(data => { setCustomers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
    const interval = setInterval(fetchCustomers, 30000);
    return () => clearInterval(interval);
  }, [businessId]);

  const fetchMessages = (phone, silent = false) => {
    if (!phone) return;
    if (!silent) setMsgLoading(true);
    authFetch(`${API}/business/${businessId}/ai-conversations/${encodeURIComponent(phone)}`)
      .then(r => r.json()).then(data => { setMessages(Array.isArray(data) ? data : []); setMsgLoading(false); })
      .catch(() => setMsgLoading(false));
  };

  useEffect(() => {
    fetchMessages(selected);
    if (!selected) return;
    const interval = setInterval(() => fetchMessages(selected, true), 30000);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const now = new Date();
  const filteredCustomers = customers.filter(c => {
    if (filter === 'all') return true;
    const t = new Date(c.last_message_at);
    if (filter === 'today') return t.toDateString() === now.toDateString();
    if (filter === 'week') return (now - t) < 7 * 86400000;
    if (filter === 'month') return (now - t) < 30 * 86400000;
    return true;
  });
  const selectedCustomer = customers.find(c => c.customer_phone === selected);
  const grouped = groupByDate(messages);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Conversations</h2>
          <p className="text-xs text-slate-400 mt-0.5">{filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}</p>
        </div>
        <div className="flex gap-1 px-3 py-2 border-b border-slate-100">
          {[['all','All'],['today','Today'],['week','Week'],['month','Month']].map(([key,label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${filter === key ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.length === 0 && <div className="flex flex-col items-center justify-center h-48 gap-2"><Bot className="w-8 h-8 text-slate-300" /><p className="text-sm text-slate-400">No conversations yet</p></div>}
          {filteredCustomers.map(c => (
            <button key={c.customer_phone} onClick={() => setSelected(c.customer_phone)}
              className={`w-full text-left px-4 py-3.5 border-b border-slate-50 transition-all ${selected === c.customer_phone ? 'bg-indigo-50 border-l-[3px] border-l-indigo-500' : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(c.customer_phone)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <span className="text-xs font-bold text-white">{getInitials(c.customer_name, c.customer_phone)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 truncate">{c.customer_name || ('+' + c.customer_phone)}</span>
                      {c.channel && <ChannelBadge channel={c.channel} />}
                    </div>
                    <span className="text-[11px] text-slate-400 flex-shrink-0 ml-1">{formatTime(c.last_message_at)}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{previewText(c.last_message, c.last_role)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
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
            <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-full ${getAvatarColor(selected)} flex items-center justify-center shadow-sm`}>
                <span className="text-xs font-bold text-white">{getInitials(selectedCustomer?.customer_name, selected)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{selectedCustomer?.customer_name || ('+' + selected)}</p>
                  {selectedCustomer?.channel && <ChannelBadge channel={selectedCustomer.channel} />}
                </div>
                <p className="text-xs text-slate-400">+{selected}  {selectedCustomer?.message_count || 0} messages</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f3f0ff 100%)' }}>
              {msgLoading && <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>}
              {grouped.map((item, i) => (
                item.type === 'date'
                  ? <div key={i} className="flex items-center gap-3 my-4"><div className="flex-1 h-px bg-slate-200" /><span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">{item.label}</span><div className="flex-1 h-px bg-slate-200" /></div>
                  : <MessageBubble key={i} msg={item.msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
