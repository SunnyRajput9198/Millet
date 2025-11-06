"use client"

import type React from "react"

import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "../components/ui/card"
import { Star, ShoppingCart, ArrowRight, Loader, Check, X, AlertTriangle } from "lucide-react"
import { productAPI, type Product } from "../api/products"
import { categoryAPI, type Category } from "../api/categories"
import { getValidAccessToken } from "../utils/tokenRefresh"
import AddProductModal from "./Addmodelproduct"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog"
export function ProductsSection() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [addedToCart, setAddedToCart] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const INITIAL_DISPLAY_COUNT = 4

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔍 Starting to fetch products...")

      const [productsResponse, categoriesData] = await Promise.all([
        selectedCategory ? productAPI.getByCategory(selectedCategory) : productAPI.getAll(),
        categoryAPI.getAll(),
      ])

      console.log("✅ Products Response:", productsResponse)
      console.log("✅ Categories Data:", categoriesData)
      console.log("✅ Products Array:", productsResponse.data)
      console.log("✅ Products Length:", productsResponse.data?.length)

      // Make sure we have valid data
      if (productsResponse && productsResponse.data) {
        setProducts(productsResponse.data)
        console.log("✅ Products set successfully:", productsResponse.data.length)
      } else {
        console.warn("⚠️ No products data in response")
        setProducts([])
      }

      if (categoriesData) {
        setCategories(categoriesData)
        console.log("✅ Categories set successfully:", categoriesData.length)
      } else {
        console.warn("⚠️ No categories data")
        setCategories([])
      }
    } catch (err: any) {
      console.error("❌ Error fetching data:", err)
      console.error("❌ Error details:", err.response?.data)
      console.error("❌ Error message:", err.message)
      setError(err.response?.data?.error || err.message || "Failed to load products")
    } finally {
      setLoading(false)
      console.log("🏁 Fetch complete")
    }
  }

  useEffect(() => {
    fetchData()
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const accessToken = await getValidAccessToken()
      if (!accessToken) {
        setIsAdmin(false)
        return
      }
      const response = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await response.json()
      if (data.success && data.data.role === "ADMIN") {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
      setIsAdmin(false)
    }
  }
  const handleDeleteClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    setDeletingProduct(product)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return

    setIsDeleting(true)

    try {
      const accessToken = await getValidAccessToken()

      const response = await fetch(`http://localhost:8000/api/v1/products/${deletingProduct.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        // Remove product from local state
        setProducts(products.filter((p) => p.id !== deletingProduct.id))
        setShowDeleteDialog(false)
        setDeletingProduct(null)
      } else {
        alert(data.message || "Failed to delete product")
      }
    } catch (err) {
      console.error("Error deleting product:", err)
      alert("Failed to delete product")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
    setDeletingProduct(null)
  }
  const handleCategoryFilter = async (categorySlug: string | null) => {
    try {
      setLoading(true)
      setSelectedCategory(categorySlug)
      setShowAll(false)

      if (categorySlug) {
        const response = await productAPI.getByCategory(categorySlug)
        setProducts(response.data)
      } else {
        const response = await productAPI.getAll()
        setProducts(response.data)
      }
    } catch (err: any) {
      console.error("Error filtering products:", err)
      setError(err.response?.data?.error || "Failed to filter products")
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = (productSlug: string) => {
    navigate(`/product/${productSlug}`)
  }

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()

    const accessToken = await getValidAccessToken()
    if (!accessToken) {
      navigate("/auth")
      return
    }

    try {
      setAddingToCart(productId)

      const response = await fetch("http://localhost:8000/api/v1/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAddedToCart(productId)
        setTimeout(() => setAddedToCart(null), 2000)
      } else {
        alert(data.message || "Failed to add to cart")
      }
    } catch (err: any) {
      console.error("Error adding to cart:", err)
      alert("Failed to add to cart")
    } finally {
      setAddingToCart(null)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    // Refetch products when modal closes after successful product addition
    fetchData()
  }

  // Fixed logic: Show all products if showAll is true, otherwise show first INITIAL_DISPLAY_COUNT
  const displayedProducts =
    !products || products.length === 0 ? [] : showAll ? products : products.slice(0, INITIAL_DISPLAY_COUNT)

  const hasMoreProducts = products && products.length > INITIAL_DISPLAY_COUNT

  if (loading) {
    return (
      <section className="py-15" style={{ backgroundColor: "#f5ede4" }}>
        <div className="container mx-auto px-6 sm:px-12 lg:px-24">
          <div className="text-center">
            <p className="text-lg" style={{ color: "#5a4a3a" }}>
              Loading products...
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-15" style={{ backgroundColor: "#f5ede4" }}>
        <div className="container mx-auto px-6 sm:px-12 lg:px-24">
          <div className="text-center">
            <p className="text-lg text-red-600">{error}</p>
            <Button
              onClick={() => fetchData()}
              className="mt-4 text-white"
              style={{ backgroundColor: "#8b6f47", borderColor: "#8b6f47" }}
            >
              Retry
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-15" style={{ backgroundColor: "#f5ede4" }}>
      <div className="container mx-auto px-6 sm:px-12 lg:px-24">
        <div className="text-center mb-16 space-y-4">
          <h2 className="font-playfair text-3xl lg:text-4xl font-bold" style={{ color: "#5a4a3a" }}>
            Our Product Portfolio
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#7a6a5a" }}>
            Nature's perfect snacks, reimagined for modern lifestyles
          </p>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => handleCategoryFilter(null)}
              className="text-white transition-colors"
              style={
                selectedCategory === null
                  ? { backgroundColor: "#8b6f47", borderColor: "#8b6f47" }
                  : { borderColor: "#8b6f47", color: "#8b6f47" }
              }
            >
              All Products
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                onClick={() => handleCategoryFilter(category.slug)}
                className="transition-colors"
                style={
                  selectedCategory === category.slug
                    ? { backgroundColor: "#8b6f47", borderColor: "#8b6f47", color: "white" }
                    : { borderColor: "#8b6f47", color: "#8b6f47" }
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {displayedProducts.map((product) => (
            <Card
              key={product.id}
              onClick={() => handleProductClick(product.slug)}
              className="group hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative"
              style={{ backgroundColor: "#fefaf3", borderColor: "#e8dcc8" }}
            >
              {isAdmin && (
                <button
                  onClick={(e) => handleDeleteClick(e, product)}
                  className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                  aria-label="Delete product"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="relative flex-shrink-0">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.badge && (
                  <Badge
                    className="absolute top-4 left-4 text-white"
                    style={{
                      backgroundColor: product.badge === "BESTSELLER" ? "#6b8e5f" : "#5a4a3a",
                    }}
                  >
                    {product.badge}
                  </Badge>
                )}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Out of Stock</span>
                  </div>
                )}
              </div>

              <CardContent className="p-6 space-y-4 flex flex-col flex-grow">
                <div className="space-y-2">
                  <h3 className="font-semibold text-xl" style={{ color: "#5a4a3a" }}>
                    {product.name}
                  </h3>
                  <p className="text-sm font-medium" style={{ color: "#8b6f47" }}>
                    {product.category}
                  </p>
                  <p className="text-sm line-clamp-2" style={{ color: "#7a6a5a" }}>
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm" style={{ color: "#7a6a5a" }}>
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="space-x-2">
                    <span className="text-xl font-bold" style={{ color: "#5a4a3a" }}>
                      {product.price}
                    </span>
                    {product.comparePrice && (
                      <span className="text-sm text-gray-400 line-through">{product.comparePrice}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => handleAddToCart(e, product.id)}
                    className="text-white transition-colors"
                    style={{
                      backgroundColor: addedToCart === product.id ? "#6b8e5f" : "#8b6f47",
                    }}
                    disabled={!product.inStock || addingToCart === product.id}
                  >
                    {addingToCart === product.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : addedToCart === product.id ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Added
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card
            className="group flex flex-col overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
            style={{ backgroundColor: "#fefaf3", borderColor: "#e8dcc8" }}
            onClick={() => {
              if (isAdmin) {
                setIsModalOpen(true)
              }
            }}
          >
            <CardContent className="flex flex-col items-center justify-center p-8 flex-grow">
              <div
                className="flex items-center justify-center w-16 h-16 rounded-full text-white text-3xl font-bold mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300"
                style={{
                  background: isAdmin
                    ? "linear-gradient(135deg, #8b6f47 0%, #5a4a3a 100%)"
                    : "linear-gradient(135deg, #d4a574 0%, #c89968 100%)",
                }}
              >
                +
              </div>
              <div className="font-semibold text-lg mb-1" style={{ color: "#5a4a3a" }}>
                {isAdmin ? "Add New Product" : "Coming Soon"}
              </div>
              <p className="mt-2 text-sm text-center max-w-xs" style={{ color: "#7a6a5a" }}>
                {isAdmin
                  ? "Click here to add a new product with images and details"
                  : "More delicious snacks are on the way! Stay tuned for exciting new flavors."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          {!showAll && hasMoreProducts ? (
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowAll(true)}
              className="transition-colors duration-300"
              style={{
                borderColor: "#8b6f47",
                color: "#8b6f47",
              }}
            >
              Explore All Products ({products.length - INITIAL_DISPLAY_COUNT} more)
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : showAll ? (
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setShowAll(false)
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className="transition-colors duration-300"
              style={{
                borderColor: "#8b6f47",
                color: "#8b6f47",
              }}
            >
              Show Less
              <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          ) : null}
        </div>
      </div>

      <AddProductModal isOpen={isModalOpen} onClose={handleModalClose} />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent style={{ backgroundColor: "#fefaf3", borderColor: "#e8dcc8" }}>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl" style={{ color: "#5a4a3a" }}>
                Delete Product
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base" style={{ color: "#7a6a5a" }}>
              Are you sure you want to delete{" "}
              <span className="font-semibold" style={{ color: "#5a4a3a" }}>
                "{deletingProduct?.name}"
              </span>
              ? This action cannot be undone and will permanently remove the product from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDelete}
              disabled={isDeleting}
              style={{ color: "#5a4a3a", borderColor: "#8b6f47" }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
