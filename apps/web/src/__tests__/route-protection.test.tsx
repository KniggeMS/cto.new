import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/context/auth-context';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock API
const mockGetCurrentUser = jest.fn();
jest.mock('@/lib/api/auth', () => ({
  authApi: {
    getCurrentUser: jest.fn(() => mockGetCurrentUser()),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
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

describe('Route Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockPush.mockClear();
  });

  describe('ProtectedRoute Component', () => {
    it('shows loading spinner while checking authentication', () => {
      mockGetCurrentUser.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should show spinner while loading
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('redirects to login when user is not authenticated', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'));

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('renders content when user is authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      });

      localStorage.setItem('accessToken', 'test-token');

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication State Management', () => {
    it('persists authentication state across renders', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      });

      localStorage.setItem('accessToken', 'test-token');

      const { rerender } = renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      // Rerender should keep the component visible
      rerender(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </AuthProvider>
        </QueryClientProvider>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('clears auth state when token is removed', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      });

      localStorage.setItem('accessToken', 'test-token');

      const { rerender } = renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      // Remove token
      localStorage.removeItem('accessToken');
      mockGetCurrentUser.mockRejectedValue(new Error('Not authenticated'));

      rerender(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Unauthenticated Access', () => {
    it('prevents access to protected routes without authentication', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Unauthorized'));
      localStorage.clear();

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
});
