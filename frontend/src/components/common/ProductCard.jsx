import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Clock, Flame } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);

  const wishlisted = isWishlisted(product.id);
  const price = product.discountPrice || product.price;
  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Guests can add to cart — they'll be asked to login at checkout
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
      className="card card-hover group"
    >
      <Link to={`/products/${product.id}`}>
        {/* Image */}
        <div className="relative overflow-hidden h-48">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isFreshToday && (
              <span className="flex items-center gap-1 bg-accent text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                <Flame size={10} /> Fresh Today
              </span>
            )}
            {product.discountPrice && (
              <span className="bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
              </span>
            )}
          </div>
          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-card transition-all ${
              wishlisted ? 'bg-primary text-white' : 'bg-white text-brand-muted hover:bg-primary hover:text-white'
            }`}
          >
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          {/* Cart overlay */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full bg-primary text-white text-sm font-semibold py-2.5 flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors"
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-primary font-medium mb-1">{product.vendor?.businessName}</p>
          <h3 className="font-semibold text-brand-dark text-sm mb-2 line-clamp-2 leading-snug">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-poppins font-bold text-brand-dark">{formatPrice(price)}</span>
              {product.discountPrice && (
                <span className="text-xs text-brand-muted line-through ml-2">{formatPrice(product.price)}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-brand-muted">
              <Star size={12} fill="#FF7A59" className="text-primary" />
              <span className="font-medium">{product.rating?.toFixed(1) || '—'}</span>
            </div>
          </div>
          {product.preparationTime && (
            <div className="flex items-center gap-1 mt-2 text-xs text-brand-muted">
              <Clock size={12} />
              <span>{product.preparationTime}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
