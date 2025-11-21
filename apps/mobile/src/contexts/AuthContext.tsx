import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthResponse = async (user: User, accessToken: string) => {
    await AsyncStorage.setItem('accessToken', accessToken);
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    await handleAuthResponse(data.user, data.accessToken);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const data = await authApi.register({ email, password, displayName });
    await handleAuthResponse(data.user, data.accessToken);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      setUser(null);
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
