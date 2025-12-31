import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/api';
import type { Product, ProductListResponse } from '../types/product';

interface UseProductsOptions {
  limit?: number;
  lastKey?: string;
  enabled?: boolean;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  lastKey: string | undefined;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useProducts(
  options: UseProductsOptions = {}
): UseProductsReturn {
  const {
    limit = 20,
    lastKey: initialLastKey,
    enabled = true,
  } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | undefined>(initialLastKey);
  const [hasMore, setHasMore] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);
  const lastFetchParamsRef = useRef<{ limit: number; enabled: boolean } | null>(null);
  const lastKeyRef = useRef<string | undefined>(initialLastKey);

  const fetchProducts = useCallback(
    async (append: boolean = false, currentLastKey?: string) => {
      if (isLoadingRef.current) {
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const signal = controller.signal;

      try {
        isLoadingRef.current = true;
        setLoading(true);
        setError(null);

        const response: ProductListResponse = await apiClient.getProducts({
          limit,
          lastKey: append ? (currentLastKey ?? lastKeyRef.current) : undefined,
        });

        const newProducts = Array.isArray(response?.products) ? response.products : [];
        const isCurrentRequest = abortControllerRef.current === controller;
        
        if (isCurrentRequest) {
          if (append) {
            setProducts((prev: Product[]) => [...prev, ...newProducts]);
          } else {
            setProducts(newProducts);
          }

          const newLastKey = response?.lastKey;
          setLastKey(newLastKey);
          lastKeyRef.current = newLastKey;
          setHasMore(!!newLastKey);
        }
      } catch (err) {
        const isCurrentRequest = abortControllerRef.current === controller;
        if (!isCurrentRequest || signal.aborted) {
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load products';
        setError(errorMessage);
        if (!append) {
          setProducts([]);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
          isLoadingRef.current = false;
        }
      }
    },
    [limit]
  );

  const loadMore = useCallback(async () => {
    if (!loading && hasMore && !isLoadingRef.current) {
      await fetchProducts(true, lastKeyRef.current);
    }
  }, [loading, hasMore, fetchProducts]);

  const refetch = useCallback(async () => {
    await fetchProducts(false);
  }, [fetchProducts]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      isLoadingRef.current = false;
      lastFetchParamsRef.current = null;
      return;
    }

    const currentParams = { limit, enabled };
    const paramsMatch = lastFetchParamsRef.current &&
      lastFetchParamsRef.current.limit === currentParams.limit &&
      lastFetchParamsRef.current.enabled === currentParams.enabled;

    if (isLoadingRef.current || paramsMatch) {
      return;
    }

    lastFetchParamsRef.current = currentParams;
    fetchProducts(false);

    return () => {
      if (abortControllerRef.current && isLoadingRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, limit, fetchProducts]);

  return {
    products,
    loading,
    error,
    hasMore,
    lastKey,
    loadMore,
    refetch,
  };
}
