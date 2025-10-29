import { useState, useEffect } from "react"
import { Clock, Trash2, Heart, ArrowLeft, AlertCircle, Eye } from "lucide-react"
import { getValidAccessToken } from "../utils/tokenRefresh"

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  comparePrice?: number
  image: string
  inStock: boolean
  stock: number
  category?: string
  rating: number
  reviewCount: number
}

interface RecentlyViewedItem {
  viewedAt: string
  product: Product
}


export function RecentlyViewedPage() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchRecentlyViewed()
  }, [])

  const fetchRecentlyViewed = async () => {
    try {
      setLoading(true)
      setError("")
      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch("http://localhost:8000/api/v1/recently-viewed?limit=20", {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const data = await response.json()

      if (data.success && data.data) {
        setRecentlyViewed(data.data.products || [])
      } else {
        setError(data.message || "Failed to load recently viewed products")
      }
    } catch (err) {
      setError("Error loading recently viewed products")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const removeProduct = async (productId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [productId]: true }))
      setError("")
      setSuccess("")

      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/recently-viewed/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const data = await response.json()

      if (data.success) {
        setRecentlyViewed(prev => prev.filter(item => item.product.id !== productId))
        setSuccess("Product removed from history")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.message || "Failed to remove product")
      }
    } catch (err) {
      setError("Error removing product from history")
      console.error(err)
    } finally {
      setActionLoading(prev => ({ ...prev, [productId]: false }))
    }
  }

  const clearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your viewing history?")) {
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch("http://localhost:8000/api/v1/recently-viewed", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const data = await response.json()

      if (data.success) {
        setRecentlyViewed([])
        setSuccess("History cleared successfully")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.message || "Failed to clear history")
      }
    } catch (err) {
      setError("Error clearing history")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addToWishlist = async (productId: string) => {
    try {
      const accessToken = await getValidAccessToken()
      if (!accessToken) return

      const response = await fetch("http://localhost:8000/api/v1/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ productId })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess("Added to wishlist!")
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const viewed = new Date(dateString)
    const diffInMs = now.getTime() - viewed.getTime()
    const diffInMins = Math.floor(diffInMs / 60000)
    const diffInHours = Math.floor(diffInMs / 3600000)
    const diffInDays = Math.floor(diffInMs / 86400000)

    if (diffInMins < 1) return "Just now"
    if (diffInMins < 60) return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
    if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
    
    return viewed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold mb-2">Recently Viewed</h1>
                <p className="text-green-100">
                  {recentlyViewed.length} {recentlyViewed.length === 1 ? 'product' : 'products'} in your history
                </p>
              </div>
            </div>
            <a
              href="/"
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center space-x-2">
            <div className="flex-shrink-0">✓</div>
            <div>{success}</div>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* Empty State */}
        {recentlyViewed.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Eye className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No viewing history yet</h2>
            <p className="text-gray-600 mb-6">
              Products you view will appear here for quick access later
            </p>
            <a
              href="/products"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Browse Products
            </a>
          </div>
        ) : (
          <>
            {/* Action Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-700">
                <Eye className="w-5 h-5 text-green-600" />
                <span className="font-medium">
                  {recentlyViewed.length} {recentlyViewed.length === 1 ? 'Product' : 'Products'}
                </span>
              </div>
              <button
                onClick={clearHistory}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear History</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentlyViewed.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <a href={`/products/${item.product.slug}`}>
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </a>

                    {/* Out of Stock Overlay */}
                    {!item.product.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex flex-col space-y-2">
                      <button
                        onClick={() => addToWishlist(item.product.id)}
                        className="bg-white p-2 rounded-full shadow-md hover:bg-green-50 transition"
                        title="Add to wishlist"
                      >
                        <Heart className="w-5 h-5 text-green-600" />
                      </button>
                      <button
                        onClick={() => removeProduct(item.product.id)}
                        disabled={actionLoading[item.product.id]}
                        className="bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition disabled:opacity-50"
                        title="Remove from history"
                      >
                        {actionLoading[item.product.id] ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-5 h-5 text-red-600" />
                        )}
                      </button>
                    </div>

                    {/* Discount Badge */}
                    {item.product.comparePrice && item.product.comparePrice > item.product.price && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {Math.round(((item.product.comparePrice - item.product.price) / item.product.comparePrice) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-5">
                    {/* Viewed Time */}
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>Viewed {getTimeAgo(item.viewedAt)}</span>
                    </div>

                    {/* Category */}
                    {item.product.category && (
                      <span className="inline-block text-xs text-green-600 font-semibold uppercase tracking-wide mb-2">
                        {item.product.category}
                      </span>
                    )}

                    {/* Product Name */}
                    <a href={`/products/${item.product.slug}`}>
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] hover:text-green-600 transition">
                        {item.product.name}
                      </h3>
                    </a>

                    {/* Rating */}
                    {item.product.reviewCount > 0 && (
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < Math.round(item.product.rating)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({item.product.reviewCount})
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        ${item.product.price.toFixed(2)}
                      </span>
                      {item.product.comparePrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${item.product.comparePrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stock Info */}
                    {item.product.inStock && (
                      <p className="text-sm text-green-600 mb-4">
                        {item.product.stock} in stock
                      </p>
                    )}

                    {/* Action Button */}
                    <a
                      href={`/products/${item.product.slug}`}
                      className="block w-full text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Utility hook to track product views - use this in your product detail page
export function useTrackProductView(productId: string | undefined) {
  useEffect(() => {
    if (!productId) return

    const trackView = async () => {
      try {
        const accessToken = await getValidAccessToken()
        if (!accessToken) return

        await fetch("http://localhost:8000/api/v1/recently-viewed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ productId })
        })
      } catch (err) {
        console.error("Failed to track product view:", err)
      }
    }

    trackView()
  }, [productId])
}