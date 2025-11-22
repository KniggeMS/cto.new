import { render, screen } from '@testing-library/react';
import { RecommendationsFeed } from './RecommendationsFeed';
import type { Recommendation } from '@/lib/api/family';

const mockRecommendations: Recommendation[] = [
  {
    id: 'rec-1',
    mediaItemId: 'media-1',
    recommendedBy: 'user-1',
    recommendedTo: 'user-2',
    message: 'You should watch this!',
    status: 'pending',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    mediaItem: {
      id: 'media-1',
      tmdbId: 123,
      tmdbType: 'movie',
      title: 'Recommended Movie',
      description: 'A great movie you should watch',
      posterPath: '/poster.jpg',
      backdropPath: null,
      releaseDate: '2023-01-01T00:00:00Z',
      rating: 8.5,
      genres: ['Drama', 'Thriller'],
      creators: ['Director Name'],
      streamingProviders: [],
    },
    fromUser: {
      id: 'user-1',
      email: 'sender@example.com',
      name: 'Sender User',
    },
    toUser: {
      id: 'user-2',
      email: 'receiver@example.com',
      name: 'Receiver User',
    },
  },
  {
    id: 'rec-2',
    mediaItemId: 'media-2',
    recommendedBy: 'user-2',
    recommendedTo: 'user-1',
    message: null,
    status: 'accepted',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    mediaItem: {
      id: 'media-2',
      tmdbId: 456,
      tmdbType: 'tv',
      title: 'TV Show',
      description: 'An amazing TV series',
      posterPath: '/tv-poster.jpg',
      backdropPath: null,
      releaseDate: '2023-01-02T00:00:00Z',
      rating: 9.0,
      genres: ['Action', 'Sci-Fi'],
      creators: ['Creator Name'],
      streamingProviders: [],
    },
    fromUser: {
      id: 'user-2',
      email: 'receiver@example.com',
      name: 'Receiver User',
    },
    toUser: {
      id: 'user-1',
      email: 'sender@example.com',
      name: 'Sender User',
    },
  },
];

describe('RecommendationsFeed', () => {
  it('renders loading state', () => {
    render(<RecommendationsFeed recommendations={[]} isLoading={true} />);

    expect(screen.getByText('Loading recommendations...')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<RecommendationsFeed recommendations={[]} isLoading={false} />);

    expect(screen.getByText('No recommendations yet')).toBeInTheDocument();
    expect(
      screen.getByText('Family members will see recommendations here as they share them.'),
    ).toBeInTheDocument();
  });

  it('renders all recommendations', () => {
    render(<RecommendationsFeed recommendations={mockRecommendations} isLoading={false} />);

    expect(screen.getByText('Family Recommendations (2)')).toBeInTheDocument();
    expect(screen.getByText('Recommended Movie')).toBeInTheDocument();
    expect(screen.getByText('TV Show')).toBeInTheDocument();
  });

  it('displays recommendation message when available', () => {
    render(<RecommendationsFeed recommendations={mockRecommendations} isLoading={false} />);

    expect(screen.getByText('You should watch this!')).toBeInTheDocument();
  });

  it('displays status badges correctly', () => {
    render(<RecommendationsFeed recommendations={mockRecommendations} isLoading={false} />);

    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('accepted')).toBeInTheDocument();
  });

  it('displays from and to users', () => {
    render(<RecommendationsFeed recommendations={mockRecommendations} isLoading={false} />);

    expect(screen.getByText('Sender User')).toBeInTheDocument();
    expect(screen.getByText('Receiver User')).toBeInTheDocument();
  });

  it('displays media type correctly', () => {
    render(<RecommendationsFeed recommendations={mockRecommendations} isLoading={false} />);

    expect(screen.getByText('Movie')).toBeInTheDocument();
    expect(screen.getByText('TV Show')).toBeInTheDocument();
  });

  it('displays media rating', () => {
    render(<RecommendationsFeed recommendations={mockRecommendations} isLoading={false} />);

    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('9.0')).toBeInTheDocument();
  });

  it('displays genres', () => {
    render(<RecommendationsFeed recommendations={mockRecommendations} isLoading={false} />);

    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('Thriller')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
  });

  it('displays media description', () => {
    render(<RecommendationsFeed recommendations={mockRecommendations} isLoading={false} />);

    expect(screen.getByText('A great movie you should watch')).toBeInTheDocument();
    expect(screen.getByText('An amazing TV series')).toBeInTheDocument();
  });
});
