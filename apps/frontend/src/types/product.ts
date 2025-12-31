export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  stock: number;
  images: string[];
  brand?: string;
  sku?: string;
  colors?: string[];
  sizes?: string[];
  tags?: string[];
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: Product[];
  lastKey?: string;
  total: number;
}
