import { MessageSquare, LayoutDashboard, Bot, Inbox, Users, Settings, LogOut, ChevronLeft, ChevronRight, Smartphone, Menu, X, Bell } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, authFetch } from '../lib/auth';



const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'builder', label: 'Bot Builder', icon: Bot },
  { key: 'submissions', label: 'Submissions', icon: Inbox },
  { key: 'staff', label: 'Staff', icon: Users },
  { key: 'tester', label: 'Bot Tester', icon: Smartphone },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children, currentView, onViewChange, onLogout, businessId }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const notifRef = useRef(null);

  // businessId passed as prop from App.jsx

  const fetchUnread = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await authFetch('/api/businesses/' + businessId + '/notifications/unread-count');
      const json = await res.json();
      setUnreadCount(json.data?.count || 0);
    } catch {}
  }, [businessId]);

  const fetchNotifs = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await authFetch('/api/businesses/' + businessId + '/notifications');
      const json = await res.json();
      setNotifs(json.data || []);
    } catch {}
  }, [businessId]);

  const markAllRead = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await authFetch('/api/businesses/' + businessId + '/notifications/read-all', { method: 'POST' });
      await res.json();
      setUnreadCount(0);
      setNotifs(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch {}
  }, [businessId]);

  useEffect(() => { setMobileOpen(false); }, [currentView]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  useEffect(() => {
    if (!notifOpen) return;
    fetchNotifs();
    const t = setTimeout(() => { markAllRead(); setUnreadCount(0); }, 3000);
    return () => clearTimeout(t);
  }, [notifOpen]);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
          <span className="ml-3 text-base font-bold text-white truncate tracking-tight">NabzChat</span>
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
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-11 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden" style={{boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-bold text-slate-800">Notifications</span>
                      {unreadCount > 0 && <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full">{unreadCount} new</span>}
                    </div>
                    {unreadCount > 0 && <button className="text-xs text-indigo-500 hover:text-indigo-700 font-medium" onClick={markAllRead}>Mark all read</button>}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Bell className="w-8 h-8 text-slate-200" />
                        <p className="text-sm text-slate-400">No notifications yet</p>
                      </div>
                    )}
                    {notifs.map(n => (
                      <div key={n.id} className={"flex gap-3 px-5 py-3.5 hover:bg-slate-50 transition-all cursor-pointer " + (!n.read_at ? "bg-indigo-50/40 border-l-2 border-indigo-400" : "")}>
                        <div className={"w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 " + (!n.read_at ? "bg-indigo-100" : "bg-slate-100")}>
                          <Inbox className={"w-4 h-4 " + (!n.read_at ? "text-indigo-500" : "text-slate-400")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={"text-sm " + (!n.read_at ? "font-semibold text-slate-900" : "font-medium text-slate-700")}>{n.title}</p>
                          {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body.split("\n")[0]}</p>}
                          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <span>{new Date(n.created_at).toLocaleString("en-GB", {day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
                            {!n.read_at && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block"></span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
