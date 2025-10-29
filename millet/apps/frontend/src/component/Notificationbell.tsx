import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { getValidAccessToken } from "../utils/tokenRefresh"

interface NotificationBellProps {
  className?: string
}

export default function NotificationBell({ className = "" }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUnreadCount()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      setLoading(true)
      const accessToken = await getValidAccessToken()
      
      if (!accessToken) {
        return
      }

      const response = await fetch(
        "http://localhost:8000/api/v1/notifications?isRead=false",
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      const data = await response.json()

      if (data.success && data.data) {
        setUnreadCount(data.data.unreadCount)
      }
    } catch (err) {
      console.error("Error fetching notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <a
      href="/notifications"
      className={`relative p-2 hover:bg-gray-100 rounded-lg transition ${className}`}
      title="Notifications"
    >
      <Bell className="w-6 h-6 text-gray-700" />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-full px-1.5 animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </a>
  )
}