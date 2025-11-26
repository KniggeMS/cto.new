import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WatchlistPage } from '@/app/watchlist/page';
import { AuthProvider } from '@/lib/context/auth-context';

// Mock API responses for demo data
const mockWatchlistData = [
  {
    id: '1',
    userId: '1',
    mediaItem: {
      id: '1',
      tmdbId: 550,
      title: 'Fight Club',
      tmdbType: 'movie',
      description: 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club...',
      posterPath: '/p64JHd3bGjH8qSEp0gyS1BFrP4V.jpg',
      releaseDate: '1999-10-15',
      rating: 8.8,
      genres: ['Drama', 'Thriller'],
    },
    status: 'completed',
    rating: 9,
    notes: 'Mind-bending masterpiece! The twist ending still gets me every time.',
    watchedAt: '2024-01-15',
  },
  {
    id: '2',
    userId: '1',
    mediaItem: {
      id: '2',
      tmdbId: 1399,
      title: 'Breaking Bad',
      tmdbType: 'tv',
      description: 'A high school chemistry teacher diagnosed with inoperable lung cancer...',
      posterPath: '/ggFHVNvVYapdOayUS6XRRtSaZc4.jpg',
      releaseDate: '2008-01-20',
      rating: 9.5,
      genres: ['Crime', 'Drama', 'Thriller'],
    },
    status: 'watching',
    notes: 'Currently on Season 4. The tension is unreal!',
    progress: 'S4E8',
  },
  {
    id: '3',
    userId: '1',
    mediaItem: {
      id: '3',
      tmdbId: 157336,
      title: 'Interstellar',
      tmdbType: 'movie',
      description: 'A team of explorers travel through a wormhole in space...',
      posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      releaseDate: '2014-11-07',
      rating: 8.6,
      genres: ['Adventure', 'Drama', 'Science Fiction'],
    },
    status: 'not_watched',
    notes: 'Heard amazing things about the science and emotional depth.',
  },
];

// Mock auth context
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider
      value={{
        isAuthenticated: true,
        user: {
          id: '1',
          email: 'alice@example.com',
          name: 'Alice Johnson',
          displayName: 'Alice',
        },
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

// Mock React Query
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

// Mock hooks
jest.mock('@/lib/hooks/use-watchlist', () => ({
  useWatchlist: () => ({
    data: mockWatchlistData,
    isLoading: false,
    error: null,
  }),
  useRemoveFromWatchlist: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useConfirmWatchlistImport: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('@/lib/utils/watchlist-utils', () => ({
  filterAndSortWatchlist: (data: any, filters: any) => data,
  groupWatchlistByStatus: (data: any) => ({
    not_watched: data.filter((item: any) => item.status === 'not_watched'),
    watching: data.filter((item: any) => item.status === 'watching'),
    completed: data.filter((item: any) => item.status === 'completed'),
  }),
}));

describe('Watchlist Page Visual Regression', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MockAuthProvider>
          {component}
        </MockAuthProvider>
      </QueryClientProvider>
    );
  };

  it('renders watchlist with demo data correctly', () => {
    renderWithProviders(<WatchlistPage />);

    // Check page title and navigation tabs
    expect(screen.getByText('My Watchlist')).toBeInTheDocument();
    expect(screen.getByText('My Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();

    // Check status groups
    expect(screen.getByText('Not Watched')).toBeInTheDocument();
    expect(screen.getByText('Currently Watching')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();

    // Check demo media items
    expect(screen.getByText('Fight Club')).toBeInTheDocument();
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText('Interstellar')).toBeInTheDocument();

    // Check media details
    expect(screen.getByText(/Mind-bending masterpiece/)).toBeInTheDocument();
    expect(screen.getByText(/Currently on Season 4/)).toBeInTheDocument();
    expect(screen.getByText(/Heard amazing things/)).toBeInTheDocument();

    // Check ratings
    expect(screen.getByText('9/10')).toBeInTheDocument();
    expect(screen.getByText('S4E8')).toBeInTheDocument();
  });

  it('displays empty state when no watchlist items', () => {
    // Override mock to return empty data
    jest.doMock('@/lib/hooks/use-watchlist', () => ({
      useWatchlist: () => ({
        data: [],
        isLoading: false,
        error: null,
      }),
      useRemoveFromWatchlist: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
      }),
      useConfirmWatchlistImport: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
      }),
    }));

    renderWithProviders(<WatchlistPage />);

    expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
    expect(screen.getByText(/Start by searching for movies/)).toBeInTheDocument();
    expect(screen.getByText('Browse Content')).toBeInTheDocument();
    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();
  });

  it('handles responsive layout correctly', () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    renderWithProviders(<WatchlistPage />);

    // Check that content is properly structured for desktop
    const filterControls = screen.getByRole('group', { name: /filter/i });
    expect(filterControls).toBeInTheDocument();

    const watchlistGroups = screen.getAllByRole('group');
    expect(watchlistGroups.length).toBeGreaterThan(0);
  });

  it('displays import/export navigation correctly', () => {
    renderWithProviders(<WatchlistPage />);

    // Check navigation tabs
    const watchlistTab = screen.getByRole('button', { name: /my watchlist/i });
    const importTab = screen.getByRole('button', { name: /import/i });
    const exportTab = screen.getByRole('button', { name: /export/i });

    expect(watchlistTab).toBeInTheDocument();
    expect(importTab).toBeInTheDocument();
    expect(exportTab).toBeInTheDocument();

    // Watchlist tab should be active by default
    expect(watchlistTab).toHaveClass('bg-primary-100', 'text-primary-700');
  });

  it('shows loading state correctly', () => {
    // Override mock to show loading
    jest.doMock('@/lib/hooks/use-watchlist', () => ({
      useWatchlist: () => ({
        data: null,
        isLoading: true,
        error: null,
      }),
      useRemoveFromWatchlist: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
      }),
      useConfirmWatchlistImport: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
      }),
    }));

    renderWithProviders(<WatchlistPage />);

    expect(screen.getByText('Loading watchlist...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('displays error state correctly', () => {
    // Override mock to show error
    jest.doMock('@/lib/hooks/use-watchlist', () => ({
      useWatchlist: () => ({
        data: null,
        isLoading: false,
        error: new Error('Failed to load watchlist'),
      }),
      useRemoveFromWatchlist: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
      }),
      useConfirmWatchlistImport: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
      }),
    }));

    renderWithProviders(<WatchlistPage />);

    expect(screen.getByText('Failed to load watchlist. Please try again.')).toBeInTheDocument();
  });
});

import type { ReactElement } from 'react';