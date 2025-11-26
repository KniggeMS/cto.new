import { render, screen } from '@testing-library/react';
import { Navigation } from '@/components/layout/Navigation';
import { AuthProvider } from '@/lib/context/auth-context';

// Mock user for testing
const mockUser = {
  id: '1',
  email: 'alice@example.com',
  name: 'Alice Johnson',
  displayName: 'Alice',
};

// Mock auth context
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider
      value={{
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        loading: false,
      }}
    >
      {children}
    </AuthProvider>
  );
};

describe('Navigation Component Visual Regression', () => {
  it('renders navigation correctly on desktop', () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(
      <MockAuthProvider>
        <Navigation />
      </MockAuthProvider>
    );

    // Check main navigation elements
    expect(screen.getByText('InFocus')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText(/alice@example.com|Alice/)).toBeInTheDocument();

    // Check that mobile menu button is not visible on desktop
    expect(screen.queryByLabelText('Open main menu')).not.toBeInTheDocument();
  });

  it('renders navigation correctly on mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640,
    });

    render(
      <MockAuthProvider>
        <Navigation />
      </MockAuthProvider>
    );

    // Check main navigation elements
    expect(screen.getByText('InFocus')).toBeInTheDocument();
    expect(screen.getByLabelText('Open main menu')).toBeInTheDocument();

    // Mobile menu should be closed by default
    expect(screen.queryByText('Watchlist')).not.toBeInTheDocument();
    expect(screen.queryByText('Search')).not.toBeInTheDocument();
    expect(screen.queryByText('Family')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();

    // Mobile user info should be visible
    expect(screen.getByText(/Alice|alice@example.com/)).toBeInTheDocument();
  });

  it('opens mobile menu when clicked', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640,
    });

    render(
      <MockAuthProvider>
        <Navigation />
      </MockAuthProvider>
    );

    // Click mobile menu button
    const menuButton = screen.getByLabelText('Open main menu');
    await userEvent.click(menuButton);

    // Mobile menu items should now be visible
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();

    // Close button should be visible
    expect(screen.getByLabelText('Close main menu')).toBeInTheDocument();
  });

  it('displays user information correctly', () => {
    render(
      <MockAuthProvider>
        <Navigation />
      </MockAuthProvider>
    );

    // Check user info is displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    // Mock current path
    jest.mock('next/navigation', () => ({
      usePathname: () => '/watchlist',
    }));

    render(
      <MockAuthProvider>
        <Navigation />
      </MockAuthProvider>
    );

    const watchlistLink = screen.getByText('Watchlist');
    expect(watchlistLink).toHaveClass('bg-primary-100', 'text-primary-700');
  });
});

// Helper for user interactions
import userEvent from '@testing-library/user-event';