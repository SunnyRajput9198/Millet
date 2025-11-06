"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { X, AlertTriangle, Loader, Leaf } from "lucide-react"
import AddCategoryModal from "./Addcategorymodel"
import { getValidAccessToken } from "../utils/tokenRefresh"
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

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
  slug: string
  parentId?: string | null
}

export function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }

      const result = await response.json()

      if (result.success && result.data) {
        const parentCategories = result.data.filter((cat: any) => !cat.parentId)
        setCategories(parentCategories)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching categories:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation()
    setDeletingCategory(category)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return

    setIsDeleting(true)

    try {
      const accessToken = await getValidAccessToken()

      const response = await fetch(`http://localhost:8000/api/v1/categories/${deletingCategory.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        // Remove category from local state
        setCategories(categories.filter((c) => c.id !== deletingCategory.id))
        setShowDeleteDialog(false)
        setDeletingCategory(null)
      } else {
        alert(data.message || "Failed to delete category")
      }
    } catch (err) {
      console.error("Error deleting category:", err)
      alert("Failed to delete category")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
    setDeletingCategory(null)
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        ease: "easeOut",
      },
    }),
  }

  const displayedCategories = showAll ? categories : categories.slice(0, 3)
  const hasMoreCategories = categories.length > 3

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-br from-emerald-50 via-amber-50 to-green-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="animate-pulse">
            <div className="h-12 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg w-72 mx-auto mb-16"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-8 border border-green-100">
                  <div className="h-60 bg-gradient-to-b from-green-100 to-emerald-100 rounded-xl mb-6"></div>
                  <div className="h-6 bg-green-150 rounded-lg w-2/3 mx-auto mb-3"></div>
                  <div className="h-4 bg-green-100 rounded w-full mb-6"></div>
                  <div className="h-11 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full w-40 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-24 bg-gradient-to-br from-emerald-50 via-amber-50 to-green-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-block bg-red-50 border border-red-200 rounded-xl p-8">
            <p className="text-red-700 text-lg font-medium">Error loading categories: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 bg-gradient-to-br from-emerald-50 via-amber-50 to-green-50 relative overflow-hidden">
      {/* Decorative leaf elements */}
      <div className="absolute top-10 right-10 text-green-200 opacity-30 pointer-events-none">
        <Leaf className="w-32 h-32 rotate-45" />
      </div>
      <div className="absolute bottom-20 left-10 text-amber-200 opacity-20 pointer-events-none">
        <Leaf className="w-40 h-40 -rotate-12" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-6 border border-green-200">
            <Leaf className="w-4 h-4 text-green-700" />
            <span className="text-sm font-semibold text-green-700">Organic Collections</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-800 via-emerald-700 to-green-900 bg-clip-text text-transparent mb-4">
            Explore Our Categories
          </h2>
          <p className="text-green-700 text-lg max-w-2xl mx-auto">
            Discover nature&apos;s finest farm-fresh products carefully selected for quality and sustainability
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {displayedCategories.map((cat, i) => (
            <motion.div
              key={cat.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              // @ts-ignore
              variants={fadeUp}
              viewport={{ once: true }}
              className="group relative rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-green-100 hover:border-green-300"
            >
              {/* Delete Button - Only visible to admin */}
              {isAdmin && (
                <button
                  onClick={(e) => handleDeleteClick(e, cat)}
                  className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-2.5 shadow-lg transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                  aria-label="Delete category"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Image Container with overlay */}
              <div className="overflow-hidden relative h-64 bg-gradient-to-br from-green-100 to-emerald-100">
                <img
                  src={cat.image || "/placeholder-category.jpg"}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-category.jpg"
                  }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-green-900 mb-2 group-hover:text-green-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-green-700 text-sm mb-6 leading-relaxed h-10 overflow-hidden">
                  {cat.description || "Explore our premium collection of natural products"}
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Shop Collection
                </motion.button>
              </div>
            </motion.div>
          ))}

          {/* Add Category Card - ONLY VISIBLE TO ADMINS */}
          {isAdmin && (
            <motion.div
              custom={displayedCategories.length}
              initial="hidden"
              whileInView="visible"
              // @ts-ignore
              variants={fadeUp}
              viewport={{ once: true }}
              onClick={() => setIsModalOpen(true)}
              className="group relative rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-3 border-2 border-dashed border-green-300 hover:border-green-500"
            >
              <div className="flex flex-col items-center justify-center p-12 h-full min-h-[420px] hover:bg-green-50 transition-colors duration-300">
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white text-5xl font-bold mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:shadow-xl">
                  +
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">Add New Category</h3>
                <p className="text-green-700 text-sm text-center max-w-xs leading-relaxed">
                  Create a new product category with images and detailed information
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {hasMoreCategories && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-16 text-center"
          >
            <motion.button
              onClick={() => setShowAll(!showAll)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
            >
              {showAll ? (
                <>
                  Show Less
                  <span className="ml-2">↑</span>
                </>
              ) : (
                <>
                  View All Categories ({categories.length})<span className="ml-2">→</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Add Category Modal */}
      {isAdmin && (
        <AddCategoryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            fetchCategories() // Refresh categories after adding
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-green-200 bg-white">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-2xl text-green-900">Delete Category</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base text-green-800">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-green-900">"{deletingCategory?.name}"</span>? This action cannot be
              undone and will permanently remove the category.
              {deletingCategory?.description && (
                <span className="block mt-3 text-sm text-green-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  Note: Make sure there are no subcategories before deleting.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="border-green-300 text-green-900 hover:bg-green-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Category"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
