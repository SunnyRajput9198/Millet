"use client"

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

export const CartPage = () => {
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
        headers: { Authorization: `Bearer ${accessToken}` },
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
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ quantity: newQuantity }),
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
        headers: { Authorization: `Bearer ${accessToken}` },
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
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          code,
          cartTotal: calculateSubtotal(),
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        setAppliedCoupon({
          code: data.data.code,
          description: data.data.description,
          discount: data.data.discount,
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
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ couponCode: couponCode.trim() }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        setAppliedCoupon({
          code: data.data.coupon.code,
          description: data.data.coupon.description,
          discount: data.data.discountAmount,
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
        headers: { Authorization: `Bearer ${accessToken}` },
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
      <div
        style={{
          minHeight: "100vh",
          backgroundImage: "linear-gradient(to bottom, #faf6f1 0%, #f5f1ed 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              animation: "spin 1s linear infinite",
              borderRadius: "9999px",
              height: "48px",
              width: "48px",
              borderWidth: "2px",
              borderBottomColor: "#8b6f47",
              borderColor: "rgba(139, 111, 71, 0.2)",
              marginBottom: "16px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          ></div>
          <p style={{ color: "#6b5344" }}>Loading your cart...</p>
        </div>
      </div>
    )
  }

  const isEmpty = !cart?.items || cart.items.length === 0

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "linear-gradient(to bottom, #faf6f1 0%, #f5f1ed 100%)",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundImage: "linear-gradient(to right, #8b6f47 0%, #6b5344 100%)",
          color: "white",
          paddingTop: "32px",
          paddingBottom: "32px",
        }}
      >
        <div
          style={{
            maxWidth: "80rem",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: "30px", fontWeight: "bold", marginBottom: "8px" }}>Shopping Cart</h1>
              <p style={{ color: "#e8dcc8" }}>
                {isEmpty ? "Your cart is empty" : `${getTotalItems()} item(s) in cart`}
              </p>
            </div>
            <a
              href="/"
              style={{
                paddingLeft: "16px",
                paddingRight: "16px",
                paddingTop: "8px",
                paddingBottom: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                color: "white",
                textDecoration: "none",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)")}
            >
              ← Continue Shopping
            </a>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "80rem",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingTop: "32px",
          paddingBottom: "32px",
        }}
      >
        {/* Messages */}
        {success && (
          <div
            style={{
              marginBottom: "24px",
              backgroundColor: "#f0fdf4",
              borderWidth: "1px",
              borderColor: "#bbf7d0",
              color: "#15803d",
              paddingLeft: "16px",
              paddingRight: "16px",
              paddingTop: "12px",
              paddingBottom: "12px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Package style={{ width: "20px", height: "20px" }} />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div
            style={{
              marginBottom: "24px",
              backgroundColor: "#fef2f2",
              borderWidth: "1px",
              borderColor: "#fecaca",
              color: "#991b1b",
              paddingLeft: "16px",
              paddingRight: "16px",
              paddingTop: "12px",
              paddingBottom: "12px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle style={{ width: "20px", height: "20px" }} />
            <span>{error}</span>
          </div>
        )}

        {isEmpty ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              paddingTop: "48px",
              paddingBottom: "48px",
              paddingLeft: "48px",
              paddingRight: "48px",
              textAlign: "center",
            }}
          >
            <ShoppingCart
              style={{
                width: "96px",
                height: "96px",
                color: "#d1d5db",
                marginBottom: "24px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", marginBottom: "8px" }}>
              Your cart is empty
            </h2>
            <p style={{ color: "#4b5563", marginBottom: "24px" }}>Add some products to get started!</p>
            <a
              href="/products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                paddingLeft: "24px",
                paddingRight: "24px",
                paddingTop: "12px",
                paddingBottom: "12px",
                backgroundColor: "#8b6f47",
                color: "white",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6b5344")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8b6f47")}
            >
              <span>Browse Products</span>
              <ArrowRight style={{ width: "20px", height: "20px" }} />
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px", gridAutoFlow: "dense" }}>
            {/* Cart Items - uses CSS to make it 2 columns on large screens */}
            <div style={{ gridColumn: "span 1" }}>
              <style>{`
                @media (min-width: 1024px) {
                  .cart-container {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 32px;
                  }
                  .cart-items {
                    grid-column: 1;
                  }
                  .order-summary {
                    grid-column: 2;
                  }
                }
              `}</style>
              <div className="cart-container">
                <div className="cart-items" style={{ gridColumn: "1 / -1" }}>
                  <div
                    style={{
                      backgroundColor: "white",
                      borderRadius: "16px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                      paddingLeft: "24px",
                      paddingRight: "24px",
                      paddingTop: "24px",
                      paddingBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "24px",
                      }}
                    >
                      <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827" }}>Cart Items</h2>
                      {cart.items.length > 0 && (
                        <button
                          onClick={clearCart}
                          style={{
                            fontSize: "14px",
                            color: "#dc2626",
                            fontWeight: "500",
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            transition: "color 0.3s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#b91c1c")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#dc2626")}
                        >
                          Clear Cart
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {cart.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            paddingLeft: "16px",
                            paddingRight: "16px",
                            paddingTop: "16px",
                            paddingBottom: "16px",
                            borderWidth: "1px",
                            borderColor: "#e5e7eb",
                            borderRadius: "8px",
                            transition: "all 0.3s",
                            cursor: "default",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#c4a68a")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                        >
                          {/* Product Image */}
                          <div
                            style={{
                              width: "96px",
                              height: "96px",
                              flexShrink: 0,
                              backgroundColor: "#f3f4f6",
                              borderRadius: "8px",
                              overflow: "hidden",
                            }}
                          >
                            {item.product.images[0]?.url ? (
                              <img
                                src={item.product.images[0].url || "/placeholder.svg"}
                                alt={item.product.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Package style={{ width: "32px", height: "32px", color: "#9ca3af" }} />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3
                              style={{
                                fontSize: "18px",
                                fontWeight: "600",
                                color: "#111827",
                                marginBottom: "4px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {item.product.name}
                            </h3>
                            <p style={{ color: "#8b6f47", fontWeight: "bold", fontSize: "18px" }}>
                              ₹{item.price.toFixed(2)}
                            </p>
                            <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
                              {item.product.stock > 0 ? (
                                <span style={{ color: "#8b6f47" }}>In Stock ({item.product.stock} available)</span>
                              ) : (
                                <span style={{ color: "#dc2626" }}>Out of Stock</span>
                              )}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updatingItem === item.id || item.quantity <= 1}
                              style={{
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: "1px",
                                borderColor: "#d1d5db",
                                borderRadius: "4px",
                                backgroundColor: "white",
                                cursor: updatingItem === item.id || item.quantity <= 1 ? "not-allowed" : "pointer",
                                opacity: updatingItem === item.id || item.quantity <= 1 ? 0.5 : 1,
                                transition: "all 0.3s",
                              }}
                              onMouseEnter={(e) => {
                                if (updatingItem !== item.id && item.quantity > 1) {
                                  e.currentTarget.style.backgroundColor = "#f3f4f6"
                                }
                              }}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                            >
                              <Minus style={{ width: "16px", height: "16px" }} />
                            </button>
                            <span style={{ width: "48px", textAlign: "center", fontWeight: "600" }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updatingItem === item.id || item.quantity >= item.product.stock}
                              style={{
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: "1px",
                                borderColor: "#d1d5db",
                                borderRadius: "4px",
                                backgroundColor: "white",
                                cursor:
                                  updatingItem === item.id || item.quantity >= item.product.stock
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: updatingItem === item.id || item.quantity >= item.product.stock ? 0.5 : 1,
                                transition: "all 0.3s",
                              }}
                              onMouseEnter={(e) => {
                                if (updatingItem !== item.id && item.quantity < item.product.stock) {
                                  e.currentTarget.style.backgroundColor = "#f3f4f6"
                                }
                              }}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                            >
                              <Plus style={{ width: "16px", height: "16px" }} />
                            </button>
                          </div>

                          {/* Item Total & Remove */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                            <p style={{ fontSize: "18px", fontWeight: "bold", color: "#111827" }}>
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={updatingItem === item.id}
                              style={{
                                color: "#dc2626",
                                backgroundColor: "transparent",
                                border: "none",
                                cursor: updatingItem === item.id ? "not-allowed" : "pointer",
                                opacity: updatingItem === item.id ? 0.5 : 1,
                                transition: "all 0.3s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#b91c1c")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#dc2626")}
                            >
                              <Trash2 style={{ width: "20px", height: "20px" }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div
                  className="order-summary"
                  style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                    paddingLeft: "24px",
                    paddingRight: "24px",
                    paddingTop: "24px",
                    paddingBottom: "24px",
                    height: "fit-content",
                    position: "sticky",
                    top: "24px",
                  }}
                >
                  <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", marginBottom: "24px" }}>
                    Order Summary
                  </h2>

                  {/* Coupon Section */}
                  <div
                    style={{
                      marginBottom: "24px",
                      paddingBottom: "24px",
                      borderBottomWidth: "1px",
                      borderColor: "#e5e7eb",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "8px",
                      }}
                    >
                      <Tag style={{ width: "16px", height: "16px" }} />
                      <span>Apply Coupon</span>
                    </label>

                    {appliedCoupon ? (
                      <div
                        style={{
                          backgroundColor: "#f0fdf4",
                          borderWidth: "1px",
                          borderColor: "#bbf7d0",
                          borderRadius: "8px",
                          paddingLeft: "16px",
                          paddingRight: "16px",
                          paddingTop: "16px",
                          paddingBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#15803d" }}>
                            {appliedCoupon.code}
                          </span>
                          <button
                            onClick={removeCoupon}
                            style={{
                              color: "#dc2626",
                              backgroundColor: "transparent",
                              border: "none",
                              cursor: "pointer",
                              transition: "color 0.3s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#b91c1c")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#dc2626")}
                          >
                            <Trash2 style={{ width: "16px", height: "16px" }} />
                          </button>
                        </div>
                        <p style={{ fontSize: "14px", color: "#15803d" }}>{appliedCoupon.description}</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase())
                              setCouponError("")
                            }}
                            placeholder="Enter coupon code"
                            style={{
                              flex: 1,
                              paddingLeft: "16px",
                              paddingRight: "16px",
                              paddingTop: "8px",
                              paddingBottom: "8px",
                              borderWidth: "1px",
                              borderColor: "#d1d5db",
                              borderRadius: "8px",
                              fontSize: "14px",
                              textTransform: "uppercase",
                              outline: "none",
                              transition: "all 0.3s",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = "#8b6f47"
                              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 111, 71, 0.1)"
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = "#d1d5db"
                              e.currentTarget.style.boxShadow = "none"
                            }}
                          />
                          <button
                            onClick={applyCoupon}
                            disabled={applyingCoupon || !couponCode.trim()}
                            style={{
                              paddingLeft: "16px",
                              paddingRight: "16px",
                              paddingTop: "8px",
                              paddingBottom: "8px",
                              backgroundColor: "#8b6f47",
                              color: "white",
                              borderRadius: "8px",
                              border: "none",
                              cursor: applyingCoupon || !couponCode.trim() ? "not-allowed" : "pointer",
                              opacity: applyingCoupon || !couponCode.trim() ? 0.5 : 1,
                              transition: "all 0.3s",
                            }}
                            onMouseEnter={(e) => {
                              if (!applyingCoupon && couponCode.trim()) {
                                e.currentTarget.style.backgroundColor = "#6b5344"
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!applyingCoupon && couponCode.trim()) {
                                e.currentTarget.style.backgroundColor = "#8b6f47"
                              }
                            }}
                          >
                            {applyingCoupon ? "..." : "Apply"}
                          </button>
                        </div>
                        {couponError && (
                          <p style={{ marginTop: "8px", fontSize: "14px", color: "#dc2626" }}>{couponError}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
                      <span>Subtotal</span>
                      <span style={{ fontWeight: "600" }}>₹{calculateSubtotal().toFixed(2)}</span>
                    </div>

                    {appliedCoupon && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#8b6f47" }}>
                        <span>Discount</span>
                        <span style={{ fontWeight: "600" }}>-₹{appliedCoupon.discount.toFixed(2)}</span>
                      </div>
                    )}

                    <div style={{ paddingTop: "12px", borderTopWidth: "1px", borderColor: "#e5e7eb" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#111827",
                        }}
                      >
                        <span>Total</span>
                        <span>₹{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={() => (window.location.href = "/checkout")}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      paddingLeft: "24px",
                      paddingRight: "24px",
                      paddingTop: "16px",
                      paddingBottom: "16px",
                      backgroundColor: "#8b6f47",
                      color: "white",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "18px",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6b5344")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8b6f47")}
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight style={{ width: "20px", height: "20px" }} />
                  </button>

                  <p style={{ textAlign: "center", fontSize: "14px", color: "#9ca3af", marginTop: "16px" }}>
                    Secure checkout with encryption
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


