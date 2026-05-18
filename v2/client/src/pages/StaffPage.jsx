import { useState, useEffect } from 'react';
import { Users, Scissors, Clock, Plus, Trash2, Edit2, Check, X, Star, Phone, Send } from 'lucide-react';
import { fetchStaffMembers, createStaffMember, updateStaffMember, deleteStaffMember, fetchServices, createService, updateService, deleteService, fetchBusinessHours, saveBusinessHours } from '../lib/api';
import { useToast } from '../components/Toast';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SPECIALTIES = ['any','nail','hair','eyebrow','skin','massage','makeup','other'];
const EMPTY_STAFF = { name:'', specialty:'any', priority:'normal', phone:'', telegram_chat_id:'', work_start:'09:00', work_end:'21:00', working_days:[0,1,2,3,4,5,6] };
const EMPTY_SVC = { name:'', duration_minutes:60, staff_specialty:'any', price:'' };
const EMPTY_HOURS = DAYS.map((_,i) => ({ day_of_week:i, open_time:'09:00', close_time:'21:00', is_closed: i===0 }));

function Badge({ children, color='slate' }) {
  const colors = { slate:'bg-slate-100 text-slate-600', indigo:'bg-indigo-100 text-indigo-700', amber:'bg-amber-100 text-amber-700', green:'bg-green-100 text-green-700' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]||colors.slate}`}>{children}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function StaffTab({ businessId }) {
  const { addToast } = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_STAFF);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [businessId]);
  async function load() { setLoading(true); setStaff(await fetchStaffMembers(businessId)); setLoading(false); }

  function openAdd() { setForm(EMPTY_STAFF); setModal('add'); }
  function openEdit(s) { setForm({ ...s, working_days: typeof s.working_days === 'string' ? JSON.parse(s.working_days) : s.working_days }); setModal('edit'); }

  async function save() {
    if (!form.name.trim()) return addToast('Name is required', 'error');
    setSaving(true);
    try {
      if (modal === 'add') await createStaffMember(businessId, form);
      else await updateStaffMember(businessId, form.id, form);
      addToast(modal === 'add' ? 'Staff member added' : 'Updated', 'success');
      setModal(null); await load();
    } catch(e) { addToast(e.message, 'error'); }
    setSaving(false);
  }

  async function remove(id) {
    if (!confirm('Delete this staff member?')) return;
    try { await deleteStaffMember(businessId, id); addToast('Deleted', 'success'); await load(); }
    catch(e) { addToast(e.message, 'error'); }
  }

  function toggleDay(d) {
    const days = form.working_days || [];
    setForm(f => ({ ...f, working_days: days.includes(d) ? days.filter(x=>x!==d) : [...days,d].sort() }));
  }

  const formFields = (
    <div className="space-y-3">
      <div><label className="text-xs font-medium text-slate-600 block mb-1">Name *</label>
        <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Sara"/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-slate-600 block mb-1">Specialty</label>
          <select value={form.specialty} onChange={e=>setForm(f=>({...f,specialty:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            {SPECIALTIES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select></div>
        <div><label className="text-xs font-medium text-slate-600 block mb-1">Priority</label>
          <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            <option value="normal">Normal</option><option value="vip">VIP (gets bookings first)</option>
          </select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-slate-600 block mb-1">Phone</label>
          <input value={form.phone||''} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="+971..."/></div>
        <div><label className="text-xs font-medium text-slate-600 block mb-1">Telegram Chat ID</label>
          <input value={form.telegram_chat_id||''} onChange={e=>setForm(f=>({...f,telegram_chat_id:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="123456789"/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-slate-600 block mb-1">Work start</label>
          <input type="time" value={form.work_start||'09:00'} onChange={e=>setForm(f=>({...f,work_start:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/></div>
        <div><label className="text-xs font-medium text-slate-600 block mb-1">Work end</label>
          <input type="time" value={form.work_end||'21:00'} onChange={e=>setForm(f=>({...f,work_end:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/></div>
      </div>
      <div><label className="text-xs font-medium text-slate-600 block mb-1">Working days</label>
        <div className="flex gap-1 flex-wrap">
          {DAYS.map((d,i)=><button key={i} type="button" onClick={()=>toggleDay(i)} className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${(form.working_days||[]).includes(i)?'bg-indigo-500 text-white':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{d.slice(0,3)}</button>)}
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="py-12 text-center text-slate-400 text-sm">Loading</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{staff.length} staff member{staff.length!==1?'s':''}</p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 transition-all">
          <Plus className="w-4 h-4"/>Add Staff
        </button>
      </div>
      {staff.length===0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30"/>
          <p className="text-sm">No staff yet. Add your first staff member.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map(s=>(
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
                {s.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-800 text-sm">{s.name}</span>
                  {s.priority==='vip'&&<Badge color="amber"><Star className="w-3 h-3 inline mr-0.5"/>VIP</Badge>}
                  <Badge color="indigo">{s.specialty}</Badge>
                  {!s.is_active&&<Badge color="slate">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  {s.phone&&<span><Phone className="w-3 h-3 inline mr-0.5"/>{s.phone}</span>}
                  {s.telegram_chat_id&&<span><Send className="w-3 h-3 inline mr-0.5"/>Telegram linked</span>}
                  {s.google_calendar_id&&<span className="text-green-500"> Calendar</span>}
                  <span>{s.work_start}{s.work_end}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={()=>openEdit(s)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4"/></button>
                <button onClick={()=>remove(s.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(modal==='add'||modal==='edit')&&(
        <Modal title={modal==='add'?'Add Staff Member':'Edit Staff Member'} onClose={()=>setModal(null)}>
          {formFields}
          <div className="flex gap-2 mt-5">
            <button onClick={()=>setModal(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 text-sm bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50">{saving?'Saving':'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ServicesTab({ businessId }) {
  const { addToast } = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_SVC);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{load();},[businessId]);
  async function load(){setLoading(true);setServices(await fetchServices(businessId));setLoading(false);}
  function openAdd(){setForm(EMPTY_SVC);setModal('add');}
  function openEdit(s){setForm(s);setModal('edit');}

  async function save(){
    if(!form.name.trim()) return addToast('Name is required','error');
    setSaving(true);
    try{
      if(modal==='add') await createService(businessId,form);
      else await updateService(businessId,form.id,form);
      addToast(modal==='add'?'Service added':'Updated','success');
      setModal(null);await load();
    }catch(e){addToast(e.message,'error');}
    setSaving(false);
  }

  async function remove(id){
    if(!confirm('Delete this service?')) return;
    try{await deleteService(businessId,id);addToast('Deleted','success');await load();}
    catch(e){addToast(e.message,'error');}
  }

  if(loading) return <div className="py-12 text-center text-slate-400 text-sm">Loading</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{services.length} service{services.length!==1?'s':''}</p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 transition-all">
          <Plus className="w-4 h-4"/>Add Service
        </button>
      </div>
      {services.length===0?(
        <div className="text-center py-16 text-slate-400">
          <Scissors className="w-10 h-10 mx-auto mb-3 opacity-30"/>
          <p className="text-sm">No services yet. Add your first service.</p>
        </div>
      ):(
        <div className="space-y-2">
          {services.map(s=>(
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-800 text-sm">{s.name}</span>
                  <Badge color="indigo">{s.staff_specialty}</Badge>
                  {!s.is_active&&<Badge color="slate">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span><Clock className="w-3 h-3 inline mr-0.5"/>{s.duration_minutes} min</span>
                  {s.price&&<span>AED {s.price}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={()=>openEdit(s)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4"/></button>
                <button onClick={()=>remove(s.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(modal==='add'||modal==='edit')&&(
        <Modal title={modal==='add'?'Add Service':'Edit Service'} onClose={()=>setModal(null)}>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Service name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Gel Nails"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-600 block mb-1">Duration (min)</label>
                <input type="number" value={form.duration_minutes} onChange={e=>setForm(f=>({...f,duration_minutes:Number(e.target.value)}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" min="5" step="5"/></div>
              <div><label className="text-xs font-medium text-slate-600 block mb-1">Price (AED)</label>
                <input value={form.price||''} onChange={e=>setForm(f=>({...f,price:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="150"/></div>
            </div>
            <div><label className="text-xs font-medium text-slate-600 block mb-1">Staff specialty</label>
              <select value={form.staff_specialty} onChange={e=>setForm(f=>({...f,staff_specialty:e.target.value}))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                {SPECIALTIES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select></div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={()=>setModal(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 text-sm bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50">{saving?'Saving':'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function HoursTab({ businessId }) {
  const { addToast } = useToast();
  const [hours, setHours] = useState(EMPTY_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{load();},[businessId]);
  async function load(){
    setLoading(true);
    const data = await fetchBusinessHours(businessId);
    if(data && data.length>0){
      const merged = EMPTY_HOURS.map(def=>{
        const found = data.find(d=>d.day_of_week===def.day_of_week);
        return found||def;
      });
      setHours(merged);
    }
    setLoading(false);
  }

  function update(i,field,val){setHours(h=>h.map((d,idx)=>idx===i?{...d,[field]:val}:d));}

  async function save(){
    setSaving(true);
    try{await saveBusinessHours(businessId,hours);addToast('Hours saved','success');}
    catch(e){addToast(e.message,'error');}
    setSaving(false);
  }

  if(loading) return <div className="py-12 text-center text-slate-400 text-sm">Loading</div>;

  return (
    <div>
      <div className="space-y-2 mb-5">
        {hours.map((d,i)=>(
          <div key={i} className={`bg-white border rounded-xl p-4 flex items-center gap-4 transition-all ${d.is_closed?'opacity-60 border-slate-100':'border-slate-200'}`}>
            <span className="text-sm font-medium text-slate-700 w-24 shrink-0">{DAYS[d.day_of_week]}</span>
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <div className={`w-10 h-5 rounded-full transition-all ${d.is_closed?'bg-slate-200':'bg-indigo-500'} relative`} onClick={()=>update(i,'is_closed',!d.is_closed)}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${d.is_closed?'left-0.5':'left-5'}`}/>
              </div>
              <span className="text-xs text-slate-500">{d.is_closed?'Closed':'Open'}</span>
            </label>
            {!d.is_closed&&(
              <div className="flex items-center gap-2 flex-1">
                <input type="time" value={d.open_time} onChange={e=>update(i,'open_time',e.target.value)} className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
                <span className="text-slate-300 text-sm"></span>
                <input type="time" value={d.close_time} onChange={e=>update(i,'close_time',e.target.value)} className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="w-full px-4 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-all">
        {saving?'Saving':'Save Hours'}
      </button>
    </div>
  );
}

const TABS = [
  { key:'staff', label:'Staff', icon:Users },
  { key:'services', label:'Services', icon:Scissors },
  { key:'hours', label:'Business Hours', icon:Clock },
];

export default function StaffPage({ businessId }) {
  const [tab, setTab] = useState('staff');
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===t.key?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4"/>{t.label}
          </button>
        ))}
      </div>
      {tab==='staff'&&<StaffTab businessId={businessId}/>}
      {tab==='services'&&<ServicesTab businessId={businessId}/>}
      {tab==='hours'&&<HoursTab businessId={businessId}/>}
    </div>
  );
}
