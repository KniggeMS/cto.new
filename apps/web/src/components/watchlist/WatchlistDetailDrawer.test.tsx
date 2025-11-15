import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WatchlistDetailDrawer } from '../WatchlistDetailDrawer';
import { useUpdateWatchlistEntry, useRemoveFromWatchlist } from '@/lib/hooks/use-watchlist';
import type { WatchlistEntry } from '@/lib/api/watchlist';

// Mock the hooks
jest.mock('@/lib/hooks/use-watchlist');
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Save: () => <div data-testid="save-icon">Save</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const mockUseUpdateWatchlistEntry = useUpdateWatchlistEntry as jest.MockedFunction<typeof useUpdateWatchlistEntry>;
const mockUseRemoveFromWatchlist = useRemoveFromWatchlist as jest.MockedFunction<typeof useRemoveFromWatchlist>;

const mockEntry: WatchlistEntry = {
  id: '1',
  mediaItemId: 'media-1',
  status: 'watching',
  rating: 8,
  notes: 'Great movie!',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  dateAdded: '2024-01-01T00:00:00Z',
  dateUpdated: '2024-01-01T00:00:00Z',
  mediaItem: {
    id: 'media-1',
    tmdbId: 123,
    title: 'Test Movie',
    mediaType: 'movie',
    posterPath: '/test-poster.jpg',
    releaseDate: '2024-01-01',
    description: 'A great test movie',
  },
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('WatchlistDetailDrawer', () => {
  const mockOnClose = jest.fn();
  const mockUpdateMutate = jest.fn();
  const mockRemoveMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUpdateWatchlistEntry.mockReturnValue({
      mutateAsync: mockUpdateMutate,
      isPending: false,
    } as any);

    mockUseRemoveFromWatchlist.mockReturnValue({
      mutateAsync: mockRemoveMutate,
      isPending: false,
    } as any);
  });

  it('does not render when closed', () => {
    renderWithProviders(
      <WatchlistDetailDrawer
        isOpen={false}
        onClose={mockOnClose}
        entry={mockEntry}
      />
    );

    expect(screen.queryByText('Test Movie')).not.toBeInTheDocument();
  });

  it('renders when open with entry details', () => {
    renderWithProviders(
      <WatchlistDetailDrawer
        isOpen={true}
        onClose={mockOnClose}
        entry={mockEntry}
      />
    );

    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('Manage your watchlist entry for Test Movie')).toBeInTheDocument();
    expect(screen.getByDisplayValue('watching')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Great movie!')).toBeInTheDocument();
  });

  it('closes when X button is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <WatchlistDetailDrawer
        isOpen={true}
        onClose={mockOnClose}
        entry={mockEntry}
      />
    );

    const closeButton = screen.getByTestId('x-icon');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <WatchlistDetailDrawer
        isOpen={true}
        onClose={mockOnClose}
        entry={mockEntry}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('submits form with updated data', async () => {
    const user = userEvent.setup();
    mockUpdateMutate.mockResolvedValue(undefined);
    
    renderWithProviders(
      <WatchlistDetailDrawer
        isOpen={true}
        onClose={mockOnClose}
        entry={mockEntry}
      />
    );

    // Change status
    const statusSelect = screen.getByDisplayValue('watching');
    await user.selectOptions(statusSelect, 'not_watched');

    // Change notes
    const notesTextarea = screen.getByDisplayValue('Great movie!');
    await user.clear(notesTextarea);
    await user.type(notesTextarea, 'Updated notes');

    // Submit form
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: '1',
        data: {
          status: 'not_watched',
          notes: 'Updated notes',
        },
      });
    });
  });

  it('removes entry when delete button is clicked', async () => {
    const user = userEvent.setup();
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    mockRemoveMutate.mockResolvedValue(undefined);
    
    renderWithProviders(
      <WatchlistDetailDrawer
        isOpen={true}
        onClose={mockOnClose}
        entry={mockEntry}
      />
    );

    const deleteButton = screen.getByTestId('trash-icon');
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to remove this from your watchlist?'
    );

    await waitFor(() => {
      expect(mockRemoveMutate).toHaveBeenCalledWith('1');
    });
  });

  it('does not remove entry when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);
    
    renderWithProviders(
      <WatchlistDetailDrawer
        isOpen={true}
        onClose={mockOnClose}
        entry={mockEntry}
      />
    );

    const deleteButton = screen.getByTestId('trash-icon');
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockRemoveMutate).not.toHaveBeenCalled();
  });

  it('shows episode progress fields for TV shows', () => {
    const tvEntry = {
      ...mockEntry,
      mediaItem: { ...mockEntry.mediaItem, mediaType: 'tv' as const }
    };
    
    renderWithProviders(
      <WatchlistDetailDrawer
        isOpen={true}
        onClose={mockOnClose}
        entry={tvEntry}
      />
    );

    expect(screen.getByLabelText('Episodes Watched')).toBeInTheDocument();
    expect(screen.getByLabelText('Total Episodes')).toBeInTheDocument();
  });

  it('does not show episode progress fields for movies', () => {
    renderWithProviders(
      <WatchlistDetailDrawer
        isOpen={true}
        onClose={mockOnClose}
        entry={mockEntry}
      />
    );

    expect(screen.queryByLabelText('Episodes Watched')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Total Episodes')).not.toBeInTheDocument();
  });

  it('disables save button when form is not dirty', () => {
    renderWithProviders(
      <WatchlistDetailDrawer
        isOpen={true}
        onClose={mockOnClose}
        entry={mockEntry}
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when form is dirty', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <WatchlistDetailDrawer
        isOpen={true}
        onClose={mockOnClose}
        entry={mockEntry}
      />
    );

    // Change status to make form dirty
    const statusSelect = screen.getByDisplayValue('watching');
    await user.selectOptions(statusSelect, 'completed');

    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    expect(saveButton).not.toBeDisabled();
  });
});