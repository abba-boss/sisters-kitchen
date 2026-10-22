import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, MessageSquare, ThumbsUp, ThumbsDown, Search, Filter,
  Calendar, TrendingUp, Award, AlertCircle, Eye, Reply,
  StarOff, Clock, User, Package
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatDate, formatPrice } from '../../utils/formatters';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function VendorFeedback() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all'); // all, 5, 4, 3, 2, 1
  const [filterDate, setFilterDate] = useState('all'); // all, today, week, month
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API endpoint
      // const { data } = await api.get('/reviews/vendor');
      // setReviews(data.data);
      
      // Mock data for now
      setReviews([
        {
          id: 1,
          rating: 5,
          comment: 'Amazing jollof rice! Best I\'ve had in Lagos. The spices were perfect and delivery was quick.',
          productName: 'Jollof Rice Special',
          productImage: null,
          customerName: 'Chioma Okafor',
          customerAvatar: null,
          orderId: 'SK-2024-1234',
          createdAt: new Date().toISOString(),
          reply: null,
          helpful: 12,
          notHelpful: 0
        },
        {
          id: 2,
          rating: 4,
          comment: 'Good food, but portion size could be bigger for the price. Still recommended!',
          productName: 'Fried Rice Combo',
          productImage: null,
          customerName: 'Ibrahim Musa',
          customerAvatar: null,
          orderId: 'SK-2024-1233',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          reply: {
            text: 'Thank you for your feedback! We\'ve increased portion sizes. Hope to serve you again!',
            date: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
          },
          helpful: 8,
          notHelpful: 1
        },
        {
          id: 3,
          rating: 5,
          comment: 'Absolutely delicious! The plantain was perfectly fried. Will order again.',
          productName: 'Jollof Rice Special',
          productImage: null,
          customerName: 'Ada Nwosu',
          customerAvatar: null,
          orderId: 'SK-2024-1232',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          reply: null,
          helpful: 15,
          notHelpful: 0
        },
        {
          id: 4,
          rating: 3,
          comment: 'Food was okay but took longer than expected to arrive. Taste was good though.',
          productName: 'Pepper Soup',
          productImage: null,
          customerName: 'Emeka Johnson',
          customerAvatar: null,
          orderId: 'SK-2024-1231',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          reply: null,
          helpful: 3,
          notHelpful: 2
        },
        {
          id: 5,
          rating: 5,
          comment: 'Best vendor on this platform! Always consistent quality and friendly service.',
          productName: 'Fried Rice Combo',
          productImage: null,
          customerName: 'Blessing Eze',
          customerAvatar: null,
          orderId: 'SK-2024-1230',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          reply: {
            text: 'Thank you so much! We appreciate your continued support! 🙏',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
          },
          helpful: 20,
          notHelpful: 0
        },
        {
          id: 6,
          rating: 2,
          comment: 'Food arrived cold and the packaging was poor. Not happy with this order.',
          productName: 'Jollof Rice Special',
          productImage: null,
          customerName: 'Uche Okoli',
          customerAvatar: null,
          orderId: 'SK-2024-1229',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          reply: null,
          helpful: 5,
          notHelpful: 8
        },
      ]);
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return;

    try {
      // TODO: Replace with actual API call
      // await api.post(`/reviews/${reviewId}/reply`, { text: replyText });
      
      // Update UI
      setReviews(reviews.map(r => 
        r.id === reviewId 
          ? { ...r, reply: { text: replyText, date: new Date().toISOString() } }
          : r
      ));
      
      setReplyingTo(null);
      setReplyText('');
      toast.success('Reply posted successfully!');
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  // Calculate stats
  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0,
    fiveStars: reviews.filter(r => r.rating === 5).length,
    fourStars: reviews.filter(r => r.rating === 4).length,
    threeStars: reviews.filter(r => r.rating === 3).length,
    twoStars: reviews.filter(r => r.rating === 2).length,
    oneStar: reviews.filter(r => r.rating === 1).length,
    responseRate: reviews.length > 0
      ? Math.round((reviews.filter(r => r.reply).length / reviews.length) * 100)
      : 0,
    needsReply: reviews.filter(r => !r.reply).length,
  };

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    // Rating filter
    if (filterRating !== 'all' && review.rating !== parseInt(filterRating)) {
      return false;
    }

    // Date filter
    if (filterDate === 'today') {
      const today = new Date().toDateString();
      if (new Date(review.createdAt).toDateString() !== today) return false;
    } else if (filterDate === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (new Date(review.createdAt) < weekAgo) return false;
    } else if (filterDate === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (new Date(review.createdAt) < monthAgo) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        review.comment?.toLowerCase().includes(query) ||
        review.productName?.toLowerCase().includes(query) ||
        review.customerName?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (count) => {
    return stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-poppins font-bold text-2xl text-brand-dark">Customer Feedback & Reviews</h1>
        <p className="text-sm text-brand-muted mt-1">Manage and respond to customer reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare size={20} className="text-blue-500" />
          </div>
          <p className="font-poppins font-bold text-2xl text-brand-dark">{stats.totalReviews}</p>
          <p className="text-xs text-brand-muted mt-1">Total Reviews</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <Award size={20} className="text-yellow-500" />
          </div>
          <div className="flex items-center gap-1">
            <p className="font-poppins font-bold text-2xl text-brand-dark">{stats.averageRating}</p>
            <Star size={16} className="fill-yellow-400 text-yellow-400 mt-1" />
          </div>
          <p className="text-xs text-brand-muted mt-1">Average Rating</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <p className="font-poppins font-bold text-2xl text-brand-dark">{stats.fiveStars}</p>
          <p className="text-xs text-brand-muted mt-1">5-Star Reviews</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <Reply size={20} className="text-primary" />
          </div>
          <p className="font-poppins font-bold text-2xl text-brand-dark">{stats.responseRate}%</p>
          <p className="text-xs text-brand-muted mt-1">Response Rate</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle size={20} className="text-orange-500" />
          </div>
          <p className="font-poppins font-bold text-2xl text-brand-dark">{stats.needsReply}</p>
          <p className="text-xs text-brand-muted mt-1">Needs Reply</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Rating Distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-brand-dark mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[
              { stars: 5, count: stats.fiveStars },
              { stars: 4, count: stats.fourStars },
              { stars: 3, count: stats.threeStars },
              { stars: 2, count: stats.twoStars },
              { stars: 1, count: stats.oneStar },
            ].map(({ stars, count }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-sm text-brand-dark w-6">{stars}</span>
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${getRatingPercentage(count)}%` }}
                  />
                </div>
                <span className="text-sm text-brand-muted w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-brand-dark mb-4">Insights</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <ThumbsUp size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round((stats.fiveStars + stats.fourStars) / stats.totalReviews * 100 || 0)}%
                </p>
                <p className="text-xs text-green-700">Positive Reviews</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
              <ThumbsDown size={24} className="text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {Math.round((stats.oneStar + stats.twoStars) / stats.totalReviews * 100 || 0)}%
                </p>
                <p className="text-xs text-red-700">Negative Reviews</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl col-span-2">
              <Clock size={24} className="text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  {stats.needsReply} review{stats.needsReply !== 1 ? 's' : ''} waiting for your response
                </p>
                <p className="text-xs text-blue-700">Respond quickly to improve customer satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder="Search reviews, products, or customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* Rating Filter */}
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
          >
            <option value="all">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
            <option value="4">⭐⭐⭐⭐ 4 Stars</option>
            <option value="3">⭐⭐⭐ 3 Stars</option>
            <option value="2">⭐⭐ 2 Stars</option>
            <option value="1">⭐ 1 Star</option>
          </select>

          {/* Date Filter */}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Reviews Count */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-poppins font-semibold text-brand-dark">
          Reviews ({filteredReviews.length})
        </h2>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="card p-12 text-center">
          <StarOff size={48} className="mx-auto text-brand-muted mb-3" />
          <p className="text-brand-dark font-medium">No reviews found</p>
          <p className="text-sm text-brand-muted mt-1">
            {searchQuery || filterRating !== 'all' || filterDate !== 'all'
              ? 'Try adjusting your filters'
              : 'Start getting reviews from your customers'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredReviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card p-5"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {/* Customer Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {review.customerName.charAt(0).toUpperCase()}
                    </div>

                    {/* Customer Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-brand-dark">{review.customerName}</p>
                        {renderStars(review.rating)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-brand-muted">
                        <Package size={12} />
                        <span>{review.productName}</span>
                        <span>•</span>
                        <span>Order #{review.orderId}</span>
                        <span>•</span>
                        <Clock size={12} />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Comment */}
                <p className="text-sm text-brand-dark mb-3 leading-relaxed pl-13">
                  {review.comment}
                </p>

                {/* Vendor Reply */}
                {review.reply && (
                  <div className="ml-13 p-3 bg-orange-50 rounded-xl mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Reply size={14} className="text-primary" />
                      <span className="text-xs font-semibold text-primary">Your Reply</span>
                      <span className="text-xs text-brand-muted">• {formatDate(review.reply.date)}</span>
                    </div>
                    <p className="text-sm text-brand-dark">{review.reply.text}</p>
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === review.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-13 mb-3"
                  >
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      className="w-full p-3 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                      rows="3"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleReplySubmit(review.id)}
                        className="btn-primary text-sm py-2 px-4"
                      >
                        Post Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        className="px-4 py-2 text-sm text-brand-muted hover:text-brand-dark transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pl-13 pt-3 border-t border-orange-100">
                  <div className="flex items-center gap-4 text-xs text-brand-muted">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={14} />
                      {review.helpful} helpful
                    </span>
                    {review.notHelpful > 0 && (
                      <span className="flex items-center gap-1">
                        <ThumbsDown size={14} />
                        {review.notHelpful}
                      </span>
                    )}
                  </div>
                  {!review.reply && (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      <Reply size={16} />
                      Reply to Customer
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </DashboardLayout>
  );
}
