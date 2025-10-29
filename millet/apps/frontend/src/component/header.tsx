"use client"

import { useState, useEffect, useRef } from "react"
import { ShoppingCart, Search, Menu, X, User, Heart, LogOut } from "lucide-react"
import { getValidAccessToken, clearAuthData } from '../utils/tokenRefresh'

interface UserData {
  id: string
  email: string
  username?: string
  role: string
}

export function Header() { 
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check and refresh user data on mount
    checkAndRefreshUser()
  }, [])

  const checkAndRefreshUser = async () => {
    try {
      const userData = localStorage.getItem("user")
      if (!userData) {
        setUser(null)
        return
      }

      setUser(JSON.parse(userData))

      // Validate token and refresh if needed
      const accessToken = await getValidAccessToken()
      
      if (!accessToken) {
        // Token refresh failed, clear everything
        setUser(null)
        clearAuthData()
        return
      }

      // Fetch fresh user data to ensure role is up to date
      const response = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { "Authorization": `Bearer ${accessToken}` }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Update user data in state and localStorage
          setUser(data.data)
          localStorage.setItem("user", JSON.stringify(data.data))
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = () => {
    clearAuthData()
    setUser(null)
    setShowUserMenu(false)
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-full">
               <img src="/keithson.jpg" alt="Nature Millets Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-gray-900">Nature Millets</span>
              <span className="text-xs text-gray-500 -mt-1">Purely Natural</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-sm font-medium hover:text-green-600 transition-colors">
              Home
            </a>
            <a href="/products" className="text-sm font-medium hover:text-green-600 transition-colors">
              Products
            </a>
            <a href="/about" className="text-sm font-medium hover:text-green-600 transition-colors">
              About Us
            </a>
            <a href="/benefits" className="text-sm font-medium hover:text-green-600 transition-colors">
              Health Benefits
            </a>
            <a href="/contact" className="text-sm font-medium hover:text-green-600 transition-colors">
              Contact
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <Heart className="h-5 w-5 text-gray-600" />
            </button>
            
            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </span>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.username || "User"}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        {user.role}
                      </span>
                    </div>
                    <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      My Profile
                    </a>
                    <a href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      My Orders
                    </a>
                    <a href="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Wishlist
                    </a>
                    {user.role === "ADMIN" && (
                      <a href="/admin" className="block px-4 py-2 text-sm text-green-700 hover:bg-gray-50 font-medium">
                        Admin Panel
                      </a>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2 border-t border-gray-100 mt-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="/auth"
                className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition text-sm font-medium"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </a>
            )}

            <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="flex flex-col space-y-4 p-4">
              <a href="/" className="text-sm font-medium hover:text-green-600 transition-colors">
                Home
              </a>
              <a href="/products" className="text-sm font-medium hover:text-green-600 transition-colors">
                Products
              </a>
              <a href="/about" className="text-sm font-medium hover:text-green-600 transition-colors">
                About Us
              </a>
              <a href="/benefits" className="text-sm font-medium hover:text-green-600 transition-colors">
                Health Benefits
              </a>
              <a href="/contact" className="text-sm font-medium hover:text-green-600 transition-colors">
                Contact
              </a>
              
              <div className="flex items-center space-x-4 pt-4 border-t">
                <button className="p-2 hover:bg-gray-100 rounded-full transition">
                  <Search className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition">
                  <Heart className="h-5 w-5 text-gray-600" />
                </button>
                
                {user ? (
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.username || "User"}</p>
                        <span className="text-xs text-gray-500">{user.role}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-lg flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <a
                    href="/auth"
                    className="flex-1 text-center px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition text-sm font-medium"
                  >
                    Login / Sign Up
                  </a>
                )}
                
                <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
                  <ShoppingCart className="h-5 w-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}