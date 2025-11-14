'use client';

import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useSearch } from '@/lib/hooks/use-search';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useSearch(query);

  return (
    <PageShell title="Search" description="Search for movies and TV shows to add to your watchlist">
      <div className="mb-8">
        <Input
          type="search"
          placeholder="Search for movies or TV shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-2xl"
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

      {query.length > 2 && !isLoading && results && results.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No results found for &quot;{query}&quot;</p>
          </CardContent>
        </Card>
      )}

      {results && results.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((result) => (
            <Card key={result.id}>
              <CardContent className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="capitalize">{result.mediaType}</span>
                  {result.releaseDate && <span>{new Date(result.releaseDate).getFullYear()}</span>}
                </div>
                {result.overview && (
                  <p className="line-clamp-3 text-sm text-gray-600">{result.overview}</p>
                )}
                {result.voteAverage && (
                  <div className="text-sm font-medium text-primary-600">
                    ⭐ {result.voteAverage.toFixed(1)}/10
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
