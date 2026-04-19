import { MessageSquare, LayoutDashboard, Bot, Inbox, Users, Settings, LogOut, ChevronLeft, ChevronRight, Smartphone, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <span className="ml-3 text-base font-bold text-gray-900 truncate">BotDesk</span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onViewChange(item.key)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 py-2 border-t border-gray-100">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>

        {/* User / Logout */}
        <div className="px-3 py-3 border-t border-gray-100 shrink-0">
          <button
            onClick={onLogout}
            title="Log out"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{user?.name || 'Log out'}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">
            {NAV_ITEMS.find((i) => i.key === currentView)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-emerald-700">
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
