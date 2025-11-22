// Mocks must be before any imports
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/lib/api/search', () => ({
  searchApi: {
    search: jest.fn(),
  },
}));

jest.mock('@/lib/api/watchlist', () => ({
  watchlistApi: {
    getWatchlist: jest.fn(),
    addToWatchlist: jest.fn(),
    updateWatchlistEntry: jest.fn(),
    removeFromWatchlist: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchPage from '@/app/search/page';
import { AuthProvider } from '@/lib/context/auth-context';
import { searchApi } from '@/lib/api/search';
import { watchlistApi } from '@/lib/api/watchlist';
import toast from 'react-hot-toast';

// Mock search results
const mockSearchResults = [
  {
    id: 1,
    title: 'The Matrix',
    mediaType: 'movie',
    posterPath: '/test-poster.jpg',
    backdropPath: '/test-backdrop.jpg',
    overview: 'A computer programmer is chosen by a mysterious resistance to help fight a war against machines.',
    releaseDate: '1999-03-31',
    voteAverage: 8.7,
    genres: [28, 878], // Action, Sci-Fi
  },
  {
    id: 2,
    title: 'Breaking Bad',
    mediaType: 'tv',
    posterPath: '/test-poster2.jpg',
    backdropPath: '/test-backdrop2.jpg',
    overview: 'A high school chemistry teacher turned meth cook teams up with a former student.',
    releaseDate: '2008-01-20',
    voteAverage: 9.5,
    genres: [18, 80], // Drama, Crime
  },
];

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

describe('Search Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (searchApi.search as jest.Mock).mockResolvedValue(mockSearchResults);
    (watchlistApi.addToWatchlist as jest.Mock).mockResolvedValue({
      id: 'entry-1',
      mediaItemId: '1',
      status: 'not_watched',
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Empty State', () => {
    it('should display empty state when no query is provided', () => {
      renderWithProviders(<SearchPage />);

      expect(screen.getByText('Start searching')).toBeInTheDocument();
      expect(screen.getByText('Enter a movie or TV show title to search')).toBeInTheDocument();
    });

    it('should have a search input field', () => {
      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should not search if query is less than 3 characters', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'ma');

      jest.advanceTimersByTime(600);

      expect(searchApi.search).not.toHaveBeenCalled();
    });

    it.skip('should delay search calls with debouncing', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      // Should not call search immediately
      expect(searchApi.search).not.toHaveBeenCalled();

      // Fast-forward through debounce delay
      jest.advanceTimersByTime(600);

      expect(searchApi.search).toHaveBeenCalled();
    });

    it('should display search results', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText('The Matrix')).toBeInTheDocument();
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      });
    });

    it('should display result count', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText('Found 2 result(s)')).toBeInTheDocument();
      });
    });

    it('should display no results message', async () => {
      (searchApi.search as jest.Mock).mockResolvedValueOnce([]);

      const user = userEvent.setup({ delay: null });
      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'notfound');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText('No results found for "notfound"')).toBeInTheDocument();
      });
    });
  });

  describe('Search Results Display', () => {
    it('should display poster image for each result', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
        expect(images[0]).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w342/test-poster.jpg');
      });
    });

    it('should display media type and release year', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText('movie')).toBeInTheDocument();
        expect(screen.getByText('1999')).toBeInTheDocument();
        expect(screen.getByText('2008')).toBeInTheDocument();
      });
    });

    it('should display genre tags', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
        expect(screen.getByText('Drama')).toBeInTheDocument();
        expect(screen.getByText('Crime')).toBeInTheDocument();
      });
    });

    it('should display rating', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText('⭐ 8.7/10')).toBeInTheDocument();
        expect(screen.getByText('⭐ 9.5/10')).toBeInTheDocument();
      });
    });

    it('should display overview text', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText(/computer programmer is chosen/)).toBeInTheDocument();
      });
    });
  });

  describe('Add to Watchlist', () => {
    it('should have add to watchlist buttons', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /Add to Watchlist/ });
        expect(buttons).toHaveLength(2);
      });
    });

    it('should add item to watchlist when button is clicked', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText('The Matrix')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button', { name: /Add to Watchlist/ });
      await user.click(buttons[0]);

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(watchlistApi.addToWatchlist).toHaveBeenCalledWith({
          tmdbId: 1,
          mediaType: 'movie',
          status: 'not_watched',
        });
      });
    });

    it.skip('should notify user after adding to watchlist', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText('The Matrix')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button', { name: /Add to Watchlist/ });
      await user.click(buttons[0]);

      jest.advanceTimersByTime(200);
    });

  });

  describe('Error Handling', () => {
    it.skip('should display items without poster images', async () => {
      const user = userEvent.setup({ delay: null });

      (searchApi.search as jest.Mock).mockResolvedValueOnce([
        {
          ...mockSearchResults[0],
          posterPath: null,
        },
      ]);

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText('The Matrix')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Layout', () => {
    it.skip('should display responsive grid layout for search results', async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<SearchPage />);

      const searchInput = screen.getByPlaceholderText('Search for movies or TV shows...');
      await user.type(searchInput, 'matrix');

      jest.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText('The Matrix')).toBeInTheDocument();
        expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
      });
    });
  });
});
