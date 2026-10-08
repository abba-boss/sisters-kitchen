import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ProductCard from '../../components/common/ProductCard';
import EmptyState from '../../components/common/EmptyState';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { favoriteService } from '../../services/favoriteService';

export default function WishlistPage() {
  const { items, clear } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const [syncing, setSyncing] = useState(false);
  const [syncedItems, setSyncedItems] = useState(null); // null = use local store

  // If authenticated, load favorites from backend to stay in sync
  useEffect(() => {
    if (!isAuthenticated) return;
    setSyncing(true);
    favoriteService.getAll()
      .then(({ data }) => {
        const products = (data.data || [])
          .map((f) => f.product)
          .filter(Boolean);
        setSyncedItems(products);
      })
      .catch(() => {})
      .finally(() => setSyncing(false));
  }, [isAuthenticated]);

  // Use backend data when available, otherwise fall back to local
  const displayItems = syncedItems !== null ? syncedItems : items;

  return (
    <AppLayout hideFooter>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="section-title">My Wishlist</h1>
          <p className="text-brand-muted text-sm mt-1">
            {syncing ? (
              <span className="flex items-center gap-1.5">
                <Loader size={12} className="animate-spin" /> Syncing…
              </span>
              ) : (
                `${displayItems.length} saved item${displayItems.length !== 1 ? 's' : ''}`
              )}
            </p>
          </div>
          {displayItems.length > 0 && !isAuthenticated && (
            <button
              onClick={clear}
              className="text-sm text-red-400 hover:text-red-600 hover:underline transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {syncing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton rounded-3xl h-72" />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            message="Tap the heart icon on any dish to save it here for later."
            actionLabel="Browse Food"
            actionTo="/products"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayItems.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
    </AppLayout>
  );
}
