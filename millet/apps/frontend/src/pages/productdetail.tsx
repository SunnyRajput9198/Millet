"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Star, ShoppingCart, Heart, ArrowLeft, Package, Shield, Truck } from "lucide-react"
import { productAPI, type Product } from "../api/products"
import ProductReviews from "../component/Productreview"
import AddReviewModal from "../component/Addmodelreview"

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchProduct()
      checkAuth()
    }
  }, [slug])

  const checkAuth = () => {
    const token = localStorage.getItem("accessToken")
    setIsAuthenticated(!!token)
  }

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await productAPI.getBySlug(slug!)
      setProduct(response.data)

      // Set primary image or first image as selected
      const primaryImage = response.data.images?.find((img) => img.isPrimary)
      setSelectedImage(primaryImage?.url || response.data.image || "/placeholder.svg")
    } catch (err: any) {
      console.error("Error fetching product:", err)
      setError(err.message || "Failed to load product")
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (type: "increment" | "decrement") => {
    if (type === "increment") {
      setQuantity((prev) => prev + 1)
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  const handleAddToCart = () => {
    // Your add to cart logic here
    console.log(`Adding ${quantity} of ${product?.name} to cart`)
  }

  const handleReviewAdded = () => {
    setIsReviewModalOpen(false)
    fetchProduct() // Refresh product data to get updated reviews
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-amber-900">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-600 mb-4">{error || "Product not found"}</p>
          <button
            onClick={() => navigate("/products")}
            className="bg-amber-700 text-white px-6 py-2 rounded-lg hover:bg-amber-800"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-stone-50 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-700 hover:text-amber-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Product Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-stone-100 rounded-2xl shadow-lg overflow-hidden aspect-square">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={image.id || index}
                    onClick={() => setSelectedImage(image.url)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === image.url
                        ? "border-amber-700 ring-2 ring-amber-700 ring-offset-2"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={image.alt || `${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badge and Category */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
                {product.category}
              </span>
              {product.badge && (
                <span className="text-sm font-medium text-white bg-stone-600 px-3 py-1 rounded-full">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-stone-800 mb-2">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating) ? "fill-amber-500 text-amber-500" : "text-stone-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-stone-700">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-stone-800">{product.price}</span>
              {product.comparePrice && (
                <span className="text-xl text-stone-400 line-through">{product.comparePrice}</span>
              )}
              {product.comparePrice && (
                <span className="text-lg font-semibold text-emerald-700">
                  Save{" "}
                  {Math.round(
                    (1 -
                      Number.parseFloat(product.price.replace("₹", "")) /
                        Number.parseFloat(product.comparePrice.replace("₹", ""))) *
                      100,
                  )}
                  %
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-stone-700 text-lg leading-relaxed">
              {product.description || product.fullDetails?.description}
            </p>

            {/* Stock Status */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                product.inStock ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">{product.inStock ? "In Stock" : "Out of Stock"}</span>
            </div>

            {/* Quantity Selector */}
            {product.inStock && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-stone-800">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-stone-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange("decrement")}
                      className="px-4 py-2 text-stone-700 hover:bg-stone-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-6 py-2 font-semibold text-stone-800">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange("increment")}
                      className="px-4 py-2 text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 bg-amber-700 text-white py-4 rounded-xl font-semibold text-lg hover:bg-amber-800 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button className="p-4 border-2 border-stone-300 rounded-xl hover:border-amber-700 hover:text-amber-700 transition-colors">
                <Heart className="w-6 h-6" />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-stone-200">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-amber-700" />
                <div>
                  <p className="font-semibold text-sm text-stone-800">100% Natural</p>
                  <p className="text-xs text-stone-600">Quality Assured</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="w-8 h-8 text-amber-700" />
                <div>
                  <p className="font-semibold text-sm text-stone-800">Free Shipping</p>
                  <p className="text-xs text-stone-600">On orders over ₹500</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-amber-700" />
                <div>
                  <p className="font-semibold text-sm text-stone-800">Fresh Products</p>
                  <p className="text-xs text-stone-600">Daily Packed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <ProductReviews
          productId={product.id}
          onAddReview={
            isAuthenticated
              ? () => setIsReviewModalOpen(true)
              : () => {
                  alert("Please login to write a review")
                  navigate("/login")
                }
          }
        />
      </div>

      {/* Add Review Modal */}
      {isAuthenticated && (
        <AddReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          productId={product.id}
          productName={product.name}
          onReviewAdded={handleReviewAdded}
        />
      )}
    </div>
  )
}

export default ProductDetail
