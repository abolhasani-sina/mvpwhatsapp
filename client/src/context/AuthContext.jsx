import { useState, useCallback, useEffect } from 'react';
import client from '../api/client';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, attempt to refresh to check if we have a valid session
  useEffect(() => {
    client
      .post('/auth/refresh')
      .then((res) => {
        setUser(res.data.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  const logout = useCallback(async () => {
    await client.post('/auth/logout');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
