import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('wa_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  function login(email, password) {
    const u = { email, name: email.split('@')[0], id: Date.now() };
    localStorage.setItem('wa_user', JSON.stringify(u));
    setUser(u);
  }

  function register(email, password, name) {
    const u = { email, name: name || email.split('@')[0], id: Date.now() };
    localStorage.setItem('wa_user', JSON.stringify(u));
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('wa_user');
    setUser(null);
  }

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
