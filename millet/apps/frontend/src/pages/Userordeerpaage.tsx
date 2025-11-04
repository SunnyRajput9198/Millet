import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Truck, CheckCircle, XCircle, Clock, Eye, Loader, AlertTriangle } from "lucide-react";
import { orderAPI, type Order } from "../api/Order";

export function UserOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderAPI.getAll();
      setOrders(response.data as Order[]);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to load orders");
      if (err.message === "Authentication required") {
        navigate("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "SHIPPED":
        return <Truck className="w-5 h-5 text-blue-600" />;
      case "PROCESSING":
        return <Package className="w-5 h-5 text-yellow-600" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-gray-600" />;
      case "CANCELLED":
      case "REFUNDED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "SHIPPED":
        return "bg-blue-100 text-blue-800";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
      case "REFUNDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d97706]/10 to-[#2a9d8f]/10 py-12">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto text-[#2a9d8f]" />
            <p className="mt-4 text-lg text-[#39485C]">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d97706]/10 to-[#2a9d8f]/10 py-12">
      <div className="container mx-auto px-6 sm:px-12 lg:px-24">
        <div className="mb-8">
          <h1 className="font-playfair text-4xl font-bold text-[#264653] mb-2">
            My Orders
          </h1>
          <p className="text-[#39485C]">
            Track and manage your order history
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Error</p>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {orders.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#264653] mb-2">
                No Orders Yet
              </h3>
              <p className="text-[#39485C] mb-6">
                Start shopping to create your first order
              </p>
              <Button
                onClick={() => navigate("/products")}
                className="bg-[#2a9d8f] hover:bg-[#264653]"
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-[#2a9d8f]/10 to-[#264653]/10 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-[#264653]">
                        Order #{order.orderNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      <span className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Order Items ({order.items.length})
                      </h4>
                      <div className="space-y-2">
                        {order.items.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                          >
                            {item.product?.images?.[0] ? (
                              <img
                                src={item.product.images[0].url}
                                alt={item.productName}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#264653] truncate">
                                {item.productName}
                              </p>
                              <p className="text-xs text-gray-600">
                                Qty: {item.quantity} × {formatPrice(item.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-sm text-gray-600 pl-2">
                            +{order.items.length - 2} more item(s)
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Order Summary
                      </h4>
                      <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">{formatPrice(order.subtotal)}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span className="font-medium">-{formatPrice(order.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax</span>
                          <span className="font-medium">{formatPrice(order.tax)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-medium">
                            {order.shippingFee === 0 ? "FREE" : formatPrice(order.shippingFee)}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between">
                            <span className="font-semibold text-[#264653]">Total</span>
                            <span className="font-bold text-[#264653] text-lg">
                              {formatPrice(order.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900">
                            Tracking Number
                          </p>
                          <p className="text-sm text-blue-700 font-mono">
                            {order.trackingNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="bg-[#2a9d8f] hover:bg-[#264653]"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    
                    {order.trackingNumber && (
                      <Button
                        onClick={() => navigate(`/track-shipment?tracking=${order.trackingNumber}`)}
                        variant="outline"
                        className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white"
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Track Shipment
                      </Button>
                    )}

                    {order.status === "PENDING" && (
                      <Button
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this order?")) {
                            orderAPI.cancel(order.id).then(() => fetchOrders());
                          }
                        }}
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white ml-auto"
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}