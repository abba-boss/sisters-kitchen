import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock3, ChevronRight, Star, Plus } from 'lucide-react';
import { productService } from '../../services/productService';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/formatters';

const CLOSING_SOON_KEYWORDS = ['hour', 'min', 'soon', 'closing'];

function isLikelyClosingSoon(product) {
  const prep = (product.preparationTime || '').toLowerCase();
  return CLOSING_SOON_KEYWORDS.some((k) => prep.includes(k));
}

export default function HomeClosingSoon() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    productService
      .getAll({ sort: 'popular', limit: 20 })
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const closingSoon = useMemo(() => {
    const base = products.filter(isLikelyClosingSoon);
    return (base.length ? base : products).slice(0, 6);
  }, [products]);

  return (
    <section className="py-9 bg-white">
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-poppins font-bold text-2xl text-brand-dark">Closing Soon</h2>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                <Clock3 size={12} /> Hurry
              </span>
            </div>
            <p className="text-sm text-brand-muted mt-1">Order before kitchens close for the day.</p>
          </div>
          <Link to="/products?sort=popular" className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton rounded-3xl h-56" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {closingSoon.map((p, i) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="rounded-3xl bg-brand-bg border border-orange-100 overflow-hidden hover:shadow-card transition-all"
              >
                <button className="w-full text-left" onClick={() => navigate(`/products/${p.id}`)}>
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300'}
                    alt={p.name}
                    className="w-full h-28 object-cover"
                  />
                </button>
                <div className="p-3">
                  <p className="text-[11px] text-brand-muted truncate">{p.vendor?.businessName}</p>
                  <h3 className="text-sm font-semibold text-brand-dark line-clamp-1">{p.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="font-poppins font-bold text-sm text-brand-dark">{formatPrice(Number(p.discountPrice) || Number(p.price))}</p>
                      <p className="text-[11px] text-brand-muted flex items-center gap-1">
                        <Star size={10} className="text-primary" fill="#FF7A59" />
                        {Number(p.rating || 0).toFixed(1)}
                      </p>
                    </div>
                    <button
                      onClick={() => addToCart(p)}
                      className="w-8 h-8 rounded-full bg-primary text-white inline-flex items-center justify-center hover:bg-primary-dark transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
