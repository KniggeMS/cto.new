import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface RatingInputProps {
  value?: number;
  onChange: (rating: number | undefined) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function RatingInput({
  value,
  onChange,
  max = 10,
  size = 'md',
  disabled = false,
  className,
}: RatingInputProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleStarClick = (rating: number) => {
    if (disabled) return;
    onChange(rating === value ? undefined : rating);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleStarClick(rating)}
            disabled={disabled}
            className={cn(
              'transition-colors',
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-110',
              rating <= (value || 0) ? 'text-yellow-400' : 'text-gray-300',
            )}
          >
            <Star className={sizeClasses[size]} fill="currentColor" />
          </button>
        ))}
      </div>
      {value && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
