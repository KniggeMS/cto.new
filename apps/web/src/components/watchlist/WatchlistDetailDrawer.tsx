import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Trash2 } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { RatingInput } from '@/components/ui/RatingInput';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useUpdateWatchlistEntry, useRemoveFromWatchlist } from '@/lib/hooks/use-watchlist';
import { toast } from 'react-hot-toast';
import type { WatchlistEntry } from '@/lib/api/watchlist';

const updateEntrySchema = z.object({
  status: z.enum(['not_watched', 'watching', 'completed']),
  rating: z.number().min(1).max(10).optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
  episodesWatched: z.number().min(0).optional(),
  totalEpisodes: z.number().min(0).optional(),
});

type UpdateEntryFormData = z.infer<typeof updateEntrySchema>;

export interface WatchlistDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entry: WatchlistEntry | null;
}

export function WatchlistDetailDrawer({ isOpen, onClose, entry }: WatchlistDetailDrawerProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const updateMutation = useUpdateWatchlistEntry();
  const removeMutation = useRemoveFromWatchlist();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateEntryFormData>({
    resolver: zodResolver(updateEntrySchema),
    defaultValues: {
      status: entry?.status || 'not_watched',
      rating: entry?.rating || '',
      notes: entry?.notes || '',
      episodesWatched: 0,
      totalEpisodes: 0,
    },
  });

  React.useEffect(() => {
    if (entry) {
      reset({
        status: entry.status,
        rating: entry.rating || '',
        notes: entry.notes || '',
        episodesWatched: 0,
        totalEpisodes: 0,
      });
    }
  }, [entry, reset]);

  const watchedRating = watch('rating');
  const episodesWatched = watch('episodesWatched');
  const totalEpisodes = watch('totalEpisodes');

  if (!entry) return null;

  const statusOptions = [
    { value: 'not_watched', label: 'Not Watched' },
    { value: 'watching', label: 'Currently Watching' },
    { value: 'completed', label: 'Completed' },
  ];

  const onSubmit = async (data: UpdateEntryFormData) => {
    if (!entry) return;

    try {
      const updateData: any = {
        status: data.status,
        notes: data.notes || undefined,
      };

      if (data.rating !== undefined && data.rating !== '') {
        updateData.rating = data.rating;
      }

      // For TV shows, include episode progress
      if (
        entry.mediaItem.mediaType === 'tv' &&
        episodesWatched !== undefined &&
        totalEpisodes !== undefined
      ) {
        updateData.notes = data.notes
          ? `${data.notes}\n\nProgress: ${episodesWatched}/${totalEpisodes} episodes`
          : `Progress: ${episodesWatched}/${totalEpisodes} episodes`;
      }

      await updateMutation.mutateAsync({
        id: entry.id,
        data: updateData,
      });

      toast.success('Watchlist entry updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update watchlist entry');
    }
  };

  const handleRemove = async () => {
    if (!entry) return;

    const confirmed = window.confirm('Are you sure you want to remove this from your watchlist?');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await removeMutation.mutateAsync(entry.id);
      toast.success('Removed from watchlist');
      onClose();
    } catch (error) {
      toast.error('Failed to remove from watchlist');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRatingChange = (rating: number | undefined) => {
    setValue('rating', rating || '', { shouldDirty: true });
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={entry.mediaItem.title}
      description={`Manage your watchlist entry for ${entry.mediaItem.title}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Media Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {entry.mediaItem.posterPath && (
                <img
                  src={`https://image.tmdb.org/t/p/w154${entry.mediaItem.posterPath}`}
                  alt={entry.mediaItem.title}
                  className="w-24 h-36 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{entry.mediaItem.title}</h3>
                <p className="text-sm text-gray-600 capitalize mb-2">
                  {entry.mediaItem.mediaType} •{' '}
                  {new Date(entry.mediaItem.releaseDate || '').getFullYear()}
                </p>
                {entry.mediaItem.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {entry.mediaItem.description}
                  </p>
                )}

                {/* Streaming Providers */}
                {entry.mediaItem.streamingProviders &&
                  entry.mediaItem.streamingProviders.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Available on:</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.mediaItem.streamingProviders.map((provider) => (
                          <span
                            key={provider.id}
                            className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                          >
                            {provider.provider}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Select
          label="Status"
          {...register('status')}
          options={statusOptions}
          error={errors.status?.message}
        />

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rating (Optional)</label>
          <RatingInput
            value={watchedRating ? Number(watchedRating) : undefined}
            onChange={handleRatingChange}
            max={10}
          />
        </div>

        {/* Episode Progress (TV shows only) */}
        {entry.mediaItem.mediaType === 'tv' && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Episodes Watched"
              type="number"
              min="0"
              {...register('episodesWatched', { valueAsNumber: true })}
              error={errors.episodesWatched?.message}
            />
            <Input
              label="Total Episodes"
              type="number"
              min="0"
              {...register('totalEpisodes', { valueAsNumber: true })}
              error={errors.totalEpisodes?.message}
            />
          </div>
        )}

        {/* Notes */}
        <Textarea
          label="Notes (Optional)"
          placeholder="Add your thoughts, reactions, or reminders..."
          {...register('notes')}
          error={errors.notes?.message}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            isLoading={updateMutation.isPending}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>

          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={handleRemove}
            disabled={isDeleting || removeMutation.isPending}
            isLoading={isDeleting || removeMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
