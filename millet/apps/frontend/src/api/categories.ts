import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  image?: string;
  isActive: boolean;
}

export const categoryAPI = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      console.log("📦 Categories Response:", response.data);
      
      // Handle different response formats
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error("❌ Category fetch error:", error);
      return []; // Return empty array on error instead of throwing
    }
  },

  // Get single category by ID or slug
  getOne: async (idOrSlug: string): Promise<Category> => {
    const response = await axios.get(`${API_URL}/categories/${idOrSlug}`);
    return response.data.data || response.data;
  },

  // Create new category
  create: async (data: {
    name: string;
    description?: string;
    parentId?: string;
    image?: string;
  }): Promise<Category> => {
    const response = await axios.post(`${API_URL}/categories`, data);
    return response.data.data || response.data;
  },

  // Update category
  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      parentId?: string;
      image?: string;
      isActive?: boolean;
    }
  ): Promise<Category> => {
    const response = await axios.patch(`${API_URL}/categories/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete (soft delete) category
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axios.delete(`${API_URL}/categories/${id}`);
    return response.data;
  },
};