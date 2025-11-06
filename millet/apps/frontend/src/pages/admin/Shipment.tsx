"use client"

import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog"
import { useState, useEffect } from "react"
import {
  Package,
  Truck,
  Plus,
  Edit,
  Trash2,
  Loader,
  AlertTriangle,
  Filter,
  ExternalLink,
  Calendar,
  CheckCircle,
} from "lucide-react"
import { shipmentAPI, type Shipment } from "../../api/Shipment"
import { getValidAccessToken } from "../../utils/tokenRefresh"

export function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingShipment, setDeletingShipment] = useState<Shipment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [carrierFilter, setCarrierFilter] = useState<string>("")

  useEffect(() => {
    fetchShipments()
  }, [statusFilter, carrierFilter])

  const fetchShipments = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: any = {}
      if (statusFilter) filters.status = statusFilter
      if (carrierFilter) filters.carrier = carrierFilter

      const response = await shipmentAPI.getAll(filters)
      setShipments(response.data as Shipment[])
    } catch (err: any) {
      console.error("Error fetching shipments:", err)
      setError(err.message || "Failed to load shipments")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (shipment: Shipment) => {
    setDeletingShipment(shipment)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingShipment) return
    setIsDeleting(true)

    try {
      await shipmentAPI.delete(deletingShipment.id)
      setShipments(shipments.filter((s) => s.id !== deletingShipment.id))
      setShowDeleteDialog(false)
      setDeletingShipment(null)
    } catch (err: any) {
      console.error("Error deleting shipment:", err)
      alert(err.message || "Failed to delete shipment")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800 border border-green-300"
      case "OUT_FOR_DELIVERY":
        return "bg-blue-100 text-blue-800 border border-blue-300"
      case "IN_TRANSIT":
        return "bg-amber-100 text-amber-800 border border-amber-300"
      case "PENDING":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300"
      case "FAILED":
        return "bg-red-100 text-red-800 border border-red-300"
      default:
        return "bg-emerald-100 text-emerald-800 border border-emerald-300"
    }
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-emerald-50 py-12">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto text-emerald-600" />
            <p className="mt-4 text-lg text-emerald-700 font-semibold">Loading shipments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-emerald-50 py-12">
      <div className="container mx-auto px-6 sm:px-12 lg:px-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-emerald-900 font-playfair">Shipment Management</h1>
            <p className="text-emerald-700 mt-2 text-lg">Manage all shipments and tracking information</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Shipment
          </Button>
        </div>

        <Card className="mb-6 shadow-lg border-2 border-emerald-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-emerald-900 mb-2">Filter by Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 text-emerald-900 font-medium"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-emerald-900 mb-2">Filter by Carrier</label>
                  <input
                    type="text"
                    value={carrierFilter}
                    onChange={(e) => setCarrierFilter(e.target.value)}
                    placeholder="Enter carrier name"
                    className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 text-emerald-900 placeholder-emerald-500"
                  />
                </div>
              </div>
              {(statusFilter || carrierFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter("")
                    setCarrierFilter("")
                  }}
                  className="border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-semibold"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-2 border-red-300 bg-red-50 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">Error</p>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {shipments.length === 0 ? (
            <Card className="shadow-lg border-2 border-emerald-100">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-emerald-900 mb-2">No Shipments Found</h3>
                <p className="text-emerald-700 mb-6">Create your first shipment to get started</p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Shipment
                </Button>
              </CardContent>
            </Card>
          ) : (
            shipments.map((shipment) => (
              <Card
                key={shipment.id}
                className="shadow-lg hover:shadow-xl transition-shadow border-2 border-emerald-100 bg-white"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-3 rounded-xl shadow-md">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-emerald-900 mb-1">{shipment.carrier}</h3>
                        <p className="text-sm text-emerald-600 font-mono bg-emerald-50 px-2 py-1 rounded">
                          Tracking: {shipment.trackingNumber}
                        </p>
                        {shipment.order && (
                          <p className="text-sm text-emerald-700 mt-1 font-medium">
                            Order: {shipment.order.orderNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(shipment.status)} font-semibold`}>
                      {shipment.status.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4 bg-emerald-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-700">Shipped</p>
                        <p className="text-sm font-semibold text-emerald-900">{formatDate(shipment.shippedAt)}</p>
                      </div>
                    </div>
                    {shipment.estimatedDelivery && (
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-700">Est. Delivery</p>
                          <p className="text-sm font-semibold text-emerald-900">
                            {formatDate(shipment.estimatedDelivery)}
                          </p>
                        </div>
                      </div>
                    )}
                    {shipment.deliveredAt && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-700">Delivered</p>
                          <p className="text-sm font-semibold text-emerald-900">{formatDate(shipment.deliveredAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t-2 border-emerald-100">
                    {shipment.trackingUrl && (
                      <a
                        href={shipment.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-semibold text-sm transition-colors hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Track Online
                      </a>
                    )}
                    <div className="flex-1"></div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedShipment(shipment)
                        setShowEditModal(true)
                      }}
                      className="border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-semibold"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(shipment)}
                      className="border-2 border-red-300 text-red-600 hover:bg-red-100 font-semibold"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-2 border-red-200">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl text-red-800">Delete Shipment</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base text-emerald-700">
              Are you sure you want to delete shipment with tracking number{" "}
              <span className="font-semibold text-emerald-900 font-mono">"{deletingShipment?.trackingNumber}"</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false)
                setDeletingShipment(null)
              }}
              disabled={isDeleting}
              className="border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Shipment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showCreateModal && (
        <CreateShipmentModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            fetchShipments()
          }}
        />
      )}

      {showEditModal && selectedShipment && (
        <EditShipmentModal
          isOpen={showEditModal}
          shipment={selectedShipment}
          onClose={() => {
            setShowEditModal(false)
            setSelectedShipment(null)
            fetchShipments()
          }}
        />
      )}
    </div>
  )
}

function CreateShipmentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    orderId: "",
    carrier: "",
    trackingNumber: "",
    trackingUrl: "",
    status: "PENDING",
    estimatedDelivery: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [orderSearch, setOrderSearch] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchOrders()
    }
  }, [isOpen])

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      const token = await getValidAccessToken()
      const response = await fetch("http://localhost:8000/api/v1/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setOrders(data.data || [])
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
    } finally {
      setLoadingOrders(false)
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.id.toLowerCase().includes(orderSearch.toLowerCase()),
  )

  const handleSubmit = async () => {
    setError(null)

    if (!formData.orderId || !formData.carrier || !formData.trackingNumber) {
      setError("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    try {
      await shipmentAPI.create(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create shipment")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
          <CardTitle className="text-2xl font-bold">Create New Shipment</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4 bg-emerald-50">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-100 border-2 border-red-300 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">
              Order ID <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900 placeholder-emerald-500"
              placeholder="Enter order ID"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">
              Carrier <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.carrier}
              onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900 placeholder-emerald-500"
              placeholder="e.g., FedEx, UPS, DHL"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">
              Tracking Number <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.trackingNumber}
              onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900 placeholder-emerald-500"
              placeholder="Enter tracking number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">Tracking URL</label>
            <input
              type="url"
              value={formData.trackingUrl}
              onChange={(e) => setFormData({ ...formData, trackingUrl: e.target.value })}
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900 placeholder-emerald-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">
              Status <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900 font-medium"
            >
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">Estimated Delivery Date</label>
            <input
              type="date"
              value={formData.estimatedDelivery}
              onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-semibold bg-transparent"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Shipment"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EditShipmentModal({
  isOpen,
  shipment,
  onClose,
}: {
  isOpen: boolean
  shipment: Shipment
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    carrier: shipment.carrier,
    trackingNumber: shipment.trackingNumber,
    trackingUrl: shipment.trackingUrl || "",
    status: shipment.status,
    estimatedDelivery: shipment.estimatedDelivery
      ? new Date(shipment.estimatedDelivery).toISOString().split("T")[0]
      : "",
    deliveredAt: shipment.deliveredAt ? new Date(shipment.deliveredAt).toISOString().split("T")[0] : "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    try {
      await shipmentAPI.update(shipment.id, formData)
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to update shipment")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
          <CardTitle className="text-2xl font-bold">Edit Shipment</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4 bg-emerald-50">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-100 border-2 border-red-300 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">Carrier</label>
            <input
              type="text"
              value={formData.carrier}
              onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">Tracking Number</label>
            <input
              type="text"
              value={formData.trackingNumber}
              onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">Tracking URL</label>
            <input
              type="url"
              value={formData.trackingUrl}
              onChange={(e) => setFormData({ ...formData, trackingUrl: e.target.value })}
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "PENDING" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED",
                })
              }
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900 font-medium"
            >
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">Estimated Delivery Date</label>
            <input
              type="date"
              value={formData.estimatedDelivery}
              onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2">Delivered Date</label>
            <input
              type="date"
              value={formData.deliveredAt}
              onChange={(e) => setFormData({ ...formData, deliveredAt: e.target.value })}
              className="w-full px-4 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-emerald-900"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-semibold bg-transparent"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Shipment"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
