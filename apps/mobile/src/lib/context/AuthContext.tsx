import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { SecureStorage } from '../storage/SecureStorage';
import { User } from '../api/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (displayName?: string, streamingProviders?: string[]) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = await SecureStorage.getAccessToken();
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
          checkOnboardingStatus(userData);
        } catch (error) {
          await SecureStorage.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const checkOnboardingStatus = (userData: User) => {
    const hasDisplayName = !!userData.displayName || !!userData.name;
    setNeedsOnboarding(!hasDisplayName);
  };

  const handleAuthResponse = async (user: User, accessToken: string, refreshToken?: string) => {
    await SecureStorage.setAccessToken(accessToken);
    if (refreshToken) {
      await SecureStorage.setRefreshToken(refreshToken);
    }
    await SecureStorage.setUser(JSON.stringify(user));
    setUser(user);
    checkOnboardingStatus(user);
  };

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    await handleAuthResponse(data.user, data.accessToken, data.refreshToken);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const data = await authApi.register({ email, password, displayName });
    await handleAuthResponse(data.user, data.accessToken, data.refreshToken);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await SecureStorage.clearTokens();
      setUser(null);
      setNeedsOnboarding(false);
    }
  };

  const completeOnboarding = async (displayName?: string, streamingProviders?: string[]) => {
    const updateData: Partial<User> = {};

    if (displayName) {
      updateData.name = displayName;
      updateData.displayName = displayName;
    }

    if (streamingProviders && streamingProviders.length > 0) {
      updateData.profile = {
        preferences: {
          streamingProviders,
        },
      };
    }

    const updatedUser = await authApi.updateProfile(updateData);
    setUser(updatedUser);
    setNeedsOnboarding(false);
    await SecureStorage.setUser(JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      await SecureStorage.setUser(JSON.stringify(userData));
      checkOnboardingStatus(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        needsOnboarding,
        login,
        register,
        logout,
        completeOnboarding,
        refreshUser,
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
