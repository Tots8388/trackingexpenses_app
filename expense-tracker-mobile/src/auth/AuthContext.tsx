import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';
import { setAuthFailureListener } from '../api/client';
import type { UserInfo } from '../api/endpoints';

type AuthContextType = {
  user: UserInfo | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/me/');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = await SecureStore.getItemAsync('access');
      if (token) {
        await fetchUser();
      } else {
        setLoading(false);
      }
    };
    init();

    // Listen for auth failures (expired refresh token)
    setAuthFailureListener(() => {
      setUser(null);
    });
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await api.post('/token/', { username, password });
    await SecureStore.setItemAsync('access', data.access);
    await SecureStore.setItemAsync('refresh', data.refresh);
    await fetchUser();
  };

  const register = async (username: string, password: string, email: string) => {
    await api.post('/register/', { username, password, email });
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('access');
    await SecureStore.deleteItemAsync('refresh');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
