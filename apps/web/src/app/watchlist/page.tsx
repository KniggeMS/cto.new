'use client';

import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/Card';
import { useWatchlist } from '@/lib/hooks/use-watchlist';

export default function WatchlistPage() {
  const { data: watchlist, isLoading, error } = useWatchlist();

  if (isLoading) {
    return (
      <PageShell
        title="My Watchlist"
        description="Track what you're watching, completed, and plan to watch"
      >
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="mt-4 text-gray-600">Loading watchlist...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="My Watchlist">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Failed to load watchlist. Please try again.</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="My Watchlist"
      description="Track what you're watching, completed, and plan to watch"
    >
      {!watchlist || watchlist.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Your watchlist is empty</h3>
            <p className="mt-2 text-sm text-gray-600">
              Start by searching for movies and TV shows to add to your watchlist.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {watchlist.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">{entry.mediaItem.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Status: {entry.status.replace('_', ' ')}
                  </span>
                  {entry.rating && (
                    <span className="text-sm font-medium text-primary-600">
                      ⭐ {entry.rating}/10
                    </span>
                  )}
                </div>
                {entry.notes && <p className="text-sm text-gray-600">{entry.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
