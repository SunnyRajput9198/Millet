import { getValidAccessToken } from '../utils/tokenRefresh';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Types
export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
    images?: Array<{
      url: string;
      isPrimary: boolean;
    }>;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ProductReviewsResponse {
  success: boolean;
  message: string;
  data: {
    reviews: Review[];
    stats: ReviewStats;
  };
}

export interface CreateReviewData {
  rating: number;
  comment: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

// API Service
export const reviewAPI = {
  /**
   * Get all reviews for a specific product
   */
  async getProductReviews(productId: string): Promise<ProductReviewsResponse> {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch reviews');
    }
    
    return response.json();
  },

  /**
   * Create a review for a product (requires authentication)
   */
  async createReview(productId: string, data: CreateReviewData): Promise<{ success: boolean; message: string; data: Review }> {
    const accessToken = await getValidAccessToken();
    
    const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create review');
    }

    return response.json();
  },

  /**
   * Get all reviews by the current user
   */
  async getMyReviews(): Promise<{ success: boolean; message: string; data: Review[] }> {
    const accessToken = await getValidAccessToken();
    
    const response = await fetch(`${API_BASE_URL}/reviews/my-reviews`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch your reviews');
    }

    return response.json();
  },

  /**
   * Update a review (requires authentication and ownership)
   */
  async updateReview(reviewId: string, data: UpdateReviewData): Promise<{ success: boolean; message: string; data: Review }> {
    const accessToken = await getValidAccessToken();
    
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update review');
    }

    return response.json();
  },

  /**
   * Delete a review (requires authentication and ownership)
   */
  async deleteReview(reviewId: string): Promise<{ success: boolean; message: string }> {
    const accessToken = await getValidAccessToken();
    
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete review');
    }

    return response.json();
  },
};