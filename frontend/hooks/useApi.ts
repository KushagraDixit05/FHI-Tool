'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { PaginatedResponse, ApiError } from '@/types';
import type { AxiosError } from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic hook for one-off API calls (mutations, detail fetches).
 * For list data with pagination, prefer direct api calls in server components
 * or SWR. This is for client-side mutations and imperative fetches.
 */
export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      method: 'get' | 'post' | 'put' | 'patch' | 'delete',
      url: string,
      payload?: unknown
    ): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });
      try {
        const response = await api[method]<T>(url, payload);
        setState({ data: response.data, loading: false, error: null });
        return response.data;
      } catch (err) {
        const axiosErr = err as AxiosError<ApiError>;
        const message =
          axiosErr.response?.data?.error ||
          axiosErr.response?.data?.message ||
          'Something went wrong';
        setState({ data: null, loading: false, error: message });
        throw err;
      }
    },
    []
  );

  return { ...state, execute };
}

/**
 * Hook for paginated list fetching.
 */
export function usePaginatedApi<T>() {
  const [data, setData] = useState<PaginatedResponse<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (url: string, params?: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<PaginatedResponse<T>>(url, { params });
        setData(response.data);
      } catch (err) {
        const axiosErr = err as AxiosError<ApiError>;
        setError(axiosErr.response?.data?.error || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, fetch };
}
