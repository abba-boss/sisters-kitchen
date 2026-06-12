import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star, MapPin, Phone, Clock, CheckCircle,
  MessageSquare, Heart, ChevronRight, Flame
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import ProductCard from '../../components/common/ProductCard';
import StarRating from '../../components/common/StarRating';
import { PageLoader, ProductSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { vendorService } from '../../services/vendorService';
import { reviewService } from '../../services/reviewService';
import { formatDate, formatPrice } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

export default function VendorProfilePage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const [productFilter, setProductFilter] = useState('all');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    Promise.all([
      vendorService.getById(id),
      reviewService.getVendorReviews(id),
    ])
      .then(([vRes, rRes]) => {
        setVendor(vRes.data.data);
        setReviews(rRes.data.data || []);
      })
      .catch(() => toast.error('Vendor not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to leave a review'); return; }
    if (!reviewForm.comment.trim()) { toast.error('Please write a comment'); return; }
    setSubmitting(true);
    try {
      await reviewService.create({ ...reviewForm, vendorId: id });
      toast.success('Review submitted!');
      const { data } = await reviewService.getVendorReviews(id);
      setReviews(data.data || []);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  if (loading) return <PageLoader />;
  if (!vendor) return (
    <MainLayout>
      <div className="page-container py-20 text-center">
        <p className="text-brand-muted">Vendor not found.</p>
        <Link to="/vendors" className="btn-primary mt-4 inline-block">Browse Vendors</Link>
      </div>
    </MainLayout>
  );

  const cover = vendor.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200';
  const products = vendor.products || [];
  const availableProducts = products.filter((p) => p.isAvailable);
  const featuredProducts = products.filter((p) => p.isFeatured && p.isAvailable);
  const freshProducts = products.filter((p) => p.isFreshToday && p.isAvailable);
  const displayProducts =
    productFilter === 'featured' ? featuredProducts :
    productFilter === 'fresh' ? freshProducts :
    availableProducts;

  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    r, count: reviews.filter((rv) => rv.rating === r).length,
  }));

  return (
    <MainLayout>
      {/* Cover Banner */}
      <div className="relative h-56 sm:h-72 overflow-hidden">
        <img src={cover} alt={vendor.businessName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <div className="page-container">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-card-hover overflow-hidden bg-white flex-shrink-0">
                {vendor.logo ? (
                  <img src={vendor.logo} alt={vendor.businessName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="font-poppins font-bold text-primary text-3xl">{vendor.businessName?.[0]}</span>
                  </div>
                )}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-poppins font-bold text-xl sm:text-2xl text-white">{vendor.businessName}</h1>
                  {vendor.status === 'approved' && <CheckCircle size={18} className="text-accent" />}
                  <span className={`badge text-xs ${vendor.isOpen ? 'bg-accent text-white' : 'bg-white/20 text-white'}`}>
                    {vendor.isOpen ? '● Open' : '○ Closed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-6">
        {/* Meta info row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-muted mb-4">
          <div className="flex items-center gap-1.5">
            <Star size={14} fill="#FF7A59" className="text-primary" />
            <span className="font-semibold text-brand-dark">{Number(vendor.rating || 0).toFixed(1)}</span>
            <span>({vendor.totalReviews} reviews)</span>
          </div>
          {vendor.address && (
            <div className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" />{vendor.address}</div>
          )}
          {vendor.phone && (
            <a href={`tel:${vendor.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone size={14} className="text-primary" />{vendor.phone}
            </a>
          )}
          {vendor.openingTime && (
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-primary" />{vendor.openingTime} – {vendor.closingTime}
            </div>
          )}
        </div>

        {/* Available days */}
        {vendor.availableDays?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day) => (
              <span key={day} className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                vendor.availableDays.includes(day)
                  ? 'bg-accent/10 text-accent'
                  : 'bg-orange-50 text-brand-muted'
              }`}>{DAY_SHORT[day]}</span>
            ))}
          </div>
        )}

        {vendor.description && (
          <p className="text-brand-muted text-sm leading-relaxed mb-6 max-w-2xl">{vendor.description}</p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Products', value: products.length },
            { label: 'Reviews', value: vendor.totalReviews },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4 text-center">
              <p className="font-poppins font-bold text-xl text-brand-dark">{value}</p>
              <p className="text-xs text-brand-muted">{label}</p>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card mb-6 w-fit">
          {[['products', 'Menu'], ['reviews', 'Reviews']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key ? 'bg-primary text-white shadow-soft' : 'text-brand-muted hover:text-brand-dark'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {tab === 'products' && (
          <>
            {/* Product filters */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 pb-1">
              {[
                ['all', 'All Menu'],
                ['featured', `⭐ Featured (${featuredProducts.length})`],
                ['fresh', `🔥 Fresh Today (${freshProducts.length})`],
              ].map(([key, label]) => (
                <button key={key} onClick={() => setProductFilter(key)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    productFilter === key
                      ? 'bg-primary text-white shadow-soft'
                      : 'bg-white text-brand-muted border border-orange-100 hover:border-primary hover:text-primary'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {displayProducts.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No products available" message="This vendor hasn't added products yet." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayProducts.map((product, i) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <ProductCard product={{ ...product, vendor }} />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Reviews Tab */}
        {tab === 'reviews' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Rating summary */}
            <div className="card p-6 h-fit">
              <div className="text-center mb-5">
                <p className="font-poppins font-bold text-5xl text-primary">{Number(vendor.rating || 0).toFixed(1)}</p>
                <StarRating rating={vendor.rating || 0} size={20} />
                <p className="text-sm text-brand-muted mt-1">{reviews.length} reviews</p>
              </div>
              <div className="space-y-2">
                {ratingDist.map(({ r, count }) => (
                  <div key={r} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-brand-muted w-3">{r}</span>
                    <Star size={10} fill="#FF7A59" className="text-primary flex-shrink-0" />
                    <div className="flex-1 bg-orange-50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-xs text-brand-muted w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {/* Review form */}
              {isAuthenticated && (
                <form onSubmit={handleReview} className="card p-5">
                  <h3 className="font-semibold text-brand-dark mb-4 text-sm">Rate this Vendor</h3>
                  <div className="mb-3">
                    <StarRating rating={reviewForm.rating} size={26} interactive
                      onChange={(r) => setReviewForm((p) => ({ ...p, rating: r }))} />
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="Share your experience with this vendor…"
                    rows={3}
                    className="input-field resize-none mb-3 text-sm"
                  />
                  <button type="submit" disabled={submitting} className="btn-primary text-sm py-2.5">
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Reviews list */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <EmptyState icon={MessageSquare} title="No reviews yet" message="Be the first to review this vendor!" />
                ) : (
                  reviews.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">{r.user?.firstName?.[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-dark">{r.user?.firstName} {r.user?.lastName}</p>
                            <p className="text-xs text-brand-muted">{formatDate(r.createdAt)}</p>
                          </div>
                        </div>
                        <StarRating rating={r.rating} size={14} />
                      </div>
                      {r.comment && <p className="text-sm text-brand-muted leading-relaxed pl-12">{r.comment}</p>}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
