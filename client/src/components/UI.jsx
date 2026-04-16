export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full p-6 animate-scale-in ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ onCancel, submitLabel = 'Save' }) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">Cancel</button>
      <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 cursor-pointer transition-all shadow-sm btn-press">{submitLabel}</button>
    </div>
  );
}

export function Spinner() {
  return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;
}

export function ErrorMsg({ msg, onDismiss }) {
  if (!msg) return null;
  return (
    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-center justify-between animate-fade-in">
      <span>{msg}</span>
      {onDismiss && <button onClick={onDismiss} className="text-red-400 hover:text-red-600 cursor-pointer p-0.5 rounded hover:bg-red-100 transition-colors">✕</button>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    rejected: 'bg-red-50 text-red-700 ring-red-600/20',
    manual_followup: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    completed: 'bg-gray-50 text-gray-600 ring-gray-500/20',
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    inactive: 'bg-gray-50 text-gray-500 ring-gray-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${colors[status] || 'bg-gray-50 text-gray-600 ring-gray-500/20'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all bg-gray-50/50';
export const selectClass = 'w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm bg-white transition-all';
