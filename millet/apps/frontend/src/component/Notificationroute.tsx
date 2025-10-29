import { useState, useEffect } from "react"
import { Bell, Check, Trash2, Package, Tag, AlertCircle, CheckCheck, X } from "lucide-react"
import { getValidAccessToken } from "../utils/tokenRefresh"

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "ORDER" | "PROMOTION" | "SYSTEM"
  isRead: boolean
  data?: any
  createdAt: string
}

interface NotificationsData {
  notifications: Notification[]
  unreadCount: number
}

export  function NotificationsPage() {
  const [data, setData] = useState<NotificationsData>({ notifications: [], unreadCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [filter, typeFilter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError("")
      
      const accessToken = await getValidAccessToken()
      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const params = new URLSearchParams()
      if (filter === "unread") {
        params.append("isRead", "false")
      }
      if (typeFilter !== "all") {
        params.append("type", typeFilter)
      }

      const response = await fetch(
        `http://localhost:8000/api/v1/notifications?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const result = await response.json()

      if (result.success && result.data) {
        setData(result.data)
      } else {
        setError("Failed to load notifications")
      }
    } catch (err) {
      setError("Error loading notifications")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      setActionLoading(id)
      const accessToken = await getValidAccessToken()
      if (!accessToken) return

      const response = await fetch(
        `http://localhost:8000/api/v1/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const result = await response.json()

      if (result.success) {
        await fetchNotifications()
        setSuccess("Notification marked as read")
        setTimeout(() => setSuccess(""), 2000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const markAllAsRead = async () => {
    try {
      setLoading(true)
      const accessToken = await getValidAccessToken()
      if (!accessToken) return

      const response = await fetch(
        "http://localhost:8000/api/v1/notifications/mark-all-read",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const result = await response.json()

      if (result.success) {
        await fetchNotifications()
        setSuccess("All notifications marked as read")
        setTimeout(() => setSuccess(""), 2000)
      }
    } catch (err) {
      setError("Error marking all as read")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const deleteNotification = async (id: string) => {
    if (!confirm("Delete this notification?")) return

    try {
      setActionLoading(id)
      const accessToken = await getValidAccessToken()
      if (!accessToken) return

      const response = await fetch(
        `http://localhost:8000/api/v1/notifications/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const result = await response.json()

      if (result.success) {
        await fetchNotifications()
        setSuccess("Notification deleted")
        setTimeout(() => setSuccess(""), 2000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteAllNotifications = async () => {
    if (!confirm("Delete all notifications? This action cannot be undone.")) return

    try {
      setLoading(true)
      const accessToken = await getValidAccessToken()
      if (!accessToken) return

      const response = await fetch(
        "http://localhost:8000/api/v1/notifications",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const result = await response.json()

      if (result.success) {
        await fetchNotifications()
        setSuccess("All notifications deleted")
        setTimeout(() => setSuccess(""), 2000)
      }
    } catch (err) {
      setError("Error deleting notifications")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ORDER":
        return <Package className="w-5 h-5 text-blue-600" />
      case "PROMOTION":
        return <Tag className="w-5 h-5 text-green-600" />
      case "SYSTEM":
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case "ORDER":
        return "bg-blue-50 border-blue-200"
      case "PROMOTION":
        return "bg-green-50 border-green-200"
      case "SYSTEM":
        return "bg-orange-50 border-orange-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  if (loading && data.notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Notifications</h1>
              <p className="text-green-100">
                {data.unreadCount > 0
                  ? `You have ${data.unreadCount} unread notification${data.unreadCount > 1 ? 's' : ''}`
                  : "You're all caught up!"}
              </p>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === "all"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({data.notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === "unread"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Unread ({data.unreadCount})
              </button>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="ORDER">Orders</option>
                <option value="PROMOTION">Promotions</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {data.unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}
              {data.notifications.length > 0 && (
                <button
                  onClick={deleteAllNotifications}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete all</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {data.notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Bell className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {filter === "unread" ? "No unread notifications" : "No notifications"}
            </h2>
            <p className="text-gray-600">
              {filter === "unread"
                ? "You're all caught up! Check back later for new updates."
                : "When you receive notifications, they'll appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-md border-2 transition-all hover:shadow-lg ${
                  notification.isRead ? "border-gray-200" : "border-green-300"
                } ${notification.isRead ? "" : getNotificationBgColor(notification.type)}`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">{notification.message}</p>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <span className="capitalize">{notification.type.toLowerCase()}</span>
                            <span>•</span>
                            <span>{formatDate(notification.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          disabled={actionLoading === notification.id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                          title="Mark as read"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        disabled={actionLoading === notification.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}