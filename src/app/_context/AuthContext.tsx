'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../_lib/types';
import { getMeApi, logoutApi } from '../_lib/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (updatedUser: AuthUser) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    if (token) {
      logoutApi(token).catch(() => {});
    }
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('otoscan_token');
      sessionStorage.removeItem('otoscan_user');
      localStorage.removeItem('otoscan_token');
      localStorage.removeItem('otoscan_user');
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    const storedToken =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('otoscan_token') || localStorage.getItem('otoscan_token')
        : null;
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await getMeApi(storedToken);
      setUser(userData);
      setToken(storedToken);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('otoscan_user', JSON.stringify(userData));
        sessionStorage.setItem('otoscan_token', storedToken);
      }
    } catch (err) {
      console.warn('[AuthContext] Session validation failed:', err);
      const cachedUser =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('otoscan_user') || localStorage.getItem('otoscan_user')
          : null;
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          setToken(storedToken);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('otoscan_token', newToken);
      sessionStorage.setItem('otoscan_user', JSON.stringify(newUser));
      // Clear legacy localStorage to ensure browser close session behavior
      localStorage.removeItem('otoscan_token');
      localStorage.removeItem('otoscan_user');
    }
  };

  const updateUser = (updatedUser: AuthUser) => {
    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('otoscan_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
