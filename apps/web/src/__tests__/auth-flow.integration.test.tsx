import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';
import { AuthProvider } from '@/lib/context/auth-context';
import { authApi } from '@/lib/api/auth';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock react-hot-toast
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: mockToastSuccess,
    error: mockToastError,
    loading: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock API module
jest.mock('@/lib/api/auth');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{component}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockPush.mockClear();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  describe('Successful Login Flow', () => {
    it('completes successful login and redirects to watchlist', async () => {
      const user = userEvent.setup();

      const mockLoginResponse = {
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
        },
        accessToken: 'access-token-123',
      };

      (authApi.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123',
        });
      });

      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBe('access-token-123');
        expect(mockPush).toHaveBeenCalledWith('/watchlist');
        expect(mockToastSuccess).toHaveBeenCalledWith('Welcome back!');
      });
    });

    it('handles login error and displays error message', async () => {
      const user = userEvent.setup();

      const loginError = new Error('Invalid credentials');
      (loginError as any).response = {
        data: {
          error: 'Invalid email or password',
        },
      };

      (authApi.login as jest.Mock).mockRejectedValue(loginError);

      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Invalid email or password');
        expect(mockPush).not.toHaveBeenCalledWith('/watchlist');
      });
    });
  });

  describe('Successful Register Flow', () => {
    it('completes successful registration and redirects to watchlist', async () => {
      const user = userEvent.setup();

      const mockRegisterResponse = {
        user: {
          id: '456',
          email: 'newuser@example.com',
          name: 'New User',
        },
        accessToken: 'access-token-456',
      };

      (authApi.register as jest.Mock).mockResolvedValue(mockRegisterResponse);

      renderWithProviders(<RegisterPage />);

      const displayNameInput = screen.getByPlaceholderText('John Doe');
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const registerButton = screen.getByRole('button', { name: /register/i });

      await user.type(displayNameInput, 'New User');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInputs[0], 'SecurePass123');
      await user.type(passwordInputs[1], 'SecurePass123');
      await user.click(registerButton);

      await waitFor(() => {
        expect(authApi.register).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'SecurePass123',
          name: 'New User',
        });
      });

      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBe('access-token-456');
        expect(mockPush).toHaveBeenCalledWith('/watchlist');
        expect(mockToastSuccess).toHaveBeenCalledWith('Account created successfully!');
      });
    });

    it('handles registration error for duplicate email', async () => {
      const user = userEvent.setup();

      const registerError = new Error('Email already exists');
      (registerError as any).response = {
        data: {
          error: 'User with this email already exists',
        },
      };

      (authApi.register as jest.Mock).mockRejectedValue(registerError);

      renderWithProviders(<RegisterPage />);

      const displayNameInput = screen.getByPlaceholderText('John Doe');
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const registerButton = screen.getByRole('button', { name: /register/i });

      await user.type(displayNameInput, 'New User');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInputs[0], 'SecurePass123');
      await user.type(passwordInputs[1], 'SecurePass123');
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('User with this email already exists');
        expect(mockPush).not.toHaveBeenCalledWith('/watchlist');
      });
    });
  });

  describe('Authentication Persistence', () => {
    it('restores user session from localStorage on page load', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      localStorage.setItem('accessToken', 'persisted-token');

      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      renderWithProviders(<LoginPage />);

      await waitFor(() => {
        expect(authApi.getCurrentUser).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/watchlist');
      });
    });

    it('clears tokens and redirects to login if persisted token is invalid', async () => {
      localStorage.setItem('accessToken', 'invalid-token');

      (authApi.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      renderWithProviders(<LoginPage />);

      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBeNull();
      });
    });
  });

  describe('Form Validation Prevents Invalid Submissions', () => {
    it('prevents login submission with invalid email', async () => {
      const user = userEvent.setup();

      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'Password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(authApi.login).not.toHaveBeenCalled();
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('prevents register submission with weak password', async () => {
      const user = userEvent.setup();

      renderWithProviders(<RegisterPage />);

      const displayNameInput = screen.getByPlaceholderText('John Doe');
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const registerButton = screen.getByRole('button', { name: /register/i });

      await user.type(displayNameInput, 'New User');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInputs[0], 'weakpass');
      await user.type(passwordInputs[1], 'weakpass');
      await user.click(registerButton);

      await waitFor(() => {
        expect(authApi.register).not.toHaveBeenCalled();
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated User Redirect', () => {
    it('redirects authenticated user away from login page', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      localStorage.setItem('accessToken', 'valid-token');

      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      renderWithProviders(<LoginPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/watchlist');
      });
    });

    it('redirects authenticated user away from register page', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      localStorage.setItem('accessToken', 'valid-token');

      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      renderWithProviders(<RegisterPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/watchlist');
      });
    });
  });
});
