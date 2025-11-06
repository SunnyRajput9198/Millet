"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Upload, Plus, Trash2, ImageIcon, Leaf } from "lucide-react"
import { getValidAccessToken } from "../utils/tokenRefresh"

interface Category {
  id: string
  name: string
  slug: string
}

interface ImageInput {
  url: string
  alt: string
  isPrimary: boolean
  order: number
}

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    comparePrice: "",
    stock: "",
    sku: "",
    categoryId: "",
    tags: "",
  })

  const [images, setImages] = useState<ImageInput[]>([{ url: "", alt: "", isPrimary: true, order: 0 }])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    fetchCategories()
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

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/categories")
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleImageChange = (index: number, field: keyof ImageInput, value: string | boolean | number) => {
    setImages((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addImageField = () => {
    setImages((prev) => [
      ...prev,
      {
        url: "",
        alt: "",
        isPrimary: false,
        order: prev.length,
      },
    ])
  }

  const removeImageField = (index: number) => {
    if (images.length > 1) {
      setImages((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      })),
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Product name is required"
    if (formData.name.length < 3) newErrors.name = "Name must be at least 3 characters"
    if (!formData.price || Number.parseFloat(formData.price) <= 0) newErrors.price = "Valid price is required"
    if (!formData.stock || Number.parseInt(formData.stock) < 0) newErrors.stock = "Valid stock is required"
    const validImages = images.filter((img) => img.url.trim())
    if (validImages.length === 0) {
      newErrors.images = "At least one image is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setLoading(true)
    setSuccessMessage("")

    try {
      const accessToken = await getValidAccessToken()

      if (!accessToken) {
        throw new Error("You must be logged in to add products")
      }

      const productPayload = {
        name: formData.name,
        description: formData.description || undefined,
        price: Number.parseFloat(formData.price),
        comparePrice: formData.comparePrice ? Number.parseFloat(formData.comparePrice) : undefined,
        stock: Number.parseInt(formData.stock),
        sku: formData.sku || undefined,
        categoryId: formData.categoryId || undefined,
        tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()) : undefined,
      }

      const productResponse = await fetch("http://localhost:8000/api/v1/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(productPayload),
      })

      const productData = await productResponse.json()
      if (!productResponse.ok || !productData.success) {
        throw new Error(productData.message || "Failed to create product")
      }

      const productId = productData.data.id
      const validImages = images.filter((img) => img.url.trim())

      for (const image of validImages) {
        await fetch(`http://localhost:8000/api/v1/products/${productId}/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            url: image.url,
            alt: image.alt || formData.name,
            isPrimary: image.isPrimary,
            order: image.order,
          }),
        })
      }

      setSuccessMessage("Product added successfully! 🎉")
      setTimeout(() => {
        resetForm()
        onClose()
      }, 2000)
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to add product" })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      comparePrice: "",
      stock: "",
      sku: "",
      categoryId: "",
      tags: "",
    })
    setImages([{ url: "", alt: "", isPrimary: true, order: 0 }])
    setErrors({})
    setSuccessMessage("")
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 px-6 py-6 flex items-center justify-between z-10 shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Add New Product</h2>
              </div>
              <button onClick={() => onClose()} className="text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              {successMessage && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg shadow-sm">
                  <p className="font-medium">{successMessage}</p>
                </div>
              )}
              {errors.submit && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-300 text-red-900 px-4 py-3 rounded-lg shadow-sm">
                  <p className="font-medium">{errors.submit}</p>
                </div>
              )}

              <div className="space-y-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-4 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-emerald-600 to-teal-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-emerald-900">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-emerald-900 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 transition-all"
                      placeholder="e.g., Premium Raw Makhana"
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1 font-medium">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-emerald-900 mb-2">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 transition-all"
                      placeholder="e.g., MAKHANA-001"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-emerald-900 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 transition-all resize-none"
                    placeholder="Describe your product, farming methods, benefits..."
                  />
                </div>
              </div>

              <div className="space-y-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-amber-600 to-orange-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-amber-900">Pricing & Inventory</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-amber-900 mb-2">
                      Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900 transition-all"
                      placeholder="299"
                    />
                    {errors.price && <p className="text-red-600 text-sm mt-1 font-medium">{errors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-amber-900 mb-2">Compare Price (₹)</label>
                    <input
                      type="number"
                      name="comparePrice"
                      value={formData.comparePrice}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900 transition-all"
                      placeholder="399"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-amber-900 mb-2">
                      Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-900 transition-all"
                      placeholder="100"
                    />
                    {errors.stock && <p className="text-red-600 text-sm mt-1 font-medium">{errors.stock}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 p-4 rounded-lg border border-teal-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-teal-600 to-cyan-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-teal-900">Category & Tags</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-teal-900 mb-2">Category</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 transition-all"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-teal-900 mb-2">Tags (comma-separated)</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 transition-all"
                      placeholder="organic, natural, farm-fresh"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-emerald-900">Product Images</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addImageField}
                    className="text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-md"
                  >
                    <Plus className="w-4 h-4" /> Add Image
                  </button>
                </div>
                {errors.images && <p className="text-red-600 text-sm font-medium">{errors.images}</p>}
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="border border-emerald-200 rounded-lg p-4 space-y-3 bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                          <ImageIcon className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-semibold text-gray-700">Image {index + 1}</span>
                        {image.isPrimary && (
                          <span className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1 rounded-full font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Image URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={image.url}
                          onChange={(e) => handleImageChange(index, "url", e.target.value)}
                          className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 transition-all"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Alt Text</label>
                          <input
                            type="text"
                            value={image.alt}
                            onChange={(e) => handleImageChange(index, "alt", e.target.value)}
                            className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 transition-all"
                            placeholder="Product image description"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(index)}
                            className={`w-full px-4 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                              image.isPrimary
                                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {image.isPrimary ? "Primary Image" : "Set as Primary"}
                          </button>
                        </div>
                      </div>
                      {image.url && (
                        <div className="mt-2">
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt={image.alt || "Preview"}
                            className="w-32 h-32 object-cover rounded-lg border-2 border-emerald-200 shadow-md"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-emerald-100 px-6 py-4 flex items-center justify-end gap-3 shadow-lg">
              <button
                type="button"
                onClick={() => onClose()}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Add Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
