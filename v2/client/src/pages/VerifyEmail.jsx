import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

export default function VerifyEmail({ onNavigate }) {
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }
    fetch(`${API}/auth/verify-email?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          // Update localStorage user
          const stored = localStorage.getItem('bd_user');
          if (stored) {
            try {
              const u = JSON.parse(stored);
              u.email_verified = 1;
              localStorage.setItem('bd_user', JSON.stringify(u));
            } catch {}
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => { setStatus('error'); setMessage('Network error. Please try again.'); });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 48, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ color: '#6c3fff', marginBottom: 8 }}>NabzChat</h1>
        {status === 'verifying' && <p style={{ color: '#666' }}>Verifying your email...</p>}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}></div>
            <h2 style={{ color: '#059669' }}>Email Verified!</h2>
            <p style={{ color: '#666' }}>Your email has been verified successfully.</p>
            <button onClick={() => onNavigate('login')} style={{
              marginTop: 24, background: '#6c3fff', color: '#fff', border: 'none',
              borderRadius: 8, padding: '12px 32px', cursor: 'pointer', fontWeight: 600, fontSize: 16,
            }}>Go to Login</button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}></div>
            <h2 style={{ color: '#dc2626' }}>Verification Failed</h2>
            <p style={{ color: '#666' }}>{message}</p>
            <button onClick={() => onNavigate('login')} style={{
              marginTop: 24, background: '#6c3fff', color: '#fff', border: 'none',
              borderRadius: 8, padding: '12px 32px', cursor: 'pointer', fontWeight: 600, fontSize: 16,
            }}>Go to Login</button>
          </>
        )}
      </div>
    </div>
  );
}
