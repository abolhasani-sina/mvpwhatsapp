import { useState } from 'react';

export default function WhatsAppPreview({ tree = [], businessName = 'Your Business' }) {
  const [navStack, setNavStack] = useState([]);
  const [messages, setMessages] = useState([
    { from: 'bot', text: `👋 Welcome to ${businessName}! How can we help you today?` },
  ]);

  const currentNodes = navStack.length === 0
    ? tree
    : navStack[navStack.length - 1].children || [];

  const currentTitle = navStack.length === 0
    ? businessName
    : navStack[navStack.length - 1].title || navStack[navStack.length - 1].label || 'Menu';

  const handleButtonClick = (node) => {
    const label = node.title || node.label || 'Button';
    const newMessages = [...messages, { from: 'user', text: label }];

    if (node.type === 'menu' && node.children?.length > 0) {
      newMessages.push({ from: 'bot', text: `You selected "${label}". Please choose:` });
      setNavStack([...navStack, node]);
    } else if (node.type === 'flow_entry') {
      newMessages.push({ from: 'bot', text: `📝 Starting form for "${label}"...\n\nThe customer will now answer your form questions step by step.` });
    } else if (node.type === 'info') {
      newMessages.push({ from: 'bot', text: `ℹ️ ${label}\n\nInformation displayed to customer.` });
    } else if (node.type === 'action') {
      newMessages.push({ from: 'bot', text: `⚡ Action: ${node.action_type || label}` });
    } else {
      newMessages.push({ from: 'bot', text: `"${label}" selected.` });
    }

    setMessages(newMessages);
  };

  const handleBack = () => {
    if (navStack.length > 0) {
      const newStack = navStack.slice(0, -1);
      setNavStack(newStack);
      setMessages([...messages,
        { from: 'user', text: '⬅️ Back' },
        { from: 'bot', text: newStack.length === 0 ? `Back to main menu. How can we help?` : 'Please choose:' },
      ]);
    }
  };

  const handleReset = () => {
    setNavStack([]);
    setMessages([{ from: 'bot', text: `👋 Welcome to ${businessName}! How can we help you today?` }]);
  };

  const nodeTypeLabel = (type) => {
    switch (type) {
      case 'menu': return '📂';
      case 'flow_entry': return '📝';
      case 'info': return 'ℹ️';
      case 'action': return '⚡';
      default: return '📱';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div className="w-[300px] rounded-[2rem] bg-gray-900 p-2 shadow-2xl">
        <div className="rounded-[1.5rem] overflow-hidden bg-white flex flex-col" style={{ height: 520 }}>
          {/* WhatsApp header */}
          <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{currentTitle}</p>
              <p className="text-emerald-200 text-[10px]">online</p>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 wa-phone px-3 py-2 overflow-y-auto flex flex-col gap-2" id="wa-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] px-3 py-2 text-[13px] leading-snug whitespace-pre-wrap ${msg.from === 'user' ? 'wa-bubble-user' : 'wa-bubble-bot'}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Buttons */}
            {currentNodes.length > 0 && (
              <div className="mt-1 space-y-1.5 animate-fade-in">
                <div className="wa-bubble-bot px-3 py-2 text-[13px]">
                  {navStack.length === 0 ? 'Please choose an option:' : 'Select:'}
                </div>
                {currentNodes.map((node, i) => (
                  <button
                    key={node.id || i}
                    onClick={() => handleButtonClick(node)}
                    className="wa-btn flex items-center justify-center gap-1.5"
                  >
                    <span className="text-xs">{nodeTypeLabel(node.type)}</span>
                    {node.title || node.label || `Button ${i + 1}`}
                  </button>
                ))}
                {navStack.length > 0 && (
                  <button onClick={handleBack} className="wa-btn opacity-60">⬅️ Back</button>
                )}
              </div>
            )}

            {currentNodes.length === 0 && tree.length === 0 && (
              <div className="mt-2 text-center text-gray-500 text-xs py-4">
                No menu buttons yet. Add buttons to see them here.
              </div>
            )}
          </div>

          {/* Input bar (decorative) */}
          <div className="bg-[#f0f0f0] px-3 py-2 flex items-center gap-2">
            <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-xs text-gray-400">
              Customers tap buttons only
            </div>
            <div className="w-8 h-8 rounded-full bg-[#075e54] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={handleReset}
        className="mt-3 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
      >
        ↻ Reset preview
      </button>
    </div>
  );
}
