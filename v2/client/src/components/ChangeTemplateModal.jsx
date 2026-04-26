import { useState } from 'react';
import { TEMPLATES } from '../lib/templates';
import { applyTemplate } from '../lib/api';
import { X, Loader2, ShieldAlert, KeyRound, Mail, CheckCircle2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

function authFetch(url, opts = {}) {
  const token = localStorage.getItem('bd_access_token');
  return fetch(url, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}` } });
}

export default function ChangeTemplateModal({ businessId, businessName, onClose, onApplied }) {
  const [stage, setStage] = useState(1); // 1=warning+pw, 2=code, 3=pick template, 4=confirm
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTpl = TEMPLATES.find(t => t.key === selectedKey);

  async function handlePasswordSubmit() {
    setError('');
    if (!password) return setError('Enter your password');
    setLoading(true);
    try {
      const res = await authFetch(`${API}/auth/request-template-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setStage(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit() {
    setError('');
    if (code.length !== 6) return setError('Enter the 6-digit code');
    setLoading(true);
    try {
      const res = await authFetch(`${API}/auth/verify-template-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Invalid code');
      setStage(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    setError('');
    setLoading(true);
    try {
      const templateData = JSON.parse(JSON.stringify(selectedTpl.load()));
      const templateNames = ['Glow Studio','CarePoint Medical Center','Bella Tavola','Skyline Realty',
        'DriveEasy Rentals','IronCore Fitness','The Grand Meridian','Paws & Whiskers',
        'TutorSpark','AutoFix Pro','LensArt Studio','LexPro Legal','SparkClean','EventCraft','SkyWay Travel'];
      if (businessName) {
        for (const tName of templateNames) {
          if (templateData.welcomeMessage && templateData.welcomeMessage.includes(tName)) {
            templateData.welcomeMessage = templateData.welcomeMessage.replace(tName, businessName);
            break;
          }
        }
      }
      await applyTemplate(businessId, selectedKey, templateData);
      onApplied(selectedKey, selectedTpl.name);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to apply template');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert style={{ width: 18, height: 18, color: '#dc2626' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Change Bot Template</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Step {stage} of 4</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>

          {/* Stage 1  Warning + Password */}
          {stage === 1 && (
            <>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#b91c1c', margin: 0, lineHeight: 1.6 }}>
                   <strong>Warning:</strong> Changing your template will permanently delete all your current bot buttons, menus, and welcome message. This cannot be undone.
                </p>
              </div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                <KeyRound style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />
                Confirm your password to continue
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Your account password"
                autoFocus
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 4 }}
              />
              {error && <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 13, cursor: 'pointer', color: '#64748b' }}>
                  Cancel
                </button>
                <button onClick={handlePasswordSubmit} disabled={loading} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {loading && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
                  {loading ? 'Verifying...' : 'Continue'}
                </button>
              </div>
            </>
          )}

          {/* Stage 2  6-digit code */}
          {stage === 2 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Mail style={{ width: 22, height: 22, color: '#3b82f6' }} />
                </div>
                <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>For your security, we sent a <strong>6-digit code</strong> to your email address.</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>Code expires in 10 minutes.</p>
              <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: 8, padding: '8px 12px', marginTop: 10, fontSize: 12, color: '#854d0e' }}> Don't see it? Check your <strong>spam or junk folder</strong>.</div>
              </div>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
                placeholder="000000"
                autoFocus
                style={{ width: '100%', padding: '14px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 28, fontWeight: 700, letterSpacing: 12, textAlign: 'center', outline: 'none', boxSizing: 'border-box', marginBottom: 4 }}
              />
              {error && <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0', textAlign: 'center' }}>{error}</p>}
              <button onClick={handleCodeSubmit} disabled={loading || code.length !== 6} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (loading || code.length !== 6) ? 0.5 : 1, marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {loading && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </>
          )}

          {/* Stage 3  Pick template */}
          {stage === 3 && (
            <>
              <p style={{ fontSize: 13, color: '#374151', marginBottom: 14 }}>Select the new template for your bot:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16, maxHeight: 320, overflowY: 'auto' }}>
                {TEMPLATES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setSelectedKey(t.key)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '10px 6px', borderRadius: 10, border: selectedKey === t.key ? '2px solid #6366f1' : '1px solid #e2e8f0',
                      background: selectedKey === t.key ? '#eef2ff' : '#f8fafc',
                      cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{t.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: selectedKey === t.key ? '#4338ca' : '#475569', lineHeight: 1.3 }}>{t.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { if (selectedKey) setStage(4); }}
                disabled={!selectedKey}
                style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: selectedKey ? 'pointer' : 'not-allowed', opacity: selectedKey ? 1 : 0.4 }}
              >
                Continue 
              </button>
            </>
          )}

          {/* Stage 4  Final confirm */}
          {stage === 4 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 40 }}>{selectedTpl?.emoji}</span>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '8px 0 4px' }}>{selectedTpl?.name}</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{selectedTpl?.description}</p>
              </div>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#b91c1c', margin: 0 }}>
                  Are you sure? Your current bot setup will be <strong>permanently deleted</strong> and replaced with the {selectedTpl?.name} template.
                </p>
              </div>
              {error && <p style={{ fontSize: 12, color: '#dc2626', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStage(3)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 13, cursor: 'pointer', color: '#64748b' }}>
                  Back
                </button>
                <button onClick={handleApply} disabled={loading} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {loading && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
                  {loading ? 'Applying...' : 'Yes, Change Template'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
