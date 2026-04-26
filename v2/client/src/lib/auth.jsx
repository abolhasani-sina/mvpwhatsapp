import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
const AuthContext = createContext(null);

// ── Token helpers ──
function getTokens() {
  return {
    accessToken: localStorage.getItem('bd_access_token'),
  };
}

function setTokens(accessToken) {
  localStorage.setItem('bd_access_token', accessToken);
}

function clearTokens() {
  localStorage.removeItem('bd_access_token');
  localStorage.removeItem('bd_user');
}

// Refresh the access token using the refresh token
async function refreshAccessToken() {
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    setTokens(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

// ── Authenticated fetch with auto-refresh ──
export async function authFetch(url, options = {}) {
  let { accessToken } = getTokens();

  // If no access token, try refreshing before giving up
  if (!accessToken) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      clearTokens();
      window.dispatchEvent(new Event('auth:logout'));
      throw new Error('Not authenticated');
    }
  }

  const headers = { ...options.headers, Authorization: `Bearer ${accessToken}` };
  let res = await fetch(url, { ...options, headers });

  // If token expired, try refresh
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      clearTokens();
      window.dispatchEvent(new Event('auth:logout'));
      throw new Error('Session expired');
    }
    headers.Authorization = `Bearer ${newToken}`;
    res = await fetch(url, { ...options, headers });
  }

  return res;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('bd_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        clearTokens();
      }
    }
    setLoading(false);

    // Refresh user from /me in the background so role / suspension changes
    // propagate without requiring a re-login.
    (async () => {
      try {
        const res = await authFetch(`${API}/auth/me`);
        if (res.ok) {
          const json = await res.json();
          const fresh = json.user || json.data;
          if (fresh) {
            localStorage.setItem('bd_user', JSON.stringify(fresh));
            setUser(fresh);
          }
        }
      } catch { /* ignore — already logged out by authFetch on 401 */ }
    })();

    // Listen for forced logout from authFetch
    const handleLogout = () => { setUser(null); };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    setTokens(data.accessToken);
    localStorage.setItem('bd_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    setTokens(data.accessToken);
    localStorage.setItem('bd_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      const { accessToken } = getTokens();
      if (accessToken) {
        await fetch(`${API}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch { /* ignore */ }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
