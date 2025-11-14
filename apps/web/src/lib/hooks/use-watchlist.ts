import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { watchlistApi } from '@/lib/api/watchlist';
import type { CreateWatchlistEntryData, UpdateWatchlistEntryData } from '@/lib/api/watchlist';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

export function useUpdateWatchlistEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWatchlistEntryData }) =>
      watchlistApi.updateWatchlistEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => watchlistApi.removeFromWatchlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}
