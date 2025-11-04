import { getValidAccessToken } from "../utils/tokenRefresh";

const API_BASE_URL = "http://localhost:8000/api/v1";

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string | null;
  status: "PENDING" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED";
  estimatedDelivery?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order?: {
    id: string;
    orderNumber: string;
    userId: string;
    total: number;
    status: string;
    items?: any[];
    shippingAddress?: any;
    user?: any;
  };
}

export interface ShipmentResponse {
  success: boolean;
  message: string;
  data: Shipment | Shipment[];
}

export const shipmentAPI = {
  // Track shipment by tracking number (public)
  trackByNumber: async (trackingNumber: string): Promise<ShipmentResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/shipments/track/${trackingNumber}`
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to track shipment");
    return data;
  },

  // Get shipments for an order (user)
  getOrderShipments: async (orderId: string): Promise<ShipmentResponse> => {
    const token = await getValidAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/shipments/orders/${orderId}/shipments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch shipments");
    return data;
  },

  // Admin: Get all shipments
  getAll: async (filters?: {
    status?: string;
    carrier?: string;
  }): Promise<ShipmentResponse> => {
    const token = await getValidAccessToken();
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.carrier) params.append("carrier", filters.carrier);

    const response = await fetch(
      `${API_BASE_URL}/shipments?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch shipments");
    return data;
  },

  // Admin: Get single shipment
  getById: async (id: string): Promise<ShipmentResponse> => {
    const token = await getValidAccessToken();
    const response = await fetch(`${API_BASE_URL}/shipments/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch shipment");
    return data;
  },

  // Admin: Create shipment
  create: async (shipmentData: {
    orderId: string;
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    status: string;
    estimatedDelivery?: string;
  }): Promise<ShipmentResponse> => {
    const token = await getValidAccessToken();
    const response = await fetch(`${API_BASE_URL}/shipments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shipmentData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create shipment");
    return data;
  },

  // Admin: Update shipment
  update: async (
    id: string,
    shipmentData: {
      carrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      status?: string;
      estimatedDelivery?: string;
      deliveredAt?: string;
    }
  ): Promise<ShipmentResponse> => {
    const token = await getValidAccessToken();
    const response = await fetch(`${API_BASE_URL}/shipments/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shipmentData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update shipment");
    return data;
  },

  // Admin: Delete shipment
  delete: async (id: string): Promise<ShipmentResponse> => {
    const token = await getValidAccessToken();
    const response = await fetch(`${API_BASE_URL}/shipments/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete shipment");
    return data;
  },
};

export default shipmentAPI;