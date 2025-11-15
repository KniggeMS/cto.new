'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Recommendation } from '@/lib/api/family';

interface RecommendationsFeedProps {
  recommendations: Recommendation[];
  isLoading: boolean;
}

export function RecommendationsFeed({ recommendations, isLoading }: RecommendationsFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="mt-4 text-gray-600">Loading recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No recommendations yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Family members will see recommendations here as they share them.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Recommendations ({recommendations.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recommendations.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start space-x-4">
                {rec.mediaItem.posterPath && (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${rec.mediaItem.posterPath}`}
                    alt={rec.mediaItem.title}
                    className="h-40 w-28 rounded-md object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {rec.mediaItem.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {rec.mediaItem.tmdbType === 'movie' ? 'Movie' : 'TV Show'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                        rec.status,
                      )}`}
                    >
                      {rec.status}
                    </span>
                  </div>

                  {rec.mediaItem.description && (
                    <p className="mt-2 text-sm text-gray-600">{rec.mediaItem.description}</p>
                  )}

                  {rec.message && (
                    <div className="mt-3 rounded-md bg-blue-50 p-3">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Message:</span> {rec.message}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      From <span className="font-medium">{rec.fromUser.name || rec.fromUser.email}</span>
                    </span>
                    <span>•</span>
                    <span>
                      To <span className="font-medium">{rec.toUser.name || rec.toUser.email}</span>
                    </span>
                    <span>•</span>
                    <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                  </div>

                  {rec.mediaItem.genres.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rec.mediaItem.genres.slice(0, 4).map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {rec.mediaItem.rating && (
                    <div className="mt-2 flex items-center text-sm">
                      <svg
                        className="mr-1 h-5 w-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-medium">{rec.mediaItem.rating.toFixed(1)}</span>
                      <span className="ml-1 text-gray-500">/10</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
