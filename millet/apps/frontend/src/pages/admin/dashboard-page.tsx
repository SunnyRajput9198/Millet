import { useState, useEffect } from 'react'
import { 
  TrendingUp, DollarSign, ShoppingBag, UserCheck, 
  ArrowUpRight, ArrowDownRight, Package, AlertTriangle,
  Loader, Calendar, Filter
} from 'lucide-react'
import { getValidAccessToken } from '../../utils/tokenRefresh'

interface DashboardStats {
  overview: {
    totalRevenue: number
    revenueChange: number
    totalOrders: number
    ordersChange: number
    totalProducts: number
    productsChange: number
    totalUsers: number
    usersChange: number
  }
  ordersByStatus: {
    PENDING: number
    PROCESSING: number
    SHIPPED: number
    DELIVERED: number
    CANCELLED: number
    REFUNDED: number
  }
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
    trend: number
  }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    customerName: string
    total: number
    status: string
    createdAt: string
  }>
  lowStockProducts: Array<{
    id: string
    name: string
    stock: number
  }>
  revenueChart: Array<{
    date: string
    revenue: number
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('30') // days

  useEffect(() => {
    fetchDashboardStats()
  }, [dateRange])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError('')
      
      const accessToken = await getValidAccessToken()
      if (!accessToken) {
        window.location.href = '/auth'
        return
      }

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))

      const response = await fetch(
        `http://localhost:8000/api/v1/admin/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.message || 'Failed to load dashboard stats')
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DELIVERED: 'bg-green-100 text-green-700',
      SHIPPED: 'bg-blue-100 text-blue-700',
      PROCESSING: 'bg-yellow-100 text-yellow-700',
      PENDING: 'bg-orange-100 text-orange-700',
      CANCELLED: 'bg-red-100 text-red-700',
      REFUNDED: 'bg-purple-100 text-purple-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className={`flex items-center text-sm font-medium ${
              stats.overview.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.overview.revenueChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {Math.abs(stats.overview.revenueChange).toFixed(1)}%
            </span>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.overview.totalRevenue)}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <span className={`flex items-center text-sm font-medium ${
              stats.overview.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.overview.ordersChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {Math.abs(stats.overview.ordersChange).toFixed(1)}%
            </span>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.overview.totalOrders}</p>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-purple-600 text-sm font-medium">
              {stats.overview.productsChange > 0 ? '+' : ''}{stats.overview.productsChange}
            </span>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Products</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.overview.totalProducts}</p>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <UserCheck className="w-6 h-6 text-orange-600" />
            </div>
            <span className={`flex items-center text-sm font-medium ${
              stats.overview.usersChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.overview.usersChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {Math.abs(stats.overview.usersChange).toFixed(1)}%
            </span>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Users</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.overview.totalUsers}</p>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Orders by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(stats.ordersByStatus).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(status)}`}>
                {status}
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <a
                href="/admin/orders"
                className="text-green-600 text-sm font-medium hover:text-green-700"
              >
                View All
              </a>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{formatDate(order.createdAt)}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No recent orders</div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Top Selling Products</h2>
          </div>
          <div className="p-6 space-y-4">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{product.sales} sales</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {product.trend !== 0 && (
                    <span className={`flex items-center text-sm font-medium ${
                      product.trend >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {Math.abs(product.trend).toFixed(1)}%
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No product data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 mb-2">Low Stock Alert</h3>
              <p className="text-orange-800 text-sm mb-4">
                {stats.lowStockProducts.length} product(s) are running low on stock
              </p>
              <div className="space-y-2">
                {stats.lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <span className="font-medium text-gray-900">{product.name}</span>
                    <span className="text-orange-600 font-bold">{product.stock} left</span>
                  </div>
                ))}
              </div>
              {stats.lowStockProducts.length > 5 && (
                <a
                  href="/admin/products"
                  className="inline-block mt-4 text-orange-700 font-medium text-sm hover:text-orange-800"
                >
                  View all low stock products →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}