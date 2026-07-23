import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Heart,
  Star,
  Clock,
  Minus,
  Plus,
  ChevronRight,
  Flame,
  Share2,
  CheckCircle,
  ShieldCheck,
  Truck,
  Eye,
  Sparkles,
  Info,
  PlayCircle,
  Expand,
  PackageCheck,
  UtensilsCrossed,
  AlertTriangle,
  Beef,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { PageLoader } from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import OptimizedImage, { FALLBACK_IMAGE } from '../../components/common/OptimizedImage';
import StarRating from '../../components/common/StarRating';
import ProductCard from '../../components/common/ProductCard';
import { productService } from '../../services/productService';
import { reviewService } from '../../services/reviewService';
import { useCart } from '../../hooks/useCart';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { favoriteService } from '../../services/favoriteService';
import { formatPrice, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const SIZE_OPTIONS = [
  { id: 'regular', label: 'Regular', extra: 0 },
  { id: 'large', label: 'Large', extra: 1200 },
  { id: 'party', label: 'Party Pack', extra: 3500 },
];

const EXTRA_OPTIONS = [
  { id: 'cheese', label: 'Extra cheese', extra: 700 },
  { id: 'sauce', label: 'Extra sauce', extra: 400 },
  { id: 'meat', label: 'Extra meat', extra: 1200 },
];

const DRINK_OPTIONS = [
  { id: 'none', label: 'No drink', extra: 0 },
  { id: 'coke', label: 'Coke', extra: 700 },
  { id: 'fanta', label: 'Fanta', extra: 700 },
  { id: 'zobo', label: 'Zobo', extra: 900 },
];

const COOKING_PREFS = ["Chef's choice", 'Mild spice', 'Medium spice', 'Extra spicy'];
const REVIEW_FILTERS = [0, 5, 4, 3, 2, 1];

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sizeOption, setSizeOption] = useState(SIZE_OPTIONS[0].id);
  const [extras, setExtras] = useState([]);
  const [drink, setDrink] = useState(DRINK_OPTIONS[0].id);
  const [cookingPreference, setCookingPreference] = useState(COOKING_PREFS[0]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);

  useEffect(() => {
    setLoading(true);
    productService.getById(id)
      .then(async ({ data }) => {
        const item = data.data;
        setProduct(item);

        const requests = [];
        if (item.category?.id) {
          requests.push(productService.getAll({ category: item.category.id, limit: 8 }));
        } else {
          requests.push(Promise.resolve({ data: { data: [] } }));
        }
        if (item.vendor?.id) {
          requests.push(productService.getAll({ vendorId: item.vendor.id, limit: 8 }));
        } else {
          requests.push(Promise.resolve({ data: { data: [] } }));
        }

        const [relatedRes, vendorRes] = await Promise.all(requests);
        setRelatedProducts((relatedRes.data.data || []).filter((p) => p.id !== item.id).slice(0, 4));
        setVendorProducts((vendorRes.data.data || []).filter((p) => p.id !== item.id).slice(0, 4));
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;

  if (!product) {
    return (
      <MainLayout>
        <div className="page-container py-20 text-center">
          <p className="text-brand-muted">Product not found.</p>
          <Link to="/products" className="btn-primary mt-4 inline-block">Browse Food</Link>
        </div>
      </MainLayout>
    );
  }

  const images = product.images?.length
    ? product.images
    : ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900'];
  const basePrice = Number(product.discountPrice) || Number(product.price);
  const originalPrice = Number(product.price);
  const wishlisted = isWishlisted(product.id);
  const discountPct = product.discountPrice
    ? Math.round(((originalPrice - Number(product.discountPrice)) / originalPrice) * 100)
    : 0;
  const filteredReviews = ratingFilter
    ? product.reviews?.filter((r) => r.rating === ratingFilter)
    : product.reviews;
  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    r,
    count: product.reviews?.filter((rv) => rv.rating === r).length || 0,
  }));

  const selectedSize = SIZE_OPTIONS.find((item) => item.id === sizeOption) || SIZE_OPTIONS[0];
  const selectedDrink = DRINK_OPTIONS.find((item) => item.id === drink) || DRINK_OPTIONS[0];
  const extrasTotal = extras.reduce((sum, id_) => sum + (EXTRA_OPTIONS.find((item) => item.id === id_)?.extra || 0), 0);
  const liveUnitPrice = basePrice + selectedSize.extra + selectedDrink.extra + extrasTotal;
  const liveTotal = liveUnitPrice * qty;

  const productPayload = useMemo(() => ({
    ...product,
    _customization: {
      size: selectedSize.label,
      extras: EXTRA_OPTIONS.filter((item) => extras.includes(item.id)).map((item) => item.label),
      drink: selectedDrink.label,
      cookingPreference,
      specialInstructions,
    },
    _displayPrice: liveUnitPrice,
  }), [product, selectedSize, selectedDrink, extras, cookingPreference, specialInstructions, liveUnitPrice]);

  const socialProof = [
    { icon: Eye, label: 'Viewing now', value: 12 + ((product.totalOrders || 0) % 18) },
    { icon: ShoppingCart, label: 'Orders today', value: 4 + ((product.totalOrders || 0) % 9) },
    { icon: Sparkles, label: 'Best seller', value: product.totalOrders > 10 ? 'Yes' : 'Rising' },
    { icon: Flame, label: 'Fresh today', value: product.isFreshToday ? 'Fresh' : 'Popular' },
  ];

  const detailInfo = [
    { icon: UtensilsCrossed, title: 'Ingredients', value: product.tags?.length ? product.tags.join(', ') : 'Fresh kitchen ingredients prepared to order.' },
    { icon: Flame, title: 'Spice Level', value: 'Medium heat, balanced flavor' },
    { icon: Beef, title: 'Nutrition', value: 'Approx. 450-650 kcal per serving' },
    { icon: AlertTriangle, title: 'Allergens', value: 'May contain dairy, gluten, and traces of nuts' },
    { icon: PackageCheck, title: 'Serving Size', value: 'Best for 1-2 people' },
  ];

  const handleAddToCart = () => {
    const success = addToCart(productPayload, qty);
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      openAuth('Sign in to save items to your wishlist', () => {
        toggle(product);
        toast.success('Added to wishlist');
      });
      return;
    }
    toggle(product);
    favoriteService.toggle(product.id)
      .then(({ data }) => {
        toast.success(data.isFavorite ? 'Added to wishlist' : 'Removed from wishlist');
      })
      .catch(() => {
        toggle(product);
        toast.error('Could not update wishlist. Please try again.');
      });
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
      <div className="page-container page-shell">
        <nav className="flex items-center gap-2 text-sm text-brand-muted mb-6 flex-wrap">
          <Link to="/" className="hover:text-primary">Feed</Link>
          <ChevronRight size={14} />
          <Link to="/shop" className="hover:text-primary">Shop</Link>
          <ChevronRight size={14} />
          <Link to="/products" className="hover:text-primary">Products</Link>
          {product.category && (
            <>
              <ChevronRight size={14} />
              <Link to={`/products?category=${product.category.id}`} className="hover:text-primary">{product.category.name}</Link>
            </>
          )}
          <ChevronRight size={14} />
          <span className="text-brand-dark font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)_340px] gap-6 xl:gap-8 items-start">
          <section className="min-w-0">
            <div className="rounded-[2rem] bg-white border border-orange-100 shadow-card p-3 sm:p-4">
              <div className="relative rounded-[1.6rem] overflow-hidden bg-brand-bg h-[340px] sm:h-[480px] lg:h-[580px]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImg}
                    src={images[activeImg]}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  />
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/35 via-transparent to-transparent pointer-events-none" />

                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {discountPct > 0 && (
                    <span className="bg-primary text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-soft">
                      -{discountPct}% Off
                    </span>
                  )}
                  {product.isFreshToday && (
                    <span className="inline-flex items-center gap-1 bg-accent text-white text-sm font-semibold px-3 py-1.5 rounded-full shadow-soft">
                      <Flame size={13} /> Fresh Today
                    </span>
                  )}
                </div>

                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={() => setFullscreen(true)}
                    className="w-11 h-11 rounded-full bg-white/85 backdrop-blur-sm text-brand-dark flex items-center justify-center shadow-card hover:text-primary transition-colors"
                  >
                    <Expand size={18} />
                  </button>
                  <button
                    className="w-11 h-11 rounded-full bg-white/85 backdrop-blur-sm text-brand-dark flex items-center justify-center shadow-card hover:text-primary transition-colors"
                    onClick={() => toast('360° preview coming soon')}
                  >
                    <PlayCircle size={18} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-hide pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-[1.3rem] overflow-hidden border-2 transition-all ${
                      activeImg === i ? 'border-primary shadow-soft' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                <button
                  onClick={() => toast('360° interactive preview coming soon')}
                  className="flex-shrink-0 w-20 h-20 rounded-[1.3rem] bg-brand-bg border border-orange-100 text-brand-muted text-xs font-semibold hover:text-primary transition-colors"
                >
                  360° View
                </button>
              </div>
            </div>
          </section>

          <section className="min-w-0 space-y-5">
            <div className="rounded-[2rem] bg-white border border-orange-100 shadow-card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {product.isFreshToday && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                        <Flame size={12} /> Fresh Today
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      <Sparkles size={12} /> Trending
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">
                      <PackageCheck size={12} /> Best Seller
                    </span>
                  </div>
                  <h1 className="font-poppins font-bold text-3xl sm:text-4xl text-brand-dark leading-tight">
                    {product.name}
                  </h1>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={handleWishlist}
                    className={`p-3 rounded-2xl transition-all ${
                      wishlisted ? 'bg-primary text-white' : 'bg-brand-bg text-brand-muted hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-2xl bg-brand-bg text-brand-muted hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              <Link to={`/vendors/${product.vendor?.id}`} className="flex items-center gap-3 mb-5 group rounded-[1.4rem] border border-orange-100 bg-brand-bg/70 px-3 py-3">
                <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                  {product.vendor?.logo ? (
                    <img src={product.vendor.logo} alt={product.vendor?.businessName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-sm">{product.vendor?.businessName?.[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-dark flex items-center gap-1.5">
                    {product.vendor?.businessName}
                    <ShieldCheck size={14} className="text-accent" />
                  </p>
                  <p className="text-xs text-brand-muted truncate">Verified kitchen • View storefront</p>
                </div>
                <ChevronRight size={15} className="text-brand-muted group-hover:text-primary transition-colors" />
              </Link>

              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <InfoPill icon={Star} label={`${Number(product.rating || 0).toFixed(1)} rating`} sub={`${product.totalReviews || 0} reviews`} />
                <InfoPill icon={ShoppingCart} label={`${product.totalOrders || 0} sold`} sub="Loved by customers" />
                <InfoPill icon={CheckCircle} label={product.stock > 0 ? 'Available now' : 'Limited stock'} sub="Ready for order" />
                <InfoPill icon={Truck} label="24-35 min" sub="Estimated delivery" />
                <InfoPill icon={Clock} label={product.preparationTime || 'Prepared fresh'} sub="Kitchen prep time" />
                <InfoPill icon={Sparkles} label={product.category?.name || 'Homemade special'} sub="Kitchen category" />
              </div>

              <div className="flex items-end gap-3 mb-4">
                <motion.span
                  key={liveUnitPrice}
                  initial={{ scale: 0.96, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-poppins font-bold text-4xl text-brand-dark"
                >
                  {formatPrice(liveUnitPrice)}
                </motion.span>
                {product.discountPrice && (
                  <>
                    <span className="text-lg text-brand-muted line-through">{formatPrice(originalPrice)}</span>
                    <span className="text-sm font-semibold text-accent">Save {formatPrice(originalPrice - basePrice)}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {socialProof.map(({ icon: Icon, label, value }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-bg text-sm text-brand-muted">
                    <Icon size={14} className="text-primary" />
                    <strong className="text-brand-dark">{value}</strong> {label}
                  </span>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-poppins font-semibold text-brand-dark mb-2">Description</h3>
                  <p className="text-brand-muted leading-relaxed text-sm sm:text-base">
                    {expandedDesc || !product.description || product.description.length < 210
                      ? product.description
                      : `${product.description.slice(0, 210)}...`}
                  </p>
                  {product.description && product.description.length > 210 && (
                    <button
                      onClick={() => setExpandedDesc((v) => !v)}
                      className="text-sm font-semibold text-primary mt-2 hover:underline"
                    >
                      {expandedDesc ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {detailInfo.map(({ icon: Icon, title, value }) => (
                    <div key={title} className="rounded-[1.4rem] bg-brand-bg border border-orange-100 p-4">
                      <div className="w-9 h-9 rounded-2xl bg-white text-primary flex items-center justify-center shadow-soft mb-3">
                        <Icon size={16} />
                      </div>
                      <p className="font-semibold text-brand-dark text-sm mb-1">{title}</p>
                      <p className="text-xs text-brand-muted leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>

                {product.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {product.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium bg-orange-50 text-brand-muted border border-orange-100">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white border border-orange-100 shadow-card p-6">
              <h2 className="font-poppins font-bold text-2xl text-brand-dark mb-4">Reviews</h2>
              <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-5">
                <div className="rounded-[1.5rem] bg-brand-bg border border-orange-100 p-4">
                  <div className="text-center mb-4">
                    <p className="font-poppins font-bold text-5xl text-primary">{Number(product.rating || 0).toFixed(1)}</p>
                    <StarRating rating={product.rating || 0} size={20} />
                    <p className="text-sm text-brand-muted mt-1">{product.totalReviews} reviews</p>
                  </div>
                  <div className="space-y-2">
                    {ratingDist.map(({ r, count }) => (
                      <button
                        key={r}
                        onClick={() => setRatingFilter(ratingFilter === r ? 0 : r)}
                        className={`w-full flex items-center gap-2 transition-all ${ratingFilter === r ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                      >
                        <span className="text-xs font-medium text-brand-muted w-3">{r}</span>
                        <Star size={11} fill="#FF7A59" className="text-primary flex-shrink-0" />
                        <div className="flex-1 bg-orange-50 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: product.totalReviews > 0 ? `${(count / product.totalReviews) * 100}%` : '0%' }}
                          />
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

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_FILTERS.map((value) => (
                      <button
                        key={value}
                        onClick={() => setRatingFilter(value)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                          ratingFilter === value
                            ? 'bg-primary text-white'
                            : 'bg-white border border-orange-100 text-brand-muted hover:text-primary hover:border-primary/30'
                        }`}
                      >
                        {value === 0 ? 'All Reviews' : `${value} Stars`}
                      </button>
                    ))}
                  </div>

                  {isAuthenticated && (
                    <form onSubmit={handleReview} className="rounded-[1.6rem] border border-orange-100 bg-brand-bg/60 p-5">
                      <h3 className="font-semibold text-brand-dark mb-4">Write a Review</h3>
                      <div className="mb-3">
                        <p className="text-xs text-brand-muted mb-2">Your Rating</p>
                        <StarRating rating={review.rating} size={28} interactive onChange={(r) => setReview((p) => ({ ...p, rating: r }))} />
                      </div>
                      <textarea
                        value={review.comment}
                        onChange={(e) => setReview((p) => ({ ...p, comment: e.target.value }))}
                        placeholder="Share your experience with this dish..."
                        rows={3}
                        className="input-field resize-none mb-3 text-sm"
                      />
                      <button type="submit" disabled={submitting} className="btn-primary text-sm py-2.5">
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  )}

                  <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1 scrollbar-hide">
                    {(filteredReviews || []).length === 0 ? (
                      <p className="text-brand-muted text-sm text-center py-8">No reviews yet. Be the first!</p>
                    ) : (
                      (filteredReviews || []).map((r, i) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="rounded-[1.6rem] border border-orange-100 bg-white p-4 shadow-card"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                                <span className="text-primary font-bold text-sm">{r.user?.firstName?.[0]}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-brand-dark">{r.user?.firstName} {r.user?.lastName}</p>
                                <p className="text-xs text-brand-muted">{formatDate(r.createdAt)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <StarRating rating={r.rating} size={14} />
                              <p className="text-[11px] text-accent font-semibold mt-1">Verified purchase</p>
                            </div>
                          </div>
                          {r.comment && <p className="text-sm text-brand-muted leading-relaxed">{r.comment}</p>}
                          <div className="mt-4 rounded-2xl bg-brand-bg px-4 py-3">
                            <p className="text-xs font-semibold text-brand-dark mb-1">Vendor reply</p>
                            <p className="text-sm text-brand-muted">Thank you for ordering. We love serving this favorite dish fresh every time.</p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <SectionGrid title="Frequently Bought Together" subtitle="Popular add-ons customers combine with this dish.">
              {(relatedProducts.length ? relatedProducts : vendorProducts).slice(0, 4).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </SectionGrid>

            <SectionGrid title="More From This Vendor" subtitle="Keep ordering from the same kitchen.">
              {vendorProducts.slice(0, 4).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </SectionGrid>

            <SectionGrid title="Similar Products" subtitle="You may also like these related dishes.">
              {relatedProducts.slice(0, 4).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </SectionGrid>
          </section>

          <aside className="xl:sticky xl:top-24 space-y-5">
            <div className="rounded-[2rem] bg-white border border-orange-100 shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-brand-muted">Order Summary</p>
                  <h2 className="font-poppins font-bold text-2xl text-brand-dark">Customize your order</h2>
                </div>
                <span className="text-sm font-semibold text-primary">{formatPrice(liveTotal)}</span>
              </div>

              <div className="space-y-5">
                <OptionSection title="Size">
                  <div className="grid grid-cols-1 gap-2">
                    {SIZE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSizeOption(option.id)}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors ${
                          sizeOption === option.id
                            ? 'border-primary bg-primary/5 text-brand-dark'
                            : 'border-orange-100 bg-white text-brand-muted hover:border-primary/30'
                        }`}
                      >
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs font-semibold">{option.extra > 0 ? `+${formatPrice(option.extra)}` : 'Included'}</span>
                      </button>
                    ))}
                  </div>
                </OptionSection>

                <OptionSection title="Extras">
                  <div className="space-y-2">
                    {EXTRA_OPTIONS.map((option) => {
                      const active = extras.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => setExtras((prev) => prev.includes(option.id) ? prev.filter((item) => item !== option.id) : [...prev, option.id])}
                          className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors ${
                            active
                              ? 'border-primary bg-primary/5 text-brand-dark'
                              : 'border-orange-100 bg-white text-brand-muted hover:border-primary/30'
                          }`}
                        >
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs font-semibold">+{formatPrice(option.extra)}</span>
                        </button>
                      );
                    })}
                  </div>
                </OptionSection>

                <OptionSection title="Drink Selection">
                  <div className="grid grid-cols-1 gap-2">
                    {DRINK_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setDrink(option.id)}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors ${
                          drink === option.id
                            ? 'border-primary bg-primary/5 text-brand-dark'
                            : 'border-orange-100 bg-white text-brand-muted hover:border-primary/30'
                        }`}
                      >
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs font-semibold">{option.extra > 0 ? `+${formatPrice(option.extra)}` : 'No extra'}</span>
                      </button>
                    ))}
                  </div>
                </OptionSection>

                <OptionSection title="Cooking Preference">
                  <div className="flex flex-wrap gap-2">
                    {COOKING_PREFS.map((item) => (
                      <button
                        key={item}
                        onClick={() => setCookingPreference(item)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                          cookingPreference === item
                            ? 'bg-primary text-white'
                            : 'bg-brand-bg text-brand-muted hover:text-primary'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </OptionSection>

                <OptionSection title="Special Instructions">
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="E.g. less pepper, no onions, extra napkins..."
                    rows={3}
                    className="input-field resize-none text-sm"
                  />
                </OptionSection>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand-dark">Quantity</span>
                  <div className="flex items-center gap-3 bg-brand-bg rounded-2xl p-1">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-10 h-10 rounded-xl bg-white shadow-card flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-bold text-brand-dark w-6 text-center">{qty}</span>
                    <button
                      onClick={() => setQty(qty + 1)}
                      className="w-10 h-10 rounded-xl bg-white shadow-card flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-brand-bg border border-orange-100 p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-brand-muted">Unit total</span>
                    <span className="font-semibold text-brand-dark">{formatPrice(liveUnitPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-brand-muted">Quantity</span>
                    <span className="font-semibold text-brand-dark">x{qty}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-orange-100">
                    <span className="font-semibold text-brand-dark">Live total</span>
                    <span className="font-poppins font-bold text-xl text-primary">{formatPrice(liveTotal)}</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all ${
                    addedToCart ? 'bg-accent text-white' : 'btn-primary'
                  }`}
                >
                  {addedToCart ? (
                    <><CheckCircle size={20} /> Added to Cart!</>
                  ) : (
                    <><ShoppingCart size={20} /> Add to Cart — {formatPrice(liveTotal)}</>
                  )}
                </motion.button>

                <button className="w-full py-4 rounded-2xl font-semibold text-base bg-white border border-orange-100 text-brand-dark hover:border-primary/30 hover:text-primary transition-colors">
                  Buy Now
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/92 backdrop-blur-2xl border-t border-orange-100 p-3 safe-area-pb">
        <div className="page-container flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-brand-muted">Live total</p>
            <p className="font-poppins font-bold text-brand-dark">{formatPrice(liveTotal)}</p>
          </div>
          <motion.button
            onClick={handleAddToCart}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all ${
              addedToCart ? 'bg-accent text-white' : 'btn-primary'
            }`}
          >
            {addedToCart ? <><CheckCircle size={18} /> Added</> : <><ShoppingCart size={18} /> Add to Cart</>}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setFullscreen(false)}
          >
            <motion.img
              key={activeImg}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              src={images[activeImg]}
              alt={product.name}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

function InfoPill({ icon: Icon, label, sub }) {
  return (
    <div className="rounded-[1.4rem] bg-brand-bg border border-orange-100 px-3 py-3">
      <div className="w-8 h-8 rounded-2xl bg-white text-primary flex items-center justify-center shadow-soft mb-2">
        <Icon size={15} />
      </div>
      <p className="text-sm font-semibold text-brand-dark">{label}</p>
      <p className="text-xs text-brand-muted mt-0.5">{sub}</p>
    </div>
  );
}

function OptionSection({ title, children }) {
  return (
    <div>
      <h3 className="font-semibold text-brand-dark mb-3">{title}</h3>
      {children}
    </div>
  );
}

function SectionGrid({ title, subtitle, children }) {
  if (!children || children.length === 0) return null;
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-poppins font-bold text-2xl text-brand-dark">{title}</h2>
        <p className="text-sm text-brand-muted mt-1">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {children}
      </div>
    </section>
  );
}
