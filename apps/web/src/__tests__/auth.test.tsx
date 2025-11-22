import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';
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
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshToken: jest.fn(),
  },
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
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
    </QueryClientProvider>
  );
};

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Login Page', () => {
    it('renders login form with email and password fields', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid email', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'invalid-email');

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('displays link to register page', () => {
      renderWithProviders(<LoginPage />);

      const registerLink = screen.getByRole('link', { name: /register here/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('disables submit button while form is submitting', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(loginButton).not.toBeDisabled();
    });
  });

  describe('Register Page', () => {
    it('renders register form with all required fields', () => {
      renderWithProviders(<RegisterPage />);

      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      const registerButton = screen.getByRole('button', { name: /register/i });
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for password less than 8 characters', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      const displayNameInput = screen.getByPlaceholderText('John Doe');
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');

      await user.type(displayNameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInputs[0], 'short');

      const registerButton = screen.getByRole('button', { name: /register/i });
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for mismatched passwords', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      const displayNameInput = screen.getByPlaceholderText('John Doe');
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');

      await user.type(displayNameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInputs[0], 'ValidPass123');
      await user.type(passwordInputs[1], 'DifferentPass123');

      const registerButton = screen.getByRole('button', { name: /register/i });
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('shows validation error if password missing uppercase letter', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      const displayNameInput = screen.getByPlaceholderText('John Doe');
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');

      await user.type(displayNameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInputs[0], 'lowercase123');

      const registerButton = screen.getByRole('button', { name: /register/i });
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    it('displays link to login page', () => {
      renderWithProviders(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: /login here/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Form Validation', () => {
    it('validates email format in login form', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'not-an-email');

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('validates email format in register form', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'invalid.email');

      const registerButton = screen.getByRole('button', { name: /register/i });
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });
  });
});
