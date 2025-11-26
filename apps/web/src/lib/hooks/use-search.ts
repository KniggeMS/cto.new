import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { searchApi, type SearchResponse } from '@/lib/api/search';

const DEBOUNCE_DELAY = 500; // 500ms debounce

export function useSearch(query: string, page: number = 1) {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [debouncedPage, setDebouncedPage] = useState(page);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setDebouncedPage(page);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [query, page]);

  return useQuery<SearchResponse>({
    queryKey: ['search', debouncedQuery, debouncedPage],
    queryFn: () => searchApi.search(debouncedQuery, debouncedPage),
    enabled: debouncedQuery.length > 2,
  });
}
