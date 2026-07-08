import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { productService } from '../../services/productService';
import ProductCard from '../common/ProductCard';

export default function HomeRecommendations() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService
      .getAll({ sort: 'rating', limit: 12 })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const picks = useMemo(() => products.slice(0, 8), [products]);

  return (
    <section className="py-10 bg-white">
      <div className="page-container">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold bg-primary/10 text-primary rounded-full px-3 py-1 mb-3">
            <Sparkles size={13} />
            For You
          </div>
          <h2 className="font-poppins font-bold text-2xl text-brand-dark">Recommended for your cravings</h2>
          <p className="text-sm text-brand-muted mt-1">Personalized picks based on what customers love right now.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton rounded-3xl h-72" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {picks.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
