import { useState, useEffect } from 'react'
import { authFetch } from '../lib/auth.jsx'

const STEPS = [
  { id: 1, title: 'Basic Info',         icon: '🏪' },
  { id: 2, title: 'Services',           icon: '💅' },
  { id: 3, title: 'Packages & Deals',   icon: '🎁' },
  { id: 4, title: 'Hours',              icon: '🕐' },
  { id: 5, title: 'Booking & Policies', icon: '📋' },
  { id: 6, title: 'FAQs & Scenarios',   icon: '💬' },
  { id: 7, title: 'AI Personality',     icon: '🤖' },
  { id: 8, title: 'Review & Save',      icon: '✅' },
]

const SALON_TYPES = ['Beauty Salon', 'Nail Studio', 'Hair Salon', 'Spa', 'Barbershop', 'Lash & Brow Studio', 'Makeup Studio', 'Wellness Center']
const AREAS = ['Deira', 'Bur Dubai', 'Jumeirah', 'Dubai Marina', 'JBR', 'Downtown Dubai', 'Business Bay', 'DIFC', 'Al Quoz', 'Mirdif', 'Karama', 'Satwa', 'Al Barsha', 'JLT', 'Silicon Oasis', 'Al Nahda', 'Discovery Gardens', 'International City', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Other']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const AI_TONES = [
  { value: 'friendly',     label: '😊 Friendly & Warm',  desc: 'Like a helpful friend — casual, warm, approachable' },
  { value: 'professional', label: '💼 Professional',      desc: 'Polite and formal — good for premium salons' },
  { value: 'luxury',       label: '✨ Luxury',             desc: 'Elegant, exclusive language — for high-end brands' },
]

const defaultHours = () => {
  const h = {}
  DAYS.forEach(d => { h[d] = { open: '10:00', close: '21:00', closed: false } })
  h['Friday'] = { open: '14:00', close: '22:00', closed: false }
  return h
}

const emptyBrain = () => ({
  salon_name_en: '', salon_name_ar: '', salon_type: '', area: '', address: '',
  google_maps_link: '', instagram: '', languages: 'arabic_english',
  services: [], packages: [], hours: defaultHours(), ramadan_hours: '',
  ramadan_enabled: false, holiday_closed: true,
  always_closed_days: '', booking_type: 'both', booking_window: '1_week',
  deposit_required: false, deposit_amount: '', cancellation_notice: 'none',
  noshow_policy: 'nothing', staff_request: true,
  faqs: [], scenarios: [],
  ai_name: '', ai_tone: 'friendly', handover_number: '', never_discuss: '',
  is_active: false,
})

const Guide = ({ text }) => (
  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
    <span style={{ fontSize: 16 }}>💡</span>
    <span>{text}</span>
  </div>
)

const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#374151' }}>{label}</label>
    {hint && <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, marginTop: 0 }}>{hint}</p>}
    {children}
  </div>
)

const Input = ({ style, ...props }) => (
  <input {...props} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', ...style }} />
)

const SelectField = ({ children, ...props }) => (
  <select {...props} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: 'white', boxSizing: 'border-box' }}>
    {children}
  </select>
)

const Textarea = ({ style, ...props }) => (
  <textarea {...props} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minHeight: 80, resize: 'vertical', boxSizing: 'border-box', ...style }} />
)

const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
    <div onClick={onChange} style={{ width: 42, height: 24, borderRadius: 12, background: checked ? '#7c3aed' : '#d1d5db', position: 'relative', transition: '0.2s', flexShrink: 0, cursor: 'pointer' }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </div>
    <span>{label}</span>
  </label>
)

/* ─── Step 1: Basic Info ─── */
function StepBasicInfo({ brain, set }) {
  return (
    <div>
      <Guide text="Ask the owner: What is the full name of your salon? Do you have an Arabic name? Where exactly are you located? What is your Instagram?" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Salon Name (English) *">
          <Input value={brain.salon_name_en} onChange={e => set('salon_name_en', e.target.value)} placeholder="e.g. Bloom Beauty Studio" />
        </Field>
        <Field label="Salon Name (Arabic)">
          <Input value={brain.salon_name_ar} onChange={e => set('salon_name_ar', e.target.value)} placeholder="e.g. بلوم بيوتي" dir="rtl" />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Salon Type *">
          <SelectField value={brain.salon_type} onChange={e => set('salon_type', e.target.value)}>
            <option value="">Select type...</option>
            {SALON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </SelectField>
        </Field>
        <Field label="Area / Location *">
          <SelectField value={brain.area} onChange={e => set('area', e.target.value)}>
            <option value="">Select area...</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </SelectField>
        </Field>
      </div>
      <Field label="Full Address" hint="Street name, building, floor — whatever customers need to find you">
        <Input value={brain.address} onChange={e => set('address', e.target.value)} placeholder="e.g. Shop 4, Al Wasl Building, Jumeirah 1" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Google Maps Link">
          <Input value={brain.google_maps_link} onChange={e => set('google_maps_link', e.target.value)} placeholder="https://maps.google.com/..." />
        </Field>
        <Field label="Instagram Handle">
          <Input value={brain.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@bloombeauty.ae" />
        </Field>
      </div>
      <Field label="Languages Served">
        <Guide text="Ask: Which languages do your customers usually speak? Arabic? English? Hindi? Tagalog?" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
          {[
            ['arabic_english',           'Arabic + English'],
            ['arabic_english_hindi',     '+ Hindi'],
            ['arabic_english_hindi_urdu','+ Urdu'],
            ['all',                      'All (AR/EN/HI/UR/TL/FA)'],
          ].map(([val, lbl]) => (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', background: brain.languages === val ? '#ede9fe' : '#f9fafb', border: `1px solid ${brain.languages === val ? '#7c3aed' : '#e5e7eb'}`, borderRadius: 20, padding: '6px 14px' }}>
              <input type="radio" name="languages" value={val} checked={brain.languages === val} onChange={() => set('languages', val)} style={{ display: 'none' }} />
              {lbl}
            </label>
          ))}
        </div>
      </Field>
    </div>
  )
}

/* ─── Step 2: Services ─── */
function StepServices({ brain, setBrain }) {
  const [catName, setCatName] = useState('')
  const [newItem, setNewItem] = useState({})

  const addCategory = () => {
    if (!catName.trim()) return
    setBrain(b => ({ ...b, services: [...b.services, { category: catName.trim(), items: [] }] }))
    setCatName('')
  }

  const addItem = (catIdx) => {
    const item = newItem[catIdx] || {}
    if (!item.name) return
    setBrain(b => {
      const svcs = b.services.map((cat, i) => i === catIdx
        ? { ...cat, items: [...cat.items, { name: item.name, price_from: item.price_from || '', price_to: item.price_to || '', duration: item.duration || '' }] }
        : cat)
      return { ...b, services: svcs }
    })
    setNewItem(n => ({ ...n, [catIdx]: {} }))
  }

  const removeItem = (catIdx, itemIdx) => {
    setBrain(b => {
      const svcs = b.services.map((cat, i) => i === catIdx
        ? { ...cat, items: cat.items.filter((_, j) => j !== itemIdx) }
        : cat)
      return { ...b, services: svcs }
    })
  }

  const removeCategory = (catIdx) => {
    setBrain(b => ({ ...b, services: b.services.filter((_, i) => i !== catIdx) }))
  }

  return (
    <div>
      <Guide text="Ask the owner: Walk me through everything you offer. What categories? E.g. Nails, Hair, Lashes... Then for each — what services, what price range, how long does it take?" />
      {brain.services.map((cat, ci) => (
        <div key={ci} style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 15, color: '#7c3aed' }}>📂 {cat.category}</h4>
            <button onClick={() => removeCategory(ci)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>
          {cat.items.map((item, ii) => (
            <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 6, padding: '8px 12px', marginBottom: 6, fontSize: 13 }}>
              <span style={{ flex: 2 }}>{item.name}</span>
              <span style={{ color: '#7c3aed', flex: 1 }}>AED {item.price_from}{item.price_to ? `–${item.price_to}` : ''}</span>
              <span style={{ color: '#9ca3af', flex: 1 }}>{item.duration}</span>
              <button onClick={() => removeItem(ci, ii)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 6, marginTop: 8 }}>
            <Input
              placeholder="Service name"
              value={(newItem[ci] || {}).name || ''}
              onChange={e => setNewItem(n => ({ ...n, [ci]: { ...n[ci], name: e.target.value } }))}
              onKeyDown={e => e.key === 'Enter' && addItem(ci)}
            />
            <Input
              placeholder="From AED"
              type="number"
              value={(newItem[ci] || {}).price_from || ''}
              onChange={e => setNewItem(n => ({ ...n, [ci]: { ...n[ci], price_from: e.target.value } }))}
            />
            <Input
              placeholder="To AED"
              type="number"
              value={(newItem[ci] || {}).price_to || ''}
              onChange={e => setNewItem(n => ({ ...n, [ci]: { ...n[ci], price_to: e.target.value } }))}
            />
            <Input
              placeholder="e.g. 45 min"
              value={(newItem[ci] || {}).duration || ''}
              onChange={e => setNewItem(n => ({ ...n, [ci]: { ...n[ci], duration: e.target.value } }))}
            />
            <button onClick={() => addItem(ci)} style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontWeight: 600 }}>+</button>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Input
          placeholder="New category (e.g. Nails, Hair, Lashes, Facials...)"
          value={catName}
          onChange={e => setCatName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCategory()}
        />
        <button onClick={addCategory} style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}>
          + Add Category
        </button>
      </div>
    </div>
  )
}

/* ─── Step 3: Packages ─── */
function StepPackages({ brain, setBrain }) {
  const [form, setForm] = useState({ name: '', price: '', includes: '', duration: '', note: '' })

  const addPackage = () => {
    if (!form.name.trim()) return
    setBrain(b => ({ ...b, packages: [...b.packages, { ...form }] }))
    setForm({ name: '', price: '', includes: '', duration: '', note: '' })
  }

  return (
    <div>
      <Guide text="Ask: Do you have any special packages or deals? For example — a bridal package, a monthly membership, a combo deal for nails + lashes?" />
      {brain.packages.length === 0 && (
        <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No packages yet — add one below, or skip this step if you don't have any.</p>
      )}
      {brain.packages.map((pkg, i) => (
        <div key={i} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <strong style={{ fontSize: 14 }}>{pkg.name}</strong>
            <span style={{ color: '#16a34a', marginLeft: 10, fontWeight: 600 }}>AED {pkg.price}</span>
            {pkg.includes && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Includes: {pkg.includes}</p>}
            {pkg.duration && <p style={{ margin: 2, fontSize: 13, color: '#6b7280' }}>Duration: {pkg.duration}</p>}
            {pkg.note && <p style={{ margin: 2, fontSize: 12, color: '#9ca3af' }}>Note: {pkg.note}</p>}
          </div>
          <button onClick={() => setBrain(b => ({ ...b, packages: b.packages.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      ))}
      <div style={{ background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 10, padding: 16, marginTop: 8 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Add a Package</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          <Input placeholder="Package name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Price (AED) *" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          <Input placeholder="Duration" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
        </div>
        <Input placeholder="What's included? (e.g. Manicure + Pedicure + Gel polish)" value={form.includes} onChange={e => setForm(f => ({ ...f, includes: e.target.value }))} style={{ marginBottom: 8 }} />
        <Input placeholder="Any note? (e.g. Valid Mon–Thu only, by appointment)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ marginBottom: 10 }} />
        <button onClick={addPackage} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>+ Add Package</button>
      </div>
    </div>
  )
}

/* ─── Step 4: Hours ─── */
function StepHours({ brain, set, setBrain }) {
  const updateDay = (day, field, val) => {
    setBrain(b => ({ ...b, hours: { ...b.hours, [day]: { ...b.hours[day], [field]: val } } }))
  }

  return (
    <div>
      <Guide text="Ask: What are your opening hours each day? Any day you're closed? Do you change hours during Ramadan or on UAE holidays?" />
      <div style={{ background: '#f9fafb', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 100px', background: '#f3f4f6', padding: '10px 16px', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>
          <span>Day</span><span>Opens</span><span>Closes</span><span>Closed?</span>
        </div>
        {DAYS.map(day => {
          const h = (brain.hours && brain.hours[day]) || { open: '10:00', close: '21:00', closed: false }
          return (
            <div key={day} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 100px', padding: '10px 16px', borderTop: '1px solid #e5e7eb', alignItems: 'center', opacity: h.closed ? 0.45 : 1 }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{day}</span>
              <input type="time" value={h.open} disabled={h.closed} onChange={e => updateDay(day, 'open', e.target.value)} style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 8px', fontSize: 13, width: 110 }} />
              <input type="time" value={h.close} disabled={h.closed} onChange={e => updateDay(day, 'close', e.target.value)} style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 8px', fontSize: 13, width: 110 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!h.closed} onChange={e => updateDay(day, 'closed', e.target.checked)} />
                Closed
              </label>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <Toggle checked={!!brain.ramadan_enabled} onChange={() => set('ramadan_enabled', !brain.ramadan_enabled)} label="Different hours during Ramadan?" />
          {brain.ramadan_enabled && (
            <div style={{ marginTop: 10 }}>
              <Textarea
                value={brain.ramadan_hours}
                onChange={e => set('ramadan_hours', e.target.value)}
                placeholder="e.g. Sat–Thu 11am–12am, Fri 3pm–1am"
                style={{ minHeight: 60 }}
              />
            </div>
          )}
        </div>
        <div>
          <Toggle checked={!!brain.holiday_closed} onChange={() => set('holiday_closed', !brain.holiday_closed)} label="Closed on UAE public holidays?" />
        </div>
      </div>
    </div>
  )
}

/* ─── Step 5: Booking & Policies ─── */
function StepPolicies({ brain, set }) {
  return (
    <div>
      <Guide text="Ask: How do customers usually book? Do you need a deposit? What happens if someone cancels last minute or doesn't show up?" />
      <Field label="How do customers book?">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            ['whatsapp', '💬 WhatsApp only'],
            ['call',     '📞 Call only'],
            ['both',     '💬 WhatsApp + 📞 Call'],
            ['walkin',   '🚶 Walk-in only'],
            ['all',      '💬 📞 🚶 All methods'],
          ].map(([val, lbl]) => (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', background: brain.booking_type === val ? '#ede9fe' : '#f9fafb', border: `1px solid ${brain.booking_type === val ? '#7c3aed' : '#e5e7eb'}`, borderRadius: 20, padding: '7px 14px' }}>
              <input type="radio" name="booking_type" value={val} checked={brain.booking_type === val} onChange={() => set('booking_type', val)} style={{ display: 'none' }} />
              {lbl}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Booking window" hint="How far in advance can customers book?">
        <SelectField value={brain.booking_window} onChange={e => set('booking_window', e.target.value)}>
          <option value="same_day">Same day only</option>
          <option value="3_days">Up to 3 days ahead</option>
          <option value="1_week">Up to 1 week ahead</option>
          <option value="2_weeks">Up to 2 weeks ahead</option>
          <option value="1_month">Up to 1 month ahead</option>
          <option value="unlimited">Any time</option>
        </SelectField>
      </Field>
      <Field label="Deposit required?">
        <Toggle
          checked={!!brain.deposit_required}
          onChange={() => set('deposit_required', !brain.deposit_required)}
          label="Yes, we require a deposit to confirm the booking"
        />
        {brain.deposit_required && (
          <div style={{ marginTop: 10 }}>
            <Input
              value={brain.deposit_amount}
              onChange={e => set('deposit_amount', e.target.value)}
              placeholder="e.g. AED 50, or 30% of service price"
            />
          </div>
        )}
      </Field>
      <Field label="Cancellation policy">
        <SelectField value={brain.cancellation_notice} onChange={e => set('cancellation_notice', e.target.value)}>
          <option value="none">No cancellation policy</option>
          <option value="2h">Minimum 2 hours notice required</option>
          <option value="4h">Minimum 4 hours notice required</option>
          <option value="24h">Minimum 24 hours notice required</option>
          <option value="48h">Minimum 48 hours notice required</option>
        </SelectField>
      </Field>
      <Field label="No-show policy" hint="What happens if a customer books and doesn't come?">
        <SelectField value={brain.noshow_policy} onChange={e => set('noshow_policy', e.target.value)}>
          <option value="nothing">Nothing — we let it go</option>
          <option value="note">We note it and may decline future bookings</option>
          <option value="charge">We charge the deposit / cancellation fee</option>
          <option value="ban">We block them from future bookings</option>
        </SelectField>
      </Field>
      <Field label="Staff preference">
        <Toggle
          checked={!!brain.staff_request}
          onChange={() => set('staff_request', !brain.staff_request)}
          label="Customers can request a specific staff member"
        />
      </Field>
    </div>
  )
}

/* ─── Step 6: FAQs & Scenarios ─── */
function StepFAQs({ brain, setBrain }) {
  const [faqQ, setFaqQ] = useState('')
  const [faqA, setFaqA] = useState('')
  const [scQ, setScQ] = useState('')
  const [scA, setScA] = useState('')

  const addFAQ = () => {
    if (!faqQ.trim() || !faqA.trim()) return
    setBrain(b => ({ ...b, faqs: [...b.faqs, { q: faqQ.trim(), a: faqA.trim() }] }))
    setFaqQ(''); setFaqA('')
  }

  const addScenario = () => {
    if (!scQ.trim() || !scA.trim()) return
    setBrain(b => ({ ...b, scenarios: [...b.scenarios, { situation: scQ.trim(), response: scA.trim() }] }))
    setScQ(''); setScA('')
  }

  const SUGGESTED = [
    'Do you accept walk-ins?',
    'Do you have parking?',
    'Is it ladies only?',
    'Do you accept credit cards?',
    'Do you have a waiting area?',
  ]

  return (
    <div>
      <Guide text="Ask the owner: What questions do customers ask you most often? Any special situations the bot should know how to handle?" />

      <h4 style={{ fontSize: 14, marginBottom: 8, marginTop: 0 }}>Common Questions (FAQs)</h4>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {SUGGESTED.map((s, i) => (
          <button key={i} onClick={() => setFaqQ(s)} style={{ fontSize: 12, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 20, padding: '4px 10px', cursor: 'pointer', color: '#6b7280' }}>
            + {s}
          </button>
        ))}
      </div>
      {brain.faqs.map((faq, i) => (
        <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <strong style={{ fontSize: 13 }}>Q: {faq.q}</strong>
            <button onClick={() => setBrain(b => ({ ...b, faqs: b.faqs.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>A: {faq.a}</p>
        </div>
      ))}
      <div style={{ marginBottom: 4 }}>
        <Input value={faqQ} onChange={e => setFaqQ(e.target.value)} placeholder="Customer question..." style={{ marginBottom: 6 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Textarea value={faqA} onChange={e => setFaqA(e.target.value)} placeholder="Answer..." style={{ flex: 1, minHeight: 60 }} />
          <button onClick={addFAQ} style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-end' }}>Add</button>
        </div>
      </div>

      <h4 style={{ fontSize: 14, marginBottom: 8, marginTop: 24 }}>Edge Case Scenarios</h4>
      <Guide text="Examples: 'Customer complains about a bad result', 'Customer asks for a service we don't offer', 'Rude or aggressive customer'" />
      {brain.scenarios.map((sc, i) => (
        <div key={i} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <strong style={{ fontSize: 13 }}>📍 {sc.situation}</strong>
            <button onClick={() => setBrain(b => ({ ...b, scenarios: b.scenarios.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>→ {sc.response}</p>
        </div>
      ))}
      <div style={{ marginBottom: 4 }}>
        <Input value={scQ} onChange={e => setScQ(e.target.value)} placeholder="Situation / edge case..." style={{ marginBottom: 6 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Textarea value={scA} onChange={e => setScA(e.target.value)} placeholder="How should the bot handle it..." style={{ flex: 1, minHeight: 60 }} />
          <button onClick={addScenario} style={{ background: '#ea580c', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-end' }}>Add</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 7: AI Personality ─── */
function StepAI({ brain, set }) {
  return (
    <div>
      <Guide text="Ask the owner: What should we call your AI assistant? What personality fits your brand? Which number should the bot forward complicated cases to?" />
      <Field label="AI Assistant Name" hint="This is the name customers will see when they chat. Something friendly and on-brand.">
        <Input value={brain.ai_name} onChange={e => set('ai_name', e.target.value)} placeholder="e.g. Luna, Mia, Nour, Zara, Lina..." />
      </Field>
      <Field label="Personality / Tone">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {AI_TONES.map(t => (
            <label key={t.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', background: brain.ai_tone === t.value ? '#ede9fe' : '#f9fafb', border: `1px solid ${brain.ai_tone === t.value ? '#7c3aed' : '#e5e7eb'}`, borderRadius: 10, padding: 14, transition: '0.15s' }}>
              <input type="radio" name="ai_tone" value={t.value} checked={brain.ai_tone === t.value} onChange={() => set('ai_tone', t.value)} style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.label}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{t.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Handover WhatsApp Number *" hint="When the bot can't help, it directs the customer here. Usually the owner's personal number.">
        <Input value={brain.handover_number} onChange={e => set('handover_number', e.target.value)} placeholder="e.g. +971 50 123 4567" />
      </Field>
      <Field label="Topics the bot should NEVER discuss" hint="Optional. E.g. don't mention competitors, don't accept male customers, don't discuss staff salaries.">
        <Textarea
          value={brain.never_discuss}
          onChange={e => set('never_discuss', e.target.value)}
          placeholder="e.g. Do not mention other salons. Do not accept bookings for male customers. Do not discuss prices for services not on the menu."
          style={{ minHeight: 80 }}
        />
      </Field>
    </div>
  )
}

/* ─── Step 8: Review & Save ─── */
function StepReview({ brain, set, onSave, saving, saved, error }) {
  const hasBasic    = brain.salon_name_en && brain.salon_type && brain.area
  const hasServices = brain.services.length > 0
  const hasHours    = brain.hours && Object.values(brain.hours).some(h => !h.closed)
  const hasAI       = brain.ai_name && brain.handover_number

  const totalItems = brain.services.reduce((n, c) => n + c.items.length, 0)

  const checks = [
    { ok: hasBasic,    label: 'Basic salon info filled in' },
    { ok: hasServices, label: `Services added (${totalItems} items in ${brain.services.length} categories)` },
    { ok: hasHours,    label: 'Opening hours configured' },
    { ok: hasAI,       label: 'AI name and handover number set' },
  ]

  return (
    <div>
      <Guide text="Take a moment to review everything before saving. Once active, the AI Secretary will use this information to answer all customer messages automatically." />

      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Setup Checklist</h4>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, fontSize: 14 }}>
            <span style={{ fontSize: 18 }}>{c.ok ? '✅' : '⚠️'}</span>
            <span style={{ color: c.ok ? '#16a34a' : '#d97706' }}>{c.label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Summary</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontSize: 13 }}>
          <div><span style={{ color: '#9ca3af' }}>Salon:</span> {brain.salon_name_en || '—'} {brain.salon_name_ar ? `(${brain.salon_name_ar})` : ''}</div>
          <div><span style={{ color: '#9ca3af' }}>Type:</span> {brain.salon_type || '—'}</div>
          <div><span style={{ color: '#9ca3af' }}>Area:</span> {brain.area || '—'}</div>
          <div><span style={{ color: '#9ca3af' }}>AI Name:</span> {brain.ai_name || '—'}</div>
          <div><span style={{ color: '#9ca3af' }}>Services:</span> {totalItems} items in {brain.services.length} categories</div>
          <div><span style={{ color: '#9ca3af' }}>Packages:</span> {brain.packages.length}</div>
          <div><span style={{ color: '#9ca3af' }}>FAQs:</span> {brain.faqs.length}</div>
          <div><span style={{ color: '#9ca3af' }}>Tone:</span> {brain.ai_tone}</div>
          <div><span style={{ color: '#9ca3af' }}>Handover:</span> {brain.handover_number || '—'}</div>
          <div><span style={{ color: '#9ca3af' }}>Languages:</span> {brain.languages}</div>
        </div>
      </div>

      <Field label="Activate AI Secretary now?">
        <Toggle
          checked={!!brain.is_active}
          onChange={() => set('is_active', !brain.is_active)}
          label={brain.is_active
            ? '✅ Active — bot will answer customer WhatsApp messages automatically'
            : '⏸ Inactive — save the brain but keep the bot off for now'}
        />
      </Field>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, color: '#dc2626', marginBottom: 12, fontSize: 14 }}>
          ❌ {error}
        </div>
      )}
      {saved && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, color: '#16a34a', marginBottom: 12, fontSize: 14 }}>
          ✅ Business Brain saved! {brain.is_active ? 'The AI Secretary is now live.' : 'Bot is saved but inactive.'}
        </div>
      )}

      <button
        onClick={onSave}
        disabled={saving}
        style={{ width: '100%', background: saving ? '#a78bfa' : '#7c3aed', color: 'white', border: 'none', borderRadius: 10, padding: '14px 24px', fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', transition: '0.2s' }}
      >
        {saving ? '💾 Saving...' : '💾 Save Business Brain'}
      </button>
    </div>
  )
}

/* ─── Main Component ─── */
export default function BrainPage({ businessId }) {
  const [step, setStep]     = useState(1)
  const [brain, setBrain]   = useState(emptyBrain())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState(null)

  /* Load existing brain on mount */
  useEffect(() => {
    authFetch('/api/business-brain')
      .then(r => r.json())
      .then(data => {
        if (data.brain) {
          const b = { ...data.brain }
          if (typeof b.services  === 'string') b.services  = JSON.parse(b.services  || '[]')
          if (typeof b.packages  === 'string') b.packages  = JSON.parse(b.packages  || '[]')
          if (typeof b.hours     === 'string') b.hours     = JSON.parse(b.hours     || '{}')
          if (typeof b.faqs      === 'string') b.faqs      = JSON.parse(b.faqs      || '[]')
          if (typeof b.scenarios === 'string') b.scenarios = JSON.parse(b.scenarios || '[]')
          if (!b.hours || Object.keys(b.hours).length === 0) b.hours = defaultHours()
          b.ramadan_enabled  = !!b.ramadan_enabled
          b.holiday_closed   = b.holiday_closed !== 0 && b.holiday_closed !== false
          b.deposit_required = !!b.deposit_required
          b.staff_request    = b.staff_request !== 0 && b.staff_request !== false
          b.is_active        = !!b.is_active
          setBrain(b)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (key, val) => setBrain(b => ({ ...b, [key]: val }))

  const onSave = async () => {
    setSaving(true); setSaved(false); setError(null)
    try {
      const payload = {
        ...brain,
        services:         JSON.stringify(brain.services),
        packages:         JSON.stringify(brain.packages),
        hours:            JSON.stringify(brain.hours),
        faqs:             JSON.stringify(brain.faqs),
        scenarios:        JSON.stringify(brain.scenarios),
        ramadan_enabled:  brain.ramadan_enabled  ? 1 : 0,
        holiday_closed:   brain.holiday_closed   ? 1 : 0,
        deposit_required: brain.deposit_required ? 1 : 0,
        staff_request:    brain.staff_request    ? 1 : 0,
        is_active:        brain.is_active        ? 1 : 0,
      }
      const r = await authFetch('/api/business-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Save failed')
      setSaved(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9ca3af', fontSize: 16 }}>
      Loading Business Brain...
    </div>
  )

  const stepProps = { brain, set, setBrain }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#1f2937' }}>🧠 Business Brain</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Configure everything the AI Secretary knows about this business</p>
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
        {STEPS.map(s => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: step === s.id ? '#7c3aed' : step > s.id ? '#ede9fe' : '#f3f4f6',
              color: step === s.id ? 'white' : step > s.id ? '#7c3aed' : '#6b7280',
              fontWeight: step === s.id ? 700 : 400,
              fontSize: 12, whiteSpace: 'nowrap', minWidth: 70, transition: '0.15s',
            }}
          >
            <span style={{ fontSize: 18 }}>{step > s.id ? '✓' : s.icon}</span>
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px', color: '#1f2937' }}>
          {STEPS[step - 1].icon} {STEPS[step - 1].title}
        </h2>
        {step === 1 && <StepBasicInfo {...stepProps} />}
        {step === 2 && <StepServices  {...stepProps} />}
        {step === 3 && <StepPackages  {...stepProps} />}
        {step === 4 && <StepHours     {...stepProps} />}
        {step === 5 && <StepPolicies  {...stepProps} />}
        {step === 6 && <StepFAQs      {...stepProps} />}
        {step === 7 && <StepAI        {...stepProps} />}
        {step === 8 && <StepReview    {...stepProps} onSave={onSave} saving={saving} saved={saved} error={error} />}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          style={{ padding: '10px 20px', background: step === 1 ? '#f3f4f6' : 'white', border: '1px solid #d1d5db', borderRadius: 8, cursor: step === 1 ? 'not-allowed' : 'pointer', color: step === 1 ? '#9ca3af' : '#374151', fontWeight: 500 }}
        >
          ← Previous
        </button>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>Step {step} of {STEPS.length}</span>
        {step < STEPS.length ? (
          <button
            onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
            style={{ padding: '10px 24px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={onSave}
            disabled={saving}
            style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}
          >
            {saving ? 'Saving...' : '💾 Save'}
          </button>
        )}
      </div>
    </div>
  )
}
