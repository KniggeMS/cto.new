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
  profile?: {
    bio?: string;
    preferences?: {
      streamingProviders?: string[];
    };
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  message?: string;
}

export interface OnboardingData {
  displayName?: string;
  streamingProviders?: string[];
}
