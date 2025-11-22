import React from 'react';
import { Clock, CheckCircle, PlayCircle, Star, Calendar, Film } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import type { WatchlistEntry } from '@/lib/api/watchlist';

export interface WatchlistCardProps {
  entry: WatchlistEntry;
  onEdit: (entry: WatchlistEntry) => void;
  onRemove: (entry: WatchlistEntry) => void;
  className?: string;
}

export function WatchlistCard({ entry, onEdit, onRemove, className }: WatchlistCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_watched':
        return <Clock className="w-4 h-4 text-gray-600" />;
      case 'watching':
        return <PlayCircle className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_watched':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'watching':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'not_watched':
        return 'Not Watched';
      case 'watching':
        return 'Currently Watching';
      case 'completed':
        return 'Completed';
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className={cn('group hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
              {entry.mediaItem.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Film className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 capitalize">
                {entry.mediaItem.mediaType}
              </span>
              {entry.mediaItem.releaseDate && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.mediaItem.releaseDate).getFullYear()}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {entry.mediaItem.posterPath && (
            <img
              src={`https://image.tmdb.org/t/p/w92${entry.mediaItem.posterPath}`}
              alt={entry.mediaItem.title}
              className="w-12 h-16 object-cover rounded ml-3 flex-shrink-0"
            />
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
            getStatusColor(entry.status)
          )}>
            {getStatusIcon(entry.status)}
            <span>{formatStatus(entry.status)}</span>
          </div>
          
          {entry.rating && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
              <Star className="w-3 h-3" />
              <span className="text-xs font-medium">{entry.rating}/10</span>
            </div>
          )}
        </div>

        {/* Notes Preview */}
        {entry.notes && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {entry.notes}
          </p>
        )}

        {/* Date Added */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <Calendar className="w-3 h-3" />
          <span>Added {formatDate(entry.dateAdded)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(entry)}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(entry)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}