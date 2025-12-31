import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../services/api';
import type { Product } from '../types/product';

interface UseProductReturn {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProduct(productId: string | null): UseProductReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);
  const lastProductIdRef = useRef<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setError('Product ID is required');
      setLoading(false);
      return;
    }

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

      const response = await apiClient.getProduct(productId);
      const isCurrentRequest = abortControllerRef.current === controller;

      if (isCurrentRequest) {
        setProduct(response.product);
      }
    } catch (err) {
      const isCurrentRequest = abortControllerRef.current === controller;
      if (!isCurrentRequest || signal.aborted) {
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load product';
      setError(errorMessage);
      setProduct(null);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [productId]);

  const refetch = useCallback(async () => {
    await fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (!productId || productId === lastProductIdRef.current) {
      return;
    }

    lastProductIdRef.current = productId;
    fetchProduct();

    return () => {
      if (abortControllerRef.current && isLoadingRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [productId, fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch,
  };
}

