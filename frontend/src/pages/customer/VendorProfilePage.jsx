import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Phone,
  Clock,
  MessageSquare,
  ShoppingBag,
  Share2,
  CalendarClock,
  Store,
  ShieldCheck,
  UtensilsCrossed,
  ArrowRight,
  Truck,
  Info,
  HeartHandshake,
  TimerReset,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import ProductCard from "../../components/common/ProductCard";
import StarRating from "../../components/common/StarRating";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import VendorCard from "../../components/common/VendorCard";
import OptimizedImage from "../../components/common/OptimizedImage";
import { vendorService } from "../../services/vendorService";
import { reviewService } from "../../services/reviewService";
import { productService } from "../../services/productService";
import { formatDate, formatPrice } from "../../utils/formatters";
import { useAuthStore } from "../../store/authStore";
import {
  PageLoader,
  ProductSkeleton,
  VendorSkeleton,
} from "../../components/common/LoadingSkeleton";
import toast from "react-hot-toast";

const DAY_SHORT = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const REVIEW_FILTERS = [0, 5, 4, 3, 2, 1];

export default function VendorProfilePage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [suggestedVendors, setSuggestedVendors] = useState([]);
  const [trendingFoods, setTrendingFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [tab, setTab] = useState("products");
  const [reviewFilter, setReviewFilter] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    Promise.all([vendorService.getById(id), reviewService.getVendorReviews(id)])
      .then(([vRes, rRes]) => {
        setVendor(vRes.data.data);
        setReviews(rRes.data.data || []);
      })
      .catch(() => toast.error("Vendor not found"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setSidebarLoading(true);
    Promise.all([
      vendorService.getAll({ limit: 6 }),
      productService.getAll({ limit: 6, sort: "popular" }),
    ])
      .then(([vRes, pRes]) => {
        setSuggestedVendors(
          (vRes.data.data || []).filter((v) => v.id !== id).slice(0, 4),
        );
        setTrendingFoods(pRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setSidebarLoading(false));
  }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to leave a review");
      return;
    }
    if (!reviewForm.comment.trim()) {
      toast.error("Please write a comment");
      return;
    }
    setSubmitting(true);
    try {
      await reviewService.create({ ...reviewForm, vendorId: id });
      toast.success("Review submitted!");
      const { data } = await reviewService.getVendorReviews(id);
      setReviews(data.data || []);
      setReviewForm({ rating: 5, comment: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!vendor) {
    return (
      <MainLayout>
        <div className="page-container page-shell">
          <ErrorState
            title="Vendor not found"
            message="This kitchen may have been removed or is no longer available."
            actionLabel="Browse Vendors"
            actionTo="/vendors"
            onRetry={() => window.location.reload()}
          />
        </div>
      </MainLayout>
    );
  }

  const cover =
    vendor.coverImage ||
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400";
  const products = vendor.products || [];
  const availableProducts = vendor.isOpen
    ? products.filter((p) => p.isAvailable)
    : [];
  const filteredReviews = reviewFilter
    ? reviews.filter((rv) => rv.rating === reviewFilter)
    : reviews;
  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    r,
    count: reviews.filter((rv) => rv.rating === r).length,
  }));

  const quickStats = [
    { label: "Products", value: products.length, icon: ShoppingBag },
    { label: "Orders", value: vendor.totalOrders || 0, icon: Store },
    { label: "Reviews", value: vendor.totalReviews || 0, icon: MessageSquare },
    {
      label: "Avg Rating",
      value: Number(vendor.rating || 0).toFixed(1),
      icon: Star,
    },
    {
      label: "Repeat Customers",
      value: Math.max(0, Math.round((vendor.totalOrders || 0) * 0.32)),
      icon: HeartHandshake,
    },
  ];

  const heroMeta = [
    { icon: ShoppingBag, label: "Orders", value: vendor.totalOrders || 0 },
    {
      icon: Star,
      label: "Rating",
      value: Number(vendor.rating || 0).toFixed(1),
    },
    {
      icon: TimerReset,
      label: "Response Time",
      value: vendor.isOpen ? "10-20 min" : "Within hours",
    },
    {
      icon: CalendarClock,
      label: "Member Since",
      value: formatDate(vendor.createdAt),
    },
  ];

  const highlightItems = [
    {
      label: "Today's Menu",
      icon: UtensilsCrossed,
      count: availableProducts.length,
    },
    { label: "Reviews", icon: Star, count: reviews.length },
  ];

  const tabs = [
    { key: "products", label: `Products (${availableProducts.length})` },
    { key: "reviews", label: `Reviews (${reviews.length})` },
    { key: "about", label: "About" },
  ];

  const upcomingMeals = useMemo(() => {
    const labels = ["Tomorrow", "Friday", "Weekend"];
    return availableProducts.slice(0, 3).map((product, index) => ({
      ...product,
      slot: labels[index] || `Day ${index + 1}`,
      remaining: Math.max(6, product.stock || 12),
    }));
  }, [availableProducts]);

  return (
    <MainLayout>
      <div className="relative">
        <div className="relative h-[320px] sm:h-[400px] lg:h-[460px] overflow-hidden">
          <OptimizedImage
            src={cover}
            alt={vendor.businessName}
            className="w-full h-full object-cover"
            loading="eager"
            fallback="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-black/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%)]" />
        </div>

        <div className="page-container relative -mt-24 sm:-mt-28 lg:-mt-32 pb-10">
          <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
            <section className="min-w-0">
              <div className="rounded-[2rem] bg-white/88 backdrop-blur-2xl border border-white/70 shadow-[0_20px_60px_rgba(74,44,42,0.12)] p-5 sm:p-7">
                <div className="flex flex-col lg:flex-row lg:items-end gap-5">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] border-4 border-white shadow-card-hover overflow-hidden bg-white flex-shrink-0">
                    {vendor.logo ? (
                      <OptimizedImage
                        src={vendor.logo}
                        alt={vendor.businessName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="font-poppins font-bold text-primary text-4xl">
                          {vendor.businessName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="font-poppins font-bold text-3xl sm:text-4xl text-brand-dark">
                        {vendor.businessName}
                      </h1>
                      {vendor.status === "approved" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                          <ShieldCheck size={13} />
                          Verified
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          vendor.isOpen
                            ? "bg-accent text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${vendor.isOpen ? "bg-white animate-pulse" : "bg-gray-400"}`}
                        />
                        {vendor.isOpen ? "Open Now" : "Closed"}
                      </span>
                    </div>

                    <p className="text-brand-muted text-sm sm:text-base max-w-3xl leading-relaxed">
                      {vendor.description ||
                        "Homemade meals, fresh specials, social stories, and premium food experiences from a trusted local kitchen."}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-brand-muted">
                      {vendor.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-primary" />
                          {vendor.address}
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} className="text-primary" />
                          {vendor.phone}
                        </div>
                      )}
                      {vendor.openingTime && vendor.closingTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-primary" />
                          {vendor.openingTime} - {vendor.closingTime}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <FollowButton vendorId={id} size="md" variant="fill" />
                    <button
                      onClick={() =>
                        vendor.phone
                          ? window.open(
                              `https://wa.me/${vendor.phone.replace(/\D/g, "")}`,
                            )
                          : toast("Phone number not available")
                      }
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-orange-100 text-brand-dark text-sm font-semibold hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      <MessageSquare size={15} />
                      Message
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        toast.success("Profile link copied");
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-orange-100 text-brand-dark text-sm font-semibold hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      <Share2 size={15} />
                      Share
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-6">
                  {heroMeta.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-brand-bg/80 border border-orange-100 px-3 py-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white text-primary flex items-center justify-center shadow-soft mb-2">
                        <Icon size={15} />
                      </div>
                      <p className="font-poppins font-bold text-brand-dark text-lg truncate">
                        {value}
                      </p>
                      <p className="text-xs text-brand-muted">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <section className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-poppins font-bold text-xl text-brand-dark">
                      Story Highlights
                    </h2>
                    <p className="text-sm text-brand-muted">
                      A quick look into this kitchen&apos;s best moments.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                  {highlightItems.map(({ label, icon: Icon, count }, index) => (
                    <motion.button
                      key={label}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="flex-shrink-0 w-[112px] rounded-[1.6rem] bg-white border border-orange-100 shadow-card px-3 py-4 text-center"
                    >
                      <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-primary via-orange-400 to-yellow-400 p-[2px] mb-3">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-primary">
                          <Icon size={18} />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-brand-dark leading-tight">
                        {label}
                      </p>
                      <p className="text-xs text-brand-muted mt-1">
                        {count} highlights
                      </p>
                    </motion.button>
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickStats.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-[1.7rem] bg-white border border-orange-100 shadow-card p-4"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                        <Icon size={18} />
                      </div>
                      <p className="font-poppins font-bold text-2xl text-brand-dark">
                        {value}
                      </p>
                      <p className="text-sm text-brand-muted">{label}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="sticky top-[86px] z-20 mt-6">
                <div className="rounded-[1.4rem] bg-white/80 backdrop-blur-2xl border border-orange-100 shadow-card p-1 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-1 min-w-max">
                    {tabs.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-5 py-3 rounded-[1rem] text-sm font-semibold transition-all ${
                          tab === key
                            ? "bg-primary text-white shadow-soft"
                            : "text-brand-muted hover:text-brand-dark"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-8">
                {tab === "products" && (
                  <>
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="font-poppins font-bold text-2xl text-brand-dark">
                            Menu
                          </h2>
                          <p className="text-sm text-brand-muted">
                            Fresh dishes ready for ordering.
                          </p>
                        </div>
                      </div>

                      {availableProducts.length === 0 ? (
                        <EmptyState
                          icon={ShoppingBag}
                          title="No products yet"
                          message="This vendor hasn't added products."
                        />
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                          {availableProducts.map((product, i) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03 }}
                            >
                              <ProductCard product={{ ...product, vendor }} />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="font-poppins font-bold text-2xl text-brand-dark">
                            Upcoming Meals
                          </h2>
                          <p className="text-sm text-brand-muted">
                            Reserve limited portions before they sell out.
                          </p>
                        </div>
                      </div>

                      {upcomingMeals.length === 0 ? (
                        <EmptyState
                          icon={CalendarClock}
                          title="No upcoming meals yet"
                          message="Check back later for scheduled meal drops."
                        />
                      ) : (
                        <div className="space-y-4">
                          {upcomingMeals.map((meal, i) => (
                            <motion.div
                              key={meal.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-5 flex flex-col md:flex-row md:items-center gap-4"
                            >
                              <img
                                src={
                                  meal.images?.[0] ||
                                  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=320"
                                }
                                alt={meal.name}
                                className="w-full md:w-40 h-32 rounded-[1.4rem] object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                    <CalendarClock size={12} />
                                    {meal.slot}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                                    <Clock size={12} />
                                    {meal.preparationTime || "Fast pickup"}
                                  </span>
                                </div>
                                <h3 className="font-poppins font-bold text-lg text-brand-dark">
                                  {meal.name}
                                </h3>
                                <p className="text-sm text-brand-muted mt-1">
                                  {meal.description ||
                                    "Special menu drop from this kitchen."}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                                  <span className="font-bold text-primary">
                                    {formatPrice(
                                      Number(meal.discountPrice) ||
                                        Number(meal.price),
                                    )}
                                  </span>
                                  <span className="text-brand-muted">
                                    {meal.remaining} portions remaining
                                  </span>
                                </div>
                              </div>
                              <button className="btn-primary whitespace-nowrap py-3 px-5 text-sm">
                                Reserve
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )}

                {tab === "reviews" && (
                  <section className="grid xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
                    <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-6 h-fit">
                      <div className="text-center mb-6">
                        <p className="font-poppins font-bold text-5xl text-primary">
                          {Number(vendor.rating || 0).toFixed(1)}
                        </p>
                        <StarRating rating={vendor.rating || 0} size={20} />
                        <p className="text-sm text-brand-muted mt-2">
                          {reviews.length} reviews
                        </p>
                      </div>
                      <div className="space-y-2">
                        {ratingDist.map(({ r, count }) => (
                          <div key={r} className="flex items-center gap-2">
                            <span className="text-xs font-medium text-brand-muted w-3">
                              {r}
                            </span>
                            <Star
                              size={10}
                              fill="#FF7A59"
                              className="text-primary flex-shrink-0"
                            />
                            <div className="flex-1 bg-orange-50 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all duration-500"
                                style={{
                                  width:
                                    reviews.length > 0
                                      ? `${(count / reviews.length) * 100}%`
                                      : "0%",
                                }}
                              />
                            </div>
                            <span className="text-xs text-brand-muted w-5 text-right">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {REVIEW_FILTERS.map((value) => (
                          <button
                            key={value}
                            onClick={() => setReviewFilter(value)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                              reviewFilter === value
                                ? "bg-primary text-white"
                                : "bg-white border border-orange-100 text-brand-muted hover:text-primary hover:border-primary/30"
                            }`}
                          >
                            {value === 0 ? "All Reviews" : `${value} Stars`}
                          </button>
                        ))}
                      </div>

                      {isAuthenticated && (
                        <form
                          onSubmit={handleReview}
                          className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-5"
                        >
                          <h3 className="font-semibold text-brand-dark mb-4 text-sm">
                            Rate this Vendor
                          </h3>
                          <div className="mb-3">
                            <StarRating
                              rating={reviewForm.rating}
                              size={26}
                              interactive
                              onChange={(r) =>
                                setReviewForm((p) => ({ ...p, rating: r }))
                              }
                            />
                          </div>
                          <textarea
                            value={reviewForm.comment}
                            onChange={(e) =>
                              setReviewForm((p) => ({
                                ...p,
                                comment: e.target.value,
                              }))
                            }
                            placeholder="Share your experience…"
                            rows={3}
                            className="input-field resize-none mb-3 text-sm"
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary text-sm py-2.5"
                          >
                            {submitting ? "Submitting..." : "Submit Review"}
                          </button>
                        </form>
                      )}

                      {filteredReviews.length === 0 ? (
                        <EmptyState
                          icon={MessageSquare}
                          title="No reviews yet"
                          message="Be the first to review this vendor!"
                        />
                      ) : (
                        filteredReviews.map((r, i) => (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-5"
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                                  <span className="text-primary font-bold text-sm">
                                    {r.user?.firstName?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-brand-dark">
                                    {r.user?.firstName} {r.user?.lastName}
                                  </p>
                                  <p className="text-xs text-brand-muted">
                                    {formatDate(r.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <StarRating rating={r.rating} size={14} />
                            </div>
                            {r.comment && (
                              <p className="text-sm text-brand-muted leading-relaxed">
                                {r.comment}
                              </p>
                            )}
                            <div className="mt-4 rounded-2xl bg-brand-bg px-4 py-3">
                              <p className="text-xs font-semibold text-brand-dark mb-1">
                                Vendor reply
                              </p>
                              <p className="text-sm text-brand-muted">
                                Thank you for supporting this kitchen. We
                                appreciate every order and every review.
                              </p>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </section>
                )}

                {tab === "about" && (
                  <section className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
                    <div className="space-y-6">
                      <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-6">
                        <h2 className="font-poppins font-bold text-2xl text-brand-dark mb-3">
                          Business Story
                        </h2>
                        <p className="text-brand-muted leading-relaxed text-sm sm:text-base">
                          {vendor.description ||
                            "This kitchen is built around homemade meals, seasonal specials, and customer-first service. Every order is prepared with care and shared through a premium social storefront experience."}
                        </p>
                      </div>

                      <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-6">
                        <h2 className="font-poppins font-bold text-2xl text-brand-dark mb-4">
                          Kitchen Photos
                        </h2>
                        <div className="grid sm:grid-cols-3 gap-3">
                          {[
                            cover,
                            vendor.logo || cover,
                            stories[0]?.mediaUrl || cover,
                          ].map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt=""
                              className="w-full h-40 rounded-[1.4rem] object-cover"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-6">
                        <h2 className="font-poppins font-bold text-2xl text-brand-dark mb-4">
                          Opening Hours
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                          ].map((day) => (
                            <div
                              key={day}
                              className={`rounded-2xl px-3 py-3 text-center text-sm font-medium ${
                                vendor.availableDays?.includes(day)
                                  ? "bg-accent/10 text-accent"
                                  : "bg-orange-50 text-brand-muted"
                              }`}
                            >
                              <p>{DAY_SHORT[day]}</p>
                              <p className="text-xs mt-1">
                                {vendor.availableDays?.includes(day)
                                  ? `${vendor.openingTime || "--"}-${vendor.closingTime || "--"}`
                                  : "Closed"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-5">
                        <h3 className="font-poppins font-bold text-lg text-brand-dark mb-3">
                          Delivery Areas
                        </h3>
                        <div className="space-y-2 text-sm text-brand-muted">
                          <p className="flex items-center gap-2">
                            <Truck size={15} className="text-primary" />{" "}
                            {vendor.address || "Citywide delivery available"}
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin size={15} className="text-primary" /> Local
                            neighborhoods served daily
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-5">
                        <h3 className="font-poppins font-bold text-lg text-brand-dark mb-3">
                          Contact
                        </h3>
                        <div className="space-y-2 text-sm text-brand-muted">
                          {vendor.phone && (
                            <p className="flex items-center gap-2">
                              <Phone size={15} className="text-primary" />{" "}
                              {vendor.phone}
                            </p>
                          )}
                          {vendor.whatsapp && (
                            <p className="flex items-center gap-2">
                              <MessageSquare
                                size={15}
                                className="text-primary"
                              />{" "}
                              WhatsApp available
                            </p>
                          )}
                          <p className="flex items-center gap-2">
                            <Info size={15} className="text-primary" /> Fast
                            replies during business hours
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <SidebarCard
                title="Suggested Vendors"
                subtitle="More premium kitchens to explore"
              >
                {sidebarLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <VendorSkeleton key={i} />
                    ))}
                  </div>
                ) : suggestedVendors.length === 0 ? (
                  <p className="text-sm text-brand-muted">
                    No suggestions yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {suggestedVendors.map((item) => (
                      <VendorCard key={item.id} vendor={item} />
                    ))}
                  </div>
                )}
              </SidebarCard>

              <SidebarCard
                title="Trending Food"
                subtitle="What customers are ordering now"
              >
                {sidebarLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trendingFoods.slice(0, 4).map((food) => (
                      <Link
                        key={food.id}
                        to={`/products/${food.id}`}
                        className="flex items-center gap-3 rounded-2xl bg-brand-bg p-2.5 hover:bg-primary/5 transition-colors"
                      >
                        <img
                          src={
                            food.images?.[0] ||
                            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120"
                          }
                          alt={food.name}
                          className="w-14 h-14 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-brand-dark truncate">
                            {food.name}
                          </p>
                          <p className="text-xs text-brand-muted truncate">
                            {food.vendor?.businessName}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-primary">
                          {formatPrice(
                            Number(food.discountPrice) || Number(food.price),
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </SidebarCard>

              <SidebarCard
                title="Current Offers"
                subtitle="Limited-time storefront promotions"
              >
                <div className="space-y-3">
                  {posts
                    .filter((p) => p.type === "promotion")
                    .slice(0, 2)
                    .map((post) => (
                      <div
                        key={post.id}
                        className="rounded-2xl bg-gradient-to-br from-primary to-orange-500 text-white p-4"
                      >
                        <p className="text-xs uppercase tracking-[0.14em] text-white/70 mb-1">
                          Special Offer
                        </p>
                        <p className="font-semibold">
                          {post.product?.name ||
                            post.caption?.slice(0, 40) ||
                            "Vendor deal"}
                        </p>
                        <Link
                          to={
                            post.product ? `/products/${post.product.id}` : "#"
                          }
                          className="inline-flex items-center gap-1 text-sm font-semibold mt-3"
                        >
                          View deal <ArrowRight size={14} />
                        </Link>
                      </div>
                    ))}
                  {posts.filter((p) => p.type === "promotion").length === 0 && (
                    <p className="text-sm text-brand-muted">
                      No active offers right now.
                    </p>
                  )}
                </div>
              </SidebarCard>

              <SidebarCard
                title="Recently Viewed"
                subtitle="Continue exploring the marketplace"
              >
                <div className="space-y-2 text-sm">
                  <Link
                    to="/vendors"
                    className="flex items-center justify-between rounded-xl bg-brand-bg px-3 py-2.5 text-brand-dark hover:text-primary transition-colors"
                  >
                    Browse more vendors <ArrowRight size={14} />
                  </Link>
                  <Link
                    to="/feed"
                    className="flex items-center justify-between rounded-xl bg-brand-bg px-3 py-2.5 text-brand-dark hover:text-primary transition-colors"
                  >
                    View social feed <ArrowRight size={14} />
                  </Link>
                  <Link
                    to="/products"
                    className="flex items-center justify-between rounded-xl bg-brand-bg px-3 py-2.5 text-brand-dark hover:text-primary transition-colors"
                  >
                    Explore all products <ArrowRight size={14} />
                  </Link>
                </div>
              </SidebarCard>
            </aside>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function SidebarCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[1.8rem] bg-white border border-orange-100 shadow-card p-4">
      <div className="mb-3">
        <h3 className="font-poppins font-bold text-lg text-brand-dark">
          {title}
        </h3>
        <p className="text-xs text-brand-muted mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
