import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Clock } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ProductCard({ product, compact = false }) {
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);

  const wishlisted = isWishlisted(product.id);
  const price = Number(product.discountPrice) || Number(product.price);
  const originalPrice = Number(product.price);
  const hasDiscount = product.discountPrice && Number(product.discountPrice) > 0 && Number(product.discountPrice) < originalPrice;
  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&fit=crop';
  const vendor = product.vendor;

  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&fit=crop';
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuth('Sign in to save items to your wishlist', () => {
        toggle(product);
        toast.success('Added to wishlist');
      });
      return;
    }
    toggle(product);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl overflow-hidden border border-orange-100 shadow-card hover:shadow-card-hover transition-all group"
    >
      <Link to={`/products/${product.id}`} className="block">
        {/* Image with vendor avatar overlay */}
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={handleImageError}
          />
          
          {/* Vendor avatar - bottom left */}
          {vendor && (
            <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white shadow-sm">
              <img
                src={vendor.logo || `https://ui-avatars.com/api/?name=${vendor.businessName}&background=FF7A59&color=fff`}
                alt={vendor.businessName}
                className="w-full h-full object-cover"
                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${vendor.businessName}&background=FF7A59&color=fff`}
              />
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
            </span>
          )}

          {/* Out of Stock Badge */}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl">
                OUT OF STOCK
              </span>
            </div>
          )}

          {/* Low Stock Warning */}
          {product.stock > 0 && product.stock <= 5 && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              Only {product.stock} left!
            </span>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
              wishlisted ? 'bg-primary text-white' : 'bg-white/90 backdrop-blur-sm text-brand-muted hover:bg-primary hover:text-white'
            }`}
          >
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Quick add to cart on hover */}
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110 active:scale-95"
            >
              <ShoppingCart size={14} />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Vendor name */}
          {vendor && (
            <p className="text-xs text-primary font-medium mb-1 truncate">
              {vendor.businessName}
            </p>
          )}

          {/* Product name */}
          <h3 className="font-semibold text-brand-dark text-sm mb-2 line-clamp-1 leading-snug">
            {product.name}
          </h3>

          {/* Price and stats row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-poppins font-bold text-brand-dark text-base">
                {formatPrice(price)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-brand-muted line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-brand-muted flex-wrap">
            {/* Stock availability */}
            {product.stock !== undefined && (
              <div className="flex items-center gap-1">
                <span className={`font-semibold ${
                  product.stock === 0 
                    ? 'text-red-500' 
                    : product.stock <= 5 
                      ? 'text-orange-500' 
                      : 'text-accent'
                }`}>
                  {product.stock === 0 
                    ? 'Out of Stock' 
                    : `${product.stock} Available`
                  }
                </span>
              </div>
            )}
            
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Heart size={12} className="text-primary" />
              <span className="font-medium">{product.likes || Math.floor(Math.random() * 100 + 20)}</span>
            </div>
            
            {/* Time */}
            {product.preparationTime && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{product.preparationTime}</span>
              </div>
            )}
            
            {/* Rating if available */}
            {product.rating && (
              <div className="flex items-center gap-1 ml-auto">
                <Star size={12} fill="#FF7A59" className="text-primary" />
                <span className="font-medium">{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
