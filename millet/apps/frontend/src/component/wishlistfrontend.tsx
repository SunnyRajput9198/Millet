"use client"

import { useState, useEffect } from "react"
import { Heart, Trash2, ShoppingCart, Package, ArrowLeft, AlertCircle } from "lucide-react"
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

interface WishlistItem {
  id: string
  addedAt: string
  product: Product
}

export function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      setError("")
      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch("http://localhost:8000/api/v1/wishlist", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()

      if (data.success && data.data) {
        setWishlist(data.data.items || [])
      } else {
        setError(data.message || "Failed to load wishlist")
      }
    } catch (err) {
      setError("Error loading wishlist")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (itemId: string) => {
    try {
      setActionLoading((prev) => ({ ...prev, [itemId]: true }))
      setError("")
      setSuccess("")

      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/wishlist/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()

      if (data.success) {
        setWishlist((prev) => prev.filter((item) => item.id !== itemId))
        setSuccess("Product removed from wishlist")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.message || "Failed to remove item")
      }
    } catch (err) {
      setError("Error removing item from wishlist")
      console.error(err)
    } finally {
      setActionLoading((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const clearWishlist = async () => {
    if (!window.confirm("Are you sure you want to clear your entire wishlist?")) {
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

      const response = await fetch("http://localhost:8000/api/v1/wishlist", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await response.json()

      if (data.success) {
        setWishlist([])
        setSuccess("Wishlist cleared successfully")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.message || "Failed to clear wishlist")
      }
    } catch (err) {
      setError("Error clearing wishlist")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (product: Product) => {
    // Implement your add to cart logic here
    alert(`Added ${product.name} to cart`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700/40"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-800 text-stone-50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Heart className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
                <p className="text-amber-100">
                  {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
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
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center space-x-2">
            <div className="flex-shrink-0">✓</div>
            <div>{success}</div>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-stone-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-12 h-12 text-amber-700" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Your wishlist is empty</h2>
            <p className="text-stone-600 mb-6">Start adding products you love to keep track of them!</p>
            <a
              href="/products"
              className="inline-block px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition font-medium"
            >
              Browse Products
            </a>
          </div>
        ) : (
          <>
            {/* Action Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex items-center justify-between border border-stone-200">
              <div className="flex items-center space-x-2 text-stone-700">
                <Package className="w-5 h-5 text-amber-700" />
                <span className="font-medium">
                  {wishlist.length} {wishlist.length === 1 ? "Product" : "Products"}
                </span>
              </div>
              <button
                onClick={clearWishlist}
                className="flex items-center space-x-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>

            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group border border-stone-200"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-stone-100">
                    <img
                      src={item.product.image || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />

                    {/* Out of Stock Overlay */}
                    {!item.product.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-rose-600 text-white px-4 py-2 rounded-lg font-semibold">Out of Stock</span>
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      disabled={actionLoading[item.id]}
                      className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-rose-50 transition disabled:opacity-50"
                      title="Remove from wishlist"
                    >
                      {actionLoading[item.id] ? (
                        <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-700 rounded-full animate-spin"></div>
                      ) : (
                        <Heart className="w-5 h-5 text-amber-700 fill-amber-700" />
                      )}
                    </button>

                    {/* Discount Badge */}
                    {item.product.comparePrice && item.product.comparePrice > item.product.price && (
                      <div className="absolute top-3 left-3 bg-rose-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {Math.round(
                          ((item.product.comparePrice - item.product.price) / item.product.comparePrice) * 100,
                        )}
                        % OFF
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-5">
                    {/* Category */}
                    {item.product.category && (
                      <span className="inline-block text-xs text-amber-700 font-semibold uppercase tracking-wide mb-2">
                        {item.product.category}
                      </span>
                    )}

                    {/* Product Name */}
                    <h3 className="font-bold text-lg text-stone-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                      {item.product.name}
                    </h3>

                    {/* Rating */}
                    {item.product.reviewCount > 0 && (
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < Math.round(item.product.rating) ? "text-amber-500" : "text-stone-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-stone-600">({item.product.reviewCount})</span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-2xl font-bold text-stone-900">${item.product.price.toFixed(2)}</span>
                      {item.product.comparePrice && (
                        <span className="text-sm text-stone-500 line-through">
                          ${item.product.comparePrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stock Info */}
                    {item.product.inStock && (
                      <p className="text-sm text-emerald-600 mb-4">{item.product.stock} in stock</p>
                    )}

                    {/* Actions */}
                    <button
                      onClick={() => addToCart(item.product)}
                      disabled={!item.product.inStock}
                      className="w-full flex items-center justify-center space-x-2 bg-amber-700 text-white py-3 rounded-lg hover:bg-amber-800 transition disabled:bg-stone-300 disabled:cursor-not-allowed font-medium"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{item.product.inStock ? "Add to Cart" : "Out of Stock"}</span>
                    </button>

                    {/* Added Date */}
                    <p className="text-xs text-stone-500 mt-3 text-center">Added {formatDate(item.addedAt)}</p>
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
