import { MessageSquare, LayoutDashboard, Bot, Inbox, Users, Settings, LogOut, ChevronLeft, ChevronRight, Smartphone, AlertTriangle, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'builder', label: 'Bot Builder', icon: Bot },
  { key: 'submissions', label: 'Submissions', icon: Inbox },
  { key: 'staff', label: 'Staff', icon: Users },
  { key: 'tester', label: 'Bot Tester', icon: Smartphone },
  { key: 'logs', label: 'System Logs', icon: AlertTriangle },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children, currentView, onViewChange, onLogout }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [currentView]);

  function handleNav(key) {
    onViewChange(key);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
          <MessageSquare className="w-4.5 h-4.5 text-white" />
        </div>
        {(!collapsed || mobileOpen) && (
          <span className="ml-3 text-base font-bold text-white truncate tracking-tight">BotDesk</span>
        )}
        {mobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto bd-scrollbar">
        {NAV_ITEMS.map((item) => {
          const active = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              title={collapsed && !mobileOpen ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
              {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle - desktop only */}
      <div className="px-3 py-2 border-t border-white/10 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>

      {/* User / Logout */}
      <div className="px-3 py-3 border-t border-white/10 shrink-0">
        <button
          onClick={onLogout}
          title="Log out"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!collapsed || mobileOpen) && <span className="truncate">{user?.name || 'Log out'}</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-slate-900 border-r border-white/10 transform transition-transform duration-200 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      {/* Sidebar - desktop */}
      <aside className={`hidden lg:flex flex-col bg-slate-900 border-r border-white/10 transition-all duration-200 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}>
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-slate-800">
              {NAV_ITEMS.find((i) => i.key === currentView)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-white">
                {(user?.name || 'U')[0].toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
