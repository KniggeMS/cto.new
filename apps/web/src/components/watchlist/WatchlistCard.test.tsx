import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WatchlistCard } from '../WatchlistCard';
import type { WatchlistEntry } from '@/lib/api/watchlist';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  PlayCircle: () => <div data-testid="play-circle-icon">PlayCircle</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Film: () => <div data-testid="film-icon">Film</div>,
}));

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

describe('WatchlistCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders watchlist entry correctly', () => {
    renderWithProviders(
      <WatchlistCard
        entry={mockEntry}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('movie')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('Currently Watching')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('Great movie!')).toBeInTheDocument();
    expect(screen.getByText('Added 1/1/2024')).toBeInTheDocument();
  });

  it('displays correct status icon and color for watching status', () => {
    renderWithProviders(
      <WatchlistCard
        entry={mockEntry}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByTestId('play-circle-icon')).toBeInTheDocument();
    expect(screen.getByText('Currently Watching')).toHaveClass('text-blue-700');
  });

  it('displays correct status icon and color for completed status', () => {
    const completedEntry = { ...mockEntry, status: 'completed' as const };
    
    renderWithProviders(
      <WatchlistCard
        entry={completedEntry}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toHaveClass('text-green-700');
  });

  it('displays correct status icon and color for not_watched status', () => {
    const notWatchedEntry = { ...mockEntry, status: 'not_watched' as const };
    
    renderWithProviders(
      <WatchlistCard
        entry={notWatchedEntry}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    expect(screen.getByText('Not Watched')).toHaveClass('text-gray-700');
  });

  it('handles missing rating gracefully', () => {
    const entryWithoutRating = { ...mockEntry, rating: undefined };
    
    renderWithProviders(
      <WatchlistCard
        entry={entryWithoutRating}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.queryByText('/10')).not.toBeInTheDocument();
  });

  it('handles missing notes gracefully', () => {
    const entryWithoutNotes = { ...mockEntry, notes: undefined };
    
    renderWithProviders(
      <WatchlistCard
        entry={entryWithoutNotes}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.queryByText('Great movie!')).not.toBeInTheDocument();
  });

  it('handles missing poster gracefully', () => {
    const entryWithoutPoster = {
      ...mockEntry,
      mediaItem: { ...mockEntry.mediaItem, posterPath: undefined }
    };
    
    renderWithProviders(
      <WatchlistCard
        entry={entryWithoutPoster}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('calls onEdit when Edit button is clicked', () => {
    renderWithProviders(
      <WatchlistCard
        entry={mockEntry}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
      />
    );

    const editButton = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockEntry);
  });

  it('calls onRemove when Remove button is clicked', () => {
    renderWithProviders(
      <WatchlistCard
        entry={mockEntry}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByRole('button', { name: 'Remove' });
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith(mockEntry);
  });

  it('displays TV show media type correctly', () => {
    const tvEntry = {
      ...mockEntry,
      mediaItem: { ...mockEntry.mediaItem, mediaType: 'tv' as const }
    };
    
    renderWithProviders(
      <WatchlistCard
        entry={tvEntry}
        onEdit={mockOnEdit}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('tv')).toBeInTheDocument();
  });
});