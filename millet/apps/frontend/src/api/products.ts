import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Image interface for product images
export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
}

// Review interface
export interface ProductReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

// Variant interface
export interface ProductVariant {
  id: string;
  name?: string;
  sku?: string;
  price?: number;
  stock?: number;
  attributes?: Record<string, any>;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: string;
  comparePrice?: string;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  tags?: string[];
  inStock: boolean;
  sku?: string;
  badge?: string;
  shortDescription?: string;
  images?: ProductImage[]; // Added images array
  fullDetails?: {
    description?: string;
    images?: ProductImage[];
    category?: any;
    variants?: ProductVariant[];
    reviews?: ProductReview[];
    stock?: number;
    sku?: string;
    tags?: string[];
  };
}

export const productAPI = {
  // Get all products with optional filters
  getAll: async (filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    tag?: string;
  }): Promise<{ success: boolean; message: string; data: Product[] }> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.minPrice) params.append("minPrice", filters.minPrice.toString());
    if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
    if (filters?.tag) params.append("tag", filters.tag);

    const response = await axios.get(`${API_URL}/products?${params.toString()}`);
    return response.data;
  },

  // Get single product by slug (Added this method)
  getBySlug: async (slug: string): Promise<{ success: boolean; message: string; data: Product }> => {
    const response = await axios.get(`${API_URL}/products/${slug}`);
    return response.data;
  },

  // Get single product by slug (keeping both for compatibility)
  getOne: async (slug: string): Promise<{ success: boolean; message: string; data: Product }> => {
    const response = await axios.get(`${API_URL}/products/${slug}`);
    return response.data;
  },

  // Get products by category
  getByCategory: async (
    categorySlug: string
  ): Promise<{ success: boolean; message: string; data: Product[] }> => {
    const response = await axios.get(`${API_URL}/products/category/${categorySlug}`);
    return response.data;
  },

  // Search products
  search: async (
    query: string
  ): Promise<{ success: boolean; message: string; data: Product[] }> => {
    const response = await axios.get(`${API_URL}/products/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Create new product
  create: async (data: {
    name: string;
    description?: string;
    price?: number;
    comparePrice?: number;
    stock?: number;
    sku?: string;
    categoryId?: string;
    tags?: string[];
  }): Promise<{ success: boolean; message: string; data: Product }> => {
    const response = await axios.post(`${API_URL}/products`, data);
    return response.data;
  },

  // Update product
  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      comparePrice?: number;
      stock?: number;
      sku?: string;
      categoryId?: string;
      tags?: string[];
    }
  ): Promise<{ success: boolean; message: string; data: Product }> => {
    const response = await axios.patch(`${API_URL}/products/${id}`, data);
    return response.data;
  },

  // Delete product
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`${API_URL}/products/${id}`);
    return response.data;
  },
};