import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import WatchlistPage from '../page';

// Comprehensive mock for the entire watchlist workflow
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

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
        mediaItem: {
          id: 'media-1',
          tmdbId: 27205,
          title: 'Inception',
          mediaType: 'movie',
          posterPath: '/poster.jpg',
        },
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
    mutateAsync: jest.fn().mockResolvedValue({
      imported: 2,
      skipped: 1,
      failed: 0,
      merged: 1,
      overwritten: 0,
      errors: [],
    }),
    isPending: false,
  }),
  useWatchlistImportPreview: () => ({
    mutateAsync: jest.fn().mockResolvedValue([
      {
        originalTitle: 'Test Movie',
        originalYear: 2023,
        matchCandidates: [
          {
            tmdbId: 123456,
            tmdbType: 'movie',
            title: 'Test Movie',
            year: 2023,
            posterPath: '/test-poster.jpg',
            confidence: 0.95,
          },
        ],
        selectedMatchIndex: null,
        suggestedStatus: 'not_watched',
        rating: 8,
        notes: 'Test note',
        dateAdded: '2024-01-20T00:00:00Z',
        streamingProviders: [],
        hasExistingEntry: false,
        existingEntryId: null,
        shouldSkip: false,
        error: null,
      },
    ]),
    isPending: false,
  }),
  useWatchlistExport: () => ({
    mutateAsync: jest.fn().mockResolvedValue(new Blob(['test data'])),
    isPending: false,
  }),
}));

// Mock file utilities
jest.mock('@/lib/utils/file', () => ({
  isValidImportFile: jest.fn(() => true),
  isValidFileSize: jest.fn(() => true),
  formatFileSize: jest.fn(() => '1.0 KB'),
  downloadBlob: jest.fn(),
  generateTimestampedFilename: jest.fn(() => 'watchlist-2024-01-15.csv'),
}));

// Mock accessibility utilities
jest.mock('@/lib/utils/accessibility', () => ({
  createFocusTrap: jest.fn(() => jest.fn()),
}));

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

describe('Watchlist Page - Complete Import/Export Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides complete import workflow navigation', async () => {
    renderWithQueryClient(<WatchlistPage />);

    // Start with watchlist view
    expect(screen.getByText('Inception')).toBeInTheDocument();

    // Navigate to import
    fireEvent.click(screen.getByText('Import'));
    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();

    // Should show file upload area
    expect(screen.getByText(/Drop your file here/)).toBeInTheDocument();
    expect(screen.getByText(/Supports CSV and JSON files/)).toBeInTheDocument();

    // Navigate to export
    fireEvent.click(screen.getByText('Export'));
    expect(screen.getByText('Export Watchlist')).toBeInTheDocument();

    // Should show export options
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('1 items')).toBeInTheDocument();

    // Return to watchlist
    fireEvent.click(screen.getByText('My Watchlist'));
    expect(screen.getByText('Inception')).toBeInTheDocument();
  });

  it('shows import button in empty watchlist state', () => {
    // Mock empty watchlist
    jest.mocked(require('@/lib/hooks/use-watchlist').useWatchlist).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<WatchlistPage />);

    expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();

    // Click import button
    fireEvent.click(screen.getByText('Import Watchlist'));
    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();
  });

  it('displays correct tab states and styling', () => {
    renderWithQueryClient(<WatchlistPage />);

    const watchlistTab = screen.getByText('My Watchlist').closest('button');
    const importTab = screen.getByText('Import').closest('button');
    const exportTab = screen.getByText('Export').closest('button');

    // Initial state - watchlist active
    expect(watchlistTab).toHaveClass('bg-primary-100');
    expect(importTab).not.toHaveClass('bg-primary-100');
    expect(exportTab).not.toHaveClass('bg-primary-100');

    // Click import - import active
    fireEvent.click(importTab);
    expect(importTab).toHaveClass('bg-primary-100');
    expect(watchlistTab).not.toHaveClass('bg-primary-100');
    expect(exportTab).not.toHaveClass('bg-primary-100');

    // Click export - export active
    fireEvent.click(exportTab);
    expect(exportTab).toHaveClass('bg-primary-100');
    expect(watchlistTab).not.toHaveClass('bg-primary-100');
    expect(importTab).not.toHaveClass('bg-primary-100');
  });

  it('handles file upload simulation', async () => {
    renderWithQueryClient(<WatchlistPage />);

    // Navigate to import
    fireEvent.click(screen.getByText('Import'));

    // Create a mock file
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('button', { name: /Drop your file here/ }).querySelector('input[type="file"]');

    if (fileInput) {
      // Simulate file selection
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      // Should show file info
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
        expect(screen.getByText('1.0 KB')).toBeInTheDocument();
      });

      // Should enable parse button
      const parseButton = screen.getByRole('button', { name: 'Parse File' });
      expect(parseButton).not.toBeDisabled();
    }
  });

  it('handles export workflow', async () => {
    renderWithQueryClient(<WatchlistPage />);

    // Navigate to export
    fireEvent.click(screen.getByText('Export'));

    // Select JSON format
    fireEvent.click(screen.getByText('JSON'));

    // Click export button
    const exportButton = screen.getByRole('button', { name: 'Export Watchlist' });
    fireEvent.click(exportButton);

    // Should show success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Exported 1 items as JSON');
    });
  });

  it('maintains proper component isolation', () => {
    renderWithQueryClient(<WatchlistPage />);

    // Initially should only show watchlist content
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.queryByText('Import Watchlist')).not.toBeInTheDocument();
    expect(screen.queryByText('Export Watchlist')).not.toBeInTheDocument();

    // Switch to import - should only show import content
    fireEvent.click(screen.getByText('Import'));
    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();
    expect(screen.queryByText('Inception')).not.toBeInTheDocument();
    expect(screen.queryByText('Export Watchlist')).not.toBeInTheDocument();

    // Switch to export - should only show export content
    fireEvent.click(screen.getByText('Export'));
    expect(screen.getByText('Export Watchlist')).toBeInTheDocument();
    expect(screen.queryByText('Inception')).not.toBeInTheDocument();
    expect(screen.queryByText('Import Watchlist')).not.toBeInTheDocument();
  });

  it('provides proper error handling feedback', () => {
    renderWithQueryClient(<WatchlistPage />);

    // Navigate to import
    fireEvent.click(screen.getByText('Import'));

    // Should show format guidelines
    expect(screen.getByText('File Format Guidelines:')).toBeInTheDocument();
    expect(screen.getByText(/CSV:/)).toBeInTheDocument();
    expect(screen.getByText(/JSON:/)).toBeInTheDocument();
    expect(screen.getByText(/Status:/)).toBeInTheDocument();
    expect(screen.getByText(/Rating:/)).toBeInTheDocument();
  });

  it('shows correct watchlist counts and summary', () => {
    renderWithQueryClient(<WatchlistPage />);

    // Navigate to export to see summary
    fireEvent.click(screen.getByText('Export'));

    expect(screen.getByText('1 items')).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });
});