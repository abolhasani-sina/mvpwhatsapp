import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Clock, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchErrorLogs } from '../lib/api';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  function loadLogs() {
    setLoading(true);
    setError(null);
    fetchErrorLogs(30)
      .then((data) => setLogs(data))
      .catch((err) => setError(err.message || 'Failed to load error logs.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadLogs(); }, []);

  const severityColor = (level) => {
    if (level === 'error' || level === 'fatal') return 'bg-red-50 text-red-700 border-red-200';
    if (level === 'warn') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const severityDot = (level) => {
    if (level === 'error' || level === 'fatal') return 'bg-red-500';
    if (level === 'warn') return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Logs</h2>
          <p className="text-sm text-slate-500 mt-1">Recent errors and issues — shown in plain language</p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="text-center py-16 text-slate-400 text-sm">Loading logs…</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Info className="w-7 h-7 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">All clear!</h3>
          <p className="text-sm text-slate-500">No errors recorded. Your system is running smoothly.</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="space-y-3">
          {logs.map((log, idx) => {
            const expanded = expandedId === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : idx)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${severityDot(log.level)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${severityColor(log.level)}`}>
                        {log.module || 'system'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.time}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">{log.message}</p>
                  </div>
                  {expanded
                    ? <ChevronUp className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  }
                </button>

                {expanded && (
                  <div className="px-4 pb-4 border-t border-slate-50 pt-3 ml-5 space-y-2">
                    {log.help && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-700 mb-0.5">What to do</p>
                          <p className="text-sm text-amber-800">{log.help}</p>
                        </div>
                      </div>
                    )}
                    {log.technicalMessage && (
                      <div className="text-xs text-slate-400">
                        <span className="font-medium text-slate-500">Technical detail:</span>{' '}
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">{log.technicalMessage}</code>
                      </div>
                    )}
                    {log.requestPath && (
                      <div className="text-xs text-slate-400">
                        <span className="font-medium text-slate-500">Endpoint:</span> {log.requestPath}
                      </div>
                    )}
                    {log.errorId && (
                      <div className="text-xs text-slate-400">
                        <span className="font-medium text-slate-500">Error ID:</span>{' '}
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded">{log.errorId}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
