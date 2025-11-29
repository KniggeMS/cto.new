import React from 'react';
import { Filter } from 'lucide-react';
import { Select } from './Select';
import { cn } from '@/lib/utils/cn';
import type { StatusFilter, SortOption } from '@/lib/utils/watchlist-utils';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterControlsProps {
  statusFilter: StatusFilter;
  sortBy: SortOption;
  onStatusChange: (status: StatusFilter) => void;
  onSortChange: (sort: SortOption) => void;
  className?: string;
}

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'All Status' },
  { value: 'not_watched', label: 'Not Watched' },
  { value: 'watching', label: 'Currently Watching' },
  { value: 'completed', label: 'Completed' },
];

const sortOptions: FilterOption[] = [
  { value: 'dateAdded_desc', label: 'Recently Added' },
  { value: 'dateAdded_asc', label: 'Oldest First' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'rating_asc', label: 'Lowest Rated' },
];

export function FilterControls({
  statusFilter = 'all',
  sortBy = 'dateAdded_desc',
  onStatusChange,
  onSortChange,
  className,
}: FilterControlsProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row gap-4 items-start sm:items-center', className)}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Filter className="w-4 h-4" />
        <span>Filters:</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-1">
        <Select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          options={statusOptions}
          className="w-full sm:w-48"
        />

        <Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          options={sortOptions}
          className="w-full sm:w-48"
        />
      </div>
    </div>
  );
}
