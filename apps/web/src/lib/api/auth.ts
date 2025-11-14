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

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },
};
