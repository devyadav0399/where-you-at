import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('wya_token');
    if (!token) { setLoading(false); return; }
    api.get('/api/auth/me')
      .then(({ data }) => { setUser(data.user); connectSocket(); })
      .catch(() => localStorage.removeItem('wya_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('wya_token', data.token);
    setUser(data.user);
    connectSocket();
    return data.user;
  }

  function logout() {
    localStorage.removeItem('wya_token');
    setUser(null);
    disconnectSocket();
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
