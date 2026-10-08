import { motion } from 'framer-motion';
import { 
  ShoppingBag, Package, Search, Heart, 
  Bell, Star, FileText, AlertCircle,
  ShoppingCart, Users, TrendingUp, MapPin
} from 'lucide-react';

const ICONS = {
  cart: ShoppingCart,
  orders: ShoppingBag,
  products: Package,
  search: Search,
  favorites: Heart,
  notifications: Bell,
  reviews: Star,
  general: FileText,
  error: AlertCircle,
  vendors: Users,
  analytics: TrendingUp,
  location: MapPin,
};

export default function EmptyState({
  icon = 'general',
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryActionLabel,
  illustration,
  className = '',
}) {
  const Icon = ICONS[icon] || ICONS.general;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-12 px-4 ${className}`}
    >
      {/* Icon or Illustration */}
      {illustration ? (
        <div className="mb-6">
          <img 
            src={illustration} 
            alt={title}
            className="w-48 h-48 mx-auto object-contain"
          />
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Icon size={40} className="text-primary" />
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="font-poppins font-semibold text-xl text-brand-dark mb-3"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-brand-muted text-sm max-w-md mx-auto mb-6 leading-relaxed"
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          {action && (
            <button
              onClick={action}
              className="btn-primary px-6 py-3 text-sm"
            >
              {actionLabel || 'Get Started'}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction}
              className="btn-secondary px-6 py-3 text-sm"
            >
              {secondaryActionLabel || 'Learn More'}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Pre-configured Empty States

export function EmptyCart({ onBrowse }) {
  return (
    <EmptyState
      icon="cart"
      title="Your cart is empty"
      description="Looks like you haven't added anything to your cart yet. Browse our delicious products and add your favorites!"
      action={onBrowse}
      actionLabel="Browse Products"
    />
  );
}

export function EmptyOrders({ onBrowse, isVendor = false }) {
  if (isVendor) {
    return (
      <EmptyState
        icon="orders"
        title="No orders yet"
        description="When customers place orders, they'll appear here. Make sure your store is open and your products are attractive!"
        action={onBrowse}
        actionLabel="View My Products"
      />
    );
  }

  return (
    <EmptyState
      icon="orders"
      title="No orders yet"
      description="You haven't placed any orders yet. Start exploring and order your favorite homemade meals!"
      action={onBrowse}
      actionLabel="Start Shopping"
    />
  );
}

export function EmptyProducts({ onAdd }) {
  return (
    <EmptyState
      icon="products"
      title="No products yet"
      description="Start building your menu by adding your first delicious product. Make it look appetizing with great photos and descriptions!"
      action={onAdd}
      actionLabel="Add Your First Product"
    />
  );
}

export function EmptySearchResults({ query, onClear }) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={query 
        ? `We couldn't find anything matching "${query}". Try different keywords or browse our categories.`
        : "No items match your current filters. Try adjusting your search criteria."
      }
      action={onClear}
      actionLabel="Clear Filters"
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon="notifications"
      title="All caught up!"
      description="You don't have any new notifications. We'll notify you about orders, updates, and special offers."
    />
  );
}

export function EmptyReviews({ onOrder }) {
  return (
    <EmptyState
      icon="reviews"
      title="No reviews yet"
      description="Complete an order to leave a review and help others discover great food!"
      action={onOrder}
      actionLabel="Browse Menu"
    />
  );
}

export function ErrorState({ onRetry, message }) {
  return (
    <EmptyState
      icon="error"
      title="Oops! Something went wrong"
      description={message || "We're having trouble loading this page. Please check your connection and try again."}
      action={onRetry}
      actionLabel="Try Again"
    />
  );
}

export function EmptyVendors({ onBrowse }) {
  return (
    <EmptyState
      icon="vendors"
      title="No vendors found"
      description="We couldn't find any vendors matching your criteria. Try adjusting your filters or location."
      action={onBrowse}
      actionLabel="View All Vendors"
    />
  );
}

export function EmptyAnalytics() {
  return (
    <EmptyState
      icon="analytics"
      title="Not enough data yet"
      description="Complete a few orders and your analytics will appear here. We'll show you insights about your sales, popular products, and customer behavior."
    />
  );
}

// Compact version for smaller spaces
export function CompactEmptyState({ icon = 'general', message, action, actionLabel }) {
  const Icon = ICONS[icon] || ICONS.general;

  return (
    <div className="text-center py-8 px-4">
      <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon size={20} className="text-primary" />
      </div>
      <p className="text-sm text-brand-muted mb-3">{message}</p>
      {action && (
        <button onClick={action} className="text-sm text-primary font-semibold hover:underline">
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  );
}
