import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Heart, Star, Clock, Minus, Plus,
  Store, ChevronRight, Flame, Share2, CheckCircle
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { PageLoader } from '../../components/common/LoadingSkeleton';
import StarRating from '../../components/common/StarRating';
import { productService } from '../../services/productService';
import { reviewService } from '../../services/reviewService';
import { useCart } from '../../hooks/useCart';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { formatPrice, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);

  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    productService.getById(id)
      .then(({ data }) => setProduct(data.data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!product) return (
    <MainLayout>
      <div className="page-container py-20 text-center">
        <p className="text-brand-muted">Product not found.</p>
        <Link to="/products" className="btn-primary mt-4 inline-block">Browse Food</Link>
      </div>
    </MainLayout>
  );

  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600'];
  const price = Number(product.discountPrice) || Number(product.price);
  const wishlisted = isWishlisted(product.id);
  const discountPct = product.discountPrice
    ? Math.round(((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100)
    : 0;

  const filteredReviews = ratingFilter
    ? product.reviews?.filter((r) => r.rating === ratingFilter)
    : product.reviews;

  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    r, count: product.reviews?.filter((rv) => rv.rating === r).length || 0,
  }));

  const handleAddToCart = () => {
    if (!isAuthenticated) { toast.error('Please login first'); return; }
    const success = addToCart(product, qty);
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) { toast.error('Please login first'); return; }
    toggle(product);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Link copied!');
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to review'); return; }
    if (!review.comment.trim()) { toast.error('Please write a comment'); return; }
    setSubmitting(true);
    try {
      await reviewService.create({ ...review, productId: product.id });
      toast.success('Review submitted! ⭐');
      const { data } = await productService.getById(id);
      setProduct(data.data);
      setReview({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  return (
    <MainLayout>
      <div className="page-container py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-brand-muted mb-6 flex-wrap">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight size={14} />
          <Link to="/products" className="hover:text-primary">Products</Link>
          {product.category && <>
            <ChevronRight size={14} />
            <Link to={`/products?category=${product.category.id}`} className="hover:text-primary">{product.category.name}</Link>
          </>}
          <ChevronRight size={14} />
          <span className="text-brand-dark font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Images */}
          <div>
            <div className="rounded-3xl overflow-hidden h-80 sm:h-96 shadow-card relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  src={images[activeImg]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                />
              </AnimatePresence>
              {discountPct > 0 && (
                <span className="absolute top-4 left-4 bg-primary text-white text-sm font-bold px-3 py-1 rounded-full shadow">
                  -{discountPct}%
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-hide pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-primary shadow-soft' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                {product.isFreshToday && (
                  <span className="badge badge-success mb-2 inline-flex">
                    <Flame size={12} /> Fresh Today
                  </span>
                )}
                <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-brand-dark leading-tight">
                  {product.name}
                </h1>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={handleWishlist}
                  className={`p-2.5 rounded-2xl transition-all ${wishlisted ? 'bg-primary text-white' : 'bg-brand-bg text-brand-muted hover:bg-primary/10 hover:text-primary'}`}>
                  <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
                <button onClick={handleShare} className="p-2.5 rounded-2xl bg-brand-bg text-brand-muted hover:bg-primary/10 hover:text-primary transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            {/* Vendor */}
            <Link to={`/vendors/${product.vendor?.id}`} className="flex items-center gap-2 mb-4 group w-fit">
              <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-xs">{product.vendor?.businessName?.[0]}</span>
              </div>
              <span className="text-sm font-medium text-brand-muted group-hover:text-primary transition-colors">
                {product.vendor?.businessName}
              </span>
              <ChevronRight size={13} className="text-brand-muted group-hover:text-primary" />
            </Link>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <StarRating rating={product.rating || 0} size={18} />
              <span className="text-sm font-semibold text-brand-dark">{Number(product.rating || 0).toFixed(1)}</span>
              <span className="text-sm text-brand-muted">({product.totalReviews} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="font-poppins font-bold text-3xl text-brand-dark">{formatPrice(price)}</span>
              {product.discountPrice && (
                <span className="text-lg text-brand-muted line-through">{formatPrice(product.price)}</span>
              )}
            </div>

            <p className="text-brand-muted leading-relaxed text-sm mb-5">{product.description}</p>

            <div className="flex flex-wrap gap-4 mb-5 text-sm text-brand-muted">
              {product.preparationTime && (
                <span className="flex items-center gap-1.5 bg-brand-bg px-3 py-1.5 rounded-full">
                  <Clock size={14} className="text-primary" /> {product.preparationTime}
                </span>
              )}
              {product.stock > 0 && (
                <span className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                  <CheckCircle size={14} /> In stock
                </span>
              )}
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {product.tags.map((tag) => (
                  <span key={tag} className="badge bg-orange-50 text-brand-muted text-xs">#{tag}</span>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-semibold text-brand-dark">Qty:</span>
              <div className="flex items-center gap-3 bg-brand-bg rounded-2xl p-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-9 rounded-xl bg-white shadow-card flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <Minus size={16} />
                </button>
                <span className="font-bold text-brand-dark w-6 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  className="w-9 h-9 rounded-xl bg-white shadow-card flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <motion.button
              onClick={handleAddToCart}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all ${addedToCart ? 'bg-accent text-white' : 'btn-primary'}`}>
              {addedToCart ? (
                <><CheckCircle size={20} /> Added to Cart!</>
              ) : (
                <><ShoppingCart size={20} /> Add to Cart — {formatPrice(price * qty)}</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="font-poppins font-bold text-2xl text-brand-dark mb-8">
            Reviews <span className="text-brand-muted font-normal text-lg">({product.totalReviews})</span>
          </h2>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Rating Summary */}
            <div className="card p-6">
              <div className="text-center mb-5">
                <p className="font-poppins font-bold text-5xl text-primary">{Number(product.rating || 0).toFixed(1)}</p>
                <StarRating rating={product.rating || 0} size={22} />
                <p className="text-sm text-brand-muted mt-1">{product.totalReviews} reviews</p>
              </div>
              <div className="space-y-2">
                {ratingDist.map(({ r, count }) => (
                  <button key={r}
                    onClick={() => setRatingFilter(ratingFilter === r ? 0 : r)}
                    className={`w-full flex items-center gap-2 group transition-all ${ratingFilter === r ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}>
                    <span className="text-xs font-medium text-brand-muted w-3">{r}</span>
                    <Star size={11} fill="#FF7A59" className="text-primary flex-shrink-0" />
                    <div className="flex-1 bg-orange-50 rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: product.totalReviews > 0 ? `${(count / product.totalReviews) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-xs text-brand-muted w-5 text-right">{count}</span>
                  </button>
                ))}
              </div>
              {ratingFilter > 0 && (
                <button onClick={() => setRatingFilter(0)} className="text-xs text-primary mt-3 hover:underline w-full text-center">
                  Clear filter
                </button>
              )}
            </div>

            <div className="lg:col-span-2 space-y-5">
              {/* Write Review */}
              {isAuthenticated && (
                <form onSubmit={handleReview} className="card p-5">
                  <h3 className="font-semibold text-brand-dark mb-4">Write a Review</h3>
                  <div className="mb-3">
                    <p className="text-xs text-brand-muted mb-2">Your Rating</p>
                    <StarRating rating={review.rating} size={28} interactive onChange={(r) => setReview((p) => ({ ...p, rating: r }))} />
                  </div>
                  <textarea
                    value={review.comment}
                    onChange={(e) => setReview((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="Share your experience with this dish…"
                    rows={3}
                    className="input-field resize-none mb-3 text-sm"
                  />
                  <button type="submit" disabled={submitting} className="btn-primary text-sm py-2.5">
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-hide">
                {(filteredReviews || []).length === 0 ? (
                  <p className="text-brand-muted text-sm text-center py-8">No reviews yet. Be the first!</p>
                ) : (
                  (filteredReviews || []).map((r, i) => (
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
        </div>
      </div>
    </MainLayout>
  );
}
