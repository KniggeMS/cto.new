import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { watchlistApi } from '@/lib/api/watchlist';
import type {
  CreateWatchlistEntryData,
  UpdateWatchlistEntryData,
  WatchlistEntry,
} from '@/lib/api/watchlist';
import type { BulkImportRequest } from '@infocus/shared';

export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.getWatchlist,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWatchlistEntryData) => watchlistApi.addToWatchlist(data),
    onMutate: async (newEntry) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['watchlist'] });

      // Snapshot the previous value
      const previousWatchlist = queryClient.getQueryData<WatchlistEntry[]>(['watchlist']);

      // Create optimistic entry
      const optimisticEntry: WatchlistEntry = {
        id: `temp-${Date.now()}`,
        mediaItemId: `temp-media-${Date.now()}`,
        mediaItem: {
          id: `temp-media-${Date.now()}`,
          tmdbId: newEntry.tmdbId,
          title: 'Loading...',
          mediaType: newEntry.mediaType,
          posterPath: undefined,
          releaseDate: undefined,
        },
        status: newEntry.status,
        rating: newEntry.rating,
        notes: newEntry.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dateAdded: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
      };

      // Optimistically update to the new value
      queryClient.setQueryData<WatchlistEntry[]>(['watchlist'], (old = []) => [
        optimisticEntry,
        ...old,
      ]);

      return { previousWatchlist };
    },
    onError: (err: any, newEntry: any, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist'], context.previousWatchlist);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

export function useUpdateWatchlistEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWatchlistEntryData }) =>
      watchlistApi.updateWatchlistEntry(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['watchlist'] });

      // Snapshot the previous value
      const previousWatchlist = queryClient.getQueryData<WatchlistEntry[]>(['watchlist']);

      // Optimistically update the entry
      queryClient.setQueryData<WatchlistEntry[]>(['watchlist'], (old = []) =>
        old.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                ...data,
                updatedAt: new Date().toISOString(),
                dateUpdated: new Date().toISOString(),
              }
            : entry,
        ),
      );

      return { previousWatchlist };
    },
    onError: (err: any, variables: any, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist'], context.previousWatchlist);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => watchlistApi.removeFromWatchlist(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['watchlist'] });

      // Snapshot the previous value
      const previousWatchlist = queryClient.getQueryData<WatchlistEntry[]>(['watchlist']);

      // Optimistically remove the entry
      queryClient.setQueryData<WatchlistEntry[]>(['watchlist'], (old = []) =>
        old.filter((entry) => entry.id !== id),
      );

      return { previousWatchlist };
    },
    onError: (err: any, variables: any, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist'], context.previousWatchlist);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

// Import/Export hooks
export function useWatchlistImportPreview() {
  return useMutation({
    mutationFn: (file: File) => watchlistApi.importWatchlistPreview(file),
  });
}

export function useConfirmWatchlistImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkImportRequest) => watchlistApi.confirmWatchlistImport(request),
    onSuccess: () => {
      // Invalidate watchlist query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

export function useWatchlistExport() {
  return useMutation({
    mutationFn: (format: 'csv' | 'json') => watchlistApi.exportWatchlist(format),
  });
}
