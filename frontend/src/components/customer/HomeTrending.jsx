import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Star,
  Clock,
  Heart,
  ShoppingCart,
  Flame,
  Award,
  Zap,
  CheckCircle,
} from "lucide-react";
import { productService } from "../../services/productService";
import { useCart } from "../../hooks/useCart";
import { useWishlistStore } from "../../store/wishlistStore";
import { useAuthStore } from "../../store/authStore";
import { useAuthModalStore } from "../../store/authModalStore";
import { formatPrice } from "../../utils/formatters";
import toast from "react-hot-toast";

const BADGE_MAP = {
  0: { label: "Best Seller", color: "bg-green-500", icon: Award },
  1: { label: "Popular", color: "bg-orange-500", icon: Flame },
  2: { label: "Hot", color: "bg-red-500", icon: Zap },
};

export default function HomeTrending() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);
  const navigate = useNavigate();

  useEffect(() => {
    productService
      .getAll({ sort: "popular", limit: 8 })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 320, behavior: "smooth" });
    }
  };

  return (
    <section className="py-8 bg-white">
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-poppins font-bold text-2xl text-brand-dark">
                Trending Today
              </h2>
              <Flame size={20} className="text-primary" />
            </div>
            <p className="text-sm text-brand-muted mt-1">
              Popular food content and top-selling dishes customers are ordering
              now.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scroll(-1)}
                className="w-10 h-10 rounded-full border border-orange-100 bg-white text-brand-muted hover:text-primary hover:border-primary/30 transition-colors flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scroll(1)}
                className="w-10 h-10 rounded-full border border-orange-100 bg-white text-brand-muted hover:text-primary hover:border-primary/30 transition-colors flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <Link
              to="/products?sort=popular"
              className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline"
            >
              See all <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[18.5rem] skeleton rounded-[1.75rem] h-[22rem]"
              />
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {products.map((product, i) => (
              <TrendingCard
                key={product.id}
                product={product}
                badge={BADGE_MAP[i]}
                index={i}
                onAdd={() => addToCart(product)}
                wishlisted={isWishlisted(product.id)}
                onWishlist={() => {
                  if (!isAuthenticated) {
                    openAuth("Sign in to save items");
                    return;
                  }
                  toggle(product);
                  favoriteService
                    .toggle(product.id)
                    .then(({ data }) => {
                      toast.success(data.isFavorite ? "Saved ❤️" : "Removed", {
                        id: `wl-${product.id}`,
                      });
                    })
                    .catch(() => {
                      toggle(product);
                      toast.error("Could not update wishlist", {
                        id: `wl-${product.id}`,
                      });
                    });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TrendingCard({
  product,
  badge,
  index,
  onAdd,
  wishlisted,
  onWishlist,
}) {
  const navigate = useNavigate();
  const price = Number(product.discountPrice) || Number(product.price);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="flex-shrink-0 w-[18.5rem] bg-white rounded-[1.9rem] shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer group border border-orange-100/70"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-brand-bg">
        <img
          src={
            product.images?.[0] ||
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"
          }
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/55 via-brand-dark/5 to-transparent" />
        {/* Badge */}
        {badge && (
          <span
            className={`absolute top-3 left-3 flex items-center gap-1 ${badge.color} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow`}
          >
            <badge.icon size={10} /> {badge.label}
          </span>
        )}
        <div className="absolute left-3 right-3 bottom-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/82 backdrop-blur-md px-2.5 py-1 shadow-soft">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white bg-brand-bg">
              {product.vendor?.logo ? (
                <img
                  src={product.vendor.logo}
                  alt={product.vendor?.businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {product.vendor?.businessName?.[0] || "V"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-brand-dark truncate flex items-center gap-1">
                {product.vendor?.businessName}
                <CheckCircle size={11} className="text-accent flex-shrink-0" />
              </p>
              <p className="text-[10px] text-brand-muted">
                Fast local delivery
              </p>
            </div>
          </div>
        </div>
        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWishlist();
          }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow transition-all backdrop-blur-sm ${
            wishlisted
              ? "bg-primary text-white"
              : "bg-white/90 text-brand-muted hover:bg-primary hover:text-white"
          }`}
        >
          <Heart size={14} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-primary font-semibold mb-0.5 truncate">
              Trending Pick
            </p>
            <h3 className="font-semibold text-brand-dark text-[15px] mb-2 line-clamp-1">
              {product.name}
            </h3>
          </div>
          {product.discountPrice && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
              Save{" "}
              {Math.round(
                ((Number(product.price) - Number(product.discountPrice)) /
                  Number(product.price)) *
                  100,
              )}
              %
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-brand-muted mb-3">
          <span className="flex items-center gap-1">
            <Star size={11} fill="#FF7A59" className="text-primary" />
            <strong className="text-brand-dark">
              {Number(product.rating || 0).toFixed(1)}
            </strong>
            <span>({product.totalReviews})</span>
          </span>
          {product.preparationTime && (
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-primary" />{" "}
              {product.preparationTime}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-poppins font-bold text-brand-dark text-lg">
              {formatPrice(price)}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-brand-muted line-through ml-1.5">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.06 }}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="px-4 h-10 bg-primary text-white rounded-full flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-soft text-sm font-semibold"
          >
            <ShoppingCart size={15} />
            Add
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
