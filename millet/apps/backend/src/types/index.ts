import type { Request } from 'express';
import { prisma } from '@repo/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN';
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ProductQuery extends PaginationQuery {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  tags?: string;
  inStock?: string;
  featured?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  tokenVersion?: number;
}
