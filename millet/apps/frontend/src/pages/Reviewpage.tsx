"use client"

import { useState, useEffect } from "react"
import { Star, Edit2, Trash2, Package, ArrowLeft, Leaf } from "lucide-react"
import { reviewAPI, type Review } from "../api/reviews"
import { useNavigate } from "react-router-dom"

const MyReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [editingReview, setEditingReview] = useState<string | null>(null)
  const [editData, setEditData] = useState({ rating: 0, comment: "" })
  const navigate = useNavigate()

  useEffect(() => {
    fetchMyReviews()
  }, [])

  const fetchMyReviews = async () => {
    try {
      setLoading(true)
      const response = await reviewAPI.getMyReviews()
      setReviews(response.data)
    } catch (error: any) {
      console.error("Error fetching reviews:", error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return

    try {
      await reviewAPI.deleteReview(reviewId)
      fetchMyReviews()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleEdit = (review: Review) => {
    setEditingReview(review.id)
    setEditData({ rating: review.rating, comment: review.comment })
  }

  const handleUpdate = async (reviewId: string) => {
    try {
      await reviewAPI.updateReview(reviewId, editData)
      setEditingReview(null)
      fetchMyReviews()
      alert("Review updated successfully!")
    } catch (error: any) {
      alert(error.message)
    }
  }

  const StarRating = ({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate && onRate(star)}
          disabled={!onRate}
          className={`focus:outline-none transition-transform ${onRate ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
        >
          <Star
            className={`w-5 h-5 transition-all ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-emerald-600 font-medium">Loading your reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-emerald-400">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Leaf className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-3xl font-bold text-white">My Reviews</h1>
                  <p className="text-emerald-100 mt-1">Manage all your farmstead product reviews</p>
                </div>
              </div>
              <div className="text-right bg-white bg-opacity-20 backdrop-blur px-4 py-3 rounded-lg">
                <p className="text-3xl font-bold text-white">{reviews.length}</p>
                <p className="text-sm text-emerald-50">Total Reviews</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reviews Yet</h3>
                <p className="text-gray-600 mb-6">
                  You haven't reviewed any natural products. Purchase and review to see them here!
                </p>
                <button
                  onClick={() => navigate("/products")}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all font-medium"
                >
                  Browse Farmstead Products
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-l-4 border-emerald-400 bg-gradient-to-br from-white to-emerald-50 rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex gap-4">
                      {review.product?.images && review.product.images.length > 0 ? (
                        <img
                          src={review.product.images[0].url || "/placeholder.svg"}
                          alt={review.product.name}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0 ring-2 ring-emerald-200"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-8 h-8 text-emerald-500" />
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">{review.product?.name || "Product"}</h3>
                            <p className="text-sm text-emerald-600">
                              Reviewed on{" "}
                              {new Date(review.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(review)}
                              className="text-teal-600 hover:text-teal-800 p-2 rounded-lg hover:bg-teal-50 transition-colors"
                              title="Edit review"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {editingReview === review.id ? (
                          <div className="space-y-4 mt-4 bg-white p-4 rounded-lg border border-emerald-200">
                            <div>
                              <label className="block text-sm font-medium text-emerald-700 mb-2">Rating</label>
                              <StarRating
                                rating={editData.rating}
                                onRate={(r) => setEditData({ ...editData, rating: r })}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-emerald-700 mb-2">Comment</label>
                              <textarea
                                value={editData.comment}
                                onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
                                className="w-full border-2 border-emerald-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                rows={4}
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdate(review.id)}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all font-medium"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => setEditingReview(null)}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <StarRating rating={review.rating} />
                            <p className="text-gray-700 mt-3 leading-relaxed">{review.comment}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyReviews
