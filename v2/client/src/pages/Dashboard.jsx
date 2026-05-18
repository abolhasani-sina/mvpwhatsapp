import { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, AlertCircle, ArrowRight, Clock, CheckCircle, Phone } from 'lucide-react';
import { fetchBookings, fetchStaffMembers } from '../lib/api';
import Onboarding from '../components/Onboarding';

function StatCard({ label, value, sub, icon: Icon, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    green:  'bg-green-50 text-green-600 border-green-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color] || colors.blue}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-2xl font-semibold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBar({ count, max, day }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-xs text-slate-500">{count}</span>
      <div className="w-full bg-slate-100 rounded-full" style={{height:'64px',display:'flex',alignItems:'flex-end'}}>
        <div className="w-full bg-indigo-400 rounded-full transition-all" style={{height: pct + '%', minHeight: count > 0 ? '8px' : '0'}}></div>
      </div>
      <span className="text-xs text-slate-400">{day}</span>
    </div>
  );
}

export default function Dashboard({ businessId, setBusinessId, onNavigate }) {
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    Promise.all([
      fetchBookings(businessId),
      fetchStaffMembers(businessId)
    ]).then(([bks, st]) => {
      setBookings(Array.isArray(bks) ? bks : []);
      setStaff(Array.isArray(st) ? st : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [businessId]);

  if (!businessId) {
    return <Onboarding onComplete={(t) => {
      if (t === 'settings') onNavigate?.('settings');
      else if (t === 'builder') onNavigate?.('builder');
      else if (typeof t === 'number') setBusinessId(t);
    }} />;
  }

  const todayBks = bookings.filter(b => b.date === today);
  const upcoming = todayBks.filter(b => b.status === 'confirmed' && b.time >= new Date().toTimeString().slice(0,5));
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const noShows = bookings.filter(b => b.status === 'no_show').length;

  // Last 7 days chart
  const last7 = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0,10);
    return { day: days[d.getDay()], count: bookings.filter(b => b.date === dateStr).length };
  });
  const maxCount = Math.max(...last7.map(d => d.count), 1);

  // Staff bookings today
  const staffStats = staff.map(s => ({
    ...s,
    todayCount: todayBks.filter(b => b.staff_id === s.id).length
  })).sort((a,b) => b.todayCount - a.todayCount);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{greeting} </h2>
        <p className="text-sm text-slate-500 mt-0.5">Here is what is happening today</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-slate-100 rounded-xl h-24 animate-pulse"/>)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Today's bookings" value={todayBks.length} sub={`${upcoming.length} upcoming`} icon={Calendar} color="blue" />
            <StatCard label="Confirmed" value={confirmed} sub="total active" icon={CheckCircle} color="green" />
            <StatCard label="Staff active" value={staff.filter(s=>s.is_active).length} sub={`${staffStats.filter(s=>s.todayCount>0).length} booked today`} icon={Users} color="purple" />
            <StatCard label="No-shows" value={noShows} sub="all time" icon={AlertCircle} color="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-700">Bookings  last 7 days</h3>
                <button onClick={() => onNavigate?.('bookings')} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">View all <ArrowRight className="w-3 h-3"/></button>
              </div>
              <div className="flex items-end gap-2">
                {last7.map((d, i) => <MiniBar key={i} count={d.count} max={maxCount} day={d.day} />)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-700">Today's schedule</h3>
                <span className="text-xs text-slate-400">{todayBks.length} bookings</span>
              </div>
              {todayBks.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">No bookings today</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {todayBks.sort((a,b) => a.time.localeCompare(b.time)).map(b => (
                    <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="w-14 text-center">
                        <span className="text-xs font-medium text-slate-700">{b.time}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{b.customer_name || 'Customer'}</p>
                        <p className="text-xs text-slate-500 truncate">{b.service_name}{b.staff_name ? `  ${b.staff_name}` : ''}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {staff.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-700">Staff today</h3>
                <button onClick={() => onNavigate?.('staff')} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">Manage <ArrowRight className="w-3 h-3"/></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {staffStats.map(s => (
                  <div key={s.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">{s.name[0]}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.todayCount} booking{s.todayCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
