import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { searchApi } from '@/lib/api/search';

const DEBOUNCE_DELAY = 500; // 500ms debounce

export function useSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });
}
