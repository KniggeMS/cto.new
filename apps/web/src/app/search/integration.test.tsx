import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from 'react-hot-toast';
import SearchPage from './page';
import { searchApi } from '@/lib/api/search';
import { watchlistApi } from '@/lib/api/watchlist';
import { useAddToWatchlist } from '@/lib/hooks/use-watchlist';

// Mock the API and hooks
jest.mock('@/lib/api/search');
jest.mock('@/lib/api/watchlist');
jest.mock('@/lib/hooks/use-watchlist');
jest.mock('@/lib/utils/tmdb-genres', () => ({
  getGenreNames: jest.fn((ids) => ids.map((id: number) => `Genre ${id}`)),
}));

const mockSearchApi = searchApi as jest.Mocked<typeof searchApi>;
const mockWatchlistApi = watchlistApi as jest.Mocked<typeof watchlistApi>;
const mockUseAddToWatchlist = useAddToWatchlist as jest.MockedFunction<typeof useAddToWatchlist>;

// Mock search results
const mockSearchResults = [
  {
    id: 123,
    title: 'Test Movie',
    mediaType: 'movie',
    posterPath: '/test-poster.jpg',
    backdropPath: '/test-backdrop.jpg',
    releaseDate: '2023-01-01',
    overview: 'A test movie overview',
    voteAverage: 8.5,
    genreIds: [1, 2, 3],
    media_type: 'movie',
    poster_path: '/test-poster.jpg',
    backdrop_path: '/test-backdrop.jpg',
    release_date: '2023-01-01',
    vote_average: 8.5,
    genre_ids: [1, 2, 3],
  },
  {
    id: 456,
    title: 'Test TV Show',
    mediaType: 'tv',
    posterPath: '/test-tv-poster.jpg',
    releaseDate: '2023-02-01',
    overview: 'A test TV show overview',
    voteAverage: 9.0,
    genreIds: [4, 5],
    media_type: 'tv',
    poster_path: '/test-tv-poster.jpg',
    release_date: '2023-02-01',
    vote_average: 9.0,
    genre_ids: [4, 5],
  },
];

const mockSearchResponse = {
  data: mockSearchResults,
  page: 1,
  totalPages: 1,
  totalResults: 2,
  cached: false,
};

// Test wrapper with providers
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
};

describe('Search Page Integration', () => {
  const mockAddToWatchlist = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAddToWatchlist.mockReturnValue({
      mutateAsync: mockAddToWatchlist,
      isPending: false,
    } as any);

    mockSearchApi.search.mockResolvedValue(mockSearchResponse);
  });

  it('should display search results with normalized camelCase data', async () => {
    render(<SearchPage />, { wrapper: createTestWrapper() });

    // Enter search query
    const searchInput = screen.getByLabelText(/search for movies and tv shows/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Wait for results to load
    await waitFor(() => {
      expect(mockSearchApi.search).toHaveBeenCalledWith('test query', 1);
    });

    // Check that results are displayed with correct data
    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
      expect(screen.getByText('Test TV Show')).toBeInTheDocument();
    });

    // Verify normalized fields are used
    expect(screen.getByText('movie')).toBeInTheDocument();
    expect(screen.getByText('tv')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument(); // From releaseDate
    expect(screen.getByText('⭐ 8.5/10')).toBeInTheDocument();
    expect(screen.getByText('⭐ 9.0/10')).toBeInTheDocument();
  });

  it('should add item to watchlist with metadata', async () => {
    render(<SearchPage />, { wrapper: createTestWrapper() });

    // Enter search query
    const searchInput = screen.getByLabelText(/search for movies and tv shows/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });

    // Click "Add to Watchlist" button
    const addButton = screen.getAllByText('Add to Watchlist')[0];
    fireEvent.click(addButton);

    // Verify the correct data was sent to API
    await waitFor(() => {
      expect(mockAddToWatchlist).toHaveBeenCalledWith({
        tmdbId: 123,
        mediaType: 'movie',
        status: 'not_watched',
        metadata: {
          title: 'Test Movie',
          description: 'A test movie overview',
          posterPath: '/test-poster.jpg',
          backdropPath: '/test-backdrop.jpg',
          releaseDate: '2023-01-01',
          rating: 8.5,
          genres: [],
          creators: [],
          streamingProviders: [],
        },
      });
    });
  });

  it('should handle successful add to watchlist', async () => {
    mockAddToWatchlist.mockResolvedValue({} as any);

    render(<SearchPage />, { wrapper: createTestWrapper() });

    // Enter search query
    const searchInput = screen.getByLabelText(/search for movies and tv shows/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });

    // Click "Add to Watchlist" button
    const addButton = screen.getAllByText('Add to Watchlist')[0];
    fireEvent.click(addButton);

    // Verify success message (toast would be shown)
    await waitFor(() => {
      expect(mockAddToWatchlist).toHaveBeenCalled();
    });
  });

  it('should handle already in watchlist error', async () => {
    const error = new Error('Already in watchlist');
    (error as any).response = { status: 409 };
    mockAddToWatchlist.mockRejectedValue(error);

    render(<SearchPage />, { wrapper: createTestWrapper() });

    // Enter search query
    const searchInput = screen.getByLabelText(/search for movies and tv shows/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });

    // Click "Add to Watchlist" button
    const addButton = screen.getAllByText('Add to Watchlist')[0];
    fireEvent.click(addButton);

    // Verify error handling
    await waitFor(() => {
      expect(mockAddToWatchlist).toHaveBeenCalled();
    });
  });

  it('should handle search errors gracefully', async () => {
    mockSearchApi.search.mockRejectedValue(new Error('Search failed'));

    render(<SearchPage />, { wrapper: createTestWrapper() });

    // Enter search query
    const searchInput = screen.getByLabelText(/search for movies and tv shows/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no results', async () => {
    mockSearchApi.search.mockResolvedValue({
      data: [],
      page: 1,
      totalPages: 0,
      totalResults: 0,
      cached: false,
    });

    render(<SearchPage />, { wrapper: createTestWrapper() });

    // Enter search query
    const searchInput = screen.getByLabelText(/search for movies and tv shows/i);
    fireEvent.change(searchInput, { target: { value: 'no results query' } });

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText(/no results found for "no results query"/i)).toBeInTheDocument();
    });
  });

  it('should show initial empty state', () => {
    render(<SearchPage />, { wrapper: createTestWrapper() });

    // Should show initial empty state
    expect(screen.getByText(/start searching/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a movie or tv show title to search/i)).toBeInTheDocument();
  });

  it('should debounce search input', async () => {
    render(<SearchPage />, { wrapper: createTestWrapper() });

    const searchInput = screen.getByLabelText(/search for movies and tv shows/i);
    
    // Type multiple characters quickly
    fireEvent.change(searchInput, { target: { value: 't' } });
    fireEvent.change(searchInput, { target: { value: 'te' } });
    fireEvent.change(searchInput, { target: { value: 'tes' } });
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Should only call API once with debounced value
    await waitFor(() => {
      expect(mockSearchApi.search).toHaveBeenCalledTimes(1);
      expect(mockSearchApi.search).toHaveBeenCalledWith('test', 1);
    }, { timeout: 1000 });
  });
});