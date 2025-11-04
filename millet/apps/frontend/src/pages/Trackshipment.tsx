import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useState } from "react";
import { Package, Truck, MapPin, Calendar, ExternalLink, Loader, Search, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { shipmentAPI, type Shipment } from "../api/Shipment";

export function TrackShipmentPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await shipmentAPI.trackByNumber(trackingNumber.trim());
      setShipment(response.data as Shipment);
    } catch (err: any) {
      console.error("Error tracking shipment:", err);
      setError(err.message || "Failed to track shipment");
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "OUT_FOR_DELIVERY":
        return <Truck className="w-6 h-6 text-blue-600" />;
      case "IN_TRANSIT":
        return <Package className="w-6 h-6 text-yellow-600" />;
      case "PENDING":
        return <Clock className="w-6 h-6 text-gray-600" />;
      case "FAILED":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Package className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "OUT_FOR_DELIVERY":
        return "bg-blue-100 text-blue-800";
      case "IN_TRANSIT":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      case "FAILED":
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d97706]/10 to-[#2a9d8f]/10 py-12">
      <div className="container mx-auto px-6 sm:px-12 lg:px-24">
        <div className="text-center mb-12">
          <h1 className="font-playfair text-4xl lg:text-5xl font-bold text-[#264653] mb-4">
            Track Your Shipment
          </h1>
          <p className="text-lg text-[#39485C] max-w-2xl mx-auto">
            Enter your tracking number to see the latest updates on your order
          </p>
        </div>

        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={handleTrack} className="space-y-6">
              <div>
                <label
                  htmlFor="trackingNumber"
                  className="block text-sm font-medium text-[#264653] mb-2"
                >
                  Tracking Number
                </label>
                <div className="flex gap-3">
                  <input
                    id="trackingNumber"
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a9d8f] focus:border-transparent outline-none transition-all"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#2a9d8f] hover:bg-[#264653] px-8"
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Track
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {searched && !loading && !error && !shipment && (
          <Card className="max-w-2xl mx-auto mt-8 shadow-xl">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#264653] mb-2">
                No Shipment Found
              </h3>
              <p className="text-[#39485C]">
                We couldn't find a shipment with this tracking number. Please check and try again.
              </p>
            </CardContent>
          </Card>
        )}

        {shipment && (
          <div className="max-w-4xl mx-auto mt-8 space-y-6">
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#2a9d8f] to-[#264653] text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Shipment Details</CardTitle>
                  <Badge className={getStatusColor(shipment.status)}>
                    {shipment.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(shipment.status)}
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-semibold text-[#264653]">
                          {shipment.status.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Truck className="w-6 h-6 text-[#2a9d8f]" />
                      <div>
                        <p className="text-sm text-gray-600">Carrier</p>
                        <p className="font-semibold text-[#264653]">
                          {shipment.carrier}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Package className="w-6 h-6 text-[#2a9d8f]" />
                      <div>
                        <p className="text-sm text-gray-600">Tracking Number</p>
                        <p className="font-semibold text-[#264653] font-mono">
                          {shipment.trackingNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-6 h-6 text-[#2a9d8f]" />
                      <div>
                        <p className="text-sm text-gray-600">Shipped Date</p>
                        <p className="font-semibold text-[#264653]">
                          {formatDate(shipment.shippedAt)}
                        </p>
                      </div>
                    </div>

                    {shipment.estimatedDelivery && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-6 h-6 text-[#2a9d8f]" />
                        <div>
                          <p className="text-sm text-gray-600">
                            Estimated Delivery
                          </p>
                          <p className="font-semibold text-[#264653]">
                            {formatDate(shipment.estimatedDelivery)}
                          </p>
                        </div>
                      </div>
                    )}

                    {shipment.deliveredAt && (
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Delivered On</p>
                          <p className="font-semibold text-[#264653]">
                            {formatDate(shipment.deliveredAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    {shipment.trackingUrl && (
                      <a
                        href={shipment.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#2a9d8f] hover:text-[#264653] font-medium transition-colors"
                      >
                        View on Carrier Website
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {shipment.order && (
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-semibold text-[#264653]">
                        {shipment.order.orderNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Status</p>
                      <Badge className="mt-1">
                        {shipment.order.status}
                      </Badge>
                    </div>
                  </div>

                  {shipment.order.shippingAddress && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Shipping Address
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium text-[#264653]">
                          {shipment.order.shippingAddress.fullName}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {shipment.order.shippingAddress.addressLine1}
                        </p>
                        {shipment.order.shippingAddress.addressLine2 && (
                          <p className="text-sm text-gray-700">
                            {shipment.order.shippingAddress.addressLine2}
                          </p>
                        )}
                        <p className="text-sm text-gray-700">
                          {shipment.order.shippingAddress.city},{" "}
                          {shipment.order.shippingAddress.state}{" "}
                          {shipment.order.shippingAddress.postalCode}
                        </p>
                        <p className="text-sm text-gray-700">
                          {shipment.order.shippingAddress.country}
                        </p>
                        {shipment.order.shippingAddress.phone && (
                          <p className="text-sm text-gray-700 mt-2">
                            Phone: {shipment.order.shippingAddress.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {shipment.order.items && shipment.order.items.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Order Items ({shipment.order.items.length})
                      </p>
                      <div className="space-y-2">
                        {shipment.order.items.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            {item.product?.images?.[0] && (
                              <img
                                src={item.product.images[0].url}
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-[#264653]">
                                {item.product?.name || "Product"}
                              </p>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold text-[#264653]">
                              ₹{item.price}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}