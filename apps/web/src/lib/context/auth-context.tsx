'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocaleNavigation } from '@/lib/hooks/use-locale';
import { authApi, type User } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useLocaleNavigation();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Don't clear tokens on 404 or other errors - let refresh handle it
          console.warn('Failed to fetch current user:', error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleAuthResponse = (user: User, accessToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    handleAuthResponse(data.user, data.accessToken);
    push('/watchlist');
  };

  const register = async (email: string, password: string, displayName: string) => {
    const data = await authApi.register({ email, password, displayName });
    handleAuthResponse(data.user, data.accessToken);
    push('/watchlist');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
