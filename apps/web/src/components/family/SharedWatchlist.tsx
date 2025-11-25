'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import type { WatchlistEntry, FamilyMembership } from '@/lib/api/family';

interface SharedWatchlistProps {
  watchlists: WatchlistEntry[];
  members: FamilyMembership[];
  isLoading: boolean;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export function SharedWatchlist({
  watchlists,
  members,
  isLoading,
  statusFilter,
  onStatusFilterChange,
}: SharedWatchlistProps) {
  const [memberFilter, setMemberFilter] = useState<string>('');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="mt-4 text-gray-600">Loading watchlist...</p>
        </CardContent>
      </Card>
    );
  }

  const filteredWatchlists = watchlists.filter((entry) => {
    if (memberFilter && entry.userId !== memberFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'watching':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_watched':
        return 'Not Watched';
      case 'watching':
        return 'Watching';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="member-filter" className="block text-sm font-medium text-gray-700">
                Filter by Member
              </label>
              <Select
                id="member-filter"
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Members' },
                  ...members.map((member) => ({
                    value: member.userId,
                    label: member.user.name || member.user.email,
                  })),
                ]}
              />
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                Filter by Status
              </label>
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'not_watched', label: 'Not Watched' },
                  { value: 'watching', label: 'Watching' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shared Watchlist ({filteredWatchlists.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWatchlists.length === 0 ? (
            <p className="py-12 text-center text-gray-600">No watchlist items found</p>
          ) : (
            <div className="space-y-4">
              {filteredWatchlists.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start space-x-4 rounded-lg border border-gray-200 p-4"
                >
                  {entry.mediaItem.posterPath && (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${entry.mediaItem.posterPath}`}
                      alt={entry.mediaItem.title}
                      className="h-32 w-24 rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{entry.mediaItem.title}</h3>
                        <p className="text-sm text-gray-500">
                          {entry.mediaItem.tmdbType === 'movie' ? 'Movie' : 'TV Show'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                          entry.status,
                        )}`}
                      >
                        {getStatusLabel(entry.status)}
                      </span>
                    </div>

                    {entry.mediaItem.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {entry.mediaItem.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Added by {entry.user.name || entry.user.email}</span>
                      {entry.rating && (
                        <span className="flex items-center">
                          <svg
                            className="mr-1 h-4 w-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {entry.rating}/10
                        </span>
                      )}
                    </div>

                    {entry.mediaItem.genres.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entry.mediaItem.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
