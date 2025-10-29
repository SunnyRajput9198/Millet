"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import AddCategoryModal from "./Addcategorymodel"
 import { getValidAccessToken } from '../utils/tokenRefresh'
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
      headers: { "Authorization": `Bearer ${accessToken}` }
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
      <section className="py-20 bg-gradient-to-b from-white via-green-50/20 to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl shadow-lg p-6">
                  <div className="h-56 bg-gray-200 rounded-2xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded-full w-32 mx-auto"></div>
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
      <section className="py-20 bg-gradient-to-b from-white via-green-50/20 to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-red-600 text-lg">Error loading categories: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white via-green-50/20 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-12 text-gray-800"
        >
          Explore Our Categories
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {displayedCategories.map((cat, i) => (
            <motion.div
              key={cat.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              // @ts-ignore
              variants={fadeUp}
              viewport={{ once: true }}
              className="group relative rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              <div className="overflow-hidden">
                <img
                  src={cat.image || "/placeholder-category.jpg"}
                  alt={cat.name}
                  className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-category.jpg"
                  }}
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {cat.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {cat.description || "Explore our collection"}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
                >
                  Shop Now
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
              className="group relative rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2"
            >
              <div className="flex flex-col items-center justify-center p-12 h-full min-h-[400px]">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white text-4xl font-bold mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  +
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Add New Category
                </h3>
                <p className="text-gray-600 text-sm text-center max-w-xs">
                  Click here to add a new category with images and details
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
            className="mt-12 text-center"
          >
            <motion.button
              onClick={() => setShowAll(!showAll)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-green-600 to-green-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {showAll ? (
                <>
                  Show Less
                  <span className="ml-2">↑</span>
                </>
              ) : (
                <>
                  View All Categories ({categories.length})
                  <span className="ml-2">→</span>
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
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </section>
  )
}