import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useState, useEffect } from "react";
import { Package, Truck, MapPin, CreditCard, Calendar, CheckCircle, XCircle, Clock, ArrowLeft, Loader, AlertTriangle, ExternalLink } from "lucide-react";
import { orderAPI, type Order } from "../api/Order";

interface OrderDetailPageProps {
  orderId: string;
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderAPI.getById(orderId);
      setOrder(response.data as Order);
    } catch (err: any) {
      console.error("Error fetching order:", err);
      setError(err.message || "Failed to load order");
      if (err.message === "Authentication required") {
        window.location.href = "/auth";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !confirm("Are you sure you want to cancel this order?")) return;

    try {
      await orderAPI.cancel(order.id);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || "Failed to cancel order");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "SHIPPED":
        return <Truck className="w-6 h-6 text-blue-600" />;
      case "PROCESSING":
        return <Package className="w-6 h-6 text-yellow-600" />;
      case "PENDING":
        return <Clock className="w-6 h-6 text-gray-600" />;
      case "CANCELLED":
      case "REFUNDED":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Package className="w-6 h-6 text-gray-600" />;
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

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
            <p className="mt-4 text-lg text-[#39485C]">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d97706]/10 to-[#2a9d8f]/10 py-12">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-800 mb-2">
                {error || "Order not found"}
              </h3>
              <Button
                onClick={() => window.location.href = "/orders"}
                className="bg-[#2a9d8f] hover:bg-[#264653] mt-4"
              >
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d97706]/10 to-[#2a9d8f]/10 py-12">
      <div className="container mx-auto px-6 sm:px-12 lg:px-24">
        <Button
          onClick={() => window.location.href = "/orders"}
          variant="outline"
          className="mb-6 border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>

        <div className="space-y-6">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-[#2a9d8f] to-[#264653] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Order #{order.orderNumber}</CardTitle>
                  <p className="text-white/80 mt-1">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <Badge className={`${getStatusColor(order.status)} text-lg`}>
                  <span className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-[#2a9d8f] flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-semibold text-[#264653]">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="w-6 h-6 text-[#2a9d8f] flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold text-[#264653]">{order.paymentMethod}</p>
                    <Badge className="mt-1">{order.paymentStatus}</Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-6 h-6 text-[#2a9d8f] flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="font-semibold text-[#264653]">{order.items.length} item(s)</p>
                  </div>
                </div>
              </div>

              {order.status === "PENDING" && (
                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={handleCancelOrder}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    Cancel Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {order.shipments && order.shipments.length > 0 && (
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-6 h-6 text-[#2a9d8f]" />
                  Shipment Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.shipments.map((shipment: any) => (
                  <div key={shipment.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getStatusColor(shipment.status)}>
                        {shipment.status.replace(/_/g, " ")}
                      </Badge>
                      {shipment.trackingUrl && (
                        <a
                          href={shipment.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#2a9d8f] hover:text-[#264653] font-medium text-sm"
                        >
                          Track Online
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Carrier</p>
                        <p className="font-semibold text-[#264653]">{shipment.carrier}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tracking Number</p>
                        <p className="font-semibold text-[#264653] font-mono">{shipment.trackingNumber}</p>
                      </div>
                      {shipment.shippedAt && (
                        <div>
                          <p className="text-gray-600">Shipped Date</p>
                          <p className="font-semibold text-[#264653]">{formatDate(shipment.shippedAt)}</p>
                        </div>
                      )}
                      {shipment.estimatedDelivery && (
                        <div>
                          <p className="text-gray-600">Estimated Delivery</p>
                          <p className="font-semibold text-[#264653]">{formatDate(shipment.estimatedDelivery)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-[#2a9d8f]" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.shippingAddress ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-[#264653]">{order.shippingAddress.fullName}</p>
                    <p className="text-gray-700">{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && (
                      <p className="text-gray-700">{order.shippingAddress.addressLine2}</p>
                    )}
                    <p className="text-gray-700">
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    </p>
                    <p className="text-gray-700">{order.shippingAddress.country}</p>
                    {order.shippingAddress.phone && (
                      <p className="text-gray-700 mt-2">Phone: {order.shippingAddress.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No shipping address</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-[#2a9d8f]" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.billingAddress ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-[#264653]">{order.billingAddress.fullName}</p>
                    <p className="text-gray-700">{order.billingAddress.addressLine1}</p>
                    {order.billingAddress.addressLine2 && (
                      <p className="text-gray-700">{order.billingAddress.addressLine2}</p>
                    )}
                    <p className="text-gray-700">
                      {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}
                    </p>
                    <p className="text-gray-700">{order.billingAddress.country}</p>
                    {order.billingAddress.phone && (
                      <p className="text-gray-700 mt-2">Phone: {order.billingAddress.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No billing address</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#264653]">{item.productName}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Price: {formatPrice(item.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#264653] text-lg">{formatPrice(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Tax (GST 18%)</span>
                  <span className="font-semibold">{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping Fee</span>
                  <span className="font-semibold">
                    {order.shippingFee === 0 ? "FREE" : formatPrice(order.shippingFee)}
                  </span>
                </div>
                <div className="pt-3 border-t-2 border-gray-300">
                  <div className="flex justify-between text-xl font-bold text-[#264653]">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}