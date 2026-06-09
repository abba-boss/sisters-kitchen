import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Flame } from 'lucide-react';
import { productService } from '../../services/productService';
import ProductCard from '../common/ProductCard';
import { ProductSkeleton } from '../common/LoadingSkeleton';

export default function FeaturedProducts() {
  const [featured, setFeatured] = useState([]);
  const [fresh, setFresh] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('featured');

  useEffect(() => {
    Promise.all([productService.getFeatured(), productService.getFreshToday()])
      .then(([f, ft]) => {
        setFeatured(f.data.data || []);
        setFresh(ft.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const products = tab === 'featured' ? featured : fresh;

  return (
    <section className="page-container py-14">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="section-title mb-1">Popular Picks</h2>
          <p className="text-brand-muted text-sm">Loved by thousands of customers</p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-2xl p-1 shadow-card">
          <button
            onClick={() => setTab('featured')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === 'featured' ? 'bg-primary text-white shadow-soft' : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            Featured
          </button>
          <button
            onClick={() => setTab('fresh')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === 'fresh' ? 'bg-primary text-white shadow-soft' : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            <Flame size={14} /> Fresh Today
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/products" className="btn-secondary inline-flex items-center gap-2">
              View All Products <ChevronRight size={16} />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
