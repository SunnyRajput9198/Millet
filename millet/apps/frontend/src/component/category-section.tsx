"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/categories")
        
        if (!response.ok) {
          throw new Error("Failed to fetch categories")
        }

        const result = await response.json()
        
        if (result.success && result.data) {
          // Filter only parent categories (no parentId)
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

    fetchCategories()
  }, [])

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

  // Display only first 3 categories unless showAll is true
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

  if (categories.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-b from-white via-green-50/20 to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-600 text-lg">No categories available yet.</p>
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
        </div>

        {/* Show More / Show Less Button */}
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
    </section>
  )
}