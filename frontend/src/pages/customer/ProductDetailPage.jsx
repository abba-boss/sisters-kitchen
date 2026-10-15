import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Star, Clock, Minus, Plus,
  Store, ChevronRight, Flame, Share2, CheckCircle, ArrowLeft
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { PageLoader } from '../../components/common/LoadingSkeleton';
import StarRating from '../../components/common/StarRating';
import { productService } from '../../services/productService';
import { reviewService } from '../../services/reviewService';
import { useCart } from '../../hooks/useCart';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
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
  const { isAuthenticated } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);

  useEffect(() => {
    productService.getById(id)
      .then(({ data }) => setProduct(data.data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    // Guests can add to cart — login is only required at checkout
    const success = addToCart(product, qty);
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Link copied!');
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuth('Sign in to leave a review for this dish');
      return;
    }
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
      <div className="page-container py-4 sm:py-6 lg:py-10">
        {/* Back Button & Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Link to="/products" className="inline-flex items-center gap-2 text-brand-muted hover:text-primary transition-colors text-sm font-medium mb-3">
            <ArrowLeft size={16} />
            Back to Products
          </Link>
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-brand-muted overflow-x-auto scrollbar-hide pb-1">
            <Link to="/" className="hover:text-primary whitespace-nowrap">Home</Link>
            <ChevronRight size={14} className="flex-shrink-0" />
            <Link to="/products" className="hover:text-primary whitespace-nowrap">Products</Link>
            {product.category && <>
              <ChevronRight size={14} className="flex-shrink-0" />
              <Link to={`/products?category=${product.category.id}`} className="hover:text-primary whitespace-nowrap">{product.category.name}</Link>
            </>}
            <ChevronRight size={14} className="flex-shrink-0" />
            <span className="text-brand-dark font-medium truncate max-w-[150px] sm:max-w-none">{product.name}</span>
          </nav>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Images - Equal space on large screens */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl overflow-hidden h-64 sm:h-72 md:h-80 lg:h-96 shadow-card relative bg-brand-bg">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  src={images[activeImg]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
              {discountPct > 0 && (
                <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow">
                  -{discountPct}%
                </span>
              )}
              {product.isFreshToday && (
                <span className="absolute top-3 right-3 bg-accent text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow flex items-center gap-1">
                  <Flame size={12} /> Fresh
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImg === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info - Equal space on large screens */}
          <div className="lg:col-span-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="font-poppins font-bold text-xl sm:text-2xl text-brand-dark leading-tight mb-2">
                  {product.name}
                </h1>
                {/* Vendor */}
                <Link to={`/vendors/${product.vendor?.id}`} className="flex items-center gap-2 group w-fit">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Store size={12} className="text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-brand-muted group-hover:text-primary transition-colors truncate">
                    {product.vendor?.businessName}
                  </span>
                  <ChevronRight size={12} className="text-brand-muted group-hover:text-primary flex-shrink-0" />
                </Link>
              </div>
              <button onClick={handleShare} className="p-2 rounded-lg bg-brand-bg text-brand-muted hover:bg-primary/10 hover:text-primary transition-all flex-shrink-0">
                <Share2 size={16} />
              </button>
            </div>

            {/* Rating & Price */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <StarRating rating={product.rating || 0} size={16} />
                <span className="text-sm font-bold text-brand-dark">{Number(product.rating || 0).toFixed(1)}</span>
                <span className="text-xs text-brand-muted">({product.totalReviews})</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-poppins font-bold text-2xl text-primary">{formatPrice(price)}</span>
                {product.discountPrice && (
                  <span className="text-sm text-brand-muted line-through">{formatPrice(product.price)}</span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-brand-muted text-sm leading-relaxed mb-4">{product.description}</p>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.preparationTime && (
                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                  <Clock size={12} /> {product.preparationTime}
                </span>
              )}
              {product.stock !== undefined && product.stock > 0 && (
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  product.stock <= 5 
                    ? 'bg-orange-50 text-orange-600' 
                    : 'bg-green-50 text-accent'
                }`}>
                  <CheckCircle size={12} /> {product.stock} in stock
                </span>
              )}
            </div>

            {/* Stock Warnings */}
            {product.stock <= 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-600">Out of Stock</p>
              </div>
            )}
            {product.stock > 0 && product.stock <= 10 && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-semibold text-orange-600">Only {product.stock} left!</p>
              </div>
            )}

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-semibold text-brand-dark">Qty:</span>
                <div className="flex items-center gap-2 bg-brand-bg rounded-lg p-1">
                  <button onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 rounded-lg bg-white flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                    <Minus size={14} />
                  </button>
                  <span className="font-bold text-brand-dark w-8 text-center">{qty}</span>
                  <button 
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    disabled={qty >= product.stock}
                    className="w-8 h-8 rounded-lg bg-white flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-50">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <motion.button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              whileTap={{ scale: product.stock > 0 ? 0.97 : 1 }}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                product.stock <= 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : addedToCart 
                    ? 'bg-accent text-white' 
                    : 'bg-primary text-white hover:bg-primary/90'
              }`}>
              {product.stock <= 0 ? (
                <>Out of Stock</>
              ) : addedToCart ? (
                <><CheckCircle size={18} /> Added to Cart!</>
              ) : (
                <><ShoppingCart size={18} /> Add to Cart — {formatPrice(price * qty)}</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-10">
          <h2 className="font-poppins font-bold text-xl text-brand-dark mb-6">
            Reviews ({product.totalReviews})
          </h2>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Rating Summary */}
            <div className="card p-5">
              <div className="text-center mb-4">
                <p className="font-poppins font-bold text-4xl text-primary">{Number(product.rating || 0).toFixed(1)}</p>
                <StarRating rating={product.rating || 0} size={18} />
                <p className="text-xs text-brand-muted mt-1">{product.totalReviews} reviews</p>
              </div>
              <div className="space-y-2">
                {ratingDist.map(({ r, count }) => (
                  <button key={r}
                    onClick={() => setRatingFilter(ratingFilter === r ? 0 : r)}
                    className={`w-full flex items-center gap-2 transition-all ${ratingFilter === r ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>
                    <span className="text-xs font-medium text-brand-muted w-3">{r}</span>
                    <Star size={10} fill="#FF7A59" className="text-primary" />
                    <div className="flex-1 bg-orange-50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all"
                        style={{ width: product.totalReviews > 0 ? `${(count / product.totalReviews) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-xs text-brand-muted w-5 text-right">{count}</span>
                  </button>
                ))}
              </div>
              {ratingFilter > 0 && (
                <button onClick={() => setRatingFilter(0)} className="text-xs text-primary mt-3 hover:underline w-full text-center">
                  Clear
                </button>
              )}
            </div>

            <div className="lg:col-span-3 space-y-4">
              {/* Write Review */}
              {isAuthenticated && (
                <form onSubmit={handleReview} className="card p-4">
                  <h3 className="font-semibold text-brand-dark mb-3 text-sm">Write a Review</h3>
                  <div className="mb-3">
                    <StarRating rating={review.rating} size={20} interactive onChange={(r) => setReview((p) => ({ ...p, rating: r }))} />
                  </div>
                  <textarea
                    value={review.comment}
                    onChange={(e) => setReview((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="Share your thoughts about this dish..."
                    rows={2}
                    className="input-field resize-none mb-3 text-sm"
                  />
                  <button type="submit" disabled={submitting} className="btn-primary text-sm py-2">
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-hide">
                {(filteredReviews || []).length === 0 ? (
                  <div className="card p-6 text-center">
                    <Star className="text-brand-muted mx-auto mb-2" size={24} />
                    <p className="text-brand-muted text-sm">No reviews yet</p>
                  </div>
                ) : (
                  (filteredReviews || []).map((r) => (
                    <div key={r.id} className="card p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-xs">{r.user?.firstName?.[0]}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-brand-dark truncate">{r.user?.firstName} {r.user?.lastName}</p>
                            <p className="text-xs text-brand-muted">{formatDate(r.createdAt)}</p>
                          </div>
                        </div>
                        <StarRating rating={r.rating} size={12} />
                      </div>
                      {r.comment && <p className="text-sm text-brand-muted leading-relaxed">{r.comment}</p>}
                    </div>
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
