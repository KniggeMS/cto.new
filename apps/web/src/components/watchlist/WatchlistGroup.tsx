import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { WatchlistCard } from './WatchlistCard';
import type { WatchlistEntry } from '@/lib/api/watchlist';

export interface WatchlistGroupProps {
  title: string;
  entries: WatchlistEntry[];
  onEditEntry: (entry: WatchlistEntry) => void;
  onRemoveEntry: (entry: WatchlistEntry) => void;
  emptyMessage?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function WatchlistGroup({
  title,
  entries,
  onEditEntry,
  onRemoveEntry,
  emptyMessage = 'No entries in this category',
  icon,
  className,
}: WatchlistGroupProps) {
  if (entries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
          <span className="ml-2 text-sm font-normal text-gray-500">({entries.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <WatchlistCard
              key={entry.id}
              entry={entry}
              onEdit={onEditEntry}
              onRemove={onRemoveEntry}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
