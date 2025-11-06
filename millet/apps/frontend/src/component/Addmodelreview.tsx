"use client"

import type React from "react"

import { useState } from "react"
import { X, Star, Leaf } from "lucide-react"
import { reviewAPI } from "../api/reviews"

interface AddReviewModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  onReviewAdded: () => void
}

const AddReviewModal = ({ isOpen, onClose, productId, productName, onReviewAdded }: AddReviewModalProps) => {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    if (!comment.trim()) {
      setError("Please write a comment")
      return
    }

    try {
      setLoading(true)
      await reviewAPI.createReview(productId, {
        rating,
        comment: comment.trim(),
      })

      // Reset form
      setRating(0)
      setComment("")
      onReviewAdded()
    } catch (err: any) {
      setError(err.message || "Failed to submit review")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setRating(0)
      setComment("")
      setError(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white via-amber-50/20 to-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-emerald-100">
        {/* Header - Added gradient background and leaf decoration */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 border-b border-emerald-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Leaf className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Share Your Experience</h2>
              <p className="text-sm text-emerald-100 mt-1">{productName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-emerald-700 rounded-full transition-colors disabled:opacity-50 text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating - Updated star colors to use amber/orange for natural farming aesthetic */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-emerald-800">
              Your Rating <span className="text-amber-600">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 cursor-pointer transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300 hover:text-amber-200"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-3 text-lg font-semibold text-emerald-700">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </span>
              )}
            </div>
          </div>

          {/* Comment - Updated textarea styling with emerald focus ring and organic border */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-emerald-800">
              Your Review <span className="text-amber-600">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your genuine experience with this natural product..."
              className="w-full border-2 border-emerald-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-all bg-gradient-to-br from-white to-emerald-50 text-gray-800 placeholder-gray-400"
              rows={6}
              maxLength={1000}
              disabled={loading}
            />
            <div className="flex items-center justify-between text-xs text-emerald-700">
              <span>Minimum 10 characters</span>
              <span className="font-semibold">{comment.length}/1000</span>
            </div>
          </div>

          {/* Error Message - Updated error styling with organic colors */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Guidelines - Updated with emerald/amber gradient styling */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Review Guidelines
            </h4>
            <ul className="text-xs text-emerald-700 space-y-1">
              <li>• Be honest and share your genuine experience</li>
              <li>• Focus on product quality, taste, and packaging</li>
              <li>• Keep it respectful and constructive</li>
              <li>• Avoid personal information</li>
            </ul>
          </div>

          {/* Actions - Updated buttons with emerald/amber gradient styling */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-emerald-300 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0 || !comment.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddReviewModal
