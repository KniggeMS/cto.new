'use client';

import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSearch } from '@/lib/hooks/use-search';
import { useAddToWatchlist } from '@/lib/hooks/use-watchlist';
import { Plus, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getGenreNames } from '@/lib/utils/tmdb-genres';
import type { SearchResult } from '@/lib/api/search';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const { data: searchResponse, isLoading, error } = useSearch(query);
  const results = searchResponse?.data || [];
  const addToWatchlistMutation = useAddToWatchlist();

  const handleAddToWatchlist = async (result: SearchResult) => {
    try {
      await addToWatchlistMutation.mutateAsync({
        tmdbId: result.id,
        mediaType: result.mediaType,
        status: 'not_watched',
        // Include metadata for new media items
        metadata: {
          title: result.title,
          description: result.overview,
          posterPath: result.posterPath,
          backdropPath: result.backdropPath,
          releaseDate: result.releaseDate,
          rating: result.voteAverage,
          genres: [], // Will be populated from genre IDs if needed
          creators: [],
          streamingProviders: result.streamingProviders?.map((provider: any) => ({
            provider: provider.provider_name || provider.provider_id,
            regions: provider.regions || [],
          })) || [],
        },
      });

      setAddedItems((prev) => new Set([...prev, result.id]));
      toast.success(`Added "${result.title}" to your watchlist!`);
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('This item is already in your watchlist');
      } else {
        toast.error('Failed to add to watchlist');
      }
    }
  };

  const isItemAdded = (resultId: number) => addedItems.has(resultId);

  return (
    <PageShell title="Search" description="Search for movies and TV shows to add to your watchlist">
      <div className="mb-8">
        <Input
          type="search"
          placeholder="Search for movies or TV shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-2xl"
          aria-label="Search for movies and TV shows"
        />
      </div>

      {isLoading && query.length > 2 && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        </div>
      )}

      {error && query.length > 2 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
            <h3 className="mt-4 text-lg font-medium text-red-900">Search failed</h3>
            <p className="mt-2 text-sm text-red-700">
              {error instanceof Error ? error.message : 'Unable to search. Please try again.'}
            </p>
          </CardContent>
        </Card>
      )}

      {!query && (
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Start searching</h3>
            <p className="mt-2 text-sm text-gray-600">Enter a movie or TV show title to search</p>
          </CardContent>
        </Card>
      )}

      {query.length > 2 && !isLoading && !error && results && results.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No results found for &quot;{query}&quot;</p>
          </CardContent>
        </Card>
      )}

      {results && results.length > 0 && (
        <div>
          <p className="mb-4 text-sm text-gray-600">Found {results.length} result(s)</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((result) => (
              <Card
                key={result.id}
                className="group hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
              >
                <CardContent className="p-0 space-y-0 flex flex-col flex-1">
                  {/* Poster */}
                  {result.posterPath ? (
                    <div className="aspect-[2/3] overflow-hidden bg-gray-200">
                      <img
                        src={`https://image.tmdb.org/t/p/w342${result.posterPath}`}
                        alt={result.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[2/3] bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No image</span>
                    </div>
                  )}

                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    {/* Title and basic info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
                        {result.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
                        <span className="capitalize">{result.mediaType}</span>
                        {result.releaseDate && (
                          <span>{new Date(result.releaseDate).getFullYear()}</span>
                        )}
                      </div>
                    </div>

                    {/* Genres */}
                    {result.genreIds && result.genreIds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {getGenreNames(result.genreIds)
                          .slice(0, 3)
                          .map((genre) => (
                            <span
                              key={genre}
                              className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                            >
                              {genre}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Overview */}
                    {result.overview && (
                      <p className="line-clamp-3 text-sm text-gray-600 flex-1">{result.overview}</p>
                    )}

                    {/* Rating */}
                    {result.voteAverage && (
                      <div className="text-sm font-medium text-yellow-600">
                        ⭐ {result.voteAverage.toFixed(1)}/10
                      </div>
                    )}

                    {/* Add to Watchlist Button */}
                    <Button
                      onClick={() => handleAddToWatchlist(result)}
                      disabled={addToWatchlistMutation.isPending || isItemAdded(result.id)}
                      isLoading={addToWatchlistMutation.isPending}
                      className="w-full mt-2"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isItemAdded(result.id) ? 'Added' : 'Add to Watchlist'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
