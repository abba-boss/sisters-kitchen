import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import ProductCard from '../../components/common/ProductCard';
import EmptyState from '../../components/common/EmptyState';
import { useWishlistStore } from '../../store/wishlistStore';

export default function WishlistPage() {
  const { items, clear } = useWishlistStore();

  return (
    <MainLayout>
      <div className="page-container page-shell">
        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title">My Wishlist ({items.length})</h1>
          {items.length > 0 && (
            <button onClick={clear} className="text-sm text-red-500 hover:underline">Clear all</button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState icon={Heart} title="Your wishlist is empty" message="Save your favourite dishes here to order later!" actionLabel="Browse Food" actionTo="/products" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
