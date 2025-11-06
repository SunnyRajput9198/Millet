"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Download, Eye, Loader, Package } from "lucide-react"
import { getValidAccessToken } from "../../utils/tokenRefresh"

interface Order {
  id: string
  orderNumber: string
  user: {
    username: string
    email: string
  }
  total: number
  status: string
  paymentStatus: string
  createdAt: string
  items: Array<{
    productName: string
    quantity: number
  }>
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const accessToken = await getValidAccessToken()

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      })

      const response = await fetch(`http://localhost:8000/api/v1/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()

      if (data.success) {
        setOrders(data.data.orders)
        setTotalPages(data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const accessToken = await getValidAccessToken()

      const response = await fetch(`http://localhost:8000/api/v1/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        fetchOrders()
      } else {
        alert(data.message || "Failed to update order status")
      }
    } catch (error) {
      console.error("Error updating order:", error)
      alert("Failed to update order status")
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DELIVERED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      SHIPPED: "bg-amber-50 text-amber-700 border border-amber-200",
      PROCESSING: "bg-green-50 text-green-700 border border-green-200",
      PENDING: "bg-yellow-50 text-yellow-700 border border-yellow-200",
      CANCELLED: "bg-red-50 text-red-700 border border-red-200",
    }
    return colors[status] || "bg-slate-50 text-slate-700 border border-slate-200"
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-amber-50 via-green-50 to-emerald-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 via-green-600 to-amber-600 bg-clip-text text-transparent">
            Orders Management
          </h1>
          <p className="text-green-700 mt-2">Manage and track all customer orders from your farm-to-table operations</p>
        </div>

        <button className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition shadow-md">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-emerald-100 p-5 backdrop-blur-sm bg-opacity-95">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchOrders()}
              className="w-full pl-10 pr-4 py-2.5 border border-green-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-800 placeholder-gray-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-green-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-800 font-medium"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchOrders}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition flex items-center justify-center space-x-2 font-medium shadow-sm"
          >
            <Filter className="w-4 h-4" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-emerald-100 overflow-hidden backdrop-blur-sm bg-opacity-98">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-14 h-14 text-green-300 mx-auto mb-4" />
            <p className="text-green-700 text-lg font-medium">No orders found</p>
            <p className="text-green-600 text-sm mt-1">Your farm orders will appear here</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-green-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-emerald-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{order.orderNumber}</div>
                        <div className="text-xs text-amber-600 font-medium mt-1">{order.paymentStatus}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{order.user.username || "N/A"}</div>
                        <div className="text-xs text-green-600">{order.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">{order.items.length} item(s)</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-fit">
                          ₹{order.total.toLocaleString("en-IN")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)} border-none cursor-pointer hover:shadow-sm transition`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-medium">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => (window.location.href = `/admin/orders/${order.id}`)}
                          className="text-emerald-600 hover:text-emerald-800 font-semibold p-1.5 rounded hover:bg-emerald-50 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-green-200 bg-gradient-to-r from-emerald-50 to-green-50 flex items-center justify-between">
              <div className="text-sm font-medium text-green-700">
                Page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border-2 border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed text-green-700 font-medium transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border-2 border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed text-green-700 font-medium transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
