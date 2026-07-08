import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Flame, Clock, Star, Plus, Timer } from 'lucide-react';
import { productService } from '../../services/productService';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/formatters';

// Live countdown timer
function Countdown({ endsAt }) {
  const [left, setLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = endsAt - Date.now();
      if (diff <= 0) { setLeft('00:00:00'); return; }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setLeft(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return <span>{left}</span>;
}

export default function HomeFreshToday() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Midnight tonight as the "fresh window" end
  const tonight = new Date(); tonight.setHours(23, 59, 59, 0);

  useEffect(() => {
    productService.getFreshToday()
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-8 bg-[#FFF6EE]">
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-poppins font-bold text-xl text-brand-dark">Today's Freshly Made</h2>
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">Fresh</span>
            </div>
            <p className="text-brand-muted text-xs mt-0.5 flex items-center gap-1">
              <Timer size={11} className="text-primary" />
              Closes in&nbsp;<strong className="text-primary font-mono text-xs"><Countdown endsAt={tonight.getTime()} /></strong>
            </p>
          </div>
          <Link to="/products?sort=fresh" className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
            See all <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton rounded-3xl h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 8).map((product, i) => (
              <FreshCard
                key={product.id}
                product={product}
                index={i}
                endsAt={tonight.getTime()}
                onAdd={() => addToCart(product)}
                onClick={() => navigate(`/products/${product.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FreshCard({ product, index, endsAt, onAdd, onClick }) {
  const price   = Number(product.discountPrice) || Number(product.price);
  const pctOff  = product.discountPrice
    ? Math.round(((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer group"
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '1' }}>
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'; }}
        />
        {/* Timer overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent px-3 pt-2.5 pb-4">
          <div className="flex items-center gap-1 text-white text-xs font-mono font-bold">
            <Timer size={10} />
            Closes in <Countdown endsAt={endsAt} />
          </div>
        </div>
        {/* Discount badge */}
        {pctOff > 0 && (
          <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{pctOff}%
          </span>
        )}
        {/* Fresh badge */}
        {product.isFreshToday && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
            <Flame size={10} /> Fresh
          </span>
        )}
        {/* Stock badge */}
        {product.stock > 0 && product.stock <= 10 && (
          <span className="absolute bottom-2 right-2 bg-yellow-400 text-brand-dark text-xs font-bold px-2 py-0.5 rounded-full">
            {product.stock} left
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-brand-muted truncate mb-0.5">{product.vendor?.businessName}</p>
        <h3 className="text-sm font-semibold text-brand-dark line-clamp-1 mb-2">{product.name}</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-poppins font-bold text-brand-dark text-sm">{formatPrice(price)}</p>
            <div className="flex items-center gap-1 text-xs text-brand-muted">
              <Star size={10} fill="#FF7A59" className="text-primary" />
              <span>{Number(product.rating||0).toFixed(1)}</span>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-all shadow-soft"
          >
            <Plus size={15} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
