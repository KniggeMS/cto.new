import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SharedWatchlist } from './SharedWatchlist';
import type { WatchlistEntry, FamilyMembership } from '@/lib/api/family';

const mockMembers: FamilyMembership[] = [
  {
    id: 'mem-1',
    userId: 'user-1',
    familyId: 'family-1',
    role: 'owner',
    joinedAt: '2023-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      email: 'owner@example.com',
      name: 'Owner User',
    },
  },
  {
    id: 'mem-2',
    userId: 'user-2',
    familyId: 'family-1',
    role: 'member',
    joinedAt: '2023-01-02T00:00:00Z',
    user: {
      id: 'user-2',
      email: 'member@example.com',
      name: 'Member User',
    },
  },
];

const mockWatchlists: WatchlistEntry[] = [
  {
    id: 'watch-1',
    userId: 'user-1',
    mediaItemId: 'media-1',
    status: 'watching',
    rating: 8,
    notes: 'Great show!',
    dateAdded: '2023-01-01T00:00:00Z',
    dateUpdated: '2023-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      email: 'owner@example.com',
      name: 'Owner User',
    },
    mediaItem: {
      id: 'media-1',
      tmdbId: 123,
      tmdbType: 'tv',
      title: 'Test TV Show',
      description: 'A great test show',
      posterPath: '/test-poster.jpg',
      backdropPath: null,
      releaseDate: '2023-01-01T00:00:00Z',
      rating: 8.5,
      genres: ['Drama', 'Thriller'],
      creators: ['Test Creator'],
      streamingProviders: [],
    },
  },
  {
    id: 'watch-2',
    userId: 'user-2',
    mediaItemId: 'media-2',
    status: 'completed',
    rating: null,
    notes: null,
    dateAdded: '2023-01-02T00:00:00Z',
    dateUpdated: '2023-01-02T00:00:00Z',
    user: {
      id: 'user-2',
      email: 'member@example.com',
      name: 'Member User',
    },
    mediaItem: {
      id: 'media-2',
      tmdbId: 456,
      tmdbType: 'movie',
      title: 'Test Movie',
      description: 'An amazing test movie',
      posterPath: '/test-movie-poster.jpg',
      backdropPath: null,
      releaseDate: '2023-01-02T00:00:00Z',
      rating: 7.5,
      genres: ['Action', 'Comedy'],
      creators: ['Test Director'],
      streamingProviders: [],
    },
  },
];

describe('SharedWatchlist', () => {
  const mockOnStatusFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    render(
      <SharedWatchlist
        watchlists={[]}
        members={[]}
        isLoading={true}
        statusFilter=""
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    expect(screen.getByText('Loading watchlist...')).toBeInTheDocument();
  });

  it('renders watchlist entries', () => {
    render(
      <SharedWatchlist
        watchlists={mockWatchlists}
        members={mockMembers}
        isLoading={false}
        statusFilter=""
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    expect(screen.getByText('Test TV Show')).toBeInTheDocument();
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('Shared Watchlist (2)')).toBeInTheDocument();
  });

  it('displays user information for each entry', () => {
    render(
      <SharedWatchlist
        watchlists={mockWatchlists}
        members={mockMembers}
        isLoading={false}
        statusFilter=""
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    expect(screen.getByText('Added by Owner User')).toBeInTheDocument();
    expect(screen.getByText('Added by Member User')).toBeInTheDocument();
  });

  it('displays status badges correctly', () => {
    render(
      <SharedWatchlist
        watchlists={mockWatchlists}
        members={mockMembers}
        isLoading={false}
        statusFilter=""
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    expect(screen.getByText('Watching')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays rating when available', () => {
    render(
      <SharedWatchlist
        watchlists={mockWatchlists}
        members={mockMembers}
        isLoading={false}
        statusFilter=""
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  it('filters by member', async () => {
    const user = userEvent.setup();

    render(
      <SharedWatchlist
        watchlists={mockWatchlists}
        members={mockMembers}
        isLoading={false}
        statusFilter=""
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    const memberFilter = screen.getByLabelText('Filter by Member');
    await user.selectOptions(memberFilter, 'user-1');

    expect(screen.getByText('Test TV Show')).toBeInTheDocument();
    expect(screen.queryByText('Test Movie')).not.toBeInTheDocument();
    expect(screen.getByText('Shared Watchlist (1)')).toBeInTheDocument();
  });

  it('calls onStatusFilterChange when status filter changes', async () => {
    const user = userEvent.setup();

    render(
      <SharedWatchlist
        watchlists={mockWatchlists}
        members={mockMembers}
        isLoading={false}
        statusFilter=""
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    const statusFilter = screen.getByLabelText('Filter by Status');
    await user.selectOptions(statusFilter, 'watching');

    expect(mockOnStatusFilterChange).toHaveBeenCalledWith('watching');
  });

  it('shows empty state when no entries match filters', () => {
    render(
      <SharedWatchlist
        watchlists={[]}
        members={mockMembers}
        isLoading={false}
        statusFilter=""
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    expect(screen.getByText('No watchlist items found')).toBeInTheDocument();
  });

  it('displays media type correctly', () => {
    render(
      <SharedWatchlist
        watchlists={mockWatchlists}
        members={mockMembers}
        isLoading={false}
        statusFilter=""
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    expect(screen.getByText('TV Show')).toBeInTheDocument();
    expect(screen.getByText('Movie')).toBeInTheDocument();
  });

  it('displays genres', () => {
    render(
      <SharedWatchlist
        watchlists={mockWatchlists}
        members={mockMembers}
        isLoading={false}
        statusFilter=""
        onStatusFilterChange={mockOnStatusFilterChange}
      />,
    );

    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('Thriller')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Comedy')).toBeInTheDocument();
  });
});
