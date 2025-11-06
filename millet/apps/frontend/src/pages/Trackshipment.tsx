"use client"

import type React from "react"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { useState } from "react"
import {
  Package,
  Truck,
  MapPin,
  Calendar,
  ExternalLink,
  Loader,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Leaf,
} from "lucide-react"
import { shipmentAPI, type Shipment } from "../api/Shipment"

export function TrackShipmentPage() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number")
      return
    }

    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      const response = await shipmentAPI.trackByNumber(trackingNumber.trim())
      setShipment(response.data as Shipment)
    } catch (err: any) {
      console.error("Error tracking shipment:", err)
      setError(err.message || "Failed to track shipment")
      setShipment(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="w-6 h-6 text-emerald-600" />
      case "OUT_FOR_DELIVERY":
        return <Truck className="w-6 h-6 text-teal-600" />
      case "IN_TRANSIT":
        return <Package className="w-6 h-6 text-amber-600" />
      case "PENDING":
        return <Clock className="w-6 h-6 text-emerald-500" />
      case "FAILED":
        return <XCircle className="w-6 h-6 text-red-600" />
      default:
        return <Package className="w-6 h-6 text-emerald-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300"
      case "OUT_FOR_DELIVERY":
        return "bg-teal-100 text-teal-800 border border-teal-300"
      case "IN_TRANSIT":
        return "bg-amber-100 text-amber-800 border border-amber-300"
      case "PENDING":
        return "bg-green-100 text-green-800 border border-green-300"
      case "FAILED":
        return "bg-red-100 text-red-800 border border-red-300"
      default:
        return "bg-slate-100 text-slate-800 border border-slate-300"
    }
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-12">
      <div className="container mx-auto px-6 sm:px-12 lg:px-24">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Leaf className="w-8 h-8 text-emerald-700" />
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 bg-clip-text text-transparent">
              Track Your Shipment
            </h1>
            <Leaf className="w-8 h-8 text-teal-700" />
          </div>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto font-medium">
            Enter your tracking number to see the latest updates on your order
          </p>
        </div>

        <Card className="max-w-2xl mx-auto shadow-xl border-emerald-200 hover:shadow-2xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-b-4 border-amber-400">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <CardTitle>Tracking Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 bg-white">
            <form onSubmit={handleTrack} className="space-y-6">
              <div>
                <label htmlFor="trackingNumber" className="block text-sm font-semibold text-emerald-900 mb-3">
                  Tracking Number
                </label>
                <div className="flex gap-3">
                  <input
                    id="trackingNumber"
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="flex-1 px-4 py-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-emerald-50 text-slate-800 placeholder-slate-500"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 font-semibold shadow-lg hover:shadow-xl transition-all"
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
                <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {searched && !loading && !error && !shipment && (
          <Card className="max-w-2xl mx-auto mt-8 shadow-xl border-emerald-200">
            <CardContent className="p-12 text-center bg-gradient-to-br from-emerald-50 to-teal-50">
              <Package className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-emerald-900 mb-2">No Shipment Found</h3>
              <p className="text-slate-700">
                We couldn't find a shipment with this tracking number. Please check and try again.
              </p>
            </CardContent>
          </Card>
        )}

        {shipment && (
          <div className="max-w-4xl mx-auto mt-8 space-y-6">
            {/* Shipment Details Card */}
            <Card className="shadow-2xl border-emerald-200 hover:shadow-3xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-600 text-white border-b-4 border-amber-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6" />
                    <CardTitle className="text-2xl">Shipment Details</CardTitle>
                  </div>
                  <Badge className={`${getStatusColor(shipment.status)} text-sm font-semibold px-4 py-2`}>
                    {shipment.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 bg-white">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-5">
                    {/* Status */}
                    <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      {getStatusIcon(shipment.status)}
                      <div>
                        <p className="text-sm text-slate-600 font-semibold">Status</p>
                        <p className="font-bold text-emerald-900">{shipment.status.replace(/_/g, " ")}</p>
                      </div>
                    </div>

                    {/* Carrier */}
                    <div className="flex items-start gap-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <Truck className="w-6 h-6 text-teal-700 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-600 font-semibold">Carrier</p>
                        <p className="font-bold text-teal-900">{shipment.carrier}</p>
                      </div>
                    </div>

                    {/* Tracking Number */}
                    <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <Package className="w-6 h-6 text-amber-700 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-600 font-semibold">Tracking Number</p>
                        <p className="font-bold text-amber-900 font-mono text-sm">{shipment.trackingNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-5">
                    {/* Shipped Date */}
                    <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <Calendar className="w-6 h-6 text-green-700 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-600 font-semibold">Shipped Date</p>
                        <p className="font-bold text-green-900">{formatDate(shipment.shippedAt)}</p>
                      </div>
                    </div>

                    {/* Estimated Delivery */}
                    {shipment.estimatedDelivery && (
                      <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <Clock className="w-6 h-6 text-indigo-700 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-600 font-semibold">Estimated Delivery</p>
                          <p className="font-bold text-indigo-900">{formatDate(shipment.estimatedDelivery)}</p>
                        </div>
                      </div>
                    )}

                    {/* Delivered On */}
                    {shipment.deliveredAt && (
                      <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <CheckCircle className="w-6 h-6 text-emerald-700 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-600 font-semibold">Delivered On</p>
                          <p className="font-bold text-emerald-900">{formatDate(shipment.deliveredAt)}</p>
                        </div>
                      </div>
                    )}

                    {/* Carrier Link */}
                    {shipment.trackingUrl && (
                      <a
                        href={shipment.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
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
              <Card className="shadow-2xl border-emerald-200">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-b-4 border-amber-400">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    <CardTitle className="text-xl">Order Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 bg-white space-y-6">
                  {/* Order Number and Status */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-sm text-slate-600 font-semibold mb-1">Order Number</p>
                      <p className="font-bold text-emerald-900">{shipment.order.orderNumber}</p>
                    </div>
                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <p className="text-sm text-slate-600 font-semibold mb-2">Order Status</p>
                      <Badge className="bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-900 font-semibold border border-teal-300">
                        {shipment.order.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {shipment.order.shippingAddress && (
                    <div>
                      <p className="text-sm text-slate-600 mb-3 flex items-center gap-2 font-semibold">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                        Shipping Address
                      </p>
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-lg border-2 border-emerald-200">
                        <p className="font-bold text-emerald-900 mb-2">{shipment.order.shippingAddress.fullName}</p>
                        <p className="text-sm text-slate-700">{shipment.order.shippingAddress.addressLine1}</p>
                        {shipment.order.shippingAddress.addressLine2 && (
                          <p className="text-sm text-slate-700">{shipment.order.shippingAddress.addressLine2}</p>
                        )}
                        <p className="text-sm text-slate-700">
                          {shipment.order.shippingAddress.city}, {shipment.order.shippingAddress.state}{" "}
                          {shipment.order.shippingAddress.postalCode}
                        </p>
                        <p className="text-sm text-slate-700">{shipment.order.shippingAddress.country}</p>
                        {shipment.order.shippingAddress.phone && (
                          <p className="text-sm text-slate-700 mt-2 font-semibold">
                            Phone: {shipment.order.shippingAddress.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  {shipment.order.items && shipment.order.items.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-600 mb-4 font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-700" />
                        Order Items ({shipment.order.items.length})
                      </p>
                      <div className="space-y-3">
                        {shipment.order.items.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-200 hover:shadow-md transition-shadow"
                          >
                            {item.product?.images?.[0] && (
                              <img
                                src={item.product.images[0].url || "/placeholder.svg"}
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded-lg border border-emerald-300"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-bold text-emerald-900">{item.product?.name || "Product"}</p>
                              <p className="text-sm text-slate-600 font-medium">Quantity: {item.quantity}</p>
                            </div>
                            <p className="font-bold text-teal-900 text-lg">₹{item.price}</p>
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
  )
}
