"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Upload, Leaf } from "lucide-react"
import { getValidAccessToken } from "../utils/tokenRefresh"

interface Category {
  id: string
  name: string
  slug: string
}

interface AddCategoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddCategoryModal({ isOpen, onClose }: AddCategoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    parentId: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = "Category name is required"
    }
    if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters"
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
        throw new Error("You must be logged in to add categories")
      }

      const categoryPayload = {
        name: formData.name,
        description: formData.description || undefined,
        image: formData.image || undefined,
        parentId: formData.parentId || undefined,
      }

      const response = await fetch("http://localhost:8000/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(categoryPayload),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create category")
      }

      setSuccessMessage("Category added successfully! 🎉")
      setTimeout(() => {
        resetForm()
        onClose()
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to add category" })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", image: "", parentId: "" })
    setErrors({})
    setSuccessMessage("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-emerald-100">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-5 flex items-center justify-between z-10 shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Add New Category</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {successMessage && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-lg font-medium">
              {successMessage}
            </div>
          )}
          {errors.submit && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg font-medium">
              {errors.submit}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-emerald-700">Category Information</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all bg-emerald-50/30 placeholder-gray-400"
                placeholder="e.g., Dairy Products"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all resize-none bg-emerald-50/30 placeholder-gray-400"
                placeholder="Describe the category and its products..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Category</label>
              <select
                name="parentId"
                value={formData.parentId}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all bg-emerald-50/30"
              >
                <option value="">None (Top Level Category)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t-2 border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-emerald-700">Category Image</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all bg-emerald-50/30 placeholder-gray-400"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {formData.image && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Preview:</p>
                  <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-200 inline-block">
                    <img
                      src={formData.image || "/placeholder.svg"}
                      alt="Category preview"
                      className="w-48 h-48 object-cover rounded-lg border-2 border-white shadow-sm"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-category.jpg"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-emerald-50 border-t-2 border-emerald-100 px-6 py-4 flex items-center justify-end gap-3 shadow-md">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-all font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Add Category
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
