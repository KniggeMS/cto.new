import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import WatchlistPage from '../page';

// Mock the toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock the hooks
jest.mock('@/lib/hooks/use-watchlist', () => ({
  useWatchlist: () => ({
    data: [
      {
        id: '1',
        tmdbId: 27205,
        title: 'Inception',
        mediaType: 'movie',
        status: 'completed',
        rating: 9,
        notes: 'Amazing movie',
        dateAdded: '2024-01-15T00:00:00Z',
        dateUpdated: '2024-01-15T00:00:00Z',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      },
      {
        id: '2',
        tmdbId: 603,
        title: 'The Matrix',
        mediaType: 'movie',
        status: 'watching',
        rating: 8,
        notes: null,
        dateAdded: '2024-01-10T00:00:00Z',
        dateUpdated: '2024-01-10T00:00:00Z',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
      },
    ],
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

// Mock window.location.href
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Watchlist Page Import/Export Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders import/export navigation tabs', () => {
    renderWithQueryClient(<WatchlistPage />);

    expect(screen.getByText('My Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('shows import tab when clicked', async () => {
    renderWithQueryClient(<WatchlistPage />);

    const importTab = screen.getByText('Import');
    fireEvent.click(importTab);

    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();
    expect(screen.getByText(/Import your watchlist from a CSV or JSON file/)).toBeInTheDocument();
  });

  it('shows export tab when clicked', async () => {
    renderWithQueryClient(<WatchlistPage />);

    const exportTab = screen.getByText('Export');
    fireEvent.click(exportTab);

    expect(screen.getByText('Export Watchlist')).toBeInTheDocument();
    expect(screen.getByText(/Download your watchlist for backup/)).toBeInTheDocument();
  });

  it('returns to watchlist tab when clicking My Watchlist', async () => {
    renderWithQueryClient(<WatchlistPage />);

    // Click Import tab
    const importTab = screen.getByText('Import');
    fireEvent.click(importTab);

    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();

    // Click back to My Watchlist
    const watchlistTab = screen.getByText('My Watchlist');
    fireEvent.click(watchlistTab);

    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
  });

  it('shows import button in empty state', () => {
    // Mock empty watchlist
    jest.mocked(require('@/lib/hooks/use-watchlist').useWatchlist).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<WatchlistPage />);

    expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();
  });

  it('highlights active tab correctly', () => {
    renderWithQueryClient(<WatchlistPage />);

    // Initially My Watchlist should be active
    const watchlistTab = screen.getByText('My Watchlist').closest('button');
    expect(watchlistTab).toHaveClass('bg-primary-100');

    // Click Import tab
    const importTab = screen.getByText('Import').closest('button');
    fireEvent.click(importTab);

    expect(importTab).toHaveClass('bg-primary-100');
    expect(watchlistTab).not.toHaveClass('bg-primary-100');

    // Click Export tab
    const exportTab = screen.getByText('Export').closest('button');
    fireEvent.click(exportTab);

    expect(exportTab).toHaveClass('bg-primary-100');
    expect(importTab).not.toHaveClass('bg-primary-100');
  });

  it('shows watchlist content when My Watchlist tab is active', () => {
    renderWithQueryClient(<WatchlistPage />);

    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('watching')).toBeInTheDocument();
  });

  it('does not show import/export content when watchlist tab is active', () => {
    renderWithQueryClient(<WatchlistPage />);

    expect(screen.queryByText('Import Watchlist')).not.toBeInTheDocument();
    expect(screen.queryByText('Export Watchlist')).not.toBeInTheDocument();
  });

  it('shows import panel when import tab is active', () => {
    renderWithQueryClient(<WatchlistPage />);

    const importTab = screen.getByText('Import');
    fireEvent.click(importTab);

    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();
    expect(screen.getByText(/Drop your file here/)).toBeInTheDocument();
    expect(screen.getByText(/Supports CSV and JSON files/)).toBeInTheDocument();
  });

  it('shows export panel when export tab is active', () => {
    renderWithQueryClient(<WatchlistPage />);

    const exportTab = screen.getByText('Export');
    fireEvent.click(exportTab);

    expect(screen.getByText('Export Watchlist')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('preserves tab state during navigation', async () => {
    renderWithQueryClient(<WatchlistPage />);

    // Click Import tab
    const importTab = screen.getByText('Import');
    fireEvent.click(importTab);

    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();

    // Click Export tab
    const exportTab = screen.getByText('Export');
    fireEvent.click(exportTab);

    expect(screen.getByText('Export Watchlist')).toBeInTheDocument();
    expect(screen.queryByText('Import Watchlist')).not.toBeInTheDocument();

    // Click back to Import tab
    fireEvent.click(importTab);

    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();
    expect(screen.queryByText('Export Watchlist')).not.toBeInTheDocument();
  });
});