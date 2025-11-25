import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/context/auth-context';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock API
jest.mock('@/lib/api/auth', () => ({
  authApi: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

// Mock API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

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
    </QueryClientProvider>,
  );
};

describe('Updated Auth Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockPush.mockClear();
  });

  it('does not clear tokens on getCurrentUser failure', async () => {
    const { authApi } = require('@/lib/api/auth');
    
    localStorage.setItem('accessToken', 'test-token');
    authApi.getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

    renderWithProviders(<div>Test</div>);

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('test-token');
    });
  });

  it('removes only accessToken on logout', async () => {
    const { authApi } = require('@/lib/api/auth');
    const { useAuth } = require('@/lib/context/auth-context');
    
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('refreshToken', 'refresh-token');
    authApi.logout.mockResolvedValue({});

    const TestComponent = () => {
      const { logout } = useAuth();
      return <button onClick={logout}>Logout</button>;
    };

    renderWithProviders(<TestComponent />);

    const logoutButton = screen.getByText('Logout');
    logoutButton.click();

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token'); // Should not be touched
    });
  });
});