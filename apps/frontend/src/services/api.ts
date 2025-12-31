import type { Product, ProductListResponse } from '../types/product';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      limit: number;
      count: number;
      hasMore: boolean;
      lastKey?: string | null;
      total?: number;
    };
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    requestId?: string;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const successResponse = await this.requestWithMeta<T>(endpoint, options);
    return successResponse.data;
  }

  private async requestWithMeta<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiSuccessResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const jsonData: ApiResponse<unknown> = await response.json();
      
      if (!jsonData.success || !response.ok) {
        const errorResponse = jsonData as ApiErrorResponse;
        const errorMessage = errorResponse.error?.message || `HTTP error! status: ${response.status}`;
        
        const error = new Error(errorMessage) as Error & {
          statusCode?: number;
          requestId?: string;
        };
        error.statusCode = errorResponse.error?.statusCode || response.status;
        error.requestId = errorResponse.error?.requestId || errorResponse.meta?.requestId;
        
        throw error;
      }

      return jsonData as ApiSuccessResponse<T>;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error(
          'Unable to connect to the server. Please check your connection and try again.'
        ) as Error & { isNetworkError?: boolean };
        networkError.isNetworkError = true;
        throw networkError;
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('An unexpected error occurred');
    }
  }

  async getProducts(params?: {
    limit?: number;
    lastKey?: string;
  }): Promise<ProductListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.lastKey) {
      queryParams.append('lastKey', encodeURIComponent(params.lastKey));
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/products${queryString ? `?${queryString}` : ''}`;
    
    const successResponse = await this.requestWithMeta<{ products: Product[] }>(endpoint);
    
    let products: Product[] = [];
    if (successResponse.data) {
      if (Array.isArray(successResponse.data.products)) {
        products = successResponse.data.products;
      } else if (Array.isArray(successResponse.data)) {
        products = successResponse.data as unknown as Product[];
      }
    }
    
    const lastKey = successResponse.meta?.pagination?.lastKey;
    const total = successResponse.meta?.pagination?.total ?? products.length;
    
    return {
      products,
      lastKey: lastKey === null || lastKey === undefined ? undefined : String(lastKey),
      total,
    };
  }

  async getProduct(id: string): Promise<{ product: Product }> {
    const endpoint = `/api/v1/products/${id}`;
    return await this.request<{ product: Product }>(endpoint);
  }
}

export const apiClient = new ApiClient(API_URL);
