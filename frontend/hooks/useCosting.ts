'use client';

import { useState, useCallback, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import api from '@/lib/api';
import type { CostingInput, CostingResult } from '@/types';

/**
 * Hook for live costing calculations with debouncing.
 * Automatically recalculates whenever the input changes.
 */
export function useCosting() {
  const [result, setResult] = useState<CostingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const calculate = useCallback(async (input: Partial<CostingInput>) => {
    // Require at minimum quantity and unit cost
    if (!input.quantity || !input.unitSupplierCost || !input.exchangeRate || !input.incoterm) {
      setResult(null);
      return;
    }

    // Cancel previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await api.post<CostingResult>('/costing/calculate', input, {
        signal: abortRef.current.signal,
      });
      setResult(res.data);
    } catch (err: unknown) {
      if ((err as Error).name !== 'CanceledError') {
        setError('Calculation failed');
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, calculate, reset };
}
