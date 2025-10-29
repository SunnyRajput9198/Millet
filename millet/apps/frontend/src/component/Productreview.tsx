import { useState, useEffect } from 'react';
import { Star, User, Trash2, Edit2, ThumbsUp } from 'lucide-react';
import { reviewAPI, type Review, type ReviewStats } from '../api/reviews';

interface ProductReviewsProps {
  productId: string;
  onAddReview?: () => void;
}

const ProductReviews = ({ productId, onAddReview }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editData, setEditData] = useState({ rating: 0, comment: '' });

  useEffect(() => {
    fetchReviews();
    checkCurrentUser();
  }, [productId]);

  const checkCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUserId(data.data.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getProductReviews(productId);
      setReviews(response.data.reviews);
      setStats(response.data.stats);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewAPI.deleteReview(reviewId);
      fetchReviews();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review.id);
    setEditData({ rating: review.rating, comment: review.comment });
  };

  const handleUpdate = async (reviewId: string) => {
    try {
      await reviewAPI.updateReview(reviewId, editData);
      setEditingReview(null);
      fetchReviews();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const StarRating = ({ rating, size = 'w-5 h-5' }: { rating: number; size?: string }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const RatingBar = ({ rating, count, total }: { rating: number; count: number; total: number }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 w-8">{rating}★</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <p className="text-center text-gray-500">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Customer Reviews</h2>
        {onAddReview && (
          <button
            onClick={onAddReview}
            className="bg-[#2a9d8f] text-white px-6 py-2 rounded-lg hover:bg-[#264653] transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b">
          {/* Average Rating */}
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold text-gray-800 mb-2">
              {stats.averageRating.toFixed(1)}
            </div>
            <StarRating rating={Math.round(stats.averageRating)} size="w-6 h-6" />
            <p className="text-gray-600 mt-2">
              Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <RatingBar
                key={rating}
                rating={rating}
                count={stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                total={stats.totalReviews}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-b-0">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {review.user.avatarUrl ? (
                    <img
                      src={review.user.avatarUrl}
                      alt={review.user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{review.user.username}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {currentUserId === review.userId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(review)}
                      className="text-blue-600 hover:text-blue-800 p-2"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Rating */}
              {editingReview === review.id ? (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setEditData({ ...editData, rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 cursor-pointer transition-colors ${
                              star <= editData.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment
                    </label>
                    <textarea
                      value={editData.comment}
                      onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(review.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingReview(null)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <StarRating rating={review.rating} />
                  
                  {/* Comment */}
                  <p className="text-gray-700 mt-3 leading-relaxed">{review.comment}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;