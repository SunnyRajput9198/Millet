import { getValidAccessToken } from "../utils/tokenRefresh";

const API_BASE_URL = "http://localhost:8000/api/v1";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  price: number;
  total: number;
  commission: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    images: Array<{ url: string; isPrimary: boolean }>;
  };
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentMethod: "CARD" | "PAYPAL" | "COD" | "BANK_TRANSFER" | "WALLET";
  subtotal: number;
  tax: number;
  shippingFee: number;
  discount: number;
  total: number;
  trackingNumber?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  refundedAt?: Date | null;
  items: OrderItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
  shipments?: any[];
  transactions?: any[];
  refunds?: any[];
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: Order | Order[];
}

export const orderAPI = {
  // Get all orders for current user
  getAll: async (): Promise<OrderResponse> => {
    const token = await getValidAccessToken();
    if (!token) throw new Error("Authentication required");

    const response = await fetch(`${API_BASE_URL}/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch orders");
    return data;
  },

  // Get single order by ID
  getById: async (orderId: string): Promise<OrderResponse> => {
    const token = await getValidAccessToken();
    if (!token) throw new Error("Authentication required");

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch order");
    return data;
  },

  // Create order (checkout)
  create: async (orderData: {
    shippingAddressId: string;
    billingAddressId: string;
    paymentMethod: string;
    notes?: string;
  }): Promise<OrderResponse> => {
    const token = await getValidAccessToken();
    if (!token) throw new Error("Authentication required");

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create order");
    return data;
  },

  // Cancel order
  cancel: async (orderId: string, reason?: string): Promise<OrderResponse> => {
    const token = await getValidAccessToken();
    if (!token) throw new Error("Authentication required");

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to cancel order");
    return data;
  },

  // Admin: Update order status
  updateStatus: async (
    orderId: string,
    status: string,
    trackingNumber?: string
  ): Promise<OrderResponse> => {
    const token = await getValidAccessToken();
    if (!token) throw new Error("Authentication required");

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, trackingNumber }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update order status");
    return data;
  },

  // Admin: Update payment status
  updatePayment: async (
    orderId: string,
    paymentStatus: string,
    paymentId?: string
  ): Promise<OrderResponse> => {
    const token = await getValidAccessToken();
    if (!token) throw new Error("Authentication required");

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentStatus, paymentId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update payment status");
    return data;
  },
};

export default orderAPI;