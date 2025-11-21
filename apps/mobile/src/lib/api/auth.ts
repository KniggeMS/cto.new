import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  message?: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', {
      email: data.email,
      password: data.password,
      name: data.displayName,
    });
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data?.user || response.data;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  async updateProfile(data: { displayName?: string; profile?: { preferences?: { streamingProviders?: string[] } } }): Promise<User> {
    const response = await apiClient.patch('/profile', data);
    return response.data?.user || response.data;
  },
};
