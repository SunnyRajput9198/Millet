"use client"

import { useState, useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Leaf,
} from "lucide-react"
import { getValidAccessToken, clearAuthData } from "../utils/tokenRefresh"

export function AdminLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        navigate("/auth")
        return
      }

      const response = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()

      if (data.success && data.data.role === "ADMIN") {
        setUser(data.data)
      } else {
        navigate("/")
      }
    } catch (error) {
      console.error("Error checking admin access:", error)
      navigate("/")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthData()
    navigate("/")
  }

  const menuItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/products", label: "Products", icon: Package },
    { path: "/admin/categories", label: "Categories", icon: FolderTree },
    { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/settings", label: "Settings", icon: Settings },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-gradient-to-b from-emerald-900 via-teal-900 to-emerald-950 border-r border-emerald-700 transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-emerald-700">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-md">
                <Leaf className="w-6 h-6 text-emerald-900" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">Farm Admin</div>
                <div className="text-xs text-emerald-200">Natural Products</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-emerald-700 rounded-lg transition text-emerald-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-900 shadow-md font-semibold"
                    : "text-emerald-100 hover:bg-emerald-700 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Decorative divider */}
        <div className="px-3 py-4">
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-600 to-transparent"></div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-emerald-700 bg-emerald-900">
          <div className={`flex items-center ${sidebarOpen ? "space-x-3" : "justify-center"}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-emerald-900 font-bold">{user?.username?.[0]?.toUpperCase() || "A"}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.username || "Admin"}</p>
                <p className="text-xs text-emerald-200">{user?.role}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full mt-3 flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium shadow"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-gradient-to-r from-white via-emerald-50 to-teal-50 border-b border-emerald-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
              Farm Dashboard
            </h1>
            <Leaf className="w-6 h-6 text-emerald-600" />
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
              <input
                type="text"
                placeholder="Search products, orders..."
                className="pl-10 pr-4 py-2 border-2 border-emerald-200 bg-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition w-64 text-sm text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-emerald-100 rounded-lg transition text-emerald-600">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            </button>

            {/* Back to Site */}
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition text-sm font-semibold shadow-md"
            >
              Back to Store
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
