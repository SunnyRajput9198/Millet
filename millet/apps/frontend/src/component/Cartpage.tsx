import { useState, useEffect } from "react"
import { ShoppingCart, Trash2, Plus, Minus, Tag, ArrowRight, Package, AlertCircle } from "lucide-react"
import { getValidAccessToken } from "../utils/tokenRefresh"

// Export as default for route import

interface CartItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    price: number
    stock: number
    images: Array<{
      url: string
      isPrimary: boolean
    }>
  }
}

interface Cart {
  id: string
  userId: string
  couponCode: string | null
  items: CartItem[]
  createdAt: string
  updatedAt: string
}

interface CouponData {
  code: string
  description: string
  discount: number
}

export  function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [updatingItem, setUpdatingItem] = useState<string | null>(null)
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null)
  const [couponError, setCouponError] = useState("")
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch("http://localhost:8000/api/v1/cart", {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const data = await response.json()

      if (data.success && data.data) {
        setCart(data.data.cart)
        
        // If cart has a coupon applied, fetch coupon details
        if (data.data.cart.couponCode) {
          await validateCoupon(data.data.cart.couponCode, false)
        }
      } else {
        setError("Failed to load cart")
      }
    } catch (err) {
      setError("Error loading cart")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      setUpdatingItem(itemId)
      setError("")
      
      const accessToken = await getValidAccessToken()
      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/cart/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      })

      const data = await response.json()

      if (data.success) {
        await fetchCart()
        setSuccess("Cart updated successfully")
        setTimeout(() => setSuccess(""), 2000)
      } else {
        setError(data.message || "Failed to update quantity")
      }
    } catch (err) {
      setError("Error updating cart")
      console.error(err)
    } finally {
      setUpdatingItem(null)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!confirm("Remove this item from cart?")) return

    try {
      setUpdatingItem(itemId)
      setError("")
      
      const accessToken = await getValidAccessToken()
      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/cart/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const data = await response.json()

      if (data.success) {
        await fetchCart()
        setSuccess("Item removed from cart")
        setTimeout(() => setSuccess(""), 2000)
      } else {
        setError(data.message || "Failed to remove item")
      }
    } catch (err) {
      setError("Error removing item")
      console.error(err)
    } finally {
      setUpdatingItem(null)
    }
  }

  const validateCoupon = async (code: string, showMessages = true) => {
    try {
      const accessToken = await getValidAccessToken()
      if (!accessToken) return

      const response = await fetch("http://localhost:8000/api/v1/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          code,
          cartTotal: calculateSubtotal()
        })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setAppliedCoupon({
          code: data.data.code,
          description: data.data.description,
          discount: data.data.discount
        })
        if (showMessages) {
          setSuccess("Coupon applied successfully!")
          setTimeout(() => setSuccess(""), 3000)
        }
        return true
      } else {
        if (showMessages) {
          setCouponError(data.message || "Invalid coupon")
        }
        return false
      }
    } catch (err) {
      if (showMessages) {
        setCouponError("Error validating coupon")
      }
      return false
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    try {
      setApplyingCoupon(true)
      setCouponError("")
      
      const accessToken = await getValidAccessToken()
      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch("http://localhost:8000/api/v1/cart/apply-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ couponCode: couponCode.trim() })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setAppliedCoupon({
          code: data.data.coupon.code,
          description: data.data.coupon.description,
          discount: data.data.discountAmount
        })
        setCouponCode("")
        setSuccess("Coupon applied successfully!")
        setTimeout(() => setSuccess(""), 3000)
        await fetchCart()
      } else {
        setCouponError(data.message || "Failed to apply coupon")
      }
    } catch (err) {
      setCouponError("Error applying coupon")
      console.error(err)
    } finally {
      setApplyingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setSuccess("Coupon removed")
    setTimeout(() => setSuccess(""), 2000)
  }

  const clearCart = async () => {
    if (!confirm("Are you sure you want to clear your entire cart?")) return

    try {
      setLoading(true)
      const accessToken = await getValidAccessToken()
      if (!accessToken) {
        window.location.href = "/auth"
        return
      }

      const response = await fetch("http://localhost:8000/api/v1/cart", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const data = await response.json()

      if (data.success) {
        await fetchCart()
        setAppliedCoupon(null)
        setSuccess("Cart cleared successfully")
        setTimeout(() => setSuccess(""), 2000)
      } else {
        setError(data.message || "Failed to clear cart")
      }
    } catch (err) {
      setError("Error clearing cart")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculateSubtotal = () => {
    if (!cart?.items) return 0
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = appliedCoupon?.discount || 0
    return Math.max(0, subtotal - discount)
  }

  const getTotalItems = () => {
    if (!cart?.items) return 0
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    )
  }

  const isEmpty = !cart?.items || cart.items.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
              <p className="text-green-100">
                {isEmpty ? "Your cart is empty" : `${getTotalItems()} item(s) in cart`}
              </p>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              ← Continue Shopping
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {isEmpty ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <a
              href="/products"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <span>Browse Products</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Cart Items</h2>
                  {cart.items.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-green-300 transition"
                    >
                      {/* Product Image */}
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {item.product.images[0]?.url ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-green-600 font-bold text-lg">
                          ₹{item.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.product.stock > 0 ? (
                            <span className="text-green-600">In Stock ({item.product.stock} available)</span>
                          ) : (
                            <span className="text-red-600">Out of Stock</span>
                          )}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={updatingItem === item.id || item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={updatingItem === item.id || item.quantity >= item.product.stock}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="flex flex-col items-end space-y-2">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updatingItem === item.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                {/* Coupon Section */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4" />
                    <span>Apply Coupon</span>
                  </label>
                  
                  {appliedCoupon ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-green-700">
                          {appliedCoupon.code}
                        </span>
                        <button
                          onClick={removeCoupon}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-green-600">{appliedCoupon.description}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase())
                            setCouponError("")
                          }}
                          placeholder="Enter coupon code"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                        />
                        <button
                          onClick={applyCoupon}
                          disabled={applyingCoupon || !couponCode.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {applyingCoupon ? "..." : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="mt-2 text-sm text-red-600">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-semibold">-₹{appliedCoupon.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => window.location.href = "/checkout"}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Secure checkout with encryption
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
