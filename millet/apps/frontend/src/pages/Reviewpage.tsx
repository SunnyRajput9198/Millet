import { useState, useEffect } from 'react';
import { Star, Edit2, Trash2, Package, ArrowLeft } from 'lucide-react';
import { reviewAPI, type Review } from '../api/reviews';
import { useNavigate } from 'react-router-dom';

const MyReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editData, setEditData] = useState({ rating: 0, comment: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getMyReviews();
      setReviews(response.data);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewAPI.deleteReview(reviewId);
      fetchMyReviews();
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
      fetchMyReviews();
      alert('Review updated successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const StarRating = ({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate && onRate(star)}
          disabled={!onRate}
          className={`focus:outline-none ${onRate ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Reviews</h1>
              <p className="text-gray-600 mt-2">
                Manage all your product reviews in one place
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#2a9d8f]">{reviews.length}</p>
              <p className="text-sm text-gray-600">Total Reviews</p>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 mb-6">
                You haven't reviewed any products. Purchase and review products to see them here!
              </p>
              <button
                onClick={() => navigate('/products')}
                className="bg-[#2a9d8f] text-white px-6 py-3 rounded-lg hover:bg-[#264653] transition-colors"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    {review.product?.images && review.product.images.length > 0 ? (
                      <img
                        src={review.product.images[0].url}
                        alt={review.product.name}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">
                            {review.product?.name || 'Product'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Reviewed on {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(review)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
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
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Rating
                            </label>
                            <StarRating
                              rating={editData.rating}
                              onRate={(r) => setEditData({ ...editData, rating: r })}
                            />
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
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingReview(null)}
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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
  );
};

export default MyReviews;