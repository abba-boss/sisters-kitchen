import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MapPin,
  Phone,
  Clock,
  MessageSquare,
  ShoppingBag,
  Share2,
  Store,
  Users,
  ShieldCheck,
  Heart,
  Grid3x3,
  PlayCircle,
  BookOpen,
  Info,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import ProductCard from '../../components/common/ProductCard';
import StarRating from '../../components/common/StarRating';
import EmptyState from '../../components/common/EmptyState';
import FollowButton from '../../components/social/FollowButton';
import PostCard from '../../components/social/PostCard';
import { vendorService } from '../../services/vendorService';
import { reviewService } from '../../services/reviewService';
import { postService } from '../../services/postService';
import { followerService } from '../../services/followerService';
import { formatDate, formatPrice } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';
import { PageLoader } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

const DAY_SHORT = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

export default function VendorProfilePageModern() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [posts, setPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const [reviewFilter, setReviewFilter] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      vendorService.getById(id),
      reviewService.getVendorReviews(id),
      postService.getVendorPosts(id, { limit: 50 }),
      followerService.getStatus(id).catch(() => ({ data: { data: { followersCount: 0 } } })),
    ])
      .then(([vRes, rRes, pRes, fRes]) => {
        setVendor(vRes.data.data);
        setReviews(rRes.data.data || []);
        setPosts(pRes.data.data || []);
        setFollowersCount(fRes.data.data?.followersCount || 0);
      })
      .catch(() => toast.error('Vendor not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const products = vendor?.products || [];
  const availableProducts = vendor?.isOpen ? products.filter((p) => p.isAvailable) : [];
  const videoPosts = posts.filter((post) => post.media?.some((m) => m.type === 'video'));
  const filteredReviews = reviewFilter ? reviews.filter((rv) => rv.rating === reviewFilter) : reviews;

  const handleReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to leave a review'); return; }
    if (!reviewForm.comment.trim()) { toast.error('Please write a comment'); return; }
    setSubmitting(true);
    try {
      await reviewService.create({ ...reviewForm, vendorId: id });
      toast.success('Review submitted! ⭐');
      const { data } = await reviewService.getVendorReviews(id);
      setReviews(data.data || []);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  if (loading) return <PageLoader />;

  if (!vendor) {
    return (
      <MainLayout>
        <div className="page-container py-20 text-center">
          <p className="text-brand-muted">Vendor not found.</p>
          <Link to="/vendors" className="btn-primary mt-4 inline-block">Browse Vendors</Link>
        </div>
      </MainLayout>
    );
  }

  const cover = vendor.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400';
  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    r,
    count: reviews.filter((rv) => rv.rating === r).length,
  }));

  const tabs = [
    { key: 'products', label: 'Products', icon: Grid3x3, count: availableProducts.length },
    { key: 'posts', label: 'Posts', icon: BookOpen, count: posts.length },
    { key: 'videos', label: 'Videos', icon: PlayCircle, count: videoPosts.length },
    { key: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
    { key: 'about', label: 'About', icon: Info, count: null },
  ];

  return (
    <MainLayout>
      {/* Cover Photo */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-gradient-to-br from-primary/20 to-orange-100">
        <img 
          src={cover} 
          alt={vendor.businessName} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="page-container relative -mt-20 pb-12">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Vendor Header Card */}
            <div className="bg-white rounded-3xl shadow-card border border-orange-100 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-white">
                    {vendor.logo ? (
                      <img src={vendor.logo} alt={vendor.businessName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
                        <span className="font-poppins font-bold text-white text-4xl">{vendor.businessName?.[0]}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-3 mb-3">
                    <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-brand-dark">
                      {vendor.businessName}
                    </h1>
                    {vendor.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                        <ShieldCheck size={12} />
                        Verified
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      vendor.isOpen 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${vendor.isOpen ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
                      {vendor.isOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <StarRating rating={vendor.rating || 0} size={16} />
                      <span className="font-bold text-brand-dark">{Number(vendor.rating || 0).toFixed(1)}</span>
                      <span className="text-brand-muted">({reviews.length})</span>
                    </div>
                    <div className="flex items-center gap-1 text-brand-muted">
                      <ShoppingBag size={14} />
                      <span>{products.length} products</span>
                    </div>
                    <div className="flex items-center gap-1 text-brand-muted">
                      <Users size={14} />
                      <span>{followersCount} followers</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-brand-muted text-sm leading-relaxed mb-4">
                    {vendor.description || 'Quality homemade food from a trusted local kitchen.'}
                  </p>

                  {/* Location & Contact */}
                  <div className="flex flex-wrap gap-4 text-sm text-brand-muted mb-5">
                    {vendor.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-primary flex-shrink-0" />
                        <span className="truncate">{vendor.address}</span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-primary flex-shrink-0" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.openingTime && vendor.closingTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-primary flex-shrink-0" />
                        <span>{vendor.openingTime} - {vendor.closingTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <FollowButton vendorId={id} size="md" variant="fill" />
                    <button
                      onClick={() => vendor.phone ? window.open(`https://wa.me/${vendor.phone.replace(/\D/g, '')}`) : toast('Phone not available')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border-2 border-orange-100 text-brand-dark text-sm font-semibold hover:border-primary hover:text-primary transition-all"
                    >
                      <MessageSquare size={16} />
                      Message
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        toast.success('Link copied! 📋');
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border-2 border-orange-100 text-brand-muted hover:border-primary hover:text-primary transition-all"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="sticky top-20 z-30 bg-white rounded-2xl shadow-sm border border-orange-100 p-1.5 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                {tabs.map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                      tab === key 
                        ? 'bg-primary text-white shadow-soft' 
                        : 'text-brand-muted hover:text-brand-dark hover:bg-brand-bg'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                    {count !== null && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        tab === key ? 'bg-white/20' : 'bg-orange-100 text-brand-muted'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Products Tab */}
                {tab === 'products' && (
                  <div>
                    {availableProducts.length === 0 ? (
                      <EmptyState 
                        icon="products" 
                        title="No products available" 
                        description="This vendor hasn't added products yet or is currently closed."
                      />
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {availableProducts.map((product) => (
                          <ProductCard key={product.id} product={{ ...product, vendor }} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Posts Tab */}
                {tab === 'posts' && (
                  <div>
                    {posts.length === 0 ? (
                      <EmptyState 
                        icon="general" 
                        title="No posts yet" 
                        description="This vendor hasn't shared any posts."
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
                        {posts.map((post) => (
                          <Link
                            key={post.id}
                            to={`/posts/${post.id}`}
                            className="aspect-square rounded-lg overflow-hidden bg-brand-bg hover:opacity-90 transition-opacity relative group"
                          >
                            {post.media && post.media.length > 0 ? (
                              <>
                                <img
                                  src={post.media[0].url}
                                  alt={post.caption}
                                  className="w-full h-full object-cover"
                                />
                                {post.media[0].type === 'video' && (
                                  <div className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                                    <PlayCircle size={14} className="text-white" fill="white" />
                                  </div>
                                )}
                                {post.media.length > 1 && (
                                  <div className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                                    <Grid3x3 size={12} className="text-white" />
                                  </div>
                                )}
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-semibold">
                                  <span className="flex items-center gap-1">
                                    <Heart size={16} fill="white" />
                                    {post.likesCount || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare size={16} />
                                    {post.commentsCount || 0}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-brand-bg p-4">
                                <p className="text-sm text-brand-muted text-center line-clamp-3">
                                  {post.caption}
                                </p>
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Videos Tab */}
                {tab === 'videos' && (
                  <div>
                    {videoPosts.length === 0 ? (
                      <EmptyState 
                        icon="general" 
                        title="No videos yet" 
                        description="This vendor hasn't shared any videos."
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
                        {videoPosts.map((post) => (
                          <Link
                            key={post.id}
                            to={`/posts/${post.id}`}
                            className="aspect-square rounded-lg overflow-hidden bg-brand-bg hover:opacity-90 transition-opacity relative group"
                          >
                            {post.media && post.media.length > 0 ? (
                              <>
                                <img
                                  src={post.media[0].url}
                                  alt={post.caption}
                                  className="w-full h-full object-cover"
                                />
                                {/* Video indicator */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center">
                                    <PlayCircle size={24} className="text-white" fill="white" />
                                  </div>
                                </div>
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-semibold">
                                  <span className="flex items-center gap-1">
                                    <Heart size={16} fill="white" />
                                    {post.likesCount || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare size={16} />
                                    {post.commentsCount || 0}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-brand-bg p-4">
                                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                                  <PlayCircle size={24} className="text-primary" />
                                </div>
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {tab === 'reviews' && (
                  <div className="space-y-6">
                    {/* Review Form */}
                    {isAuthenticated && (
                      <div className="bg-white rounded-2xl shadow-card border border-orange-100 p-6">
                        <h3 className="font-semibold text-brand-dark mb-4">Write a Review</h3>
                        <form onSubmit={handleReview} className="space-y-4">
                          <div>
                            <label className="text-sm text-brand-muted mb-2 block">Your Rating</label>
                            <StarRating
                              rating={reviewForm.rating}
                              size={28}
                              interactive
                              onChange={(r) => setReviewForm((p) => ({ ...p, rating: r }))}
                            />
                          </div>
                          <div>
                            <label className="text-sm text-brand-muted mb-2 block">Your Review</label>
                            <textarea
                              value={reviewForm.comment}
                              onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                              placeholder="Share your experience with this vendor..."
                              rows={4}
                              className="input-field resize-none text-sm"
                            />
                          </div>
                          <button type="submit" disabled={submitting} className="btn-primary px-6 py-2.5">
                            {submitting ? 'Submitting...' : 'Submit Review'}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Reviews List */}
                    {filteredReviews.length === 0 ? (
                      <EmptyState 
                        icon="reviews" 
                        title="No reviews yet" 
                        description="Be the first to review this vendor!"
                      />
                    ) : (
                      <div className="space-y-4">
                        {filteredReviews.map((review) => (
                          <div key={review.id} className="bg-white rounded-2xl shadow-card border border-orange-100 p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-primary font-bold text-sm">
                                    {review.user?.firstName?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-brand-dark text-sm">
                                    {review.user?.firstName} {review.user?.lastName}
                                  </p>
                                  <p className="text-xs text-brand-muted">{formatDate(review.createdAt)}</p>
                                </div>
                              </div>
                              <StarRating rating={review.rating} size={14} />
                            </div>
                            <p className="text-sm text-brand-muted leading-relaxed">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* About Tab */}
                {tab === 'about' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-card border border-orange-100 p-6">
                      <h2 className="font-poppins font-bold text-xl text-brand-dark mb-3">About</h2>
                      <p className="text-brand-muted leading-relaxed">
                        {vendor.description || 'This kitchen is built around homemade meals and customer-first service.'}
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-card border border-orange-100 p-6">
                      <h2 className="font-poppins font-bold text-xl text-brand-dark mb-4">Opening Hours</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <div
                            key={day}
                            className={`rounded-xl px-4 py-3 text-center ${
                              vendor.availableDays?.includes(day)
                                ? 'bg-green-50 border-2 border-green-200 text-green-700'
                                : 'bg-gray-50 border-2 border-gray-200 text-gray-500'
                            }`}
                          >
                            <p className="font-bold text-sm">{DAY_SHORT[day]}</p>
                            <p className="text-xs mt-1">
                              {vendor.availableDays?.includes(day) 
                                ? `${vendor.openingTime || '--'}-${vendor.closingTime || '--'}` 
                                : 'Closed'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-card border border-orange-100 p-6">
              <h3 className="font-bold text-brand-dark mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-muted">Total Products</span>
                  <span className="font-bold text-brand-dark">{products.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-muted">Total Orders</span>
                  <span className="font-bold text-brand-dark">{vendor.totalOrders || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-muted">Followers</span>
                  <span className="font-bold text-brand-dark">{followersCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-muted">Member Since</span>
                  <span className="font-bold text-brand-dark text-xs">
                    {formatDate(vendor.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Summary */}
            <div className="bg-white rounded-2xl shadow-card border border-orange-100 p-6">
              <h3 className="font-bold text-brand-dark mb-4">Rating Summary</h3>
              <div className="text-center mb-4">
                <p className="font-poppins font-bold text-4xl text-primary">
                  {Number(vendor.rating || 0).toFixed(1)}
                </p>
                <StarRating rating={vendor.rating || 0} size={18} />
                <p className="text-xs text-brand-muted mt-1">{reviews.length} reviews</p>
              </div>
              <div className="space-y-2">
                {ratingDist.map(({ r, count }) => (
                  <div key={r} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-brand-muted w-3">{r}</span>
                    <Star size={10} fill="#FF7A59" className="text-primary" />
                    <div className="flex-1 bg-orange-50 rounded-full h-2">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs text-brand-muted w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
